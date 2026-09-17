import { describe, it, expect } from "vitest";
import { Keypair, PublicKey, Transaction, TransactionMessage } from "@solana/web3.js";
import {
  configPda,
  decodeConfig,
  decodeOrder,
  escrowPda,
  fromWire,
  IX,
  openEscrowIx,
  orderIdBytes,
  purchaseIx,
  receiptPda,
  refundIx,
  releaseIx,
  resolveIx,
  toWire,
  updateConfigIx,
  uuidFromBytes,
} from "../src/lib/solana/program";
import { checkProgramTx, checkRecord, checkRelease } from "../src/lib/solana/settle";
import { buildPaymentTx } from "../src/lib/solana/paymentTx";

const programId = new PublicKey("Hci514Ans67Rfw8Dks8qKnVFjJF6MLLZmMV1owaFBo4L");
const buyer = Keypair.generate().publicKey;
const seller = Keypair.generate().publicKey;
const treasury = Keypair.generate().publicKey;
const orderId = "0f8e2c4a-1b3d-4e5f-8a9b-0c1d2e3f4a5b";

function record(tag: number, amount: bigint, f96: bigint, f104: bigint, feeBps = 0): Buffer {
  const d = Buffer.alloc(112);
  d[0] = tag;
  d[1] = 1;
  d[2] = 254;
  d.writeUInt16LE(feeBps, 4);
  Buffer.from(orderIdBytes(orderId)).copy(d, 8);
  buyer.toBuffer().copy(d, 24);
  seller.toBuffer().copy(d, 56);
  d.writeBigUInt64LE(amount, 88);
  d.writeBigInt64LE(f96, 96);
  d.writeBigInt64LE(f104, 104);
  return d;
}

describe("encoding", () => {
  it("round-trips order ids", () => {
    expect(uuidFromBytes(orderIdBytes(orderId))).toBe(orderId);
    expect(() => orderIdBytes("nope")).toThrow();
  });

  it("derives distinct PDAs per order and kind", () => {
    const other = "11111111-2222-4333-8444-555555555555";
    expect(receiptPda(programId, orderId).equals(receiptPda(programId, other))).toBe(false);
    expect(receiptPda(programId, orderId).equals(escrowPda(programId, orderId))).toBe(false);
    // The config PDA the app uses is the one live on devnet.
    expect(configPda(programId).toBase58()).toBe("CgeXXLs4BeQM2njfqxTCSToCBKqZKnsyZ6TmvjwesRUv");
  });

  it("encodes purchase as tag + order id + u64 amount", () => {
    const ix = purchaseIx(programId, { orderId, buyer, seller, treasury, amount: 1_500_000_000n });
    expect(ix.data.length).toBe(25);
    expect(ix.data[0]).toBe(IX.purchase);
    expect(Buffer.from(ix.data.subarray(1, 17))).toEqual(Buffer.from(orderIdBytes(orderId)));
    expect(Buffer.from(ix.data).readBigUInt64LE(17)).toBe(1_500_000_000n);
    expect(ix.keys.map((k) => [k.isSigner, k.isWritable])).toEqual([
      [true, true],
      [false, true],
      [false, true],
      [false, false],
      [false, true],
      [false, false],
    ]);
    expect(ix.keys[4].pubkey.equals(receiptPda(programId, orderId))).toBe(true);
  });

  it("encodes open escrow with a signed deadline", () => {
    const ix = openEscrowIx(programId, { orderId, buyer, seller, amount: 5n, deadline: 1_900_000_000n });
    expect(ix.data.length).toBe(33);
    expect(Buffer.from(ix.data).readBigInt64LE(25)).toBe(1_900_000_000n);
    expect(ix.keys[1].isWritable).toBe(false);
  });

  it("encodes release, refund, resolve and update", () => {
    expect(releaseIx(programId, { orderId, buyer, seller, treasury }).data).toEqual(Buffer.from([4]));
    const bySeller = refundIx(programId, { orderId, buyer, authority: seller });
    expect(bySeller.keys[0]).toMatchObject({ isSigner: true, isWritable: false });
    expect(bySeller.keys[1]).toMatchObject({ isSigner: false, isWritable: true });
    const byBuyer = refundIx(programId, { orderId, buyer, authority: buyer });
    expect(byBuyer.keys[0]).toMatchObject({ isSigner: true, isWritable: true });
    const admin = Keypair.generate().publicKey;
    const res = resolveIx(programId, { orderId, buyer, seller, treasury, admin, sellerShareBps: 7_500 });
    expect(Buffer.from(res.data).readUInt16LE(1)).toBe(7_500);
    expect(res.keys.length).toBe(6);
    const upd = updateConfigIx(programId, admin, { paused: true, feeBps: 300, admin, treasury });
    expect(upd.data.length).toBe(70);
    expect(upd.data[1]).toBe(1);
    expect(Buffer.from(upd.data).readUInt16LE(2)).toBe(300);
  });

  it("survives the JSON wire format unchanged", () => {
    const ix = purchaseIx(programId, { orderId, buyer, seller, treasury, amount: 42n });
    const back = fromWire(JSON.parse(JSON.stringify(toWire(ix))));
    expect(back.programId.equals(ix.programId)).toBe(true);
    expect(Buffer.from(back.data)).toEqual(Buffer.from(ix.data));
    expect(back.keys.map((k) => k.pubkey.toBase58())).toEqual(ix.keys.map((k) => k.pubkey.toBase58()));
  });
});

