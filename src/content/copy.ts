/**
 * Every user-facing string lives here so the wording can be reviewed in one place.
 * Rules: no emoji, plain spoken English, one idea per line, written to "you".
 * See BUILD_PLAN.md section 5 and SOLANAFLOW_MEGAPROMPT.md section 23.
 */

export const copy = {
  brand: {
    name: "SolGig",
    tagline: "Sell your work on Solana. Get paid the second someone buys.",
  },

  nav: {
    links: [
      { label: "How it works", href: "#how" },
      { label: "For sellers", href: "#sellers" },
      { label: "How payment clears", href: "#trust" },
      { label: "From the feed", href: "#feed" },
    ],
    signIn: "Connect wallet",
    cta: "Start selling",
  },

  hero: {
    eyebrow: "Built on Solana",
    title: "Sell your work. Keep what you earn.",
    sub: "List a template, a track, a design, or a few hours of your time. When someone buys, the payment lands in your wallet a moment later. No bank sits in the middle, and no platform holds your money.",
    primary: "Start selling",
    secondary: "Look around the feed",
    statSettled: "Settled this week",
    statCreators: "Creators listing now",
    statMedian: "Median time to payout",
  },

  proof: {
    line: "People already building here",
  },

  how: {
    title: "Three steps from idea to paid",
    steps: [
      {
        k: "01",
        title: "List what you make",
        body: "Upload a file or describe a service. Set your price in SOL or USDC. You are live in a couple of minutes.",
      },
      {
        k: "02",
        title: "Share it in the feed",
        body: "Post a short clip or a photo. Followers see it, react to it, and tap straight through to buy.",
      },
      {
        k: "03",
        title: "Get paid on delivery",
        body: "The buyer's funds wait in escrow. The moment you deliver and they accept, the balance moves to your wallet.",
      },
    ],
  },

  sellers: {
    title: "Made for people who sell their own work",
    forSellers: {
      heading: "If you sell",
      points: [
        "Keep 97.5 percent of every sale.",
        "Price in the token you prefer.",
        "Your followers come with you. No one rents your audience back to you.",
      ],
    },
    forBuyers: {
      heading: "If you buy",
      points: [
        "Your payment is held until the work arrives.",
        "Open a dispute if something is wrong, and a reviewer steps in.",
        "Every receipt is a transaction you can check yourself.",
      ],
    },
  },

  trust: {
    title: "How a payment actually clears",
    sub: "Funds move through an on-chain escrow, so both sides know the rules before money changes hands.",
    nodes: [
      { title: "Buyer pays", body: "The amount is locked in an escrow account on Solana." },
      { title: "You deliver", body: "Files or work are handed over through the order." },
      { title: "Buyer accepts", body: "The escrow releases to your wallet, minus a small fee." },
    ],
  },

  feed: {
    title: "A look at the feed",
    sub: "Read-only preview, pulled from the same card the app uses.",
    posts: [
      {
        author: "mira.lens",
        handle: "@mira",
        time: "2h",
        body: "New Lightroom pack is up. Warm street tones, 12 presets, drag and drop.",
        price: "1.8 SOL",
        likes: 214,
        comments: 31,
      },
      {
        author: "kojibeats",
        handle: "@koji",
        time: "5h",
        body: "Selling two mixing slots this week. Send me a rough and I will tighten the low end.",
        price: "0.9 SOL",
        likes: 98,
        comments: 12,
      },
      {
        author: "studio.fauna",
        handle: "@fauna",
        time: "1d",
        body: "Notion dashboard for freelancers. Tracks invoices, clients, and what is still owed.",
        price: "3.2 SOL",
        likes: 377,
        comments: 64,
      },
    ],
  },

  finalCta: {
    title: "Your next sale is one post away",
    sub: "Set up a listing, share it, and watch the first payment land.",
    primary: "Start selling",
    secondary: "Read the build plan",
  },

  footer: {
    tagline: "A marketplace for people who make things on Solana.",
    columns: [
      { title: "Product", links: ["Feed", "Marketplace", "Services", "Jobs"] },
      { title: "Build", links: ["Docs", "Status", "Changelog", "Roadmap"] },
      { title: "Company", links: ["About", "Careers", "Press", "Contact"] },
    ],
    legal: "SolGig runs on Solana. Payment is on-chain and final once an order is accepted.",
  },
} as const;
