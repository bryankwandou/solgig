// The x402 purchase flow end to end at the route level: 402 challenge, pay,
// retry with X-PAYMENT, receipt. Postgres and the RPC are replaced; the
// challenge signing, proof check and on-chain checks are the real code.
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { Keypair, PublicKey, SystemProgram, Transaction } from "@solana/web3.js";
import nacl from "tweetnacl";
import bs58 from "bs58";

process.env.DATABASE_URL ??= "postgres://u:p@localhost/solgig_test";
process.env.SESSION_SECRET ??= "test-secret-test-secret-test-secret";
process.env.NEXT_PUBLIC_SOLANA_NETWORK = "devnet";
process.env.USDC_PER_SOL = "150";
process.env.NEXT_PUBLIC_PLATFORM_FEE_BPS = "250";

const seller = Keypair.generate().publicKey;
const treasury = Keypair.generate().publicKey;
process.env.NEXT_PUBLIC_PLATFORM_TREASURY = treasury.toBase58();

const PRODUCT_ID = "44444444-4444-4444-8444-444444444444";
const SELLER_ID = "55555555-5555-4555-8555-555555555555";
const BUYER_ID = "66666666-6666-4666-8666-666666666666";
const PRICE = 1_000_000_000n; // 1 SOL
const product = {
  id: PRODUCT_ID,
  slug: "agent-prompt-pack",
  title: "Agent prompt pack",
  short_description: "Prompts",
  product_type: "template",
  price_lamports: PRICE.toString(),
  seller_id: SELLER_ID,
  seller: "alice",
  seller_wallet: seller.toBase58(),
  file_url: "https://files.example/pack.zip",
};

// ---- fake Postgres: a transactions table keyed by signature
type Call = { text: string; values: unknown[] };
const calls: Call[] = [];
const recorded = new Map<string, Record<string, unknown>>();
vi.mock("@/lib/db", () => {
  const sql = (strings: TemplateStringsArray, ...values: unknown[]) => {
    const text = strings.join("?");
    calls.push({ text, values });
    if (text.includes("FROM products p JOIN users u")) {
      return Promise.resolve(values[0] === product.slug ? [product] : []);
    }
    if (text.includes("INSERT INTO users")) {
      return Promise.resolve([{ id: BUYER_ID, wallet_address: values[0], session_version: 0 }]);
    }
    if (text.includes("WITH claim AS")) {
      const [signature, orderId, payer, sellerWallet, gross, mint] = values as string[];
      if (recorded.has(signature)) return Promise.resolve([]);
      recorded.set(signature, {
        id: orderId,
        order_number: "SG-2026-000001",
        product_id: PRODUCT_ID,
        amount_lamports: gross,
        platform_fee_lamports: values[11],
        token_mint: mint,
        buyer_wallet: payer,
        seller_wallet: sellerWallet,
        payment_tx_signature: signature,
        paid_at: new Date(0).toISOString(),
        product_slug: product.slug,
        product_title: product.title,
      });
      return Promise.resolve([{ id: orderId }]);
    }
    if (text.includes("FROM transactions t")) {
      const row = recorded.get(values[0] as string);
      return Promise.resolve(row ? [row] : []);
    }
    return Promise.resolve([]);
  };
  return { sql };
});

// ---- fake RPC: whatever transaction the test lands next
let landed: unknown = null;
vi.mock("@/lib/solana/pay", async (orig) => {
  const real = await orig<typeof import("@/lib/solana/pay")>();
  return {
    ...real,
    getConnection: () => ({ getTransaction: async () => landed }),
  };
});

const route = await import("@/app/api/agent/products/[slug]/route");
const { encodeHeader, proofMessage } = await import("@/lib/x402");
const { usdcMint } = await import("@/lib/solana/usdc");

const ctx = (slug = product.slug) => ({ params: Promise.resolve({ slug }) });
const get = (headers: Record<string, string> = {}, query = "") =>
  new NextRequest(`http://localhost/api/agent/products/${product.slug}${query}`, {
    headers: { "x-forwarded-for": `10.1.0.${Math.floor(Math.random() * 250)}`, ...headers },
  });

