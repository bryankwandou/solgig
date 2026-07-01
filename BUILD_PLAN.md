# SolGig — Build Plan (Planning Megaprompt)

> Read this before writing application code. It is the standing operating procedure for the build.
> Source of truth for scope, sequence, and acceptance lives here; the full specification lives in `SOLANAFLOW_MEGAPROMPT.md`.

---

## 1. What we are building

SolGig is a social-first marketplace on Solana. Creators post to a feed, list digital goods and freelance services, and receive payment straight to their wallet. Settlement runs on-chain through an escrow program, so no bank or card processor sits in the middle. The home screen behaves like a short-form social feed; the commerce layer behaves like a storefront plus a services board.

Digital goods come first. Services and job postings follow. Every page of copy is written in plain human language with no emoji and no machine-tell phrasing.

---

## 2. Operating principles

1. Nothing fake. Counters, feeds, and balances read from real data or are clearly marked as a local demo seed; we never paint invented numbers as live ones.
2. Each surface is shippable on its own. We do not move forward until the current surface meets the Definition of Done in `SOLANAFLOW_MEGAPROMPT.md` §25.
3. Design leads. The landing page and the animation gallery are built first so the visual language is settled before the product screens borrow from it.
4. The build is repeatable. A clean checkout plus `npm install` plus the documented commands reproduces the same result.
5. Accessibility and reduced-motion are not optional. Every animation has a calm fallback.

---

## 3. Phase map (0 to MVP)

Each phase has a single clear exit test. We do not skip ahead.

| Phase | Scope | Exit test |
|------|-------|-----------|
| 0 — Foundation | Next.js app, TypeScript, Tailwind, design tokens, fonts | `npm run build` passes; home route renders |
| 1 — Motion system | Animation component library + `/_dev/animations` gallery | Every effect renders live in the gallery and honors reduced-motion |
| 2 — Landing | Interactive landing page, scene by scene | Lighthouse mobile performance at or above 90; readable with scripting off |
| 3 — Shell + auth | App shell, wallet connect, Sign In With Solana | A wallet can connect and a session persists |
| 4 — Data layer | Supabase schema, row-level security, typed client | Negative tests prove one user cannot read another's private rows |
| 5 — Catalog | Product and service create, list, detail pages | A seller can publish a product and a visitor can open it |
| 6 — Feed | Social feed, posting, reactions, comments | A post appears in the feed and reactions update live |
| 7 — Payments | Escrow program on devnet, checkout, release, refund | A full buy-deliver-release cycle settles on devnet |
| 8 — Trust | Reviews, reputation mirror, disputes | A completed order can be reviewed and a dispute can be opened |
| 9 — Hardening | Security pass, reconciliation, independent audit | Audit checklist in §24 clears; mainnet switch is gated on it |

MVP is reached at the end of Phase 7 with Phases 8 and 9 closing the loop for production.

---

## 4. This iteration (current work)

Deliver Phases 0 through 2 as a running application:

- Project scaffold that builds clean.
- Design tokens from `SOLANAFLOW_MEGAPROMPT.md` §20.
- An animation library covering the effect families in §21, each demoed in a `/_dev/animations` gallery that can be opened in a browser.
- A landing page assembled from the scenes in §22, with a 3D hero, scroll-driven sections, and copy written to the rules in §23.

Stack note: the specification names pnpm; this environment ships npm, so npm is used. Commands map one to one.

---

## 5. Copy standard (applies to every string)

- No emoji anywhere in the interface.
- Avoid the banned machine-tell words listed in `SOLANAFLOW_MEGAPROMPT.md` §23.
- Short sentences, one idea each, written to the reader as "you."
- Headlines must be specific enough that they could not be pasted onto a different product.
- All wording lives in one catalog so it can be reviewed in a single place.

---

## 6. Definition of done for this iteration

- `npm run build` completes with no type errors.
- `npm run dev` serves the landing page and the gallery.
- Every animation in the gallery runs and collapses to a quiet fade under reduced-motion.
- No emoji and no banned words in any shipped string.
- A short README explains how to run and test it.
