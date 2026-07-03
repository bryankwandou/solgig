import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { sql } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/current-user";
import { rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

const CreateReview = z.object({
  orderId: z.string().uuid(),
  rating: z.number().int().min(1).max(5),
  body: z.string().max(1000).optional(),
});

// POST /api/reviews — only the buyer of a completed order may review it.
export async function POST(req: NextRequest) {
  const limited = rateLimit({ req, key: "review", limit: 10, windowMs: 60_000 });
  if (limited) return limited;
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { error: { code: "unauthorized", message: "Connect a wallet first." } },
      { status: 401 },
    );
  }
  const parsed = CreateReview.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json(
      { error: { code: "invalid", message: "Pick a rating from one to five." } },
      { status: 422 },
    );
  }
  const { orderId, rating, body } = parsed.data;

  const rows = (await sql`
    SELECT id, buyer_id, seller_id, product_id, status
    FROM orders WHERE id = ${orderId}
  `) as {
    buyer_id: string;
    seller_id: string;
    product_id: string | null;
    status: string;
  }[];
  const order = rows[0];
  if (!order || order.buyer_id !== user.id || order.status !== "completed") {
    return NextResponse.json(
      { error: { code: "not_allowed", message: "You can only review an order you completed." } },
      { status: 403 },
    );
  }

  const inserted = await sql`
    INSERT INTO reviews (order_id, reviewer_id, reviewee_id, product_id, rating, body)
    VALUES (${orderId}, ${user.id}, ${order.seller_id}, ${order.product_id}, ${rating}, ${body ?? null})
    ON CONFLICT (order_id, reviewer_id) DO NOTHING
    RETURNING id
  `;
  if (inserted.length === 0) {
    // Already reviewed — nothing to recount, and no reputation to re-award.
    return NextResponse.json(
      { error: { code: "duplicate", message: "You already reviewed this order." } },
      { status: 409 },
    );
  }

  // Recompute the product rating aggregate from its reviews (service
  // orders carry no product, so there is nothing to recount for them).
  if (order.product_id) {
    await sql`
      UPDATE products p SET
        rating_count = sub.c,
        rating_average = sub.a
      FROM (
        SELECT product_id, COUNT(*)::int AS c, ROUND(AVG(rating)::numeric, 2) AS a
        FROM reviews WHERE product_id = ${order.product_id} GROUP BY product_id
      ) sub
      WHERE p.id = sub.product_id
    `;
  }
  // Mirror a simple reputation signal onto the seller.
  await sql`
    UPDATE users SET reputation_score = reputation_score + ${rating}
    WHERE id = ${order.seller_id}
  `;

  return NextResponse.json({ ok: true }, { status: 201 });
}
