import { sql } from "@/lib/db";
import { readSession } from "./session";

export type CurrentUser = {
  id: string;
  wallet_address: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
};

/** Resolve the signed-in user from the session, or null. */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const session = await readSession();
  if (!session) return null;
  const rows = (await sql`
    SELECT id, wallet_address, username, display_name, avatar_url
    FROM users WHERE id = ${session.userId}
  `) as CurrentUser[];
  return rows[0] ?? null;
}

/** Find a user by wallet, creating a bare row on first sign-in. */
export async function upsertUserByWallet(wallet: string): Promise<CurrentUser> {
  const existing = (await sql`
    SELECT id, wallet_address, username, display_name, avatar_url
    FROM users WHERE wallet_address = ${wallet}
  `) as CurrentUser[];
  if (existing[0]) return existing[0];

  const created = (await sql`
    INSERT INTO users (wallet_address)
    VALUES (${wallet})
    RETURNING id, wallet_address, username, display_name, avatar_url
  `) as CurrentUser[];
  return created[0];
}
