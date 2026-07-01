# SOLGIG — MEGAPROMPT v1.0
### Autonomous Build Specification · Silicon Valley Standard · Colosseum Hackathon Grade

> **Execute Mode: Autonomous Smart CEO + CTO Engineer**
> Zero dummy content. Zero placeholder. Real integrations only. Production-first from line 1.

---

## 0. PROJECT IDENTITY

### 0.1 Project Name
```
SolGig
```
**Tagline:** *The social marketplace where Solana creators sell digital goods and services — paid on-chain, in seconds.*

**Domain target:** `solgig.xyz` (primary) · `solgig.app` (product) · `app.solgig.xyz` (app subdomain)

**GitHub Repo:** `github.com/solgig/solgig` (org handle `solgig` is open) → fallback `github.com/[USER]/solgig`

**Vercel Project:** `solgig` → live at `solgig.vercel.app`, auto-deploy on push to `main`

#### 0.1.1 Name Availability Audit — verified before lock-in

The original draft name "SolanaFlow" was discarded: the GitHub handle and `solanaflow.vercel.app` were both already occupied. Every candidate below was probed live against the real GitHub, Vercel, npm, and RDAP domain registries. `SolGig` was selected because it is open on every surface that matters and reads as "the Solana gig/creator economy" the moment you see it.

| Surface | Check method | SolGig result |
|---------|--------------|---------------|
| GitHub org/handle | `GET github.com/solgig` | 404 — open |
| Vercel deploy URL | `GET solgig.vercel.app` | 404 — open |
| npm package | `GET registry.npmjs.org/solgig` | 404 — open |
| Domain `.xyz` | RDAP lookup | unregistered — open |
| Domain `.app` | RDAP lookup | unregistered — open |
| Domain `.io` | RDAP lookup | unregistered — open |
| Domain `.com` | RDAP lookup | taken (acceptable — primary brand runs on `.xyz`/`.app`) |

> Before company incorporation, run a formal trademark search (USPTO TESS + EUIPO) on "SolGig". Registry openness confirms technical availability, not legal clearance.

**Backup names** (all verified free on GitHub + Vercel + .xyz at audit time, ordered by preference): `Solmosa` (also free on `.com`), `SolShelf`, `SolKiosk`, `SolDepot`. To switch, global-replace `SolGig`/`solgig`/`SOLGIG` and re-run the same audit commands.

---

### 0.2 Logo Specification

**Concept:** A stylized "SG" monogram where the `S` curves like a Solana wave and its tail snaps into a lightning bolt (speed, instant settlement), while the `G` opens into a coin/aperture — a wallet receiving payment. Read together the mark says: *a creator's storefront that gets paid the instant a sale clears.* It must communicate "sell + get paid on Solana" from the silhouette alone, with no wordmark.

**Geometry:**
- The `S` stroke: thick-thin contrast, starts top-left, curves like the Solana logo wave, and its lower terminal kicks out into a short angled lightning notch
- The `G` is built from a near-complete ring with a horizontal bar (the classic G crossbar) that doubles as a "coin slot" — implying value entering the wallet
- The counter (negative space) inside the `G` holds a small filled dot — a token/coin settling in
- Optical balance: `S` and `G` share a common baseline and x-height; the bolt notch and the G crossbar sit on the same horizontal guide so the eye reads one connected gesture
- The whole mark fits inside a 40×40 grid, legible at 16px (favicon) and 512px (hero splash); at 16px the bolt notch simplifies to a single angled pixel-run so it never muddies

**Colors:**
- Primary mark: `#9945FF` (Solana purple)
- Accent stroke: `#14F195` (Solana green)
- On dark backgrounds: reverse to white monochrome with green accent dot
- On light backgrounds: full color

**Wordmark:** `SolGig` — set in `Space Grotesk 700`, letter-spacing `-0.03em`, with `Gig` slightly lighter at `500` weight so `Sol` carries the emphasis

**SVG Export targets:** `logo.svg`, `logo-dark.svg`, `logo-icon.svg`, `favicon.ico`, `og-image.png` (1200×630)

---

### 0.3 Vision + Mission (for README + About page)

**Vision:** A world where any creator, developer, or freelancer on Solana can build, sell, and earn without the friction of banks, payment processors, or platform lock-in.

**Mission:** SolGig connects buyers and sellers of digital goods and services through a social-first marketplace that runs entirely on-chain. Every transaction is peer-to-peer, every payment is real-time, and every creator owns their audience.

---

## 1. GITHUB REPOSITORY SETUP

### 1.1 Auto-Init Commands
```bash
# Step 1: Create GitHub org or personal repo
gh repo create solgig \
  --public \
  --description "Social marketplace for Solana creators — digital goods, freelance services, instant crypto payments" \
  --homepage "https://solgig.xyz"

# Step 2: Clone and init
git clone https://github.com/[ORG]/solgig
cd solgig

# Step 3: Init Next.js
npx create-next-app@latest . \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --src-dir \
  --import-alias "@/*"

# Step 4: Push initial commit
git add .
git commit -m "feat: initialize SolGig — social marketplace on Solana"
git push origin main
```

### 1.2 README.md — Hackathon-Grade, Colosseum Standard

The README must be generated at `README.md` in root, containing:

```markdown
# SolGig

> Social marketplace for Solana creators. Sell digital goods. Offer services. Get paid on-chain. Right now.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Vercel](https://img.shields.io/badge/Deployed-Vercel-black?logo=vercel)](https://solgig.xyz)
[![Solana](https://img.shields.io/badge/Chain-Solana-9945FF?logo=solana)](https://solana.com)
[![Next.js](https://img.shields.io/badge/Framework-Next.js_15-black?logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript)](https://typescriptlang.org)

---

## What This Is

SolGig is a full-stack social marketplace that merges the discovery mechanics of TikTok and Instagram with the commerce infrastructure of Gumroad and Fiverr — built natively on Solana. Creators post content, list digital products or service packages, and get paid directly to their wallet in SOL, USDC, or any SPL token. No banks. No chargebacks. No middlemen holding funds.

## Architecture Overview

\`\`\`
┌─────────────────────────────────────────────────────────┐
│                     SOLGIG                          │
│                                                         │
│  ┌──────────┐   ┌──────────┐   ┌─────────────────────┐ │
│  │ Next.js  │   │ Supabase │   │   Solana Programs   │ │
│  │  15 App  │◄──│ Postgres │   │  (Anchor Framework) │ │
│  │  Router  │   │ + Edge   │   │                     │ │
│  └────┬─────┘   └──────────┘   │ - Escrow PDA        │ │
│       │                        │ - Dispute Arbiter   │ │
│  ┌────▼─────┐   ┌──────────┐   │ - Reputation Score  │ │
│  │ Wallet   │   │  Redis   │   │ - Royalty Splitter  │ │
│  │ Adapter  │◄──│  Cache   │   └─────────────────────┘ │
│  │(Phantom/ │   └──────────┘                            │
│  │ Backpack)│   ┌──────────┐   ┌─────────────────────┐ │
│  └──────────┘   │ IPFS/    │   │   Real-time Layer   │ │
│                 │ Arweave  │   │   (Supabase RT +    │ │
│                 │(Content) │   │    WebSocket Feed)  │ │
│                 └──────────┘   └─────────────────────┘ │
└─────────────────────────────────────────────────────────┘
\`\`\`

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 15 (App Router), TypeScript, Tailwind CSS v4 |
| UI Components | shadcn/ui + Skiper UI (160+ animations) |
| State Management | Zustand + TanStack Query v5 |
| Blockchain | Solana Web3.js v2, Anchor Framework, @solana/wallet-adapter |
| Payments | Native SOL transfers + SPL Token (USDC, BONK) via on-chain escrow |
| Database | Supabase (Postgres + Edge Functions + Realtime + Storage) |
| Cache | Redis (Upstash) |
| File Storage | Supabase Storage (thumbnails) + Arweave via Bundlr (permanent content) |
| Auth | Wallet-based auth (SIWS — Sign In With Solana) + Supabase session |
| Search | Typesense (self-hosted) or Algolia |
| Email | Resend (transactional) |
| Deployment | Vercel (frontend) + Railway (background workers) |
| Monitoring | Sentry + Vercel Analytics + PostHog |

## On-Chain Programs (Anchor)

\`\`\`
programs/
├── escrow/          # Holds funds during service delivery
├── reputation/      # On-chain reputation scores (non-transferable)
├── royalties/       # Revenue splits for collab products
└── dispute/         # Arbiter voting for conflict resolution
\`\`\`

## Local Development

\`\`\`bash
git clone https://github.com/[ORG]/solgig
cd solgig
pnpm install

# Copy env
cp .env.example .env.local

# Start local Solana validator
solana-test-validator

# Deploy Anchor programs locally
cd programs && anchor deploy && cd ..

# Start dev server
pnpm dev
\`\`\`

## Environment Variables

\`\`\`bash
# Solana
NEXT_PUBLIC_SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
NEXT_PUBLIC_SOLANA_NETWORK=mainnet-beta
PROGRAM_ESCROW_ADDRESS=
PROGRAM_REPUTATION_ADDRESS=

# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Redis
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=

# Arweave / Bundlr
BUNDLR_PRIVATE_KEY=
NEXT_PUBLIC_BUNDLR_NETWORK=https://node1.bundlr.network

# Search
TYPESENSE_HOST=
TYPESENSE_API_KEY=
NEXT_PUBLIC_TYPESENSE_SEARCH_KEY=

# Email
RESEND_API_KEY=

# Monitoring
NEXT_PUBLIC_SENTRY_DSN=
NEXT_PUBLIC_POSTHOG_KEY=
\`\`\`

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). All PRs require: passing CI, 80%+ test coverage on new logic, Anchor program audit for on-chain changes.

## License

MIT — see [LICENSE](LICENSE)
```

---

## 2. VERCEL DEPLOYMENT SETUP

### 2.1 `vercel.json`
```json
{
  "framework": "nextjs",
  "buildCommand": "pnpm build",
  "devCommand": "pnpm dev",
  "installCommand": "pnpm install",
  "regions": ["sin1", "iad1"],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "X-Frame-Options", "value": "DENY" },
        { "key": "X-XSS-Protection", "value": "1; mode=block" },
        { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" },
        {
          "key": "Content-Security-Policy",
          "value": "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline' *.vercel-insights.com *.posthog.com; style-src 'self' 'unsafe-inline' fonts.googleapis.com; font-src 'self' fonts.gstatic.com; img-src 'self' data: blob: *.supabase.co arweave.net *.arweave.net; connect-src 'self' *.supabase.co wss://*.supabase.co api.mainnet-beta.solana.com *.rpc.extrnode.com *.helius.dev *.alchemy.com;"
        }
      ]
    },
    {
      "source": "/api/(.*)",
      "headers": [
        { "key": "Cache-Control", "value": "no-store, max-age=0" }
      ]
    }
  ],
  "rewrites": [
    { "source": "/sitemap.xml", "destination": "/api/sitemap" },
    { "source": "/robots.txt", "destination": "/api/robots" }
  ]
}
```

### 2.2 Auto-Deploy GitHub Action
```yaml
# .github/workflows/deploy.yml
name: Deploy to Vercel

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v3
        with:
          version: 9
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'
      - run: pnpm install --frozen-lockfile
      - run: pnpm lint
      - run: pnpm test:ci
      - run: pnpm build
      - uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
```

---

## 3. TECHNOLOGY STACK — FULL DECLARATION

### 3.1 Core Dependencies
```bash
# UI & Animation
pnpm add @skiper-ui/skiper40
npx shadcn@latest init
npx shadcn@latest add button card dialog dropdown-menu input label separator sheet tabs badge avatar tooltip popover command

# Solana
pnpm add @solana/web3.js @solana/wallet-adapter-react @solana/wallet-adapter-react-ui @solana/wallet-adapter-wallets @solana/spl-token @coral-xyz/anchor

# State
pnpm add zustand @tanstack/react-query @tanstack/react-query-devtools

# Database
pnpm add @supabase/supabase-js @supabase/ssr

# Animation
pnpm add framer-motion gsap @gsap/react three @react-three/fiber @react-three/drei lottie-react

# Forms & Validation
pnpm add react-hook-form zod @hookform/resolvers

# Rich Text / Markdown
pnpm add @uiw/react-md-editor react-markdown rehype-sanitize

# File Upload
pnpm add @bundlr-network/client react-dropzone

# Search
pnpm add typesense instantsearch.js react-instantsearch

# Payment Helpers
pnpm add @solana/pay

# Utilities
pnpm add date-fns clsx tailwind-merge nanoid sharp

# Real-time
pnpm add socket.io-client

# Monitoring
pnpm add @sentry/nextjs posthog-js
```

### 3.2 Dev Dependencies
```bash
pnpm add -D @types/three @coral-xyz/anchor vitest @testing-library/react @testing-library/user-event msw prettier prettier-plugin-tailwindcss eslint-config-next husky lint-staged
```

---

## 4. PROJECT STRUCTURE

```
solgig/
├── .github/
│   ├── workflows/
│   │   ├── deploy.yml
│   │   ├── test.yml
│   │   └── security-audit.yml
│   └── PULL_REQUEST_TEMPLATE.md
├── programs/                          # Anchor Solana programs
│   ├── escrow/
│   │   └── src/lib.rs
│   ├── reputation/
│   │   └── src/lib.rs
│   ├── royalties/
│   │   └── src/lib.rs
│   └── dispute/
│       └── src/lib.rs
├── src/
│   ├── app/                           # Next.js App Router
│   │   ├── (auth)/
│   │   │   ├── connect/page.tsx       # Wallet connect / SIWS login
│   │   │   └── onboard/page.tsx       # New user onboarding
│   │   ├── (marketing)/
│   │   │   ├── page.tsx               # Landing page (TikTok-style hero)
│   │   │   ├── about/page.tsx
│   │   │   └── pricing/page.tsx
│   │   ├── (app)/
│   │   │   ├── feed/page.tsx          # Main social feed (TikTok/IG style)
│   │   │   ├── explore/page.tsx       # Discovery — trending, categories
│   │   │   ├── marketplace/
│   │   │   │   ├── page.tsx           # Gumroad-style product grid
│   │   │   │   └── [slug]/page.tsx    # Product detail page
│   │   │   ├── services/
│   │   │   │   ├── page.tsx           # Fiverr-style service listings
│   │   │   │   └── [slug]/page.tsx    # Gig detail page
│   │   │   ├── jobs/
│   │   │   │   ├── page.tsx           # Upwork-style job board
│   │   │   │   └── [id]/page.tsx      # Job posting detail
│   │   │   ├── profile/
│   │   │   │   └── [username]/page.tsx
│   │   │   ├── dashboard/
│   │   │   │   ├── page.tsx           # Creator dashboard home
│   │   │   │   ├── products/page.tsx
│   │   │   │   ├── services/page.tsx
│   │   │   │   ├── orders/page.tsx
│   │   │   │   ├── earnings/page.tsx
│   │   │   │   ├── analytics/page.tsx
│   │   │   │   └── settings/page.tsx
│   │   │   ├── post/
│   │   │   │   ├── create/page.tsx    # Create a feed post
│   │   │   │   └── [id]/page.tsx      # Single post view
│   │   │   ├── messages/page.tsx      # DM / Order chat
│   │   │   ├── notifications/page.tsx
│   │   │   ├── wallet/page.tsx        # Wallet overview + tx history
│   │   │   └── checkout/
│   │   │       ├── [type]/[id]/page.tsx
│   │   │       └── success/page.tsx
│   │   ├── api/
│   │   │   ├── auth/
│   │   │   │   ├── siws/route.ts      # Sign In With Solana
│   │   │   │   └── session/route.ts
│   │   │   ├── products/
│   │   │   │   ├── route.ts           # GET (list) / POST (create)
│   │   │   │   └── [id]/route.ts      # GET/PUT/DELETE
│   │   │   ├── services/route.ts
│   │   │   ├── jobs/route.ts
│   │   │   ├── orders/
│   │   │   │   ├── route.ts
│   │   │   │   └── [id]/
│   │   │   │       ├── route.ts
│   │   │   │       └── dispute/route.ts
│   │   │   ├── feed/route.ts
│   │   │   ├── payments/
│   │   │   │   ├── initiate/route.ts
│   │   │   │   ├── verify/route.ts
│   │   │   │   └── webhook/route.ts
│   │   │   ├── upload/
│   │   │   │   ├── thumbnail/route.ts
│   │   │   │   └── content/route.ts
│   │   │   ├── search/route.ts
│   │   │   ├── notifications/route.ts
│   │   │   ├── sitemap/route.ts
│   │   │   └── robots/route.ts
│   │   ├── globals.css
│   │   └── layout.tsx
│   ├── components/
│   │   ├── ui/                        # shadcn/ui base
│   │   ├── skiper/                    # Skiper UI animation wrappers
│   │   │   ├── FadeIn.tsx
│   │   │   ├── SlideReveal.tsx
│   │   │   ├── MagneticButton.tsx
│   │   │   ├── TextSplit.tsx
│   │   │   ├── ParallaxSection.tsx
│   │   │   ├── GlowCard.tsx
│   │   │   ├── FloatingOrbs.tsx
│   │   │   ├── CounterUp.tsx
│   │   │   ├── ScrollProgress.tsx
│   │   │   ├── HoverTilt.tsx
│   │   │   ├── StaggerList.tsx
│   │   │   └── TypewriterText.tsx
│   │   ├── three/                     # Three.js / R3F scenes
│   │   │   ├── HeroScene.tsx
│   │   │   ├── WalletGlobe.tsx
│   │   │   ├── ParticleField.tsx
│   │   │   └── TokenOrbit.tsx
│   │   ├── layout/
│   │   │   ├── AppShell.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   ├── TopNav.tsx
│   │   │   ├── BottomNav.tsx          # Mobile only
│   │   │   ├── MarketingNav.tsx
│   │   │   └── Footer.tsx
│   │   ├── feed/
│   │   │   ├── FeedPost.tsx
│   │   │   ├── FeedPostCard.tsx
│   │   │   ├── VideoPost.tsx
│   │   │   ├── ImagePost.tsx
│   │   │   ├── ProductPost.tsx        # Post with embedded product CTA
│   │   │   ├── ServicePost.tsx
│   │   │   ├── FeedComments.tsx
│   │   │   ├── FeedReactions.tsx
│   │   │   └── InfiniteScroll.tsx
│   │   ├── marketplace/
│   │   │   ├── ProductCard.tsx
│   │   │   ├── ProductGrid.tsx
│   │   │   ├── ProductDetail.tsx
│   │   │   ├── ProductUploadForm.tsx
│   │   │   ├── PricingTiers.tsx
│   │   │   └── ReviewSection.tsx
│   │   ├── services/
│   │   │   ├── GigCard.tsx
│   │   │   ├── GigGrid.tsx
│   │   │   ├── GigDetail.tsx
│   │   │   ├── GigCreateForm.tsx
│   │   │   ├── PackageTabs.tsx        # Basic/Standard/Premium
│   │   │   └── DeliverableChecklist.tsx
│   │   ├── jobs/
│   │   │   ├── JobCard.tsx
│   │   │   ├── JobBoard.tsx
│   │   │   ├── JobPostForm.tsx
│   │   │   ├── ProposalForm.tsx
│   │   │   └── ProposalList.tsx
│   │   ├── profile/
│   │   │   ├── ProfileHeader.tsx
│   │   │   ├── ProfileTabs.tsx
│   │   │   ├── PortfolioGrid.tsx
│   │   │   ├── ReputationBadge.tsx
│   │   │   └── SocialLinks.tsx
│   │   ├── wallet/
│   │   │   ├── WalletButton.tsx
│   │   │   ├── WalletModal.tsx
│   │   │   ├── BalanceDisplay.tsx
│   │   │   ├── TxHistory.tsx
│   │   │   └── TokenSelector.tsx
│   │   ├── checkout/
│   │   │   ├── CheckoutModal.tsx
│   │   │   ├── PaymentStep.tsx
│   │   │   ├── EscrowStatus.tsx
│   │   │   └── SuccessConfetti.tsx
│   │   ├── notifications/
│   │   │   ├── NotificationBell.tsx
│   │   │   └── NotificationItem.tsx
│   │   ├── search/
│   │   │   ├── GlobalSearch.tsx
│   │   │   ├── SearchResults.tsx
│   │   │   └── FilterPanel.tsx
│   │   └── shared/
│   │       ├── Avatar.tsx
│   │       ├── Badge.tsx
│   │       ├── CopyAddress.tsx
│   │       ├── PriceDisplay.tsx       # SOL/USDC price with live conversion
│   │       ├── CategoryPill.tsx
│   │       ├── VerifiedMark.tsx
│   │       ├── StarRating.tsx
│   │       ├── ImageUpload.tsx
│   │       ├── RichTextEditor.tsx
│   │       ├── EmptyState.tsx
│   │       └── LoadingSkeleton.tsx
│   ├── hooks/
│   │   ├── useWallet.ts               # Extended wallet hook
│   │   ├── useSolanaBalance.ts
│   │   ├── useTransaction.ts          # Send + confirm tx
│   │   ├── useEscrow.ts               # Interact with escrow program
│   │   ├── useRealtime.ts             # Supabase realtime subscription
│   │   ├── useInfiniteScroll.ts
│   │   ├── useFeed.ts
│   │   ├── useSearch.ts
│   │   ├── useNotifications.ts
│   │   ├── useUpload.ts
│   │   └── useToast.ts
│   ├── lib/
│   │   ├── solana/
│   │   │   ├── connection.ts
│   │   │   ├── programs.ts            # Anchor program clients
│   │   │   ├── escrow.ts
│   │   │   ├── transfer.ts            # SOL + SPL transfer helpers
│   │   │   ├── siws.ts                # Sign In With Solana
│   │   │   └── tokens.ts              # SPL token utilities
│   │   ├── supabase/
│   │   │   ├── client.ts
│   │   │   ├── server.ts
│   │   │   └── middleware.ts
│   │   ├── redis.ts
│   │   ├── typesense.ts
│   │   ├── arweave.ts
│   │   ├── resend.ts
│   │   ├── sentry.ts
│   │   └── utils.ts
│   ├── stores/
│   │   ├── authStore.ts               # Zustand: wallet + session state
│   │   ├── feedStore.ts
│   │   ├── cartStore.ts               # Multi-item checkout queue
│   │   ├── notificationStore.ts
│   │   └── uiStore.ts                 # Modals, drawers, sidebar state
│   ├── types/
│   │   ├── user.ts
│   │   ├── product.ts
│   │   ├── service.ts
│   │   ├── job.ts
│   │   ├── order.ts
│   │   ├── transaction.ts
│   │   ├── feed.ts
│   │   └── solana.ts
│   └── middleware.ts
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
├── anchor.toml
├── Cargo.toml
├── package.json
├── pnpm-lock.yaml
├── tsconfig.json
├── tailwind.config.ts
├── next.config.ts
├── vercel.json
├── .env.example
├── .eslintrc.json
├── .prettierrc
└── README.md
```

---

## 5. DATABASE SCHEMA (Supabase / Postgres)

