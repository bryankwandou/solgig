import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { PublicKey, TransactionInstruction } from "@solana/web3.js";
import { sql } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/current-user";
import { apiError, unauthorized } from "@/lib/http";
import { rateLimit } from "@/lib/rate-limit";
import { getConnection } from "@/lib/solana/pay";
import { toWire } from "@/lib/solana/program";
import {
  CAMPAIGN_LEN,
  MAX_BPS,
  MAX_HOLD_SECONDS,
  TOKEN_PROGRAM,
  WSOL_MINT,
  commishEnabled,
  createAtaIx,
  createCampaignIxs,
  decodeCampaign,
  findAta,
  withdrawIx,
  wrapSolIxs,
} from "@/lib/solana/commish";
import { randomBytes } from "node:crypto";

export const runtime = "nodejs";

const off = () => apiError(404, "referrals_off", "Referral commissions are not enabled on this server.");

async function readCampaign(address: string) {
  const commish = commishEnabled();
  if (!commish) return null;
  const connection = getConnection();
  const info = await connection.getAccountInfo(new PublicKey(address));
  const c = info && info.owner.equals(commish.program) ? decodeCampaign(info.data) : null;
  if (!c) return null;
  const vault = await connection.getTokenAccountBalance(new PublicKey(c.vault)).catch(() => null);
  const balance = BigInt(vault?.value.amount ?? "0");
  return {
    address,
    brand: c.brand,
    attestor: c.attestor,
    vault: c.vault,
    bps: c.bps,
    holdSeconds: Number(c.holdSeconds),
    balanceLamports: balance.toString(),
    reservedLamports: c.reserved.toString(),
    paidLamports: c.paid.toString(),
    availableLamports: (balance - c.reserved).toString(),
  };
}

// GET /api/affiliate — the caller's campaign (as a seller) and the
// commissions they earned (as a referrer).
export async function GET() {
  const commish = commishEnabled();
  if (!commish) return NextResponse.json({ enabled: false });
  const user = await getCurrentUser();
  if (!user) return unauthorized();

  const row = (await sql`
    SELECT campaign_address FROM affiliate_campaigns WHERE seller_id = ${user.id}
  `) as { campaign_address: string }[];
  const campaign = row[0] ? await readCampaign(row[0].campaign_address) : null;

  const earned = await sql`
    SELECT o.id, o.order_number, o.amount_lamports, o.commission_lamports,
           o.commission_status, o.commission_release_at, o.commission_tx,
           COALESCE(p.title, s.title) AS title, p.slug
    FROM orders o
    LEFT JOIN products p ON p.id = o.product_id
    LEFT JOIN services s ON s.id = o.service_id
    WHERE o.referrer_id = ${user.id} AND o.commission_status IS NOT NULL
    ORDER BY o.created_at DESC LIMIT 50
  `;
  const referredSales = await sql`
    SELECT o.order_number, o.amount_lamports, o.commission_lamports, o.commission_status,
           r.username AS referrer_username
    FROM orders o JOIN users r ON r.id = o.referrer_id
    WHERE o.seller_id = ${user.id} AND o.commission_status IS NOT NULL
    ORDER BY o.created_at DESC LIMIT 20
  `;

  return NextResponse.json({
    enabled: true,
    network: process.env.NEXT_PUBLIC_SOLANA_NETWORK ?? "devnet",
    programId: commish.program.toBase58(),
    attestor: commish.attestor.publicKey.toBase58(),
    username: user.username,
    campaign,
    earned,
    referredSales,
  });
}

const Body = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("prepare"),
    bps: z.number().int().min(1).max(MAX_BPS),
    holdSeconds: z.number().int().min(0).max(MAX_HOLD_SECONDS),
    fundLamports: z.number().int().min(0).max(1_000_000_000_000),
  }),
  z.object({ action: z.literal("register"), campaign: z.string().min(32).max(44) }),
  z.object({ action: z.literal("fund"), lamports: z.number().int().min(1).max(1_000_000_000_000) }),
  z.object({ action: z.literal("withdraw"), lamports: z.number().int().min(1) }),
]);

