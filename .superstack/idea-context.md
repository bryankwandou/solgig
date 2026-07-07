# Idea Context — SolGig

## Current idea (as shipped)
Social marketplace on Solana: creators sell digital goods + freelance services, social feed, SIWS auth, direct on-chain payment for products, custodial escrow for services. Live on devnet (seeded demo) and mainnet-beta (empty, real).

## validation
- date: 2026-07-07
- go_no_go: "pivot" (persist on the product, pivot the positioning/wedge)
- confidence: 0.7
- demand_signals:
  - Superteam Earn processes real bounty volume (~1,500 USDC typical) on Solana — proves crypto-native workers want on-chain gig payments.
  - Gibwork is live on Solana with escrow + SPL payments + on-chain reputation — proves the category exists, but also proves "Fiverr on Solana" is already taken.
  - Colosseum Cypherpunk (Dec 2025) winner MCPay = payment infra connecting MCP and x402 — judges reward agent-payments infrastructure, not another human marketplace.
- risks:
  - { category: market, description: "Category is crowded: Gibwork, Superteam Earn, Escrowfy, ReputeFlow. A generic social marketplace is a me-too entry.", severity: high }
  - { category: judging, description: "Colosseum winners 2025 skew infra/novel primitives (TapeDrive storage, FluxRPC, Vanish privacy, MCPay agent payments). Generic consumer marketplaces historically do not place.", severity: high }
  - { category: technical, description: "Custodial escrow (server-held keypair) is the weakest architectural claim; judges will flag it. Anchor/PDA escrow is table stakes for a win.", severity: medium }
  - { category: crypto-necessity, description: "For human-to-human gigs, fiat rails work fine — crypto is convenient, not necessary. For AI-agent buyers, crypto IS necessary (agents cannot open bank accounts or pass card KYC). The agent wedge fixes the necessity gap.", severity: medium }
  - { category: regulatory, description: "Custodial escrow holding third-party funds may constitute money transmission in some jurisdictions.", severity: medium }

## Revised positioning (the wedge)
**SolGig = the first gig marketplace on Solana where AI agents are first-class economic actors.**
- Every listing is machine-readable (open JSON schema + MCP server) so an AI agent can discover, purchase, and receive a digital good or commission a human service autonomously.
- Escrow settlement is what makes agent↔human commerce trustable: the agent's principal knows funds only release on confirmed delivery.
- Humans sell to agents; agents hire humans; agents can also list services (e.g., an agent selling code review).
- Rides the exact wave judges rewarded (MCPay/x402), but as the *application layer* those rails lack — MCPay built the payment pipe, SolGig is the market on top of it.
- Keeps 100% of the shipped product (marketplace, feed, escrow, SIWS); adds an agent-facing API surface + MCP server as the differentiator.

Why crypto is necessary under this framing: an AI agent cannot hold a bank account, pass Stripe KYC, or sign a Fiverr ToS — but it can hold a Solana keypair, sign a transaction, and prove payment on-chain. Remove the blockchain and the product is impossible, not just worse.

## next_steps
- [ ] Ship the agent surface: GET /api/agent/listings (machine-readable catalog) + MCP server exposing search/buy/confirm tools.
- [ ] Demo: a scripted AI agent buying a real product on devnet end-to-end (discover → pay → download) as the hackathon demo centerpiece.
- [ ] Integration-first: settle payments with existing rails (direct SPL transfer + current escrow); move escrow to Anchor PDA program next — flag custodial as interim in all materials.
- [ ] Rebrand copy/landing around "the marketplace agents can use," not "Fiverr on Solana."
- [ ] Interim custody hardening: Squads multisig on mainnet escrow before real volume.
