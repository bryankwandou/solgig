// One-off: attaches real, verified downloadable archives to the demo
// products so a completed purchase actually delivers files. Safe to re-run.
import { neon } from "@neondatabase/serverless";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const env = readFileSync(join(root, ".env.local"), "utf8");
const dbUrl = env.split(/\r?\n/).find((l) => l.startsWith("DATABASE_URL=")).slice("DATABASE_URL=".length).trim();
const sql = neon(dbUrl);

const FILES = {
  "pixel-icon-pack-vol-2":
    "https://github.com/feathericons/feather/archive/refs/heads/main.zip",
  "wallet-ui-kit-for-figma":
    "https://github.com/solana-labs/wallet-adapter/archive/refs/heads/master.zip",
  "anchor-escrow-starter":
    "https://github.com/solana-developers/program-examples/archive/refs/heads/main.zip",
  "generative-art-seeds":
    "https://github.com/mattdesl/canvas-sketch/archive/refs/heads/master.zip",
  "next-js-saas-boilerplate":
    "https://github.com/nextauthjs/next-auth-example/archive/refs/heads/main.zip",
  "lo-fi-pack-rainy-season":
    "https://github.com/rafaelreis-hotmart/Audio-Sample-files/archive/refs/heads/master.zip",
};

for (const [slug, url] of Object.entries(FILES)) {
  const res = await sql`
    UPDATE products SET file_url = ${url} WHERE slug = ${slug} RETURNING slug
  `;
  console.log(res.length ? `set file for ${slug}` : `SKIPPED (not found): ${slug}`);
}
console.log("Done.");
