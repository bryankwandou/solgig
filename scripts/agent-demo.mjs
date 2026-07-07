// The demo that proves the thesis: an AI agent — really just any holder of a
// Solana keypair — buys a digital product on SolGig with no browser, no
// wallet extension, and no human in the loop.
//
// Flow: read the machine-readable catalog -> authenticate with SIWS ->
// open an order -> pay on-chain -> confirm with the tx signature ->
// download the file it bought.
//
// Usage: node scripts/agent-demo.mjs [site]   (defaults to the devnet deploy)
// Devnet only. The agent wallet is funded from the escrow keypair in
// .env.local, which holds faucet SOL.
import {
  Connection,
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
  sendAndConfirmTransaction,
} from "@solana/web3.js";
import nacl from "tweetnacl";
import bs58 from "bs58";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const SITE = process.argv[2] ?? "https://solgig.vercel.app";
const RPC = "https://api.devnet.solana.com";

const __dirname = dirname(fileURLToPath(import.meta.url));
const env = readFileSync(join(__dirname, "..", ".env.local"), "utf8");
const envVal = (k) =>
  env.split(/\r?\n/).find((l) => l.startsWith(k + "="))?.slice(k.length + 1).trim();

const net = envVal("NEXT_PUBLIC_SOLANA_NETWORK");
if (net !== "devnet") {
  console.error(`Refusing to run: .env.local network is "${net}", demo is devnet-only.`);
  process.exit(1);
}

const log = (step, msg) => console.log(`\n[${step}] ${msg}`);
const connection = new Connection(RPC, "confirmed");

// 0. The agent is born: a fresh keypair, nothing else.
const agent = Keypair.generate();
log("agent", `New agent wallet: ${agent.publicKey.toBase58()}`);

// Cookie jar — the agent keeps its session like any other API client.
let cookie = "";
async function api(path, opts = {}) {
  const res = await fetch(SITE + path, {
    ...opts,
    headers: {
      "content-type": "application/json",
      ...(cookie ? { cookie } : {}),
      ...(opts.headers ?? {}),
    },
  });
  const setCookie = res.headers.get("set-cookie");
  if (setCookie) cookie = setCookie.split(";")[0];
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`${path} -> ${res.status}: ${JSON.stringify(body)}`);
  return body;
}

// 1. Read the catalog and pick the cheapest thing it can actually receive.
const catalog = await api("/api/agent/catalog");
const product = catalog.products
  .filter((p) => p.deliverable_file && p.price_lamports > 0)
  .sort((a, b) => a.price_lamports - b.price_lamports)[0];
if (!product) throw new Error("No purchasable product with a file in the catalog");
log(
  "catalog",
  `Picked "${product.title}" by @${product.seller} — ${product.price_lamports / 1e9} SOL`,
);

// Fund the agent from the devnet escrow wallet (faucet SOL): price + fee + rent/fees headroom.
const budget = Math.ceil(product.price_lamports * 1.03) + 10_000_000;
const funder = Keypair.fromSecretKey(bs58.decode(envVal("ESCROW_SECRET_KEY")));
const fundTx = new Transaction().add(
  SystemProgram.transfer({
    fromPubkey: funder.publicKey,
    toPubkey: agent.publicKey,
    lamports: budget,
  }),
);
await sendAndConfirmTransaction(connection, fundTx, [funder]);
log("agent", `Funded with ${(budget / 1e9).toFixed(3)} devnet SOL`);

// 2. Authenticate: SIWS with the agent's own key.
const wallet = agent.publicKey.toBase58();
const { nonce, issuedAt } = await api("/api/auth/nonce", {
  method: "POST",
  body: JSON.stringify({ wallet }),
});
const message = [
  `solgig.xyz wants you to sign in with your Solana account:`,
  wallet,
  "",
  "Signing proves the wallet is yours. It costs nothing and moves no funds.",
  "",
  `Nonce: ${nonce}`,
  `Issued At: ${issuedAt}`,
].join("\n");
const signature = bs58.encode(
  nacl.sign.detached(new TextEncoder().encode(message), agent.secretKey),
);
await api("/api/auth/verify", {
  method: "POST",
  body: JSON.stringify({ wallet, nonce, signature }),
});
log("auth", "Signed in with the agent's own signature — no password, no human");

// 3. Open the order.
const { order, payment } = await api("/api/orders", {
  method: "POST",
  body: JSON.stringify({ productId: product.id }),
});
log("order", `Order ${order.order_number} open — paying ${payment.amountLamports} lamports to ${payment.payTo}`);

// 4. Pay on-chain, exactly as the order instructs.
const payTx = new Transaction().add(
  SystemProgram.transfer({
    fromPubkey: agent.publicKey,
    toPubkey: new PublicKey(payment.payTo),
    lamports: payment.amountLamports,
  }),
);
if (payment.feeLamports > 0 && payment.treasury) {
  payTx.add(
    SystemProgram.transfer({
      fromPubkey: agent.publicKey,
      toPubkey: new PublicKey(payment.treasury),
      lamports: payment.feeLamports,
    }),
  );
}
const txSig = await sendAndConfirmTransaction(connection, payTx, [agent]);
log("pay", `Paid on-chain: https://explorer.solana.com/tx/${txSig}?cluster=devnet`);

// 5. Confirm — the server re-verifies everything on-chain before trusting us.
await api(`/api/orders/${order.id}/confirm`, {
  method: "POST",
  body: JSON.stringify({ signature: txSig }),
});
log("confirm", "Server verified the transfer independently and marked the order paid");

// 6. Collect the goods.
const { fileUrl } = await api(`/api/orders/${order.id}/download`);
const head = await fetch(fileUrl, { method: "HEAD", redirect: "follow" });
log("collect", `Download unlocked (${head.status} ${head.headers.get("content-type") ?? ""}): ${fileUrl}`);

console.log(
  "\nDone. A machine with nothing but a keypair discovered a product, paid for it, and received it. No bank. No card. No browser.",
);
