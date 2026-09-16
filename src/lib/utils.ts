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

export const LAMPORTS_PER_SOL = 1_000_000_000;

export function solToLamports(sol: number) {
  return Math.round(sol * LAMPORTS_PER_SOL);
}

/** Turn a title into a url-safe slug with a short random suffix. */
export function slugify(title: string) {
  const base = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  const suffix = Math.random().toString(36).slice(2, 7);
  return `${base || "item"}-${suffix}`;
}

/** Format lamports as a SOL price string, trimming trailing zeros. */
export function formatSol(lamports: number) {
  const sol = lamports / LAMPORTS_PER_SOL;
  return `${parseFloat(sol.toFixed(4))} SOL`;
}

/**
 * True only for absolute http(s) URLs. `z.string().url()` also accepts
 * `javascript:` and `data:`, which become script when a stored link is
 * opened with window.open or rendered into an href.
 */
export function isHttpUrl(value: string) {
  try {
    const { protocol } = new URL(value);
    return protocol === "https:" || protocol === "http:";
  } catch {
    return false;
  }
}
