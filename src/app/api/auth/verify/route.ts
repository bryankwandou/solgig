import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { buildSiwsMessage, verifySiwsSignature } from "@/lib/auth/siws";
import { createSession } from "@/lib/auth/session";
import { upsertUserByWallet } from "@/lib/auth/current-user";
import { rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

const DOMAIN = "solgig.xyz";

// Verify a signed SIWS message, burn the nonce, and open a session.
export async function POST(req: NextRequest) {
  const limited = rateLimit({ req, key: "verify", limit: 10, windowMs: 60_000 });
  if (limited) return limited;
  const { wallet, signature, nonce } = await req.json().catch(() => ({}));
  if (!wallet || !signature || !nonce) {
    return NextResponse.json(
      { error: { code: "bad_request", message: "Missing sign-in fields." } },
      { status: 400 },
    );
  }

  // The nonce must exist, be unused, unexpired, and bound to this wallet.
  const rows = (await sql`
    SELECT nonce, wallet_address, issued_at, expires_at, used
    FROM auth_nonces
    WHERE nonce = ${nonce} AND wallet_address = ${wallet}
  `) as {
    issued_at: string;
    expires_at: string;
    used: boolean;
  }[];
  const record = rows[0];
  if (!record || record.used || new Date(record.expires_at) < new Date()) {
    return NextResponse.json(
      { error: { code: "bad_nonce", message: "That sign-in request expired. Try again." } },
      { status: 400 },
    );
  }

  const message = buildSiwsMessage({
    domain: DOMAIN,
    address: wallet,
    nonce,
    issuedAt: new Date(record.issued_at).toISOString(),
  });

  if (!verifySiwsSignature(message, signature, wallet)) {
    return NextResponse.json(
      { error: { code: "bad_signature", message: "We could not verify that signature." } },
      { status: 401 },
    );
  }

  // Burn the nonce atomically; if another request got here first, the
  // guarded update returns nothing and this attempt is rejected.
  const burned = await sql`
    UPDATE auth_nonces SET used = true
    WHERE nonce = ${nonce} AND used = false
    RETURNING nonce
  `;
  if (burned.length === 0) {
    return NextResponse.json(
      { error: { code: "bad_nonce", message: "That sign-in request expired. Try again." } },
      { status: 400 },
    );
  }

  const user = await upsertUserByWallet(wallet);
  await createSession({ userId: user.id, wallet });

  return NextResponse.json({ user });
}
