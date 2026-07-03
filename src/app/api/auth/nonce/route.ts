import { NextRequest, NextResponse } from "next/server";
import { PublicKey } from "@solana/web3.js";
import { sql } from "@/lib/db";
import { randomNonce } from "@/lib/auth/siws";
import { rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

// Issue a single-use nonce bound to a wallet, valid for five minutes.
export async function POST(req: NextRequest) {
  const limited = rateLimit({ req, key: "nonce", limit: 10, windowMs: 60_000 });
  if (limited) return limited;
  const { wallet } = await req.json().catch(() => ({}));
  if (!wallet || typeof wallet !== "string") {
    return NextResponse.json(
      { error: { code: "bad_request", message: "A wallet address is required." } },
      { status: 400 },
    );
  }
  try {
    new PublicKey(wallet);
  } catch {
    return NextResponse.json(
      { error: { code: "bad_request", message: "That is not a valid Solana address." } },
      { status: 400 },
    );
  }
  // One live nonce per wallet keeps the table from being spammed full.
  await sql`
    DELETE FROM auth_nonces
    WHERE wallet_address = ${wallet} OR expires_at < NOW()
  `;
  const nonce = randomNonce();
  const issuedAt = new Date().toISOString();
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();

  await sql`
    INSERT INTO auth_nonces (nonce, wallet_address, issued_at, expires_at)
    VALUES (${nonce}, ${wallet}, ${issuedAt}, ${expiresAt})
  `;

  return NextResponse.json({ nonce, issuedAt });
}
