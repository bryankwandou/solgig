import { NextRequest, NextResponse } from "next/server";

// Sliding-window limiter held in module memory. On serverless this is
// per-instance, so it is only the first brake; rate-limit-db.ts adds the
// shared Postgres quota for the endpoints that need one.
const buckets = new Map<string, number[]>();
const MAX_TRACKED_KEYS = 10_000;

export function clientIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "local"
  );
}

export function tooMany(windowMs: number): NextResponse {
  return NextResponse.json(
    { error: { code: "rate_limited", message: "Too many requests. Give it a moment." } },
    { status: 429, headers: { "Retry-After": String(Math.ceil(windowMs / 1000)) } },
  );
}

export function rateLimit(params: {
  req: NextRequest;
  key: string;
  limit: number;
  windowMs: number;
}): NextResponse | null {
  const bucketKey = `${params.key}:${clientIp(params.req)}`;
  const now = Date.now();

  if (buckets.size > MAX_TRACKED_KEYS) buckets.clear();

  const hits = (buckets.get(bucketKey) ?? []).filter(
    (t) => now - t < params.windowMs,
  );
  if (hits.length >= params.limit) {
    return tooMany(params.windowMs);
  }
  hits.push(now);
  buckets.set(bucketKey, hits);
  return null;
}
