import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const COOKIE = "solgig_session";
const secret = new TextEncoder().encode(
  process.env.SESSION_SECRET ?? "dev-insecure-secret-change-me",
);

export type SessionClaims = {
  userId: string;
  wallet: string;
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
    return { userId: String(payload.userId), wallet: String(payload.wallet) };
  } catch {
    return null;
  }
}

export async function clearSession() {
  const store = await cookies();
  store.delete(COOKIE);
}
