import { PublicKey, SystemProgram, Transaction } from "@solana/web3.js";
import { fromWire, type WireInstruction } from "./program";

export type OrderPayment = {
  amountLamports: number;
  transfers: { to: string; lamports: number }[];
  /** Program instructions; when present they are the whole payment. */
  instructions?: WireInstruction[];
};

/**
 * Builds the buyer's payment exactly as the order response lists it.
 * Every client (the web app and headless agents) sends the same thing, so
 * the server's on-chain check never depends on client-side fee math.
 */
export function buildPaymentTx(payer: PublicKey, payment: OrderPayment) {
  const tx = new Transaction();
  if (Array.isArray(payment.instructions) && payment.instructions.length > 0) {
    for (const ix of payment.instructions) {
      const built = fromWire(ix);
      // The buyer is the only signer the server should ever ask for.
      if (built.keys.some((k) => k.isSigner && !k.pubkey.equals(payer))) {
        throw new Error("The order asked for a signature other than yours.");
      }
      tx.add(built);
    }
    return tx;
  }
  if (!Array.isArray(payment.transfers) || payment.transfers.length === 0) {
    throw new Error("The order did not include payment instructions.");
  }
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
