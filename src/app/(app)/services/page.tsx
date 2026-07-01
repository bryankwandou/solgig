"use client";

import { useEffect, useState } from "react";
import { Stagger, StaggerItem, HoverTilt } from "@/components/motion";
import { formatSol, shortAddress } from "@/lib/utils";

type Service = {
  id: string;
  slug: string;
  title: string;
  tags: string[];
  price_lamports: number;
  delivery_days: number;
  rating_average: number;
  rating_count: number;
  total_orders: number;
  seller_username: string | null;
  seller_name: string | null;
  seller_wallet: string;
};

export default function ServicesPage() {
  const [items, setItems] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/services")
      .then((r) => r.json())
      .then((d) => setItems(d.items ?? []))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <h1 className="font-display text-2xl font-bold">Services</h1>
      <p className="mt-1 text-sm text-[var(--text-mut)]">
        Book time with people who make things.
      </p>

      {loading && <p className="mt-8 text-sm text-[var(--text-mut)]">Loading…</p>}
      {!loading && items.length === 0 && (
        <p className="mt-8 text-sm text-[var(--text-mut)]">
          No services listed yet. Add one from your dashboard.
        </p>
      )}

      <Stagger className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((s) => (
          <StaggerItem key={s.id}>
            <HoverTilt>
              <div className="h-full rounded-[var(--radius-md)] border p-5" style={{ background: "var(--surface)" }}>
                <h3 className="font-medium">{s.title}</h3>
                <div className="mt-2 flex flex-wrap gap-1">
                  {s.tags.slice(0, 3).map((t) => (
                    <span key={t} className="rounded-full border px-2 py-0.5 text-xs text-[var(--text-mut)]">
                      {t}
                    </span>
                  ))}
                </div>
                <div className="mt-4 flex items-center justify-between text-sm">
                  <span className="text-[var(--text-mut)]">
                    {s.delivery_days} day delivery
                  </span>
                  <span className="font-medium text-grad">{formatSol(s.price_lamports)}</span>
                </div>
                <div className="mt-2 text-xs text-[var(--text-mut)]">
                  {s.seller_name || s.seller_username || shortAddress(s.seller_wallet)}
                </div>
              </div>
            </HoverTilt>
          </StaggerItem>
        ))}
      </Stagger>
    </div>
  );
}
