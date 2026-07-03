import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { sql } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/current-user";
import { rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

// GET /api/posts/[id]/comments — oldest first, capped.
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const items = await sql`
    SELECT c.id, c.content, c.created_at,
           u.username AS author_username, u.display_name AS author_name,
           u.wallet_address AS author_wallet
    FROM post_comments c
    JOIN users u ON u.id = c.author_id
    WHERE c.post_id = ${id}
    ORDER BY c.created_at ASC
    LIMIT 100
  `;
  return NextResponse.json({ items });
}

const CreateComment = z.object({
  content: z.string().min(1).max(500),
});

// POST /api/posts/[id]/comments — add a comment and bump the counter.
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const limited = rateLimit({ req, key: "comment", limit: 20, windowMs: 60_000 });
  if (limited) return limited;
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { error: { code: "unauthorized", message: "Connect a wallet first." } },
      { status: 401 },
    );
  }
  const { id } = await params;
  const parsed = CreateComment.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json(
      { error: { code: "invalid", message: "Write something to comment." } },
      { status: 422 },
    );
  }

  const inserted = (await sql`
    INSERT INTO post_comments (post_id, author_id, content)
    SELECT ${id}, ${user.id}, ${parsed.data.content}
    WHERE EXISTS (SELECT 1 FROM posts WHERE id = ${id})
    RETURNING id, content, created_at
  `) as { id: string; content: string; created_at: string }[];
  if (!inserted[0]) {
    return NextResponse.json(
      { error: { code: "not_found", message: "That post is gone." } },
      { status: 404 },
    );
  }
  await sql`
    UPDATE posts SET comments_count = comments_count + 1 WHERE id = ${id}
  `;
  return NextResponse.json(
    {
      comment: {
        ...inserted[0],
        author_username: user.username,
        author_name: user.display_name,
        author_wallet: user.wallet_address,
      },
    },
    { status: 201 },
  );
}
