import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { sql } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/current-user";
import { lamportsToNumber, orderSplit, treasuryAddress } from "@/lib/fees";
import { readUuidParam, unauthorized } from "@/lib/http";
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
  if (!user) return unauthorized();
  const { id, error } = await readUuidParam(params, "id", "Order not found.");
  if (error) return error;
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
    amount_lamports: string | number;
    platform_fee_lamports: string | number | null;
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
  const treasury = treasuryAddress();
  const payTo = escrowAddress ?? order.seller_wallet;
  // BigInt split from the shared helper; verifyPayment takes plain numbers.
  const split = orderSplit(order);
  const amount = lamportsToNumber(split.gross);
  const platformFee = lamportsToNumber(split.fee);
  const sellerMin = escrowAddress ? amount : lamportsToNumber(split.sellerNet);
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
            ${payTo}, ${split.gross.toString()})
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

  // The status flip and the counters are one statement (data-modifying
  // CTEs), so they commit or fail together. Only the confirm that actually
  // flips pending forward (`upd` returns a row) bumps the counters, so
  // concurrent retries stay idempotent. The seller is credited the net.
  const credit = nextStatus === "completed" && !!order.product_id;
  await sql`
    WITH upd AS (
      UPDATE orders
      SET status = ${nextStatus}, payment_tx_signature = ${parsed.data.signature},
          paid_at = NOW(),
          completed_at = CASE WHEN ${nextStatus} = 'completed' THEN NOW() ELSE NULL END
      WHERE id = ${id} AND status = 'pending'
      RETURNING id
    ),
    prod AS (
      UPDATE products SET total_purchases = total_purchases + 1
      WHERE ${credit}::boolean AND id = ${order.product_id}
        AND EXISTS (SELECT 1 FROM upd)
      RETURNING id
    ),
    seller AS (
      UPDATE users
      SET total_earned_lamports = total_earned_lamports + ${split.sellerNet.toString()}::bigint,
          completed_orders = completed_orders + 1
      WHERE ${credit}::boolean AND id = ${order.seller_id}
        AND EXISTS (SELECT 1 FROM upd)
      RETURNING id
    )
    SELECT id FROM upd
  `;

  return NextResponse.json({ ok: true, status: nextStatus });
}
