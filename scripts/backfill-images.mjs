// One-off: backfills placeholder images for demo rows seeded before
// thumbnail_url/avatar_url were added to seed.mjs. Safe to re-run.
import { neon } from "@neondatabase/serverless";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const env = readFileSync(join(root, ".env.local"), "utf8");
const dbUrl = env.split(/\r?\n/).find((l) => l.startsWith("DATABASE_URL=")).slice("DATABASE_URL=".length).trim();
const sql = neon(dbUrl);

const avatarUrl = (seed) => `https://picsum.photos/seed/${seed}/200/200`;
const coverUrl = (seed) => `https://picsum.photos/seed/${seed}/600/400`;

const users = await sql`SELECT id, username FROM users WHERE avatar_url IS NULL`;
for (const u of users) {
  await sql`UPDATE users SET avatar_url = ${avatarUrl("solgig-" + u.username)} WHERE id = ${u.id}`;
}
console.log(`Backfilled avatars for ${users.length} users`);

const products = await sql`SELECT id, slug FROM products WHERE thumbnail_url IS NULL`;
for (const p of products) {
  await sql`UPDATE products SET thumbnail_url = ${coverUrl(p.slug)} WHERE id = ${p.id}`;
}
console.log(`Backfilled thumbnails for ${products.length} products`);

const services = await sql`SELECT id, slug FROM services WHERE thumbnail_url IS NULL`;
for (const s of services) {
  await sql`UPDATE services SET thumbnail_url = ${coverUrl(s.slug)} WHERE id = ${s.id}`;
}
console.log(`Backfilled thumbnails for ${services.length} services`);
