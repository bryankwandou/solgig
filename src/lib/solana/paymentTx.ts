import { PublicKey, SystemProgram, Transaction } from "@solana/web3.js";

export type OrderPayment = {
  amountLamports: number;
  transfers: { to: string; lamports: number }[];
};

/**
 * Builds the buyer's payment exactly as the order response lists it.
 * Every client (the web app and headless agents) sends the same transfers,
 * so the server's on-chain check never depends on client-side fee math.
 */
export function buildPaymentTx(payer: PublicKey, payment: OrderPayment) {
  if (!Array.isArray(payment.transfers) || payment.transfers.length === 0) {
    throw new Error("The order did not include payment instructions.");
  }
  const tx = new Transaction();
  for (const t of payment.transfers) {
    tx.add(
      SystemProgram.transfer({
        fromPubkey: payer,
        toPubkey: new PublicKey(t.to),
        lamports: Number(t.lamports),
      }),
    );
  }
  return tx;
}
