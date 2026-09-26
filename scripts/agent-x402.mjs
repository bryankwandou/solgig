// An agent buying over HTTP 402 (x402): no account, no cookie, no browser.
//
//   GET product -> 402 with terms -> pay on-chain -> GET again with X-PAYMENT
//   -> 200 with the file and a receipt backed by the transaction signature.
//
// Usage:
//   node scripts/agent-x402.mjs <site> <product-slug> [SOL|USDC]
//   AGENT_SECRET_KEY=<base58 secret key>   the paying wallet (required to pay)
//   SOLANA_RPC=<url>                       defaults to the site's network
//   --quote-only                            stop after printing the 402
//
// The agent's key is read from the environment and never written anywhere.
import {
  Connection,
  Keypair,
  PublicKey,
  Transaction,
  TransactionInstruction,
  sendAndConfirmTransaction,
} from "@solana/web3.js";
import nacl from "tweetnacl";
import bs58 from "bs58";

const args = process.argv.slice(2).filter((a) => !a.startsWith("--"));
const quoteOnly = process.argv.includes("--quote-only");
const [SITE = "https://solgig.vercel.app", SLUG, ASSET = "SOL"] = args;
if (!SLUG) {
  console.error("usage: node scripts/agent-x402.mjs <site> <product-slug> [SOL|USDC] [--quote-only]");
  process.exit(1);
}
const log = (step, msg) => console.log(`\n[${step}] ${msg}`);

const secret = process.env.AGENT_SECRET_KEY;
const agent = secret ? Keypair.fromSecretKey(bs58.decode(secret)) : Keypair.generate();
log("agent", `wallet ${agent.publicKey.toBase58()}${secret ? "" : " (fresh, unfunded)"}`);

const url = `${SITE}/api/agent/products/${SLUG}`;

// 1. Ask. The 402 names the price and, since we say who pays, the exact
// instructions to sign.
const first = await fetch(`${url}?payer=${agent.publicKey.toBase58()}`);
const terms = await first.json();
if (first.status !== 402) throw new Error(`expected 402, got ${first.status}: ${JSON.stringify(terms)}`);
const offer = terms.accepts.find((a) => a.extra.symbol === ASSET);
if (!offer) throw new Error(`${ASSET} not offered; accepts: ${terms.accepts.map((a) => a.extra.symbol)}`);
const human = Number(offer.maxAmountRequired) / 10 ** offer.extra.decimals;
log("402", `"${terms.product.title}" costs ${human} ${ASSET} on ${offer.network}`);
for (const t of offer.extra.transfers) log("402", `  -> ${t.to.slice(0, 8)}… ${t.amount}`);
if (quoteOnly) process.exit(0);
if (!secret) throw new Error("set AGENT_SECRET_KEY to a funded wallet to pay");

// 2. Pay: one transaction, exactly the instructions we were given.
const rpc =
  process.env.SOLANA_RPC ??
  (offer.network === "solana" ? "https://api.mainnet-beta.solana.com" : "https://api.devnet.solana.com");
const tx = new Transaction();
for (const ix of offer.extra.instructions) {
  tx.add(
    new TransactionInstruction({
      programId: new PublicKey(ix.programId),
      keys: ix.keys.map((k) => ({ ...k, pubkey: new PublicKey(k.pubkey) })),
      data: Buffer.from(ix.data, "base64"),
    }),
  );
}
const signature = await sendAndConfirmTransaction(new Connection(rpc, "confirmed"), tx, [agent]);
log("pay", `sent ${signature}`);

// 3. Prove it was us, and retry with X-PAYMENT.
const challenge = offer.extra.challenge;
const proofText = `SolGig x402 payment\nchallenge: ${challenge}\nsignature: ${signature}`;
const proof = bs58.encode(nacl.sign.detached(new TextEncoder().encode(proofText), agent.secretKey));
const header = Buffer.from(
  JSON.stringify({
    x402Version: 1,
    scheme: "exact",
    network: offer.network,
    payload: { asset: ASSET, signature, challenge, payer: agent.publicKey.toBase58(), proof },
  }),
).toString("base64");
const paid = await fetch(url, { headers: { "X-PAYMENT": header } });
const body = await paid.json();
if (!paid.ok) throw new Error(`${paid.status}: ${JSON.stringify(body)}`);

log("200", `order ${body.receipt.orderNumber}, file: ${body.delivery.fileUrl}`);
log("receipt", body.receipt.explorer);
