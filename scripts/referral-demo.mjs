// End-to-end proof that Commish referral commissions work inside SolGig.
//
// Three fresh wallets, each driving SolGig's real HTTP API with its own
// SIWS session: a seller lists a product and opens a Commish campaign, a
// referrer shares the link, a buyer pays through it. The server records the
// commission on-chain when the order completes, and after the refund window
// the referrer claims it. Every balance is then checked on-chain.
//
// Usage: node scripts/referral-demo.mjs [site]   (default http://localhost:3007)
// Devnet only. Wallets are funded from the devnet attestor in .env.local.
// Writes a JSON evidence file to demo/referral-demo-<timestamp>.json.
import { Connection, Keypair, PublicKey, SystemProgram, Transaction, TransactionInstruction, sendAndConfirmTransaction } from "@solana/web3.js";
import nacl from "tweetnacl";
import bs58 from "bs58";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const SITE = process.argv[2] ?? "http://localhost:3007";
const RPC = "https://api.devnet.solana.com";
const HOLD = 60; // refund window, seconds — short so the demo finishes
const BPS = 1_000; // 10% commission
const PRICE = 20_000_000; // 0.02 SOL product

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const env = readFileSync(join(root, ".env.local"), "utf8");
const envVal = (k) => env.split(/\r?\n/).find((l) => l.startsWith(k + "="))?.slice(k.length + 1).trim();
if (envVal("NEXT_PUBLIC_SOLANA_NETWORK") !== "devnet") throw new Error("devnet only");

const connection = new Connection(RPC, "confirmed");
const X = (sig) => `https://explorer.solana.com/tx/${sig}?cluster=devnet`;
const XA = (a) => `https://explorer.solana.com/address/${a}?cluster=devnet`;
const evidence = { site: SITE, network: "devnet", startedAt: new Date().toISOString(), steps: [] };
const log = (step, msg, extra = {}) => {
  console.log(`\n[${step}] ${msg}`);
  evidence.steps.push({ at: new Date().toISOString(), step, msg, ...extra });
};

