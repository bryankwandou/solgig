import { neon } from "@neondatabase/serverless";

if (!process.env.DATABASE_URL) {
  // Fail loud at import time on the server if the database is not configured.
  throw new Error("DATABASE_URL is not set");
}

/**
 * Neon serverless SQL tag. Use as a tagged template for safe, parameterized
 * queries: sql`SELECT * FROM users WHERE id = ${id}`.
 */
export const sql = neon(process.env.DATABASE_URL);

export type Row = Record<string, unknown>;
