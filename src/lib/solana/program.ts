// Client for the SolGig escrow program (programs/solgig-escrow, Pinocchio).
// Shared by the API routes, the browser and the agent script, so there is a
// single definition of the account layouts and instruction encodings.
//
// Layouts are fixed little-endian records; see programs/solgig-escrow/README.md.

import {
  PublicKey,
  SystemProgram,
  TransactionInstruction,
  type AccountMeta,
} from "@solana/web3.js";

const LOADER_V3 = new PublicKey("BPFLoaderUpgradeab1e11111111111111111111111");

export const IX = {
  initializeConfig: 0,
  updateConfig: 1,
  purchase: 2,
  openEscrow: 3,
  release: 4,
  refund: 5,
  resolve: 6,
} as const;

export const TAG = { config: 1, receipt: 2, escrow: 3 } as const;
export const RECORD_LEN = { config: 72, receipt: 112, escrow: 112 } as const;

/** Program error codes (6000+), as returned in `InstructionError::Custom`. */
export const PROGRAM_ERRORS: Record<number, string> = {
  6000: "InvalidInstruction",
  6001: "InvalidAccountData",
  6002: "AlreadyInitialized",
  6003: "MissingSigner",
  6004: "NotWritable",
  6005: "WrongOwner",
  6006: "InvalidPda",
  6007: "Unauthorized",
  6008: "FeeTooHigh",
  6009: "Paused",
  6010: "ZeroAmount",
  6011: "TreasuryMismatch",
  6012: "PartyMismatch",
  6013: "DeadlineInPast",
  6014: "DeadlineNotReached",
  6015: "InvalidShare",
  6016: "Overflow",
  6017: "NotUpgradeAuthority",
  6018: "SelfDeal",
  6019: "WrongProgram",
  6020: "TooManyAccounts",
  6021: "NotEnoughAccounts",
  6022: "AccountBorrowed",
  6023: "Runtime",
};

/** The deployed program, or null when this deployment settles by plain transfers. */
export function escrowProgramId(): PublicKey | null {
  const v = process.env.NEXT_PUBLIC_ESCROW_PROGRAM_ID;
  if (!v) return null;
  try {
    return new PublicKey(v);
  } catch {
    throw new Error("NEXT_PUBLIC_ESCROW_PROGRAM_ID is not a valid address");
  }
}

// ------------------------------------------------------------------ bytes

/** An order's 16-byte on-chain id: the order UUID without dashes. */
export function orderIdBytes(uuid: string): Uint8Array {
  const hex = uuid.replace(/-/g, "");
  if (!/^[0-9a-f]{32}$/i.test(hex)) throw new RangeError(`not a uuid: ${uuid}`);
  const out = new Uint8Array(16);
  for (let i = 0; i < 16; i++) out[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  return out;
}

export function uuidFromBytes(b: Uint8Array): string {
  const h = Array.from(b, (x) => x.toString(16).padStart(2, "0")).join("");
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}

function u16(v: number): Uint8Array {
  const b = new Uint8Array(2);
  new DataView(b.buffer).setUint16(0, v, true);
  return b;
}

function u64(v: bigint): Uint8Array {
  const b = new Uint8Array(8);
  new DataView(b.buffer).setBigUint64(0, v, true);
  return b;
}

function i64(v: bigint): Uint8Array {
  const b = new Uint8Array(8);
  new DataView(b.buffer).setBigInt64(0, v, true);
  return b;
}

function concat(...parts: Uint8Array[]): Buffer {
  return Buffer.concat(parts.map((p) => Buffer.from(p)));
}

// ------------------------------------------------------------------- PDAs

export function configPda(programId: PublicKey): PublicKey {
  return PublicKey.findProgramAddressSync([Buffer.from("config")], programId)[0];
}

export function receiptPda(programId: PublicKey, orderId: string): PublicKey {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("receipt"), Buffer.from(orderIdBytes(orderId))],
    programId,
  )[0];
}

