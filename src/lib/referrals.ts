// Referral commissions: the server side of the Commish integration.
//
// This server is the attestor of every seller's campaign. It records a
// commission when a referred order completes, and releases it once the
// refund window has passed. Both are signed and paid for by the attestor
// key; the rent of each commission record comes back to it on release.
//
// Nothing here can block an order: a failure is stored on the order
// (commission_status = 'failed') and the sale itself stands.

import { PublicKey, Transaction } from "@solana/web3.js";
import { sql } from "@/lib/db";
import { getConnection } from "@/lib/solana/pay";
import {
  COMMISH_ERRORS,
  COMMISH_TREASURY,
  COMMISSION_LEN,
  commishEnabled,
  commishErrorCode,
  commissionFor,
  createAtaIx,
  decodeCampaign,
  decodeCommission,
  orderHash,
  recordSaleIx,
  releaseIx,
} from "@/lib/solana/commish";

type Result = { ok: true; status: string; signature?: string } | { ok: false; reason: string };

function reason(e: unknown): string {
  const code = commishErrorCode(e);
  if (code !== null) return COMMISH_ERRORS[code] ?? `Commish error ${code}`;
  return e instanceof Error ? e.message.slice(0, 200) : "unknown error";
}

/**
 * Reserve the referrer's commission for a completed order. Idempotent: only
 * the call that claims the order (status NULL -> 'recording') sends anything,
 * and the commission's address is derived from the order, so the same order
 * can never be recorded twice on chain either.
 */
export async function recordReferral(orderId: string): Promise<Result> {
  const commish = commishEnabled();
  if (!commish) return { ok: false, reason: "referrals are off" };

  const claimed = (await sql`
    UPDATE orders o SET commission_status = 'recording'
    FROM affiliate_campaigns c, users r
    WHERE o.id = ${orderId} AND o.status = 'completed'
      AND o.referrer_id IS NOT NULL AND o.commission_status IS NULL
      AND c.seller_id = o.seller_id AND r.id = o.referrer_id
    RETURNING o.amount_lamports, c.campaign_address, r.wallet_address AS referrer_wallet
  `) as { amount_lamports: string | number; campaign_address: string; referrer_wallet: string }[];
  const row = claimed[0];
  if (!row) return { ok: false, reason: "nothing to record" };

  const { program, attestor } = commish;
  const connection = getConnection();
  try {
    const campaign = new PublicKey(row.campaign_address);
    const info = await connection.getAccountInfo(campaign);
    const c = info && info.owner.equals(program) ? decodeCampaign(info.data) : null;
    if (!c) throw new Error("the seller's campaign is gone");
    const orderLamports = BigInt(row.amount_lamports);
    const amount = commissionFor(orderLamports, c.bps);

    const { commission, instruction } = recordSaleIx({
      program,
      attestor: attestor.publicKey,
      campaign,
      vault: new PublicKey(c.vault),
      orderHash: orderHash(attestor, campaign, orderId),
      orderLamports,
      creator: new PublicKey(row.referrer_wallet),
      lamports: await connection.getMinimumBalanceForRentExemption(COMMISSION_LEN),
    });
    const signature = await sendAsAttestor([instruction]);
    const releaseAt = Math.floor(Date.now() / 1000) + Number(c.holdSeconds);
    await sql`
      UPDATE orders SET commission_status = 'recorded', commission_address = ${commission.toBase58()},
        commission_lamports = ${amount.toString()}, commission_tx = ${signature},
        commission_release_at = to_timestamp(${releaseAt})
      WHERE id = ${orderId}
    `;
    return { ok: true, status: "recorded", signature };
  } catch (e) {
    const why = reason(e);
    await sql`UPDATE orders SET commission_status = 'failed' WHERE id = ${orderId} AND commission_status = 'recording'`;
    console.error(`[referrals] record ${orderId}: ${why}`);
    return { ok: false, reason: why };
  }
}

/**
 * Pay out a recorded commission whose refund window has passed. Anyone may
 * trigger it (the program is permissionless here); the money only ever goes
 * to the payee written on chain.
 */
