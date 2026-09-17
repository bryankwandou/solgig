import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { clientIp, rateLimit, tooMany } from "@/lib/rate-limit";

/**
 * Two-stage limiter. The in-memory window stays the first brake (free, no
 * round trip). Requests it lets through are then counted in Postgres, which
 * is shared by every serverless instance, so the quota holds across
 * instances and cold starts. There is no Redis/Upstash configured in this
 * project, so Postgres is the shared store.
 *
 * Fixed window keyed by (key, ip, window start). If the database call fails
 * the request is allowed: the memory brake still applied, and an auth
 * endpoint that is down because its limiter is down helps nobody.
 */
export async function rateLimitDurable(params: {
  req: NextRequest;
  key: string;
  limit: number;
  windowMs: number;
}): Promise<NextResponse | null> {
  const local = rateLimit(params);
  if (local) return local;

  const bucket = `${params.key}:${clientIp(params.req)}`;
  const windowSec = Math.max(1, Math.ceil(params.windowMs / 1000));
  try {
    const rows = (await sql`
      INSERT INTO rate_limits (bucket, window_start, hits)
      VALUES (${bucket},
              to_timestamp(floor(extract(epoch FROM NOW()) / ${windowSec}) * ${windowSec}),
              1)
      ON CONFLICT (bucket, window_start)
      DO UPDATE SET hits = rate_limits.hits + 1
      RETURNING hits
    `) as { hits: number }[];
    // Sweep old windows now and then; the primary key keeps lookups cheap.
    if (Math.random() < 0.02) {
      await sql`DELETE FROM rate_limits WHERE window_start < NOW() - INTERVAL '1 hour'`;
    }
    if (Number(rows[0]?.hits ?? 0) > params.limit) return tooMany(params.windowMs);
  } catch (err) {
    console.error("rate_limits unavailable, memory limiter only:", (err as Error).message);
  }
  return null;
}