export function escrowPda(programId: PublicKey, orderId: string): PublicKey {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("escrow"), Buffer.from(orderIdBytes(orderId))],
    programId,
  )[0];
}

export function programDataAddress(programId: PublicKey): PublicKey {
  return PublicKey.findProgramAddressSync([programId.toBuffer()], LOADER_V3)[0];
}

// ----------------------------------------------------------- instructions

const w = (pubkey: PublicKey, isSigner = false): AccountMeta => ({ pubkey, isSigner, isWritable: true });
const r = (pubkey: PublicKey, isSigner = false): AccountMeta => ({ pubkey, isSigner, isWritable: false });

export type ConfigArgs = {
  paused: boolean;
  feeBps: number;
  admin: PublicKey;
  treasury: PublicKey;
};

function configArgs(a: ConfigArgs): Buffer {
  return concat(
    Uint8Array.of(a.paused ? 1 : 0),
    u16(a.feeBps),
    Uint8Array.of(0, 0),
    a.admin.toBytes(),
    a.treasury.toBytes(),
  );
}

export function initializeConfigIx(programId: PublicKey, authority: PublicKey, args: ConfigArgs) {
  return new TransactionInstruction({
    programId,
    keys: [
      w(authority, true),
      w(configPda(programId)),
      r(programDataAddress(programId)),
      r(SystemProgram.programId),
    ],
    data: concat(Uint8Array.of(IX.initializeConfig), configArgs(args)),
  });
}

export function updateConfigIx(programId: PublicKey, admin: PublicKey, args: ConfigArgs) {
  return new TransactionInstruction({
    programId,
    keys: [r(admin, true), w(configPda(programId))],
    data: concat(Uint8Array.of(IX.updateConfig), configArgs(args)),
  });
}

export type OrderParties = {
  orderId: string;
  buyer: PublicKey;
  seller: PublicKey;
};

/** Digital goods: pays seller and treasury and writes a receipt, atomically. */
export function purchaseIx(
  programId: PublicKey,
  p: OrderParties & { treasury: PublicKey; amount: bigint },
) {
  return new TransactionInstruction({
    programId,
    keys: [
      w(p.buyer, true),
      w(p.seller),
      w(p.treasury),
      r(configPda(programId)),
      w(receiptPda(programId, p.orderId)),
      r(SystemProgram.programId),
    ],
    data: concat(Uint8Array.of(IX.purchase), orderIdBytes(p.orderId), u64(p.amount)),
  });
}

/** Services: locks the amount in a program-owned escrow until release. */
export function openEscrowIx(
  programId: PublicKey,
  p: OrderParties & { amount: bigint; deadline: bigint },
) {
  return new TransactionInstruction({
    programId,
    keys: [
      w(p.buyer, true),
      r(p.seller),
      r(configPda(programId)),
      w(escrowPda(programId, p.orderId)),
      r(SystemProgram.programId),
    ],
    data: concat(
      Uint8Array.of(IX.openEscrow),
      orderIdBytes(p.orderId),
      u64(p.amount),
      i64(p.deadline),
    ),
  });
}

/** The buyer accepts the work: seller is paid, fee goes to treasury. */
export function releaseIx(programId: PublicKey, p: OrderParties & { treasury: PublicKey }) {
  return new TransactionInstruction({
    programId,
    keys: [
      w(p.buyer, true),
      w(p.seller),
      w(p.treasury),
      r(configPda(programId)),
      w(escrowPda(programId, p.orderId)),
    ],
    data: Buffer.from([IX.release]),
  });
}

/** Seller at any time, or buyer after the deadline, returns the funds. */
export function refundIx(
  programId: PublicKey,
  p: { orderId: string; buyer: PublicKey; authority: PublicKey },
) {
  const buyerSigns = p.authority.equals(p.buyer);
  return new TransactionInstruction({
    programId,
    keys: [
      buyerSigns ? w(p.authority, true) : r(p.authority, true),
      w(p.buyer, buyerSigns),
      w(escrowPda(programId, p.orderId)),
    ],
    data: Buffer.from([IX.refund]),
  });
}

