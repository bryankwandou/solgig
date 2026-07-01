import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { sql } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/current-user";
import { verifyPayment } from "@/lib/solana/pay";

export const runtime = "nodejs";

const Confirm = z.object({ signature: z.string().min(32) });

// POST /api/orders/[id]/confirm — verify the payment landed on-chain, then
// mark the order paid. The chain is the source of truth, not the client.
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { error: { code: "unauthorized", message: "Connect a wallet first." } },
      { status: 401 },
    );
  }
  const { id } = await params;
  const parsed = Confirm.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json(
      { error: { code: "invalid", message: "A transaction signature is required." } },
      { status: 422 },
    );
  }

  const rows = (await sql`
    SELECT id, buyer_id, seller_wallet, buyer_wallet, amount_lamports,
           platform_fee_lamports, product_id, seller_id, status
    FROM orders WHERE id = ${id}
  `) as {
    buyer_id: string;
    seller_wallet: string;
    buyer_wallet: string;
    amount_lamports: number;
    platform_fee_lamports: number;
    product_id: string;
    seller_id: string;
    status: string;
  }[];
  const order = rows[0];
  if (!order || order.buyer_id !== user.id) {
    return NextResponse.json(
      { error: { code: "not_found", message: "Order not found." } },
      { status: 404 },
    );
  }
  if (order.status === "paid" || order.status === "completed") {
    return NextResponse.json({ ok: true, status: order.status });
  }

  const sellerMin = order.amount_lamports - order.platform_fee_lamports;
  const check = await verifyPayment({
    signature: parsed.data.signature,
    buyer: order.buyer_wallet,
    seller: order.seller_wallet,
    minLamports: sellerMin,
  });
  if (!check.ok) {
    return NextResponse.json(
      { error: { code: "unverified", message: `Payment could not be verified (${check.reason}).` } },
      { status: 400 },
    );
  }

  // Record the transaction, mark paid, and update counters.
  await sql`
    INSERT INTO transactions (signature, order_id, from_address, to_address, amount_lamports)
    VALUES (${parsed.data.signature}, ${id}, ${order.buyer_wallet},
            ${order.seller_wallet}, ${order.amount_lamports})
    ON CONFLICT (signature) DO NOTHING
  `;
  await sql`
    UPDATE orders
    SET status = 'completed', payment_tx_signature = ${parsed.data.signature},
        paid_at = NOW(), completed_at = NOW()
    WHERE id = ${id}
  `;
  await sql`
    UPDATE products SET total_purchases = total_purchases + 1 WHERE id = ${order.product_id}
  `;
  await sql`
    UPDATE users
    SET total_earned_lamports = total_earned_lamports + ${order.amount_lamports},
        completed_orders = completed_orders + 1
    WHERE id = ${order.seller_id}
  `;

  return NextResponse.json({ ok: true, status: "completed" });
}
