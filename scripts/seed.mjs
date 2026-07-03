// Seeds demo creators, listings, and feed posts so a fresh deployment
// does not look empty. Idempotent: safe to re-run, keyed on usernames.
// Usage: node scripts/seed.mjs
import { neon } from "@neondatabase/serverless";
import { Keypair } from "@solana/web3.js";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

let dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
  const env = readFileSync(join(root, ".env.local"), "utf8");
  const line = env.split(/\r?\n/).find((l) => l.startsWith("DATABASE_URL="));
  if (line) dbUrl = line.slice("DATABASE_URL=".length).trim();
}
if (!dbUrl) {
  console.error("DATABASE_URL not found");
  process.exit(1);
}
const sql = neon(dbUrl);

const SOL = 1_000_000_000;
const slug = (t) =>
  t.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

const avatarUrl = (seed) => `https://picsum.photos/seed/${seed}/200/200`;
const coverUrl = (seed) => `https://picsum.photos/seed/${seed}/600/400`;

const USERS = [
  {
    username: "mira",
    display_name: "Mira Tan",
    bio: "Pixel artist and UI tinkerer. I ship small, weird, useful things.",
    skills: ["pixel art", "ui design", "figma"],
    avatar_url: avatarUrl("solgig-mira"),
  },
  {
    username: "devrel_ok",
    display_name: "Okky Pratama",
    bio: "Anchor programs by day, generative art by night.",
    skills: ["rust", "anchor", "typescript"],
    avatar_url: avatarUrl("solgig-devrel"),
  },
  {
    username: "lena.codes",
    display_name: "Lena Ortiz",
    bio: "Frontend engineer. I turn Figma files into fast pages.",
    skills: ["react", "nextjs", "tailwind"],
    avatar_url: avatarUrl("solgig-lena"),
  },
  {
    username: "beatsbyjun",
    display_name: "Jun Park",
    bio: "Lo-fi packs and stems, mixed on hardware, sold for SOL.",
    skills: ["music production", "sound design"],
    avatar_url: avatarUrl("solgig-jun"),
  },
];

const PRODUCTS = [
  ["mira", "Pixel Icon Pack Vol. 2", "180 hand-drawn 24px icons for dashboards and wallets.", "design", 0.4, ["icons", "pixel", "ui"]],
  ["mira", "Wallet UI Kit for Figma", "A full wallet interface kit: 60 screens, dark and light.", "design", 1.2, ["figma", "ui kit", "wallet"]],
  ["devrel_ok", "Anchor Escrow Starter", "A commented escrow program with tests and a deploy script.", "code", 2.5, ["anchor", "rust", "escrow"]],
  ["devrel_ok", "Generative Art Seeds", "500 curated seeds plus the script that grew them.", "art", 0.8, ["generative", "art"]],
  ["lena.codes", "Next.js SaaS Boilerplate", "Auth, billing hooks, and a marketing page that converts.", "code", 1.8, ["nextjs", "boilerplate", "saas"]],
  ["beatsbyjun", "Lo-fi Pack: Rainy Season", "24 loops and 12 one-shots, 88 BPM, all stems included.", "audio", 0.6, ["lofi", "samples", "music"]],
];

const SERVICES = [
  ["mira", "Custom app icon set", "I draw a cohesive icon set for your product, up to 30 icons.", 1.5, 5, ["icons", "design"]],
  ["devrel_ok", "Anchor program review", "Line-by-line review of your program with a written report.", 3.0, 4, ["rust", "audit", "anchor"]],
  ["lena.codes", "Landing page build", "Figma to a deployed Next.js page, animations included.", 2.2, 7, ["nextjs", "frontend"]],
  ["beatsbyjun", "Custom track for your launch", "A 60-90s original track scored to your product video.", 1.0, 6, ["music", "branding"]],
];

