import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/current-user";
import { readUuidParam, unauthorized } from "@/lib/http";

export const runtime = "nodejs";

// GET /api/orders/[id]/download — hand out the product file only to the
// buyer of a completed order. This is the sole path to file_url.
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  const { id, error } = await readUuidParam(params, "id", "No completed order found for you here.");
  if (error) return error;

  const rows = (await sql`
    SELECT p.file_url
    FROM orders o
    JOIN products p ON p.id = o.product_id
    WHERE o.id = ${id} AND o.buyer_id = ${user.id} AND o.status = 'completed'
  `) as { file_url: string | null }[];
  if (!rows[0]) {
    return NextResponse.json(
      { error: { code: "not_found", message: "No completed order found for you here." } },
      { status: 404 },
    );
  }
  if (!rows[0].file_url) {
    return NextResponse.json(
      { error: { code: "no_file", message: "This listing has no downloadable file." } },
      { status: 404 },
    );
  }
  return NextResponse.json({ fileUrl: rows[0].file_url });
}
