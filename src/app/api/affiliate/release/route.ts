import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth/current-user";
import { apiError, unauthorized } from "@/lib/http";
import { rateLimit } from "@/lib/rate-limit";
import { releaseReferral } from "@/lib/referrals";

export const runtime = "nodejs";

// POST /api/affiliate/release — pay out a commission whose refund window has
// passed. Release is permissionless on chain and always pays the recorded
// payee, so any signed-in user may ask; the server pays the network fee.
export async function POST(req: NextRequest) {
  const limited = rateLimit({ req, key: "affiliate-release", limit: 10, windowMs: 60_000 });
  if (limited) return limited;
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  const parsed = z.object({ orderId: z.string().uuid() }).safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return apiError(422, "invalid", "Which order?");
  const r = await releaseReferral(parsed.data.orderId);
  if (!r.ok) return apiError(400, "not_released", r.reason);
  return NextResponse.json(r);
}