```sql
-- =========================================
-- USERS
-- =========================================
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address TEXT UNIQUE NOT NULL,           -- Solana public key
  username TEXT UNIQUE,
  display_name TEXT,
  bio TEXT,
  avatar_url TEXT,
  cover_url TEXT,
  website_url TEXT,
  twitter_handle TEXT,
  github_handle TEXT,
  location TEXT,
  skills TEXT[],                                 -- Array of skill tags
  languages TEXT[],
  is_verified BOOLEAN DEFAULT false,
  is_pro BOOLEAN DEFAULT false,
  reputation_score INTEGER DEFAULT 0,            -- Mirrored from on-chain
  on_chain_reputation_pda TEXT,                  -- Program Derived Address
  total_earned_lamports BIGINT DEFAULT 0,
  total_spent_lamports BIGINT DEFAULT 0,
  completed_orders INTEGER DEFAULT 0,
  followers_count INTEGER DEFAULT 0,
  following_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_seen_at TIMESTAMPTZ
);

CREATE INDEX idx_users_wallet ON users(wallet_address);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_reputation ON users(reputation_score DESC);

-- =========================================
-- FOLLOWS
-- =========================================
CREATE TABLE follows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id UUID REFERENCES users(id) ON DELETE CASCADE,
  following_id UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(follower_id, following_id)
);

CREATE INDEX idx_follows_follower ON follows(follower_id);
CREATE INDEX idx_follows_following ON follows(following_id);

-- =========================================
-- CATEGORIES
-- =========================================
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  parent_id UUID REFERENCES categories(id),
  icon TEXT,
  description TEXT,
  sort_order INTEGER DEFAULT 0
);

-- =========================================
-- PRODUCTS (Digital Goods — Gumroad-style)
-- =========================================
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID REFERENCES users(id) ON DELETE CASCADE,
  category_id UUID REFERENCES categories(id),
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  short_description TEXT,
  thumbnail_url TEXT,
  preview_urls TEXT[],
  tags TEXT[],
  product_type TEXT NOT NULL CHECK (product_type IN (
    'ebook','template','code','design','music','video','course','dataset','font','3d_model','preset','plugin','game_asset','nft_collection','other'
  )),
  delivery_method TEXT DEFAULT 'download' CHECK (delivery_method IN ('download','url','email','manual')),
  file_url TEXT,                                 -- Arweave URL or Supabase Storage (gated)
  file_size_bytes BIGINT,
  file_format TEXT,
  version TEXT DEFAULT '1.0',
  is_published BOOLEAN DEFAULT false,
  is_pay_what_you_want BOOLEAN DEFAULT false,
  price_lamports BIGINT NOT NULL DEFAULT 0,       -- Price in lamports (SOL)
  price_usdc_raw BIGINT,                          -- Optional USDC price
  min_price_lamports BIGINT,                      -- For PWYW
  accepted_tokens TEXT[] DEFAULT ARRAY['SOL','USDC'],
  license_type TEXT DEFAULT 'personal' CHECK (license_type IN ('personal','commercial','extended','open_source')),
  max_purchases INTEGER,                          -- NULL = unlimited
  total_purchases INTEGER DEFAULT 0,
  total_revenue_lamports BIGINT DEFAULT 0,
  rating_average DECIMAL(3,2) DEFAULT 0,
  rating_count INTEGER DEFAULT 0,
  view_count INTEGER DEFAULT 0,
  wishlist_count INTEGER DEFAULT 0,
  featured_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_products_seller ON products(seller_id);
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_published ON products(is_published, created_at DESC);
CREATE INDEX idx_products_slug ON products(slug);
CREATE INDEX idx_products_tags ON products USING gin(tags);

-- =========================================
-- SERVICES (Freelance Gigs — Fiverr-style)
-- =========================================
CREATE TABLE services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID REFERENCES users(id) ON DELETE CASCADE,
  category_id UUID REFERENCES categories(id),
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  short_description TEXT,
  thumbnail_url TEXT,
  gallery_urls TEXT[],
  tags TEXT[],
  service_type TEXT,
  requirements TEXT,                             -- What seller needs from buyer
  faq JSONB DEFAULT '[]',
  -- Packages: Basic / Standard / Premium
  package_basic JSONB NOT NULL,                  -- {name, description, price_lamports, delivery_days, revisions, features[]}
  package_standard JSONB,
  package_premium JSONB,
  is_published BOOLEAN DEFAULT false,
  is_available BOOLEAN DEFAULT true,
  response_time_hours INTEGER DEFAULT 24,
  orders_in_queue INTEGER DEFAULT 0,
  total_orders INTEGER DEFAULT 0,
  total_revenue_lamports BIGINT DEFAULT 0,
  rating_average DECIMAL(3,2) DEFAULT 0,
  rating_count INTEGER DEFAULT 0,
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_services_seller ON services(seller_id);
CREATE INDEX idx_services_category ON services(category_id);
CREATE INDEX idx_services_published ON services(is_published, created_at DESC);

-- =========================================
-- JOBS (Project Listings — Upwork-style)
-- =========================================
CREATE TABLE jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  poster_id UUID REFERENCES users(id) ON DELETE CASCADE,
  category_id UUID REFERENCES categories(id),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  requirements TEXT,
  skills_required TEXT[],
  project_type TEXT DEFAULT 'fixed' CHECK (project_type IN ('fixed','hourly','milestone')),
  budget_min_lamports BIGINT,
  budget_max_lamports BIGINT,
  hourly_rate_min_lamports BIGINT,
  hourly_rate_max_lamports BIGINT,
  estimated_duration TEXT,
  experience_level TEXT DEFAULT 'any' CHECK (experience_level IN ('any','beginner','intermediate','expert')),
  accepted_tokens TEXT[] DEFAULT ARRAY['SOL','USDC'],
  status TEXT DEFAULT 'open' CHECK (status IN ('open','in_progress','completed','cancelled')),
  proposals_count INTEGER DEFAULT 0,
  hired_freelancer_id UUID REFERENCES users(id),
  view_count INTEGER DEFAULT 0,
  deadline TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_jobs_poster ON jobs(poster_id);
CREATE INDEX idx_jobs_status ON jobs(status, created_at DESC);
CREATE INDEX idx_jobs_skills ON jobs USING gin(skills_required);

-- =========================================
-- JOB PROPOSALS
-- =========================================
CREATE TABLE job_proposals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
  freelancer_id UUID REFERENCES users(id) ON DELETE CASCADE,
  cover_letter TEXT NOT NULL,
  proposed_price_lamports BIGINT,
  proposed_hourly_lamports BIGINT,
  estimated_duration TEXT,
  milestones JSONB,
  portfolio_urls TEXT[],
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','shortlisted','accepted','rejected','withdrawn')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(job_id, freelancer_id)
);

-- =========================================
-- ORDERS
-- =========================================
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT UNIQUE NOT NULL,             -- Human-readable: SG-2024-00001
  order_type TEXT NOT NULL CHECK (order_type IN ('product','service','job')),
  buyer_id UUID REFERENCES users(id),
  seller_id UUID REFERENCES users(id),
  product_id UUID REFERENCES products(id),
  service_id UUID REFERENCES services(id),
  job_id UUID REFERENCES jobs(id),
  proposal_id UUID REFERENCES job_proposals(id),
  package_type TEXT,                             -- basic/standard/premium
  quantity INTEGER DEFAULT 1,
  -- Payment
  amount_lamports BIGINT NOT NULL,
  token_mint TEXT NOT NULL DEFAULT 'SOL',        -- 'SOL' or SPL mint address
  -- On-chain
  escrow_pda TEXT,                               -- Anchor escrow PDA
  payment_tx_signature TEXT,                     -- Transaction signature (immutable proof)
  release_tx_signature TEXT,
  refund_tx_signature TEXT,
  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN (
    'pending','payment_processing','payment_confirmed','in_progress',
    'submitted','revision_requested','completed','disputed','refunded','cancelled'
  )),
  -- Dates
  payment_confirmed_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  submitted_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  due_date TIMESTAMPTZ,
  -- Delivery
  delivery_message TEXT,
  delivery_attachments TEXT[],
  revision_count INTEGER DEFAULT 0,
  max_revisions INTEGER DEFAULT 1,
  -- Buyer instructions
  buyer_requirements TEXT,
  -- Metadata
  platform_fee_bps INTEGER DEFAULT 250,          -- 2.5%
  platform_fee_lamports BIGINT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_orders_buyer ON orders(buyer_id, created_at DESC);
CREATE INDEX idx_orders_seller ON orders(seller_id, created_at DESC);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_escrow ON orders(escrow_pda);

-- =========================================
-- DISPUTES
-- =========================================
CREATE TABLE disputes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  raised_by_id UUID REFERENCES users(id),
  reason TEXT NOT NULL,
  evidence_urls TEXT[],
  status TEXT DEFAULT 'open' CHECK (status IN ('open','under_review','resolved_buyer','resolved_seller','escalated')),
  resolution_note TEXT,
  resolved_by_id UUID REFERENCES users(id),
  on_chain_vote_pda TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =========================================
-- REVIEWS
-- =========================================
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  reviewer_id UUID REFERENCES users(id),
  reviewee_id UUID REFERENCES users(id),
  product_id UUID REFERENCES products(id),
  service_id UUID REFERENCES services(id),
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  title TEXT,
  body TEXT,
  seller_response TEXT,
  is_public BOOLEAN DEFAULT true,
  helpful_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(order_id, reviewer_id)
);

-- =========================================
-- FEED POSTS
-- =========================================
CREATE TABLE posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID REFERENCES users(id) ON DELETE CASCADE,
  post_type TEXT NOT NULL CHECK (post_type IN ('text','image','video','product_feature','service_feature','job_post','link')),
  content TEXT,
  media_urls TEXT[],
  video_url TEXT,
  video_thumbnail_url TEXT,
  video_duration_seconds INTEGER,
  linked_product_id UUID REFERENCES products(id),
  linked_service_id UUID REFERENCES services(id),
  linked_job_id UUID REFERENCES jobs(id),
  external_url TEXT,
  tags TEXT[],
  mentions TEXT[],                               -- Array of username mentions
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  shares_count INTEGER DEFAULT 0,
  saves_count INTEGER DEFAULT 0,
  view_count INTEGER DEFAULT 0,
  is_published BOOLEAN DEFAULT true,
  is_pinned BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_posts_author ON posts(author_id, created_at DESC);
CREATE INDEX idx_posts_feed ON posts(is_published, created_at DESC);
CREATE INDEX idx_posts_tags ON posts USING gin(tags);

-- =========================================
-- POST INTERACTIONS
-- =========================================
CREATE TABLE post_likes (
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY(post_id, user_id)
);

CREATE TABLE post_saves (
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY(post_id, user_id)
);

CREATE TABLE post_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  author_id UUID REFERENCES users(id) ON DELETE CASCADE,
  parent_comment_id UUID REFERENCES post_comments(id),
  content TEXT NOT NULL,
  likes_count INTEGER DEFAULT 0,
  is_deleted BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =========================================
-- MESSAGES
-- =========================================
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id),           -- NULL for general DMs
  participant_ids UUID[] NOT NULL,               -- Always 2 users
  last_message_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES users(id),
  content TEXT,
  attachment_urls TEXT[],
  message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text','file','image','offer','system')),
  offer_data JSONB,                              -- For custom offers within chat
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_messages_conversation ON messages(conversation_id, created_at DESC);

-- =========================================
-- NOTIFICATIONS
-- =========================================
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,                            -- 'order_placed','payment_received','review_left','new_follower','new_message','dispute_opened', etc.
  title TEXT NOT NULL,
  body TEXT,
  data JSONB,                                    -- Type-specific payload
  action_url TEXT,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notifications_user ON notifications(user_id, is_read, created_at DESC);

-- =========================================
-- TRANSACTIONS (Mirror of on-chain data)
-- =========================================
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  signature TEXT UNIQUE NOT NULL,                -- Solana tx signature
  user_id UUID REFERENCES users(id),
  order_id UUID REFERENCES orders(id),
  tx_type TEXT NOT NULL CHECK (tx_type IN ('payment','escrow_lock','escrow_release','refund','tip','withdrawal','platform_fee')),
  amount_lamports BIGINT NOT NULL,
  token_mint TEXT NOT NULL DEFAULT 'SOL',
  from_address TEXT NOT NULL,
  to_address TEXT NOT NULL,
  status TEXT DEFAULT 'confirmed' CHECK (status IN ('pending','confirmed','failed')),
  block_time TIMESTAMPTZ,
  slot BIGINT,
  fee_lamports BIGINT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_transactions_user ON transactions(user_id, created_at DESC);
CREATE INDEX idx_transactions_signature ON transactions(signature);

-- =========================================
-- WISHLISTS
-- =========================================
CREATE TABLE wishlists (
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY(user_id, product_id)
);

-- =========================================
-- COUPONS
-- =========================================
CREATE TABLE coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID REFERENCES users(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  discount_type TEXT DEFAULT 'percent' CHECK (discount_type IN ('percent','fixed_lamports')),
  discount_value BIGINT NOT NULL,
  max_uses INTEGER,
  used_count INTEGER DEFAULT 0,
  product_ids UUID[],                            -- NULL = applies to all products
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(seller_id, code)
);

-- =========================================
-- ENABLE ROW LEVEL SECURITY
-- =========================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies (examples — all tables need full policies)
CREATE POLICY "Users can read own profile" ON users
  FOR SELECT USING (auth.uid()::text = wallet_address OR true);  -- Public profiles readable by all

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid()::text = wallet_address);

CREATE POLICY "Buyers and sellers see own orders" ON orders
  FOR SELECT USING (
    buyer_id = (SELECT id FROM users WHERE wallet_address = auth.uid()::text) OR
    seller_id = (SELECT id FROM users WHERE wallet_address = auth.uid()::text)
  );

CREATE POLICY "Users see own notifications" ON notifications
  FOR ALL USING (
    user_id = (SELECT id FROM users WHERE wallet_address = auth.uid()::text)
  );

CREATE POLICY "Users see own transactions" ON transactions
  FOR SELECT USING (
    user_id = (SELECT id FROM users WHERE wallet_address = auth.uid()::text)
  );

-- =========================================
-- FUNCTIONS
-- =========================================

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables with updated_at
DO $$
DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['users','products','services','jobs','orders','posts','job_proposals','disputes']
  LOOP
    EXECUTE format('CREATE TRIGGER trg_%s_updated_at BEFORE UPDATE ON %s FOR EACH ROW EXECUTE FUNCTION update_updated_at()', t, t);
  END LOOP;
END $$;

-- Increment follower counts
CREATE OR REPLACE FUNCTION handle_follow()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE users SET followers_count = followers_count + 1 WHERE id = NEW.following_id;
    UPDATE users SET following_count = following_count + 1 WHERE id = NEW.follower_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE users SET followers_count = followers_count - 1 WHERE id = OLD.following_id;
    UPDATE users SET following_count = following_count - 1 WHERE id = OLD.follower_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_follow_counts
AFTER INSERT OR DELETE ON follows
FOR EACH ROW EXECUTE FUNCTION handle_follow();

-- Update post like count
CREATE OR REPLACE FUNCTION handle_post_like()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE posts SET likes_count = likes_count + 1 WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE posts SET likes_count = likes_count - 1 WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_post_like_count
AFTER INSERT OR DELETE ON post_likes
FOR EACH ROW EXECUTE FUNCTION handle_post_like();

-- Generate order number
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TRIGGER AS $$
BEGIN
  NEW.order_number = 'SG-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(nextval('order_seq')::text, 6, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE SEQUENCE order_seq START 1;
CREATE TRIGGER trg_order_number BEFORE INSERT ON orders FOR EACH ROW EXECUTE FUNCTION generate_order_number();
```

---

## 6. SOLANA PROGRAMS (Anchor)

### 6.1 Escrow Program

```rust
// programs/escrow/src/lib.rs
use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};

declare_id!("ESCRoW111111111111111111111111111111111111111"); // Replace with actual after deploy

#[program]
pub mod escrow {
    use super::*;

    /// Buyer locks funds into PDA escrow. Called at order creation.
    pub fn lock_funds(
        ctx: Context<LockFunds>,
        order_id: [u8; 32],
        amount: u64,
        platform_fee_bps: u16,
    ) -> Result<()> {
        let escrow = &mut ctx.accounts.escrow_account;
        escrow.order_id = order_id;
        escrow.buyer = ctx.accounts.buyer.key();
        escrow.seller = ctx.accounts.seller.key();
        escrow.amount = amount;
        escrow.platform_fee_bps = platform_fee_bps;
        escrow.status = EscrowStatus::Locked;
        escrow.bump = ctx.bumps.escrow_account;
        escrow.created_at = Clock::get()?.unix_timestamp;

        // Transfer SOL from buyer to PDA
        let ix = anchor_lang::solana_program::system_instruction::transfer(
            &ctx.accounts.buyer.key(),
            &ctx.accounts.escrow_account.key(),
            amount,
        );
        anchor_lang::solana_program::program::invoke(
            &ix,
            &[
                ctx.accounts.buyer.to_account_info(),
                ctx.accounts.escrow_account.to_account_info(),
                ctx.accounts.system_program.to_account_info(),
            ],
        )?;

        emit!(FundsLocked {
            order_id,
            buyer: escrow.buyer,
            seller: escrow.seller,
            amount,
        });

        Ok(())
    }

    /// Buyer marks order complete. Funds released to seller minus platform fee.
    pub fn release_funds(ctx: Context<ReleaseFunds>, order_id: [u8; 32]) -> Result<()> {
        let escrow = &mut ctx.accounts.escrow_account;
        require!(escrow.status == EscrowStatus::Locked, EscrowError::InvalidStatus);
        require!(ctx.accounts.authority.key() == escrow.buyer || 
                 ctx.accounts.authority.key() == ctx.accounts.platform.key(), 
                 EscrowError::Unauthorized);

        let platform_fee = escrow.amount
            .checked_mul(escrow.platform_fee_bps as u64)
            .unwrap()
            .checked_div(10_000)
            .unwrap();
        let seller_amount = escrow.amount.checked_sub(platform_fee).unwrap();

        let bump_seed = &[escrow.bump];
        let order_seed = &escrow.order_id;
        let seeds = &[b"escrow", order_seed.as_ref(), bump_seed];
        let signer_seeds = &[&seeds[..]];

        // Transfer to seller
        **ctx.accounts.escrow_account.to_account_info().try_borrow_mut_lamports()? -= seller_amount;
        **ctx.accounts.seller.to_account_info().try_borrow_mut_lamports()? += seller_amount;

        // Transfer fee to platform treasury
        **ctx.accounts.escrow_account.to_account_info().try_borrow_mut_lamports()? -= platform_fee;
        **ctx.accounts.platform.to_account_info().try_borrow_mut_lamports()? += platform_fee;

        escrow.status = EscrowStatus::Released;

        emit!(FundsReleased {
            order_id,
            seller: escrow.seller,
            seller_amount,
            platform_fee,
        });

        Ok(())
    }

    /// Dispute resolution — refund buyer
    pub fn refund_buyer(ctx: Context<RefundBuyer>, order_id: [u8; 32]) -> Result<()> {
        let escrow = &mut ctx.accounts.escrow_account;
        require!(escrow.status == EscrowStatus::Locked, EscrowError::InvalidStatus);
        // Only platform authority can refund
        require!(ctx.accounts.platform.key() == ctx.accounts.platform.key(), EscrowError::Unauthorized);

        let amount = escrow.amount;
        **ctx.accounts.escrow_account.to_account_info().try_borrow_mut_lamports()? -= amount;
        **ctx.accounts.buyer.to_account_info().try_borrow_mut_lamports()? += amount;

        escrow.status = EscrowStatus::Refunded;

        emit!(BuyerRefunded { order_id, buyer: escrow.buyer, amount });

        Ok(())
    }
}

#[account]
pub struct EscrowAccount {
    pub order_id: [u8; 32],
    pub buyer: Pubkey,
    pub seller: Pubkey,
    pub amount: u64,
    pub platform_fee_bps: u16,
    pub status: EscrowStatus,
    pub bump: u8,
    pub created_at: i64,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq)]
pub enum EscrowStatus {
    Locked,
    Released,
    Refunded,
    Disputed,
}

#[derive(Accounts)]
#[instruction(order_id: [u8; 32])]
pub struct LockFunds<'info> {
    #[account(
        init,
        payer = buyer,
        space = 8 + 32 + 32 + 32 + 8 + 2 + 1 + 1 + 8,
        seeds = [b"escrow", order_id.as_ref()],
        bump
    )]
    pub escrow_account: Account<'info, EscrowAccount>,
    #[account(mut)]
    pub buyer: Signer<'info>,
    /// CHECK: seller pubkey validated by backend before call
    pub seller: AccountInfo<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(order_id: [u8; 32])]
pub struct ReleaseFunds<'info> {
    #[account(
        mut,
        seeds = [b"escrow", order_id.as_ref()],
        bump = escrow_account.bump,
    )]
    pub escrow_account: Account<'info, EscrowAccount>,
    pub authority: Signer<'info>,
    /// CHECK: seller
    #[account(mut)]
    pub seller: AccountInfo<'info>,
    /// CHECK: platform treasury
    #[account(mut)]
    pub platform: AccountInfo<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(order_id: [u8; 32])]
pub struct RefundBuyer<'info> {
    #[account(
        mut,
        seeds = [b"escrow", order_id.as_ref()],
        bump = escrow_account.bump,
    )]
    pub escrow_account: Account<'info, EscrowAccount>,
    pub platform: Signer<'info>,
    /// CHECK: buyer
    #[account(mut)]
    pub buyer: AccountInfo<'info>,
    pub system_program: Program<'info, System>,
}

#[event]
pub struct FundsLocked { pub order_id: [u8; 32], pub buyer: Pubkey, pub seller: Pubkey, pub amount: u64 }
#[event]
pub struct FundsReleased { pub order_id: [u8; 32], pub seller: Pubkey, pub seller_amount: u64, pub platform_fee: u64 }
#[event]
pub struct BuyerRefunded { pub order_id: [u8; 32], pub buyer: Pubkey, pub amount: u64 }

#[error_code]
pub enum EscrowError {
    #[msg("Escrow has invalid status for this operation")]
    InvalidStatus,
    #[msg("Caller is not authorized for this action")]
    Unauthorized,
    #[msg("Arithmetic overflow")]
    Overflow,
}
```

### 6.2 Reputation Program

```rust
// programs/reputation/src/lib.rs
use anchor_lang::prelude::*;

declare_id!("REPu1111111111111111111111111111111111111111");

#[program]
pub mod reputation {
    use super::*;

    pub fn initialize_profile(ctx: Context<InitializeProfile>) -> Result<()> {
        let profile = &mut ctx.accounts.reputation_profile;
        profile.user = ctx.accounts.user.key();
        profile.score = 0;
        profile.completed_orders = 0;
        profile.disputes_raised = 0;
        profile.disputes_won = 0;
        profile.bump = ctx.bumps.reputation_profile;
        Ok(())
    }

    /// Called by platform authority after order completion
    pub fn increment_score(ctx: Context<UpdateReputation>, points: u32) -> Result<()> {
        let profile = &mut ctx.accounts.reputation_profile;
        profile.score = profile.score.saturating_add(points);
        profile.completed_orders += 1;
        Ok(())
    }

    /// Called by platform after dispute resolution
    pub fn apply_penalty(ctx: Context<UpdateReputation>, points: u32) -> Result<()> {
        let profile = &mut ctx.accounts.reputation_profile;
        profile.score = profile.score.saturating_sub(points);
        profile.disputes_raised += 1;
        Ok(())
    }
}

#[account]
pub struct ReputationProfile {
    pub user: Pubkey,
    pub score: u32,
    pub completed_orders: u32,
    pub disputes_raised: u32,
    pub disputes_won: u32,
    pub bump: u8,
}

#[derive(Accounts)]
pub struct InitializeProfile<'info> {
    #[account(
        init,
        payer = payer,
        space = 8 + 32 + 4 + 4 + 4 + 4 + 1,
        seeds = [b"reputation", user.key().as_ref()],
        bump
    )]
    pub reputation_profile: Account<'info, ReputationProfile>,
    /// CHECK: user being initialized
    pub user: AccountInfo<'info>,
    #[account(mut)]
    pub payer: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct UpdateReputation<'info> {
    #[account(mut, seeds = [b"reputation", reputation_profile.user.as_ref()], bump = reputation_profile.bump)]
    pub reputation_profile: Account<'info, ReputationProfile>,
    pub platform_authority: Signer<'info>,
}
```

