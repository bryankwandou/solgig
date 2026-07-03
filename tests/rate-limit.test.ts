import { describe, it, expect } from "vitest";
import { NextRequest } from "next/server";
import { rateLimit } from "../src/lib/rate-limit";

function makeReq(ip: string) {
  return new NextRequest("http://localhost/api/test", {
    headers: { "x-forwarded-for": ip },
  });
}

describe("rateLimit", () => {
  it("allows requests under the limit and blocks the overflow", () => {
    const key = `t-${Math.random()}`;
    for (let i = 0; i < 5; i++) {
      expect(
        rateLimit({ req: makeReq("1.2.3.4"), key, limit: 5, windowMs: 60_000 }),
      ).toBeNull();
    }
    const blocked = rateLimit({
      req: makeReq("1.2.3.4"),
      key,
      limit: 5,
      windowMs: 60_000,
    });
    expect(blocked?.status).toBe(429);
  });

  it("tracks different IPs separately", () => {
    const key = `t-${Math.random()}`;
    for (let i = 0; i < 3; i++) {
      rateLimit({ req: makeReq("5.5.5.5"), key, limit: 3, windowMs: 60_000 });
    }
    expect(
      rateLimit({ req: makeReq("6.6.6.6"), key, limit: 3, windowMs: 60_000 }),
    ).toBeNull();
  });
});
