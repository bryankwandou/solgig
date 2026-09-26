import { PublicKey, SystemProgram, TransactionInstruction } from "@solana/web3.js";

// USDC as a second way to pay. Listings are priced in lamports; a USDC
// price is a quote taken when the payment challenge is issued and locked
// into it, so the amount an agent is asked for is the amount verified.

export const USDC_DECIMALS = 6;

const USDC_MINTS: Record<string, string> = {
  "mainnet-beta": "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
  devnet: "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU",
};

export const TOKEN_PROGRAM_ID = new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA");
export const ASSOCIATED_TOKEN_PROGRAM_ID = new PublicKey(
  "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL",
);
const WSOL_MINT = "So11111111111111111111111111111111111111112";

/** The USDC mint for this deployment's network; USDC_MINT overrides it. */
export function usdcMint(
  network: string = process.env.NEXT_PUBLIC_SOLANA_NETWORK ?? "mainnet-beta",
): string {
  return process.env.USDC_MINT || USDC_MINTS[network] || USDC_MINTS["mainnet-beta"];
}

let cached: { usdPerSol: number; at: number } | null = null;

/**
 * USD per SOL. USDC_PER_SOL pins it (tests, devnet); otherwise the Jupiter
 * price API, cached for a minute. Null when no price is available, in which
 * case USDC is simply not offered.
 */
export async function usdPerSol(): Promise<number | null> {
  const pinned = Number(process.env.USDC_PER_SOL);
  if (Number.isFinite(pinned) && pinned > 0) return pinned;
  if (cached && Date.now() - cached.at < 60_000) return cached.usdPerSol;
  try {
    const res = await fetch(`https://lite-api.jup.ag/price/v3?ids=${WSOL_MINT}`, {
      signal: AbortSignal.timeout(2500),
    });
    if (!res.ok) return null;
    const body = (await res.json()) as Record<string, { usdPrice?: number }>;
    const price = Number(body[WSOL_MINT]?.usdPrice);
    if (!Number.isFinite(price) || price <= 0) return null;
    cached = { usdPerSol: price, at: Date.now() };
    return price;
  } catch {
    return null;
  }
}

/** Lamports -> micro-USDC at the given rate, rounded up to the cent. */
export function lamportsToMicroUsdc(lamports: bigint, rate: number): bigint {
  // Rate as micro-USDC per SOL, integer, so the rest stays exact.
  const microPerSol = BigInt(Math.round(rate * 10 ** USDC_DECIMALS));
  const micro = (lamports * microPerSol + 999_999_999n) / 1_000_000_000n;
  const cent = 10_000n;
  return ((micro + cent - 1n) / cent) * cent;
}

export function associatedTokenAddress(owner: PublicKey, mint: PublicKey): PublicKey {
  return PublicKey.findProgramAddressSync(
    [owner.toBuffer(), TOKEN_PROGRAM_ID.toBuffer(), mint.toBuffer()],
    ASSOCIATED_TOKEN_PROGRAM_ID,
  )[0];
}

/** CreateIdempotent: makes `owner`'s token account for `mint` if missing. */
export function createAtaIdempotentIx(payer: PublicKey, owner: PublicKey, mint: PublicKey) {
  return new TransactionInstruction({
    programId: ASSOCIATED_TOKEN_PROGRAM_ID,
    keys: [
      { pubkey: payer, isSigner: true, isWritable: true },
      { pubkey: associatedTokenAddress(owner, mint), isSigner: false, isWritable: true },
      { pubkey: owner, isSigner: false, isWritable: false },
      { pubkey: mint, isSigner: false, isWritable: false },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
    ],
    data: Buffer.from([1]),
  });
}

/** SPL TransferChecked from `from`'s token account to `to`'s. */
export function transferCheckedIx(
  from: PublicKey,
  to: PublicKey,
  mint: PublicKey,
  amount: bigint,
  decimals = USDC_DECIMALS,
) {
  const data = Buffer.alloc(10);
  data.writeUInt8(12, 0);
  data.writeBigUInt64LE(amount, 1);
  data.writeUInt8(decimals, 9);
  return new TransactionInstruction({
    programId: TOKEN_PROGRAM_ID,
    keys: [
      { pubkey: associatedTokenAddress(from, mint), isSigner: false, isWritable: true },
      { pubkey: mint, isSigner: false, isWritable: false },
      { pubkey: associatedTokenAddress(to, mint), isSigner: false, isWritable: true },
      { pubkey: from, isSigner: true, isWritable: false },
    ],
    data,
  });
}