/** Admin settles a dispute: `sellerShareBps` of the amount to the seller. */
export function resolveIx(
  programId: PublicKey,
  p: OrderParties & { admin: PublicKey; treasury: PublicKey; sellerShareBps: number },
) {
  return new TransactionInstruction({
    programId,
    keys: [
      r(p.admin, true),
      w(p.buyer),
      w(p.seller),
      w(p.treasury),
      r(configPda(programId)),
      w(escrowPda(programId, p.orderId)),
    ],
    data: concat(Uint8Array.of(IX.resolve), u16(p.sellerShareBps)),
  });
}

// ------------------------------------------------------ JSON transport

/** An instruction as the API hands it to clients (web app or agent). */
export type WireInstruction = {
  programId: string;
  keys: { pubkey: string; isSigner: boolean; isWritable: boolean }[];
  data: string; // base64
};

export function toWire(ix: TransactionInstruction): WireInstruction {
  return {
    programId: ix.programId.toBase58(),
    keys: ix.keys.map((k) => ({
      pubkey: k.pubkey.toBase58(),
      isSigner: k.isSigner,
      isWritable: k.isWritable,
    })),
    data: Buffer.from(ix.data).toString("base64"),
  };
}

export function fromWire(ix: WireInstruction): TransactionInstruction {
  return new TransactionInstruction({
    programId: new PublicKey(ix.programId),
    keys: ix.keys.map((k) => ({
      pubkey: new PublicKey(k.pubkey),
      isSigner: k.isSigner,
      isWritable: k.isWritable,
    })),
    data: Buffer.from(ix.data, "base64"),
  });
}

// --------------------------------------------------------------- decoding

export type ConfigAccount = {
  bump: number;
  paused: boolean;
  feeBps: number;
  admin: string;
  treasury: string;
};

type OrderCommon = {
  bump: number;
  orderId: string;
  buyer: string;
  seller: string;
  amount: bigint;
};

export type ReceiptAccount = OrderCommon & { kind: "receipt"; fee: bigint; paidAt: bigint };
export type EscrowAccount = OrderCommon & {
  kind: "escrow";
  /** Fee rate frozen when the escrow opened. */
  feeBps: number;
  deadline: bigint;
  openedAt: bigint;
};
export type OrderAccount = ReceiptAccount | EscrowAccount;

function view(data: Uint8Array) {
  return new DataView(data.buffer, data.byteOffset, data.byteLength);
}

export function decodeConfig(data: Uint8Array): ConfigAccount | null {
  if (data.length !== RECORD_LEN.config || data[0] !== TAG.config || data[1] !== 1) return null;
  const v = view(data);
  return {
    bump: data[2],
    paused: data[3] !== 0,
    feeBps: v.getUint16(4, true),
    admin: new PublicKey(data.subarray(8, 40)).toBase58(),
    treasury: new PublicKey(data.subarray(40, 72)).toBase58(),
  };
}

export function decodeOrder(data: Uint8Array): OrderAccount | null {
  if (data.length !== 112 || data[1] !== 1) return null;
  const v = view(data);
  const common: OrderCommon = {
    bump: data[2],
    orderId: uuidFromBytes(data.subarray(8, 24)),
    buyer: new PublicKey(data.subarray(24, 56)).toBase58(),
    seller: new PublicKey(data.subarray(56, 88)).toBase58(),
    amount: v.getBigUint64(88, true),
  };
  if (data[0] === TAG.receipt) {
    return { ...common, kind: "receipt", fee: v.getBigUint64(96, true), paidAt: v.getBigInt64(104, true) };
  }
  if (data[0] === TAG.escrow) {
    return {
      ...common,
      kind: "escrow",
      feeBps: v.getUint16(4, true),
      deadline: v.getBigInt64(96, true),
      openedAt: v.getBigInt64(104, true),
    };
  }
  return null;
}
