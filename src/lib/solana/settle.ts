// Server-side checks for orders settled by the escrow program. The chain is
// the source of truth: an order counts as paid only when the program-owned
// record for that order exists with the parties and amount the order says,
// and the signature the client reports actually touched that record.

import type { AccountInfo, PublicKey } from "@solana/web3.js";
import { getConnection, resolveKeys, type FetchedTx } from "./pay";
import {
  decodeOrder,
  escrowPda,
  receiptPda,
  type OrderAccount,
} from "./program";

export type Expected = {
  orderId: string;
  buyer: string;
  seller: string;
  amount: bigint;
  /** Goods: the fee the order recorded. Services: ignored (rate is frozen on-chain). */
  fee: bigint;
  /** Unix seconds; the transaction must not predate the order. */
  notBefore: number;
};

type Check = { ok: true } | { ok: false; reason: string };

/** Transaction-level checks shared by payment and release. */
export function checkProgramTx(
  tx: FetchedTx | null,
  programId: string,
  record: string,
  signer: string,
  notBefore: number,
): Check {
  if (!tx) return { ok: false, reason: "not_found" };
  if (tx.meta?.err) return { ok: false, reason: "tx_failed" };
  if (tx.blockTime && tx.blockTime < notBefore) return { ok: false, reason: "tx_predates_order" };
  const resolved = resolveKeys(tx);
  if ("error" in resolved) return { ok: false, reason: resolved.error };
  const { keys, numSigners } = resolved;
  const signerIdx = keys.indexOf(signer);
  if (signerIdx < 0 || signerIdx >= numSigners) return { ok: false, reason: "buyer_not_signer" };
  if (!keys.includes(programId)) return { ok: false, reason: "program_missing" };
  // The order's record must be in this very transaction, or a signature
  // from some other order could be replayed here.
  if (!keys.includes(record)) return { ok: false, reason: "record_missing" };
  return { ok: true };
}

/** Account-level check: the record matches the order. */
export function checkRecord(
  account: Pick<AccountInfo<Buffer>, "owner" | "data"> | null,
  programId: string,
  kind: OrderAccount["kind"],
  want: Omit<Expected, "notBefore">,
): Check {
  if (!account) return { ok: false, reason: "record_not_found" };
  if (account.owner.toBase58() !== programId) return { ok: false, reason: "record_wrong_owner" };
  const rec = decodeOrder(account.data);
  if (!rec || rec.kind !== kind) return { ok: false, reason: "record_invalid" };
  if (rec.orderId !== want.orderId) return { ok: false, reason: "record_wrong_order" };
  if (rec.buyer !== want.buyer || rec.seller !== want.seller) {
    return { ok: false, reason: "record_wrong_parties" };
  }
  if (rec.amount !== want.amount) return { ok: false, reason: "record_wrong_amount" };
  if (rec.kind === "receipt" && rec.fee !== want.fee) return { ok: false, reason: "record_wrong_fee" };
  return { ok: true };
}

/**
 * A goods purchase (receipt) or a service escrow (open) paid for this order.
 */
export async function verifyProgramPayment(
  programId: PublicKey,
  kind: OrderAccount["kind"],
  signature: string,
  want: Expected,
): Promise<Check> {
  const connection = getConnection();
  const pid = programId.toBase58();
  const record = kind === "receipt" ? receiptPda(programId, want.orderId) : escrowPda(programId, want.orderId);
  const tx = await connection.getTransaction(signature, {
    maxSupportedTransactionVersion: 0,
    commitment: "confirmed",
  });
  const txCheck = checkProgramTx(tx, pid, record.toBase58(), want.buyer, want.notBefore);
  if (!txCheck.ok) return txCheck;
  const account = await connection.getAccountInfo(record, "confirmed");
  // A service escrow can already be released or refunded by the time the
  // buyer confirms; the transaction above still proves it was opened.
  if (!account && kind === "escrow") return { ok: false, reason: "escrow_already_closed" };
  return checkRecord(account, pid, kind, want);
}

/**
 * The buyer's Release landed: the escrow for this order is closed and the
 * seller received at least the net.
 */
export function checkRelease(
  tx: FetchedTx | null,
  escrowAccount: Pick<AccountInfo<Buffer>, "lamports"> | null,
  programId: string,
  escrow: string,
  p: { buyer: string; seller: string; sellerNet: bigint; notBefore: number },
): Check {
  const base = checkProgramTx(tx, programId, escrow, p.buyer, p.notBefore);
  if (!base.ok) return base;
  if (escrowAccount && escrowAccount.lamports > 0) return { ok: false, reason: "escrow_still_open" };
  const resolved = resolveKeys(tx!);
  if ("error" in resolved) return { ok: false, reason: resolved.error };
  const i = resolved.keys.indexOf(p.seller);
  const pre = tx!.meta?.preBalances ?? [];
  const post = tx!.meta?.postBalances ?? [];
  if (i < 0 || pre.length !== resolved.keys.length || post.length !== resolved.keys.length) {
    return { ok: false, reason: "seller_missing" };
  }
  if (BigInt(post[i] - pre[i]) < p.sellerNet) return { ok: false, reason: "seller_underpaid" };
  return { ok: true };
}

export async function verifyRelease(
  programId: PublicKey,
  signature: string,
  p: { orderId: string; buyer: string; seller: string; sellerNet: bigint; notBefore: number },
): Promise<Check> {
  const connection = getConnection();
  const escrow = escrowPda(programId, p.orderId);
  const tx = await connection.getTransaction(signature, {
    maxSupportedTransactionVersion: 0,
    commitment: "confirmed",
  });
  const account = await connection.getAccountInfo(escrow, "confirmed");
  return checkRelease(tx, account, programId.toBase58(), escrow.toBase58(), p);
}
