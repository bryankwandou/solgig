import { NextRequest, NextResponse } from "next/server";
import { PublicKey } from "@solana/web3.js";
import { sql } from "@/lib/db";
import { upsertUserByWallet } from "@/lib/auth/current-user";
import { platformFeeBps, treasuryAddress } from "@/lib/fees";
import { rateLimit } from "@/lib/rate-limit";
import { checkPayment, checkTokenPayment, getConnection } from "@/lib/solana/pay";
import { usdPerSol, usdcMint } from "@/lib/solana/usdc";
import {
  X402_VERSION,
  decodePaymentHeader,
  encodeHeader,
  priceProduct,
  readChallenge,
  requirement,
  signChallenge,
  verifyProof,
  x402Network,
  type Challenge,
  type PaymentHeader,
} from "@/lib/x402";
import { receiptFor, type ReceiptRow } from "@/lib/receipt";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Product = {
  id: string;
  slug: string;
  title: string;
  short_description: string | null;
  product_type: string;
  price_lamports: string | number;
  seller_id: string;
  seller: string | null;
  seller_wallet: string;
  file_url: string | null;
};

// GET /api/agent/products/[slug] — a digital product as an x402 resource.
//
// Without X-PAYMENT: 402 with the accepted payments (SOL and, when a price
// quote is available, USDC). With X-PAYMENT: the payment is verified on-chain
// and the answer is the file plus a receipt. No account or cookie needed; the
// paying wallet is the identity. Add ?payer=<pubkey> to the first call to get
// ready-to-sign instructions instead of just the transfer list.
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const limited = rateLimit({ req, key: "x402", limit: 60, windowMs: 60_000 });
  if (limited) return limited;

  const { slug } = await params;
  const rows = (await sql`
    SELECT p.id, p.slug, p.title, p.short_description, p.product_type,
           p.price_lamports, p.seller_id, p.file_url,
           u.username AS seller, u.wallet_address AS seller_wallet
    FROM products p JOIN users u ON u.id = p.seller_id
    WHERE p.slug = ${slug} AND p.is_published = true
  `) as Product[];
  const product = rows[0];
  if (!product) {
    return NextResponse.json(
      { error: { code: "not_found", message: "No published product with that slug." } },
      { status: 404 },
    );
  }
  if (!product.file_url) {
    return NextResponse.json(
      { error: { code: "no_file", message: "This product has nothing an agent can download." } },
      { status: 409 },
    );
  }

  const raw = req.headers.get("x-payment");
  if (!raw) return paymentRequired(req, product);
  const header = decodePaymentHeader(raw);
  if (!header) return paymentRequired(req, product, "invalid_payment_header");
  return settle(req, product, header);
}

async function paymentRequired(req: NextRequest, product: Product, error = "payment_required") {
  const treasury = treasuryAddress();
  const feeBps = treasury ? Number(platformFeeBps()) : 0;
  const prices = priceProduct(product.price_lamports, {
    treasury,
    usdPerSol: await usdPerSol(),
  });
  const challenge = await signChallenge({
    pid: product.id,
    seller: product.seller_wallet,
    treasury,
    ...prices,
  });

  let payer: PublicKey | null = null;
  const payerParam = req.nextUrl.searchParams.get("payer");
  if (payerParam) {
    try {
      payer = new PublicKey(payerParam);
    } catch {
      payer = null;
    }
  }

  const resource = `${req.nextUrl.origin}/api/agent/products/${product.slug}`;
  const common = {
    challenge,
    resource,
    description: product.title,
    seller: product.seller_wallet,
    treasury,
    payer,
    feeBps,
  };
  const accepts = [
    requirement({ ...common, asset: "SOL", q: prices.sol }),
    ...(prices.usdc ? [requirement({ ...common, asset: "USDC", q: prices.usdc })] : []),
  ];

  return NextResponse.json(
    {
      x402Version: X402_VERSION,
      error,
      accepts,
      product: {
        id: product.id,
        slug: product.slug,
        title: product.title,
        summary: product.short_description,
        type: product.product_type,
        seller: product.seller,
      },
      how_to_pay:
        "Pick one entry of `accepts`. In ONE transaction signed by your wallet, send every entry of extra.transfers (or sign extra.instructions if you passed ?payer=). Then repeat this GET with header X-PAYMENT = base64(JSON {x402Version:1, scheme:'exact', network, payload:{asset:'SOL'|'USDC', signature:<tx signature>, challenge:extra.challenge, payer:<your pubkey>, proof:base58(ed25519 signature of the UTF-8 text 'SolGig x402 payment\\nchallenge: <challenge>\\nsignature: <tx signature>')}}). The challenge expires after maxTimeoutSeconds.",
    },
    { status: 402 },
  );
}

