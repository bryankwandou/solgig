import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { sql } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/current-user";
import { slugify } from "@/lib/utils";

export const runtime = "nodejs";

export async function GET() {
  const items = await sql`
    SELECT s.id, s.slug, s.title, s.thumbnail_url, s.tags, s.price_lamports,
           s.delivery_days, s.rating_average, s.rating_count, s.total_orders,
           u.username AS seller_username, u.display_name AS seller_name,
           u.wallet_address AS seller_wallet
    FROM services s
    JOIN users u ON u.id = s.seller_id
    WHERE s.is_published = true
    ORDER BY s.created_at DESC
    LIMIT 48
  `;
  return NextResponse.json({ items });
}

const CreateService = z.object({
  title: z.string().min(3).max(120),
  description: z.string().max(5000).default(""),
  thumbnail_url: z.string().url().optional().or(z.literal("")),
  tags: z.array(z.string()).max(10).default([]),
  price_lamports: z.number().int().nonnegative(),
  delivery_days: z.number().int().min(1).max(90).default(3),
  revisions: z.number().int().min(0).max(20).default(1),
});

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { error: { code: "unauthorized", message: "Connect a wallet first." } },
      { status: 401 },
    );
  }
  const parsed = CreateService.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json(
      { error: { code: "invalid", message: "Check the service fields." } },
      { status: 422 },
    );
  }
  const d = parsed.data;
  const slug = slugify(d.title);
  const rows = await sql`
    INSERT INTO services
      (seller_id, slug, title, description, thumbnail_url, tags,
       price_lamports, delivery_days, revisions)
    VALUES
      (${user.id}, ${slug}, ${d.title}, ${d.description}, ${d.thumbnail_url || null},
       ${d.tags}, ${d.price_lamports}, ${d.delivery_days}, ${d.revisions})
    RETURNING id, slug
  `;
  return NextResponse.json({ service: rows[0] }, { status: 201 });
}
