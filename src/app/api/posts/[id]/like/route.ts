import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/current-user";

export const runtime = "nodejs";

// Toggle a like on a post. Returns the new like state and count.
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { error: { code: "unauthorized", message: "Connect a wallet first." } },
      { status: 401 },
    );
  }
  const { id } = await params;

  const existing = await sql`
    SELECT 1 FROM post_likes WHERE post_id = ${id} AND user_id = ${user.id}
  `;
  let liked: boolean;
  if (existing.length > 0) {
    await sql`DELETE FROM post_likes WHERE post_id = ${id} AND user_id = ${user.id}`;
    await sql`UPDATE posts SET likes_count = GREATEST(likes_count - 1, 0) WHERE id = ${id}`;
    liked = false;
  } else {
    await sql`INSERT INTO post_likes (post_id, user_id) VALUES (${id}, ${user.id})`;
    await sql`UPDATE posts SET likes_count = likes_count + 1 WHERE id = ${id}`;
    liked = true;
  }
  const rows = await sql`SELECT likes_count FROM posts WHERE id = ${id}`;
  return NextResponse.json({ liked, likes: rows[0]?.likes_count ?? 0 });
}
