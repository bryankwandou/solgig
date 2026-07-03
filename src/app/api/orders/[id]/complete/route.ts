import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/current-user";
import { releaseEscrow } from "@/lib/solana/escrow";

export const runtime = "nodejs";

// POST /api/orders/[id]/complete — the buyer accepts delivered work on a
// paid service order. Escrowed funds are released to the seller first;
// only a successful payout closes the order.
export async function POST(
  _req: NextRequest,
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

  // Claim the order first (paid -> releasing) so a double-click or a
  // concurrent request can never trigger two payouts.
  const claimed = (await sql`
    UPDATE orders
    SET status = 'releasing'
    WHERE id = ${id} AND buyer_id = ${user.id}
      AND order_type = 'service' AND status = 'paid'
    RETURNING id, service_id, seller_id, seller_wallet,
              amount_lamports, platform_fee_lamports, escrow
  `) as {
    service_id: string | null;
    seller_id: string;
    seller_wallet: string;
    amount_lamports: number;
    platform_fee_lamports: number;
    escrow: boolean;
  }[];
  const order = claimed[0];
  if (!order) {
    return NextResponse.json(
      { error: { code: "not_found", message: "No paid service order found for you here." } },
      { status: 404 },
    );
  }

  let payoutSignature: string | null = null;
  if (order.escrow) {
    try {
      payoutSignature = await releaseEscrow({
        seller: order.seller_wallet,
        amountLamports: order.amount_lamports,
        feeLamports: order.platform_fee_lamports,
      });
    } catch {
      // Put the order back so the buyer can retry the release.
      await sql`
        UPDATE orders SET status = 'paid' WHERE id = ${id} AND status = 'releasing'
      `;
      return NextResponse.json(
        { error: { code: "payout_failed", message: "The escrow payout did not go through. Try again in a moment." } },
        { status: 502 },
      );
    }
  }

  await sql`
    UPDATE orders
    SET status = 'completed', completed_at = NOW(),
        payout_tx_signature = ${payoutSignature}
    WHERE id = ${id} AND status = 'releasing'
  `;

  if (order.service_id) {
    await sql`
      UPDATE services SET total_orders = total_orders + 1 WHERE id = ${order.service_id}
    `;
  }
  await sql`
    UPDATE users
    SET total_earned_lamports = total_earned_lamports + ${order.amount_lamports},
        completed_orders = completed_orders + 1
    WHERE id = ${order.seller_id}
  `;

  return NextResponse.json({ ok: true, status: "completed", payoutSignature });
}
