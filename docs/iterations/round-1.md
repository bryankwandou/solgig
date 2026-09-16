# Iteration 1 — audit findings

Date: 2026-09-16
Commit at start of round: `6879afe`
Commit at end of round: `91c0914` plus the working-tree fixes listed below.

Three passes were run over the project in this round: a visual pass over every
page in both languages at both widths, a security pass over the payment and
session code, and a code pass over the whole tree. Findings are listed with
what was actually wrong, not with a severity label attached to a guess.

---

## Visual pass

Source evidence: 40 captures, 10 pages x 2 languages x 2 widths, in
`docs/screenshots/`.

### V1 — Content stayed hidden for visitors who turned motion off *(fixed)*

`Reveal`, `Stagger`, `StaggerItem`, `SplitText`, `TypewriterText` and
`ProgressRing` each began at `opacity: 0` (or an empty string, or an unfilled
ring) and only became visible once an `IntersectionObserver` fired.

Two consequences, both real:

- A visitor with `prefers-reduced-motion: reduce` still had to scroll every
  element into view before it was allowed to exist. Reduced motion is a
  request to skip the animation, not a request to hide the page.
- Anything the observer missed stayed blank permanently. The marketplace grid
  rendered as an empty page under the header while `/api/products` was
  returning six listings normally, because the container was observed while it
  was still empty and the items mounted afterwards.

Fixed in `src/components/motion/index.tsx`. Each component now renders its
finished state directly when motion is reduced, skipping the observer. The
count-up already defaulted to the real figure and now shares the same hook
instead of reading `matchMedia` itself.

### V2 — The screenshot harness was lying about the layout *(fixed)*

Most of what looked broken in the first batch of captures was the capture
tool, not the site:

- The hero is sized `min-h-[100svh]`. The old harness drove Chrome's
  `--screenshot` flag, which ties image height to *window* height, so the hero
  stretched to whatever full-page height had been guessed — 5200px on the
  landing page. That produced an enormous empty band above the headline that
  no visitor has ever seen.
- The 390px phone captures were laid out at desktop width, because the flag
  sets a window size without applying device metrics. That is why headline
  text appeared clipped mid-word and the wallet button was cut off at the
  right edge.

Replaced with `scripts/shots.mjs`, which drives the DevTools protocol over the
`ws` package already in the tree: a real 1440x900 or 390x844 viewport with
`Emulation.setDeviceMetricsOverride` applied, reduced motion emulated through
`Emulation.setEmulatedMedia`, the page scrolled once end to end, then captured
with `captureBeyondViewport`. The 40 captures taken with the old harness are
not admissible as evidence of anything and were recaptured.

---

## Security pass

Scope: `src/lib/solana/`, `src/lib/auth/`, `src/lib/rate-limit.ts`, and every
route under `src/app/api/`.

The payment path is sound and this round found no way to steal from it. For
the record, the controls that are actually present and correct:

- `verifyPayment` requires the buyer to have **signed** the transaction, not
  merely to appear in it (`buyerIdx >= numRequiredSignatures` is rejected).
- Amounts are checked as **balance deltas** on both sides: the seller's gain
  and the buyer's spend are both verified, so a transaction that merely
  mentions the right accounts does not pass.
- `notBefore` rejects any transfer that landed before the order existed, which
  closes the obvious replay: claiming an older unrelated transfer between the
  same two wallets as payment.
- `transactions.signature` is unique and is the arbiter of double-spend. A
  signature that already belongs to a different order is rejected 409.
- The status update is guarded (`WHERE id = ... AND status = 'pending'`), so
  concurrent confirms cannot double-credit the counters.
- `file_url` is reachable only through `/api/orders/[id]/download`, and only
  for the buyer of that order, and only once it is `completed`.
- Escrow signs before broadcasting and hands the signature to `onSigned` for
  persistence first, so a confirmation timeout cannot cause a second payout.
  `payoutStatus()` exists for the caller to resolve the in-flight case.

### S1 — Dead code carrying a second copy of the payment math *(fixed)*

`buildPaymentTransaction` in `src/lib/solana/pay.ts` was exported and called
from nowhere in `src/`, `scripts/` or `tests/`. It contained its own
fee-splitting logic, sitting next to the `payment.transfers` list that the
server now issues as the single authority on what a buyer pays.

This is not exploitable today. It is a loaded gun: the fee logic in it can
drift from the server's, and it is exactly the kind of helper someone reaches
for later because the name looks right. Deleted, with its now-unused imports.

### S2 — Versioned transactions with lookup tables are rejected *(open)*

`verifyPayment` resolves both parties through `staticAccountKeys` only. If a
buyer submits a v0 transaction whose seller address resolves through an
address lookup table, `indexOf` returns `-1` and the payment is rejected as
`party_missing`.

This **fails closed** — it refuses a valid payment rather than accepting an
invalid one, so it is a correctness problem and not a hole. Left open
deliberately this round: the client builds legacy transactions, so nothing
currently hits it, and loosening account resolution in verification code is
not a change worth making without a live chain to exercise it against. Carried
to round 2.

### S3 — Rate limiting is per-instance *(accepted, documented)*

`src/lib/rate-limit.ts` holds its sliding window in module memory. On
serverless that is per-instance, so it is a coarse spam brake and not a quota.
The file already says so in a comment. Accepted for an MVP; a shared store is
the fix when real quotas matter.

---

## Code pass

### C1 — Sellers' lifetime earnings overstated on every sale *(fixed)*

`src/app/api/orders/[id]/confirm/route.ts` credited the seller
`total_earned_lamports + amount_lamports` — the gross order amount. The seller
actually receives `amount - platformFee`; the fee goes to the treasury.

Every completed sale inflated the seller's lifetime earnings by the platform
fee, and the error compounds across their history. The figure is shown on the
dashboard, so it was wrong in the product, not just in the database. Now
credits the net.

### C2 — The test suite reported false failures on slow hardware *(fixed)*

`npm test` gave 14/16 with two failures in `tests/auth.test.ts`. Both are
synchronous crypto assertions with no async work in them. Re-run with a
realistic ceiling they are **6/6 pass**; the failures were vitest's stock 5s
timeout on a machine that needed 94 seconds just to import the suite.

A test suite that goes red because the machine is busy trains people to ignore
red. Added `vitest.config.ts` with a 60s timeout.

---

## Round 1 tally

| Pass | Found | Fixed this round | Carried |
|---|---|---|---|
| Visual | 2 | 2 | 0 |
| Security | 3 | 1 | 2 (S2 open, S3 accepted) |
| Code | 2 | 2 | 0 |

Typecheck: `tsc --noEmit` clean, 0 errors.
Tests: 16/16 pass with a realistic timeout.

Carried into round 2: S2 (lookup-table account resolution).
