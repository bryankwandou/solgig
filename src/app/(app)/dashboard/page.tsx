"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth/useAuth";
import { CounterUp } from "@/components/motion";
import { formatSol, lamportsToSol } from "@/lib/utils";

type Dash = {
  profile: {
    total_earned_lamports: number;
    completed_orders: number;
    reputation_score: number;
  };
  products: {
    id: string;
    slug: string;
    title: string;
    price_lamports: number;
    total_purchases: number;
    is_published: boolean;
  }[];
  services: { id: string; title: string; price_lamports: number }[];
  sales: {
    order_number: string;
    amount_lamports: number;
    status: string;
    product_title: string | null;
  }[];
  purchases: {
    order_number: string;
    amount_lamports: number;
    status: string;
    product_title: string | null;
    product_slug: string | null;
    payment_tx_signature: string | null;
  }[];
};

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const [data, setData] = useState<Dash | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    fetch("/api/dashboard")
      .then((r) => r.json())
      .then((d) => setData(d.error ? null : d))
      .finally(() => setLoading(false));
  }, [user]);

  if (authLoading || loading)
    return <p className="text-sm text-[var(--text-mut)]">Loading…</p>;

  if (!user)
    return (
      <div className="rounded-[var(--radius-md)] border p-6" style={{ background: "var(--surface)" }}>
        <p className="text-sm">Connect a wallet to see your dashboard.</p>
        <p className="mt-1 text-sm text-[var(--text-mut)]">
          Use the button in the top bar. You will sign a short message to prove the wallet is yours.
        </p>
      </div>
    );

  const earned = data ? Number(lamportsToSol(data.profile.total_earned_lamports)) : 0;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-display text-2xl font-bold">Dashboard</h1>
        <Link
          href="/dashboard/new"
          className="rounded-full px-4 py-2 text-sm font-medium text-black"
          style={{ background: "var(--brand-grad)" }}
        >
          New listing
        </Link>
      </div>

      <div className="mt-6 grid grid-cols-3 gap-4">
        <Metric label="Earned" value={<><CounterUp to={earned} decimals={2} /> SOL</>} />
        <Metric label="Completed orders" value={<CounterUp to={data?.profile.completed_orders ?? 0} />} />
        <Metric label="Reputation" value={<CounterUp to={data?.profile.reputation_score ?? 0} />} />
      </div>

      <Section title="Your products">
        {data && data.products.length > 0 ? (
          <ul className="divide-y">
            {data.products.map((p) => (
              <li key={p.id} className="flex items-center justify-between py-3">
                <Link href={`/marketplace/${p.slug}`} className="text-sm hover:underline">
                  {p.title}
                </Link>
                <span className="text-sm text-[var(--text-mut)]">
                  {p.total_purchases} sold · {formatSol(p.price_lamports)}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <Empty>No products yet. Create one to start selling.</Empty>
        )}
      </Section>

      <Section title="Your purchases">
        {data && data.purchases.length > 0 ? (
          <ul className="divide-y">
            {data.purchases.map((o) => (
              <li key={o.order_number} className="flex items-center justify-between py-3">
                <span className="text-sm">
                  {o.product_title ?? "Order"}{" "}
                  <span className="font-mono text-xs text-[var(--text-mut)]">{o.order_number}</span>
                </span>
                <span className="text-sm text-[var(--text-mut)]">
                  {o.status} · {formatSol(o.amount_lamports)}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <Empty>No purchases yet.</Empty>
        )}
      </Section>

      <Section title="Recent sales">
        {data && data.sales.length > 0 ? (
          <ul className="divide-y">
            {data.sales.map((o) => (
              <li key={o.order_number} className="flex items-center justify-between py-3">
                <span className="text-sm">{o.product_title ?? "Order"}</span>
                <span className="text-sm text-[var(--text-mut)]">
                  {o.status} · {formatSol(o.amount_lamports)}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <Empty>No sales yet. Share a listing in the feed to get the first one.</Empty>
        )}
      </Section>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-[var(--radius-md)] border p-5" style={{ background: "var(--surface)" }}>
      <div className="font-display text-2xl font-bold text-grad">{value}</div>
      <div className="mt-1 text-xs text-[var(--text-mut)]">{label}</div>
    </div>
  );
}
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-8">
      <h2 className="font-display text-lg font-semibold">{title}</h2>
      <div className="mt-3 rounded-[var(--radius-md)] border px-5" style={{ background: "var(--surface)" }}>
        {children}
      </div>
    </section>
  );
}
function Empty({ children }: { children: React.ReactNode }) {
  return <p className="py-5 text-sm text-[var(--text-mut)]">{children}</p>;
}
