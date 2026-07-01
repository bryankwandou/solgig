import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Middle-truncate a wallet address: 7xKX...3fA */
export function shortAddress(addr: string, lead = 4, tail = 4) {
  if (addr.length <= lead + tail + 1) return addr;
  return `${addr.slice(0, lead)}…${addr.slice(-tail)}`;
}

/** Lamports to SOL with a sensible number of decimals. */
export function lamportsToSol(lamports: number, decimals = 3) {
  return (lamports / 1_000_000_000).toFixed(decimals);
}
