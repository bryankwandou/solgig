// The one place that decides how a sale's lamports are split between the
// seller and the platform. Every route that prices an order, verifies a
// payment, pays out escrow or credits seller earnings goes through here, so a
// fix to the math cannot be applied in one route and missed in another (the
// way C1 was fixed in `confirm` but survived as C3 in `complete`).
//
// All math is BigInt: BIGINT columns arrive from the driver as strings, and
// string + number silently concatenates.

export type Lamports = bigint | number | string;

export type Split = {
  /** What the buyer pays in total. */
  gross: bigint;
  /** What the platform treasury receives. */
  fee: bigint;
  /** What actually reaches the seller: gross - fee. */
  sellerNet: bigint;
};

const DEFAULT_FEE_BPS = 250n;
const MAX_BPS = 10_000n;

export function toLamports(v: Lamports): bigint {
  if (typeof v === "bigint") return v;
  if (typeof v === "number") {
    if (!Number.isSafeInteger(v)) throw new RangeError(`not a lamport amount: ${v}`);
    return BigInt(v);
  }
  if (!/^\d+$/.test(v)) throw new RangeError(`not a lamport amount: ${v}`);
  return BigInt(v);
}

/** Platform fee in basis points from NEXT_PUBLIC_PLATFORM_FEE_BPS, clamped to 0..10000. */
export function platformFeeBps(env: string | undefined = process.env.NEXT_PUBLIC_PLATFORM_FEE_BPS): bigint {
  if (env === undefined || env.trim() === "" || !/^\d+$/.test(env.trim())) return DEFAULT_FEE_BPS;
  const bps = BigInt(env.trim());
  return bps > MAX_BPS ? MAX_BPS : bps;
}

export function treasuryAddress(): string | null {
  return process.env.NEXT_PUBLIC_PLATFORM_TREASURY || null;
}

/**
 * Split a price at order creation. No treasury configured means nowhere to
 * send a fee, so the fee is zero and the seller gets everything.
 */
export function splitAmount(
  amountLamports: Lamports,
  opts: { bps?: bigint; treasury?: string | null } = {},
): Split {
  const gross = toLamports(amountLamports);
  if (gross < 0n) throw new RangeError("negative amount");
  const treasury = opts.treasury === undefined ? treasuryAddress() : opts.treasury;
  const bps = opts.bps ?? platformFeeBps();
  const fee = treasury ? (gross * bps) / MAX_BPS : 0n; // BigInt division floors
  return { gross, fee, sellerNet: gross - fee };
}

/**
 * The split recorded on an existing order. The fee was fixed when the order
 * was created; later config changes must not re-price it.
 */
export function orderSplit(order: {
  amount_lamports: Lamports;
  platform_fee_lamports: Lamports | null;
}): Split {
  const gross = toLamports(order.amount_lamports);
  const fee = toLamports(order.platform_fee_lamports ?? 0);
  if (fee < 0n || fee > gross) throw new RangeError("fee outside 0..amount");
  return { gross, fee, sellerNet: gross - fee };
}

/** BigInt -> JSON-safe number. Lamport totals stay far below 2^53. */
export function lamportsToNumber(v: bigint): number {
  if (v > BigInt(Number.MAX_SAFE_INTEGER)) throw new RangeError("amount too large");
  return Number(v);
}
