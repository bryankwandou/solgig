"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth/useAuth";
import { CounterUp } from "@/components/motion";
import { formatSol, lamportsToSol } from "@/lib/utils";
import { useCopy } from "@/lib/i18n";

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
  const t = useCopy().pages;
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
    return <p className="text-sm text-[var(--text-mut)]">{t.common.loading}</p>;

  if (!user)
    return (
      <div className="rounded-[var(--radius-md)] border p-6" style={{ background: "var(--surface)" }}>
        <p className="text-sm">{t.dashboard.connect}</p>
        <p className="mt-1 text-sm text-[var(--text-mut)]">
          {t.dashboard.connectHint}
        </p>
      </div>
    );

  const earned = data ? Number(lamportsToSol(data.profile.total_earned_lamports)) : 0;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-display text-2xl font-bold">{t.dashboard.title}</h1>
        <Link
          href="/dashboard/new"
          className="rounded-full px-4 py-2 text-sm font-medium text-[var(--on-brand)]"
          style={{ background: "var(--brand-grad)" }}
        >
          {t.dashboard.newListing}
        </Link>
      </div>

      <div className="mt-6 grid grid-cols-3 gap-4">
        <Metric label={t.dashboard.earned} value={<><CounterUp to={earned} decimals={2} /> SOL</>} />
        <Metric label={t.dashboard.completed} value={<CounterUp to={data?.profile.completed_orders ?? 0} />} />
        <Metric label={t.dashboard.reputation} value={<CounterUp to={data?.profile.reputation_score ?? 0} />} />
      </div>

      <Section title={t.dashboard.products}>
        {data && data.products.length > 0 ? (
          <ul className="divide-y">
            {data.products.map((p) => (
              <li key={p.id} className="flex items-center justify-between py-3">
                <Link href={`/marketplace/${p.slug}`} className="text-sm hover:underline">
                  {p.title}
                </Link>
                <span className="text-sm text-[var(--text-mut)]">
                  {t.common.sold(p.total_purchases)} · {formatSol(p.price_lamports)}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <Empty>{t.dashboard.noProducts}</Empty>
        )}
      </Section>

      <Section title={t.dashboard.purchases}>
        {data && data.purchases.length > 0 ? (
          <ul className="divide-y">
            {data.purchases.map((o) => (
              <li key={o.order_number} className="flex items-center justify-between py-3">
                <span className="text-sm">
                  {o.product_title ?? t.dashboard.order}{" "}
                  <span className="font-mono text-xs text-[var(--text-mut)]">{o.order_number}</span>
                </span>
                <span className="text-sm text-[var(--text-mut)]">
                  {t.status[o.status] ?? o.status} · {formatSol(o.amount_lamports)}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <Empty>{t.dashboard.noPurchases}</Empty>
        )}
      </Section>

      <Section title={t.dashboard.sales}>
        {data && data.sales.length > 0 ? (
          <ul className="divide-y">
            {data.sales.map((o) => (
              <li key={o.order_number} className="flex items-center justify-between py-3">
                <span className="text-sm">{o.product_title ?? t.dashboard.order}</span>
                <span className="text-sm text-[var(--text-mut)]">
                  {t.status[o.status] ?? o.status} · {formatSol(o.amount_lamports)}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <Empty>{t.dashboard.noSales}</Empty>
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
