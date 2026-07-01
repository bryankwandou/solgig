import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";

export const runtime = "nodejs";

// GET /api/products/[slug] — one product with seller and recent reviews.
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const rows = await sql`
    SELECT p.*, u.username AS seller_username, u.display_name AS seller_name,
           u.wallet_address AS seller_wallet, u.avatar_url AS seller_avatar,
           u.reputation_score AS seller_reputation
    FROM products p
    JOIN users u ON u.id = p.seller_id
    WHERE p.slug = ${slug}
  `;
  if (!rows[0]) {
    return NextResponse.json(
      { error: { code: "not_found", message: "We could not find that product." } },
      { status: 404 },
    );
  }
  const product = rows[0] as { id: string };

  await sql`UPDATE products SET view_count = view_count + 1 WHERE slug = ${slug}`;

  const reviews = await sql`
    SELECT r.rating, r.body, r.created_at,
           u.username AS reviewer_username, u.display_name AS reviewer_name
    FROM reviews r
    JOIN users u ON u.id = r.reviewer_id
    WHERE r.product_id = ${product.id}
    ORDER BY r.created_at DESC
    LIMIT 20
  `;
  return NextResponse.json({ product, reviews });
}
