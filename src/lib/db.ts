import { neon } from "@neondatabase/serverless";

if (!process.env.DATABASE_URL) {
  // Fail loud at import time on the server if the database is not configured.
  throw new Error("DATABASE_URL is not set");
}

// Guard against copy-pasting env vars between the devnet and mainnet Vercel
// projects: both share the same Neon host, distinguished only by database
// name, so a swapped DATABASE_URL would silently point a mainnet deploy at
// devnet demo data (or vice versa) without this check.
const dbName = new URL(process.env.DATABASE_URL).pathname.replace("/", "");
const network = process.env.NEXT_PUBLIC_SOLANA_NETWORK;
if (network === "mainnet-beta" && dbName !== "solgig_mainnet") {
  throw new Error(
    `Refusing to boot: NEXT_PUBLIC_SOLANA_NETWORK=mainnet-beta but DATABASE_URL points at "${dbName}", not "solgig_mainnet". This would mix real mainnet users with devnet demo data.`,
  );
}
if (network !== "mainnet-beta" && dbName === "solgig_mainnet") {
  throw new Error(
    `Refusing to boot: DATABASE_URL points at the mainnet database "solgig_mainnet" but NEXT_PUBLIC_SOLANA_NETWORK is "${network}", not "mainnet-beta". This would expose real mainnet data on a non-mainnet deploy.`,
  );
}

/**
 * Neon serverless SQL tag. Use as a tagged template for safe, parameterized
 * queries: sql`SELECT * FROM users WHERE id = ${id}`.
 */
export const sql = neon(process.env.DATABASE_URL);

export type Row = Record<string, unknown>;
