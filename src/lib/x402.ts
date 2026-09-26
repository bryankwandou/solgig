// HTTP 402 payments for agents, in the shape of the x402 protocol.
//
// A request for a paid resource without payment gets `402 Payment Required`
// and a body listing what it accepts (SOL or USDC, how much, to whom). The
// agent pays on-chain and repeats the request with an `X-PAYMENT` header
// carrying the transaction signature. The server checks the chain and
// answers 200 with the goods and an `X-PAYMENT-RESPONSE` receipt.
//
// Two things x402 leaves to the server are pinned down here:
// - Price freshness. The 402 carries a signed challenge that fixes the
//   amounts (the USDC figure is a quote) for a few minutes; the retry is
//   checked against that, not against whatever the price is by then.
// - Who paid. Anyone can read a signature off the chain, so the retry must
//   also be signed by the paying wallet over challenge + signature. Without
//   that, a watcher could claim someone else's purchase.
import { SignJWT, jwtVerify } from "jose";
import { PublicKey, SystemProgram } from "@solana/web3.js";
import { secret } from "@/lib/auth/session";
import { verifySiwsSignature } from "@/lib/auth/siws";
import { lamportsToNumber, splitAmount, type Split } from "@/lib/fees";
import { toWire, type WireInstruction } from "@/lib/solana/program";
import {
  USDC_DECIMALS,
  createAtaIdempotentIx,
  lamportsToMicroUsdc,
  transferCheckedIx,
  usdcMint,
} from "@/lib/solana/usdc";

export const X402_VERSION = 1;
export const CHALLENGE_TTL_SECONDS = 300;

export type Asset = "SOL" | "USDC";

// Its own key, derived from the session secret, so a challenge can never be
// replayed as a session cookie or the other way round.
const key = new Uint8Array([...secret, ...new TextEncoder().encode(":x402-challenge")]);

export type Quote = { gross: string; fee: string; sellerNet: string };
export type Challenge = {
  /** Product id. */
  pid: string;
  seller: string;
  treasury: string | null;
  sol: Quote;
  usdc: Quote | null;
  /** Issued at, unix seconds. */
  iat: number;
};

const quote = (s: Split): Quote => ({
  gross: s.gross.toString(),
  fee: s.fee.toString(),
  sellerNet: s.sellerNet.toString(),
});

/**
 * Price a product in every asset it can be paid in. The fee comes from the
 * same splitAmount the order route uses, applied to the asset's own units.
 */
export function priceProduct(
  priceLamports: string | number | bigint,
  opts: { treasury: string | null; usdPerSol: number | null },
): { sol: Quote; usdc: Quote | null } {
  const sol = splitAmount(priceLamports, { treasury: opts.treasury });
  const usdc =
    opts.usdPerSol && sol.gross > 0n
      ? splitAmount(lamportsToMicroUsdc(sol.gross, opts.usdPerSol), { treasury: opts.treasury })
      : null;
  return { sol: quote(sol), usdc: usdc ? quote(usdc) : null };
}

export async function signChallenge(c: Omit<Challenge, "iat">): Promise<string> {
  return new SignJWT({ ...c })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${CHALLENGE_TTL_SECONDS}s`)
    .sign(key);
}

export async function readChallenge(token: string): Promise<Challenge | null> {
  try {
    const { payload } = await jwtVerify(token, key);
    return payload as unknown as Challenge;
  } catch {
    return null;
  }
}

/** What the paying wallet signs to claim its own payment. */
export function proofMessage(challenge: string, signature: string) {
  return `SolGig x402 payment\nchallenge: ${challenge}\nsignature: ${signature}`;
}

export function verifyProof(challenge: string, signature: string, payer: string, proof: string) {
  return verifySiwsSignature(proofMessage(challenge, signature), proof, payer);
}

export type PaymentHeader = {
  x402Version: number;
  scheme: "exact";
  network: string;
  payload: {
    asset: Asset;
    signature: string;
    challenge: string;
    payer: string;
    proof: string;
  };
};

export function encodeHeader(v: unknown): string {
  return Buffer.from(JSON.stringify(v), "utf8").toString("base64");
}

/** Decode an X-PAYMENT header; null for anything malformed. */
export function decodePaymentHeader(raw: string | null): PaymentHeader | null {
  if (!raw) return null;
  try {
    const v = JSON.parse(Buffer.from(raw, "base64").toString("utf8"));
    const p = v?.payload;
    const ok =
      v?.scheme === "exact" &&
      (p?.asset === "SOL" || p?.asset === "USDC") &&
      typeof p.signature === "string" && p.signature.length >= 32 &&
      typeof p.challenge === "string" &&
      typeof p.payer === "string" &&
      typeof p.proof === "string";
    if (!ok) return null;
    new PublicKey(p.payer);
    return v as PaymentHeader;
  } catch {
    return null;
  }
}

/** x402 network id for this deployment's cluster. */
export function x402Network(cluster = process.env.NEXT_PUBLIC_SOLANA_NETWORK ?? "mainnet-beta") {
  return cluster === "mainnet-beta" ? "solana" : `solana-${cluster}`;
}

type Transfer = { to: string; amount: string };

function transfers(q: Quote, seller: string, treasury: string | null): Transfer[] {
  return [
    { to: seller, amount: q.sellerNet },
    ...(treasury && BigInt(q.fee) > 0n ? [{ to: treasury, amount: q.fee }] : []),
  ];
}

/**
 * The exact instructions for one payment, ready to sign. Only possible when
 * the agent said who is paying (`?payer=`), since token accounts and the
 * transfer source depend on it.
 */
export function paymentInstructions(
  asset: Asset,
  payer: PublicKey,
  q: Quote,
  seller: string,
  treasury: string | null,
): WireInstruction[] {
  const list = transfers(q, seller, treasury);
  if (asset === "SOL") {
    return list.map((t) =>
      toWire(
        SystemProgram.transfer({
          fromPubkey: payer,
          toPubkey: new PublicKey(t.to),
          lamports: lamportsToNumber(BigInt(t.amount)),
        }),
      ),
    );
  }
  const mint = new PublicKey(usdcMint());
  return list.flatMap((t) => {
    const to = new PublicKey(t.to);
    return [
      toWire(createAtaIdempotentIx(payer, to, mint)),
      toWire(transferCheckedIx(payer, to, mint, BigInt(t.amount))),
    ];
  });
}

/** One entry of the 402 `accepts` list. */
export function requirement(opts: {
  asset: Asset;
  q: Quote;
  challenge: string;
  resource: string;
  description: string;
  seller: string;
  treasury: string | null;
  payer?: PublicKey | null;
  feeBps: number;
}) {
  const { asset, q, seller, treasury } = opts;
  return {
    scheme: "exact" as const,
    network: x402Network(),
    maxAmountRequired: q.gross,
    asset: asset === "SOL" ? "SOL" : usdcMint(),
    payTo: seller,
    resource: opts.resource,
    description: opts.description,
    mimeType: "application/json",
    maxTimeoutSeconds: CHALLENGE_TTL_SECONDS,
    extra: {
      symbol: asset,
      decimals: asset === "SOL" ? 9 : USDC_DECIMALS,
      challenge: opts.challenge,
      feeBps: opts.feeBps,
      // Every transfer must land in ONE transaction signed by the payer.
      transfers: transfers(q, seller, treasury),
      ...(opts.payer
        ? { instructions: paymentInstructions(asset, opts.payer, q, seller, treasury) }
        : {}),
    },
  };
}