const POSTS = [
  ["mira", "Shipped 40 new glyphs to the icon pack tonight. The tiny wallet ones were the hardest — 24px does not forgive.", "Pixel Icon Pack Vol. 2"],
  ["devrel_ok", "Escrow starter now has property tests. Found one edge case where a zero-lamport release would burn rent. Fixed and documented.", "Anchor Escrow Starter"],
  ["lena.codes", "Hot take: your landing page hero does not need a 3D scene. It needs a headline that says what the thing does.", null],
  ["beatsbyjun", "Rainy season pack is live. Recorded the rain myself from my balcony, no sample libraries.", "Lo-fi Pack: Rainy Season"],
  ["mira", "Open slot next week for one custom icon commission. Grab it before the weekend.", null],
  ["devrel_ok", "Reading other people's Anchor code is the fastest way to level up. Post yours, I will take a look.", null],
];

const existing = await sql`SELECT COUNT(*)::int AS c FROM users WHERE username = 'mira'`;
if (existing[0].c > 0) {
  console.log("Seed users already present; nothing to do.");
  process.exit(0);
}

const userIds = {};
for (const u of USERS) {
  const wallet = Keypair.generate().publicKey.toBase58();
  const rows = await sql`
    INSERT INTO users (wallet_address, username, display_name, bio, skills, avatar_url, is_verified)
    VALUES (${wallet}, ${u.username}, ${u.display_name}, ${u.bio}, ${u.skills}, ${u.avatar_url}, true)
    RETURNING id
  `;
  userIds[u.username] = rows[0].id;
}
console.log(`Seeded ${USERS.length} users`);

const productIds = {};
for (const [owner, title, desc, type, priceSol, tags] of PRODUCTS) {
  const rows = await sql`
    INSERT INTO products
      (seller_id, slug, title, description, short_description, thumbnail_url, product_type,
       tags, price_lamports, total_purchases, rating_average, rating_count, view_count)
    VALUES
      (${userIds[owner]}, ${slug(title)}, ${title}, ${desc}, ${desc}, ${coverUrl(slug(title))},
       ${type}, ${tags}, ${Math.round(priceSol * SOL)},
       ${3 + Math.floor(Math.random() * 40)}, ${(4 + Math.random()).toFixed(2)},
       ${2 + Math.floor(Math.random() * 20)}, ${50 + Math.floor(Math.random() * 900)})
    RETURNING id
  `;
  productIds[title] = rows[0].id;
}
console.log(`Seeded ${PRODUCTS.length} products`);

for (const [owner, title, desc, priceSol, days, tags] of SERVICES) {
  await sql`
    INSERT INTO services
      (seller_id, slug, title, description, thumbnail_url, tags, price_lamports,
       delivery_days, total_orders, rating_average, rating_count)
    VALUES
      (${userIds[owner]}, ${slug(title)}, ${title}, ${desc}, ${coverUrl(slug(title))}, ${tags},
       ${Math.round(priceSol * SOL)}, ${days},
       ${1 + Math.floor(Math.random() * 15)}, ${(4 + Math.random()).toFixed(2)},
       ${1 + Math.floor(Math.random() * 10)})
  `;
}
console.log(`Seeded ${SERVICES.length} services`);

for (const [author, content, productTitle] of POSTS) {
  await sql`
    INSERT INTO posts (author_id, content, linked_product_id, likes_count)
    VALUES (${userIds[author]}, ${content},
            ${productTitle ? productIds[productTitle] : null},
            ${Math.floor(Math.random() * 30)})
  `;
}
console.log(`Seeded ${POSTS.length} posts`);

// Everyone follows everyone else, so profiles do not read zero.
const names = Object.keys(userIds);
for (const a of names) {
  for (const b of names) {
    if (a === b) continue;
    await sql`
      INSERT INTO follows (follower_id, following_id)
      VALUES (${userIds[a]}, ${userIds[b]}) ON CONFLICT DO NOTHING
    `;
  }
}
await sql`
  UPDATE users SET followers_count = ${names.length - 1},
                   following_count = ${names.length - 1}
  WHERE username = ANY(${names})
`;
console.log("Seeded follow graph. Done.");
