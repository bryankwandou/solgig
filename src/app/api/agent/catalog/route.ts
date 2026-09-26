import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { platformFeeBps, treasuryAddress } from "@/lib/fees";
import { usdPerSol, usdcMint, USDC_DECIMALS } from "@/lib/solana/usdc";
import { priceProduct, x402Network } from "@/lib/x402";
import { CATALOG_SCHEMA_VERSION } from "@/lib/agent-schema";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/agent/catalog — the machine-readable storefront.
//
// This is the endpoint that makes SolGig usable by AI agents, not just
// browsers. It returns every published listing together with a complete,
// self-describing recipe for how a wallet-holding agent can authenticate,
// open an order, pay on-chain, and collect what it bought — with no human
// in the loop. Everything referenced here is a public endpoint on this
// same host.
export async function GET() {
  const site = process.env.NEXT_PUBLIC_SITE_URL ?? "";
  const network = process.env.NEXT_PUBLIC_SOLANA_NETWORK ?? "mainnet-beta";
  // Same parsing, clamping and "no treasury, no fee" rule as the order
  // route, so the advertised fee is the fee actually charged.
  const treasury = treasuryAddress();
  const feeBps = treasury ? Number(platformFeeBps()) : 0;
  const rate = await usdPerSol();

  const products = await sql`
    SELECT p.id, p.slug, p.title, p.short_description, p.product_type,
           p.tags, p.price_lamports, p.rating_average, p.rating_count,
           (p.file_url IS NOT NULL) AS deliverable_file,
           u.username AS seller, u.wallet_address AS seller_wallet
    FROM products p JOIN users u ON u.id = p.seller_id
    WHERE p.is_published = true
    ORDER BY p.total_purchases DESC, p.created_at DESC
    LIMIT 100
  `;
  const services = await sql`
    SELECT s.id, s.slug, s.title, s.tags,
           s.price_lamports, s.delivery_days,
           u.username AS seller, u.wallet_address AS seller_wallet
    FROM services s JOIN users u ON u.id = s.seller_id
    WHERE s.is_published = true
    ORDER BY s.created_at DESC
    LIMIT 100
  `;

  // Postgres BIGINT and NUMERIC arrive as strings; an agent comparing
  // prices should get numbers, not "2500000000" > "900000000" === false.
  const num = (v: unknown) => (v == null ? null : Number(v));

  return NextResponse.json({
    $schema: `${site}/api/agent/schema`,
    schema_version: CATALOG_SCHEMA_VERSION,
    marketplace: "SolGig",
    description:
      "A store AI agents can buy from on Solana. Every digital product is an x402 resource: GET it, get HTTP 402 with payment terms, pay in SOL or USDC, retry with the signature, receive the file and an on-chain receipt.",
    network,
    x402_network: x402Network(network),
    escrow_program: process.env.NEXT_PUBLIC_ESCROW_PROGRAM_ID ?? null,
    platform_fee_bps: feeBps,
    currency: "SOL (lamports)",
    accepted_assets: [
      { symbol: "SOL", mint: null, decimals: 9 },
      ...(rate ? [{ symbol: "USDC", mint: usdcMint(network), decimals: USDC_DECIMALS }] : []),
    ],
    usd_per_sol: rate,
    products: products.map((p) => {
      const prices = priceProduct(p.price_lamports, { treasury, usdPerSol: rate });
      return {
        ...p,
        price_lamports: Number(p.price_lamports),
        rating_average: num(p.rating_average),
        prices: {
          SOL: { amount: prices.sol.gross, decimals: 9 },
          USDC: prices.usdc ? { amount: prices.usdc.gross, decimals: USDC_DECIMALS } : null,
        },
        // Only products with a file can be delivered to a headless buyer.
        purchase: p.deliverable_file
          ? { protocol: "x402", method: "GET", url: `${site}/api/agent/products/${p.slug}` }
          : null,
      };
    }),
    services: services.map((s) => ({
      ...s,
      price_lamports: Number(s.price_lamports),
    })),
    x402: {
      summary:
        "Fastest path for agents: no account, no cookie. The paying wallet is the identity.",
      steps: [
        `GET ${site}/api/agent/products/<slug>?payer=<your pubkey>  ->  402 with accepts[] (SOL and USDC), each carrying extra.challenge, extra.transfers and ready-to-sign extra.instructions.`,
        "Sign and send ONE transaction with those instructions. Wait for confirmation.",
        "Sign the UTF-8 text 'SolGig x402 payment\\nchallenge: <challenge>\\nsignature: <tx signature>' with the same key (ed25519, base58).",
        `Repeat the GET with header X-PAYMENT: base64(JSON {x402Version:1, scheme:'exact', network, payload:{asset, signature, challenge, payer, proof}}).`,
        `200 -> {receipt, delivery.fileUrl}; the X-PAYMENT-RESPONSE header carries the same receipt. Re-fetch it any time at ${site}/api/agent/receipts/<signature>.`,
      ],
      errors:
        "A failed or unverifiable payment returns 402 again with `error` explaining why and a fresh challenge. A signature already used for another purchase returns 409.",
    },
    how_to_transact: {
      summary:
        "Any holder of a Solana keypair — human or agent — can buy here. Authenticate by signing a nonce, open an order, pay the exact on-chain transfer the order specifies, then confirm with the transaction signature. Digital products unlock a download; services hold funds in escrow until you release them.",
      steps: [
        {
          step: 1,
          name: "authenticate",
          request: `POST ${site}/api/auth/nonce with {"wallet": "<base58 pubkey>"}`,
          then: `The response carries {nonce, issuedAt, message}. Sign the UTF-8 bytes of message exactly as given with your ed25519 secret key, then POST ${site}/api/auth/verify with {wallet, nonce, signature: base58(signature)}. The response sets an httpOnly session cookie; send it on every call below. Nonces expire after five minutes and work once.`,
        },
        {
          step: 2,
          name: "open_order",
          request: `POST ${site}/api/orders with {"productId": "<id>"} or {"serviceId": "<id>"}`,
          then: "When payment.instructions is non-empty, build one transaction from exactly those instructions ({programId, keys[{pubkey, isSigner, isWritable}], data: base64}); you are the only signer. They call the SolGig escrow program: a product purchase pays the seller and treasury and writes a receipt account; a service order locks the amount in a program-owned escrow account. Expect a small refundable deposit for that account on top of payment.amountLamports. When payment.instructions is empty, build one SystemProgram.transfer per entry of payment.transfers instead, exactly as listed.",
        },
        {
          step: 3,
          name: "pay_on_chain",
          request: `Send the transaction to the ${network} RPC and wait for confirmation.`,
          then: "Keep the transaction signature.",
        },
        {
          step: 4,
          name: "confirm",
          request: `POST ${site}/api/orders/<orderId>/confirm with {"signature": "<tx signature>"}`,
          then: "The server verifies on-chain before marking the order paid: for program orders it reads the receipt or escrow account for this order (owner, parties, amount, fee) and checks your transaction touched it; for transfer orders it checks signer and balance deltas. A signature can only ever confirm one order.",
        },
        {
          step: 5,
          name: "collect",
          request: `Products: GET ${site}/api/orders/<orderId>/download returns the file URL. Services: once the work is delivered, send the program's Release instruction (tag 4; accounts buyer, seller, treasury, config, escrow) and POST ${site}/api/orders/<orderId>/complete with {"signature"}. The seller can refund at any time; you can refund yourself after the 14-day deadline.`,
          then: "Done. Leave a review at POST /api/reviews if you want your rating to count on-chain reputation.",
        },
      ],
      rate_limits:
        "Per-IP sliding windows apply on all write endpoints (10-30 requests/minute). Space out your calls.",
    },
  });
}
