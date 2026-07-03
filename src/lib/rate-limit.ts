import { NextRequest, NextResponse } from "next/server";

// Sliding-window limiter held in module memory. On serverless this is
// per-instance, so treat it as a coarse spam brake rather than a hard
// quota; swap the store for Redis when real quotas are needed.
const buckets = new Map<string, number[]>();
const MAX_TRACKED_KEYS = 10_000;

export function rateLimit(params: {
  req: NextRequest;
  key: string;
  limit: number;
  windowMs: number;
}): NextResponse | null {
  const ip =
    params.req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    params.req.headers.get("x-real-ip") ??
    "local";
  const bucketKey = `${params.key}:${ip}`;
  const now = Date.now();

  if (buckets.size > MAX_TRACKED_KEYS) buckets.clear();

  const hits = (buckets.get(bucketKey) ?? []).filter(
    (t) => now - t < params.windowMs,
  );
  if (hits.length >= params.limit) {
    return NextResponse.json(
      { error: { code: "rate_limited", message: "Too many requests. Give it a moment." } },
      { status: 429, headers: { "Retry-After": String(Math.ceil(params.windowMs / 1000)) } },
    );
  }
  hits.push(now);
  buckets.set(bucketKey, hits);
  return null;
}