describe("decoding", () => {
  it("reads config", () => {
    const d = Buffer.alloc(72);
    d.set([1, 1, 255, 1]);
    d.writeUInt16LE(250, 4);
    seller.toBuffer().copy(d, 8);
    treasury.toBuffer().copy(d, 40);
    expect(decodeConfig(d)).toEqual({
      bump: 255,
      paused: true,
      feeBps: 250,
      admin: seller.toBase58(),
      treasury: treasury.toBase58(),
    });
    expect(decodeConfig(Buffer.alloc(72))).toBeNull();
  });

  it("reads receipts and escrows by tag", () => {
    const r = decodeOrder(record(2, 10n, 3n, 1_800_000_000n));
    expect(r).toMatchObject({ kind: "receipt", amount: 10n, fee: 3n, paidAt: 1_800_000_000n, orderId });
    const e = decodeOrder(record(3, 10n, 1_900_000_000n, 1_800_000_000n, 250));
    expect(e).toMatchObject({ kind: "escrow", feeBps: 250, deadline: 1_900_000_000n, openedAt: 1_800_000_000n });
    expect(decodeOrder(record(9, 1n, 0n, 0n))).toBeNull();
  });
});

describe("payment tx builder", () => {
  it("uses program instructions when the order lists them", () => {
    const ix = purchaseIx(programId, { orderId, buyer, seller, treasury, amount: 42n });
    const tx = buildPaymentTx(buyer, { amountLamports: 42, transfers: [], instructions: [toWire(ix)] });
    expect(tx.instructions).toHaveLength(1);
    expect(tx.instructions[0].programId.equals(programId)).toBe(true);
  });

  it("refuses instructions that want someone else's signature", () => {
    const ix = purchaseIx(programId, { orderId, buyer: seller, seller: buyer, treasury, amount: 1n });
    expect(() =>
      buildPaymentTx(buyer, { amountLamports: 1, transfers: [], instructions: [toWire(ix)] }),
    ).toThrow(/signature/);
  });
});

