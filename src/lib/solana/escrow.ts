import {
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
  sendAndConfirmTransaction,
} from "@solana/web3.js";
import bs58 from "bs58";
import { getConnection } from "./pay";

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

/**
 * Pay the seller (and the treasury fee) out of escrow. Returns the payout
 * signature. Throws if the transfer fails, so callers must not mark the
 * order complete when this errors.
 */
export async function releaseEscrow(params: {
  seller: string;
  amountLamports: number;
  feeLamports: number;
}): Promise<string> {
  const escrow = getEscrowKeypair();
  if (!escrow) throw new Error("escrow_disabled");

  const connection = getConnection();
  const treasury = process.env.NEXT_PUBLIC_PLATFORM_TREASURY || null;
  const fee = treasury ? params.feeLamports : 0;
  const sellerCut = params.amountLamports - fee;

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
  return sendAndConfirmTransaction(connection, tx, [escrow], {
    commitment: "confirmed",
  });
}
