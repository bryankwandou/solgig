import { Connection } from "@solana/web3.js";

export const RPC_URL =
  process.env.NEXT_PUBLIC_SOLANA_RPC_URL ?? "https://api.mainnet-beta.solana.com";

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
  const base = checkCommon(tx, params);
  if ("reason" in base) return { ok: false, reason: base.reason };
  const { tx: landed, keys, buyerIdx } = base;
  const sellerIdx = keys.indexOf(params.seller);
  if (sellerIdx < 0) return { ok: false, reason: "party_missing" };

  const pre = landed.meta?.preBalances ?? [];
  const post = landed.meta?.postBalances ?? [];
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

/**
 * The checks every payment shares, SOL or token: the transaction exists,
 * succeeded, landed after the order was opened, and the buyer signed it.
 */
function checkCommon(
  tx: FetchedTx | null,
  params: { buyer: string; notBefore?: number },
): { tx: FetchedTx; keys: string[]; buyerIdx: number } | { reason: string } {
  if (!tx) return { reason: "not_found" };
  if (tx.meta?.err) return { reason: "tx_failed" };
  // Without this, any older transfer from the buyer to the seller for the
  // same amount (a tip, an off-platform deal) could be claimed as payment.
  if (params.notBefore && tx.blockTime && tx.blockTime < params.notBefore) {
    return { reason: "tx_predates_order" };
  }
  const resolved = resolveKeys(tx);
  if ("error" in resolved) return { reason: resolved.error };
  const { keys, numSigners } = resolved;
  const buyerIdx = keys.indexOf(params.buyer);
  if (buyerIdx < 0) return { reason: "party_missing" };
  // The buyer must have signed this transaction, not merely appear in it.
  if (buyerIdx >= numSigners) return { reason: "buyer_not_signer" };
  return { tx, keys, buyerIdx };
}

export type TokenPaymentParams = {
  buyer: string;
  seller: string;
  /** SPL mint the order is priced in (USDC). */
  mint: string;
  /** Smallest units (micro-USDC for USDC). */
  sellerMinAmount: bigint;
  treasury?: string | null;
  feeAmount?: bigint;
  notBefore?: number;
};

/**
 * The SPL-token twin of checkPayment. Token balances are keyed by the owner
 * of each token account, so this holds whichever account the payer chose to
 * send to, as long as the seller (and treasury) own it and it is of `mint`.
 */
export function checkTokenPayment(
  tx: FetchedTx | null,
  params: TokenPaymentParams,
): { ok: boolean; reason?: string } {
  const base = checkCommon(tx, params);
  if ("reason" in base) return { ok: false, reason: base.reason };
  const meta = base.tx.meta;
  if (!meta?.preTokenBalances || !meta?.postTokenBalances) {
    return { ok: false, reason: "balances_mismatch" };
  }
  // Net change per owner for this mint, summed across that owner's accounts.
  const delta = (owner: string) => {
    let d = 0n;
    for (const b of meta.postTokenBalances!) {
      if (b.owner === owner && b.mint === params.mint) d += BigInt(b.uiTokenAmount.amount);
    }
    for (const b of meta.preTokenBalances!) {
      if (b.owner === owner && b.mint === params.mint) d -= BigInt(b.uiTokenAmount.amount);
    }
    return d;
  };
  if (delta(params.seller) < params.sellerMinAmount) {
    return { ok: false, reason: "amount_short" };
  }
  const fee = params.feeAmount ?? 0n;
  if (params.treasury && fee > 0n && delta(params.treasury) < fee) {
    return { ok: false, reason: "fee_missing" };
  }
  if (-delta(params.buyer) < params.sellerMinAmount + fee) {
    return { ok: false, reason: "buyer_underpaid" };
  }
  return { ok: true };
}

/**
 * Every account key of a fetched transaction as base58, in balance-array
 * order, plus how many of the leading keys signed.
 */
export function resolveKeys(
  tx: FetchedTx,
): { keys: string[]; numSigners: number } | { error: string } {
  const message = tx.transaction.message;
  // A v0 transaction can pull the seller or treasury in through an address
  // lookup table. The balance arrays cover static keys followed by the
  // loaded ones, so resolve through both or a valid payment is refused.
  // Signers are always static, so signer checks are unaffected.
  const loaded = tx.meta?.loadedAddresses;
  const usesLookups =
    "addressTableLookups" in message && message.addressTableLookups.length > 0;
  if (usesLookups && !loaded) return { error: "lookups_unresolved" };
  const accountKeys = usesLookups
    ? message.getAccountKeys({ accountKeysFromLookups: loaded })
    : message.getAccountKeys();
  const keys: string[] = [];
  for (let i = 0; i < accountKeys.length; i++) {
    keys.push(accountKeys.get(i)!.toBase58());
  }
  return { keys, numSigners: message.header.numRequiredSignatures };
}

export type { FetchedTx };