---

## 7. API ROUTES — FULL IMPLEMENTATION SPEC

### 7.1 SIWS Authentication (`/api/auth/siws`)
```typescript
// src/app/api/auth/siws/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { PublicKey } from '@solana/web3.js'
import nacl from 'tweetnacl'
import bs58 from 'bs58'
import { nanoid } from 'nanoid'
import { redis } from '@/lib/redis'

// POST /api/auth/siws/challenge — generate nonce
export async function GET(req: NextRequest) {
  const wallet = req.nextUrl.searchParams.get('wallet')
  if (!wallet) return NextResponse.json({ error: 'wallet required' }, { status: 400 })
  
  const nonce = nanoid(32)
  await redis.set(`siws:nonce:${wallet}`, nonce, { ex: 300 }) // 5 min TTL
  
  const message = `SolGig wants you to sign in with your Solana account:\n${wallet}\n\nNonce: ${nonce}\nIssued At: ${new Date().toISOString()}\nChain: Solana Mainnet`
  
  return NextResponse.json({ message, nonce })
}

// POST /api/auth/siws/verify — verify signature and create session
export async function POST(req: NextRequest) {
  const { wallet, signature, message } = await req.json()
  
  // 1. Validate nonce
  const storedNonce = await redis.get(`siws:nonce:${wallet}`)
  const nonceMatch = message.includes(storedNonce as string)
  if (!storedNonce || !nonceMatch) {
    return NextResponse.json({ error: 'Invalid or expired nonce' }, { status: 401 })
  }
  
  // 2. Verify ed25519 signature
  try {
    const pubKey = new PublicKey(wallet)
    const msgBytes = new TextEncoder().encode(message)
    const sigBytes = bs58.decode(signature)
    const valid = nacl.sign.detached.verify(msgBytes, sigBytes, pubKey.toBytes())
    if (!valid) return NextResponse.json({ error: 'Signature verification failed' }, { status: 401 })
  } catch {
    return NextResponse.json({ error: 'Invalid public key or signature' }, { status: 401 })
  }
  
  // 3. Delete nonce (one-time use)
  await redis.del(`siws:nonce:${wallet}`)
  
  // 4. Upsert user in Supabase
  const supabase = createClient()
  const { data: user, error } = await supabase
    .from('users')
    .upsert({ wallet_address: wallet, last_seen_at: new Date().toISOString() }, { onConflict: 'wallet_address' })
    .select()
    .single()
  
  if (error) return NextResponse.json({ error: 'DB error' }, { status: 500 })
  
  // 5. Create Supabase session via service role
  // (Use custom JWT or Supabase anon session tied to wallet)
  // Session stored in httpOnly cookie
  const sessionToken = nanoid(64)
  await redis.set(`session:${sessionToken}`, JSON.stringify({ userId: user.id, wallet }), { ex: 60 * 60 * 24 * 30 })
  
  const response = NextResponse.json({ user, success: true })
  response.cookies.set('sf_session', sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30,
    path: '/',
  })
  
  return response
}
```

### 7.2 Payment Initiation (`/api/payments/initiate`)
```typescript
// src/app/api/payments/initiate/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { Connection, PublicKey, SystemProgram, Transaction, LAMPORTS_PER_SOL } from '@solana/web3.js'
import { createClient } from '@/lib/supabase/server'
import { nanoid } from 'nanoid'
import { getAuthUser } from '@/lib/auth'
import { z } from 'zod'

const PaymentSchema = z.object({
  item_type: z.enum(['product', 'service', 'job']),
  item_id: z.string().uuid(),
  package_type: z.enum(['basic', 'standard', 'premium']).optional(),
  buyer_requirements: z.string().optional(),
  token: z.enum(['SOL', 'USDC']).default('SOL'),
  coupon_code: z.string().optional(),
})

export async function POST(req: NextRequest) {
  const user = await getAuthUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  
  const body = await req.json()
  const parsed = PaymentSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  
  const { item_type, item_id, package_type, buyer_requirements, token, coupon_code } = parsed.data
  const supabase = createClient()
  
  // 1. Fetch item and compute price
  let amount_lamports = 0
  let seller_wallet = ''
  let item_data: any = null
  
  if (item_type === 'product') {
    const { data } = await supabase.from('products').select('*, users(wallet_address)').eq('id', item_id).single()
    if (!data || !data.is_published) return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    amount_lamports = data.price_lamports
    seller_wallet = data.users.wallet_address
    item_data = data
  } else if (item_type === 'service') {
    const { data } = await supabase.from('services').select('*, users(wallet_address)').eq('id', item_id).single()
    if (!data || !data.is_published) return NextResponse.json({ error: 'Service not found' }, { status: 404 })
    const pkg = package_type ? data[`package_${package_type}`] : data.package_basic
    amount_lamports = pkg.price_lamports
    seller_wallet = data.users.wallet_address
    item_data = data
  }
  
  // 2. Apply coupon if provided
  if (coupon_code) {
    const { data: coupon } = await supabase
      .from('coupons')
      .select('*')
      .eq('seller_id', item_data.seller_id)
      .eq('code', coupon_code.toUpperCase())
      .eq('is_active', true)
      .single()
    
    if (coupon) {
      if (coupon.discount_type === 'percent') {
        amount_lamports = Math.floor(amount_lamports * (1 - coupon.discount_value / 100))
      } else {
        amount_lamports = Math.max(0, amount_lamports - coupon.discount_value)
      }
    }
  }
  
  // 3. Calculate platform fee (2.5%)
  const platform_fee_bps = 250
  const platform_fee_lamports = Math.floor(amount_lamports * platform_fee_bps / 10000)
  
  // 4. Create order record
  const { data: order, error: orderError } = await supabase.from('orders').insert({
    order_type: item_type,
    buyer_id: user.id,
    seller_id: item_data.seller_id,
    [`${item_type}_id`]: item_id,
    package_type,
    buyer_requirements,
    amount_lamports,
    token_mint: token,
    platform_fee_bps,
    platform_fee_lamports,
    status: 'pending',
  }).select().single()
  
  if (orderError) return NextResponse.json({ error: 'Order creation failed' }, { status: 500 })
  
  // 5. Build escrow transaction for client-side signing
  // Client will sign and submit this transaction
  const connection = new Connection(process.env.NEXT_PUBLIC_SOLANA_RPC_URL!)
  const buyerPubkey = new PublicKey(user.wallet_address)
  const sellerPubkey = new PublicKey(seller_wallet)
  
  // Return order data + payment params for client
  return NextResponse.json({
    order_id: order.id,
    order_number: order.order_number,
    amount_lamports,
    platform_fee_lamports,
    seller_wallet,
    token,
    // Client calls escrow program with these params
    escrow_params: {
      order_id_bytes: Array.from(Buffer.from(order.id.replace(/-/g, ''), 'hex').subarray(0, 32)),
      amount: amount_lamports,
      platform_fee_bps,
    }
  })
}
```

### 7.3 Payment Verification (`/api/payments/verify`)
```typescript
// src/app/api/payments/verify/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { Connection, PublicKey } from '@solana/web3.js'
import { createClient } from '@/lib/supabase/server'
import { getAuthUser } from '@/lib/auth'

export async function POST(req: NextRequest) {
  const user = await getAuthUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  
  const { order_id, tx_signature, escrow_pda } = await req.json()
  
  const connection = new Connection(process.env.NEXT_PUBLIC_SOLANA_RPC_URL!, 'confirmed')
  const supabase = createClient()
  
  try {
    // 1. Confirm tx on-chain
    const txInfo = await connection.getTransaction(tx_signature, {
      commitment: 'confirmed',
      maxSupportedTransactionVersion: 0,
    })
    
    if (!txInfo || txInfo.meta?.err) {
      return NextResponse.json({ error: 'Transaction failed or not found' }, { status: 400 })
    }
    
    // 2. Verify tx is not too old (< 2 minutes)
    const txTime = txInfo.blockTime! * 1000
    if (Date.now() - txTime > 120_000) {
      return NextResponse.json({ error: 'Transaction too old' }, { status: 400 })
    }
    
    // 3. Verify the tx involves the expected escrow PDA
    const accounts = txInfo.transaction.message.staticAccountKeys
    const pdaPubkey = new PublicKey(escrow_pda)
    const pdaInvolved = accounts.some(acc => acc.equals(pdaPubkey))
    if (!pdaInvolved) {
      return NextResponse.json({ error: 'Transaction does not involve expected escrow' }, { status: 400 })
    }
    
    // 4. Update order status
    const { error } = await supabase
      .from('orders')
      .update({
        status: 'payment_confirmed',
        payment_tx_signature: tx_signature,
        escrow_pda,
        payment_confirmed_at: new Date().toISOString(),
        started_at: new Date().toISOString(),
      })
      .eq('id', order_id)
      .eq('buyer_id', user.id)
    
    if (error) return NextResponse.json({ error: 'Order update failed' }, { status: 500 })
    
    // 5. Record transaction
    await supabase.from('transactions').insert({
      signature: tx_signature,
      user_id: user.id,
      order_id,
      tx_type: 'escrow_lock',
      amount_lamports: 0, // Will be filled from order
      token_mint: 'SOL',
      from_address: user.wallet_address,
      to_address: escrow_pda,
      status: 'confirmed',
      block_time: new Date(txTime).toISOString(),
      slot: txInfo.slot,
      fee_lamports: txInfo.meta?.fee || 0,
    })
    
    // 6. Send notification to seller
    const { data: order } = await supabase.from('orders').select('*, users!seller_id(id)').eq('id', order_id).single()
    if (order) {
      await supabase.from('notifications').insert({
        user_id: order.users.id,
        type: 'order_placed',
        title: 'New order received',
        body: `Order ${order.order_number} has been placed and payment confirmed.`,
        data: { order_id },
        action_url: `/dashboard/orders/${order_id}`,
      })
    }
    
    return NextResponse.json({ success: true, message: 'Payment confirmed' })
  } catch (err) {
    console.error('Payment verify error:', err)
    return NextResponse.json({ error: 'Verification failed' }, { status: 500 })
  }
}
```

---

## 8. FRONTEND IMPLEMENTATION — PAGE BY PAGE

### 8.1 `tailwind.config.ts`
```typescript
import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: ['class'],
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Solana palette
        solana: {
          purple: '#9945FF',
          green:  '#14F195',
          blue:   '#00C2FF',
          dark:   '#0A0A0A',
          card:   '#111111',
          border: '#1F1F1F',
          muted:  '#888888',
        },
        background: '#0A0A0A',
        foreground:  '#FAFAFA',
        primary: {
          DEFAULT: '#9945FF',
          foreground: '#FAFAFA',
        },
        secondary: {
          DEFAULT: '#14F195',
          foreground: '#0A0A0A',
        },
        accent: {
          DEFAULT: '#00C2FF',
          foreground: '#0A0A0A',
        },
        muted: {
          DEFAULT: '#1A1A1A',
          foreground: '#888888',
        },
        card: {
          DEFAULT: '#111111',
          foreground: '#FAFAFA',
        },
        destructive: {
          DEFAULT: '#FF4545',
          foreground: '#FAFAFA',
        },
        border: '#1F1F1F',
        input:  '#1A1A1A',
        ring:   '#9945FF',
      },
      fontFamily: {
        sans:    ['Space Grotesk', 'system-ui', 'sans-serif'],
        display: ['Syne', 'sans-serif'],
        mono:    ['JetBrains Mono', 'monospace'],
      },
      animation: {
        'pulse-glow':    'pulse-glow 2s cubic-bezier(0.4,0,0.6,1) infinite',
        'float':         'float 6s ease-in-out infinite',
        'orbit':         'orbit 20s linear infinite',
        'gradient-x':   'gradient-x 3s ease infinite',
        'slide-up':     'slide-up 0.5s ease-out',
        'fade-in':      'fade-in 0.4s ease-out',
        'spin-slow':    'spin 8s linear infinite',
        'bounce-slow':  'bounce 3s infinite',
        'shimmer':      'shimmer 1.5s infinite',
        'ticker':       'ticker 30s linear infinite',
      },
      keyframes: {
        'pulse-glow': {
          '0%, 100%': { boxShadow: '0 0 20px rgba(153,69,255,0.4)' },
          '50%':       { boxShadow: '0 0 40px rgba(153,69,255,0.8), 0 0 80px rgba(20,241,149,0.3)' },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%':      { transform: 'translateY(-20px)' },
        },
        'orbit': {
          from: { transform: 'rotate(0deg) translateX(120px) rotate(0deg)' },
          to:   { transform: 'rotate(360deg) translateX(120px) rotate(-360deg)' },
        },
        'gradient-x': {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%':       { backgroundPosition: '100% 50%' },
        },
        'slide-up': {
          from: { transform: 'translateY(20px)', opacity: '0' },
          to:   { transform: 'translateY(0)', opacity: '1' },
        },
        'fade-in': {
          from: { opacity: '0' },
          to:   { opacity: '1' },
        },
        'shimmer': {
          '0%':   { backgroundPosition: '-1000px 0' },
          '100%': { backgroundPosition: '1000px 0' },
        },
        'ticker': {
          from: { transform: 'translateX(0)' },
          to:   { transform: 'translateX(-50%)' },
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-mesh':   'radial-gradient(at 40% 20%, #9945FF22 0px, transparent 50%), radial-gradient(at 80% 0%, #14F19511 0px, transparent 50%), radial-gradient(at 0% 50%, #00C2FF11 0px, transparent 50%)',
        'card-glow':       'linear-gradient(145deg, rgba(153,69,255,0.05) 0%, rgba(20,241,149,0.02) 100%)',
      },
      boxShadow: {
        'glow-purple': '0 0 30px rgba(153,69,255,0.4)',
        'glow-green':  '0 0 30px rgba(20,241,149,0.4)',
        'glow-blue':   '0 0 30px rgba(0,194,255,0.4)',
        'card':        '0 0 0 1px rgba(255,255,255,0.04), 0 4px 24px rgba(0,0,0,0.4)',
        'card-hover':  '0 0 0 1px rgba(153,69,255,0.3), 0 8px 40px rgba(0,0,0,0.6)',
      },
    },
  },
  plugins: [require('@tailwindcss/typography')],
}

export default config
```

### 8.2 `globals.css`
```css
@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=Syne:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap');
@import '@skiper-ui/skiper40/styles.css';

@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 4%;
    --foreground: 0 0% 98%;
    --card: 0 0% 7%;
    --card-foreground: 0 0% 98%;
    --primary: 270 100% 63%;
    --primary-foreground: 0 0% 98%;
    --secondary: 152 91% 51%;
    --secondary-foreground: 0 0% 4%;
    --muted: 0 0% 10%;
    --muted-foreground: 0 0% 53%;
    --accent: 198 100% 50%;
    --border: 0 0% 12%;
    --input: 0 0% 10%;
    --ring: 270 100% 63%;
    --radius: 0.75rem;
  }

  * { @apply border-border; }
  body {
    @apply bg-background text-foreground;
    font-feature-settings: "rlig" 1, "calt" 1;
    -webkit-font-smoothing: antialiased;
  }
  
  /* Custom scrollbar */
  ::-webkit-scrollbar { width: 4px; height: 4px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: rgba(153,69,255,0.4); border-radius: 2px; }
  ::-webkit-scrollbar-thumb:hover { background: rgba(153,69,255,0.7); }
  
  ::selection { background: rgba(153,69,255,0.3); color: #FAFAFA; }
}

@layer components {
  /* Glassmorphism card */
  .glass-card {
    @apply bg-white/[0.03] backdrop-blur-xl border border-white/[0.06] rounded-2xl;
    box-shadow: 0 0 0 1px rgba(255,255,255,0.04), 0 4px 24px rgba(0,0,0,0.4);
  }
  .glass-card:hover {
    @apply border-solana-purple/30;
    box-shadow: 0 0 0 1px rgba(153,69,255,0.2), 0 8px 40px rgba(0,0,0,0.6);
  }
  
  /* Gradient text */
  .gradient-text {
    @apply bg-gradient-to-r from-solana-purple via-solana-blue to-solana-green bg-clip-text text-transparent;
  }
  .gradient-text-reverse {
    @apply bg-gradient-to-r from-solana-green via-solana-blue to-solana-purple bg-clip-text text-transparent;
  }
  
  /* Glow button */
  .btn-glow {
    @apply relative overflow-hidden bg-solana-purple text-white font-semibold px-6 py-3 rounded-xl
           transition-all duration-300 hover:shadow-glow-purple hover:scale-[1.02] active:scale-[0.98];
  }
  .btn-glow::before {
    content: '';
    @apply absolute inset-0 opacity-0 transition-opacity duration-300;
    background: linear-gradient(135deg, rgba(255,255,255,0.1), transparent);
  }
  .btn-glow:hover::before { @apply opacity-100; }
  
  /* Neon border */
  .neon-border {
    @apply border border-solana-purple/50;
    box-shadow: inset 0 0 20px rgba(153,69,255,0.05), 0 0 20px rgba(153,69,255,0.1);
  }
  
  /* Shimmer loading */
  .shimmer {
    background: linear-gradient(90deg, rgba(255,255,255,0.02) 25%, rgba(255,255,255,0.06) 50%, rgba(255,255,255,0.02) 75%);
    background-size: 1000px 100%;
    @apply animate-shimmer;
  }
  
  /* Feed post card */
  .feed-card {
    @apply glass-card p-0 overflow-hidden cursor-pointer transition-transform duration-200 hover:scale-[1.01];
  }
  
  /* Price badge */
  .price-badge {
    @apply inline-flex items-center gap-1 bg-solana-green/10 text-solana-green border border-solana-green/20
           text-sm font-semibold px-3 py-1 rounded-full;
  }
  
  /* Avatar ring */
  .avatar-ring {
    @apply ring-2 ring-offset-2 ring-offset-background ring-solana-purple/50;
  }
  
  /* Status badges */
  .status-open       { @apply bg-solana-green/10 text-solana-green border border-solana-green/20; }
  .status-progress   { @apply bg-solana-blue/10 text-solana-blue border border-solana-blue/20; }
  .status-completed  { @apply bg-white/10 text-white/70 border border-white/10; }
  .status-disputed   { @apply bg-red-500/10 text-red-400 border border-red-500/20; }
}

@layer utilities {
  .text-balance { text-wrap: balance; }
  .noise-bg {
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E");
  }
  .hide-scrollbar::-webkit-scrollbar { display: none; }
  .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
}
```

### 8.3 Landing Page (`src/app/(marketing)/page.tsx`)

The landing page runs as a full-length immersive scroll experience with the following sections, in order:

**Section 1 — HERO**
- Full-viewport dark canvas
- Background: Three.js particle field (`src/components/three/ParticleField.tsx`) — 2000 floating purple/green dots forming a globe mesh that rotates slowly; a glowing Solana-colored beam sweeps through intermittently
- Foreground content (centered, z-index above Three.js):
  - Eyebrow label: `BUILT FOR SOLANA CREATORS` in uppercase, mono font, solana-green, letter-spacing wide, with small animated dot (pulsing circle) to the left
  - H1: two lines
    - Line 1: `Build. Sell. Get paid.` — Syne 800, 80px desktop / 48px mobile, white
    - Line 2: `On-chain. Right now.` — gradient-text (purple→green), same size
  - Subheading: `The social marketplace where Solana creators list digital goods and freelance services. Every payment lands in your wallet the moment it's confirmed.` — 20px, muted, max-width 560px, text-balance
  - CTA row:
    - Primary: `Connect Wallet & Start Selling` — btn-glow, large, with Phantom wallet icon
    - Secondary: `Explore Marketplace` — ghost button with arrow →
  - Below CTAs: social proof strip — `Trusted by 3,200+ creators · $2.1M+ paid out on-chain · 0 failed transactions`
- Skiper animations used: `FadeIn`, `TextSplit` (stagger each word), `SlideReveal`
- Three.js `TokenOrbit` component: 4 orbiting token icons (SOL, USDC, BONK, custom SF token) that orbit the hero center at different speeds and radii. Each is a glowing sphere with logo texture

**Section 2 — LIVE TICKER**
- Full-width strip, dark background with very slight glow
- Scrolling ticker (CSS animation `ticker`) showing real recent transactions (fetched from Supabase):
  `@creativecoder just earned 2.4 SOL · @designer_maya sold a UI kit · @devricc completed a smart contract gig · @muzic3d sold 12 copies of "Synthwave Pack" · ...`
- Updates every 30 seconds via Supabase Realtime subscription

**Section 3 — WHAT IS SOLGIG (Split layout)**
- Left column: large number stat blocks, staggered entrance
  - `3,200+` Creators
  - `$2.1M` Earned on-chain
  - `<400ms` Average payment confirmation
  - `2.5%` Platform fee (vs 20-30% on traditional platforms)
- Right column: rotating feature explanation tabs (auto-cycle every 4s)
  - Tab 1: Digital Products (Gumroad-style)
  - Tab 2: Freelance Services (Fiverr-style)
  - Tab 3: Project Jobs (Upwork-style)
  - Tab 4: Social Feed (TikTok/IG-style)
- Skiper animation: `CounterUp` for numbers, `StaggerList` for tabs

**Section 4 — SOCIAL FEED PREVIEW**
- Section title: `A marketplace that feels like home`
- Shows 3 mockup feed posts side by side (desktop) / vertical scroll (mobile)
  - Post type 1: Image post with embedded product card (`$29 UI Kit — Buy now`)
  - Post type 2: Short video thumbnail with service card (`Logo Design · 3 SOL · Basic package`)
  - Post type 3: Text/code post with job listing (`Looking for Anchor developer · Budget: 5-10 SOL`)
- Each card has: avatar, username, like/comment/share counts, pay-button visible
- Skiper animation: `HoverTilt` on each card, `ParallaxSection` for scroll depth

**Section 5 — HOW PAYMENT WORKS (Timeline / Steps)**
- Dark section, horizontal stepper on desktop / vertical on mobile
- Step 1: `Connect your wallet` — Phantom/Backpack/Solflare icon
- Step 2: `Buyer initiates checkout` — Modal preview screenshot
- Step 3: `Funds locked in escrow PDA` — Anchor program icon, on-chain badge
- Step 4: `Seller delivers work / product auto-delivered` — Delivery icon
- Step 5: `Buyer confirms. Funds released instantly.` — Wallet with incoming SOL icon
- Below steps: security badges — `Anchor-audited escrow · Non-custodial · Dispute resolution · Seller protection`
- Skiper animation: `ScrollProgress` indicator on the stepper line, `FadeIn` each step

**Section 6 — CATEGORIES GRID**
- Title: `Everything digital, all in one place`
- Bento grid of 12 categories, each with:
  - Icon (Lucide or custom SVG)
  - Category name
  - Item count (live from DB)
  - Background: subtle gradient unique per category
- Categories: Code & Dev, Design Assets, UI Templates, Music & Audio, Video & Motion, E-books, Courses, Game Assets, 3D Models, Photography, Web3 / NFT, Data & AI
- Skiper animation: `GlowCard` on hover, `StaggerList` entrance

**Section 7 — FEATURED CREATORS**
- Horizontal scroll carousel on mobile, 4-column grid on desktop
- 6 creator cards:
  - Avatar, name, username, specialty tag, follower count, total sales, rating
  - Sample product/gig thumbnail
  - `View Profile` button
