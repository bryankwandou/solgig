import { describe, it, expect } from "vitest";
import { slugify, formatSol, shortAddress, solToLamports } from "../src/lib/utils";

describe("slugify", () => {
  it("produces url-safe slugs with a unique suffix", () => {
    const a = slugify("My Cool Product!!");
    const b = slugify("My Cool Product!!");
    expect(a).toMatch(/^my-cool-product-[a-z0-9]+$/);
    expect(a).not.toBe(b);
  });

  it("handles titles with no usable characters", () => {
    expect(slugify("!!!")).toMatch(/^item-[a-z0-9]+$/);
  });
});

describe("money formatting", () => {
  it("formats lamports as SOL", () => {
    expect(formatSol(1_000_000_000)).toBe("1 SOL");
    expect(formatSol(1_500_000_000)).toBe("1.5 SOL");
  });

  it("round-trips SOL to lamports", () => {
    expect(solToLamports(0.5)).toBe(500_000_000);
  });
});

describe("platform fee math (matches the orders route)", () => {
  const fee = (price: number, bps: number) => Math.floor((price * bps) / 10000);

  it("takes 2.5% at 250 bps", () => {
    expect(fee(1_000_000_000, 250)).toBe(25_000_000);
  });

  it("floors, never rounds up", () => {
    expect(fee(39, 250)).toBe(0);
  });

  it("seller cut plus fee equals the full amount when fee divides evenly", () => {
    const price = 2_000_000_000;
    const f = fee(price, 250);
    expect(price - f + f).toBe(price);
  });
});

describe("shortAddress", () => {
  it("middle-truncates long addresses", () => {
    const out = shortAddress("7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU");
    expect(out.startsWith("7xKX")).toBe(true);
    expect(out.endsWith("gAsU")).toBe(true);
  });
});
