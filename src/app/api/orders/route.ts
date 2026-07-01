import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { sql } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/current-user";

export const runtime = "nodejs";

const CreateOrder = z.object({
  productId: z.string().uuid(),
});

// POST /api/orders — open a pending order and return what the client needs
// to build the on-chain payment. Nothing is marked paid here.
export async function POST(req: NextRequest) {
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

  const prod = (await sql`
    SELECT p.id, p.title, p.price_lamports, p.seller_id,
           u.wallet_address AS seller_wallet
    FROM products p JOIN users u ON u.id = p.seller_id
    WHERE p.id = ${parsed.data.productId} AND p.is_published = true
  `) as {
    id: string;
    price_lamports: number;
    seller_id: string;
    seller_wallet: string;
  }[];
  const product = prod[0];
  if (!product) {
    return NextResponse.json(
      { error: { code: "not_found", message: "That product is not available." } },
      { status: 404 },
    );
  }
  if (product.seller_id === user.id) {
    return NextResponse.json(
      { error: { code: "own_product", message: "You cannot buy your own listing." } },
      { status: 400 },
    );
  }

  const feeBps = Number(process.env.NEXT_PUBLIC_PLATFORM_FEE_BPS ?? 250);
  const treasury = process.env.NEXT_PUBLIC_PLATFORM_TREASURY || null;
  const fee = treasury ? Math.floor((product.price_lamports * feeBps) / 10000) : 0;

  const orderNumber = (
    await sql`SELECT 'SG-2026-' || LPAD(nextval('order_seq')::text, 6, '0') AS n`
  )[0].n as string;

  const rows = await sql`
    INSERT INTO orders
      (order_number, order_type, buyer_id, seller_id, product_id,
       amount_lamports, platform_fee_lamports, buyer_wallet, seller_wallet, status)
    VALUES
      (${orderNumber}, 'product', ${user.id}, ${product.seller_id}, ${product.id},
       ${product.price_lamports}, ${fee}, ${user.wallet_address},
       ${product.seller_wallet}, 'pending')
    RETURNING id, order_number
  `;

  return NextResponse.json({
    order: rows[0],
    payment: {
      sellerWallet: product.seller_wallet,
      amountLamports: product.price_lamports,
      feeLamports: fee,
      treasury,
    },
  });
}