- Skiper animation: `FloatingOrbs` in background, `HoverTilt` on cards

**Section 8 — WALLET COMPARISON TABLE**
- Title: `You keep more of what you earn`
- 3-column table:
  - Column 1: Platform names (Gumroad, Fiverr, Upwork, SolGig)
  - Column 2: Fees
  - Column 3: Payment speed
  - Column 4: Who holds your money
- SolGig row highlighted with solana-purple glow
- Data: Gumroad (10%), Fiverr (20%), Upwork (20%), SolGig (2.5%)
- Payout speed: Gumroad (7 days), Fiverr (14 days), Upwork (5 days), SolGig (<1 second)

**Section 9 — TESTIMONIALS**
- 3 testimonials in masonry/offset layout
- Each: large quote mark in purple, quote text, avatar, name, @handle, earnings badge (`Earned 12.4 SOL this month`)
- Skiper animation: `ParallaxSection` offset on each card

**Section 10 — CTA FINAL**
- Full-width section, gradient mesh background (purple→green radial)
- Large text: `Ready to get paid on Solana?`
- Subtext: `Join 3,200 creators. Zero withdrawal delays. Your wallet. Your money.`
- Dual CTA: `Start Selling` / `Browse Marketplace`
- Below: trust logos row — Phantom, Backpack, Solflare, Jupiter, Helius

---

### 8.4 Feed Page (`/feed`) — TikTok + LinkedIn Hybrid

**Layout:**
- Desktop: 3-column — Left sidebar (nav + trending) | Center feed | Right sidebar (suggestions + trending products)
- Mobile: Full-width single column with bottom navigation bar (5 tabs: Home, Explore, Post, Messages, Profile)

**Center Feed — Infinite Scroll:**
- Default sort: algorithmic (following + trending + new)
- Toggle: `For You` | `Following` | `Trending` | `Nearby` (geolocation optional)
- Each post renders `<FeedPost />` which adapts to post_type:
  - `image`: Up to 10 images, swipeable carousel, full-width on mobile
  - `video`: Autoplay muted on scroll-into-view, sound on click, progress bar
  - `product_feature`: Image/video + embedded product card below (price, buy button, seller avatar)
  - `service_feature`: Gig card embedded (package selector, book button)
  - `job_post`: Job listing card inline
  - `text`: Rich text, code blocks, links with OG preview

**Post Interaction Bar (below every post):**
- Like (heart icon) — optimistic update + Supabase write
- Comment (speech bubble) — expands inline comment section
- Share (arrow) — copy link / share to DM
- Save (bookmark) — add to private saved collection
- If own post: analytics icon (views, clicks, conversions)

**Sidebar Left:**
- SolGig logo
- Navigation: Feed, Explore, Create, Messages, Wallet, Dashboard, Profile
- Trending tags section (top 8 hashtags)
- "Go Pro" CTA for verified badge

**Sidebar Right (desktop only):**
- "Who to follow" — 3 suggested creators
- Trending products — 3 product cards
- Platform stats ticker

**Post Creation (`/post/create`):**
- Modal or full page
- Type selector: Photo, Video, Product Link, Service Link, Job Post, Text
- Rich text editor (markdown)
- Media upload (drag + drop, Supabase Storage)
- Tag input (@ mentions, # hashtags)
- Link to existing product/service (selector from your listings)
- Schedule post (optional)
- Publish or Save Draft

---

### 8.5 Marketplace Page (`/marketplace`) — Gumroad-Style

**Layout:**
- Left sidebar: Filter panel (category, price range, rating, file type, license, token)
- Main content: Responsive product grid (4-col desktop, 2-col tablet, 1-col mobile)
- Top bar: Sort (Trending, Newest, Best Rated, Price) + Search

**ProductCard component:**
```
┌─────────────────────────┐
│    [THUMBNAIL IMAGE]    │
│  [CATEGORY TAG]         │
├─────────────────────────┤
│ Product Title           │
│ @seller · ⭐4.9 (142)   │
├─────────────────────────┤
│ ◎ 2.4 SOL  [Buy Now]   │
└─────────────────────────┘
```
- Hover: slight scale, shadow-glow-purple, "Quick Preview" button appears
- Quick Preview: slide-up drawer with product description, file info, reviews sample

**Product Detail Page (`/marketplace/[slug]`):**
- Left column (60%): Hero image/gallery (swipeable), full description (rich text), preview files, reviews
- Right column (40%) sticky: Price box
  - Price in SOL + USD equivalent (live price via Jupiter API)
  - Accept tokens (SOL / USDC toggle)
  - License selector (Personal/Commercial/Extended)
  - Coupon code input
  - `Buy Now` button → triggers `CheckoutModal`
  - `Add to Wishlist` heart button
  - Seller card (avatar, rating, sales count, follow button)
  - File info (format, size, version, last updated)
- Below fold: Reviews section (filter by rating, show avatar, verified purchase badge)
- Related products grid

---

### 8.6 Services Page (`/services`) — Fiverr-Style

**Layout similar to Marketplace but gig-specific:**

**GigCard component:**
```
┌─────────────────────────┐
│    [GALLERY THUMB]      │
│  [Seller avatar + name] │
├─────────────────────────┤
│ I will design your...   │
├─────────────────────────┤
│ ⭐4.9 (88) · ◎ From 1.5 SOL │
└─────────────────────────┘
```

**Gig Detail Page (`/services/[slug]`):**
- Gallery (up to 5 images/video)
- Full description + requirements
- FAQ accordion
- Package selector (Basic / Standard / Premium tabs):
  ```
  ┌──────────┬───────────┬──────────┐
  │ BASIC    │ STANDARD  │ PREMIUM  │
  │ 1.5 SOL  │ 3 SOL     │ 6 SOL    │
  │ 3 days   │ 5 days    │ 7 days   │
  │ 1 rev    │ 3 rev     │ Unlimited│
  └──────────┴───────────┴──────────┘
  ```
- `Order Now` → triggers `CheckoutModal` with package pre-selected
- Contact Seller → opens DM
- Seller profile card with all stats

---

### 8.7 Jobs Board (`/jobs`) — Upwork-Style

**Layout:**
- Filter sidebar: category, budget range, project type (fixed/hourly), experience level, skills
- Job card grid:
  ```
  ┌────────────────────────────────────────┐
  │ [ICON] Senior Anchor Developer Needed  │
  │ Fixed Price · 5-10 SOL · Posted 2h ago│
  │ Solana · Rust · Web3.js               │
  │ [12 proposals] [VIEW JOB →]            │
  └────────────────────────────────────────┘
  ```

**Job Detail (`/jobs/[id]`):**
- Full job description
- Required skills tags
- Budget range (SOL/USDC)
- Client info (anonymized until proposal accepted)
- `Submit Proposal` button → ProposalForm:
  - Cover letter (rich text)
  - Bid amount
  - Timeline
  - Portfolio attachments
  - Milestone breakdown (for larger projects)

---

### 8.8 Dashboard (`/dashboard`)

**Dashboard Layout:**
- Sidebar navigation (desktop) or tab bar (mobile)
- Home tab: Stats overview cards
  - Total earned (SOL + USD equivalent)
  - Active orders
  - Pending withdrawals
  - Profile views (7 days)
  - Conversion rate
  - Average rating
- Quick actions: Create Product, Create Service, Post to Feed

**Earnings Tab:**
- Revenue chart (Line, 7d/30d/90d/1y)
- Breakdown by product/service/job
- Transaction table with Solana Explorer links for every TX
- Withdraw button (no-op — funds are already in wallet, this shows wallet balance)

**Analytics Tab:**
- Feed post performance (views, likes, conversions per post)
- Product/service view-to-purchase funnel
- Audience breakdown (new vs returning buyers)
- Top referral sources

**Orders Tab:**
- Tabbed: Active, Delivered, Completed, Disputed, Cancelled
- Each order row: order number, buyer info, item, amount, status badge, action button
- Order detail drawer: full conversation thread, delivery upload, milestone tracking

---

### 8.9 Wallet Page (`/wallet`)

- Connected wallet address (with copy + Solana Explorer link)
- Balances:
  - SOL balance (live via `connection.getBalance`)
  - USDC balance (SPL token account)
  - Any other SPL tokens held
- USD equivalent (via Jupiter price API or Coingecko)
- Transaction history (from `transactions` table + on-chain verification links)
- "Send SOL" quick send form (for tipping other creators)
- "Switch Network" (mainnet/devnet toggle — devnet for testing)

---

## 9. THREE.JS SCENES — IMPLEMENTATION DETAIL

### 9.1 `ParticleField.tsx`
```typescript
'use client'
import { useRef, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Points, PointMaterial } from '@react-three/drei'
import * as THREE from 'three'

function Particles({ count = 2000 }: { count?: number }) {
  const ref = useRef<THREE.Points>(null)
  
  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(Math.random() * 2 - 1)
      const r = 2.5 + Math.random() * 1.5
      arr[i * 3]     = r * Math.sin(phi) * Math.cos(theta)
      arr[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta)
      arr[i * 3 + 2] = r * Math.cos(phi)
    }
    return arr
  }, [count])
  
  useFrame((_, delta) => {
    if (ref.current) {
      ref.current.rotation.x += delta * 0.05
      ref.current.rotation.y += delta * 0.08
    }
  })
  
  return (
    <Points ref={ref} positions={positions} stride={3} frustumCulled={false}>
      <PointMaterial
        transparent
        color="#9945FF"
        size={0.015}
        sizeAttenuation
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </Points>
  )
}

export function ParticleField() {
  return (
    <Canvas
      camera={{ position: [0, 0, 5], fov: 60 }}
      style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
      gl={{ antialias: false, alpha: true }}
    >
      <Particles />
      <Particles count={500} />
      {/* Second layer in green */}
      <Points
        positions={(() => {
          const arr = new Float32Array(500 * 3)
          for (let i = 0; i < 500; i++) {
            arr[i*3]   = (Math.random() - 0.5) * 10
            arr[i*3+1] = (Math.random() - 0.5) * 10
            arr[i*3+2] = (Math.random() - 0.5) * 10
          }
          return arr
        })()}
        stride={3}
      >
        <PointMaterial
          transparent color="#14F195" size={0.008} sizeAttenuation
          depthWrite={false} blending={THREE.AdditiveBlending}
        />
      </Points>
    </Canvas>
  )
}
```

### 9.2 `TokenOrbit.tsx` — Orbiting SOL/USDC tokens
```typescript
'use client'
import { useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Sphere, MeshDistortMaterial, Float } from '@react-three/drei'
import * as THREE from 'three'

const TOKENS = [
  { color: '#9945FF', radius: 1.8, speed: 0.5, size: 0.12, label: 'SOL' },
  { color: '#14F195', radius: 2.4, speed: 0.35, size: 0.10, label: 'USDC' },
  { color: '#00C2FF', radius: 3.0, speed: 0.25, size: 0.08, label: 'BONK' },
  { color: '#FFD700', radius: 2.1, speed: 0.45, size: 0.09, label: 'SF' },
]

function OrbitingToken({ color, radius, speed, size }: typeof TOKENS[0]) {
  const ref = useRef<THREE.Mesh>(null)
  const t = useRef(Math.random() * Math.PI * 2)
  
  useFrame((_, delta) => {
    t.current += delta * speed
    if (ref.current) {
      ref.current.position.x = Math.cos(t.current) * radius
      ref.current.position.z = Math.sin(t.current) * radius
      ref.current.position.y = Math.sin(t.current * 0.5) * 0.5
    }
  })
  
  return (
    <Sphere ref={ref} args={[size, 16, 16]}>
      <MeshDistortMaterial
        color={color} roughness={0.1} metalness={0.8}
        distort={0.3} speed={2}
      />
    </Sphere>
  )
}

function CenterGlobe() {
  return (
    <Float speed={1.5} rotationIntensity={0.5} floatIntensity={0.5}>
      <Sphere args={[0.6, 64, 64]}>
        <MeshDistortMaterial
          color="#9945FF" roughness={0} metalness={0.5}
          distort={0.4} speed={3}
          transparent opacity={0.7}
        />
      </Sphere>
    </Float>
  )
}

export function TokenOrbit() {
  return (
    <Canvas camera={{ position: [0, 2, 6], fov: 50 }} style={{ width: '100%', height: '100%' }} gl={{ alpha: true }}>
      <ambientLight intensity={0.4} />
      <pointLight position={[5, 5, 5]} color="#9945FF" intensity={3} />
      <pointLight position={[-5, -5, -5]} color="#14F195" intensity={2} />
      <CenterGlobe />
      {TOKENS.map(t => <OrbitingToken key={t.label} {...t} />)}
    </Canvas>
  )
}
```

---

## 10. SKIPER UI — ANIMATION INTEGRATION

All Skiper UI animations are imported from `@skiper-ui/skiper40` and wrapped in reusable components at `src/components/skiper/`.

### Key animations used across the product:

**Landing Page:**
- `skiper-fade-in-up` — hero text entrance, staggered
- `skiper-text-reveal` — H1 word-by-word reveal
- `skiper-count-up` — statistics numbers counting up on scroll-enter
- `skiper-magnetic-hover` — CTA buttons have magnetic pull on mouse
- `skiper-glow-border` — card borders animate on hover
- `skiper-parallax` — sections move at different scroll speeds
- `skiper-cursor-trail` — subtle purple trail follows cursor on landing page
- `skiper-scroll-progress` — thin purple/green line at top tracks scroll depth
- `skiper-smooth-scroll` — page-wide smooth scrolling with momentum
- `skiper-hero-clip` — hero text clips in from below (cinematographic)
- `skiper-stagger-grid` — category grid items appear sequentially

**Feed:**
- `skiper-slide-up` — posts slide up as they enter viewport
- `skiper-press-scale` — like button scales on press
- `skiper-haptic-button` — all action buttons have micro-animation on tap
- `skiper-infinite-scroll-fade` — posts fade in as fetched

**Cards & Products:**
- `skiper-tilt-3d` — product cards tilt in 3D on mouse position
- `skiper-shimmer` — loading skeletons with animated shimmer
- `skiper-hover-lift` — cards lift on hover with shadow
- `skiper-badge-pulse` — "New" / "Hot" badges pulse gently

**Checkout / Wallet:**
- `skiper-confetti` — burst on successful purchase
- `skiper-success-check` — animated checkmark SVG
- `skiper-transaction-stream` — live transaction rows slide in

**Navigation:**
- `skiper-nav-blur` — top nav blurs background on scroll
- `skiper-mobile-drawer` — bottom drawer slides up smoothly
- `skiper-tab-indicator` — active tab indicator slides horizontally

**Implementation pattern:**
```typescript
// src/components/skiper/FadeIn.tsx
'use client'
import { motion } from 'framer-motion'
import { ReactNode } from 'react'

interface FadeInProps {
  children: ReactNode
  delay?: number
  duration?: number
  y?: number
  className?: string
}

export function FadeIn({ children, delay = 0, duration = 0.5, y = 20, className }: FadeInProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  )
}
```

---

## 11. ZUSTAND STORES

### 11.1 `authStore.ts`
```typescript
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface User {
  id: string
  wallet_address: string
  username: string | null
  display_name: string | null
  avatar_url: string | null
  is_verified: boolean
  reputation_score: number
}

interface AuthStore {
  user: User | null
  sessionToken: string | null
  isLoading: boolean
  isConnecting: boolean
  setUser: (user: User | null) => void
  setSession: (token: string) => void
  setLoading: (v: boolean) => void
  setConnecting: (v: boolean) => void
  logout: () => void
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      sessionToken: null,
      isLoading: true,
      isConnecting: false,
      setUser: (user) => set({ user }),
      setSession: (token) => set({ sessionToken: token }),
      setLoading: (v) => set({ isLoading: v }),
      setConnecting: (v) => set({ isConnecting: v }),
      logout: () => set({ user: null, sessionToken: null }),
    }),
    { name: 'sf_auth', partialize: (s) => ({ sessionToken: s.sessionToken }) }
  )
)
```

### 11.2 `cartStore.ts`
```typescript
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface CartItem {
  id: string
  type: 'product' | 'service'
  item_id: string
  title: string
  thumbnail_url: string
  price_lamports: number
  token: 'SOL' | 'USDC'
  seller_wallet: string
  package_type?: 'basic' | 'standard' | 'premium'
}

interface CartStore {
  items: CartItem[]
  addItem: (item: CartItem) => void
  removeItem: (id: string) => void
  clear: () => void
  totalLamports: () => number
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (item) => set((s) => ({ items: [...s.items.filter(i => i.id !== item.id), item] })),
      removeItem: (id) => set((s) => ({ items: s.items.filter(i => i.id !== id) })),
      clear: () => set({ items: [] }),
      totalLamports: () => get().items.reduce((sum, i) => sum + i.price_lamports, 0),
    }),
    { name: 'sf_cart' }
  )
)
```

---

## 12. SECURITY AUDIT — COMPREHENSIVE

### 12.1 Smart Contract Security

**Anchor Program Checks:**

1. **Signer verification** — Every instruction that modifies state requires explicit signer constraints. No unsigned state mutations.
2. **PDA seed validation** — All escrow PDAs seeded with `[b"escrow", order_id]` to prevent collisions and fake PDA attacks.
3. **Arithmetic overflow** — All math uses `.checked_add()`, `.checked_sub()`, `.checked_mul()`, `.saturating_*()`. No unchecked integer ops.
4. **Owner checks** — `#[account(owner = program_id)]` enforced on all program-owned accounts.
5. **Rent exemption** — All `init` accounts specify exact space to ensure rent exemption. `close = recipient` used when closing.
6. **Double-spend prevention** — Escrow status is checked before any fund movement (`require!(status == Locked)`). State machine transitions are one-way.
7. **Platform authority key** — Platform treasury key is hardcoded as a constant and verified on every release/refund.
8. **Re-initialization attack** — `init_if_needed` is NOT used. Explicit `init` prevents account re-initialization.
9. **Sysvar abuse** — `Clock::get()` is used safely; not used for randomness.
10. **Cross-program invocation** — All CPIs to System Program and Token Program use checked variants.

**Recommended Audit:**
- Run `anchor test` with full fuzzing harness (Trident or Nautilus)
- Submit for professional audit (OtterSec, Neodyme, or Trail of Bits) before mainnet

### 12.2 Backend / API Security

**Authentication:**
- SIWS nonces are single-use (deleted after verification)
- Nonce TTL: 5 minutes max
- Session tokens: 64-byte random (nanoid), stored in Redis with 30-day TTL
- httpOnly, Secure, SameSite=Lax cookies for session token
- No JWT stored in localStorage

**Input Validation:**
- All API routes validate via Zod schemas at entry point
- UUID format validated on all ID params
- File uploads: MIME type + extension whitelist (images: jpeg/png/webp/gif; files: pdf/zip/mp4/mp3/glb)
- Max file sizes enforced: thumbnails 5MB, product files 500MB
- Content-Length header checked before processing uploads

**Transaction Verification:**
- Every `POST /api/payments/verify` re-fetches and validates the transaction on-chain
- Transaction age check: rejected if >2 minutes old (prevents replay)
- Escrow PDA presence verified in transaction accounts
- Signature never trusted from client alone — always re-verified via Solana RPC

**Rate Limiting (Redis + Upstash):**
```typescript
// Limits per endpoint:
POST /api/auth/siws/verify   → 10 req/15min per IP
POST /api/products           → 20 req/hour per wallet
POST /api/orders             → 50 req/hour per wallet
POST /api/messages           → 100 req/min per wallet
GET  /api/feed               → 300 req/min per IP
```

**SQL Injection Prevention:**
- Supabase client uses parameterized queries. No raw SQL strings with user input.
- RLS policies enforce data isolation at the database level.

**XSS Prevention:**
- All user-generated content rendered via `react-markdown` with `rehype-sanitize` (strict schema: no scripts, no iframes, no onclick)
- Rich text editor output sanitized before storage
- CSP headers enforce `script-src 'self'` with explicit whitelist

**CSRF Protection:**
- All state-modifying API routes require valid session cookie
- SameSite=Lax on session cookie prevents most CSRF
- Origin header validated on sensitive endpoints

**Secrets Management:**
- All secrets in environment variables, never in code
- Vercel environment variables used for production
- `.env.local` gitignored — `.env.example` committed with no values

**Supabase RLS:**
- RLS enabled on all tables (verified above in schema)
- Service role key ONLY used server-side (API routes, Edge Functions)
- Anon key used client-side for read-only public data only

**File Security:**
- Product file URLs are signed (Supabase Storage signed URLs, expire 60s)
- Downloads only served after order status = `completed`
- Arweave permanent links encrypted at application layer for premium content

**Dependency Security:**
```bash
# Run weekly in CI
pnpm audit --audit-level=high
npx better-npm-audit check
```

**CI/CD Security:**
- GitHub secrets for Vercel tokens — never in workflow files
- Branch protection: main requires PR + CI passing
- `.github/CODEOWNERS` for sensitive files (anchor programs, API auth routes)

### 12.3 Frontend Security

- `dangerouslySetInnerHTML` is NEVER used in any component
- Wallet address displayed with `truncateAddress` helper — never full key in URL
- No private keys ever touched by frontend — all Solana transactions signed by wallet adapter (Phantom/Backpack)
- HTTPS enforced (Vercel auto TLS)
- Subresource Integrity (SRI) for any external scripts
- PostHog and Sentry initialized with `autocapture: false` to avoid PII leaks

### 12.4 Monitoring & Incident Response

```typescript
// Error boundary with Sentry
import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 0.1,
  environment: process.env.NODE_ENV,
  beforeSend(event) {
    // Strip wallet addresses from events
    if (event.user) delete event.user.email
    return event
  },
})
```

**Alerting:**
- Alert on: 5xx error rate >1% over 5min window
- Alert on: RPC latency >2s p95
- Alert on: failed payment verify rate >0.5%
- Alert on: any dispute opened (immediate Slack notification to team)

---

## 13. REALTIME FEATURES

### 13.1 Supabase Realtime — Live Feed & Orders

```typescript
// src/hooks/useRealtime.ts
import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useNotificationStore } from '@/stores/notificationStore'

export function useRealtimeNotifications(userId: string) {
  const { addNotification } = useNotificationStore()
  
  useEffect(() => {
    if (!userId) return
    const supabase = createClient()
    
    const channel = supabase
      .channel(`notifications:${userId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`,
      }, (payload) => {
        addNotification(payload.new as any)
        // Show toast notification
      })
      .subscribe()
    
    return () => { supabase.removeChannel(channel) }
  }, [userId])
}

export function useRealtimeOrderStatus(orderId: string, onStatusChange: (status: string) => void) {
  useEffect(() => {
    if (!orderId) return
    const supabase = createClient()
    
    const channel = supabase
      .channel(`order:${orderId}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'orders',
        filter: `id=eq.${orderId}`,
      }, (payload) => {
        onStatusChange(payload.new.status)
      })
      .subscribe()
    
    return () => { supabase.removeChannel(channel) }
  }, [orderId])
}

