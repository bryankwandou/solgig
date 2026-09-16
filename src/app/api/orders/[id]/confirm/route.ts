import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { sql } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/current-user";
import { verifyPayment } from "@/lib/solana/pay";
import { getEscrowAddress } from "@/lib/solana/escrow";

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
           platform_fee_lamports, product_id, service_id, order_type,
           seller_id, status, escrow, created_at
    FROM orders WHERE id = ${id}
  `) as {
    created_at: string;
    buyer_id: string;
    seller_wallet: string;
    buyer_wallet: string;
    amount_lamports: number;
    platform_fee_lamports: number;
    product_id: string | null;
    service_id: string | null;
    order_type: string;
    seller_id: string;
    status: string;
    escrow: boolean;
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

  // Escrow orders pay the platform escrow wallet in full; direct orders
  // pay the seller with the fee split off to the treasury.
  const escrowAddress = order.escrow ? getEscrowAddress() : null;
  if (order.escrow && !escrowAddress) {
    return NextResponse.json(
      { error: { code: "escrow_unavailable", message: "Escrow is not configured on this server." } },
      { status: 500 },
    );
  }
  const treasury = process.env.NEXT_PUBLIC_PLATFORM_TREASURY || null;
  const payTo = escrowAddress ?? order.seller_wallet;
  // BIGINT columns arrive as strings from the driver; without Number() the
  // additions inside verifyPayment silently concatenate and reject everyone.
  const amount = Number(order.amount_lamports);
  const platformFee = Number(order.platform_fee_lamports);
  const sellerMin = escrowAddress ? amount : amount - platformFee;
  const check = await verifyPayment({
    signature: parsed.data.signature,
    buyer: order.buyer_wallet,
    seller: payTo,
    sellerMinLamports: sellerMin,
    treasury: escrowAddress ? null : treasury,
    feeLamports: escrowAddress ? 0 : platformFee,
    // Two minutes of slack for clock drift between the database and the chain.
    notBefore: Math.floor(new Date(order.created_at).getTime() / 1000) - 120,
  });
  if (!check.ok) {
    return NextResponse.json(
      { error: { code: "unverified", message: `Payment could not be verified (${check.reason}).` } },
      { status: 400 },
    );
  }

  // A signature pays for exactly one order. The unique constraint on
  // transactions.signature is the arbiter; if it already belongs to a
  // different order, this confirm is a replay and gets rejected.
  const inserted = await sql`
    INSERT INTO transactions (signature, order_id, from_address, to_address, amount_lamports)
    VALUES (${parsed.data.signature}, ${id}, ${order.buyer_wallet},
            ${payTo}, ${order.amount_lamports})
    ON CONFLICT (signature) DO NOTHING
    RETURNING id
  `;
  if (inserted.length === 0) {
    const owner = (await sql`
      SELECT order_id FROM transactions WHERE signature = ${parsed.data.signature}
    `) as { order_id: string | null }[];
    if (owner[0]?.order_id !== id) {
      return NextResponse.json(
        { error: { code: "signature_used", message: "That payment already covers another order." } },
        { status: 409 },
      );
    }
  }

  // Digital goods complete the moment payment lands; service orders sit
  // at 'paid' until the buyer accepts the delivered work.
  const nextStatus = order.order_type === "service" ? "paid" : "completed";

  // Guarded update: only the confirm that flips pending forward gets to
  // bump the counters, so concurrent retries stay idempotent.
  const updated = await sql`
    UPDATE orders
    SET status = ${nextStatus}, payment_tx_signature = ${parsed.data.signature},
        paid_at = NOW(),
        completed_at = CASE WHEN ${nextStatus} = 'completed' THEN NOW() ELSE NULL END
    WHERE id = ${id} AND status = 'pending'
    RETURNING id
  `;
  if (updated.length > 0 && nextStatus === "completed" && order.product_id) {
    await sql`
      UPDATE products SET total_purchases = total_purchases + 1 WHERE id = ${order.product_id}
    `;
    // The seller is credited what actually reached them. The platform fee
    // went to the treasury, so counting the gross here would overstate every
    // seller's lifetime earnings by the fee on every sale.
    await sql`
      UPDATE users
      SET total_earned_lamports = total_earned_lamports + ${amount - platformFee},
          completed_orders = completed_orders + 1
      WHERE id = ${order.seller_id}
    `;
  }

  return NextResponse.json({ ok: true, status: nextStatus });
}
