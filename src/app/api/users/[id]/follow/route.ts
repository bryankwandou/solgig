import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/current-user";
import { rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

// POST /api/users/[id]/follow — toggle following. Returns the new state.
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const limited = rateLimit({ req, key: "follow", limit: 30, windowMs: 60_000 });
  if (limited) return limited;
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { error: { code: "unauthorized", message: "Connect a wallet first." } },
      { status: 401 },
    );
  }
  const { id } = await params;
  if (id === user.id) {
    return NextResponse.json(
      { error: { code: "self_follow", message: "Following yourself does nothing." } },
      { status: 400 },
    );
  }

  // Try to unfollow first; if nothing was deleted, follow instead.
  const removed = await sql`
    DELETE FROM follows
    WHERE follower_id = ${user.id} AND following_id = ${id}
    RETURNING follower_id
  `;
  let following: boolean;
  if (removed.length > 0) {
    following = false;
    await sql`
      UPDATE users SET followers_count = GREATEST(followers_count - 1, 0) WHERE id = ${id}
    `;
    await sql`
      UPDATE users SET following_count = GREATEST(following_count - 1, 0) WHERE id = ${user.id}
    `;
  } else {
    const added = await sql`
      INSERT INTO follows (follower_id, following_id)
      SELECT ${user.id}, ${id}
      WHERE EXISTS (SELECT 1 FROM users WHERE id = ${id})
      ON CONFLICT DO NOTHING
      RETURNING follower_id
    `;
    if (added.length === 0) {
      return NextResponse.json(
        { error: { code: "not_found", message: "That account does not exist." } },
        { status: 404 },
      );
    }
    following = true;
    await sql`
      UPDATE users SET followers_count = followers_count + 1 WHERE id = ${id}
    `;
    await sql`
      UPDATE users SET following_count = following_count + 1 WHERE id = ${user.id}
    `;
  }

  const rows = await sql`SELECT followers_count FROM users WHERE id = ${id}`;
  return NextResponse.json({
    following,
    followers: rows[0]?.followers_count ?? 0,
  });
}
