import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { sql } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/current-user";
import { slugify } from "@/lib/utils";
import { rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

// GET /api/products?q=&type=&page= — published products with seller info.
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim() ?? "";
  const page = Math.max(1, Number(searchParams.get("page") ?? 1));
  const limit = 24;
  const offset = (page - 1) * limit;

  const like = `%${q.replace(/([%_\\])/g, "\\$1")}%`;
  const items = await sql`
    SELECT p.id, p.slug, p.title, p.short_description, p.thumbnail_url,
           p.product_type, p.tags, p.price_lamports, p.total_purchases,
           p.rating_average, p.rating_count, p.created_at,
           u.username AS seller_username, u.display_name AS seller_name,
           u.wallet_address AS seller_wallet
    FROM products p
    JOIN users u ON u.id = p.seller_id
    WHERE p.is_published = true
      AND (${q} = '' OR p.title ILIKE ${like} OR ${q} = ANY(p.tags))
    ORDER BY p.created_at DESC
    LIMIT ${limit} OFFSET ${offset}
  `;
  return NextResponse.json({ items, page });
}

const CreateProduct = z.object({
  title: z.string().min(3).max(120),
  description: z.string().max(5000).default(""),
  short_description: z.string().max(200).optional(),
  thumbnail_url: z.string().url().optional().or(z.literal("")),
  product_type: z.string().default("other"),
  tags: z.array(z.string()).max(10).default([]),
  file_url: z.string().url().optional().or(z.literal("")),
  // Floor of 0.001 SOL: smaller transfers can fail the rent-exempt minimum.
  price_lamports: z.number().int().min(1_000_000),
});

// POST /api/products — create a listing for the signed-in seller.
export async function POST(req: NextRequest) {
  const limited = rateLimit({ req, key: "listing", limit: 10, windowMs: 60_000 });
  if (limited) return limited;
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { error: { code: "unauthorized", message: "Connect a wallet first." } },
      { status: 401 },
    );
  }
  const parsed = CreateProduct.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json(
      { error: { code: "invalid", message: "Check the listing fields." } },
      { status: 422 },
    );
  }
  const d = parsed.data;
  const slug = slugify(d.title);
  const rows = await sql`
    INSERT INTO products
      (seller_id, slug, title, description, short_description, thumbnail_url,
       product_type, tags, file_url, price_lamports)
    VALUES
      (${user.id}, ${slug}, ${d.title}, ${d.description},
       ${d.short_description ?? null}, ${d.thumbnail_url || null},
       ${d.product_type}, ${d.tags}, ${d.file_url || null}, ${d.price_lamports})
    RETURNING id, slug
  `;
  return NextResponse.json({ product: rows[0] }, { status: 201 });
}
