import {
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
} from "@solana/web3.js";
import bs58 from "bs58";
import { getConnection } from "./pay";
import { lamportsToNumber, treasuryAddress, type Split } from "@/lib/fees";

/**
 * Custodial escrow for service orders. When ESCROW_SECRET_KEY is set,
 * buyers pay the platform escrow wallet up front and the funds are only
 * released to the seller once the buyer accepts the delivered work.
 * Without the key, service orders fall back to direct payment.
 */
export function getEscrowKeypair(): Keypair | null {
  const secret = process.env.ESCROW_SECRET_KEY;
  if (!secret) return null;
  try {
    return Keypair.fromSecretKey(bs58.decode(secret));
  } catch {
    throw new Error("ESCROW_SECRET_KEY is set but is not a valid base58 secret key");
  }
}

export function getEscrowAddress(): string | null {
  return getEscrowKeypair()?.publicKey.toBase58() ?? null;
}

/** Thrown once the payout has been signed, so the money may already be moving. */
export class PayoutInFlightError extends Error {
  constructor(public signature: string, cause: unknown) {
    super(`payout ${signature} did not confirm: ${String(cause)}`);
  }
}

/**
 * Pay the seller (and the treasury fee) out of escrow and return the payout
 * signature.
 *
 * The transaction is signed before it is broadcast, and `onSigned` gets the
 * signature first so the caller can persist it. If confirmation then times
 * out, the payout may still land; the caller must look the signature up
 * with payoutStatus() rather than pay again. Errors before signing are
 * plain Errors and mean nothing was sent.
 */
export async function releaseEscrow(params: {
  seller: string;
  split: Split;
  onSigned: (signature: string) => Promise<void>;
}): Promise<string> {
  const escrow = getEscrowKeypair();
  if (!escrow) throw new Error("escrow_disabled");

  const connection = getConnection();
  const treasury = treasuryAddress();
  // The fee was fixed on the order. If the treasury has since been unset,
  // refuse before signing instead of paying the seller more than the net the
  // order (and the earnings counter) records. Nothing is signed, so the
  // caller hands the order back to 'paid'.
  if (params.split.fee > 0n && !treasury) throw new Error("treasury_missing");
  const fee = lamportsToNumber(params.split.fee);
  const sellerCut = lamportsToNumber(params.split.sellerNet);

  const tx = new Transaction().add(
    SystemProgram.transfer({
      fromPubkey: escrow.publicKey,
      toPubkey: new PublicKey(params.seller),
      lamports: sellerCut,
    }),
  );
  if (treasury && fee > 0) {
    tx.add(
      SystemProgram.transfer({
        fromPubkey: escrow.publicKey,
        toPubkey: new PublicKey(treasury),
        lamports: fee,
      }),
    );
  }

  const { blockhash, lastValidBlockHeight } =
    await connection.getLatestBlockhash("confirmed");
  tx.recentBlockhash = blockhash;
  tx.feePayer = escrow.publicKey;
  tx.sign(escrow);
  const signature = bs58.encode(tx.signature!);
  await params.onSigned(signature);

  try {
    await connection.sendRawTransaction(tx.serialize());
    const { value } = await connection.confirmTransaction(
      { signature, blockhash, lastValidBlockHeight },
      "confirmed",
    );
    if (value.err) throw new Error(JSON.stringify(value.err));
  } catch (err) {
    throw new PayoutInFlightError(signature, err);
  }
  return signature;
}

/** Where a previously signed payout stands on-chain. */
export async function payoutStatus(
  signature: string,
): Promise<"landed" | "failed" | "unknown"> {
  const { value } = await getConnection().getSignatureStatus(signature, {
    searchTransactionHistory: true,
  });
  if (!value) return "unknown";
  if (value.err) return "failed";
  return value.confirmationStatus === "processed" ? "unknown" : "landed";
}
