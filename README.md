# SolGig

> Social marketplace for Solana creators — sell digital goods, offer services, get paid on-chain. No banks, no chargebacks, no middleman holding funds.

[![Solana](https://img.shields.io/badge/Chain-Solana-9945FF?logo=solana)](https://solana.com)
[![Next.js](https://img.shields.io/badge/Framework-Next.js_15-black?logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript)](https://typescriptlang.org)
[![CI](https://github.com/bryankwandou/solgig/actions/workflows/ci.yml/badge.svg)](https://github.com/bryankwandou/solgig/actions)

**Live:**
- Mainnet (real SOL): https://solgig-mainnet.vercel.app
- Devnet (demo, fake SOL): https://solgig.vercel.app

---

## What this is

SolGig lets a creator connect a Solana wallet, list a digital product (a file) or a service (freelance work), post about it in a TikTok/Instagram-style feed, and get paid directly on-chain — no custodial payment processor, no card network, no chargeback risk. Buyers pay with a Solana wallet signature; the platform takes a small fee (2.5%) and the rest goes straight to the seller.

Two payment paths are supported:

- **Direct payment** (digital products): buyer sends SOL straight to the seller's wallet plus a fee to the platform treasury, in one transaction. The server verifies the on-chain transaction (signer, amounts, balance deltas) before releasing the file.
- **Escrow payment** (services): buyer sends SOL to a platform-controlled escrow wallet. Funds sit there until the buyer confirms the work is done, at which point the server releases the payout (minus fee) to the seller in a new signed transaction.

## Why it's split into two deployments

Solana has two meaningfully different environments: **devnet** (free test SOL, for demos) and **mainnet-beta** (real money). Mixing them under one deployment risks a demo transaction touching a real wallet, or — worse — a misconfigured env var pointing a live payment at the wrong network. So SolGig ships as two entirely separate repos, Vercel projects, databases, and wallet keypairs:

| | Devnet (demo) | Mainnet (real) |
|---|---|---|
| Repo | `bryankwandou/solgig` | `bryankwandou/solgig-mainnet` |
| Deployment | solgig.vercel.app | solgig-mainnet.vercel.app |
| Database | Neon `neondb` (seeded with demo data) | Neon `solgig_mainnet` (empty, real users only) |
| Escrow / treasury wallets | Devnet-only keypairs, funded with faucet SOL | Independent mainnet keypairs |

A boot-time guard (`src/lib/db.ts`) refuses to start the app at all if `NEXT_PUBLIC_SOLANA_NETWORK` and `DATABASE_URL` don't agree on which environment they're in — so a copy-pasted env var can't silently cross-wire demo and real money.

## Core features

- **Wallet-native auth** — Sign-In-With-Solana (nonce + signature verification via `tweetnacl`/`bs58`), JWT session cookie, no passwords/email.
- **Marketplace** — list & browse digital products, on-chain checkout, entitlement-gated file delivery (the file URL is only ever returned to the buyer of a *completed* order).
- **Services + escrow** — book a service, funds held in escrow, buyer confirms completion to release payout on-chain.
- **Social feed** — posts, comments, likes, follows; public creator profiles with product/service/post history.
- **Reviews** — one review per completed order, idempotent (can't be farmed by re-submitting).
- **Rate limiting** — sliding-window per-IP limits on every write endpoint (auth, orders, reviews, posts, follows).
- **Health probe** — `/api/health` reports DB connectivity, escrow/treasury configuration, and network, without leaking secrets.

## Architecture

```
Next.js 15 (App Router, TypeScript)
  ├─ Wallet Adapter (Phantom/Solflare/Backpack) ── client-side signing
  ├─ API routes (Node runtime) ── all business logic + on-chain verification
  │    ├─ Sign-In-With-Solana (nonce, verify, session)
  │    ├─ Products / Services / Orders / Reviews / Posts / Follows
  │    └─ Payment verification: pulls the tx from RPC, checks signer,
  │         amounts, and balance deltas before trusting a "paid" claim
  ├─ Neon Postgres (serverless HTTP driver, no connection pooling needed)
  └─ Escrow wallet (Keypair held server-side via env var) for service payouts
```

There is no on-chain program (no Anchor/BPF code) — escrow is a server-controlled wallet, not a PDA. This was a deliberate scope call for the hackathon timeline: it ships a working, auditable payment flow today; a program-based escrow (trustless, no custodial key) is the natural next step and is called out below.

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS v4, Framer Motion, Three.js |
| Chain | Solana Web3.js, `@solana/wallet-adapter-*` |
| Auth | Sign-In-With-Solana (nonce + ed25519 signature check via `tweetnacl`), JWT session (`jose`) |
| Database | Neon serverless Postgres (`@neondatabase/serverless`) |
| Validation | Zod on every API input |
| Testing | Vitest (16 unit tests: SIWS verification, utils, rate limiting) |
| CI | GitHub Actions — typecheck, test, build on every push |
| Hosting | Vercel |

## Run it locally

```bash
npm install
cp .env.example .env.local   # fill in DATABASE_URL, SESSION_SECRET, etc.
npm run dev
```

Then open `http://localhost:3000`.

```bash
npm run typecheck   # tsc --noEmit
npm test            # vitest run
npm run build       # production build
```

## Seed demo data (devnet only)

```bash
node scripts/seed.mjs              # 4 demo creators, products, services, posts, follow graph
node scripts/backfill-images.mjs   # attach real avatar/thumbnail images
node scripts/backfill-files.mjs    # attach real downloadable files to products
```

Never run these against the mainnet database — there is nothing to seed there; real users create their own listings.

## What's next (honest roadmap)

- **On-chain escrow program** (Anchor/PDA) to remove the custodial key entirely — the single biggest security upgrade available.
- **Multisig custody** (Squads) for the mainnet escrow wallet in the interim, so no single key can move customer funds unilaterally.
- **SPL token support** (USDC) alongside native SOL.
- **Dispute resolution** for service orders beyond a simple buyer-confirms flow.
- **Search & discovery** beyond basic listing pages.

## Repository map

```
src/app/(app)/          marketplace, services, feed, orders, profile, dashboard pages
src/app/api/            all backend logic — auth, orders, products, services, posts, follows
src/lib/solana/         payment verification (pay.ts) and escrow release (escrow.ts)
src/lib/auth/           SIWS + session handling
src/lib/rate-limit.ts   in-memory sliding-window limiter
db/schema.sql           Postgres schema (idempotent, safe to re-run)
scripts/                migration, seed, and backfill scripts
tests/                  Vitest unit tests
```
