import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/current-user";
import { orderSplit } from "@/lib/fees";
import { readUuidParam, unauthorized } from "@/lib/http";
import {
  releaseEscrow,
  payoutStatus,
  PayoutInFlightError,
} from "@/lib/solana/escrow";
import { escrowProgramId } from "@/lib/solana/program";
import { verifyRelease } from "@/lib/solana/settle";

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
//
// Program-settled orders are released by the buyer's own signed Release
// transaction; the body carries its signature and the server only checks
// the chain. Custodial orders are paid out by the server.
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  const { id, error } = await readUuidParam(params, "id", "No paid service order found for you here.");
  if (error) return error;

  const programOrder = (await sql`
    SELECT settlement, buyer_wallet, seller_wallet, amount_lamports,
           platform_fee_lamports, created_at, status
    FROM orders
    WHERE id = ${id} AND buyer_id = ${user.id} AND order_type = 'service'
      AND settlement = 'program'
  `) as {
    buyer_wallet: string;
    seller_wallet: string;
    amount_lamports: string | number;
    platform_fee_lamports: string | number | null;
    created_at: string;
    status: string;
  }[];
  let releaseSignature: string | null = null;
  if (programOrder[0]) {
    const o = programOrder[0];
    if (o.status === "completed") return NextResponse.json({ ok: true, status: "completed" });
    const body = (await req.json().catch(() => ({}))) as { signature?: unknown };
    const program = escrowProgramId();
    if (typeof body.signature !== "string" || body.signature.length < 32 || !program) {
      return NextResponse.json(
        { error: { code: "invalid", message: "Sign the release in your wallet first." } },
        { status: 422 },
      );
    }
    const check = await verifyRelease(program, body.signature, {
      orderId: id,
      buyer: o.buyer_wallet,
      seller: o.seller_wallet,
      sellerNet: orderSplit(o).sellerNet,
      notBefore: Math.floor(new Date(o.created_at).getTime() / 1000) - 120,
    });
    if (!check.ok) {
      return NextResponse.json(
        { error: { code: "unverified", message: `The release could not be verified (${check.reason}).` } },
        { status: 400 },
      );
    }
    releaseSignature = body.signature;
  }

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
    amount_lamports: string | number;
    platform_fee_lamports: string | number | null;
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

  const split = orderSplit(order);
  let payoutSignature: string | null = releaseSignature;
  if (order.escrow && !releaseSignature) {
    try {
      // An earlier attempt may have landed after its request timed out.
      const prior = order.payout_tx_signature
        ? await payoutStatus(order.payout_tx_signature)
        : null;
      if (prior === "landed") {
        payoutSignature = order.payout_tx_signature;
      } else {
        payoutSignature = await releaseEscrow({
          seller: order.seller_wallet,
          split,
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

  // Close the order and bump the counters in one statement so they commit
  // together. Only the request that moves 'releasing' to 'completed' credits
  // the seller, with the net from the same helper confirm uses.
  await sql`
    WITH done AS (
      UPDATE orders
      SET status = 'completed', completed_at = NOW(),
          payout_tx_signature = ${payoutSignature}
      WHERE id = ${id} AND status = 'releasing'
      RETURNING id
    ),
    svc AS (
      UPDATE services SET total_orders = total_orders + 1
      WHERE id = ${order.service_id} AND EXISTS (SELECT 1 FROM done)
      RETURNING id
    ),
    seller AS (
      UPDATE users
      SET total_earned_lamports = total_earned_lamports + ${split.sellerNet.toString()}::bigint,
          completed_orders = completed_orders + 1
      WHERE id = ${order.seller_id} AND EXISTS (SELECT 1 FROM done)
      RETURNING id
    )
    SELECT id FROM done
  `;

  return NextResponse.json({ ok: true, status: "completed", payoutSignature });
}