const TREASURY = new PublicKey("ETcQvsQek2w9feLfsqoe4AypCWfnrSwQiv3djqocaP2m");
const WSOL = new PublicKey("So11111111111111111111111111111111111111112");
const ata = (owner) =>
  PublicKey.findProgramAddressSync(
    [owner.toBuffer(), new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA").toBuffer(), WSOL.toBuffer()],
    new PublicKey("ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL"),
  )[0];
const tokenBal = async (acct) => BigInt((await connection.getTokenAccountBalance(acct).catch(() => null))?.value.amount ?? "0");

/** One API client per wallet, each with its own session cookie. */
function client(kp) {
  let cookie = "";
  const api = async (path, opts = {}) => {
    const res = await fetch(SITE + path, {
      ...opts,
      headers: { "content-type": "application/json", ...(cookie ? { cookie } : {}) },
    });
    const sc = res.headers.get("set-cookie");
    if (sc) cookie = sc.split(";")[0];
    const body = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(`${path} -> ${res.status}: ${JSON.stringify(body)}`);
    return body;
  };
  api.signIn = async () => {
    const wallet = kp.publicKey.toBase58();
    const { nonce, issuedAt } = await api("/api/auth/nonce", { method: "POST", body: JSON.stringify({ wallet }) });
    const message = [
      `solgig.xyz wants you to sign in with your Solana account:`,
      wallet,
      "",
      "Signing proves the wallet is yours. It costs nothing and moves no funds.",
      "",
      `Nonce: ${nonce}`,
      `Issued At: ${issuedAt}`,
    ].join("\n");
    const signature = bs58.encode(nacl.sign.detached(new TextEncoder().encode(message), kp.secretKey));
    await api("/api/auth/verify", { method: "POST", body: JSON.stringify({ wallet, nonce, signature }) });
    return api("/api/me").catch(() => ({}));
  };
  /** Sign server-built instructions with this wallet only, like the dashboard does. */
  api.signWire = async (wire) => {
    const tx = new Transaction();
    for (const w of wire) {
      const ix = new TransactionInstruction({
        programId: new PublicKey(w.programId),
        keys: w.keys.map((k) => ({ ...k, pubkey: new PublicKey(k.pubkey) })),
        data: Buffer.from(w.data, "base64"),
      });
      if (ix.keys.some((k) => k.isSigner && !k.pubkey.equals(kp.publicKey))) throw new Error("unexpected signer");
      tx.add(ix);
    }
    return sendAndConfirmTransaction(connection, tx, [kp]);
  };
  return api;
}

// 0. Three fresh wallets, funded from the devnet attestor.
const funder = Keypair.fromSecretKey(bs58.decode(envVal("COMMISH_ATTESTOR_SECRET_KEY")));
const seller = Keypair.generate(), referrer = Keypair.generate(), buyer = Keypair.generate();
const fundTx = new Transaction().add(
  SystemProgram.transfer({ fromPubkey: funder.publicKey, toPubkey: seller.publicKey, lamports: 70_000_000 }),
  SystemProgram.transfer({ fromPubkey: funder.publicKey, toPubkey: referrer.publicKey, lamports: 5_000_000 }),
  SystemProgram.transfer({ fromPubkey: funder.publicKey, toPubkey: buyer.publicKey, lamports: 40_000_000 }),
);
const fundSig = await sendAndConfirmTransaction(connection, fundTx, [funder]);
log("wallets", `seller ${seller.publicKey.toBase58()}\n         referrer ${referrer.publicKey.toBase58()}\n         buyer ${buyer.publicKey.toBase58()}`, {
  seller: seller.publicKey.toBase58(), referrer: referrer.publicKey.toBase58(), buyer: buyer.publicKey.toBase58(), tx: X(fundSig),
});

const S = client(seller), R = client(referrer), B = client(buyer);
await S.signIn(); await R.signIn(); await B.signIn();
log("auth", "All three signed in to SolGig with SIWS (their own signatures)");

// 1. Seller lists a product.
const { product } = await S("/api/products", {
  method: "POST",
  body: JSON.stringify({
    title: `Commish referral demo ${Date.now().toString(36)}`,
    description: "A digital product used to prove referral commissions end to end.",
    short_description: "Referral demo product",
    file_url: "https://solgig.vercel.app/favicon.ico",
    price_lamports: PRICE,
  }),
});
log("listing", `Seller listed "${product.slug}" at ${PRICE / 1e9} SOL`, { product });

// 2. Seller opens a Commish campaign from SolGig: 10%, 60s window, 0.05 SOL budget.
const prep = await S("/api/affiliate", { method: "POST", body: JSON.stringify({ action: "prepare", bps: BPS, holdSeconds: HOLD, fundLamports: 50_000_000 }) });
const campaignSig = await S.signWire(prep.instructions);
await S("/api/affiliate", { method: "POST", body: JSON.stringify({ action: "register", campaign: prep.campaign }) });
log("campaign", `Campaign ${prep.campaign} opened on-chain and registered (10%, ${HOLD}s window, 0.05 SOL budget)`, { campaign: XA(prep.campaign), tx: X(campaignSig) });

const listed = await B(`/api/products/${product.slug}`);
log("listing", `Product page now advertises affiliate_bps = ${listed.product?.affiliate_bps ?? listed.affiliate_bps}`);

// 3. Buyer arrives via the referrer's link (?ref=<wallet>) and pays.
const ref = referrer.publicKey.toBase58();
const { order, payment } = await B("/api/orders", { method: "POST", body: JSON.stringify({ productId: product.id, ref }) });
const payTx = new Transaction();
for (const ix of payment.instructions ?? [])
  payTx.add(new TransactionInstruction({ programId: new PublicKey(ix.programId), keys: ix.keys.map((k) => ({ ...k, pubkey: new PublicKey(k.pubkey) })), data: Buffer.from(ix.data, "base64") }));
if (!payTx.instructions.length)
  for (const t of payment.transfers) payTx.add(SystemProgram.transfer({ fromPubkey: buyer.publicKey, toPubkey: new PublicKey(t.to), lamports: t.lamports }));
const paySig = await sendAndConfirmTransaction(connection, payTx, [buyer]);
log("order", `Order ${order.order_number} opened with ref=${ref.slice(0, 6)}… and paid on-chain`, { orderId: order.id, tx: X(paySig) });

// 4. Confirm: SolGig verifies payment, completes the order, records the commission.
const conf = await B(`/api/orders/${order.id}/confirm`, { method: "POST", body: JSON.stringify({ signature: paySig }) });
if (!conf.referral?.ok) throw new Error(`referral not recorded: ${JSON.stringify(conf.referral)}`);
log("record", `Order ${conf.status}; SolGig (attestor) recorded the commission on-chain`, { tx: X(conf.referral.signature) });

const s1 = await S("/api/affiliate");
const r1 = await R("/api/affiliate");
const earned = r1.earned.find((e) => e.id === order.id);
log("held", `Referrer sees ${Number(earned.commission_lamports) / 1e9} SOL "${earned.commission_status}" until ${earned.commission_release_at}; seller vault reserved ${Number(s1.campaign.reservedLamports) / 1e9} SOL`, {
  earned, campaign: s1.campaign,
});

// 5. Claiming early must fail — the refund window protects the seller.
try {
  await R("/api/affiliate/release", { method: "POST", body: JSON.stringify({ orderId: order.id }) });
  throw new Error("early release was NOT refused");
} catch (e) {
  if (String(e.message).includes("NOT refused")) throw e;
  log("guard", `Early claim refused as expected: ${e.message.split(": ").slice(1).join(": ")}`);
}

// 6. Wait out the window, then the referrer claims.
const due = new Date(earned.commission_release_at).getTime();
const wait = Math.max(0, due - Date.now()) + 5_000;
log("wait", `Waiting ${Math.round(wait / 1000)}s for the refund window to close…`);
await new Promise((r) => setTimeout(r, wait));

const payeeAta = ata(referrer.publicKey), treasuryAta = ata(TREASURY);
const [p0, t0] = [await tokenBal(payeeAta), await tokenBal(treasuryAta)];
const rel = await R("/api/affiliate/release", { method: "POST", body: JSON.stringify({ orderId: order.id }) });
log("release", `Referrer claimed; commission released on-chain`, { tx: X(rel.signature) });

// 7. Verify every number on-chain.
const [p1, t1] = [await tokenBal(payeeAta), await tokenBal(treasuryAta)];
const commission = BigInt(earned.commission_lamports);
const expectCommission = (BigInt(PRICE) * BigInt(BPS)) / 10_000n;
const fee = commission / 100n;
const checks = {
  commissionIs10pct: commission === expectCommission,
  referrerGot99pct: p1 - p0 === commission - fee,
  treasuryGot1pct: t1 - t0 === fee,
  statusReleased: (await R("/api/affiliate")).earned.find((e) => e.id === order.id)?.commission_status === "released",
};
const s2 = await S("/api/affiliate");
checks.vaultPaidMatches = BigInt(s2.campaign.paidLamports) === commission;
checks.nothingReserved = s2.campaign.reservedLamports === "0";
log("verify", `referrer +${Number(p1 - p0) / 1e9} SOL (wSOL), Commish treasury +${Number(t1 - t0) / 1e9} SOL, vault paid ${Number(s2.campaign.paidLamports) / 1e9} SOL`, {
  commission: commission.toString(), fee: fee.toString(), referrerAta: XA(payeeAta.toBase58()), campaignAfter: s2.campaign, checks,
});

evidence.finishedAt = new Date().toISOString();
evidence.passed = Object.values(checks).every(Boolean);
mkdirSync(join(root, "demo"), { recursive: true });
const out = join(root, "demo", `referral-demo-${Date.now()}.json`);
writeFileSync(out, JSON.stringify(evidence, null, 2));
console.log(`\n${evidence.passed ? "PASS" : "FAIL"} ${JSON.stringify(checks)}\nEvidence: ${out}`);
process.exit(evidence.passed ? 0 : 1);
