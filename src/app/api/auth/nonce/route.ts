import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { randomNonce } from "@/lib/auth/siws";

export const runtime = "nodejs";

// Issue a single-use nonce bound to a wallet, valid for five minutes.
export async function POST(req: NextRequest) {
  const { wallet } = await req.json().catch(() => ({}));
  if (!wallet || typeof wallet !== "string") {
    return NextResponse.json(
      { error: { code: "bad_request", message: "A wallet address is required." } },
      { status: 400 },
    );
  }
  const nonce = randomNonce();
  const issuedAt = new Date().toISOString();
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();

  await sql`
    INSERT INTO auth_nonces (nonce, wallet_address, issued_at, expires_at)
    VALUES (${nonce}, ${wallet}, ${issuedAt}, ${expiresAt})
  `;

  return NextResponse.json({ nonce, issuedAt });
}
