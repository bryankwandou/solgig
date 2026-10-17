import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/current-user";
import { apiError, readUuidParam, unauthorized } from "@/lib/http";

export const runtime = "nodejs";

// GET /api/orders/[id] — one order, for its buyer, seller or referrer.
// Includes the referral commission state so an agent can tell when the
// refund window closes and whether the commission was paid.
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  const { id, error } = await readUuidParam(params, "id", "No order of yours here.");
  if (error) return error;

  const rows = (await sql`
    SELECT o.id, o.order_number, o.order_type, o.status, o.amount_lamports,
           o.settlement, o.buyer_wallet, o.seller_wallet, o.payment_tx_signature,
           o.created_at, o.completed_at, o.buyer_id, o.seller_id, o.referrer_id,
           r.wallet_address AS referrer_wallet,
           o.commission_status, o.commission_lamports, o.commission_address,
           o.commission_tx, o.commission_release_at
    FROM orders o
    LEFT JOIN users r ON r.id = o.referrer_id
    WHERE o.id = ${id}
  `) as Record<string, unknown>[];
  const o = rows[0];
  if (!o || ![o.buyer_id, o.seller_id, o.referrer_id].includes(user.id)) {
    return apiError(404, "not_found", "No order of yours here.");
  }

  const releaseAt = o.commission_release_at ? new Date(o.commission_release_at as string) : null;
  return NextResponse.json({
    order: {
      id: o.id,
      order_number: o.order_number,
      order_type: o.order_type,
      status: o.status,
      amount_lamports: Number(o.amount_lamports),
      settlement: o.settlement,
      buyer_wallet: o.buyer_wallet,
      seller_wallet: o.seller_wallet,
      payment_tx_signature: o.payment_tx_signature,
      created_at: o.created_at,
      completed_at: o.completed_at,
    },
    referral: o.referrer_id
      ? {
          referrer_wallet: o.referrer_wallet,
          // recording | recorded (held) | released (paid) | cancelled (refunded) | failed; null until the order completes
          status: o.commission_status ?? null,
          commission_lamports: o.commission_lamports == null ? null : Number(o.commission_lamports),
          commission_address: o.commission_address ?? null,
          tx: o.commission_tx ?? null,
          release_at: releaseAt?.toISOString() ?? null,
          releasable: o.commission_status === "recorded" && !!releaseAt && releaseAt.getTime() <= Date.now(),
        }
      : null,
  });
}
