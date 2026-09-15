"use client";

import { useEffect, useState } from "react";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { buildPaymentTx } from "@/lib/solana/paymentTx";
import { useAuth } from "@/lib/auth/useAuth";
import { Stagger, StaggerItem, HoverTilt } from "@/components/motion";
import { formatSol, shortAddress } from "@/lib/utils";
import { useCopy } from "@/lib/i18n";

type Service = {
  id: string;
  slug: string;
  title: string;
  thumbnail_url: string | null;
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
  const t = useCopy().pages;
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
      <h1 className="font-display text-2xl font-bold">{t.services.title}</h1>
      <p className="mt-1 text-sm text-[var(--text-mut)]">
        {t.services.sub}
      </p>

      {loading && <p className="mt-8 text-sm text-[var(--text-mut)]">{t.common.loading}</p>}
      {!loading && items.length === 0 && (
        <p className="mt-8 text-sm text-[var(--text-mut)]">
          {t.services.empty}
        </p>
      )}

      <Stagger className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((s) => (
          <StaggerItem key={s.id}>
            <HoverTilt>
              <div className="flex h-full flex-col rounded-[var(--radius-md)] border p-5" style={{ background: "var(--surface)" }}>
                {s.thumbnail_url ? (
                  <img
                    src={s.thumbnail_url}
                    alt={s.title}
                    className="mb-4 h-32 w-full rounded-[var(--radius-sm)] object-cover"
                  />
                ) : (
                  <div
                    className="mb-4 grid h-32 place-items-center rounded-[var(--radius-sm)] text-2xl font-bold text-black"
                    style={{ background: "var(--brand-grad)" }}
                  >
                    {s.title.slice(0, 1).toUpperCase()}
                  </div>
                )}
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
                    {t.common.delivery(s.delivery_days)}
                  </span>
                  <span className="font-medium text-grad">{formatSol(s.price_lamports)}</span>
                </div>
                <div className="mt-2 text-xs text-[var(--text-mut)]">
                  {s.seller_name || s.seller_username || shortAddress(s.seller_wallet)}
                </div>
                <div className="mt-4 flex-1" />
                <BookButton service={s} />
              </div>
            </HoverTilt>
          </StaggerItem>
        ))}
      </Stagger>
    </div>
  );
}

type BookState =
  | { step: "idle" }
  | { step: "creating" }
  | { step: "paying" }
  | { step: "confirming" }
  | { step: "done" }
  | { step: "error"; message: string };

function BookButton({ service }: { service: Service }) {
  const { user } = useAuth();
  const { publicKey, sendTransaction } = useWallet();
  const { connection } = useConnection();
  const [state, setState] = useState<BookState>({ step: "idle" });
  const t = useCopy().pages;

  const isOwn = user?.wallet_address === service.seller_wallet;

  async function book() {
    if (!publicKey || !user) {
      setState({ step: "error", message: t.services.connect });
      return;
    }
    try {
      setState({ step: "creating" });
      const created = await fetch("/api/orders", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ serviceId: service.id }),
      }).then((r) => r.json());
      if (created.error) throw new Error(created.error.message);

      const { order, payment } = created;
      // The server lists every transfer; escrow orders have a single one.
      const tx = buildPaymentTx(publicKey, payment);

      setState({ step: "paying" });
      const signature = await sendTransaction(tx, connection);

      setState({ step: "confirming" });
      const latest = await connection.getLatestBlockhash("confirmed");
      await connection.confirmTransaction({ signature, ...latest }, "confirmed");

      const confirmed = await fetch(`/api/orders/${order.id}/confirm`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ signature }),
      }).then((r) => r.json());
      if (confirmed.error) throw new Error(confirmed.error.message);

      setState({ step: "done" });
    } catch (e) {
      setState({
        step: "error",
        message: e instanceof Error ? e.message : t.services.failed,
      });
    }
  }

  if (state.step === "done") {
    return (
      <p className="mt-4 text-xs" style={{ color: "var(--brand-mint)" }}>
        {t.services.booked}
      </p>
    );
  }

  return (
    <div className="mt-4">
      <button
        onClick={book}
        disabled={
          isOwn || !user || ["creating", "paying", "confirming"].includes(state.step)
        }
        className="w-full rounded-full px-4 py-2 text-sm font-semibold text-black disabled:opacity-40"
        style={{ background: "var(--brand-grad)" }}
      >
        {isOwn
          ? t.services.own
          : state.step === "creating"
            ? t.common.opening
            : state.step === "paying"
              ? t.common.approve
              : state.step === "confirming"
                ? t.common.confirming
                : t.services.bookFor(formatSol(service.price_lamports))}
      </button>
      {state.step === "error" && (
        <p className="mt-2 text-xs" style={{ color: "var(--err)" }}>
          {state.message}
        </p>
      )}
    </div>
  );
}
