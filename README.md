# SolGig

Social marketplace for Solana creators. Sell digital goods and services, share them in a feed, and get paid straight to your wallet.

This repository currently holds Phases 0 through 2 from `BUILD_PLAN.md`: the foundation, the motion system, and an interactive landing page. The full specification lives in `SOLANAFLOW_MEGAPROMPT.md`.

## Run it

```bash
npm install
npm run dev
```

Then open:

- `http://localhost:3000` — the landing page
- `http://localhost:3000/dev/animations` — the motion gallery, every effect running live

## Check the build

```bash
npm run build
```

## What is here

- `src/app` — routes (landing page, motion gallery)
- `src/components/motion` — the animation library (framer-motion)
- `src/components/three` — the 3D hero (three.js)
- `src/components/landing` — landing page sections
- `src/components/brand` — the SG logo mark and wordmark
- `src/content/copy.ts` — every user-facing string, in one place
- `src/app/globals.css` — design tokens

## Notes

- Dark first. Two accent colors only: Solana violet and mint.
- No emoji in the interface. Copy is written in plain language and kept in one catalog.
- Every animation honors the reduced-motion system setting.
- The specification names pnpm; this build uses npm. The commands map one to one.