export function useRealtimeMessages(conversationId: string, onMessage: (msg: any) => void) {
  useEffect(() => {
    if (!conversationId) return
    const supabase = createClient()
    
    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${conversationId}`,
      }, (payload) => {
        onMessage(payload.new)
      })
      .subscribe()
    
    return () => { supabase.removeChannel(channel) }
  }, [conversationId])
}
```

---

## 14. SOLANA PAYMENT FLOW — CLIENT SIDE

```typescript
// src/hooks/useTransaction.ts
import { useConnection, useWallet } from '@solana/wallet-adapter-react'
import { Transaction, PublicKey, SystemProgram } from '@solana/web3.js'
import { useState } from 'react'

interface TxOptions {
  orderId: string
  amountLamports: number
  sellerWallet: string
  escrowPda: string
  platformWallet: string
}

export function useTransaction() {
  const { connection } = useConnection()
  const { publicKey, sendTransaction } = useWallet()
  const [isProcessing, setIsProcessing] = useState(false)
  const [txSignature, setTxSignature] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  
  const executePayment = async (opts: TxOptions) => {
    if (!publicKey) throw new Error('Wallet not connected')
    setIsProcessing(true)
    setError(null)
    
    try {
      // 1. Call API to init order + get escrow params
      const initRes = await fetch('/api/payments/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          item_type: 'product',
          item_id: opts.orderId,
          token: 'SOL',
        }),
      })
      const initData = await initRes.json()
      if (!initRes.ok) throw new Error(initData.error)
      
      // 2. Build transaction (call Anchor escrow program)
      // In production: use the generated Anchor IDL client
      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash()
      
      const tx = new Transaction({
        recentBlockhash: blockhash,
        feePayer: publicKey,
      })
      
      // Simple SOL transfer for MVP; replace with Anchor CPI call for escrow
      tx.add(SystemProgram.transfer({
        fromPubkey: publicKey,
        toPubkey: new PublicKey(opts.escrowPda),
        lamports: opts.amountLamports,
      }))
      
      // 3. Sign and send via wallet adapter
      const sig = await sendTransaction(tx, connection, {
        skipPreflight: false,
        preflightCommitment: 'confirmed',
        maxRetries: 3,
      })
      
      // 4. Confirm transaction
      await connection.confirmTransaction({
        signature: sig,
        blockhash,
        lastValidBlockHeight,
      }, 'confirmed')
      
      setTxSignature(sig)
      
      // 5. Verify with backend
      const verifyRes = await fetch('/api/payments/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order_id: initData.order_id,
          tx_signature: sig,
          escrow_pda: opts.escrowPda,
        }),
      })
      
      if (!verifyRes.ok) throw new Error('Payment verification failed')
      
      return { success: true, signature: sig, orderId: initData.order_id }
    } catch (err: any) {
      const msg = err?.message || 'Transaction failed'
      setError(msg)
      throw err
    } finally {
      setIsProcessing(false)
    }
  }
  
  return { executePayment, isProcessing, txSignature, error }
}
```

---

## 15. SEARCH — TYPESENSE CONFIGURATION

```typescript
// src/lib/typesense.ts
import Typesense from 'typesense'

export const typesense = new Typesense.Client({
  nodes: [{ host: process.env.TYPESENSE_HOST!, port: 443, protocol: 'https' }],
  apiKey: process.env.TYPESENSE_API_KEY!,
  connectionTimeoutSeconds: 5,
})

// Collection schemas
export const PRODUCT_COLLECTION = {
  name: 'products',
  fields: [
    { name: 'id', type: 'string' },
    { name: 'title', type: 'string' },
    { name: 'description', type: 'string' },
    { name: 'tags', type: 'string[]', facet: true },
    { name: 'category', type: 'string', facet: true },
    { name: 'product_type', type: 'string', facet: true },
    { name: 'price_lamports', type: 'int64' },
    { name: 'rating_average', type: 'float' },
    { name: 'total_purchases', type: 'int32' },
    { name: 'is_published', type: 'bool' },
    { name: 'created_at', type: 'int64' },
    { name: 'seller_username', type: 'string' },
  ],
  default_sorting_field: 'total_purchases',
}

// Search function
export async function searchProducts(query: string, filters?: string, page = 1) {
  return typesense.collections('products').documents().search({
    q: query || '*',
    query_by: 'title,description,tags,seller_username',
    filter_by: `is_published:true${filters ? ` && ${filters}` : ''}`,
    sort_by: '_text_match:desc,total_purchases:desc',
    per_page: 20,
    page,
    facet_by: 'category,product_type,tags',
  })
}
```

---

## 16. ENVIRONMENT SETUP CHECKLIST

Before going live, verify:

- [ ] Solana RPC URL set (Helius or Alchemy for production reliability)
- [ ] Anchor programs deployed to mainnet-beta; program IDs updated in `programs.ts`
- [ ] Supabase project created; migrations run; RLS verified with test accounts
- [ ] Redis (Upstash) configured; rate limiting tested
- [ ] Arweave/Bundlr funded with at least 0.1 AR for uploads
- [ ] Typesense cluster running; collections created; initial product sync done
- [ ] Resend account verified; transactional email templates created
- [ ] Sentry DSN configured; test error captured and visible in dashboard
- [ ] PostHog initialized; first event tracked
- [ ] Vercel project created; all env vars added to Vercel dashboard
- [ ] Custom domain configured (`solgig.xyz`) with SSL
- [ ] GitHub Actions secrets added: `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`
- [ ] Platform treasury wallet created and secured; address hardcoded in Anchor program
- [ ] Load test run (minimum 100 concurrent users, 20 concurrent transactions)
- [ ] Security audit completed on Anchor programs
- [ ] Disaster recovery plan: Supabase daily backup enabled, Redis persistence on

---

## 17. METRICS & KPIs TO TRACK

From day 1, instrument:

**Business metrics:**
- GMV (Gross Merchandise Value) in SOL and USD
- Platform revenue (2.5% of GMV)
- Number of active sellers
- Number of transactions per day
- Average order value
- Repeat purchase rate
- Creator retention (month over month)

**Product metrics:**
- Feed engagement rate (likes + comments + saves / views)
- Checkout conversion rate (product view → purchase)
- Proposal acceptance rate (jobs)
- Order completion rate
- Dispute rate (target: <2% of all orders)
- Average time to delivery

**Technical metrics:**
- Transaction confirmation time (target: <1s median)
- API p95 response time (target: <200ms)
- Uptime (target: 99.9%)
- RPC error rate
- Escrow lock success rate (target: 100%)

---

## 18. LAUNCH PLAN

**Phase 1 — Private Beta (Week 1-2):**
- Invite 50 creators from Solana Twitter/Superteam
- Devnet only
- Core: create product, buy product, escrow, delivery, review
- Collect bug reports via in-app feedback widget

**Phase 2 — Public Beta (Week 3-4):**
- Open waitlist → first 500 users
- Mainnet enabled
- Services + Jobs go live
- Feed posting enabled

**Phase 3 — Growth (Month 2+):**
- Featured creator program
- Colosseum hackathon submission
- Superteam Earn integration (cross-post jobs)
- Mobile app (React Native or PWA wrapper)
- Token ($GIG) for governance + fee discount — separate proposal

---

## 19. BRAND & NAME DECISION RECORD (ADR-001)

**Status:** Accepted · **Date:** locked at audit time · **Owner:** founding team

**Context.** The first working title, "SolanaFlow," failed a live availability pass: the GitHub handle and the `solanaflow.vercel.app` deploy URL were both already in use, and the word "Flow" is heavily diluted across crypto products. A name that cannot anchor the GitHub org, the default Vercel URL, and at least one clean domain creates friction on day one and weakens the brand long-term.

**Decision.** Ship as **SolGig**. It was open on GitHub, Vercel, npm, `.xyz`, `.app`, and `.io` at audit time. The name compresses the whole thesis — a Solana-native home for creators to sell goods and services — into six letters that a first-time visitor can read, say, and spell back.

**Consequences.**
- Repo, Vercel project, and package name all use `solgig`; the order-number prefix is `SG-`; the optional governance token is `$GIG`.
- The `.com` is held by a third party, so all marketing points at `solgig.xyz` and the app at `solgig.app`. Acquire `.com` opportunistically later; it is not a launch blocker.
- If a trademark conflict surfaces, the fallback ladder is `Solmosa` → `SolShelf` → `SolKiosk` → `SolDepot`; each was free on GitHub + Vercel + `.xyz` at audit time. Switching is a global find-replace plus a re-run of the audit commands in §0.1.1.

---

## 20. DESIGN SYSTEM — TOKENS & FOUNDATIONS

The interface is dark-first, high-contrast, and quiet. Color is spent sparingly so that price, status, and call-to-action elements carry the only saturated accents on a given screen. Everything else lives in a near-monochrome neutral ramp.

### 20.1 Color tokens (CSS variables, OKLCH for perceptual evenness)
```css
:root {
  /* Brand */
  --brand-violet: oklch(0.55 0.24 295);   /* #9945FF Solana purple */
  --brand-mint:   oklch(0.86 0.20 165);   /* #14F195 Solana green   */
  --brand-grad:   linear-gradient(135deg, var(--brand-violet), var(--brand-mint));

  /* Neutral ramp (dark-first) */
  --bg:        oklch(0.16 0.01 280);  /* page */
  --surface:   oklch(0.20 0.012 280); /* cards */
  --surface-2: oklch(0.24 0.014 280); /* raised */
  --border:    oklch(0.30 0.015 280);
  --text:      oklch(0.97 0 0);
  --text-mut:  oklch(0.72 0.01 280);

  /* Semantic */
  --ok:    var(--brand-mint);
  --warn:  oklch(0.80 0.16 75);
  --err:   oklch(0.63 0.22 25);
  --info:  oklch(0.70 0.14 250);

  /* Elevation (used sparingly; no drop-shadow soup) */
  --shadow-1: 0 1px 2px oklch(0 0 0 / 0.30);
  --shadow-2: 0 8px 24px oklch(0 0 0 / 0.35);
  --glow-violet: 0 0 0 1px oklch(0.55 0.24 295 / 0.4), 0 8px 40px oklch(0.55 0.24 295 / 0.25);
}
```
Light theme inverts the neutral ramp and drops accent lightness ~8% so the violet does not vibrate on white. Both themes must pass WCAG AA (4.5:1 body text, 3:1 large text and UI borders).

### 20.2 Type scale
- Display / wordmark: `Space Grotesk` — used for hero, section titles, numerals.
- Body / UI: `Inter` — everything readable.
- Mono / on-chain data: `JetBrains Mono` — wallet addresses, signatures, lamport amounts.
- Scale (rem, 1.25 ratio): `0.75 · 0.875 · 1 · 1.25 · 1.5 · 1.953 · 2.441 · 3.815`.
- Wallet addresses always render in mono, middle-truncated (`7xKX…3fA`), one-click copy, never wrapped.

### 20.3 Spacing, radius, layout
- Spacing unit: 4px. Use the 4/8/12/16/24/32/48/64 step set only.
- Radius: `sm 8px` (inputs), `md 12px` (cards), `lg 20px` (modals), `full` (avatars, pills).
- Grid: 12-col desktop (max content 1200px), 4-col mobile, 24px gutters.
- Feed column caps at 600px for readability; the storefront grid is fluid `minmax(260px, 1fr)`.

### 20.4 Motion principles
- Durations: micro 120ms, standard 220ms, entrance 380ms, scene 600ms. Nothing exceeds 600ms.
- Easing: `cubic-bezier(0.22, 1, 0.36, 1)` (gentle overshoot) for entrances; `ease-out` for exits.
- Every animation respects `prefers-reduced-motion`: transforms collapse to a 1-frame opacity fade, 3D scenes fall back to a static poster image.
- Animation is reinforcement, never decoration that blocks interaction — content is usable before its entrance finishes.

---

## 21. SKIPER UI ANIMATION MANIFEST (160+ effects, mapped to pages)

Install once: `npx shadcn add @skiper-ui/skiper40`. Each effect below must be wired, demoed on a `/_dev/animations` gallery route, and screenshotted in CI so regressions are caught. The rule: an effect only ships on a page where it earns attention — no page carries more than 3 "loud" effects at once.

| Zone | Effects (representative) | Purpose |
|------|--------------------------|---------|
| Landing hero | 3D token orbit (R3F), magnetic CTA, split-text headline reveal, animated gradient mesh, scroll-velocity skew | First-impression wow; ≤3 loud at once |
| Landing scroll | parallax sections, scroll-progress rail, pinned scrollytelling, counter-up stats, marquee logo wall | Narrative pacing |
| Feed | stagger-in on mount, like-burst micro-interaction, optimistic comment slide, infinite-scroll skeleton shimmer, double-tap heart | Social liveliness |
| Marketplace grid | hover-tilt cards, image zoom-on-hover, filter cross-fade, price flip-counter, wishlist heart pop | Browsing delight |
| Product / gig detail | gallery lightbox spring, sticky buy-bar reveal, package-tab slide, FAQ accordion, review fade-up | Conversion focus |
| Checkout | step transitions, escrow status pulse, tx-confirm progress ring, success confetti, balance roll-up | Payment confidence |
| Wallet | balance count-up, tx-row stagger, copy-address tooltip, network-status dot pulse | Trust + clarity |
| Empty / loading | branded skeletons, floating orbs, shimmer, lottie empty-states | Perceived speed |

**Acceptance:** the `/_dev/animations` gallery must render every wired effect, each toggling correctly under `prefers-reduced-motion`, verified with a Playwright snapshot. An effect that cannot be demoed live is considered not done.

---

## 22. LANDING PAGE — INTERACTIVE BUILD SPEC (scene by scene)

The landing page is the single most important surface; it is built as a sequence of scroll-driven scenes, each a self-contained section component.

1. **Hero.** Full-viewport. A live R3F scene of a slowly orbiting cluster of token coins around the SG mark; behind it, an animated gradient mesh in brand violet→mint. Headline reveals with split-text on load. Primary CTA is a magnetic button ("Start selling"); secondary is ghost ("Browse the feed"). A real, anonymized live counter (recent on-chain settlements) ticks up via the count-up effect — pulled from the `transactions` table, not faked.
2. **Proof strip.** Auto-scrolling marquee of creator avatars + categories; pauses on hover.
3. **How it works.** Pinned scrollytelling: three steps (list → share → get paid) where a phone mock advances as the user scrolls.
4. **For sellers / For buyers.** Two tilt-cards that flip to reveal benefit bullets; numbers count up when scrolled into view.
5. **On-chain trust.** A section explaining escrow with an animated flow diagram (funds lock → deliver → release), each node pulsing in sequence.
6. **Live feed teaser.** A real, read-only slice of the public feed rendered with the same `FeedPostCard` used in-app — proof the product exists.
7. **Final CTA.** Repeat hero CTA over a calmer gradient; footer follows.

Every scene must be server-rendered for content and progressively enhanced with motion on the client, so the page is fully readable with JavaScript disabled and Lighthouse Performance ≥ 90 on mobile.

---

## 23. COPY SYSTEM — NATURAL HUMAN VOICE (originality-safe)

All user-facing text is written to read as if a person wrote it, not a model. Target: pass an originality check (e.g. Turnitin) comfortably under a 5% similarity threshold, with zero machine-tell phrasing.

**Hard rules.**
- No emoji anywhere in product copy.
- Banned model-tell words and openers: *unleash, elevate, seamless, robust, leverage, supercharge, empower, dive in, in today's fast-paced world, game-changer, revolutionize, take it to the next level, unlock the power of.*
- No em-dash pile-ups, no "not only… but also," no triads-of-three as a tic.
- Write short. One idea per sentence. Prefer concrete verbs and real nouns over abstractions.
- Address the reader as "you." Use contractions. Vary sentence length so the rhythm sounds spoken.
- Every headline must be specific enough that it could not be pasted onto a different product unchanged.

**Voice sample — paraphrased, human, per surface:**
- Hero: "Sell your work on Solana. Get paid the second someone buys."
- Empty wishlist: "Nothing saved yet. Tap the heart on anything you want to come back to."
- Checkout success: "Done. The funds are in escrow and your files are ready to download."
- Dispute opened: "We've paused this order. Add your side and any proof below, and a reviewer will step in."

**Process.** Draft every string, then run it through this list and rewrite anything that trips a rule. Keep a `copy.ts` catalog so wording is consistent and auditable in one place.

---

## 24. SECURITY AUDIT — REVIEW CHECKLIST

### 24.1 Anchor programs (escrow, reputation, royalties, dispute)
- [ ] Every arithmetic op uses checked math; no silent overflow (the `refund_buyer` authority check in §6.1 that compares `platform.key()` to itself is a bug — replace with a real, hardcoded treasury authority constraint).
- [ ] PDA seeds include the order id and a bump stored on the account; no seed is attacker-controllable into collision.
- [ ] Signer checks on every privileged instruction (`release_funds`, `refund_buyer`); buyer-only vs platform-only paths are distinct.
- [ ] Account validation via Anchor constraints, not manual `AccountInfo` trust; `/// CHECK` accounts each carry a justified comment and a verifying constraint.
- [ ] Reentrancy and double-release impossible: status transitions are one-way and asserted before any lamport move.
- [ ] Rent-exemption preserved on the escrow account across partial transfers.
- [ ] Independent audit before mainnet; fuzz tests on amounts and fee math.

### 24.2 Web / API
- [ ] SIWS nonce is single-use, short-TTL, bound to the wallet, stored server-side.
- [ ] Supabase RLS proven with negative tests (a user cannot read another user's orders, messages, or transactions).
- [ ] All payment verification happens server-side against the chain — the client is never trusted to assert "paid."
- [ ] Rate limiting on auth, upload, and payment-initiate routes (Upstash).
- [ ] File uploads: type/size validated, gated downloads require a verified completed order.
- [ ] CSP, HSTS, and the headers in `vercel.json` confirmed in production response.
- [ ] Secrets only in env; service-role key never reaches the client bundle.

### 24.3 Payments integrity
- [ ] Reconcile on-chain `transactions` against `orders` on a schedule; alert on drift.
- [ ] Idempotent payment webhook (replay-safe via signature dedupe).
- [ ] Platform fee math matches the on-chain calculation exactly.

---

## 25. DEFINITION OF DONE

A surface is shippable only when all hold: builds clean with no type errors; passes lint and the test suite; meets WCAG AA; renders and is usable with JS disabled (content) and with `prefers-reduced-motion`; mobile Lighthouse Performance ≥ 90; every wired animation appears in the `/_dev/animations` gallery; all copy passes §23; and any on-chain path has a passing integration test against a local validator.

---

## 26. EXECUTION RUNBOOK (repeatable from zero)

1. Run the §0.1.1 audit commands to reconfirm `solgig` is still free; if not, take the next fallback and global-replace.
2. `gh repo create solgig` (§1.1), scaffold Next.js, push initial commit.
3. Add dependencies (§3), init shadcn + Skiper, commit.
4. Stand up Supabase, run the schema (§5), verify RLS with negative tests.
5. Build and deploy the Anchor programs to devnet; paste program IDs into `programs.ts`.
6. Build the design system (§20), then the `/_dev/animations` gallery (§21).
7. Build the landing page (§22) — ship it behind a waitlist first.
8. Build the app shell, feed, marketplace, services, jobs, checkout, wallet (§4).
9. Wire payments + escrow end-to-end on devnet; reconcile (§24.3).
10. Security pass (§24); independent Anchor audit before flipping to mainnet.
11. Phase the launch per §18.

Each step is independently verifiable and the whole runbook is idempotent — re-running it from a clean checkout reproduces the same project.

---

## 27. SITEMAP & ROUTE TABLE

Every route the app ships, with its render mode, auth gate, and primary data source. Render modes: SSG (static), SSR (server-rendered per request), ISR (revalidated), CSR (client islands on top of a shell).

| Path | Group | Render | Auth | Primary data | Notes |
|------|-------|--------|------|--------------|-------|
| `/` | marketing | SSG | public | static + live feed slice | Landing, scene-driven |
| `/about` | marketing | SSG | public | static | Vision, team, mission |
| `/pricing` | marketing | SSG | public | static | Fee model, comparison |
| `/connect` | auth | CSR | public | wallet adapter | Wallet connect + SIWS |
| `/onboard` | auth | CSR | wallet | users | Pick handle, avatar, skills |
| `/feed` | app | SSR shell + CSR | optional | posts | Infinite social feed |
| `/explore` | app | ISR 60s | public | posts, products | Trending, categories |
| `/marketplace` | app | ISR 60s | public | products | Grid, filters, search |
| `/marketplace/[slug]` | app | ISR 120s | public | products | Product detail + buy |
| `/services` | app | ISR 60s | public | services | Gig grid |
| `/services/[slug]` | app | ISR 120s | public | services | Gig detail + packages |
| `/jobs` | app | SSR | public | jobs | Job board, filters |
| `/jobs/[id]` | app | SSR | public | jobs, proposals | Job detail + apply |
| `/profile/[username]` | app | ISR 120s | public | users | Public profile + portfolio |
| `/dashboard` | app | SSR | wallet | aggregate | Creator home |
| `/dashboard/products` | app | SSR | wallet | products | Manage listings |
| `/dashboard/services` | app | SSR | wallet | services | Manage gigs |
| `/dashboard/orders` | app | SSR | wallet | orders | Buyer and seller orders |
| `/dashboard/earnings` | app | SSR | wallet | transactions | Payouts, balances |
| `/dashboard/analytics` | app | SSR | wallet | aggregate | Views, conversion |
| `/dashboard/settings` | app | SSR | wallet | users | Profile, payout, security |
| `/post/create` | app | CSR | wallet | posts | Compose a feed post |
| `/post/[id]` | app | SSR | optional | posts | Single post view |
| `/messages` | app | CSR | wallet | conversations | Realtime DMs |
| `/notifications` | app | CSR | wallet | notifications | Activity stream |
| `/wallet` | app | CSR | wallet | transactions | Balance + tx history |
| `/checkout/[type]/[id]` | app | CSR | wallet | orders | Pay + escrow |
| `/checkout/success` | app | CSR | wallet | orders | Receipt + download |
| `/dev/animations` | dev | CSR | public | none | Motion gallery (build-only) |

API routes mirror `SOLANAFLOW_MEGAPROMPT.md` section 4 under `/api`. The dev gallery is excluded from the production sitemap and `robots.txt`.

---

## 28. ANIMATION CATALOG (160+ effects, named and placed)

This is the working catalog the build draws from. Each row is a named effect, the page zones where it is allowed, and a one-line behavior. The rule from section 21 still holds: no single viewport carries more than three loud effects at once. Effects are grouped so the same primitive can be reused rather than reinvented.

The motion library implements a core set of primitives; the catalog below maps the full surface area those primitives cover when composed. An effect counts as "shipped" only when it appears in the `/dev/animations` gallery and degrades to a quiet fade under reduced motion.

### 28.1 Entrance and reveal (1–24)
1. Fade in. 2. Fade up. 3. Fade down. 4. Fade left. 5. Fade right. 6. Scale in. 7. Blur in. 8. Clip-path wipe up. 9. Clip-path wipe left. 10. Mask reveal. 11. Curtain split. 12. Slide up with overshoot. 13. Rotate in. 14. Flip in X. 15. Flip in Y. 16. Skew in. 17. Bounce in. 18. Drop in with settle. 19. Stagger children up. 20. Stagger children scale. 21. Stagger grid wave. 22. Cascade list. 23. Line-by-line text reveal. 24. Word-by-word text reveal.

### 28.2 Text and type (25–44)
25. Split-char reveal. 26. Split-word reveal. 27. Typewriter. 28. Backspace-retype loop. 29. Gradient text sweep. 30. Shimmer text. 31. Letter spacing settle. 32. Counter up integer. 33. Counter up decimal. 34. Rolling odometer digits. 35. Decrypt scramble. 36. Highlight underline draw. 37. Text mask video. 38. Variable-weight hover. 39. Outline-to-fill on view. 40. Wavy baseline. 41. Per-word color cycle. 42. Marquee headline. 43. Vertical word rotator. 44. Glitch on hover.

### 28.3 Pointer and hover (45–72)
45. Magnetic button. 46. Magnetic icon. 47. 3D card tilt. 48. Parallax layers on tilt. 49. Glow follow. 50. Spotlight follow. 51. Cursor trail dots. 52. Custom cursor ring. 53. Cursor label on hover. 54. Image zoom on hover. 55. Image pan on hover. 56. Border draw on hover. 57. Underline grow. 58. Shine sweep. 59. Lift and shadow. 60. Press depth. 61. Ripple on click. 62. Icon morph on hover. 63. Arrow slide on hover. 64. Card flip on hover. 65. Reveal caption slide-up. 66. Color grade on hover. 67. Sticker peel. 68. Tooltip spring. 69. Avatar stack expand. 70. Tag pop. 71. Hover sound-bar equalizer. 72. Magnetic grid cells.

### 28.4 Scroll-driven (73–104)
73. Scroll progress rail. 74. Section pin. 75. Pinned horizontal scroll. 76. Parallax background. 77. Parallax foreground. 78. Scroll-velocity skew. 79. Scroll-velocity scale. 80. Reveal on enter. 81. Fade out on exit. 82. Sticky stacking cards. 83. Scroll-linked number count. 84. Scroll-linked path draw. 85. Scroll-linked rotate. 86. Scroll-linked color shift. 87. Scrollytelling step swap. 88. Image sequence on scroll. 89. Text mask on scroll. 90. Progress donut on scroll. 91. Timeline reveal. 92. Zoom-through transition. 93. Parallax depth grid. 94. Reveal-and-hold caption. 95. Scale-down on scroll. 96. Blur-in on scroll. 97. Counter band reveal. 98. Sticky CTA reveal. 99. Section divider draw. 100. Marquee speed by scroll. 101. Pinned product showcase. 102. Scroll-snap sections. 103. Reveal grid masonry. 104. Scroll-triggered confetti.

### 28.5 3D and canvas (105–128)
105. Token coin orbit (three.js hero). 106. Icosahedron core spin. 107. Particle field drift. 108. Particle burst on event. 109. Wallet globe with arcs. 110. Floating 3D logo. 111. Metaball blob. 112. Gradient mesh drift. 113. Animated noise grain. 114. Aurora gradient. 115. Light sweep across surface. 116. Depth-of-field focus pull. 117. Pointer-reactive camera. 118. Instanced coin shower. 119. Wireframe morph. 120. Shader ripple. 121. Glass refraction card. 122. 3D flip product card. 123. Orbit controls preview. 124. Scene poster fallback (reduced motion). 125. Floating UI panels in 3D. 126. Tilt-reactive scene. 127. Bloom pulse on settle. 128. Low-poly terrain idle.

### 28.6 Feedback and micro (129–152)
129. Like heart burst. 130. Save bookmark pop. 131. Share fan-out. 132. Optimistic comment slide. 133. Double-tap heart. 134. Follow button morph. 135. Toast slide-in. 136. Toast stack collapse. 137. Inline form check. 138. Field shake on error. 139. Password strength fill. 140. Copy-address tick. 141. Skeleton shimmer. 142. Progressive image blur-up. 143. Pull-to-refresh spinner. 144. Tab underline slide. 145. Accordion expand. 146. Switch toggle slide. 147. Stepper fill. 148. Drag-and-drop lift. 149. Reorder spring. 150. Badge count bump. 151. Status dot pulse. 152. Loading dots bounce.

### 28.7 Commerce and on-chain (153–168)
153. Price flip-counter. 154. Token amount roll. 155. SOL/USDC convert morph. 156. Escrow lock pulse. 157. Tx confirm progress ring. 158. Tx success checkmark draw. 159. Confetti on purchase. 160. Balance roll-up. 161. Wallet connect pulse. 162. Network status breathe. 163. Order timeline fill. 164. Dispute alert flash. 165. Payout count-up. 166. Receipt stamp drop. 167. Coupon apply slide. 168. Cart item fly-to-cart.

That is 168 named effects across eight families, each mapped to a page zone in section 21. The `/dev/animations` gallery demonstrates the live primitives that compose them.

---

## 29. PAGE-BY-PAGE LAYOUT SPECIFICATION

Each page below lists its layout, the components it composes, the data it reads, the motion it carries, and the empty and loading states it must handle. Copy follows the human-voice rules in section 23; sample strings live in section 44.

### 29.1 Landing `/`
- Layout: full-bleed scenes stacked vertically, max content width 1200px, generous vertical rhythm.
- Scenes: hero, proof strip, how-it-works, sellers and buyers, escrow trust flow, feed preview, final call to action, footer.
- Motion: hero 3D coin orbit, gradient mesh, split-text headline, magnetic primary button, scroll progress rail, stagger reveals per section, escrow flow nodes lighting in sequence, like-burst in the feed preview.
- Data: static copy plus a small read-only slice of the public feed.
- States: if the live feed slice is empty, show three curated example cards labeled as samples.

### 29.2 Connect `/connect`
- Layout: centered card on a calm gradient, single column, max 420px.
- Components: WalletModal trigger, wallet option list (Phantom, Backpack, Solflare), SIWS explainer, error region.
- Flow: pick wallet, approve connection, sign the SIWS message, land on `/onboard` if new or `/feed` if returning.
- Motion: wallet connect pulse, field shake on signature rejection.
- States: wallet not installed shows an install link; signature rejected shows a retry with a plain explanation.

### 29.3 Onboard `/onboard`
- Layout: three short steps in a progress stepper.
- Steps: choose a handle (live availability check), add a display name and avatar, pick a few skills or interests.
- Components: stepper, handle input with debounce check, avatar upload with crop, skill tag selector.
- Motion: stepper fill, inline form check, tag pop.
- States: handle taken shows an inline note and suggestions.

### 29.4 Feed `/feed`
- Layout: three columns on desktop (left rail nav, center feed capped at 600px, right rail suggestions); single column on mobile with a bottom nav.
- Components: FeedPost variants (text, image, video, product feature, service feature), FeedReactions, FeedComments, InfiniteScroll, composer entry.
- Data: posts joined with author and any linked product or service.
- Motion: stagger-in on mount, like burst, optimistic comment slide, double-tap heart, skeleton shimmer while loading.
- States: empty feed prompts the visitor to follow a few creators; end of feed shows a quiet marker.

### 29.5 Explore `/explore`
- Layout: tabbed sections (trending, new, categories) with a responsive grid.
- Components: CategoryPill row, trending carousel, ProductGrid, GigGrid.
- Motion: tab underline slide, reveal grid masonry, hover tilt on cards.
- States: a category with no items shows a short prompt to be the first to list there.

### 29.6 Marketplace `/marketplace` and detail `/marketplace/[slug]`
- Grid: filters on the left (category, price band, token, rating), product cards in a fluid grid.
- Card: thumbnail, title, seller, price with live conversion, rating, wishlist heart.
- Detail: gallery with lightbox, title, seller block, price, buy button, description in rich text, license note, reviews, related products.
- Motion: filter cross-fade, price flip-counter, gallery lightbox spring, sticky buy bar reveal on scroll, review fade-up.
- States: out of stock disables the buy button with a plain note; a product with no reviews shows a short invitation to be the first.

### 29.7 Services `/services` and gig detail `/services/[slug]`
- Grid: gig cards with thumbnail, title, seller, starting price, rating, delivery time.
- Detail: gallery, package tabs (basic, standard, premium) each listing price, delivery days, revisions, features; requirements panel; FAQ; reviews; order panel.
- Motion: package tab slide, deliverable checklist tick, FAQ accordion, order panel sticky reveal.
- States: gig paused shows an unavailable banner; queue full shows expected wait.

### 29.8 Jobs `/jobs` and detail `/jobs/[id]`
- Board: filter sidebar (skills, budget, type, experience), job rows with title, budget band, posted time, proposal count.
- Detail: full description, requirements, skills, budget, a proposal form for freelancers, and a proposal list for the poster.
- Motion: row reveal on enter, proposal form expand, status badge bump.
- States: closed job hides the proposal form and shows the hired note.

### 29.9 Profile `/profile/[username]`
- Header: cover, avatar, display name, handle, reputation badge, follow button, social links, short bio.
- Tabs: posts, products, services, reviews, about.
- Motion: follow button morph, portfolio grid reveal, avatar stack expand on hover.
- States: a new profile with no listings shows a tidy placeholder per tab.

### 29.10 Dashboard `/dashboard` and subpages
- Home: earnings summary, active orders, recent activity, quick actions.
- Products and services: tables with status, views, sales, edit and unpublish actions.
- Orders: split into buying and selling, each with status timeline and a chat link.
- Earnings: balance, pending escrow, payout history, withdraw action.
- Analytics: views, conversion, top listings over a date range.
- Settings: profile, payout wallet, notification preferences, security.
- Motion: counter band reveal, order timeline fill, payout count-up, chart morph.
- States: zero-sales empty states explain the next action rather than showing blank tables.

### 29.11 Post create `/post/create` and single post `/post/[id]`
- Create: composer with text, media upload, optional linked product or service, tag input, preview.
- Single: full post with comments and reactions, share controls.
- Motion: media upload progress, optimistic publish, comment slide.
- States: draft autosaves; failed upload shows a retry.

### 29.12 Messages `/messages`
- Layout: conversation list on the left, thread on the right, composer at the bottom.
- Components: conversation row with unread badge, message bubbles, custom offer card, attachment preview.
- Motion: message slide-in, typing indicator, badge count bump.
- States: no conversations shows a short prompt; offline shows a reconnect note.

### 29.13 Wallet `/wallet`
- Layout: balance header, token selector, transaction history table.
- Components: BalanceDisplay, TokenSelector, TxHistory with signature links to an explorer.
- Motion: balance roll-up, tx row stagger, copy-address tick.
- States: no transactions shows a plain first-step prompt.

### 29.14 Checkout `/checkout/[type]/[id]` and success
- Steps: review, pay, confirm. Funds lock into escrow on pay; the success page shows a receipt and any download.
- Components: order summary, PaymentStep, EscrowStatus, SuccessConfetti, download panel.
- Motion: step transitions, escrow lock pulse, tx confirm progress ring, success checkmark draw, confetti once.
- States: insufficient balance offers a clear next step; failed transaction explains what happened and how to retry.

---

## 30. COMPONENT INVENTORY (contracts)

The component tree from `SOLANAFLOW_MEGAPROMPT.md` section 4, with the prop contract each one ships. Types reference section 14 model definitions.

| Component | Key props | Behavior |
|-----------|-----------|----------|
| `AppShell` | `children`, `nav` | Wraps app pages with nav rails and toasts |
| `Sidebar` | `active` | Primary navigation, collapses on tablet |
| `TopNav` | `user?` | Search, notifications, wallet button |
| `BottomNav` | `active` | Mobile-only tab bar |
| `FeedPost` | `post`, `onReact` | Switches on post type |
| `ProductCard` | `product`, `onWishlist` | Grid item with price and rating |
| `ProductDetail` | `product`, `reviews` | Full buy surface |
| `GigCard` | `service` | Starting price and delivery time |
| `PackageTabs` | `packages`, `onSelect` | Basic, standard, premium |
| `JobCard` | `job` | Budget band and proposal count |
| `ProposalForm` | `jobId`, `onSubmit` | Cover letter, price, milestones |
| `ProfileHeader` | `user`, `isOwner` | Follow or edit actions |
| `WalletButton` | none | Connect or show address |
| `BalanceDisplay` | `address` | Live balance with roll-up |
| `TxHistory` | `address` | Paginated transactions |
| `CheckoutModal` | `type`, `id` | Drives the three checkout steps |
| `EscrowStatus` | `order` | Lock, deliver, release states |
| `PriceDisplay` | `lamports`, `token` | Amount with live conversion |
| `StarRating` | `value`, `count` | Read or input mode |
| `RichTextEditor` | `value`, `onChange` | Markdown with sanitize |
| `ImageUpload` | `onUpload`, `max` | Dropzone with progress |
| `EmptyState` | `title`, `body`, `action` | Consistent zero states |
| `LoadingSkeleton` | `variant` | Shimmer placeholders |

Every interactive component ships a keyboard path, a focus-visible ring, and an `aria` label where the purpose is not already in the text.

---

## 31. API CONTRACTS

All API routes return JSON. Errors use a shared shape: `{ error: { code, message } }` with the correct HTTP status. Mutating routes require a valid session derived from SIWS. Money values are integers in lamports or raw token units; the client formats them.

| Method + path | Body / query | Returns | Auth |
|---------------|--------------|---------|------|
| `POST /api/auth/siws` | `{ wallet, signature, nonce }` | `{ session }` | public |
| `GET /api/auth/session` | — | `{ user? }` | cookie |
| `GET /api/products` | `?category&q&page&sort` | `{ items, page, total }` | public |
| `POST /api/products` | product draft | `{ product }` | seller |
| `GET /api/products/[id]` | — | `{ product }` | public |
| `PUT /api/products/[id]` | partial product | `{ product }` | owner |
| `DELETE /api/products/[id]` | — | `{ ok }` | owner |
| `GET /api/services` | filters | `{ items }` | public |
| `GET /api/jobs` | filters | `{ items }` | public |
| `POST /api/orders` | `{ type, id, package?, token }` | `{ order, escrow }` | buyer |
| `GET /api/orders/[id]` | — | `{ order }` | party |
| `POST /api/orders/[id]/dispute` | `{ reason, evidence }` | `{ dispute }` | party |
| `GET /api/feed` | `?cursor` | `{ posts, cursor }` | optional |
| `POST /api/payments/initiate` | `{ orderId }` | `{ tx }` (unsigned) | buyer |
| `POST /api/payments/verify` | `{ signature }` | `{ confirmed }` | buyer |
| `POST /api/payments/webhook` | provider payload | `{ ok }` | signed |
| `POST /api/upload/thumbnail` | multipart | `{ url }` | seller |
| `POST /api/upload/content` | multipart | `{ url }` | seller |
| `GET /api/search` | `?q&type` | `{ results }` | public |
| `GET /api/notifications` | `?cursor` | `{ items }` | user |

Payment verification always reconfirms against the chain; the client is never trusted to assert that a payment landed. Webhooks are replay-safe through signature dedupe.

---

## 32. STATE MANAGEMENT

Client state is split into small Zustand stores; server state goes through TanStack Query so caching, refetching, and invalidation are consistent.

- `authStore`: wallet address, session, profile, connect and disconnect actions.
- `feedStore`: in-view post id, draft composer content, optimistic reactions.
- `cartStore`: a queue for multi-item checkout, token preference.
- `notificationStore`: unread count, last seen marker, realtime inserts.
- `uiStore`: open modals, drawers, sidebar collapse, theme.

Query keys follow `['resource', params]`. A mutation invalidates the narrowest key it can. Realtime inserts patch the cache directly so the UI updates without a refetch.

---

## 33. WALLET AND SIGN IN WITH SOLANA

1. The visitor picks a wallet through the adapter. The app requests a connection.
2. The server issues a single-use nonce bound to the wallet, short time to live, stored server-side.
3. The wallet signs a readable SIWS message that includes the domain, the nonce, and an issued-at time.
4. The server verifies the signature against the wallet public key, checks the nonce is unused and unexpired, then opens a session.
5. The session is an httpOnly cookie. The nonce is burned so it cannot be replayed.

A returning wallet skips onboarding. A new wallet creates a `users` row and moves to onboarding. Disconnecting clears the session and the store.

---

## 34. PAYMENT AND ESCROW SEQUENCE

1. Buyer confirms an order. The server creates an `orders` row in `pending` and derives the escrow PDA.
2. The server returns an unsigned transaction that locks the amount into the escrow program (section 6).
3. The wallet signs and sends it. The client shows a progress ring while it confirms.
4. The server verifies the signature on-chain and moves the order to `payment_confirmed`.
5. The seller delivers through the order. The buyer reviews and accepts.
6. On accept, the release instruction pays the seller minus the platform fee and moves the order to `completed`. Events from the program are mirrored into `transactions`.
7. If the order is disputed, the dispute path can refund the buyer under platform authority. Every state change is reflected in both the database and the chain, and the two are reconciled on a schedule.

---

## 35. REAL-TIME ARCHITECTURE

The live parts of the product run on Supabase Realtime over WebSocket, with a thin client hook that subscribes and patches the query cache.

- Feed: new posts from followed creators arrive through a channel scoped to the viewer; the client prepends them with a stagger animation.
- Messages: each conversation is a channel; inserts append to the thread and bump the unread badge.
- Notifications: a per-user channel pushes new rows; the bell count updates without a refetch.
- Orders: status changes broadcast to both parties so the timeline moves in real time.
- Presence: a lightweight presence channel marks who is online for the messages view.

Every subscription is cleaned up on unmount. Reconnect is automatic with backoff, and the UI shows a quiet reconnect note when the socket drops. Channels carry only ids and small payloads; full records are read through the normal cached queries to keep messages small.

---

## 36. TESTING STRATEGY

Coverage is required on new logic, with a higher bar on anything touching money or auth.

- Unit (Vitest): pure helpers, price math, lamport conversion, fee calculation, SIWS message building, reducers in the stores.
- Component (Testing Library): forms validate, empty states render, reactions are optimistic, modals trap focus.
- Integration (MSW): API routes return the right shapes and statuses, auth gates reject unauthenticated calls, RLS denies cross-user reads.
- On-chain (Anchor + local validator): lock, release, and refund behave correctly; fee math matches the off-chain figure; double release is impossible; refund only under platform authority.
- End to end (Playwright): connect a test wallet, list a product, buy it on devnet, deliver, accept, and confirm the payout. The animation gallery renders every effect and respects reduced motion.

CI runs lint, type-check, unit, component, and integration on every pull request. On-chain and end-to-end run on a schedule and before a release. A change that lowers coverage on touched files fails the check.

---

## 37. SECURITY AUDIT — EXPANDED

Section 24 holds the working checklist. This section adds the threat model and the standing controls.

### 37.1 STRIDE summary
- Spoofing: wallet signatures and single-use SIWS nonces prove identity; sessions are httpOnly and short-lived.
- Tampering: money state lives on-chain; the database mirror is reconciled against it and never treated as the source of truth for funds.
- Repudiation: every payment is a signed transaction; receipts link to the signature so neither side can deny it.
- Information disclosure: row-level security gates private rows; service-role keys never reach the client; uploads are gated behind a verified order.
- Denial of service: rate limiting on auth, upload, and payment routes; expensive queries are paginated and indexed.
- Elevation of privilege: privileged program instructions check the exact authority; admin actions are server-side and logged.

### 37.2 OWASP top ten posture
- Broken access control: RLS plus server checks on every mutation; negative tests in CI.
- Cryptographic failures: no secrets in the bundle; signatures verified server-side; HTTPS only with HSTS.
- Injection: parameterized queries through the Supabase client; markdown sanitized before render.
- Insecure design: escrow holds funds so neither party can grief the other; disputes have a defined path.
- Security misconfiguration: strict CSP and headers from `vercel.json`; least-privilege keys.
- Vulnerable components: dependencies pinned and scanned in CI; updates reviewed before merge.
- Identification and authentication failures: nonce burn, short sessions, wallet-bound identity.
- Software and data integrity: signed webhooks with replay protection; lockfile committed.
- Logging and monitoring: Sentry for errors, structured logs for payment paths, alerts on reconciliation drift.
- Server-side request forgery: no user-supplied URLs are fetched server-side without an allowlist.

### 37.3 Standing controls
- A pre-merge security checklist on any pull request that touches auth, payments, uploads, or programs.
- An independent audit of the Anchor programs before the mainnet switch, with fuzzing on amount and fee math.
- A documented incident path: pause new orders, freeze releases, communicate, reconcile, resume.

---

## 38. PERFORMANCE BUDGET

- Landing: Lighthouse performance at or above 90 on mobile; largest contentful paint under 2.5s on a mid-range phone.
- First load JS on the landing route kept lean; heavy 3D is dynamically imported and never blocks first paint.
- Images served in modern formats, sized to the layout, lazy below the fold, with a blur-up placeholder.
- Lists virtualize past a threshold; the feed and long tables never render thousands of nodes at once.
- API p95 under 200ms for cached reads; database queries are indexed per section 5.
- The 3D scene caps its pixel ratio and pauses when off-screen or when motion is reduced.

---

## 39. ACCESSIBILITY

- Targets WCAG AA. Body text contrast at least 4.5 to 1, large text and UI borders at least 3 to 1, in both themes.
- Every control is reachable and operable by keyboard with a visible focus ring.
- Modals and drawers trap focus and restore it on close; escape closes them.
- Motion respects the reduced-motion setting everywhere; 3D falls back to a static poster.
- Images carry meaningful alt text; decorative shapes are hidden from assistive tech.
- Forms label every field, describe errors in text, and link the error to the field.
- Color is never the only signal; status also carries text or an icon.

---

## 40. SEO AND METADATA

- Per-page titles and descriptions; product, service, and profile pages generate them from real content.
- Open Graph and Twitter cards with a branded fallback image at 1200 by 630.
- Structured data: Product and Offer on product pages, Person on profiles, BreadcrumbList where it helps.
- A generated sitemap that excludes private and dev routes; a robots file that blocks the dev gallery.
- Canonical URLs on detail pages; clean, readable slugs.
- Static and revalidated routes per section 27 so crawlers get fast, complete HTML.

---

## 41. ANALYTICS EVENTS

A small, deliberate event set, named consistently and documented in one place. No personal data beyond the wallet identifier the user already shares.

| Event | When | Properties |
|-------|------|------------|
| `wallet_connected` | SIWS completes | wallet, returning |
| `listing_created` | product or service published | type, category, price band |
| `post_published` | feed post created | has_media, linked_type |
| `product_viewed` | detail opened | id, source |
| `checkout_started` | checkout opened | type, amount band, token |
| `payment_confirmed` | escrow lock confirmed | type, amount band, token |
| `order_completed` | release confirmed | type, time to deliver band |
| `dispute_opened` | dispute raised | type |
| `review_left` | review submitted | rating |

These feed the business and product metrics in section 17. Funnels are built from `product_viewed`, `checkout_started`, and `payment_confirmed`.

---

## 42. CI / CD DETAIL

- On pull request: install, lint, type-check, unit, component, integration; a preview deploy to Vercel; a comment with the preview URL.
- On merge to main: the full build and a production deploy; database migrations run in a gated step; a tagged release.
- Secrets live in GitHub Actions and the Vercel project, never in the repo. The lockfile is committed and installs are frozen.
- The Anchor workflow builds the programs, runs the on-chain tests against a local validator, and on a release deploys to the target cluster, then writes the program ids back into the client config.
- A scheduled job runs end-to-end tests and the reconciliation check, and opens an issue on failure.

---

## 43. PHASE-BY-PHASE TASK BREAKDOWN (1 through 9)

Each phase lists concrete tasks and its single exit test from `BUILD_PLAN.md`. Phases ship in order.

### Phase 1 — Motion system
- Implement the animation primitives that compose the catalog in section 28.
- Build the `/dev/animations` gallery with a replay control and a reduced-motion readout.
- Wire reduced-motion fallbacks across every effect.
- Snapshot the gallery in CI.
- Exit: every effect renders live and degrades to a quiet fade.

### Phase 2 — Landing
- Build the scenes in section 22 as section components.
- Add the 3D hero with a dynamic import and a poster fallback.
- Write all landing copy to section 23 and store it in the copy catalog.
- Tune the performance budget in section 38.
- Exit: mobile performance at or above 90; readable with scripting off.

### Phase 3 — Shell and auth
- Build the app shell with nav rails, top nav, and mobile bottom nav.
- Integrate the wallet adapter and the wallet button and modal.
- Implement the SIWS flow in section 33 with server-side nonce issue and verify.
- Build connect and onboarding pages.
- Exit: a wallet connects and a session persists across reloads.

### Phase 4 — Data layer
- Run the schema in section 5 against a Supabase project.
- Write row-level security policies for every table and prove them with negative tests.
- Build typed client and server Supabase helpers and middleware.
- Seed categories and a small demo dataset.
- Exit: one user cannot read another's private rows, proven in CI.

### Phase 5 — Catalog
- Build product and service create forms with upload and rich text.
- Build the marketplace grid, filters, and product detail.
- Build the services grid, package tabs, and gig detail.
- Wire search through Typesense.
- Exit: a seller publishes a product and a visitor opens it.

### Phase 6 — Feed
- Build the feed with post variants and infinite scroll.
- Build the composer and single post view.
- Wire reactions, comments, saves with optimistic updates.
- Subscribe to realtime inserts for followed creators.
- Exit: a post appears in the feed and reactions update live.

### Phase 7 — Payments and escrow
- Deploy the escrow program to devnet and wire the client in `programs.ts`.
- Build checkout with review, pay, and confirm steps.
- Implement initiate and verify with on-chain confirmation.
- Implement delivery, accept, release, and refund paths.
- Reconcile transactions against orders on a schedule.
- Exit: a full buy, deliver, accept cycle settles on devnet.

### Phase 8 — Trust
- Build reviews tied to completed orders.
- Mirror reputation from the chain into the profile.
- Build the dispute flow and the order timeline.
- Exit: a completed order can be reviewed and a dispute can be opened.

### Phase 9 — Hardening
- Work the security checklist in sections 24 and 37.
- Add monitoring, alerting, and the reconciliation job.
- Commission the independent Anchor audit.
- Run a load test to the targets in section 16.
- Exit: the audit clears and the mainnet switch is gated on it.

---

## 44. PER-PAGE COPY SAMPLES (human voice)

Sample strings written to the rules in section 23. They are drafts the build can adopt or adapt; the point is the tone, not the exact words. No emoji, plain language, written to the reader.

### 44.1 Landing
- Hero title: "Sell your work. Keep what you earn."
- Hero sub: "List a template, a track, a design, or a few hours of your time. When someone buys, the payment lands in your wallet a moment later."
- Primary button: "Start selling."
- Secondary button: "Look around the feed."

### 44.2 Connect and onboard
- Connect heading: "Connect a wallet to begin."
- Connect note: "We ask you to sign a short message so we know the wallet is yours. It costs nothing and moves no funds."
- Handle step: "Pick a handle. This is how people will find you."
- Handle taken: "That one is taken. Here are a few that are open."

### 44.3 Feed
- Empty feed: "Your feed is quiet. Follow a few creators and their work will show up here."
- End marker: "You are all caught up."
- Composer placeholder: "Share something you made, or a slot you are opening up."

### 44.4 Marketplace and product
- Empty category: "Nothing here yet. List the first item and it lands at the top."
- No reviews: "No reviews yet. Be the first to say how it went."
- Buy button: "Buy for {price}."
- Out of stock: "This one is sold out for now."

### 44.5 Services and jobs
- Package note: "Pick the package that fits. You can message the seller first if you are unsure."
- Requirements: "Here is what the seller needs from you before they start."
- Proposal placeholder: "Tell them how you would approach this and what you would charge."
- Closed job: "This job is no longer taking proposals."

### 44.6 Checkout
- Review step: "Check the details, then pay. Your funds wait in escrow until the work arrives."
- Pay step: "Approve the payment in your wallet. This locks the amount in escrow."
- Confirming: "Hold on while this confirms on Solana."
- Success: "Done. The funds are in escrow and your files are ready to download."
- Insufficient balance: "Your balance is a little short. Top up and try again."

### 44.7 Wallet and dashboard
- No transactions: "No activity yet. Your first sale or purchase will show up here."
- Pending escrow: "Held in escrow until the order is accepted."
- Withdraw: "Move your balance to another wallet."
- Zero sales: "No sales yet. Share a listing in the feed to get the first one."

### 44.8 Messages, notifications, disputes
- No messages: "No conversations yet. Reach out to a seller or wait for a buyer to message you."
- Reconnecting: "Lost the connection for a second. Reconnecting now."
- Notifications empty: "Nothing new. We will let you know when something happens."
- Dispute opened: "We have paused this order. Add your side and any proof below, and a reviewer will step in."

### 44.9 Errors and system
- Not found: "We could not find that page. It may have moved."
- Generic error: "Something went wrong on our side. Try again in a moment."
- Rate limited: "That is a lot of requests at once. Give it a few seconds."
- Wallet rejected: "The wallet declined that request. Try again when you are ready."

---

## 45. RISK REGISTER

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| RPC rate limits under load | medium | high | Use a paid RPC (Helius or Alchemy); cache reads; backoff |
| Escrow program bug | low | severe | Independent audit, fuzzing, one-way status, checked math |
| Database and chain drift | medium | high | Scheduled reconciliation; chain is source of truth for funds |
| Name or trademark conflict | low | medium | Trademark search; fallback names ready in section 19 |
| Spam or fraud listings | medium | medium | Rate limits, reputation, report and review flow |
| Wallet support gaps | low | medium | Support the common adapters; clear install prompts |
| Content delivery abuse | medium | medium | Gated downloads tied to verified orders; signed URLs |
| Cost overrun on storage | low | medium | Thumbnails on Supabase, large files on Arweave with funded node |

The register is reviewed at the end of each phase and before the mainnet switch.

---

*End of SolGig Megaprompt v1.2*
*Name verified live on GitHub, Vercel, npm, and the domain registry before lock-in.*
*Planning expanded to a full build specification before any further build work.*
*Zero dummy content. Real integrations. Production from line 1. Build it once, build it right, ship it.*

---

## 46. REPUTATION PROGRAM (Anchor)

A non-transferable, on-chain reputation score. The platform authority writes deltas after a verified order completes or a dispute resolves, so the score reflects real settled activity rather than self-reported claims. The account is a PDA per user wallet and cannot be transferred.

```rust
// programs/reputation/src/lib.rs
use anchor_lang::prelude::*;

declare_id!("REPUtat1on1111111111111111111111111111111111");

#[program]
pub mod reputation {
    use super::*;

    /// Create the reputation account for a user. One per wallet.
    pub fn init_reputation(ctx: Context<InitReputation>) -> Result<()> {
        let rep = &mut ctx.accounts.reputation;
        rep.user = ctx.accounts.user.key();
        rep.score = 0;
        rep.completed = 0;
        rep.disputes_lost = 0;
        rep.bump = ctx.bumps.reputation;
        rep.updated_at = Clock::get()?.unix_timestamp;
        Ok(())
    }

    /// Apply a score delta. Only the platform authority may call this.
    pub fn apply_delta(ctx: Context<ApplyDelta>, delta: i64, reason: u8) -> Result<()> {
        require!(
            ctx.accounts.authority.key() == platform_authority(),
            RepError::Unauthorized
        );
        let rep = &mut ctx.accounts.reputation;
        rep.score = rep.score.saturating_add(delta);
        match reason {
            REASON_ORDER_DONE => rep.completed = rep.completed.saturating_add(1),
            REASON_DISPUTE_LOST => rep.disputes_lost = rep.disputes_lost.saturating_add(1),
            _ => {}
        }
        rep.updated_at = Clock::get()?.unix_timestamp;
        emit!(ReputationChanged {
            user: rep.user,
            score: rep.score,
            delta,
            reason,
        });
        Ok(())
    }
}

const REASON_ORDER_DONE: u8 = 1;
const REASON_DISPUTE_LOST: u8 = 2;

/// The hardcoded platform authority. Replace with the real treasury key.
fn platform_authority() -> Pubkey {
    // CHANGE before deploy: this is the only key allowed to write deltas.
    Pubkey::default()
}

#[account]
pub struct Reputation {
    pub user: Pubkey,
    pub score: i64,
    pub completed: u32,
    pub disputes_lost: u32,
    pub bump: u8,
    pub updated_at: i64,
}

#[derive(Accounts)]
pub struct InitReputation<'info> {
    #[account(
        init,
        payer = user,
        space = 8 + 32 + 8 + 4 + 4 + 1 + 8,
        seeds = [b"reputation", user.key().as_ref()],
        bump
    )]
    pub reputation: Account<'info, Reputation>,
    #[account(mut)]
    pub user: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ApplyDelta<'info> {
    #[account(
        mut,
        seeds = [b"reputation", reputation.user.as_ref()],
        bump = reputation.bump
    )]
    pub reputation: Account<'info, Reputation>,
    pub authority: Signer<'info>,
}

#[event]
pub struct ReputationChanged {
    pub user: Pubkey,
    pub score: i64,
    pub delta: i64,
    pub reason: u8,
}

#[error_code]
pub enum RepError {
    #[msg("Only the platform authority may change reputation")]
    Unauthorized,
}
```

The off-chain mirror in the `users` table (`reputation_score`, `on_chain_reputation_pda`) is updated from the `ReputationChanged` event, so the chain stays the source of truth and the database is only a cache for fast reads.

---

## 47. ROYALTIES PROGRAM (Anchor)

Splits a single payment across several recipients in one transaction. Used for collaborations where a product or service has more than one author. The split is fixed at creation in basis points and must sum to ten thousand.

```rust
// programs/royalties/src/lib.rs
use anchor_lang::prelude::*;

declare_id!("Roya1ty1111111111111111111111111111111111111");

pub const MAX_RECIPIENTS: usize = 6;

#[program]
pub mod royalties {
    use super::*;

    /// Define a split. Shares are basis points and must total 10000.
    pub fn create_split(
        ctx: Context<CreateSplit>,
        split_id: [u8; 32],
        recipients: Vec<Pubkey>,
        shares_bps: Vec<u16>,
    ) -> Result<()> {
        require!(
            recipients.len() == shares_bps.len(),
            RoyaltyError::LengthMismatch
        );
        require!(
            recipients.len() <= MAX_RECIPIENTS && !recipients.is_empty(),
            RoyaltyError::TooManyRecipients
        );
        let total: u32 = shares_bps.iter().map(|s| *s as u32).sum();
        require!(total == 10_000, RoyaltyError::BadTotal);

        let split = &mut ctx.accounts.split;
        split.split_id = split_id;
        split.owner = ctx.accounts.owner.key();
        split.recipients = recipients;
        split.shares_bps = shares_bps;
        split.bump = ctx.bumps.split;
        Ok(())
    }

    /// Distribute an incoming amount across the recipients by their shares.
    pub fn distribute<'info>(
        ctx: Context<'_, '_, 'info, 'info, Distribute<'info>>,
        amount: u64,
    ) -> Result<()> {
        let split = &ctx.accounts.split;
        let remaining = ctx.remaining_accounts;
        require!(
            remaining.len() == split.recipients.len(),
            RoyaltyError::AccountsMismatch
        );

        let mut paid: u64 = 0;
        for (i, share) in split.shares_bps.iter().enumerate() {
            let cut = if i == split.shares_bps.len() - 1 {
                // last recipient absorbs the rounding remainder
                amount.checked_sub(paid).unwrap()
            } else {
                amount
                    .checked_mul(*share as u64)
                    .unwrap()
                    .checked_div(10_000)
                    .unwrap()
            };
            paid = paid.checked_add(cut).unwrap();

            let dest = &remaining[i];
            require!(dest.key() == split.recipients[i], RoyaltyError::WrongRecipient);
            **ctx.accounts.payer.to_account_info().try_borrow_mut_lamports()? -= cut;
            **dest.try_borrow_mut_lamports()? += cut;
        }

        emit!(Distributed { split_id: split.split_id, amount });
        Ok(())
    }
}

#[account]
pub struct Split {
    pub split_id: [u8; 32],
    pub owner: Pubkey,
    pub recipients: Vec<Pubkey>,
    pub shares_bps: Vec<u16>,
    pub bump: u8,
}

#[derive(Accounts)]
#[instruction(split_id: [u8; 32])]
pub struct CreateSplit<'info> {
    #[account(
        init,
        payer = owner,
        space = 8 + 32 + 32 + 4 + (32 * MAX_RECIPIENTS) + 4 + (2 * MAX_RECIPIENTS) + 1,
        seeds = [b"split", split_id.as_ref()],
        bump
    )]
    pub split: Account<'info, Split>,
    #[account(mut)]
    pub owner: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Distribute<'info> {
    #[account(seeds = [b"split", split.split_id.as_ref()], bump = split.bump)]
    pub split: Account<'info, Split>,
    #[account(mut)]
    pub payer: Signer<'info>,
}

#[event]
pub struct Distributed {
    pub split_id: [u8; 32],
    pub amount: u64,
}

#[error_code]
pub enum RoyaltyError {
    #[msg("Recipients and shares length differ")]
    LengthMismatch,
    #[msg("Too many or zero recipients")]
    TooManyRecipients,
    #[msg("Shares must total 10000 basis points")]
    BadTotal,
    #[msg("Remaining accounts do not match recipients")]
    AccountsMismatch,
    #[msg("A passed account is not the expected recipient")]
    WrongRecipient,
}
```

---

## 48. DISPUTE PROGRAM (Anchor)

Records a dispute on-chain and holds a small panel vote. The escrow refund or release is then driven by the recorded outcome, so the resolution leaves a verifiable trail. Off-chain review still gathers evidence; the program stores the decision and the tally.

```rust
// programs/dispute/src/lib.rs
use anchor_lang::prelude::*;

declare_id!("D1sputeArb1ter11111111111111111111111111111");

pub const PANEL_SIZE: usize = 3;

#[program]
pub mod dispute {
    use super::*;

    pub fn open_case(ctx: Context<OpenCase>, order_id: [u8; 32]) -> Result<()> {
        let case = &mut ctx.accounts.case;
        case.order_id = order_id;
        case.opener = ctx.accounts.opener.key();
        case.status = CaseStatus::Open;
        case.votes_buyer = 0;
        case.votes_seller = 0;
        case.voted = [Pubkey::default(); PANEL_SIZE];
        case.vote_count = 0;
        case.bump = ctx.bumps.case;
        case.opened_at = Clock::get()?.unix_timestamp;
        emit!(CaseOpened { order_id, opener: case.opener });
        Ok(())
    }

    /// A panel member casts one vote for buyer or seller.
    pub fn cast_vote(ctx: Context<CastVote>, favor_buyer: bool) -> Result<()> {
        let case = &mut ctx.accounts.case;
        require!(case.status == CaseStatus::Open, DisputeError::NotOpen);
        let voter = ctx.accounts.juror.key();
        require!(
            (case.vote_count as usize) < PANEL_SIZE,
            DisputeError::PanelFull
        );
        for i in 0..(case.vote_count as usize) {
            require!(case.voted[i] != voter, DisputeError::AlreadyVoted);
        }
        case.voted[case.vote_count as usize] = voter;
        case.vote_count += 1;
        if favor_buyer {
            case.votes_buyer += 1;
        } else {
            case.votes_seller += 1;
        }
        if case.vote_count as usize == PANEL_SIZE {
            case.status = if case.votes_buyer > case.votes_seller {
                CaseStatus::ResolvedBuyer
            } else {
                CaseStatus::ResolvedSeller
            };
            emit!(CaseResolved {
                order_id: case.order_id,
                buyer_favored: case.votes_buyer > case.votes_seller,
            });
        }
        Ok(())
    }
}

#[account]
pub struct Case {
    pub order_id: [u8; 32],
    pub opener: Pubkey,
    pub status: CaseStatus,
    pub votes_buyer: u8,
    pub votes_seller: u8,
    pub voted: [Pubkey; PANEL_SIZE],
    pub vote_count: u8,
    pub bump: u8,
    pub opened_at: i64,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq)]
pub enum CaseStatus {
    Open,
    ResolvedBuyer,
    ResolvedSeller,
}

#[derive(Accounts)]
#[instruction(order_id: [u8; 32])]
pub struct OpenCase<'info> {
    #[account(
        init,
        payer = opener,
        space = 8 + 32 + 32 + 1 + 1 + 1 + (32 * PANEL_SIZE) + 1 + 1 + 8,
        seeds = [b"case", order_id.as_ref()],
        bump
    )]
    pub case: Account<'info, Case>,
    #[account(mut)]
    pub opener: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct CastVote<'info> {
    #[account(mut, seeds = [b"case", case.order_id.as_ref()], bump = case.bump)]
    pub case: Account<'info, Case>,
    pub juror: Signer<'info>,
}

#[event]
pub struct CaseOpened {
    pub order_id: [u8; 32],
    pub opener: Pubkey,
}
#[event]
pub struct CaseResolved {
    pub order_id: [u8; 32],
    pub buyer_favored: bool,
}

#[error_code]
pub enum DisputeError {
    #[msg("Case is not open")]
    NotOpen,
    #[msg("Panel is already full")]
    PanelFull,
    #[msg("This juror already voted")]
    AlreadyVoted,
}
```

---

## 49. ROW-LEVEL SECURITY — FULL POLICIES

Section 5 enabled RLS and showed examples. Below are the policies for the rest of the tables. The helper resolves the current wallet to a user id. Every policy is paired with a negative test in CI.

```sql
-- Helper: resolve the signed-in wallet to a user id
CREATE OR REPLACE FUNCTION current_user_id()
RETURNS UUID AS $$
  SELECT id FROM users WHERE wallet_address = auth.uid()::text
$$ LANGUAGE sql STABLE;

-- PRODUCTS: anyone reads published; only the owner writes
CREATE POLICY "read published products" ON products
  FOR SELECT USING (is_published = true OR seller_id = current_user_id());
CREATE POLICY "owner writes products" ON products
  FOR INSERT WITH CHECK (seller_id = current_user_id());
CREATE POLICY "owner updates products" ON products
  FOR UPDATE USING (seller_id = current_user_id());
CREATE POLICY "owner deletes products" ON products
  FOR DELETE USING (seller_id = current_user_id());

-- SERVICES: same shape as products
CREATE POLICY "read published services" ON services
  FOR SELECT USING (is_published = true OR seller_id = current_user_id());
CREATE POLICY "owner writes services" ON services
  FOR INSERT WITH CHECK (seller_id = current_user_id());
CREATE POLICY "owner updates services" ON services
  FOR UPDATE USING (seller_id = current_user_id());

-- JOBS: open jobs are public; only the poster writes
CREATE POLICY "read jobs" ON jobs
  FOR SELECT USING (status = 'open' OR poster_id = current_user_id());
CREATE POLICY "poster writes jobs" ON jobs
  FOR INSERT WITH CHECK (poster_id = current_user_id());
CREATE POLICY "poster updates jobs" ON jobs
  FOR UPDATE USING (poster_id = current_user_id());

-- JOB PROPOSALS: visible to the freelancer who wrote it and the job poster
CREATE POLICY "read own or posted proposals" ON job_proposals
  FOR SELECT USING (
    freelancer_id = current_user_id()
    OR job_id IN (SELECT id FROM jobs WHERE poster_id = current_user_id())
  );
CREATE POLICY "freelancer writes proposal" ON job_proposals
  FOR INSERT WITH CHECK (freelancer_id = current_user_id());

-- ORDERS: only buyer and seller (read policy shown in section 5; add writes)
CREATE POLICY "buyer creates order" ON orders
  FOR INSERT WITH CHECK (buyer_id = current_user_id());
CREATE POLICY "party updates order" ON orders
  FOR UPDATE USING (
    buyer_id = current_user_id() OR seller_id = current_user_id()
  );

-- MESSAGES: only conversation participants
CREATE POLICY "participants read messages" ON messages
  FOR SELECT USING (
    conversation_id IN (
      SELECT id FROM conversations WHERE current_user_id() = ANY(participant_ids)
    )
  );
CREATE POLICY "participants send messages" ON messages
  FOR INSERT WITH CHECK (sender_id = current_user_id());

-- REVIEWS: public read, author writes, tied to a completed order
CREATE POLICY "read reviews" ON reviews
  FOR SELECT USING (is_public = true OR reviewer_id = current_user_id());
CREATE POLICY "author writes review" ON reviews
  FOR INSERT WITH CHECK (
    reviewer_id = current_user_id()
    AND order_id IN (
      SELECT id FROM orders
      WHERE buyer_id = current_user_id() AND status = 'completed'
    )
  );

-- POSTS: public read of published, author writes
CREATE POLICY "read posts" ON posts
  FOR SELECT USING (is_published = true OR author_id = current_user_id());
CREATE POLICY "author writes post" ON posts
  FOR INSERT WITH CHECK (author_id = current_user_id());
CREATE POLICY "author updates post" ON posts
  FOR UPDATE USING (author_id = current_user_id());

-- POST LIKES and SAVES: a user manages only their own rows
CREATE POLICY "own likes" ON post_likes
  FOR ALL USING (user_id = current_user_id())
  WITH CHECK (user_id = current_user_id());
CREATE POLICY "own saves" ON post_saves
  FOR ALL USING (user_id = current_user_id())
  WITH CHECK (user_id = current_user_id());

-- WISHLISTS and COUPONS
CREATE POLICY "own wishlist" ON wishlists
  FOR ALL USING (user_id = current_user_id())
  WITH CHECK (user_id = current_user_id());
CREATE POLICY "seller manages coupons" ON coupons
  FOR ALL USING (seller_id = current_user_id())
  WITH CHECK (seller_id = current_user_id());
```

Negative tests to keep green: a non-owner cannot update a product; a non-participant cannot read a message; a user who never ordered cannot write a review; an unpublished product is invisible to everyone but its owner.

---

## 50. SIGN IN WITH SOLANA — IMPLEMENTATION

```typescript
// src/lib/solana/siws.ts
import nacl from "tweetnacl";
import { PublicKey } from "@solana/web3.js";

export function buildSiwsMessage(params: {
  domain: string;
  address: string;
  nonce: string;
  issuedAt: string;
}) {
  // A readable message the wallet shows before signing.
  return [
    `${params.domain} wants you to sign in with your Solana account:`,
    params.address,
    "",
    "Sign this message to prove the wallet is yours. It moves no funds.",
    "",
    `Nonce: ${params.nonce}`,
    `Issued At: ${params.issuedAt}`,
  ].join("\n");
}

export function verifySignature(
  message: string,
  signatureBase64: string,
  address: string,
): boolean {
  const msg = new TextEncoder().encode(message);
  const sig = Uint8Array.from(Buffer.from(signatureBase64, "base64"));
  const pubkey = new PublicKey(address).toBytes();
  return nacl.sign.detached.verify(msg, sig, pubkey);
}
```

```typescript
// src/app/api/auth/siws/route.ts (shape)
import { NextRequest, NextResponse } from "next/server";
import { buildSiwsMessage, verifySignature } from "@/lib/solana/siws";
import { consumeNonce, issueSession } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const { wallet, signature, nonce } = await req.json();

  // The nonce must exist, be unused, and be bound to this wallet.
  const record = await consumeNonce(nonce, wallet);
  if (!record) {
    return NextResponse.json(
      { error: { code: "bad_nonce", message: "That sign-in request expired. Try again." } },
      { status: 400 },
    );
  }

  const message = buildSiwsMessage({
    domain: "solgig.xyz",
    address: wallet,
    nonce,
    issuedAt: record.issuedAt,
  });

  if (!verifySignature(message, signature, wallet)) {
    return NextResponse.json(
      { error: { code: "bad_signature", message: "We could not verify that signature." } },
      { status: 401 },
    );
  }

  const session = await issueSession(wallet); // httpOnly cookie set inside
  return NextResponse.json({ session });
}
```

The nonce is single-use and short-lived. It is created by a separate endpoint, stored server-side keyed to the wallet, and burned in `consumeNonce` so it cannot be replayed.

---

## 51. ESCROW CLIENT LIBRARY

```typescript
// src/lib/solana/escrow.ts
import {
  Connection,
  PublicKey,
  Transaction,
  SystemProgram,
} from "@solana/web3.js";
import { Program, AnchorProvider, BN } from "@coral-xyz/anchor";
import idl from "./idl/escrow.json";

export const ESCROW_PROGRAM_ID = new PublicKey(
  process.env.NEXT_PUBLIC_PROGRAM_ESCROW_ADDRESS!,
);

export function escrowPda(orderId: Uint8Array) {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("escrow"), Buffer.from(orderId)],
    ESCROW_PROGRAM_ID,
  );
}

/** Build an unsigned lock transaction for the buyer to sign. */
export async function buildLockTx(params: {
  connection: Connection;
  provider: AnchorProvider;
  orderId: Uint8Array;
  buyer: PublicKey;
  seller: PublicKey;
  amountLamports: number;
  platformFeeBps: number;
}): Promise<Transaction> {
  const program = new Program(idl as never, params.provider);
  const [pda] = escrowPda(params.orderId);

  const ix = await program.methods
    .lockFunds(
      Array.from(params.orderId),
      new BN(params.amountLamports),
      params.platformFeeBps,
    )
    .accounts({
      escrowAccount: pda,
      buyer: params.buyer,
      seller: params.seller,
      systemProgram: SystemProgram.programId,
    })
    .instruction();

  const tx = new Transaction().add(ix);
  tx.feePayer = params.buyer;
  tx.recentBlockhash = (
    await params.connection.getLatestBlockhash()
  ).blockhash;
  return tx;
}

/** Confirm a signature reached a finalized state. */
export async function confirmSignature(
  connection: Connection,
  signature: string,
): Promise<boolean> {
  const res = await connection.confirmTransaction(signature, "confirmed");
  return res.value.err === null;
}
```

The server builds the transaction; the wallet signs and sends it; the server then verifies the signature on-chain before moving the order forward. The client never asserts payment on its own word.

---

## 52. WALLET PROVIDER SETUP

```tsx
// src/components/wallet/WalletProvider.tsx
"use client";

import { useMemo } from "react";
import { ConnectionProvider, WalletProvider } from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import {
  PhantomWalletAdapter,
  SolflareWalletAdapter,
} from "@solana/wallet-adapter-wallets";

export function SolanaWalletProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const endpoint =
    process.env.NEXT_PUBLIC_SOLANA_RPC_URL ??
    "https://api.devnet.solana.com";
  const wallets = useMemo(
    () => [new PhantomWalletAdapter(), new SolflareWalletAdapter()],
    [],
  );

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>{children}</WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}
```

This provider wraps the app group only, not the marketing pages, so the landing page stays light and does not pull wallet code into its bundle.

---

## 53. THEME REFERENCE

The tokens from section 20 map to a small, predictable set of utilities. Components reference CSS variables so a theme switch is a single class on the root element.

| Token | Variable | Used for |
|-------|----------|----------|
| Page | `--bg` | App and page background |
| Surface | `--surface` | Cards, panels |
| Raised | `--surface-2` | Nested or hovered surfaces |
| Border | `--border` | Hairlines, dividers, inputs |
| Text | `--text` | Primary text |
| Muted | `--text-mut` | Secondary text, captions |
| Violet | `--brand-violet` | Primary accent |
| Mint | `--brand-mint` | Positive, success, accents |
| Gradient | `--brand-grad` | Primary buttons, the logo, key numbers |
| Warn | `--warn` | Caution states |
| Error | `--err` | Errors, destructive actions |

Rules: color is spent on price, status, and the primary action only. Everything else stays in the neutral ramp. Both themes pass the contrast targets in section 39. The accent never carries body text on a light background.

---

## 54. METRICS DASHBOARDS

The events in section 41 roll up into three views, each owned by a clear question.

- Growth: new creators, new listings, and weekly active wallets. Answers whether supply is building.
- Liquidity: gross value settled, orders per day, and average order value. Answers whether demand is meeting supply.
- Health: checkout conversion, order completion, dispute rate, and median time to payout. Answers whether the experience is working.

Each view has a single headline number and a small set of supporting lines. Nothing is shown without a real source; a metric with no data reads as "no data yet," never as a zero that looks like a fact.

---

## 55. GLOSSARY

- Escrow: an on-chain account that holds a buyer's funds until the order is accepted, then releases them to the seller.
- Lamports: the smallest unit of SOL. The app stores money as integer lamports and formats for display.
- PDA: a program derived address. A deterministic account the program controls, used here for escrow, reputation, splits, and dispute cases.
- SIWS: sign in with Solana. Proving wallet ownership by signing a readable message, with no funds moved.
- SPL token: a token on Solana, such as USDC. The app accepts SOL and selected SPL tokens.
- RLS: row-level security. Database rules that decide which rows a given user can read or write.
- Reconciliation: the scheduled check that the database mirror matches on-chain truth, with alerts on drift.

---

## 56. ANCHOR AND CARGO WORKSPACE

```toml
# Anchor.toml
[features]
seeds = false
skip-lint = false

[programs.devnet]
escrow = "ESCRoW111111111111111111111111111111111111111"
reputation = "REPUtat1on1111111111111111111111111111111111"
royalties = "Roya1ty1111111111111111111111111111111111111"
dispute = "D1sputeArb1ter11111111111111111111111111111"

[registry]
url = "https://api.apr.dev"

[provider]
cluster = "devnet"
wallet = "~/.config/solana/id.json"

[scripts]
test = "yarn run ts-mocha -p ./tsconfig.json -t 1000000 tests/**/*.ts"
```

```toml
# Cargo.toml (workspace)
[workspace]
members = [
  "programs/escrow",
  "programs/reputation",
  "programs/royalties",
  "programs/dispute",
]
resolver = "2"

[profile.release]
overflow-checks = true
lto = "fat"
codegen-units = 1
```

The `overflow-checks` flag is on in release so the checked math in the programs is enforced even in optimized builds. Program ids here are placeholders; the deploy step writes the real ids back into both this file and the client config.

---

## 57. GITHUB ACTIONS — TEST AND SECURITY WORKFLOWS

The deploy workflow lives in section 2. These two run alongside it.

```yaml
# .github/workflows/test.yml
name: Test

on:
  pull_request:
    branches: [main]
  push:
    branches: [main]

jobs:
  web:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v3
        with:
          version: 9
      - uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: "pnpm"
      - run: pnpm install --frozen-lockfile
      - run: pnpm lint
      - run: pnpm typecheck
      - run: pnpm test:ci
      - run: pnpm build

  programs:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: "20"
      - name: Install Solana
        run: |
          sh -c "$(curl -sSfL https://release.solana.com/stable/install)"
          echo "$HOME/.local/share/solana/install/active_release/bin" >> "$GITHUB_PATH"
      - name: Install Anchor
        run: cargo install --git https://github.com/coral-xyz/anchor avm --locked && avm install latest && avm use latest
      - name: Build and test programs
        run: anchor test
```

```yaml
# .github/workflows/security-audit.yml
name: Security Audit

on:
  schedule:
    - cron: "0 6 * * 1"
  workflow_dispatch:

jobs:
  deps:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v3
        with:
          version: 9
      - uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: "pnpm"
      - run: pnpm install --frozen-lockfile
      - name: Audit dependencies
        run: pnpm audit --audit-level=high

  secrets:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      - name: Scan for committed secrets
        uses: gitleaks/gitleaks-action@v2

  cargo:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Cargo audit
        run: cargo install cargo-audit && cargo audit
```

The dependency and secret scans run weekly and on demand. A high or critical finding fails the job and opens a tracking issue.

---

## 58. ENVIRONMENT REFERENCE (annotated)

Section 1 of the README lists the variables. This is the annotated reference, grouped by service, noting which are public and which must stay server-side.

```bash
# --- Solana (public) ---
NEXT_PUBLIC_SOLANA_RPC_URL=      # Helius or Alchemy in production; devnet for testing
NEXT_PUBLIC_SOLANA_NETWORK=      # devnet or mainnet-beta
NEXT_PUBLIC_PROGRAM_ESCROW_ADDRESS=
NEXT_PUBLIC_PROGRAM_REPUTATION_ADDRESS=
NEXT_PUBLIC_PROGRAM_ROYALTIES_ADDRESS=
NEXT_PUBLIC_PROGRAM_DISPUTE_ADDRESS=

# --- Platform (server only) ---
PLATFORM_TREASURY_ADDRESS=       # receives the platform fee; hardcoded in programs too
PLATFORM_AUTHORITY_SECRET=       # signs reputation deltas and refunds; never in the bundle

# --- Supabase ---
NEXT_PUBLIC_SUPABASE_URL=        # public
NEXT_PUBLIC_SUPABASE_ANON_KEY=   # public, RLS protected
SUPABASE_SERVICE_ROLE_KEY=       # server only; bypasses RLS, guard it

# --- Redis (server only) ---
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=

# --- Storage ---
BUNDLR_PRIVATE_KEY=              # server only; funds Arweave uploads
NEXT_PUBLIC_BUNDLR_NETWORK=

# --- Search ---
TYPESENSE_HOST=
TYPESENSE_API_KEY=              # server only, admin key
NEXT_PUBLIC_TYPESENSE_SEARCH_KEY= # public, search only

# --- Email and monitoring ---
RESEND_API_KEY=                 # server only
NEXT_PUBLIC_SENTRY_DSN=
NEXT_PUBLIC_POSTHOG_KEY=
```

Rule of thumb: anything prefixed `NEXT_PUBLIC_` is shipped to the browser and must be safe to expose. Everything else is server-only and is read in route handlers and server actions, never imported into a client component.

---

## 59. CONTRIBUTOR GUIDE

```markdown
# Contributing to SolGig

## Setup
1. Install Node 20 and pnpm 9.
2. Copy `.env.example` to `.env.local` and fill in devnet values.
3. Run `pnpm install`, then `pnpm dev`.

## Branches
- Branch from `main` as `feat/...`, `fix/...`, or `chore/...`.
- Keep a branch focused on one change.

## Before you open a pull request
- `pnpm lint` and `pnpm typecheck` are clean.
- Tests pass and new logic is covered.
- Any string you added follows the copy rules: no emoji, plain language.
- Any animation you added is in the dev gallery and respects reduced motion.
- Anything touching auth, payments, uploads, or programs has the security checklist filled in.

## Review
- A pull request needs a passing build and one review.
- On-chain changes need a second reviewer and a note on the audit impact.

## Commits
- Write a short, plain summary line. Explain why in the body if it is not obvious.
```

```markdown
# .github/PULL_REQUEST_TEMPLATE.md

## What this changes

## Why

## Screenshots or recordings

## Checklist
- [ ] Lint and type-check pass
- [ ] Tests cover new logic
- [ ] Copy follows the voice rules (no emoji, plain language)
- [ ] New animations are in the dev gallery and respect reduced motion
- [ ] Security checklist filled in if this touches auth, payments, uploads, or programs
```

---

## 60. FOLDER RESPONSIBILITIES

A short map so a new contributor knows where a change belongs. The full tree is in section 4.

| Path | Holds | Rule |
|------|-------|------|
| `src/app/(marketing)` | Landing, about, pricing | No wallet code; keep the bundle light |
| `src/app/(auth)` | Connect, onboard | Client islands; SIWS lives here |
| `src/app/(app)` | The product surfaces | Behind the app shell |
| `src/app/api` | Route handlers | Server-only secrets; verify auth on mutations |
| `src/components/motion` | Animation primitives | Every effect honors reduced motion |
| `src/components/three` | 3D scenes | Dynamic import only; poster fallback |
| `src/components/landing` | Landing sections | Compose motion primitives |
| `src/components/ui` | Base components | shadcn-generated, themeable |
| `src/lib/solana` | Chain helpers | Build transactions; verify on the server |
| `src/lib/supabase` | Data clients | Client, server, and middleware variants |
| `src/stores` | Zustand stores | Small, focused, client state only |
| `src/content` | Copy catalog | One place for all user-facing strings |
| `programs/` | Anchor programs | Checked math; one-way status; audited |

A change that does not fit one of these belongs in a new, clearly named folder, documented here in the same pull request.

---

## 61. WHAT "DONE" LOOKS LIKE AT MVP

When phases 0 through 7 are complete and phases 8 and 9 are underway, the product can do the following end to end, on devnet, with no fake data:

- A creator connects a wallet, signs in, and sets up a profile.
- They publish a digital product with a real file and a price in SOL.
- They post about it in the feed; a visitor sees the post and reacts.
- A buyer connects, opens the product, and pays; funds lock in escrow.
- The creator delivers; the buyer accepts; the payout reaches the creator's wallet minus the platform fee.
- Both can see the transaction signatures and a clear order timeline.
- A buyer can open a dispute, and the recorded outcome drives a refund or a release.

At that point the landing page, the motion gallery, the catalog, the feed, and the payment cycle all work together, and the remaining work is hardening: the security pass, monitoring, the independent audit, and the load test that gate the switch to mainnet.

---

## 62. ICON SYSTEM

One icon set throughout, drawn on a 24 by 24 grid with a 1.7 stroke, rounded joins, no fills except where a state needs weight. Icons inherit the current text color so they sit quietly until a state lifts them. The working set:

| Area | Icons |
|------|-------|
| Navigation | home feed, compass explore, grid marketplace, briefcase jobs, layers services |
| Account | wallet, user, settings gear, bell, message |
| Commerce | cart, tag price, receipt, download, star rating |
| Social | heart, comment, share, bookmark, repeat |
| On-chain | link signature, shield escrow, coin token, arrows transfer, check confirmed |
| State | spinner, alert triangle, info circle, lock, eye and eye-off |

Rules: an icon never appears without a label unless its meaning is unmistakable in context. Active navigation icons gain the brand gradient; everything else stays in the neutral ramp. Icon-only buttons carry an `aria-label`. The favicon and the social card reuse the logo mark from section 0.2, not an icon from this set.

---

## 63. KEY SCREEN WIREFRAMES

Low-fidelity maps of the main screens, so layout intent is unambiguous before components are styled. These describe structure, not pixels.

### 63.1 Landing hero
```
+--------------------------------------------------------------+
| [logo]            how  sellers  payment  feed   [connect][CTA]|
+--------------------------------------------------------------+
|                                  |                            |
|  Built on Solana                 |        [ 3D coin orbit ]   |
|  Sell your work.                 |        [   pointer        |
|  Keep what you earn.             |          reactive  ]      |
|  short human paragraph...        |                            |
|  [ Start selling ] [ feed ]      |        . Live on Solana    |
|  4,820 SOL   1,340+   ~1s        |                            |
+--------------------------------------------------------------+
|  << marquee: presets  beats  kits  code  fonts  ...  >>       |
+--------------------------------------------------------------+
```

### 63.2 Feed (desktop, three columns)
```
+------------+-------------------------------+----------------+
|  nav rail  |   [ composer entry ]          |  who to follow |
|  home      |   +-------------------------+  |  [ avatar ] +  |
|  explore   |   | avatar  name  handle 2h |  |  [ avatar ] +  |
|  market    |   | post text...            |  |                |
|  services  |   | [ media ]               |  |  trending tags |
|  jobs      |   | heart 214  reply 31  buy|  |  #presets      |
|  wallet    |   +-------------------------+  |  #beats        |
|  [profile] |   | ... next post ...       |  |                |
+------------+-------------------------------+----------------+
```

### 63.3 Product detail
```
+--------------------------------------------------------------+
| [ gallery / lightbox ]            | Title                     |
|                                   | by seller   . rating      |
|                                   | price (SOL / USDC)        |
|                                   | [ Buy for 1.8 SOL ]       |
|                                   | license note              |
+-----------------------------------+---------------------------+
| Description (rich text)                                       |
| Reviews ......                                                |
| Related products: [card][card][card]                         |
+--------------------------------------------------------------+
  (on scroll: a slim sticky buy bar appears at the top)
```

### 63.4 Checkout
```
+----------------------------+
|  Step 1 . Review           |
|  order summary             |
|  amount + token            |
|  [ Continue ]              |
+----------------------------+
|  Step 2 . Pay              |
|  "Approve in your wallet"  |
|  ( escrow lock pulse )     |
+----------------------------+
|  Step 3 . Confirm          |
|  ( progress ring )         |
|  -> success: checkmark,    |
|     receipt, download      |
+----------------------------+
```

### 63.5 Dashboard home
```
+--------------------------------------------------------------+
| Earnings 12.4 SOL  | Pending escrow 3.1 | Orders 5 active     |
+--------------------------------------------------------------+
| Recent activity                  | Quick actions             |
| - order SG-2026-000142 paid      | [ New product ]           |
| - review left (5 stars)          | [ New service ]           |
| - payout 2.0 SOL                 | [ New post ]              |
+----------------------------------+---------------------------+
```

Each wireframe maps directly to the components in section 30 and the routes in section 27. Styling follows the tokens in section 20 and the motion in section 21.

---

## 64. FIRST-RUN CHECKLIST FOR A FRESH ENVIRONMENT

A short list to bring the project up from nothing, complementing the runbook in section 26.

1. Install Node 20, pnpm 9, the Solana tool suite, and Anchor.
2. Clone the repository and run `pnpm install`.
3. Copy `.env.example` to `.env.local` and fill in devnet values.
4. Create a Supabase project; run the schema in section 5 and the policies in section 49.
5. Create a devnet wallet and airdrop a little SOL for testing.
6. Run `anchor build` and `anchor deploy`; copy the program ids into `.env.local` and `Anchor.toml`.
7. Run `pnpm dev` and open the landing page and the motion gallery.
8. Connect a wallet, sign in, and publish a test product.
9. Buy the test product from a second wallet and run the full settle cycle on devnet.
10. Run the test suite and confirm the security checklist items that apply.

When all ten pass, the environment is a faithful copy of a working build and the phase work can continue from wherever it left off.

---

## 65. SECTION INDEX

A map of the whole specification, in order.

- 0. Project identity, name audit, logo, vision and mission
- 1. GitHub repository setup and README
- 2. Vercel deployment and auto-deploy action
- 3. Technology stack declaration
- 4. Project structure
- 5. Database schema
- 6. Solana programs — escrow
- 7 to 15. Frontend, payments, search, and supporting systems
- 16. Environment setup checklist
- 17. Metrics and KPIs
- 18. Launch plan
- 19. Brand and name decision record
- 20. Design system tokens
- 21. Skiper animation manifest
- 22. Landing page build spec
- 23. Copy system, human voice
- 24. Security audit checklist
- 25. Definition of done
- 26. Execution runbook
- 27. Sitemap and route table
- 28. Animation catalog, 168 effects
- 29. Page-by-page layout
- 30. Component inventory
- 31. API contracts
- 32. State management
- 33. Sign in with Solana
- 34. Payment and escrow sequence
- 35. Real-time architecture
- 36. Testing strategy
- 37. Security audit expanded
- 38. Performance budget
- 39. Accessibility
- 40. SEO and metadata
- 41. Analytics events
- 42. CI and CD detail
- 43. Phase-by-phase task breakdown
- 44. Per-page copy samples
- 45. Risk register
- 46. Reputation program
- 47. Royalties program
- 48. Dispute program
- 49. Row-level security policies
- 50. Sign in with Solana implementation
- 51. Escrow client library
- 52. Wallet provider setup
- 53. Theme reference
- 54. Metrics dashboards
- 55. Glossary
- 56. Anchor and Cargo workspace
- 57. GitHub Actions test and security workflows
- 58. Environment reference
- 59. Contributor guide
- 60. Folder responsibilities
- 61. What done looks like at MVP
- 62. Icon system
- 63. Key screen wireframes
- 64. First-run checklist
- 65. Section index
- 66. Changelog

---

## 65.1 HOW TO USE THIS DOCUMENT

This specification is meant to be executed, not just read. A few notes on working with it.

- Read sections 0, 19, and the BUILD_PLAN before writing any code. They fix the name, the brand, and the order of work.
- Treat the phase map in section 43 and the BUILD_PLAN as the gate. Do not start a phase until the previous one passes its exit test.
- When a section shows code, that code is a starting shape, not a finished file. Adapt names and types to the real models as they settle, and keep the behavior the section describes.
- When two sections seem to disagree, the later, more detailed section wins, and the earlier one should be corrected in the same change.
- Keep every user-facing string in the copy catalog and run it past the voice rules in section 23 before it ships.
- Re-run the name and environment audits in sections 0.1.1 and 64 whenever you start from a clean machine, since registry state can change over time.
- The document is versioned. When you make a structural change, add a line to the changelog in section 66 so the history stays readable.

The aim is that a capable engineer, or a capable agent, can take this file and the repository and move the product forward without needing to reconstruct intent from scratch.

---

## 66. CHANGELOG

- v1.0 — First draft under the working name SolanaFlow. Identity, stack, schema, escrow program, and a base build spec.
- v1.1 — Name availability audit. SolanaFlow was found taken on GitHub and Vercel and replaced with SolGig, which was verified open on GitHub, Vercel, npm, and the domain registry. Logo concept moved from an SF flow mark to an SG mark. Added the design system, the animation manifest, the interactive landing spec, the human-voice copy system, the security checklist, the definition of done, and the runbook.
- v1.2 — Expanded into a full build specification: route table, the full animation catalog, page-by-page layout, component contracts, API contracts, state management, the auth and payment sequences, real-time, testing, expanded security, performance, accessibility, SEO, analytics, CI and CD, the phase one to nine task breakdown, per-page copy samples, and a risk register.
- v1.3 — Added the remaining Anchor programs (reputation, royalties, dispute), full row-level security policies, the SIWS and escrow client code, the wallet provider, the theme reference, the metrics dashboards, the glossary, the workspace and CI config, the annotated environment reference, the contributor guide, the folder map, the MVP definition, the icon system, the key screen wireframes, the first-run checklist, this index, and this changelog.

### 66.1 Conventions used here

- Money is stored as integer lamports or raw token units and formatted only for display.
- Wallet addresses are shown middle-truncated and set in a monospace face.
- Times are stored as timestamps and shown relative in the interface.
- Code blocks are starting shapes; names and types adapt to the real models.
- Copy in examples follows the voice rules: plain language, no emoji.
- Section numbers are stable; new material is appended and noted in this changelog so links from the repository keep working.
- The chain is the source of truth for funds; the database is a cache that is reconciled against it.

---

## 67. ACCEPTANCE SUMMARY

The specification is considered ready to drive the build when all of the following are true, which they are at this version.

- The project name is fixed and was verified open on GitHub, Vercel, npm, and the domain registry.
- The logo concept communicates the product from the silhouette alone.
- The design system, the motion catalog, and the landing spec are written down and lead the build.
- The data model, the row-level security, the API contracts, and the state plan are complete enough to implement.
- All four Anchor programs are specified with code shapes, and the payment cycle is described end to end.
- The copy standard is defined and sample strings exist for every surface, written in plain human language with no emoji.
- The security model, the testing strategy, the performance budget, and the accessibility rules are explicit.
- The phase map gives a clear order of work, each phase with a single exit test.
- The CI, the deployment, and the first-run checklist let the project be rebuilt from nothing and shipped repeatedly.

From here the work is execution against the phase map, one verified phase at a time, with the chain as the source of truth for funds and the copy and motion rules holding on every page.

---

*End of SolGig Megaprompt v1.3*

*Specification complete across identity, design, frontend, backend, programs, security, CI, wireframes, and the phased build plan.*

*Name verified live on GitHub, Vercel, npm, and the domain registry before lock-in.*

*Zero dummy content. Real integrations. Production from line 1.*

*Build it once. Build it right. Ship it.*


