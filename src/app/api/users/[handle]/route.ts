import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/current-user";

export const runtime = "nodejs";

// GET /api/users/[handle] — public profile by username or wallet address,
// with the person's listings, recent posts, and follow state for the viewer.
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ handle: string }> },
) {
  const { handle } = await params;
  const rows = (await sql`
    SELECT id, wallet_address, username, display_name, bio, avatar_url,
           skills, is_verified, reputation_score, completed_orders,
           followers_count, following_count, created_at
    FROM users
    WHERE username = ${handle} OR wallet_address = ${handle}
    LIMIT 1
  `) as { id: string }[];
  const profile = rows[0];
  if (!profile) {
    return NextResponse.json(
      { error: { code: "not_found", message: "No one goes by that here." } },
      { status: 404 },
    );
  }

  const [products, services, posts] = await Promise.all([
    sql`
      SELECT id, slug, title, thumbnail_url, price_lamports,
             rating_average, rating_count, total_purchases
      FROM products
      WHERE seller_id = ${profile.id} AND is_published = true
      ORDER BY created_at DESC LIMIT 12
    `,
    sql`
      SELECT id, slug, title, price_lamports, delivery_days,
             rating_average, rating_count, total_orders
      FROM services
      WHERE seller_id = ${profile.id} AND is_published = true
      ORDER BY created_at DESC LIMIT 12
    `,
    sql`
      SELECT id, content, media_url, likes_count, comments_count, created_at
      FROM posts
      WHERE author_id = ${profile.id}
      ORDER BY created_at DESC LIMIT 10
    `,
  ]);

  const viewer = await getCurrentUser();
  let isFollowing = false;
  if (viewer && viewer.id !== profile.id) {
    const f = await sql`
      SELECT 1 FROM follows
      WHERE follower_id = ${viewer.id} AND following_id = ${profile.id}
    `;
    isFollowing = f.length > 0;
  }

  return NextResponse.json({
    profile,
    products,
    services,
    posts,
    isFollowing,
    isSelf: viewer?.id === profile.id,
  });
}
