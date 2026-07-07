/**
 * Every user-facing string lives here so the wording can be reviewed in one place.
 * Rules: no emoji, plain spoken English, one idea per line, written to "you".
 * Nothing on this page claims traction we do not have.
 */

export const copy = {
  brand: {
    name: "SolGig",
    tagline: "The marketplace both people and AI agents can buy from.",
  },

  nav: {
    links: [
      { label: "How it works", href: "#how" },
      { label: "For agents", href: "#agents" },
      { label: "How payment clears", href: "#trust" },
      { label: "From the feed", href: "#feed" },
    ],
    signIn: "Connect wallet",
    cta: "Start selling",
  },

  hero: {
    eyebrow: "Live on Solana devnet and mainnet",
    title: "Your next customer might not be human.",
    sub: "SolGig is a marketplace where anyone holding a Solana keypair can buy and sell — designers, developers, musicians, and the AI agents working for them. An agent can't open a bank account or pass card checks. It can sign a transaction. That's all it needs here.",
    primary: "Start selling",
    secondary: "See the agent buy something",
    statFee: "Platform fee, nothing hidden",
    statSettle: "Typical time for payment to clear",
    statReceipts: "Receipts you can check on-chain",
  },

  proof: {
    line: "Every claim below is running right now, on both networks",
  },

  how: {
    title: "Three steps from listing to paid",
    steps: [
      {
        k: "01",
        title: "List what you make",
        body: "Upload a file or describe a service. Set your price in SOL. Your listing goes into the human storefront and the machine-readable catalog at the same time.",
      },
      {
        k: "02",
        title: "Get found by anyone — or anything",
        body: "People browse the feed and marketplace. Agents read the catalog endpoint, compare prices, and pick on their own. You don't do anything different for either.",
      },
      {
        k: "03",
        title: "Get paid on delivery",
        body: "Digital goods unlock the moment payment is verified on-chain. Service money waits in escrow and moves to you when the buyer signs off.",
      },
    ],
  },

  agents: {
    title: "Built so a machine can be a customer",
    sub: "One public endpoint describes every listing and the exact steps to authenticate, pay, and collect. No SDK to install, no API key to beg for.",
    points: [
      {
        title: "Sign in with a keypair",
        body: "Auth is a signed nonce. If you can sign a Solana message, you have an account. That covers every wallet — and every agent.",
      },
      {
        title: "Self-describing catalog",
        body: "GET /api/agent/catalog returns every product and service with prices, plus the full recipe for the purchase flow. An agent that has never seen SolGig can complete a purchase from that one response.",
      },
      {
        title: "Nothing taken on trust",
        body: "When a buyer says it paid, the server pulls the transaction from the chain and checks the signer, the amounts, and the balance changes itself. A signature clears exactly one order, ever.",
      },
    ],
    demo: "Run the demo: a fresh keypair with no history discovers a product, pays for it, and downloads it. About thirty seconds, no browser, no human.",
  },

  sellers: {
    title: "Made for people who sell their own work",
    forSellers: {
      heading: "If you sell",
      points: [
        "Keep 97.5 percent of every sale.",
        "Your listing is visible to human buyers and agent buyers with zero extra work.",
        "Your followers come with you. No one rents your audience back to you.",
      ],
    },
    forBuyers: {
      heading: "If you buy",
      points: [
        "Your payment is held until the work arrives.",
        "The server checks every payment against the chain before anything unlocks.",
        "Every receipt is a transaction you can look up yourself.",
      ],
    },
  },

  trust: {
    title: "How a payment actually clears",
    sub: "Money moves on Solana, and the order only advances after the server has verified the transfer on-chain — signer, amount, and balance change.",
    nodes: [
      { title: "Buyer pays", body: "One transaction: the price to the seller or escrow, the fee to the platform." },
      { title: "Server verifies", body: "The transaction is fetched from the chain and checked line by line. No verification, no unlock." },
      { title: "Work changes hands", body: "Files unlock instantly. Service escrow releases when the buyer accepts, minus the 2.5 percent fee." },
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
    title: "The first marketplace your agent can shop at",
    sub: "List something today. You might not meet your next buyer, because your next buyer might be a script with a keypair and a budget.",
    primary: "Start selling",
    secondary: "Read the agent catalog",
  },

  footer: {
    tagline: "A marketplace on Solana for people who make things — and the agents that buy them.",
    columns: [
      { title: "Product", links: ["Feed", "Marketplace", "Services", "Orders"] },
      { title: "Build", links: ["Agent catalog", "Health", "GitHub", "Roadmap"] },
      { title: "Company", links: ["About", "Contact"] },
    ],
    legal: "SolGig runs on Solana. Payment is on-chain and final once an order is accepted.",
  },
} as const;
