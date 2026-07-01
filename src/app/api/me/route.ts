import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { sql } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/current-user";

export const runtime = "nodejs";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ user: null });
  const rows = await sql`
    SELECT id, wallet_address, username, display_name, bio, avatar_url,
           skills, reputation_score, total_earned_lamports, completed_orders
    FROM users WHERE id = ${user.id}
  `;
  return NextResponse.json({ user: rows[0] });
}

const UpdateProfile = z.object({
  username: z.string().min(3).max(24).regex(/^[a-z0-9_.]+$/).optional(),
  display_name: z.string().max(60).optional(),
  bio: z.string().max(300).optional(),
  avatar_url: z.string().url().optional().or(z.literal("")),
  skills: z.array(z.string()).max(12).optional(),
});

export async function PATCH(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { error: { code: "unauthorized", message: "Connect a wallet first." } },
      { status: 401 },
    );
  }
  const parsed = UpdateProfile.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json(
      { error: { code: "invalid", message: "Check the profile fields." } },
      { status: 422 },
    );
  }
  const d = parsed.data;

  if (d.username) {
    const taken = await sql`
      SELECT 1 FROM users WHERE username = ${d.username} AND id <> ${user.id}
    `;
    if (taken.length > 0) {
      return NextResponse.json(
        { error: { code: "taken", message: "That handle is taken. Try another." } },
        { status: 409 },
      );
    }
  }

  const rows = await sql`
    UPDATE users SET
      username = COALESCE(${d.username ?? null}, username),
      display_name = COALESCE(${d.display_name ?? null}, display_name),
      bio = COALESCE(${d.bio ?? null}, bio),
      avatar_url = COALESCE(${d.avatar_url || null}, avatar_url),
      skills = COALESCE(${d.skills ?? null}, skills),
      updated_at = NOW()
    WHERE id = ${user.id}
    RETURNING id, wallet_address, username, display_name, bio, avatar_url, skills
  `;
  return NextResponse.json({ user: rows[0] });
}
