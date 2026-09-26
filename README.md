# SolGig

> The store AI agents buy from, on Solana. Every product is an HTTP 402 (x402) resource: ask for it, get a price in SOL or USDC, pay, retry, receive the file and an on-chain receipt. People can shop and hire here too, with program escrow on every service.

[![Solana](https://img.shields.io/badge/Chain-Solana-9945FF?logo=solana)](https://solana.com)
[![Next.js](https://img.shields.io/badge/Framework-Next.js_15-black?logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript)](https://typescriptlang.org)
[![CI](https://github.com/bryankwandou/solgig/actions/workflows/ci.yml/badge.svg)](https://github.com/bryankwandou/solgig/actions)

**Live:**
- Mainnet (real SOL): https://solgig-mainnet.vercel.app
- Devnet (demo, fake SOL): https://solgig.vercel.app

---

## What this is

An agent can't open a bank account or pass a card check. It can sign a Solana transaction. SolGig is built around that: a headless storefront with machine-readable listings, payment over plain HTTP 402, USDC or SOL, and a receipt backed by a transaction signature anyone can look up.

The human side (feed, profiles, services with escrow) is still there and shares the same listings, the same fee and the same on-chain checks. It is the supporting act, not the headline.

## Buying as an agent (x402)

```
GET  /api/agent/catalog                  every listing, prices in SOL and USDC, purchase URLs
GET  /api/agent/schema                   JSON Schema for everything below
GET  /api/agent/products/<slug>          402 Payment Required + payment terms
GET  /api/agent/products/<slug>          (again, with X-PAYMENT) -> 200 {receipt, delivery.fileUrl}
GET  /api/agent/receipts/<signature>     the receipt, any time, for anyone
```

1. **Ask.** `GET /api/agent/products/<slug>?payer=<pubkey>` returns `402` with `accepts[]`: one entry for SOL, one for USDC (when a SOL/USD quote is available). Each carries `maxAmountRequired`, `payTo`, a signed `extra.challenge` that locks the price for five minutes, the exact `extra.transfers` (seller net + 2.5% treasury fee) and, because `payer` was given, `extra.instructions` ready to sign (SystemProgram transfers, or SPL `TransferChecked` plus idempotent token-account creation for USDC).
2. **Pay.** Put those instructions in one transaction, sign, send, wait for confirmation.
3. **Prove.** Sign the text `SolGig x402 payment\nchallenge: <challenge>\nsignature: <tx signature>` with the same key. This stops anyone who merely sees your signature on-chain from claiming your purchase.
4. **Retry.** Same GET with `X-PAYMENT: base64(JSON {x402Version:1, scheme:"exact", network, payload:{asset, signature, challenge, payer, proof}})`.
5. **Receive.** `200` with `delivery.fileUrl` and a `solgig.receipt/v1` receipt (order number, asset, amount, fee, buyer, seller, signature, explorer link). The same receipt comes back base64-encoded in `X-PAYMENT-RESPONSE`.

What the server checks before handing anything over: the challenge signature and expiry, the network, the payer's proof, that the transaction succeeded after the challenge was issued, that the payer signed it, and the balance changes (lamports for SOL, token balances by owner and mint for USDC) for seller, treasury and buyer. A signature can settle exactly one purchase; repeating the same request returns the same receipt, anyone else presenting it gets `409`. Verification reuses `checkPayment` / `checkTokenPayment` in `src/lib/solana/pay.ts`; the fee split is `splitAmount` in `src/lib/fees.ts`, the same code the order routes use.

The older cookie-based flow (sign-in with a nonce, `POST /api/orders`, pay through the escrow program, `POST /api/orders/<id>/confirm`) still works and is described in the catalog under `how_to_transact`. Services go through it, because they need escrow.

Try it: `node scripts/agent-demo.mjs` (devnet; the SIWS + program flow) or read the x402 tests in `tests/x402.test.ts`.

## For people

- **Marketplace and services.** List a file or a service, set a price in SOL. Goods open once payment is verified; service money sits in a program-owned escrow account until the buyer releases it (or the seller refunds, or the buyer reclaims after 14 days).
- **Escrow program.** `programs/solgig-escrow`, written with Pinocchio: purchase receipts for goods and escrow for services, 14 KB binary, 24 end-to-end tests on Mollusk SVM.
- **Social layer.** Feed, likes, comments, follows, creator profiles, reviews tied to completed orders.
- **20 languages** in the UI.

## Why it's split into two deployments

Solana has two meaningfully different environments: **devnet** (free test SOL, for demos) and **mainnet-beta** (real money). Mixing them under one deployment risks a demo transaction touching a real wallet, or — worse — a misconfigured env var pointing a live payment at the wrong network. So SolGig ships as two entirely separate repos, Vercel projects, databases, and wallet keypairs:

| | Devnet (demo) | Mainnet (real) |
|---|---|---|
| Repo | `bryankwandou/solgig` | `bryankwandou/solgig-mainnet` |
| Deployment | solgig.vercel.app | solgig-mainnet.vercel.app |
| Database | Neon `neondb` (seeded with demo data) | Neon `solgig_mainnet` (empty, real users only) |
| Escrow / treasury wallets | Devnet-only keypairs, funded with faucet SOL | Independent mainnet keypairs |

A boot-time guard (`src/lib/db.ts`) refuses to start the app at all if `NEXT_PUBLIC_SOLANA_NETWORK` and `DATABASE_URL` don't agree on which environment they're in — so a copy-pasted env var can't silently cross-wire demo and real money.

## Architecture

```
Next.js 15 (App Router, TypeScript)
  ├─ Wallet Adapter (Phantom/Solflare/Backpack) ── client-side signing
  ├─ API routes (Node runtime) ── all business logic + on-chain verification
  │    ├─ Sign-In-With-Solana (nonce, verify, session)
  │    ├─ Products / Services / Orders / Reviews / Posts / Follows
  │    ├─ x402: 402 challenge, X-PAYMENT verification, receipts (src/lib/x402.ts)
  │    └─ Payment verification: pulls the tx from RPC, checks signer,
  │         amounts, and balance deltas (SOL or USDC) before trusting a "paid" claim
  ├─ Neon Postgres (serverless HTTP driver, no connection pooling needed)
  └─ solgig-escrow program (Pinocchio): receipts for goods, PDA escrow for services
```

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS v4, Framer Motion, Three.js |
| Chain | Solana Web3.js, `@solana/wallet-adapter-*` |
| Auth | Sign-In-With-Solana (nonce + ed25519 signature check via `tweetnacl`), JWT session (`jose`) |
| Database | Neon serverless Postgres (`@neondatabase/serverless`) |
| Validation | Zod on every API input |
| Testing | Vitest (auth, fees, payment checks, program encoding, routes, x402 flow) |
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

## What's next

- **x402 for services**: a 402 that opens a program escrow instead of paying the seller directly.
- **USDC in the escrow program**, so program-settled orders can take stablecoins too.
- **Agent budgets and allow-lists**: spending caps an owner sets for an agent wallet.
- **MCP server** wrapping the catalog and x402 flow, so agent frameworks can use SolGig as a tool.
- **Search & discovery** beyond the listing pages.

## Repository map

```
src/app/(app)/          marketplace, services, feed, orders, profile, dashboard pages
src/app/api/            all backend logic — auth, orders, products, services, posts, follows
src/lib/solana/         payment checks (pay.ts), program client (program.ts), USDC helpers (usdc.ts)
src/lib/x402.ts         HTTP 402 challenge, X-PAYMENT decoding, payment requirements
src/app/api/agent/      catalog, schema, x402 product resource, receipts
programs/solgig-escrow/ on-chain escrow program (Pinocchio)
src/lib/auth/           SIWS + session handling
src/lib/rate-limit.ts   in-memory sliding-window limiter
db/schema.sql           Postgres schema (idempotent, safe to re-run)
scripts/                migration, seed, and backfill scripts
tests/                  Vitest unit tests
```
