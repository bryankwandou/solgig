// One-off: creates a fresh "solgig_mainnet" database on the same Neon Postgres
// instance as the devnet demo DB, so real mainnet user data never mixes with
// devnet/demo rows. Requires a direct (non-pooled) connection for CREATE DATABASE.
import { neon } from "@neondatabase/serverless";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const env = readFileSync(join(root, ".env.local"), "utf8");
const dbUrl = env.split(/\r?\n/).find((l) => l.startsWith("DATABASE_URL=")).slice("DATABASE_URL=".length).trim();

const u = new URL(dbUrl);
u.hostname = u.hostname.replace("-pooler", "");
u.pathname = "/neondb";
const directUrl = u.toString();

const sql = neon(directUrl);

const existing = await sql`SELECT 1 FROM pg_database WHERE datname = 'solgig_mainnet'`;
if (existing.length > 0) {
  console.log("solgig_mainnet database already exists, skipping create.");
} else {
  await sql.query("CREATE DATABASE solgig_mainnet");
  console.log("Created database solgig_mainnet");
}

u.pathname = "/solgig_mainnet";
console.log("MAINNET_DATABASE_URL=" + u.toString());
