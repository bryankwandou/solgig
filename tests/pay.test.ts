import { describe, it, expect } from "vitest";
import {
  AddressLookupTableAccount,
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
  TransactionMessage,
} from "@solana/web3.js";
import { checkPayment } from "../src/lib/solana/pay";

const buyer = Keypair.generate().publicKey;
const seller = Keypair.generate().publicKey;
const blockhash = "11111111111111111111111111111111";
const PRICE = 10_000_000;
const params = {
  buyer: buyer.toBase58(),
  seller: seller.toBase58(),
  sellerMinLamports: PRICE,
};
const transfer = SystemProgram.transfer({
  fromPubkey: buyer,
  toPubkey: seller,
  lamports: PRICE,
});

// Balances follow account order: buyer (payer) first, then the seller,
// then the system program.
const balances = (n: number, sellerIdx: number, buyerIdx: number) => {
  const pre = Array(n).fill(1_000_000_000);
  const post = [...pre];
  post[buyerIdx] -= PRICE + 5000;
  post[sellerIdx] += PRICE;
  return { pre, post };
};

function v0Tx(withLoaded: boolean) {
  const table = new AddressLookupTableAccount({
    key: Keypair.generate().publicKey,
    state: {
      deactivationSlot: BigInt("18446744073709551615"),
      lastExtendedSlot: 0,
      lastExtendedSlotStartIndex: 0,
      addresses: [seller],
    },
  });
  const message = new TransactionMessage({
    payerKey: buyer,
    recentBlockhash: blockhash,
    instructions: [transfer],
  }).compileToV0Message([table]);
  // The seller must really have moved into the lookup table for this test
  // to mean anything.
  expect(message.staticAccountKeys.map(String)).not.toContain(seller.toBase58());
  // static: buyer, system program; loaded writable: seller
  const { pre, post } = balances(3, 2, 0);
  return {
    blockTime: 2_000_000_000,
    slot: 1,
    transaction: { message, signatures: ["x"] },
    meta: {
      err: null,
      fee: 5000,
      preBalances: pre,
      postBalances: post,
      loadedAddresses: withLoaded
        ? { writable: [seller], readonly: [] as PublicKey[] }
        : undefined,
    },
  } as never;
}

function legacyTx() {
  const tx = new Transaction({ feePayer: buyer, blockhash, lastValidBlockHeight: 0 }).add(transfer);
  const message = tx.compileMessage();
  const keys = message.accountKeys.map(String);
  const { pre, post } = balances(
    keys.length,
    keys.indexOf(seller.toBase58()),
    keys.indexOf(buyer.toBase58()),
  );
  return {
    blockTime: 2_000_000_000,
    slot: 1,
    transaction: { message, signatures: ["x"] },
    meta: { err: null, fee: 5000, preBalances: pre, postBalances: post },
  } as never;
}

describe("checkPayment", () => {
  it("accepts a legacy transfer", () => {
    expect(checkPayment(legacyTx(), params)).toEqual({ ok: true });
  });

  it("accepts a v0 transfer whose seller comes from a lookup table", () => {
    expect(checkPayment(v0Tx(true), params)).toEqual({ ok: true });
  });

  it("still refuses a v0 transfer when the loaded addresses are unknown", () => {
    expect(checkPayment(v0Tx(false), params)).toEqual({
      ok: false,
      reason: "lookups_unresolved",
    });
  });

  it("refuses when the seller was paid less than the order", () => {
    const r = checkPayment(v0Tx(true), { ...params, sellerMinLamports: PRICE + 1 });
    expect(r).toEqual({ ok: false, reason: "amount_short" });
  });

  it("refuses a buyer who only appears as a non-signer", () => {
    const r = checkPayment(v0Tx(true), {
      ...params,
      buyer: seller.toBase58(),
      seller: buyer.toBase58(),
      sellerMinLamports: 0,
    });
    expect(r).toEqual({ ok: false, reason: "buyer_not_signer" });
  });

  it("refuses a transfer older than the order", () => {
    const r = checkPayment(legacyTx(), { ...params, notBefore: 2_000_000_001 });
    expect(r).toEqual({ ok: false, reason: "tx_predates_order" });
  });

  it("refuses a missing transaction", () => {
    expect(checkPayment(null, params)).toEqual({ ok: false, reason: "not_found" });
  });
});
