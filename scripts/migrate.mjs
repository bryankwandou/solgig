// Runs db/schema.sql against the Neon database in DATABASE_URL.
// Usage: node scripts/migrate.mjs
import { neon } from "@neondatabase/serverless";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

// Load DATABASE_URL from the environment, falling back to .env.local.
let dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
  try {
    const env = readFileSync(join(root, ".env.local"), "utf8");
    const line = env.split(/\r?\n/).find((l) => l.startsWith("DATABASE_URL="));
    if (line) dbUrl = line.slice("DATABASE_URL=".length).trim();
  } catch {
    // no .env.local, continue
  }
}
if (!dbUrl) {
  console.error("DATABASE_URL not found in env or .env.local");
  process.exit(1);
}

const sql = neon(dbUrl);
const schema = readFileSync(join(root, "db", "schema.sql"), "utf8");

// Strip full-line comments first so a comment above a statement does not
// get glued onto it, then split on semicolons (schema is plain DDL).
const cleaned = schema
  .split(/\r?\n/)
  .filter((line) => !line.trim().startsWith("--"))
  .join("\n");
const statements = cleaned
  .split(";")
  .map((s) => s.trim())
  .filter((s) => s.length > 0);

console.log(`Applying ${statements.length} statements to Neon...`);
let ok = 0;
for (const stmt of statements) {
  try {
    await sql.query(stmt);
    ok++;
  } catch (err) {
    console.error("Failed statement:\n", stmt.slice(0, 120), "\n", err.message);
    process.exit(1);
  }
}
console.log(`Done. ${ok}/${statements.length} statements applied.`);
