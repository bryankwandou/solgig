"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth/useAuth";
import { formatSol, shortAddress } from "@/lib/utils";
import { Reveal } from "@/components/motion";

type Order = {
  id: string;
  order_number: string;
  order_type: string;
  status: string;
  amount_lamports: number;
  payment_tx_signature: string | null;
  created_at: string;
  product_slug: string | null;
  product_title: string;
  has_file: boolean;
  seller_username: string | null;
  seller_name: string | null;
  seller_wallet: string;
};

export default function OrdersPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const net = process.env.NEXT_PUBLIC_SOLANA_NETWORK ?? "devnet";

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    fetch("/api/orders")
      .then((r) => r.json())
      .then((d) => setOrders(d.items ?? []))
      .finally(() => setLoading(false));
  }, [user]);

  async function download(orderId: string) {
    const res = await fetch(`/api/orders/${orderId}/download`);
    if (!res.ok) return;
    const d = await res.json();
    if (d.fileUrl) window.open(d.fileUrl, "_blank", "noreferrer");
  }

  async function markComplete(orderId: string) {
    const res = await fetch(`/api/orders/${orderId}/complete`, { method: "POST" });
    if (res.ok) {
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: "completed" } : o)),
      );
    }
  }

  if (!user) {
    return (
      <p className="text-sm text-[var(--text-mut)]">
        Connect a wallet to see what you have bought.
      </p>
    );
  }
  if (loading) return <p className="text-sm text-[var(--text-mut)]">Loading…</p>;

  return (
    <div>
      <h1 className="font-display text-2xl font-bold">Your orders</h1>
      <p className="mt-1 text-sm text-[var(--text-mut)]">
        Everything you have bought, with downloads that stay available here.
      </p>

      {orders.length === 0 ? (
        <p className="mt-8 text-sm text-[var(--text-mut)]">
          Nothing here yet.{" "}
          <Link href="/marketplace" className="underline">
            Browse the marketplace
          </Link>{" "}
          to find your first pick.
        </p>
      ) : (
        <div className="mt-6 space-y-3">
          {orders.map((o, i) => (
            <Reveal key={o.id} delay={i * 0.04}>
              <div
                className="flex flex-wrap items-center justify-between gap-4 rounded-[var(--radius-md)] border p-4"
                style={{ background: "var(--surface)" }}
              >
                <div className="min-w-0">
                  {o.product_slug ? (
                    <Link
                      href={`/marketplace/${o.product_slug}`}
                      className="block truncate text-sm font-semibold hover:underline"
                    >
                      {o.product_title}
                    </Link>
                  ) : (
                    <span className="block truncate text-sm font-semibold">
                      {o.product_title}
                    </span>
                  )}
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-[var(--text-mut)]">
                    <span className="font-mono">{o.order_number}</span>
                    <span>·</span>
                    <span>
                      from{" "}
                      {o.seller_name || o.seller_username || shortAddress(o.seller_wallet)}
                    </span>
                    <span>·</span>
                    <span>{new Date(o.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className="rounded-full border px-2.5 py-1 text-xs capitalize"
                    style={{
                      color: o.status === "completed" ? "var(--brand-mint)" : "var(--text-mut)",
                    }}
                  >
                    {o.status}
                  </span>
                  <span className="text-sm font-semibold">
                    {formatSol(o.amount_lamports)}
                  </span>
                  {o.status === "completed" && o.has_file && (
                    <button
                      onClick={() => download(o.id)}
                      className="rounded-full px-4 py-1.5 text-xs font-semibold text-black"
                      style={{ background: "var(--brand-grad)" }}
                    >
                      Download
                    </button>
                  )}
                  {o.order_type === "service" && o.status === "paid" && (
                    <button
                      onClick={() => markComplete(o.id)}
                      className="rounded-full px-4 py-1.5 text-xs font-semibold text-black"
                      style={{ background: "var(--brand-grad)" }}
                    >
                      Mark complete
                    </button>
                  )}
                  {o.payment_tx_signature && (
                    <a
                      href={`https://explorer.solana.com/tx/${o.payment_tx_signature}?cluster=${net}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-[var(--text-mut)] underline"
                    >
                      Tx
                    </a>
                  )}
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      )}
    </div>
  );
}
