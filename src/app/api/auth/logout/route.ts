import { NextResponse } from "next/server";
import { clearSession, readSession } from "@/lib/auth/session";
import { revokeSessions } from "@/lib/auth/current-user";

export const runtime = "nodejs";

// POST /api/auth/logout — revoke server-side, then drop the cookie. Deleting
// the cookie alone left a copied token valid for the rest of its seven days.
export async function POST() {
  const session = await readSession();
  if (session) await revokeSessions(session);
  await clearSession();
  return NextResponse.json({ ok: true });
}