/** A landed SOL transaction paying exactly the given transfers. */
function solTx(payer: Keypair, transfers: { to: string; amount: string }[]) {
  const tx = new Transaction({ feePayer: payer.publicKey, recentBlockhash: "11111111111111111111111111111111" });
  for (const t of transfers) {
    tx.add(SystemProgram.transfer({ fromPubkey: payer.publicKey, toPubkey: new PublicKey(t.to), lamports: Number(t.amount) }));
  }
  const message = tx.compileMessage();
  const keys = message.accountKeys.map((k) => k.toBase58());
  const pre = keys.map(() => 10_000_000_000);
  const post = [...pre];
  let total = 5000;
  for (const t of transfers) {
    post[keys.indexOf(t.to)] += Number(t.amount);
    total += Number(t.amount);
  }
  post[keys.indexOf(payer.publicKey.toBase58())] -= total;
  return {
    blockTime: Math.floor(Date.now() / 1000),
    slot: 1,
    transaction: { message, signatures: ["x"] },
    meta: { err: null, fee: 5000, preBalances: pre, postBalances: post, loadedAddresses: undefined },
  };
}

/** A landed USDC transaction: token balances by owner. */
function usdcTx(payer: Keypair, transfers: { to: string; amount: string }[]) {
  const base = solTx(payer, []);
  const mint = usdcMint();
  const bal = (owner: string, amount: bigint, i: number) => ({
    accountIndex: i, mint, owner, uiTokenAmount: { amount: amount.toString(), decimals: 6, uiAmount: null, uiAmountString: "" },
  });
  const spent = transfers.reduce((a, t) => a + BigInt(t.amount), 0n);
  const pre = [bal(payer.publicKey.toBase58(), 1_000_000_000n, 0), ...transfers.map((t, i) => bal(t.to, 0n, i + 1))];
  const post = [bal(payer.publicKey.toBase58(), 1_000_000_000n - spent, 0), ...transfers.map((t, i) => bal(t.to, BigInt(t.amount), i + 1))];
  return { ...base, meta: { ...base.meta, preTokenBalances: pre, postTokenBalances: post } };
}

function paymentHeader(payer: Keypair, asset: "SOL" | "USDC", challenge: string, signature: string, network = "solana-devnet") {
  const proof = bs58.encode(
    nacl.sign.detached(new TextEncoder().encode(proofMessage(challenge, signature)), payer.secretKey),
  );
  return encodeHeader({
    x402Version: 1,
    scheme: "exact",
    network,
    payload: { asset, signature, challenge, payer: payer.publicKey.toBase58(), proof },
  });
}

const fakeSig = () => bs58.encode(nacl.randomBytes(64));

async function challenge402(query = "") {
  const res = await route.GET(get({}, query), ctx());
  expect(res.status).toBe(402);
  return res.json();
}

beforeEach(() => {
  calls.length = 0;
  recorded.clear();
  landed = null;
});

describe("x402: payment required", () => {
  it("answers 402 with SOL and USDC terms, fee split included", async () => {
    const body = await challenge402();
    expect(body.x402Version).toBe(1);
    expect(body.accepts.map((a: { extra: { symbol: string } }) => a.extra.symbol)).toEqual(["SOL", "USDC"]);
    const [sol, usdc] = body.accepts;
    expect(sol.network).toBe("solana-devnet");
    expect(sol.maxAmountRequired).toBe(PRICE.toString());
    expect(sol.payTo).toBe(seller.toBase58());
    // 2.5% of 1 SOL to the treasury, the rest to the seller.
    expect(sol.extra.transfers).toEqual([
      { to: seller.toBase58(), amount: "975000000" },
      { to: treasury.toBase58(), amount: "25000000" },
    ]);
    // 1 SOL at 150 USD = 150 USDC.
    expect(usdc.asset).toBe(usdcMint());
    expect(usdc.maxAmountRequired).toBe("150000000");
    expect(usdc.extra.decimals).toBe(6);
    expect(typeof sol.extra.challenge).toBe("string");
    expect(sol.extra.instructions).toBeUndefined();
  });

  it("includes ready-to-sign instructions when the payer is named", async () => {
    const payer = Keypair.generate();
    const body = await challenge402(`?payer=${payer.publicKey.toBase58()}`);
    const [sol, usdc] = body.accepts;
    expect(sol.extra.instructions).toHaveLength(2);
    expect(sol.extra.instructions[0].keys[0]).toMatchObject({ pubkey: payer.publicKey.toBase58(), isSigner: true });
    // Per recipient: create its token account if missing, then TransferChecked.
    expect(usdc.extra.instructions).toHaveLength(4);
  });

  it("404s an unknown product", async () => {
    const res = await route.GET(get(), ctx("nope"));
    expect(res.status).toBe(404);
  });

  it("rejects a malformed X-PAYMENT header with a fresh 402", async () => {
    const res = await route.GET(get({ "x-payment": "not-base64-json" }), ctx());
    expect(res.status).toBe(402);
    expect((await res.json()).error).toBe("invalid_payment_header");
  });
});

