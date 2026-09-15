import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/current-user";
import {
  releaseEscrow,
  payoutStatus,
  PayoutInFlightError,
} from "@/lib/solana/escrow";

export const runtime = "nodejs";

// A signed payout's blockhash stays valid for about 150 blocks, roughly a
// minute. Past this window an unconfirmed payout can never land, so a retry
// cannot pay the seller twice.
const STALE_PAYOUT = "3 minutes";

const releasing = () =>
  NextResponse.json(
    {
      ok: true,
      status: "releasing",
      message: "The payout is on its way to the seller. Check back in a few minutes.",
    },
    { status: 202 },
  );

// POST /api/orders/[id]/complete — the buyer accepts delivered work on a
// paid service order. Escrowed funds are released to the seller first;
// only a confirmed payout closes the order.
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

  // Claim the order so a double-click or a concurrent request can never
  // start two payouts. An order already 'releasing' is only reclaimable
  // once its last payout attempt has gone stale.
  const claimed = (await sql`
    UPDATE orders
    SET status = 'releasing', payout_started_at = NOW()
    WHERE id = ${id} AND buyer_id = ${user.id} AND order_type = 'service'
      AND (status = 'paid'
           OR (status = 'releasing'
               AND payout_started_at < NOW() - ${STALE_PAYOUT}::interval))
    RETURNING service_id, seller_id, seller_wallet, amount_lamports,
              platform_fee_lamports, escrow, payout_tx_signature
  `) as {
    service_id: string | null;
    seller_id: string;
    seller_wallet: string;
    amount_lamports: number;
    platform_fee_lamports: number;
    escrow: boolean;
    payout_tx_signature: string | null;
  }[];
  const order = claimed[0];
  if (!order) {
    const current = (await sql`
      SELECT status FROM orders WHERE id = ${id} AND buyer_id = ${user.id}
    `) as { status: string }[];
    if (current[0]?.status === "releasing") return releasing();
    if (current[0]?.status === "completed") {
      return NextResponse.json({ ok: true, status: "completed" });
    }
    return NextResponse.json(
      { error: { code: "not_found", message: "No paid service order found for you here." } },
      { status: 404 },
    );
  }

  let payoutSignature: string | null = null;
  if (order.escrow) {
    try {
      // An earlier attempt may have landed after its request timed out.
      const prior = order.payout_tx_signature
        ? await payoutStatus(order.payout_tx_signature)
        : null;
      if (prior === "landed") {
        payoutSignature = order.payout_tx_signature;
      } else {
        // BIGINT columns arrive as strings from the driver; coerce before math.
        payoutSignature = await releaseEscrow({
          seller: order.seller_wallet,
          amountLamports: Number(order.amount_lamports),
          feeLamports: Number(order.platform_fee_lamports),
          onSigned: async (signature) => {
            await sql`
              UPDATE orders SET payout_tx_signature = ${signature} WHERE id = ${id}
            `;
          },
        });
      }
    } catch (err) {
      if (err instanceof PayoutInFlightError) {
        // Signed and maybe sent. Leave the order in 'releasing' so it can't
        // be paid twice; the next attempt after it goes stale sorts it out.
        return releasing();
      }
      // Nothing was signed, so nothing moved. Hand the order back.
      await sql`
        UPDATE orders SET status = 'paid' WHERE id = ${id} AND status = 'releasing'
      `;
      return NextResponse.json(
        { error: { code: "payout_failed", message: "The escrow payout did not go through. Try again in a moment." } },
        { status: 502 },
      );
    }
  }

  const done = await sql`
    UPDATE orders
    SET status = 'completed', completed_at = NOW(),
        payout_tx_signature = ${payoutSignature}
    WHERE id = ${id} AND status = 'releasing'
    RETURNING id
  `;
  if (done.length > 0) {
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
  }

  return NextResponse.json({ ok: true, status: "completed", payoutSignature });
}
