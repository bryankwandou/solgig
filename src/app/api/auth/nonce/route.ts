import { NextRequest, NextResponse } from "next/server";
import { PublicKey } from "@solana/web3.js";
import { sql } from "@/lib/db";
import { randomNonce, buildSiwsMessage, SIWS_DOMAIN } from "@/lib/auth/siws";
import { rateLimitDurable } from "@/lib/rate-limit-db";

export const runtime = "nodejs";

// Issue a single-use nonce bound to a wallet, valid for five minutes.
export async function POST(req: NextRequest) {
  const limited = await rateLimitDurable({ req, key: "nonce", limit: 10, windowMs: 60_000 });
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
  // Only expired nonces are swept. Deleting a wallet's live nonces here let
  // anyone who knew an address void that wallet's pending sign-in by
  // requesting a fresh nonce for it every few seconds. Table growth stays
  // bounded by the per-IP limit above and the five-minute expiry.
  await sql`
    DELETE FROM auth_nonces WHERE expires_at < NOW()
  `;
  const nonce = randomNonce();
  const issuedAt = new Date().toISOString();
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();

  await sql`
    INSERT INTO auth_nonces (nonce, wallet_address, issued_at, expires_at)
    VALUES (${nonce}, ${wallet}, ${issuedAt}, ${expiresAt})
  `;

  // `message` is the exact text to sign, so a headless client never has to
  // reconstruct the format (and get a byte wrong).
  return NextResponse.json({
    nonce,
    issuedAt,
    message: buildSiwsMessage({ domain: SIWS_DOMAIN, address: wallet, nonce, issuedAt }),
  });
}
