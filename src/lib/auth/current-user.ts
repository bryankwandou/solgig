import { sql } from "@/lib/db";
import { readSession } from "./session";

export type CurrentUser = {
  id: string;
  wallet_address: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
};

/**
 * Resolve the signed-in user from the session, or null. A token whose
 * session version no longer matches the database was revoked by a logout.
 */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const session = await readSession();
  if (!session) return null;
  const rows = (await sql`
    SELECT id, wallet_address, username, display_name, avatar_url
    FROM users
    WHERE id = ${session.userId} AND session_version = ${session.sv}
  `) as CurrentUser[];
  return rows[0] ?? null;
}

/**
 * Revoke every session of the token's user. The version is only bumped if it
 * still matches, so a stale token cannot keep logging the user out again.
 */
export async function revokeSessions(session: { userId: string; sv: number }) {
  await sql`
    UPDATE users SET session_version = session_version + 1
    WHERE id = ${session.userId} AND session_version = ${session.sv}
  `;
}

/** Find a user by wallet, creating a bare row on first sign-in. */
export async function upsertUserByWallet(
  wallet: string,
): Promise<CurrentUser & { session_version: number }> {
  // One statement, so two first sign-ins racing on the same wallet cannot
  // hit the unique constraint and 500.
  const rows = (await sql`
    INSERT INTO users (wallet_address)
    VALUES (${wallet})
    ON CONFLICT (wallet_address) DO UPDATE SET wallet_address = EXCLUDED.wallet_address
    RETURNING id, wallet_address, username, display_name, avatar_url, session_version
  `) as (CurrentUser & { session_version: number })[];
  return rows[0];
}
