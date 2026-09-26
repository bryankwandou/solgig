import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { receiptFor, type ReceiptRow } from "@/lib/receipt";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/agent/receipts/[signature] — the receipt for a purchase, looked
// up by its payment signature. Public: it only restates what the chain
// already shows, and never includes the file.
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ signature: string }> },
) {
  const { signature } = await params;
  if (!/^[1-9A-HJ-NP-Za-km-z]{32,90}$/.test(signature)) {
    return NextResponse.json(
      { error: { code: "not_found", message: "No receipt for that signature." } },
      { status: 404 },
    );
  }
  const rows = (await sql`
    SELECT o.id, o.order_number, o.product_id, o.amount_lamports, o.platform_fee_lamports,
           o.token_mint, o.buyer_wallet, o.seller_wallet, o.payment_tx_signature,
           o.paid_at, p.slug AS product_slug, p.title AS product_title
    FROM orders o
    LEFT JOIN products p ON p.id = o.product_id
    WHERE o.payment_tx_signature = ${signature} AND o.status IN ('paid', 'completed')
  `) as ReceiptRow[];
  if (!rows[0]) {
    return NextResponse.json(
      { error: { code: "not_found", message: "No receipt for that signature." } },
      { status: 404 },
    );
  }
  return NextResponse.json({ receipt: receiptFor(rows[0]) });
}
