import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { getEscrowAddress } from "@/lib/solana/escrow";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/health — public readiness probe. Reports which subsystems are
// configured without exposing any secret material.
export async function GET() {
  let db = false;
  let counts: Record<string, number> = {};
  try {
    const rows = await sql`
      SELECT
        (SELECT COUNT(*)::int FROM users) AS users,
        (SELECT COUNT(*)::int FROM products) AS products,
        (SELECT COUNT(*)::int FROM services) AS services,
        (SELECT COUNT(*)::int FROM posts) AS posts
    `;
    db = true;
    counts = rows[0] as Record<string, number>;
  } catch {
    db = false;
  }

  const escrowAddress = getEscrowAddress();
  const treasury = process.env.NEXT_PUBLIC_PLATFORM_TREASURY || null;

  return NextResponse.json({
    ok: db,
    db,
    counts,
    escrowConfigured: !!escrowAddress,
    escrowAddress,
    treasuryConfigured: !!treasury,
    treasury,
    network: process.env.NEXT_PUBLIC_SOLANA_NETWORK ?? "devnet",
    sessionSecretSet: !!process.env.SESSION_SECRET,
  });
}
