import { NextResponse } from "next/server";

// Every primary key in db/schema.sql is `UUID DEFAULT gen_random_uuid()`.
// Postgres raises on a malformed UUID literal, which used to surface as a 500.
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isUuid(v: unknown): v is string {
  return typeof v === "string" && UUID_RE.test(v);
}

export function apiError(status: number, code: string, message: string) {
  return NextResponse.json({ error: { code, message } }, { status });
}

export const unauthorized = () => apiError(401, "unauthorized", "Connect a wallet first.");

/**
 * Resolve a dynamic route's UUID segment. A malformed id cannot name any row,
 * so it is answered as 404, not passed to Postgres.
 */
export async function readUuidParam<K extends string>(
  params: Promise<Record<K, string>>,
  key: K,
  notFoundMessage = "Not found.",
): Promise<{ id: string; error?: undefined } | { id?: undefined; error: NextResponse }> {
  const value = (await params)[key];
  if (!isUuid(value)) return { error: apiError(404, "not_found", notFoundMessage) };
  return { id: value.toLowerCase() };
}
