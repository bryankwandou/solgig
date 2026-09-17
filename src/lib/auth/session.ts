import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const COOKIE = "solgig_session";

if (!process.env.SESSION_SECRET && process.env.NODE_ENV === "production") {
  throw new Error("SESSION_SECRET must be set in production");
}
const secret = new TextEncoder().encode(
  process.env.SESSION_SECRET ?? "dev-insecure-secret-change-me",
);

export type SessionClaims = {
  userId: string;
  wallet: string;
  /**
   * users.session_version at sign-in. Logout bumps the column, so every
   * token carrying an older value stops working server-side even though
   * its signature and expiry are still valid.
   */
  sv: number;
};

/** Sign a session token and set it as an httpOnly cookie. */
export async function createSession(claims: SessionClaims) {
  const token = await new SignJWT(claims)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret);

  const store = await cookies();
  store.set(COOKIE, token, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

/** Read and verify the session, or null if absent or invalid. */
export async function readSession(): Promise<SessionClaims | null> {
  const store = await cookies();
  const token = store.get(COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret);
    // Tokens minted before session versions existed carry no `sv`; they
    // count as version 0 and die at the user's first logout.
    const sv = typeof payload.sv === "number" ? payload.sv : 0;
    return { userId: String(payload.userId), wallet: String(payload.wallet), sv };
  } catch {
    return null;
  }
}

export async function clearSession() {
  const store = await cookies();
  store.delete(COOKIE);
}
