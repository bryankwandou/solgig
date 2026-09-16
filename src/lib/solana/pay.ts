import { Connection } from "@solana/web3.js";

export const RPC_URL =
  process.env.NEXT_PUBLIC_SOLANA_RPC_URL ?? "https://api.devnet.solana.com";

export function getConnection() {
  return new Connection(RPC_URL, "confirmed");
}

export type PaymentParams = {
  signature: string;
  buyer: string;
  seller: string;
  sellerMinLamports: number;
  treasury?: string | null;
  feeLamports?: number;
  /** Unix seconds. A transfer that landed before this cannot pay the order. */
  notBefore?: number;
};

type FetchedTx = NonNullable<
  Awaited<ReturnType<Connection["getTransaction"]>>
>;

/**
 * Confirm a signature landed on-chain and actually paid for the order:
 * the buyer signed and spent at least the full amount, the seller gained
 * their cut, and (when configured) the treasury received the platform fee.
 * This is the server's source of truth; the client is never trusted to
 * assert a payment succeeded.
 */
export async function verifyPayment(
  params: PaymentParams,
): Promise<{ ok: boolean; reason?: string }> {
  const connection = getConnection();
  const tx = await connection.getTransaction(params.signature, {
    maxSupportedTransactionVersion: 0,
    commitment: "confirmed",
  });
  return checkPayment(tx, params);
}

/** The on-chain checks of verifyPayment, run against a fetched transaction. */
export function checkPayment(
  tx: FetchedTx | null,
  params: Omit<PaymentParams, "signature">,
): { ok: boolean; reason?: string } {
  if (!tx) return { ok: false, reason: "not_found" };
  if (tx.meta?.err) return { ok: false, reason: "tx_failed" };
  // Without this, any older transfer from the buyer to the seller for the
  // same amount (a tip, an off-platform deal) could be claimed as payment.
  if (params.notBefore && tx.blockTime && tx.blockTime < params.notBefore) {
    return { ok: false, reason: "tx_predates_order" };
  }

  const message = tx.transaction.message;
  // A v0 transaction can pull the seller or treasury in through an address
  // lookup table. The balance arrays cover static keys followed by the
  // loaded ones, so resolve through both or a valid payment is refused.
  // Signers are always static, so the signer check below is unaffected.
  const loaded = tx.meta?.loadedAddresses;
  const usesLookups =
    "addressTableLookups" in message && message.addressTableLookups.length > 0;
  if (usesLookups && !loaded) {
    return { ok: false, reason: "lookups_unresolved" };
  }
  const accountKeys = usesLookups
    ? message.getAccountKeys({ accountKeysFromLookups: loaded })
    : message.getAccountKeys();
  const keys: string[] = [];
  for (let i = 0; i < accountKeys.length; i++) {
    keys.push(accountKeys.get(i)!.toBase58());
  }
  const sellerIdx = keys.indexOf(params.seller);
  const buyerIdx = keys.indexOf(params.buyer);
  if (sellerIdx < 0 || buyerIdx < 0) {
    return { ok: false, reason: "party_missing" };
  }
  // The buyer must have signed this transaction, not merely appear in it.
  const numSigners = message.header.numRequiredSignatures;
  if (buyerIdx >= numSigners) {
    return { ok: false, reason: "buyer_not_signer" };
  }

  const pre = tx.meta?.preBalances ?? [];
  const post = tx.meta?.postBalances ?? [];
  // Without full balance arrays the index arithmetic below means nothing.
  if (pre.length !== keys.length || post.length !== keys.length) {
    return { ok: false, reason: "balances_mismatch" };
  }
  const sellerGain = (post[sellerIdx] ?? 0) - (pre[sellerIdx] ?? 0);
  if (sellerGain < params.sellerMinLamports) {
    return { ok: false, reason: "amount_short" };
  }

  const fee = params.feeLamports ?? 0;
  if (params.treasury && fee > 0) {
    const treasuryIdx = keys.indexOf(params.treasury);
    const treasuryGain =
      treasuryIdx >= 0 ? (post[treasuryIdx] ?? 0) - (pre[treasuryIdx] ?? 0) : 0;
    if (treasuryGain < fee) {
      return { ok: false, reason: "fee_missing" };
    }
  }

  // The buyer's balance must drop by at least the full order amount
  // (they also pay the network fee, so the drop will exceed it).
  const buyerSpent = (pre[buyerIdx] ?? 0) - (post[buyerIdx] ?? 0);
  if (buyerSpent < params.sellerMinLamports + fee) {
    return { ok: false, reason: "buyer_underpaid" };
  }
  return { ok: true };
}
