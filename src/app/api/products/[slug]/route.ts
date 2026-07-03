import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";

export const runtime = "nodejs";

// GET /api/products/[slug] — one product with seller and recent reviews.
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  // file_url is deliberately excluded: paid files are only handed out
  // through the entitlement-checked order download endpoint.
  const rows = await sql`
    SELECT p.id, p.slug, p.title, p.description, p.short_description,
           p.thumbnail_url, p.product_type, p.tags, p.price_lamports,
           p.is_published, p.total_purchases, p.rating_average, p.rating_count,
           p.view_count, p.created_at,
           u.username AS seller_username, u.display_name AS seller_name,
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
