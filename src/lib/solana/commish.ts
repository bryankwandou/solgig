// Client for Commish (github.com/bryankwandou/commish), the on-chain affiliate
// commission program SolGig uses for referral links.
//
// A seller opens a campaign (a vault of wrapped SOL owned by a program
// account) and picks a rate. When an order that came through someone's
// referral link completes, this server, as the campaign's attestor, reserves
// the referrer's cut in its own account. After the refund window anyone can
// release it: the referrer gets the commission minus Commish's 1% fee.
//
// Layouts follow commish/program/src/lib.rs: an 8-byte header (tag in byte 0)
// then the #[repr(C)] arguments, little-endian.

import {
  Keypair,
  PublicKey,
  SystemProgram,
  TransactionInstruction,
  type AccountMeta,
} from "@solana/web3.js";
import bs58 from "bs58";
import { createHash, createHmac } from "node:crypto";

export const TOKEN_PROGRAM = new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA");
export const ATA_PROGRAM = new PublicKey("ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL");
/** Wrapped SOL: SolGig prices in SOL, so campaigns hold SOL as an SPL token. */
export const WSOL_MINT = new PublicKey("So11111111111111111111111111111111111111112");
/** Receives Commish's 1% fee; fixed in the program. */
export const COMMISH_TREASURY = new PublicKey("ETcQvsQek2w9feLfsqoe4AypCWfnrSwQiv3djqocaP2m");
export const COMMISH_FEE_BPS = 100n;

export const CAMPAIGN_LEN = 176;
export const COMMISSION_LEN = 184;
export const MAX_BPS = 5_000;
export const MAX_HOLD_SECONDS = 90 * 24 * 60 * 60;

export const COMMISH_ERRORS: Record<number, string> = {
  6004: "This server is not the campaign's attestor",
  6007: "Commission rate must be between 0.01% and 50%",
  6008: "Refund window must be between 0 and 90 days",
  6009: "Order is too small to earn a commission",
  6010: "The campaign budget is used up",
  6011: "The refund window has not closed yet",
  6012: "The refund window has already closed",
  6013: "Wrong payee",
};

/** The Commish deployment this server talks to, or null when referrals are off. */
export function commishProgramId(): PublicKey | null {
  const v = process.env.NEXT_PUBLIC_COMMISH_PROGRAM_ID;
  if (!v) return null;
  return new PublicKey(v);
}

/**
 * SolGig's attestor: signs record_sale and cancel, and pays the refundable
 * rent of each commission record (returned when it closes). Server only.
 */
export function attestorKeypair(): Keypair | null {
  const secret = process.env.COMMISH_ATTESTOR_SECRET_KEY;
  if (!secret) return null;
  try {
    return Keypair.fromSecretKey(bs58.decode(secret.trim()));
  } catch {
    throw new Error("COMMISH_ATTESTOR_SECRET_KEY is set but is not a valid base58 secret key");
  }
}

/** Referrals need both the program and the attestor key. */
export function commishEnabled(): { program: PublicKey; attestor: Keypair } | null {
  const program = commishProgramId();
  const attestor = program ? attestorKeypair() : null;
  return program && attestor ? { program, attestor } : null;
}

// ---------------------------------------------------------------- math

/** Commission for an order at `bps`, rounded down exactly like the program. */
export function commissionFor(orderLamports: bigint, bps: number): bigint {
  const b = BigInt(bps);
  return (orderLamports / 10_000n) * b + ((orderLamports % 10_000n) * b) / 10_000n;
}

/** What the payee receives at release: the commission minus the 1% fee. */
export function netOfFee(amount: bigint): bigint {
  return amount - amount / (10_000n / COMMISH_FEE_BPS);
}

// ------------------------------------------------------------- addresses

const u64 = (n: bigint) => {
  const b = Buffer.alloc(8);
  b.writeBigUInt64LE(n);
  return b;
};

export function findCampaign(program: PublicKey, brand: PublicKey, id: bigint) {
  return PublicKey.findProgramAddressSync([Buffer.from("campaign"), brand.toBuffer(), u64(id)], program);
}

export function findCommission(program: PublicKey, campaign: PublicKey, orderHash: Uint8Array) {
  return PublicKey.findProgramAddressSync([Buffer.from("commission"), campaign.toBuffer(), Buffer.from(orderHash)], program);
}

