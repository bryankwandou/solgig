import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/current-user";

export const runtime = "nodejs";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { error: { code: "unauthorized", message: "Connect a wallet first." } },
      { status: 401 },
    );
  }

  const [profile] = (await sql`
    SELECT total_earned_lamports, completed_orders, reputation_score
    FROM users WHERE id = ${user.id}
  `) as { total_earned_lamports: number; completed_orders: number; reputation_score: number }[];

  const products = await sql`
    SELECT id, slug, title, price_lamports, total_purchases, rating_average, is_published
    FROM products WHERE seller_id = ${user.id} ORDER BY created_at DESC
  `;
  const services = await sql`
    SELECT id, slug, title, price_lamports, total_orders, is_published
    FROM services WHERE seller_id = ${user.id} ORDER BY created_at DESC
  `;
  const sales = await sql`
    SELECT o.order_number, o.amount_lamports, o.status, o.created_at,
           p.title AS product_title
    FROM orders o LEFT JOIN products p ON p.id = o.product_id
    WHERE o.seller_id = ${user.id} ORDER BY o.created_at DESC LIMIT 20
  `;
  const purchases = await sql`
    SELECT o.id, o.order_number, o.amount_lamports, o.status, o.created_at,
           o.payment_tx_signature, p.title AS product_title, p.slug AS product_slug
    FROM orders o LEFT JOIN products p ON p.id = o.product_id
    WHERE o.buyer_id = ${user.id} ORDER BY o.created_at DESC LIMIT 20
  `;

  return NextResponse.json({ profile, products, services, sales, purchases });
}
