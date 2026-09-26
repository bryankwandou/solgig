# SolGig demo video script (92 seconds as rendered)

Format: 1920×1080, on-screen captions, no voiceover in the rendered cut (`pitch/demo.mp4`). The VO lines below are for recording narration on top later. On-screen text matches the VO, only shorter.

| Time | Scene | On screen | VO |
|---|---|---|---|
| 0:00–0:07 | Hook | Black screen. `HTTP/1.1 402 Payment Required` types out, then the headline. | "Your next customer might not be human." |
| 0:07–0:19 | Problem | Three lines appear one at a time. | "An agent can't pass a card check. It can sign a Solana transaction. There are rails that let agents pay for API calls. What's missing is a store with things to buy." |
| 0:18–0:29 | Product | Screen recording of the SolGig landing page, scrolling from the hero to "Built so a machine can be a customer". | "SolGig is that store. Every product has a machine-readable listing and answers HTTP 402 with a price in SOL or USDC." |
| 0:29–1:07 | Agent buys a product end to end | Terminal. A fresh wallet requests a product, gets 402, pays in USDC, retries with `X-PAYMENT`, gets `200`, the file and a receipt. Last line: someone else reuses the signature and gets `409`. Caption in the corner: "Real route handler, simulated chain and database (PR #4)". | "The agent starts with nothing but a keypair. It asks for the product and the server answers 402: one SOL or 150 USDC, with the instructions already built. The agent signs one transaction. The fee is split out inside it. Then it asks again, this time with the signature and a proof that it's the payer. The server reads the transaction from the chain, checks it, and hands over the file with a receipt that carries the signature. If another wallet tries to reuse that signature, it gets 409." |
| 1:06–1:21 | Escrow for people | Diagram: buyer → escrow PDA → seller, with "release" and "refund after 14 days". | "People use the same listings. For services, the money sits in an escrow account owned by our Pinocchio program. It goes to the seller when the buyer releases it. If the work never shows up, the buyer can take it back after fourteen days." |
| 1:20–1:32 | Close / CTA | "2.5% fee · live on mainnet · 20 languages", then `curl solgig-mainnet.vercel.app/api/agent/catalog` and the logo. | "We take two and a half percent, in the same transaction. It's live on mainnet, in twenty languages. Point your agent at the catalog and let it shop." |

## Notes for whoever records the narration

- Read slowly. The terminal scene is the longest and the VO only has to keep up with the lines as they appear.
- The terminal output comes from the real x402 route handler, run against a simulated chain and database, because the endpoint isn't deployed until PR #4 merges. After the merge, re-record this scene against devnet with `node scripts/agent-x402.mjs https://solgig.vercel.app <slug> USDC` and a funded `AGENT_SECRET_KEY`, and drop the caption.
- Don't say "revolutionary", "seamless" or "game-changing". Every number in the video has a source in the repo or in the deck.

## How the cut was made

- Scenes 1, 2, 4, 5, 6: HTML/CSS animation (`pitch/video-src/scenes.html`), recorded with Playwright/Chromium at 1920×1080.
- Scene 3: the SolGig landing page from this branch, served locally by `next start` and recorded with Playwright. The live site could not be recorded here because the sandbox browser does not trust the network proxy's certificate.
- Scene 4 text: `pitch/assets/x402-transcript.txt`, printed by the real route handler during a Vitest run.
- Transitions: ffmpeg `xfade` (fade, slideleft, smoothleft, circleopen, fadeblack), 0.6 s each. Encoded as H.264, 30 fps.
- The narration in the table is not recorded; the video has on-screen text only.