export function findAta(owner: PublicKey, mint: PublicKey = WSOL_MINT) {
  return PublicKey.findProgramAddressSync([owner.toBuffer(), TOKEN_PROGRAM.toBuffer(), mint.toBuffer()], ATA_PROGRAM)[0];
}

/**
 * The order's hash on chain, which also fixes the commission's address.
 * Keyed with a secret derived from the attestor key, so nobody can predict
 * the address of the next order's commission and squat on it first.
 */
export function orderHash(attestor: Keypair, campaign: PublicKey, orderId: string): Buffer {
  const key = createHash("sha256").update("solgig:commish:order-key:v1").update(attestor.secretKey).digest();
  return createHmac("sha256", key)
    .update(Buffer.concat([Buffer.from("commish:v1"), campaign.toBuffer(), Buffer.from(orderId)]))
    .digest();
}

// ------------------------------------------------------------- decoders

export type Campaign = {
  brand: string;
  attestor: string;
  mint: string;
  vault: string;
  id: bigint;
  holdSeconds: bigint;
  reserved: bigint;
  paid: bigint;
  bps: number;
};

export function decodeCampaign(data: Uint8Array): Campaign | null {
  if (data.length !== CAMPAIGN_LEN || data[0] !== 1) return null;
  const b = Buffer.from(data);
  const key = (o: number) => new PublicKey(b.subarray(o, o + 32)).toBase58();
  return {
    brand: key(8),
    attestor: key(40),
    mint: key(72),
    vault: key(104),
    id: b.readBigUInt64LE(136),
    holdSeconds: b.readBigInt64LE(144),
    reserved: b.readBigUInt64LE(152),
    paid: b.readBigUInt64LE(160),
    bps: b.readUInt16LE(168),
  };
}

export type Commission = {
  sold: boolean;
  creator: string;
  payee: string;
  rentPayer: string;
  amount: bigint;
  releaseAt: bigint;
};

export function decodeCommission(data: Uint8Array): Commission | null {
  if (data.length !== COMMISSION_LEN || data[0] !== 2) return null;
  const b = Buffer.from(data);
  const key = (o: number) => new PublicKey(b.subarray(o, o + 32)).toBase58();
  return {
    sold: (b[3] & 1) === 1,
    creator: key(40),
    payee: key(72),
    rentPayer: key(104),
    amount: b.readBigUInt64LE(168),
    releaseAt: b.readBigInt64LE(176),
  };
}

// ---------------------------------------------------------- instructions

const meta = (pubkey: PublicKey, isSigner: boolean, isWritable: boolean): AccountMeta => ({ pubkey, isSigner, isWritable });
const header = (tag: number) => {
  const b = Buffer.alloc(8);
  b[0] = tag;
  return b;
};

/** Associated token account, created only if missing. */
export function createAtaIx(payer: PublicKey, owner: PublicKey, mint: PublicKey = WSOL_MINT): TransactionInstruction {
  return new TransactionInstruction({
    programId: ATA_PROGRAM,
    keys: [
      meta(payer, true, true),
      meta(findAta(owner, mint), false, true),
      meta(owner, false, false),
      meta(mint, false, false),
      meta(SystemProgram.programId, false, false),
      meta(TOKEN_PROGRAM, false, false),
    ],
    data: Buffer.from([1]),
  });
}

/** Move `lamports` of SOL into a wrapped-SOL token account and sync its balance. */
export function wrapSolIxs(from: PublicKey, tokenAccount: PublicKey, lamports: bigint): TransactionInstruction[] {
  return [
    SystemProgram.transfer({ fromPubkey: from, toPubkey: tokenAccount, lamports }),
    new TransactionInstruction({ programId: TOKEN_PROGRAM, keys: [meta(tokenAccount, false, true)], data: Buffer.from([17]) }),
  ];
}