// A fetched legacy transaction as getTransaction returns it.
function fetched(ixs: Transaction["instructions"], payer: PublicKey, pre?: number[], post?: number[]) {
  const message = new TransactionMessage({
    payerKey: payer,
    recentBlockhash: "11111111111111111111111111111111",
    instructions: ixs,
  }).compileToLegacyMessage();
  const n = message.accountKeys.length;
  return {
    blockTime: 2_000_000_000,
    slot: 1,
    transaction: { message, signatures: ["x"] },
    meta: {
      err: null,
      fee: 5000,
      preBalances: pre ?? Array(n).fill(0),
      postBalances: post ?? Array(n).fill(0),
      loadedAddresses: undefined,
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any;
}

describe("settlement checks", () => {
  const pid = programId.toBase58();
  const receipt = receiptPda(programId, orderId).toBase58();
  const purchase = purchaseIx(programId, { orderId, buyer, seller, treasury, amount: 10n });

  it("accepts the buyer's purchase of this order", () => {
    expect(checkProgramTx(fetched([purchase], buyer), pid, receipt, buyer.toBase58(), 0)).toEqual({ ok: true });
  });

  it("rejects a failed, stale, unsigned or unrelated transaction", () => {
    const failed = fetched([purchase], buyer);
    failed.meta.err = { InstructionError: [0, { Custom: 6009 }] };
    expect(checkProgramTx(failed, pid, receipt, buyer.toBase58(), 0)).toMatchObject({ reason: "tx_failed" });
    expect(checkProgramTx(fetched([purchase], buyer), pid, receipt, buyer.toBase58(), 2_000_000_001)).toMatchObject({
      reason: "tx_predates_order",
    });
    expect(checkProgramTx(fetched([purchase], buyer), pid, receipt, seller.toBase58(), 0)).toMatchObject({
      reason: "buyer_not_signer",
    });
    const other = receiptPda(programId, "11111111-2222-4333-8444-555555555555").toBase58();
    expect(checkProgramTx(fetched([purchase], buyer), pid, other, buyer.toBase58(), 0)).toMatchObject({
      reason: "record_missing",
    });
    expect(checkProgramTx(null, pid, receipt, buyer.toBase58(), 0)).toMatchObject({ reason: "not_found" });
  });

  const want = { orderId, buyer: buyer.toBase58(), seller: seller.toBase58(), amount: 10n, fee: 3n };

  it("matches the record against the order", () => {
    const acct = { owner: programId, data: record(2, 10n, 3n, 0n) };
    expect(checkRecord(acct, pid, "receipt", want)).toEqual({ ok: true });
    expect(checkRecord({ ...acct, owner: seller }, pid, "receipt", want)).toMatchObject({ reason: "record_wrong_owner" });
    expect(checkRecord(acct, pid, "receipt", { ...want, amount: 11n })).toMatchObject({ reason: "record_wrong_amount" });
    expect(checkRecord(acct, pid, "receipt", { ...want, fee: 0n })).toMatchObject({ reason: "record_wrong_fee" });
    expect(checkRecord(acct, pid, "escrow", want)).toMatchObject({ reason: "record_invalid" });
    expect(checkRecord(acct, pid, "receipt", { ...want, seller: buyer.toBase58() })).toMatchObject({
      reason: "record_wrong_parties",
    });
    expect(checkRecord(null, pid, "receipt", want)).toMatchObject({ reason: "record_not_found" });
  });

  it("accepts a release only once the escrow is closed and the seller is paid", () => {
    const rel = releaseIx(programId, { orderId, buyer, seller, treasury });
    const escrow = escrowPda(programId, orderId).toBase58();
    const tx = fetched([rel], buyer);
    const keys: string[] = tx.transaction.message.accountKeys.map((k: PublicKey) => k.toBase58());
    const pre = keys.map(() => 0);
    const post = keys.map(() => 0);
    post[keys.indexOf(seller.toBase58())] = 975;
    const paid = fetched([rel], buyer, pre, post);
    const p = { buyer: buyer.toBase58(), seller: seller.toBase58(), sellerNet: 975n, notBefore: 0 };
    expect(checkRelease(paid, null, pid, escrow, p)).toEqual({ ok: true });
    expect(checkRelease(paid, { lamports: 5 }, pid, escrow, p)).toMatchObject({ reason: "escrow_still_open" });
    expect(checkRelease(paid, null, pid, escrow, { ...p, sellerNet: 976n })).toMatchObject({
      reason: "seller_underpaid",
    });
  });
});
