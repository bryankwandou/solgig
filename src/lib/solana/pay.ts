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
 * Confirm a signature landed on-chain and moved at least `minLamports`
 * from buyer to seller. This is the server's source of truth; the client
 * is never trusted to assert a payment succeeded.
 */
export async function verifyPayment(params: {
  signature: string;
  buyer: string;
  seller: string;
  minLamports: number;
}): Promise<{ ok: boolean; reason?: string }> {
  const connection = getConnection();
  const tx = await connection.getTransaction(params.signature, {
    maxSupportedTransactionVersion: 0,
    commitment: "confirmed",
  });
  if (!tx) return { ok: false, reason: "not_found" };
  if (tx.meta?.err) return { ok: false, reason: "tx_failed" };

  const keys = tx.transaction.message
    .getAccountKeys()
    .staticAccountKeys.map((k) => k.toBase58());
  const sellerIdx = keys.indexOf(params.seller);
  const buyerIdx = keys.indexOf(params.buyer);
  if (sellerIdx < 0 || buyerIdx < 0) {
    return { ok: false, reason: "party_missing" };
  }

  const pre = tx.meta?.preBalances ?? [];
  const post = tx.meta?.postBalances ?? [];
  const sellerGain = (post[sellerIdx] ?? 0) - (pre[sellerIdx] ?? 0);
  if (sellerGain < params.minLamports) {
    return { ok: false, reason: "amount_short" };
  }
  return { ok: true };
}
