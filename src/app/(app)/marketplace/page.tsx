"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Stagger, StaggerItem, HoverTilt } from "@/components/motion";
import { formatSol, shortAddress } from "@/lib/utils";

type Product = {
  id: string;
  slug: string;
  title: string;
  short_description: string | null;
  thumbnail_url: string | null;
  product_type: string;
  tags: string[];
  price_lamports: number;
  total_purchases: number;
  rating_average: number;
  rating_count: number;
  seller_username: string | null;
  seller_name: string | null;
  seller_wallet: string;
};

export default function MarketplacePage() {
  const [items, setItems] = useState<Product[]>([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => {
      setLoading(true);
      fetch(`/api/products?q=${encodeURIComponent(q)}`)
        .then((r) => r.json())
        .then((d) => setItems(d.items ?? []))
        .finally(() => setLoading(false));
    }, 250);
    return () => clearTimeout(t);
  }, [q]);

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold">Marketplace</h1>
          <p className="mt-1 text-sm text-[var(--text-mut)]">
            Digital goods from creators on Solana.
          </p>
        </div>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search listings"
          className="rounded-full border bg-transparent px-4 py-2 text-sm outline-none"
        />
      </div>

      {loading && <p className="mt-8 text-sm text-[var(--text-mut)]">Loading…</p>}
      {!loading && items.length === 0 && (
        <p className="mt-8 text-sm text-[var(--text-mut)]">
          Nothing here yet. List the first item from your dashboard and it lands at the top.
        </p>
      )}

      <Stagger className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((p) => (
          <StaggerItem key={p.id}>
            <HoverTilt>
              <Link href={`/marketplace/${p.slug}`}>
                <div className="h-full rounded-[var(--radius-md)] border p-5" style={{ background: "var(--surface)" }}>
                  <div
                    className="mb-4 grid h-32 place-items-center rounded-[var(--radius-sm)] text-2xl font-bold text-black"
                    style={{ background: "var(--brand-grad)" }}
                  >
                    {p.title.slice(0, 1).toUpperCase()}
                  </div>
                  <div className="text-xs uppercase tracking-wide text-[var(--text-mut)]">
                    {p.product_type}
                  </div>
                  <h3 className="mt-1 font-medium">{p.title}</h3>
                  <p className="mt-1 line-clamp-2 text-sm text-[var(--text-mut)]">
                    {p.short_description}
                  </p>
                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-xs text-[var(--text-mut)]">
                      {p.seller_name || p.seller_username || shortAddress(p.seller_wallet)}
                    </span>
                    <span className="font-medium text-grad">{formatSol(p.price_lamports)}</span>
                  </div>
                </div>
              </Link>
            </HoverTilt>
          </StaggerItem>
        ))}
      </Stagger>
    </div>
  );
}
