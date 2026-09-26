import { NextResponse } from "next/server";
import { AGENT_SCHEMA } from "@/lib/agent-schema";

// GET /api/agent/schema — JSON Schema for the catalog, the 402 body, the
// X-PAYMENT header and the receipt.
export function GET() {
  return NextResponse.json(AGENT_SCHEMA, {
    headers: { "cache-control": "public, max-age=3600" },
  });
}