export async function releaseReferral(orderId: string): Promise<Result> {
  const commish = commishEnabled();
  if (!commish) return { ok: false, reason: "referrals are off" };
  const rows = (await sql`
    SELECT o.commission_address, o.commission_status, c.campaign_address
    FROM orders o JOIN affiliate_campaigns c ON c.seller_id = o.seller_id
    WHERE o.id = ${orderId}
  `) as { commission_address: string | null; commission_status: string | null; campaign_address: string }[];
  const row = rows[0];
  if (!row?.commission_address || row.commission_status !== "recorded") return { ok: false, reason: "nothing to release" };

  const { program, attestor } = commish;
  const connection = getConnection();
  const commission = new PublicKey(row.commission_address);
  const info = await connection.getAccountInfo(commission);
  if (!info) {
    // Already closed on chain: someone else released it.
    await sql`UPDATE orders SET commission_status = 'released' WHERE id = ${orderId} AND commission_status = 'recorded'`;
    return { ok: true, status: "released" };
  }
  const m = decodeCommission(info.data);
  if (!m) return { ok: false, reason: "not a commission record" };
  if (BigInt(Math.floor(Date.now() / 1000)) < m.releaseAt) return { ok: false, reason: COMMISH_ERRORS[6011] };

  const campaign = new PublicKey(row.campaign_address);
  const cinfo = await connection.getAccountInfo(campaign);
  const c = cinfo ? decodeCampaign(cinfo.data) : null;
  if (!c) return { ok: false, reason: "the seller's campaign is gone" };
  const payee = new PublicKey(m.payee);
  try {
    const signature = await sendAsAttestor([
      // Wrapped-SOL accounts for the payee and Commish's treasury, if missing.
      createAtaIx(attestor.publicKey, payee),
      createAtaIx(attestor.publicKey, COMMISH_TREASURY),
      releaseIx({ program, campaign, vault: new PublicKey(c.vault), commission, payee, rentPayer: new PublicKey(m.rentPayer) }),
    ]);
    await sql`
      UPDATE orders SET commission_status = 'released', commission_tx = ${signature}
      WHERE id = ${orderId} AND commission_status = 'recorded'
    `;
    return { ok: true, status: "released", signature };
  } catch (e) {
    return { ok: false, reason: reason(e) };
  }
}

async function sendAsAttestor(ixs: Parameters<Transaction["add"]>): Promise<string> {
  const commish = commishEnabled()!;
  const connection = getConnection();
  const latest = await connection.getLatestBlockhash("confirmed");
  const tx = new Transaction({ feePayer: commish.attestor.publicKey, ...latest }).add(...ixs);
  tx.sign(commish.attestor);
  const raw = tx.serialize();
  const signature = await connection.sendRawTransaction(raw);
  // Poll over HTTP: confirmTransaction subscribes over a websocket, and the
  // `ws` package breaks inside Next's server bundle (bufferUtil.mask).
  while ((await connection.getBlockHeight("confirmed")) <= latest.lastValidBlockHeight) {
    const { value } = await connection.getSignatureStatuses([signature]);
    const s = value[0];
    if (s?.err) throw new Error(JSON.stringify(s.err));
    if (s?.confirmationStatus === "confirmed" || s?.confirmationStatus === "finalized") return signature;
    await connection.sendRawTransaction(raw, { skipPreflight: true }).catch(() => {});
    await new Promise((r) => setTimeout(r, 1_500));
  }
  throw new Error("transaction expired before it confirmed");
}

/** The referrer to credit for an order, from a `ref` (username or wallet): never the buyer or the seller. */
export async function referrerFor(ref: string | undefined, buyerId: string, sellerId: string): Promise<string | null> {
  if (!ref || !commishEnabled()) return null;
  const rows = (await sql`
    SELECT u.id FROM users u
    WHERE (lower(u.username) = lower(${ref}) OR u.wallet_address = ${ref})
      AND u.id <> ${buyerId} AND u.id <> ${sellerId}
      AND EXISTS (SELECT 1 FROM affiliate_campaigns c WHERE c.seller_id = ${sellerId})
  `) as { id: string }[];
  return rows[0]?.id ?? null;
}
