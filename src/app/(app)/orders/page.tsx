"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth/useAuth";
import { formatSol, shortAddress } from "@/lib/utils";
import { Reveal } from "@/components/motion";
import { useCopy } from "@/lib/i18n";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { PublicKey, Transaction } from "@solana/web3.js";
import { escrowProgramId, releaseIx } from "@/lib/solana/program";

type Order = {
  id: string;
  order_number: string;
  order_type: string;
  settlement: string;
  buyer_wallet: string;
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
  const t = useCopy().pages;
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const net = process.env.NEXT_PUBLIC_SOLANA_NETWORK ?? "devnet";
  const { publicKey, sendTransaction } = useWallet();
  const { connection } = useConnection();

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    fetch("/api/orders")
      .then((r) => r.json())
      .then((d) => setOrders(d.items ?? []))
      .catch(() => setNotice(t.orders.loadError))
      .finally(() => setLoading(false));
  }, [user]);

  async function download(orderId: string) {
    setBusy(orderId);
    setNotice(null);
    try {
      const res = await fetch(`/api/orders/${orderId}/download`);
      const d = await res.json().catch(() => ({}));
      if (d.fileUrl) window.open(d.fileUrl, "_blank", "noreferrer");
      else setNotice(d.error?.message ?? t.orders.downloadUnavailable);
    } finally {
      setBusy(null);
    }
  }

  /** Program escrow: the buyer signs Release; the server then checks the chain. */
  async function signRelease(o: Order): Promise<string | undefined> {
    const program = escrowProgramId();
    const treasury = process.env.NEXT_PUBLIC_PLATFORM_TREASURY;
    if (!program || !treasury || !publicKey) throw new Error(t.orders.connect);
    const tx = new Transaction().add(
      releaseIx(program, {
        orderId: o.id,
        buyer: new PublicKey(o.buyer_wallet),
        seller: new PublicKey(o.seller_wallet),
        treasury: new PublicKey(treasury),
      }),
    );
    const signature = await sendTransaction(tx, connection);
    const latest = await connection.getLatestBlockhash("confirmed");
    await connection.confirmTransaction({ signature, ...latest }, "confirmed");
    return signature;
  }

  async function markComplete(o: Order) {
    const orderId = o.id;
    setBusy(orderId);
    setNotice(null);
    try {
      const signature = o.settlement === "program" ? await signRelease(o) : undefined;
      const res = await fetch(`/api/orders/${orderId}/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(signature ? { signature } : {}),
      });
      const d = await res.json().catch(() => ({}));
      if (res.ok) {
        setOrders((prev) =>
          prev.map((o) => (o.id === orderId ? { ...o, status: d.status ?? "completed" } : o)),
        );
      }
      const message = d.message ?? d.error?.message;
      if (message) setNotice(message);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "";
      setNotice(msg || t.common.offline);
    } finally {
      setBusy(null);
    }
  }

  if (!user) {
    return (
      <p className="text-sm text-[var(--text-mut)]">
        {t.orders.connect}
      </p>
    );
  }
  if (loading) return <p className="text-sm text-[var(--text-mut)]">{t.common.loading}</p>;

  return (
    <div>
      <h1 className="font-display text-2xl font-bold">{t.orders.title}</h1>
      <p className="mt-1 text-sm text-[var(--text-mut)]">
        {t.orders.sub}
      </p>
      {notice && (
        <p role="status" className="mt-4 rounded-[var(--radius-sm)] border px-3 py-2 text-sm">
          {notice}
        </p>
      )}

      {orders.length === 0 ? (
        <p className="mt-8 text-sm text-[var(--text-mut)]">
          {t.orders.emptyBefore}{" "}
          <Link href="/marketplace" className="underline">
            {t.orders.browse}
          </Link>{" "}
          {t.orders.emptyAfter}
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
                      {t.orders.from}{" "}
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
                    {t.status[o.status] ?? o.status}
                  </span>
                  <span className="text-sm font-semibold">
                    {formatSol(Number(o.amount_lamports))}
                  </span>
                  {o.status === "completed" && o.has_file && (
                    <button
                      onClick={() => download(o.id)}
                      disabled={busy === o.id}
                      className="rounded-full px-4 py-1.5 text-xs font-semibold text-[var(--on-brand)] disabled:opacity-60"
                      style={{ background: "var(--brand-grad)" }}
                    >
                      {busy === o.id ? t.orders.opening : t.orders.download}
                    </button>
                  )}
                  {o.order_type === "service" &&
                    (o.status === "paid" || o.status === "releasing") && (
                    <button
                      onClick={() => markComplete(o)}
                      disabled={busy === o.id}
                      className="rounded-full px-4 py-1.5 text-xs font-semibold text-[var(--on-brand)] disabled:opacity-60"
                      style={{ background: "var(--brand-grad)" }}
                    >
                      {busy === o.id
                        ? t.orders.releasing
                        : o.status === "releasing"
                          ? t.orders.checkPayout
                          : t.orders.accept}
                    </button>
                  )}
                  {o.payment_tx_signature && (
                    <a
                      href={`https://explorer.solana.com/tx/${o.payment_tx_signature}?cluster=${net}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-[var(--text-mut)] underline"
                    >
                      {t.common.tx}
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