/** 0. Creates the campaign's vault (its wrapped-SOL ATA) and the campaign. */
export function createCampaignIxs(p: {
  program: PublicKey;
  brand: PublicKey;
  attestor: PublicKey;
  id: bigint;
  bps: number;
  holdSeconds: bigint;
  /** Rent-exempt minimum for CAMPAIGN_LEN bytes. */
  lamports: number;
}): { campaign: PublicKey; vault: PublicKey; instructions: TransactionInstruction[] } {
  const [campaign, bump] = findCampaign(p.program, p.brand, p.id);
  const vault = findAta(campaign);
  const args = Buffer.alloc(64);
  args.writeBigUInt64LE(p.id, 0);
  args.writeBigInt64LE(p.holdSeconds, 8);
  args.writeUInt16LE(p.bps, 16);
  args[18] = bump;
  args.writeBigUInt64LE(BigInt(p.lamports), 24);
  p.attestor.toBuffer().copy(args, 32);
  const ix = new TransactionInstruction({
    programId: p.program,
    keys: [
      meta(p.brand, true, true),
      meta(campaign, false, true),
      meta(vault, false, false),
      meta(WSOL_MINT, false, false),
      meta(SystemProgram.programId, false, false),
    ],
    data: Buffer.concat([header(0), args]),
  });
  return { campaign, vault, instructions: [createAtaIx(p.brand, campaign), ix] };
}

/** 1. The attestor reserves a referrer's commission for one order. */
export function recordSaleIx(p: {
  program: PublicKey;
  attestor: PublicKey;
  campaign: PublicKey;
  vault: PublicKey;
  orderHash: Uint8Array;
  orderLamports: bigint;
  creator: PublicKey;
  /** Rent-exempt minimum for COMMISSION_LEN bytes. */
  lamports: number;
}): { commission: PublicKey; instruction: TransactionInstruction } {
  const [commission, bump] = findCommission(p.program, p.campaign, p.orderHash);
  const args = Buffer.alloc(88);
  Buffer.from(p.orderHash).copy(args, 0);
  args.writeBigUInt64LE(p.orderLamports, 32);
  p.creator.toBuffer().copy(args, 40);
  args.writeBigUInt64LE(BigInt(p.lamports), 72);
  args[80] = bump;
  return {
    commission,
    instruction: new TransactionInstruction({
      programId: p.program,
      // The attestor is also the payer of the record's rent.
      keys: [
        meta(p.attestor, true, true),
        meta(p.attestor, true, true),
        meta(p.campaign, false, true),
        meta(p.vault, false, false),
        meta(commission, false, true),
        meta(SystemProgram.programId, false, false),
      ],
      data: Buffer.concat([header(1), args]),
    }),
  };
}

/** 2. A refund inside the window: the reservation goes back to the seller's budget. */
export function cancelIx(p: { program: PublicKey; attestor: PublicKey; campaign: PublicKey; commission: PublicKey; rentPayer: PublicKey }) {
  return new TransactionInstruction({
    programId: p.program,
    keys: [
      meta(p.attestor, true, p.attestor.equals(p.rentPayer)),
      meta(p.campaign, false, true),
      meta(p.commission, false, true),
      meta(p.rentPayer, false, true),
    ],
    data: header(2),
  });
}

/** 3. Permissionless after the window: pays the payee, minus 1% to the treasury. */
export function releaseIx(p: { program: PublicKey; campaign: PublicKey; vault: PublicKey; commission: PublicKey; payee: PublicKey; rentPayer: PublicKey }) {
  return new TransactionInstruction({
    programId: p.program,
    keys: [
      meta(p.campaign, false, true),
      meta(p.vault, false, true),
      meta(p.commission, false, true),
      meta(findAta(p.payee), false, true),
      meta(p.rentPayer, false, true),
      meta(TOKEN_PROGRAM, false, false),
      meta(findAta(COMMISH_TREASURY), false, true),
    ],
    data: header(3),
  });
}

/** 4. The seller takes back budget that no open commission has reserved. */
export function withdrawIx(p: { program: PublicKey; brand: PublicKey; campaign: PublicKey; vault: PublicKey; amount: bigint }) {
  return new TransactionInstruction({
    programId: p.program,
    keys: [
      meta(p.brand, true, false),
      meta(p.campaign, false, false),
      meta(p.vault, false, true),
      meta(findAta(p.brand), false, true),
      meta(TOKEN_PROGRAM, false, false),
    ],
    data: Buffer.concat([header(4), u64(p.amount)]),
  });
}

/** Custom program error code in a failed transaction's message, if any. */
export function commishErrorCode(e: unknown): number | null {
  const s = e instanceof Error ? `${e.message} ${JSON.stringify((e as { logs?: unknown }).logs ?? "")}` : String(e);
  const m = s.match(/"Custom":(\d+)/) ?? s.match(/custom program error: 0x([0-9a-f]+)/i);
  if (!m) return null;
  return m[0].includes("0x") ? parseInt(m[1], 16) : Number(m[1]);
}
