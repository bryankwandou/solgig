"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { buildPaymentTx } from "@/lib/solana/paymentTx";
import { useAuth } from "@/lib/auth/useAuth";
import { formatSol, shortAddress } from "@/lib/utils";
import { ProgressRing } from "@/components/motion";
import Link from "next/link";
import { useCopy } from "@/lib/i18n";

type Product = {
  id: string;
  slug: string;
  title: string;
  description: string;
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
  seller_reputation: number;
};
type Related = {
  slug: string;
  title: string;
  thumbnail_url: string | null;
  price_lamports: number;
  seller_wallet: string;
};
type Review = {
  rating: number;
  body: string | null;
  reviewer_username: string | null;
  reviewer_name: string | null;
  created_at: string;
};

type BuyState =
  | { step: "idle" }
  | { step: "creating" }
  | { step: "paying" }
  | { step: "confirming" }
  | { step: "done"; orderId: string; signature: string }
  | { step: "error"; message: string };

export default function ProductPage() {
  const { slug } = useParams<{ slug: string }>();
  const t = useCopy().pages;
  const [product, setProduct] = useState<Product | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/products/${slug}`)
      .then((r) => r.json())
      .then((d) => {
        setProduct(d.product ?? null);
        setReviews(d.reviews ?? []);
      })
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) return <p className="text-sm text-[var(--text-mut)]">{t.common.loading}</p>;
  if (!product)
    return (
      <p className="text-sm text-[var(--text-mut)]">
        {t.product.notFound}
      </p>
    );

  return (
    <div className="grid gap-8 lg:grid-cols-[1.4fr_1fr]">
      <div>
        {product.thumbnail_url ? (
          <img
            src={product.thumbnail_url}
            alt={product.title}
            className="h-56 w-full rounded-[var(--radius-lg)] object-cover"
          />
        ) : (
          <div
            className="grid h-56 place-items-center rounded-[var(--radius-lg)] text-5xl font-bold text-[var(--on-brand)]"
            style={{ background: "var(--brand-grad)" }}
          >
            {product.title.slice(0, 1).toUpperCase()}
          </div>
        )}
        <h1 className="font-display mt-6 text-3xl font-bold">{product.title}</h1>
        <div className="mt-2 flex items-center gap-3 text-sm text-[var(--text-mut)]">
          <span>
            {t.product.by} {product.seller_name || product.seller_username || shortAddress(product.seller_wallet)}
          </span>
          <span>·</span>
          <span>{t.common.sold(product.total_purchases)}</span>
          {product.rating_count > 0 && (
            <>
              <span>·</span>
              <span>
                {Number(product.rating_average).toFixed(1)} ({product.rating_count})
              </span>
            </>
          )}
        </div>
        <p className="mt-6 whitespace-pre-wrap text-sm leading-relaxed text-[var(--text-mut)]">
          {product.description || t.product.noDescription}
        </p>

        <h2 className="font-display mt-10 text-lg font-semibold">{t.product.reviews}</h2>
        {reviews.length === 0 ? (
          <p className="mt-2 text-sm text-[var(--text-mut)]">
            {t.product.noReviews}
          </p>
        ) : (
          <div className="mt-4 space-y-3">
            {reviews.map((r, i) => (
              <div key={i} className="rounded-[var(--radius-sm)] border p-3" style={{ background: "var(--surface)" }}>
                <div className="text-sm font-medium">
                  {"★".repeat(r.rating)}
                  <span className="text-[var(--border)]">{"★".repeat(5 - r.rating)}</span>
                </div>
                {r.body && <p className="mt-1 text-sm text-[var(--text-mut)]">{r.body}</p>}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="lg:sticky lg:top-24 lg:self-start">
        <BuyPanel product={product} />
      </div>

      <RelatedListings product={product} />
    </div>
  );
}

// Fills the space under the fold: same-seller listings first, then others.
function RelatedListings({ product }: { product: Product }) {
  const t = useCopy().pages;
  const [items, setItems] = useState<Related[]>([]);

  useEffect(() => {
    fetch("/api/products")
      .then((r) => r.json())
      .then((d: { items?: Related[] }) => setItems((d.items ?? []).filter((p) => p.slug !== product.slug)))
      .catch(() => setItems([]));
  }, [product.slug]);

  const same = items.filter((p) => p.seller_wallet === product.seller_wallet);
  const list = (same.length ? same : items).slice(0, 3);
  if (!list.length) return null;

  return (
    <section className="lg:col-span-2">
      <h2 className="font-display text-lg font-semibold">
        {same.length ? t.product.moreFrom : t.product.moreOn}
      </h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        {list.map((p) => (
          <Link
            key={p.slug}
            href={`/marketplace/${p.slug}`}
            className="group rounded-[var(--radius-md)] border p-3 transition-colors hover:border-[var(--brand-mint)]"
            style={{ background: "var(--surface)" }}
          >
            {p.thumbnail_url ? (
              <img src={p.thumbnail_url} alt="" className="h-28 w-full rounded-[var(--radius-sm)] object-cover" />
            ) : (
              <div
                className="grid h-28 place-items-center rounded-[var(--radius-sm)] text-2xl font-bold text-[var(--on-brand)]"
                style={{ background: "var(--brand-grad)" }}
              >
                {p.title.slice(0, 1).toUpperCase()}
              </div>
            )}
            <div className="mt-3 line-clamp-1 text-sm font-medium">{p.title}</div>
            <div className="mt-1 text-sm text-[var(--text-mut)]">{formatSol(p.price_lamports)}</div>
          </Link>
        ))}
      </div>
    </section>
  );
}

function BuyPanel({ product }: { product: Product }) {
  const { user } = useAuth();
  const { publicKey, sendTransaction } = useWallet();
  const { connection } = useConnection();
  const [state, setState] = useState<BuyState>({ step: "idle" });
  const t = useCopy().pages;

  const isOwn = user?.wallet_address === product.seller_wallet;

  async function buy() {
    if (!publicKey || !user) {
      setState({ step: "error", message: t.product.connectToBuy });
      return;
    }
    try {
      setState({ step: "creating" });
      const created = await fetch("/api/orders", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ productId: product.id }),
      }).then((r) => r.json());
      if (created.error) throw new Error(created.error.message);

      const { order, payment } = created;
      // Seller share plus platform fee, exactly as the server listed them.
      const tx = buildPaymentTx(publicKey, payment);

      setState({ step: "paying" });
      const signature = await sendTransaction(tx, connection);

      setState({ step: "confirming" });
      const latest = await connection.getLatestBlockhash("confirmed");
      await connection.confirmTransaction(
        { signature, ...latest },
        "confirmed",
      );

      const confirmed = await fetch(`/api/orders/${order.id}/confirm`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ signature }),
      }).then((r) => r.json());
      if (confirmed.error) throw new Error(confirmed.error.message);

      setState({ step: "done", orderId: order.id, signature });
    } catch (e) {
      setState({
        step: "error",
        message: e instanceof Error ? e.message : t.product.failed,
      });
    }
  }

  const buyDisabled =
    isOwn || !user || ["creating", "paying", "confirming"].includes(state.step);

  return (
    <div className="rounded-[var(--radius-md)] border p-6" style={{ background: "var(--surface)" }}>
      <div className="font-display text-3xl font-bold text-grad">
        {formatSol(product.price_lamports)}
      </div>
      <p className="mt-2 text-xs text-[var(--text-mut)]">
        {t.product.paidNote}
      </p>

      {state.step === "done" ? (
        <Success orderId={state.orderId} signature={state.signature} />
      ) : (
        <>
          <button
            onClick={buy}
            disabled={buyDisabled}
            // A dimmed gradient left dark text unreadable; disabled gets a
            // neutral surface with light text instead.
            className="mt-5 w-full rounded-full px-5 py-3 text-sm font-semibold disabled:cursor-not-allowed"
            style={
              buyDisabled
                ? { background: "var(--border)", color: "var(--text)" }
                : { background: "var(--brand-grad)", color: "var(--on-brand)" }
            }
          >
            {isOwn
              ? t.product.own
              : state.step === "creating"
                ? t.common.opening
                : state.step === "paying"
                  ? t.common.approve
                  : state.step === "confirming"
                    ? t.common.confirming
                    : t.product.buyFor(formatSol(product.price_lamports))}
          </button>
          {!user && (
            <p className="mt-3 text-xs text-[var(--text-mut)]">
              {t.common.connectTopBar}
            </p>
          )}
          {["creating", "paying", "confirming"].includes(state.step) && (
            <div className="mt-4 grid place-items-center">
              <ProgressRing progress={state.step === "confirming" ? 0.85 : 0.4} size={48} />
            </div>
          )}
          {state.step === "error" && (
            <p className="mt-3 text-xs" style={{ color: "var(--err)" }}>
              {state.message}
            </p>
          )}
        </>
      )}
    </div>
  );
}

function Success({
  orderId,
  signature,
}: {
  orderId: string;
  signature: string;
}) {
  const t = useCopy().pages;
  const [rating, setRating] = useState(0);
  const [body, setBody] = useState("");
  const [sent, setSent] = useState(false);
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const net = process.env.NEXT_PUBLIC_SOLANA_NETWORK ?? "devnet";

  // The file link comes from the entitlement-checked endpoint, so only
  // a buyer with a completed order ever sees it.
  useEffect(() => {
    fetch(`/api/orders/${orderId}/download`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setFileUrl(d?.fileUrl ?? null))
      .catch(() => {});
  }, [orderId]);

  async function review() {
    if (!rating) return;
    const res = await fetch("/api/reviews", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ orderId, rating, body }),
    });
    if (res.ok) setSent(true);
  }

  return (
    <div className="mt-5">
      <div
        className="rounded-[var(--radius-sm)] border p-3 text-sm"
        style={{ background: "var(--surface-2)" }}
      >
        {t.product.done}
      </div>
      {fileUrl && (
        <a
          href={fileUrl}
          target="_blank"
          rel="noreferrer"
          className="mt-3 block rounded-full px-5 py-3 text-center text-sm font-semibold text-[var(--on-brand)]"
          style={{ background: "var(--brand-grad)" }}
        >
          {t.product.download}
        </a>
      )}
      <a
        href={`https://explorer.solana.com/tx/${signature}?cluster=${net}`}
        target="_blank"
        rel="noreferrer"
        className="mt-3 block text-center font-mono text-xs text-[var(--text-mut)] underline"
      >
        {t.common.viewTx}
      </a>

      {!sent ? (
        <div className="mt-5 border-t pt-4">
          <p className="text-sm font-medium">{t.product.leaveReview}</p>
          <div className="mt-2 flex gap-1 text-lg">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                onClick={() => setRating(n)}
                aria-label={`/5`}
                aria-pressed={n <= rating}
                style={{ color: n <= rating ? "var(--brand-mint)" : "var(--border)" }}
              >
                ★
              </button>
            ))}
          </div>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={2}
            placeholder={t.product.howWas}
            className="mt-2 w-full resize-none rounded-[var(--radius-sm)] border bg-transparent p-2 text-sm outline-none"
          />
          <button
            onClick={review}
            disabled={!rating}
            className="mt-2 w-full rounded-full border px-4 py-2 text-sm disabled:opacity-40"
          >
            {t.product.submitReview}
          </button>
        </div>
      ) : (
        <p className="mt-4 text-sm text-[var(--text-mut)]">{t.product.thanks}</p>
      )}
    </div>
  );
}
