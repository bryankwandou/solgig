import {
  Connection,
  PublicKey,
  Transaction,
  SystemProgram,
} from "@solana/web3.js";

export const RPC_URL =
  process.env.NEXT_PUBLIC_SOLANA_RPC_URL ?? "https://api.devnet.solana.com";

export function getConnection() {
  return new Connection(RPC_URL, "confirmed");
}

/**
 * Build an unsigned transfer transaction. When a platform treasury is set,
 * the fee is split off to it and the rest goes to the seller, in one tx.
 */
export async function buildPaymentTransaction(params: {
  buyer: string;
  seller: string;
  amountLamports: number;
  treasury?: string;
  feeLamports?: number;
}): Promise<Transaction> {
  const connection = getConnection();
  const buyer = new PublicKey(params.buyer);
  const seller = new PublicKey(params.seller);

  const tx = new Transaction();
  const fee = params.treasury ? (params.feeLamports ?? 0) : 0;
  const sellerCut = params.amountLamports - fee;

  tx.add(
    SystemProgram.transfer({
      fromPubkey: buyer,
      toPubkey: seller,
      lamports: sellerCut,
    }),
  );
  if (params.treasury && fee > 0) {
    tx.add(
      SystemProgram.transfer({
        fromPubkey: buyer,
        toPubkey: new PublicKey(params.treasury),
        lamports: fee,
      }),
    );
  }

  tx.feePayer = buyer;
  const { blockhash } = await connection.getLatestBlockhash("confirmed");
  tx.recentBlockhash = blockhash;
  return tx;
}

/**
 * Confirm a signature landed on-chain and actually paid for the order:
 * the buyer signed and spent at least the full amount, the seller gained
 * their cut, and (when configured) the treasury received the platform fee.
 * This is the server's source of truth; the client is never trusted to
 * assert a payment succeeded.
 */
export async function verifyPayment(params: {
  signature: string;
  buyer: string;
  seller: string;
  sellerMinLamports: number;
  treasury?: string | null;
  feeLamports?: number;
}): Promise<{ ok: boolean; reason?: string }> {
  const connection = getConnection();
  const tx = await connection.getTransaction(params.signature, {
    maxSupportedTransactionVersion: 0,
    commitment: "confirmed",
  });
  if (!tx) return { ok: false, reason: "not_found" };
  if (tx.meta?.err) return { ok: false, reason: "tx_failed" };

  const message = tx.transaction.message;
  const keys = message
    .getAccountKeys()
    .staticAccountKeys.map((k) => k.toBase58());
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
