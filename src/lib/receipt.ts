import { x402Network } from "@/lib/x402";

// A purchase receipt an agent can keep and anyone can check: every field
// here is backed by the transaction signature, which is public on-chain.

export type ReceiptRow = {
  id: string;
  order_number: string;
  product_id: string | null;
  amount_lamports: string | number;
  platform_fee_lamports: string | number | null;
  token_mint: string | null;
  buyer_wallet: string;
  seller_wallet: string;
  payment_tx_signature: string;
  paid_at: string | Date | null;
  product_slug: string | null;
  product_title: string | null;
};

export function explorerTx(signature: string, cluster = process.env.NEXT_PUBLIC_SOLANA_NETWORK ?? "mainnet-beta") {
  const q = cluster === "mainnet-beta" ? "" : `?cluster=${cluster}`;
  return `https://explorer.solana.com/tx/${signature}${q}`;
}

export function receiptFor(row: ReceiptRow) {
  const site = process.env.NEXT_PUBLIC_SITE_URL ?? "";
  const mint = row.token_mint ?? "SOL";
  const isSol = mint === "SOL";
  return {
    type: "solgig.receipt/v1",
    orderId: row.id,
    orderNumber: row.order_number,
    product: { id: row.product_id, slug: row.product_slug, title: row.product_title },
    asset: isSol ? "SOL" : "USDC",
    mint: isSol ? null : mint,
    decimals: isSol ? 9 : 6,
    amount: String(row.amount_lamports),
    fee: String(row.platform_fee_lamports ?? 0),
    buyer: row.buyer_wallet,
    seller: row.seller_wallet,
    network: x402Network(),
    signature: row.payment_tx_signature,
    explorer: explorerTx(row.payment_tx_signature),
    paidAt: row.paid_at ? new Date(row.paid_at).toISOString() : null,
    url: `${site}/api/agent/receipts/${row.payment_tx_signature}`,
  };
}