describe("x402: pay and retry", () => {
  it("delivers the file and an on-chain receipt for a verified SOL payment", async () => {
    const payer = Keypair.generate();
    const { accepts } = await challenge402();
    const sol = accepts[0];
    const sig = fakeSig();
    landed = solTx(payer, sol.extra.transfers);

    const res = await route.GET(get({ "x-payment": paymentHeader(payer, "SOL", sol.extra.challenge, sig) }), ctx());
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.delivery.fileUrl).toBe(product.file_url);
    expect(body.receipt).toMatchObject({
      type: "solgig.receipt/v1",
      asset: "SOL",
      amount: PRICE.toString(),
      buyer: payer.publicKey.toBase58(),
      seller: seller.toBase58(),
      signature: sig,
    });
    expect(body.receipt.explorer).toContain(sig);
    const header = JSON.parse(Buffer.from(res.headers.get("x-payment-response")!, "base64").toString());
    expect(header).toMatchObject({ success: true, transaction: sig, network: "solana-devnet" });
  });

  it("settles a USDC payment through SPL token balances", async () => {
    const payer = Keypair.generate();
    const { accepts } = await challenge402();
    const usdc = accepts[1];
    const sig = fakeSig();
    landed = usdcTx(payer, usdc.extra.transfers);

    const res = await route.GET(get({ "x-payment": paymentHeader(payer, "USDC", usdc.extra.challenge, sig) }), ctx());
    expect(res.status).toBe(200);
    const { receipt } = await res.json();
    expect(receipt).toMatchObject({ asset: "USDC", mint: usdcMint(), amount: "150000000", decimals: 6 });
  });

  it("refuses a payment that skipped the platform fee", async () => {
    const payer = Keypair.generate();
    const { accepts } = await challenge402();
    const sol = accepts[0];
    landed = solTx(payer, [sol.extra.transfers[0]]);
    const res = await route.GET(get({ "x-payment": paymentHeader(payer, "SOL", sol.extra.challenge, fakeSig()) }), ctx());
    expect(res.status).toBe(402);
    expect((await res.json()).error).toBe("payment_unverified:fee_missing");
    expect(recorded.size).toBe(0);
  });

  it("refuses a claim on someone else's payment (proof by the wrong key)", async () => {
    const payer = Keypair.generate();
    const thief = Keypair.generate();
    const { accepts } = await challenge402();
    const sol = accepts[0];
    const sig = fakeSig();
    landed = solTx(payer, sol.extra.transfers);
    // The thief names the real payer but can only sign with their own key.
    const forged = JSON.parse(Buffer.from(paymentHeader(thief, "SOL", sol.extra.challenge, sig), "base64").toString());
    forged.payload.payer = payer.publicKey.toBase58();
    const res = await route.GET(get({ "x-payment": encodeHeader(forged) }), ctx());
    expect(res.status).toBe(402);
    expect((await res.json()).error).toBe("bad_payer_proof");
  });

  it("refuses a tampered challenge", async () => {
    const payer = Keypair.generate();
    const { accepts } = await challenge402();
    const bad = accepts[0].extra.challenge.slice(0, -2) + "xx";
    const res = await route.GET(get({ "x-payment": paymentHeader(payer, "SOL", bad, fakeSig()) }), ctx());
    expect(res.status).toBe(402);
    expect((await res.json()).error).toBe("challenge_invalid_or_expired");
  });

  it("refuses a payment on the wrong network", async () => {
    const payer = Keypair.generate();
    const { accepts } = await challenge402();
    const res = await route.GET(
      get({ "x-payment": paymentHeader(payer, "SOL", accepts[0].extra.challenge, fakeSig(), "solana") }),
      ctx(),
    );
    expect((await res.json()).error).toBe("wrong_network");
  });

  it("is idempotent for the same payer and refuses the signature for anyone else", async () => {
    const payer = Keypair.generate();
    const { accepts } = await challenge402();
    const sol = accepts[0];
    const sig = fakeSig();
    landed = solTx(payer, sol.extra.transfers);
    const h = paymentHeader(payer, "SOL", sol.extra.challenge, sig);

    const first = await route.GET(get({ "x-payment": h }), ctx());
    const again = await route.GET(get({ "x-payment": h }), ctx());
    expect(first.status).toBe(200);
    expect(again.status).toBe(200);
    expect((await again.json()).receipt.orderId).toBe((await first.json()).receipt.orderId);
    expect(recorded.size).toBe(1);

    // A second wallet presenting the same signature with its own valid proof.
    const other = Keypair.generate();
    const res = await route.GET(get({ "x-payment": paymentHeader(other, "SOL", sol.extra.challenge, sig) }), ctx());
    expect(res.status).toBe(409);
  });
});
