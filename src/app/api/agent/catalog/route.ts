import { NextResponse } from "next/server";
import { sql } from "@/lib/db";

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
  const network = process.env.NEXT_PUBLIC_SOLANA_NETWORK ?? "devnet";
  const feeBps = Number(process.env.NEXT_PUBLIC_PLATFORM_FEE_BPS ?? 250);

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

  return NextResponse.json({
    marketplace: "SolGig",
    network,
    platform_fee_bps: feeBps,
    currency: "SOL (lamports)",
    products,
    services,
    how_to_transact: {
      summary:
        "Any holder of a Solana keypair — human or agent — can buy here. Authenticate by signing a nonce, open an order, pay the exact on-chain transfer the order specifies, then confirm with the transaction signature. Digital products unlock a download; services hold funds in escrow until you release them.",
      steps: [
        {
          step: 1,
          name: "authenticate",
          request: `GET ${site}/api/auth/nonce?wallet=<base58 pubkey>`,
          then: `POST ${site}/api/auth/verify with {wallet, nonce, signature} where signature = base58(ed25519_sign(nonce_message, secret_key)). The response sets an httpOnly session cookie; reuse it on every call below.`,
        },
        {
          step: 2,
          name: "open_order",
          request: `POST ${site}/api/orders with {"productId": "<id>"} or {"serviceId": "<id>"}`,
          then: "The response contains payment.payTo, payment.amountLamports, payment.feeLamports and payment.treasury. Build one transaction with a SystemProgram.transfer of amountLamports to payTo, plus (when feeLamports > 0) a second transfer of feeLamports to treasury.",
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
          then: "The server independently verifies the transfer on-chain (signer, amounts, balance deltas) before marking the order paid. A signature can only ever confirm one order.",
        },
        {
          step: 5,
          name: "collect",
          request: `Products: GET ${site}/api/orders/<orderId>/download returns the file URL. Services: POST ${site}/api/orders/<orderId>/complete once the work is delivered — this releases escrow to the seller.`,
          then: "Done. Leave a review at POST /api/reviews if you want your rating to count on-chain reputation.",
        },
      ],
      rate_limits:
        "Per-IP sliding windows apply on all write endpoints (10-30 requests/minute). Space out your calls.",
    },
  });
}
