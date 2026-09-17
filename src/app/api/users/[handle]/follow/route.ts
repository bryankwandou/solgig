import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/current-user";
import { z } from "zod";
import { rateLimit } from "@/lib/rate-limit";
import { apiError, isUuid, unauthorized } from "@/lib/http";

export const runtime = "nodejs";

const FollowBody = z.object({ following: z.boolean().optional() });

// POST /api/users/[handle]/follow — set (body {following}) or toggle following
// by user id. Returns the new state. Idempotent: the insert ignores
// duplicates and both counters are recomputed from `follows` in the same
// transaction, so double-clicks neither 500 nor skew the counts.
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ handle: string }> },
) {
  const limited = rateLimit({ req, key: "follow", limit: 30, windowMs: 60_000 });
  if (limited) return limited;
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  const { handle } = await params;
  if (!isUuid(handle)) return apiError(404, "not_found", "That account does not exist.");
  const id = handle.toLowerCase();
  if (id === user.id) {
    return NextResponse.json(
      { error: { code: "self_follow", message: "Following yourself does nothing." } },
      { status: 400 },
    );
  }

  const body = FollowBody.safeParse(await req.json().catch(() => ({})));
  let following: boolean;
  if (body.success && body.data.following !== undefined) {
    following = body.data.following;
  } else {
    const existing = await sql`
      SELECT 1 FROM follows WHERE follower_id = ${user.id} AND following_id = ${id}
    `;
    following = existing.length === 0;
  }

  const [, target] = await sql.transaction([
    following
      ? sql`
          INSERT INTO follows (follower_id, following_id)
          SELECT ${user.id}, ${id}
          WHERE EXISTS (SELECT 1 FROM users WHERE id = ${id})
          ON CONFLICT DO NOTHING
        `
      : sql`DELETE FROM follows WHERE follower_id = ${user.id} AND following_id = ${id}`,
    sql`
      UPDATE users
      SET followers_count = (SELECT COUNT(*)::int FROM follows WHERE following_id = ${id})
      WHERE id = ${id}
      RETURNING followers_count
    `,
    sql`
      UPDATE users
      SET following_count = (SELECT COUNT(*)::int FROM follows WHERE follower_id = ${user.id})
      WHERE id = ${user.id}
    `,
  ]);
  const row = (target as { followers_count: number }[])[0];
  if (!row) return apiError(404, "not_found", "That account does not exist.");
  return NextResponse.json({ following, followers: Number(row.followers_count) });
}
