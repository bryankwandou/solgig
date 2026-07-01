"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import {
  PublicKey,
  SystemProgram,
  Transaction,
} from "@solana/web3.js";
import { useAuth } from "@/lib/auth/useAuth";
import { formatSol, shortAddress } from "@/lib/utils";
import { Reveal, ProgressRing } from "@/components/motion";

type Product = {
  id: string;
  slug: string;
  title: string;
  description: string;
  product_type: string;
  tags: string[];
  price_lamports: number;
  total_purchases: number;
  rating_average: number;
  rating_count: number;
  file_url: string | null;
  seller_username: string | null;
  seller_name: string | null;
  seller_wallet: string;
  seller_reputation: number;
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

  if (loading) return <p className="text-sm text-[var(--text-mut)]">Loading…</p>;
  if (!product)
    return (
      <p className="text-sm text-[var(--text-mut)]">
        We could not find that product. It may have moved.
      </p>
    );

  return (
    <div className="grid gap-8 lg:grid-cols-[1.4fr_1fr]">
      <div>
        <div
          className="grid h-56 place-items-center rounded-[var(--radius-lg)] text-5xl font-bold text-black"
          style={{ background: "var(--brand-grad)" }}
        >
          {product.title.slice(0, 1).toUpperCase()}
        </div>
        <h1 className="font-display mt-6 text-3xl font-bold">{product.title}</h1>
        <div className="mt-2 flex items-center gap-3 text-sm text-[var(--text-mut)]">
          <span>
            by {product.seller_name || product.seller_username || shortAddress(product.seller_wallet)}
          </span>
          <span>·</span>
          <span>{product.total_purchases} sold</span>
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
          {product.description || "No description yet."}
        </p>

        <h2 className="font-display mt-10 text-lg font-semibold">Reviews</h2>
        {reviews.length === 0 ? (
          <p className="mt-2 text-sm text-[var(--text-mut)]">
            No reviews yet. Be the first to say how it went.
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
    </div>
  );
}

function BuyPanel({ product }: { product: Product }) {
  const { user } = useAuth();
  const { publicKey, sendTransaction } = useWallet();
  const { connection } = useConnection();
  const [state, setState] = useState<BuyState>({ step: "idle" });

  const isOwn = user?.wallet_address === product.seller_wallet;

  async function buy() {
    if (!publicKey || !user) {
      setState({ step: "error", message: "Connect a wallet to buy." });
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
      const sellerCut = payment.amountLamports - (payment.feeLamports ?? 0);

      const tx = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: publicKey,
          toPubkey: new PublicKey(payment.sellerWallet),
          lamports: sellerCut,
        }),
      );
      if (payment.treasury && payment.feeLamports > 0) {
        tx.add(
          SystemProgram.transfer({
            fromPubkey: publicKey,
            toPubkey: new PublicKey(payment.treasury),
            lamports: payment.feeLamports,
          }),
        );
      }

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
        message: e instanceof Error ? e.message : "The purchase did not complete.",
      });
    }
  }

  return (
    <div className="rounded-[var(--radius-md)] border p-6" style={{ background: "var(--surface)" }}>
      <div className="font-display text-3xl font-bold text-grad">
        {formatSol(product.price_lamports)}
      </div>
      <p className="mt-2 text-xs text-[var(--text-mut)]">
        Paid on Solana. The transfer settles to the seller in a few seconds.
      </p>

      {state.step === "done" ? (
        <Success orderId={state.orderId} signature={state.signature} fileUrl={product.file_url} />
      ) : (
        <>
          <button
            onClick={buy}
            disabled={
              isOwn ||
              !user ||
              ["creating", "paying", "confirming"].includes(state.step)
            }
            className="mt-5 w-full rounded-full px-5 py-3 text-sm font-semibold text-black disabled:opacity-40"
            style={{ background: "var(--brand-grad)" }}
          >
            {isOwn
              ? "This is your listing"
              : state.step === "creating"
                ? "Opening order…"
                : state.step === "paying"
                  ? "Approve in your wallet…"
                  : state.step === "confirming"
                    ? "Confirming on Solana…"
                    : `Buy for ${formatSol(product.price_lamports)}`}
          </button>
          {!user && (
            <p className="mt-3 text-xs text-[var(--text-mut)]">
              Connect a wallet with the button in the top bar first.
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
  fileUrl,
}: {
  orderId: string;
  signature: string;
  fileUrl: string | null;
}) {
  const [rating, setRating] = useState(0);
  const [body, setBody] = useState("");
  const [sent, setSent] = useState(false);
  const net = process.env.NEXT_PUBLIC_SOLANA_NETWORK ?? "devnet";

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
        Done. The payment settled and your order is complete.
      </div>
      {fileUrl && (
        <a
          href={fileUrl}
          target="_blank"
          rel="noreferrer"
          className="mt-3 block rounded-full px-5 py-3 text-center text-sm font-semibold text-black"
          style={{ background: "var(--brand-grad)" }}
        >
          Download your files
        </a>
      )}
      <a
        href={`https://explorer.solana.com/tx/${signature}?cluster=${net}`}
        target="_blank"
        rel="noreferrer"
        className="mt-3 block text-center font-mono text-xs text-[var(--text-mut)] underline"
      >
        View the transaction
      </a>

      {!sent ? (
        <div className="mt-5 border-t pt-4">
          <p className="text-sm font-medium">Leave a review</p>
          <div className="mt-2 flex gap-1 text-lg">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                onClick={() => setRating(n)}
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
            placeholder="How was it?"
            className="mt-2 w-full resize-none rounded-[var(--radius-sm)] border bg-transparent p-2 text-sm outline-none"
          />
          <button
            onClick={review}
            disabled={!rating}
            className="mt-2 w-full rounded-full border px-4 py-2 text-sm disabled:opacity-40"
          >
            Submit review
          </button>
        </div>
      ) : (
        <p className="mt-4 text-sm text-[var(--text-mut)]">Thanks for the review.</p>
      )}
    </div>
  );
}