async function settle(req: NextRequest, product: Product, header: PaymentHeader) {
  const { asset, signature, payer, proof } = header.payload;
  const challenge = await readChallenge(header.payload.challenge);
  if (!challenge || challenge.pid !== product.id) {
    return paymentRequired(req, product, "challenge_invalid_or_expired");
  }
  if (header.network !== x402Network()) {
    return paymentRequired(req, product, "wrong_network");
  }
  if (!verifyProof(header.payload.challenge, signature, payer, proof)) {
    return paymentRequired(req, product, "bad_payer_proof");
  }
  if (payer === challenge.seller) {
    return NextResponse.json(
      { error: { code: "own_product", message: "You cannot buy your own listing." } },
      { status: 400 },
    );
  }

  // Already settled with this signature: answer the same way again, as long
  // as it was this payer buying this product.
  const prior = await existingReceipt(signature);
  if (prior) return replay(prior, product, payer);

  const q = asset === "SOL" ? challenge.sol : challenge.usdc;
  if (!q) return paymentRequired(req, product, "asset_not_offered");
  const check = await verify(asset, signature, payer, q, challenge);
  if (!check.ok) return paymentRequired(req, product, `payment_unverified:${check.reason}`);

  const buyer = await upsertUserByWallet(payer);
  const mint = asset === "SOL" ? "SOL" : usdcMint();
  const orderId = crypto.randomUUID();
  // One statement: claim the signature, and only if that claim is new write
  // the completed order and bump the counters. A second request racing on the
  // same signature inserts nothing. Seller earnings are tracked in lamports,
  // so a USDC sale counts as an order but adds no lamports.
  const earned = asset === "SOL" ? q.sellerNet : "0";
  const created = (await sql`
    WITH claim AS (
      INSERT INTO transactions (signature, order_id, from_address, to_address, amount_lamports, token_mint)
      VALUES (${signature}, ${orderId}, ${payer}, ${challenge.seller}, ${q.gross}, ${mint})
      ON CONFLICT (signature) DO NOTHING
      RETURNING id
    ),
    ord AS (
      INSERT INTO orders
        (id, order_number, order_type, buyer_id, seller_id, product_id,
         amount_lamports, platform_fee_lamports, token_mint, buyer_wallet, seller_wallet,
         status, escrow, settlement, payment_tx_signature, paid_at, completed_at)
      SELECT ${orderId}, 'SG-2026-' || LPAD(nextval('order_seq')::text, 6, '0'), 'product',
             ${buyer.id}, ${product.seller_id}, ${product.id},
             ${q.gross}, ${q.fee}, ${mint}, ${payer}, ${challenge.seller},
             'completed', false, 'transfer', ${signature}, NOW(), NOW()
      WHERE EXISTS (SELECT 1 FROM claim)
      RETURNING id
    ),
    prod AS (
      UPDATE products SET total_purchases = total_purchases + 1
      WHERE id = ${product.id} AND EXISTS (SELECT 1 FROM ord)
      RETURNING id
    ),
    seller AS (
      UPDATE users
      SET total_earned_lamports = total_earned_lamports + ${earned}::bigint,
          completed_orders = completed_orders + 1
      WHERE id = ${product.seller_id} AND EXISTS (SELECT 1 FROM ord)
      RETURNING id
    )
    SELECT id FROM ord
  `) as { id: string }[];

  const row = await existingReceipt(signature);
  if (!row) {
    return NextResponse.json(
      { error: { code: "not_recorded", message: "Payment verified but not recorded. Retry the same request." } },
      { status: 500 },
    );
  }
  if (created.length === 0) return replay(row, product, payer);
  return delivered(row, product);
}

async function verify(
  asset: "SOL" | "USDC",
  signature: string,
  payer: string,
  q: NonNullable<Challenge["usdc"]>,
  challenge: Challenge,
) {
  const tx = await getConnection().getTransaction(signature, {
    maxSupportedTransactionVersion: 0,
    commitment: "confirmed",
  });
  // Two minutes of slack for clock drift, as in the order confirm route.
  const notBefore = challenge.iat - 120;
  if (asset === "SOL") {
    return checkPayment(tx, {
      buyer: payer,
      seller: challenge.seller,
      sellerMinLamports: Number(q.sellerNet),
      treasury: challenge.treasury,
      feeLamports: Number(q.fee),
      notBefore,
    });
  }
  return checkTokenPayment(tx, {
    buyer: payer,
    seller: challenge.seller,
    mint: usdcMint(),
    sellerMinAmount: BigInt(q.sellerNet),
    treasury: challenge.treasury,
    feeAmount: BigInt(q.fee),
    notBefore,
  });
}

async function existingReceipt(signature: string): Promise<ReceiptRow | null> {
  const rows = (await sql`
    SELECT o.id, o.order_number, o.product_id, o.amount_lamports, o.platform_fee_lamports,
           o.token_mint, o.buyer_wallet, o.seller_wallet, o.payment_tx_signature,
           o.paid_at, p.slug AS product_slug, p.title AS product_title
    FROM transactions t
    JOIN orders o ON o.id = t.order_id
    LEFT JOIN products p ON p.id = o.product_id
    WHERE t.signature = ${signature}
  `) as ReceiptRow[];
  return rows[0] ?? null;
}

function replay(row: ReceiptRow, product: Product, payer: string) {
  if (row.product_id !== product.id || row.buyer_wallet !== payer) {
    return NextResponse.json(
      { error: { code: "signature_used", message: "That payment already covers another purchase." } },
      { status: 409 },
    );
  }
  return delivered(row, product);
}

function delivered(row: ReceiptRow, product: Product) {
  const receipt = receiptFor(row);
  const res = NextResponse.json({ ok: true, receipt, delivery: { fileUrl: product.file_url } });
  res.headers.set(
    "X-PAYMENT-RESPONSE",
    encodeHeader({
      success: true,
      transaction: receipt.signature,
      network: receipt.network,
      payer: receipt.buyer,
      receipt: receipt.url,
    }),
  );
  return res;
}
