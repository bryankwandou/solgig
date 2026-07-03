# SolGig — build context

Stack: Next.js 15 (App Router), Neon Postgres, SIWS auth (tweetnacl + jose JWT cookie), Solana web3.js SystemProgram transfers (devnet default), Tailwind v4, framer-motion, three.js.

## fixes applied (2026-07-02)

All critical/high findings below were fixed the same day: file_url now only served via entitlement-checked `/api/orders/[id]/download`; signature replay blocked by transactions.signature uniqueness + guarded order update; verifyPayment now checks buyer-signed, buyer spent full amount, and treasury fee; review reputation gated on actual insert; atomic nonce burn; SESSION_SECRET required in production; nonce endpoint validates pubkey and prunes stale rows; ILIKE wildcards escaped; feed keyset pagination with Load more; new Orders page (purchases, re-download, mark-complete); services now bookable end-to-end (order_type 'service', paid -> buyer completes via `/api/orders/[id]/complete`). Post-fix: security ~B+, quality B+. Remaining: rate limiting, comments/follows/profile pages, on-chain escrow for services, tests/CI.

## review (2026-07-02, pre-fix)

```json
{
  "review": {
    "security_score": "D",
    "quality_score": "B-",
    "ready_for_mainnet": false,
    "findings": [
      { "severity": "critical", "category": "access-control", "description": "GET /api/products/[slug] returns p.* including file_url — paid digital goods are downloadable without purchase", "fix": "Exclude file_url from the public select; serve it only via an entitlement-checked endpoint (order completed by current user)" },
      { "severity": "critical", "category": "payments", "description": "One on-chain signature can confirm multiple orders (transactions insert is ON CONFLICT DO NOTHING and order is completed regardless)", "fix": "Reject confirm when signature already exists in transactions for a different order; make confirm a single DB transaction" },
      { "severity": "high", "category": "payments", "description": "verifyPayment checks seller balance delta only; buyer as fee payer / actual sender is not verified, and platform fee to treasury is never verified", "fix": "Check buyer balance decreased >= amount and treasury gained >= fee; verify buyer signed the tx" },
      { "severity": "high", "category": "abuse", "description": "POST /api/reviews increments seller reputation_score on every call even when the review insert conflicts (DO NOTHING) — reputation farming", "fix": "Only update reputation when the INSERT actually inserted (RETURNING id)" },
      { "severity": "high", "category": "auth", "description": "SESSION_SECRET falls back to a hardcoded dev secret; nonce burn is check-then-update (replay race); nonce endpoint unauthenticated and unrate-limited (DB spam)", "fix": "Require SESSION_SECRET at boot; burn nonce atomically (UPDATE ... WHERE used=false RETURNING); add rate limiting" },
      { "severity": "medium", "category": "product-gap", "description": "No purchases/orders page — buyer loses the download link after leaving the success screen; no service ordering, no escrow, no comments, no follows, no profile pages despite schema", "fix": "Add /orders (my purchases) with entitlement-gated download; build service order + escrow flow" },
      { "severity": "medium", "category": "correctness", "description": "Product slug from title collides (UNIQUE violation = 500); feed cursor param ignored (no pagination); confirm/like counter updates non-transactional; ILIKE wildcard chars unescaped", "fix": "Append random suffix to slug; implement keyset pagination; wrap multi-statement writes in transactions" },
      { "severity": "low", "category": "ops", "description": "Devnet RPC default, no rate limiting anywhere, no tests, no CI, no .env.example, no error monitoring", "fix": "Add env validation, basic tests for payment verify, and per-IP rate limits" }
    ]
  }
}
```
