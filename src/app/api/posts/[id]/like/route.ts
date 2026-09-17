import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { sql } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/current-user";
import { apiError, readUuidParam, unauthorized } from "@/lib/http";
import { rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

// Optional explicit target state. Without it the call toggles, as the UI expects.
const LikeBody = z.object({ liked: z.boolean().optional() });

// POST /api/posts/[id]/like — set or toggle a like. Returns the new state and count.
//
// Idempotent under double-clicks: the insert is ON CONFLICT DO NOTHING, and
// likes_count is recomputed from post_likes in the same transaction instead
// of being incremented, so two racing requests can neither 500 on the
// primary key nor push the counter out of step with the rows.
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const limited = rateLimit({ req, key: "like", limit: 60, windowMs: 60_000 });
  if (limited) return limited;
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  const { id, error } = await readUuidParam(params, "id", "That post is gone.");
  if (error) return error;
  const body = LikeBody.safeParse(await req.json().catch(() => ({})));
  const wanted = body.success ? body.data.liked : undefined;

  let liked: boolean;
  if (wanted !== undefined) {
    liked = wanted;
  } else {
    const existing = await sql`
      SELECT 1 FROM post_likes WHERE post_id = ${id} AND user_id = ${user.id}
    `;
    liked = existing.length === 0;
  }

  const [, counted] = await sql.transaction([
    liked
      ? sql`
          INSERT INTO post_likes (post_id, user_id)
          SELECT ${id}, ${user.id}
          WHERE EXISTS (SELECT 1 FROM posts WHERE id = ${id})
          ON CONFLICT (post_id, user_id) DO NOTHING
        `
      : sql`DELETE FROM post_likes WHERE post_id = ${id} AND user_id = ${user.id}`,
    sql`
      UPDATE posts
      SET likes_count = (SELECT COUNT(*)::int FROM post_likes WHERE post_id = ${id})
      WHERE id = ${id}
      RETURNING likes_count
    `,
  ]);
  const row = (counted as { likes_count: number }[])[0];
  if (!row) return apiError(404, "not_found", "That post is gone.");
  return NextResponse.json({ liked, likes: Number(row.likes_count) });
}
