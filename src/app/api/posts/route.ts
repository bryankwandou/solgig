import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { sql } from "@/lib/db";
import { isHttpUrl } from "@/lib/utils";
import { getCurrentUser } from "@/lib/auth/current-user";
import { rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

// GET /api/posts?cursor= — the public feed, newest first, keyset paginated.
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const limit = 20;
  const cursorRaw = searchParams.get("cursor");
  const cursor =
    cursorRaw && !Number.isNaN(Date.parse(cursorRaw))
      ? new Date(cursorRaw).toISOString()
      : null;
  const items = (await sql`
    SELECT p.id, p.content, p.media_url, p.tags, p.likes_count,
           p.comments_count, p.created_at, p.linked_product_id,
           u.username AS author_username, u.display_name AS author_name,
           u.avatar_url AS author_avatar, u.wallet_address AS author_wallet,
           pr.slug AS product_slug, pr.title AS product_title, pr.price_lamports AS product_price
    FROM posts p
    JOIN users u ON u.id = p.author_id
    LEFT JOIN products pr ON pr.id = p.linked_product_id
    WHERE (${cursor}::timestamptz IS NULL OR p.created_at < ${cursor}::timestamptz)
    ORDER BY p.created_at DESC
    LIMIT ${limit}
  `) as { created_at: string }[];
  const nextCursor =
    items.length === limit ? items[items.length - 1].created_at : null;
  return NextResponse.json({ items, nextCursor });
}

const CreatePost = z.object({
  content: z.string().min(1).max(1000),
  media_url: z.string().url().refine(isHttpUrl).optional().or(z.literal("")),
  linked_product_id: z.string().uuid().optional(),
  tags: z.array(z.string()).max(8).default([]),
});

export async function POST(req: NextRequest) {
  const limited = rateLimit({ req, key: "post", limit: 15, windowMs: 60_000 });
  if (limited) return limited;
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { error: { code: "unauthorized", message: "Connect a wallet first." } },
      { status: 401 },
    );
  }
  const parsed = CreatePost.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json(
      { error: { code: "invalid", message: "Write something to post." } },
      { status: 422 },
    );
  }
  const d = parsed.data;
  const rows = await sql`
    INSERT INTO posts (author_id, content, media_url, linked_product_id, tags)
    VALUES (${user.id}, ${d.content}, ${d.media_url || null},
            ${d.linked_product_id ?? null}, ${d.tags})
    RETURNING id
  `;
  return NextResponse.json({ post: rows[0] }, { status: 201 });
}
