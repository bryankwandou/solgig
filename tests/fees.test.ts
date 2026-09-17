import { describe, it, expect } from "vitest";
import {
  splitAmount,
  orderSplit,
  platformFeeBps,
  toLamports,
  lamportsToNumber,
} from "../src/lib/fees";

const T = "TreasuryAddr1111111111111111111111111111111";

describe("splitAmount", () => {
  it("takes 2.5% and gives the seller the rest", () => {
    const s = splitAmount(400_000_000, { bps: 250n, treasury: T });
    expect(s).toEqual({ gross: 400_000_000n, fee: 10_000_000n, sellerNet: 390_000_000n });
  });

  it("accepts BIGINT columns that arrive as strings", () => {
    const s = splitAmount("400000000", { bps: 250n, treasury: T });
    expect(s.sellerNet).toBe(390_000_000n);
  });

  it("floors the fee and never loses a lamport", () => {
    const s = splitAmount(999, { bps: 250n, treasury: T });
    expect(s.fee).toBe(24n);
    expect(s.fee + s.sellerNet).toBe(999n);
  });

  it("charges nothing when no treasury is configured", () => {
    const s = splitAmount(1000, { bps: 250n, treasury: null });
    expect(s.fee).toBe(0n);
    expect(s.sellerNet).toBe(1000n);
  });

  it("rejects amounts that are not whole lamports", () => {
    expect(() => toLamports("1e9")).toThrow(RangeError);
    expect(() => toLamports(1.5)).toThrow(RangeError);
    expect(() => toLamports("-5")).toThrow(RangeError);
  });
});

describe("orderSplit", () => {
  it("uses the fee recorded on the order, not today's config", () => {
    const s = orderSplit({ amount_lamports: "1000", platform_fee_lamports: "100" });
    expect(s.sellerNet).toBe(900n);
  });

  it("treats a null fee as zero", () => {
    expect(orderSplit({ amount_lamports: 5, platform_fee_lamports: null }).sellerNet).toBe(5n);
  });

  it("refuses a fee larger than the amount", () => {
    expect(() => orderSplit({ amount_lamports: 5, platform_fee_lamports: 6 })).toThrow(RangeError);
  });
});

describe("platformFeeBps", () => {
  it("defaults to 250 and clamps to 10000", () => {
    expect(platformFeeBps(undefined)).toBe(250n);
    expect(platformFeeBps("abc")).toBe(250n);
    expect(platformFeeBps("-1")).toBe(250n);
    expect(platformFeeBps("300")).toBe(300n);
    expect(platformFeeBps("99999")).toBe(10_000n);
  });
});

describe("lamportsToNumber", () => {
  it("refuses values past 2^53", () => {
    expect(lamportsToNumber(5n)).toBe(5);
    expect(() => lamportsToNumber(2n ** 60n)).toThrow(RangeError);
  });
});