// POST /api/affiliate — builds the seller's campaign transactions (the
// seller signs them in their wallet) and registers a campaign once it is on
// chain. The server never signs for the seller.
export async function POST(req: NextRequest) {
  const limited = rateLimit({ req, key: "affiliate", limit: 20, windowMs: 60_000 });
  if (limited) return limited;
  const commish = commishEnabled();
  if (!commish) return off();
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  const parsed = Body.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return apiError(422, "invalid", "Check the rate, window and amount.");
  const body = parsed.data;
  const seller = new PublicKey(user.wallet_address);
  const wire = (ixs: TransactionInstruction[]) => ixs.map(toWire);

  if (body.action === "prepare") {
    const existing = await sql`SELECT 1 FROM affiliate_campaigns WHERE seller_id = ${user.id}`;
    if (existing.length) return apiError(409, "exists", "You already run a referral campaign.");
    // A random id, so campaign addresses cannot be guessed ahead of time.
    const id = randomBytes(8).readBigUInt64LE();
    const { campaign, vault, instructions } = createCampaignIxs({
      program: commish.program,
      brand: seller,
      attestor: commish.attestor.publicKey,
      id,
      bps: body.bps,
      holdSeconds: BigInt(body.holdSeconds),
      lamports: await getConnection().getMinimumBalanceForRentExemption(CAMPAIGN_LEN),
    });
    const fund = body.fundLamports > 0 ? wrapSolIxs(seller, vault, BigInt(body.fundLamports)) : [];
    return NextResponse.json({ campaign: campaign.toBase58(), instructions: wire([...instructions, ...fund]) });
  }

  if (body.action === "register") {
    const c = await readCampaign(body.campaign);
    // Only a campaign this seller owns, attested by this server, in SOL.
    if (!c || c.brand !== user.wallet_address || c.attestor !== commish.attestor.publicKey.toBase58()) {
      return apiError(400, "not_yours", "That campaign is not on chain yet, or is not yours.");
    }
    const vault = await getConnection().getParsedAccountInfo(new PublicKey(c.vault));
    const mint = (vault.value?.data as { parsed?: { info?: { mint?: string } } })?.parsed?.info?.mint;
    if (mint !== WSOL_MINT.toBase58()) return apiError(400, "wrong_mint", "Campaigns on SolGig pay in SOL.");
    await sql`
      INSERT INTO affiliate_campaigns (seller_id, campaign_address, bps, hold_seconds)
      VALUES (${user.id}, ${body.campaign}, ${c.bps}, ${c.holdSeconds})
      ON CONFLICT (seller_id) DO NOTHING
    `;
    return NextResponse.json({ campaign: c });
  }

  const row = (await sql`
    SELECT campaign_address FROM affiliate_campaigns WHERE seller_id = ${user.id}
  `) as { campaign_address: string }[];
  const c = row[0] ? await readCampaign(row[0].campaign_address) : null;
  if (!c) return apiError(404, "no_campaign", "Open a referral campaign first.");

  if (body.action === "fund") {
    return NextResponse.json({ instructions: wire(wrapSolIxs(seller, new PublicKey(c.vault), BigInt(body.lamports))) });
  }

  // withdraw: take back unreserved budget and unwrap it to plain SOL.
  if (BigInt(body.lamports) > BigInt(c.availableLamports)) {
    return apiError(400, "reserved", "That would touch commissions that are still reserved.");
  }
  const mine = findAta(seller);
  return NextResponse.json({
    instructions: wire([
      createAtaIx(seller, seller),
      withdrawIx({ program: commish.program, brand: seller, campaign: new PublicKey(c.address), vault: new PublicKey(c.vault), amount: BigInt(body.lamports) }),
      // CloseAccount: the wrapped SOL goes back to the wallet as SOL.
      new TransactionInstruction({
        programId: TOKEN_PROGRAM,
        keys: [
          { pubkey: mine, isSigner: false, isWritable: true },
          { pubkey: seller, isSigner: false, isWritable: true },
          { pubkey: seller, isSigner: true, isWritable: false },
        ],
        data: Buffer.from([9]),
      }),
    ]),
  });
}
