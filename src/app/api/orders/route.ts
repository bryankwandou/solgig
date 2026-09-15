import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { sql } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/current-user";
import { rateLimit } from "@/lib/rate-limit";
import { getEscrowAddress } from "@/lib/solana/escrow";

export const runtime = "nodejs";

const CreateOrder = z
  .object({
    productId: z.string().uuid().optional(),
    serviceId: z.string().uuid().optional(),
  })
  .refine((d) => !!d.productId !== !!d.serviceId, {
    message: "Pick exactly one listing",
  });

// GET /api/orders — the signed-in user's purchases, newest first.
export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { error: { code: "unauthorized", message: "Connect a wallet first." } },
      { status: 401 },
    );
  }
  const items = await sql`
    SELECT o.id, o.order_number, o.order_type, o.status, o.amount_lamports,
           o.payment_tx_signature, o.created_at, o.completed_at,
           p.slug AS product_slug,
           COALESCE(p.title, s.title) AS product_title,
           COALESCE(p.thumbnail_url, s.thumbnail_url) AS product_thumbnail,
           (p.file_url IS NOT NULL) AS has_file,
           u.username AS seller_username, u.display_name AS seller_name,
           u.wallet_address AS seller_wallet
    FROM orders o
    LEFT JOIN products p ON p.id = o.product_id
    LEFT JOIN services s ON s.id = o.service_id
    JOIN users u ON u.id = o.seller_id
    WHERE o.buyer_id = ${user.id}
    ORDER BY o.created_at DESC
    LIMIT 50
  `;
  return NextResponse.json({ items });
}

// POST /api/orders — open a pending order and return what the client needs
// to build the on-chain payment. Nothing is marked paid here.
export async function POST(req: NextRequest) {
  const limited = rateLimit({ req, key: "order", limit: 20, windowMs: 60_000 });
  if (limited) return limited;
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { error: { code: "unauthorized", message: "Connect a wallet first." } },
      { status: 401 },
    );
  }
  const parsed = CreateOrder.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json(
      { error: { code: "invalid", message: "Pick a product to buy." } },
      { status: 422 },
    );
  }

  const isService = !!parsed.data.serviceId;
  const listingRows = (
    isService
      ? await sql`
          SELECT s.id, s.title, s.price_lamports, s.seller_id,
                 u.wallet_address AS seller_wallet
          FROM services s JOIN users u ON u.id = s.seller_id
          WHERE s.id = ${parsed.data.serviceId} AND s.is_published = true
        `
      : await sql`
          SELECT p.id, p.title, p.price_lamports, p.seller_id,
                 u.wallet_address AS seller_wallet
          FROM products p JOIN users u ON u.id = p.seller_id
          WHERE p.id = ${parsed.data.productId} AND p.is_published = true
        `
  ) as {
    id: string;
    price_lamports: number;
    seller_id: string;
    seller_wallet: string;
  }[];
  const listing = listingRows[0];
  if (!listing) {
    return NextResponse.json(
      { error: { code: "not_found", message: "That listing is not available." } },
      { status: 404 },
    );
  }
  if (listing.seller_id === user.id) {
    return NextResponse.json(
      { error: { code: "own_product", message: "You cannot buy your own listing." } },
      { status: 400 },
    );
  }

  const feeBps = Number(process.env.NEXT_PUBLIC_PLATFORM_FEE_BPS ?? 250);
  const treasury = process.env.NEXT_PUBLIC_PLATFORM_TREASURY || null;
  // BIGINT columns arrive as strings from the driver; coerce before math.
  const price = Number(listing.price_lamports);
  const fee = treasury ? Math.floor((price * feeBps) / 10000) : 0;

  // Service orders route through the platform escrow wallet when one is
  // configured; the funds only reach the seller after the buyer accepts.
  const escrowAddress = isService ? getEscrowAddress() : null;
  const useEscrow = !!escrowAddress;

  const orderNumber = (
    await sql`SELECT 'SG-2026-' || LPAD(nextval('order_seq')::text, 6, '0') AS n`
  )[0].n as string;

  const rows = await sql`
    INSERT INTO orders
      (order_number, order_type, buyer_id, seller_id, product_id, service_id,
       amount_lamports, platform_fee_lamports, buyer_wallet, seller_wallet,
       status, escrow)
    VALUES
      (${orderNumber}, ${isService ? "service" : "product"}, ${user.id},
       ${listing.seller_id}, ${isService ? null : listing.id},
       ${isService ? listing.id : null}, ${listing.price_lamports}, ${fee},
       ${user.wallet_address}, ${listing.seller_wallet}, 'pending', ${useEscrow})
    RETURNING id, order_number
  `;

  // `transfers` is the exact list a client must put in one transaction.
  // amountLamports is the total the buyer spends, fee included.
  return NextResponse.json({
    order: rows[0],
    payment: useEscrow
      ? {
          // The whole amount goes to escrow in one transfer; the fee split
          // happens at release time.
          escrow: true,
          payTo: escrowAddress,
          amountLamports: price,
          sellerLamports: price,
          feeLamports: 0,
          treasury: null,
          transfers: [{ to: escrowAddress, lamports: price }],
        }
      : {
          escrow: false,
          payTo: listing.seller_wallet,
          sellerWallet: listing.seller_wallet,
          amountLamports: price,
          sellerLamports: price - fee,
          feeLamports: fee,
          treasury,
          transfers: [
            { to: listing.seller_wallet, lamports: price - fee },
            ...(treasury && fee > 0 ? [{ to: treasury, lamports: fee }] : []),
          ],
        },
  });
}
