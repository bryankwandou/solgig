"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/useAuth";
import { solToLamports } from "@/lib/utils";

export default function NewListingPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [kind, setKind] = useState<"product" | "service">("product");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priceSol, setPriceSol] = useState("");
  const [type, setType] = useState("template");
  const [fileUrl, setFileUrl] = useState("");
  const [days, setDays] = useState("3");
  const [tags, setTags] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!user)
    return (
      <p className="text-sm text-[var(--text-mut)]">
        Connect a wallet to create a listing.
      </p>
    );

  async function submit() {
    setError(null);
    const price = parseFloat(priceSol);
    if (!title.trim() || isNaN(price) || price < 0) {
      setError("Add a title and a valid price.");
      return;
    }
    setBusy(true);
    const tagList = tags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    const body =
      kind === "product"
        ? {
            title,
            description,
            short_description: description.slice(0, 160),
            product_type: type,
            file_url: fileUrl,
            tags: tagList,
            price_lamports: solToLamports(price),
          }
        : {
            title,
            description,
            tags: tagList,
            price_lamports: solToLamports(price),
            delivery_days: parseInt(days) || 3,
          };

    const res = await fetch(kind === "product" ? "/api/products" : "/api/services", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    setBusy(false);
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setError(d.error?.message ?? "Could not save the listing.");
      return;
    }
    router.push(kind === "product" ? "/marketplace" : "/services");
  }

  return (
    <div className="mx-auto max-w-xl">
      <h1 className="font-display text-2xl font-bold">New listing</h1>
      <p className="mt-1 text-sm text-[var(--text-mut)]">
        Publish a digital product or a service. You can price it in SOL.
      </p>

      <div className="mt-6 flex gap-2">
        {(["product", "service"] as const).map((k) => (
          <button
            key={k}
            onClick={() => setKind(k)}
            className="rounded-full border px-4 py-2 text-sm capitalize"
            style={kind === k ? { background: "var(--brand-grad)", color: "#000" } : undefined}
          >
            {k}
          </button>
        ))}
      </div>

      <div className="mt-6 space-y-4">
        <Field label="Title">
          <input value={title} onChange={(e) => setTitle(e.target.value)} className={inputCls} placeholder="Warm street tones preset pack" />
        </Field>
        <Field label="Description">
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} className={inputCls} placeholder="What it is and what the buyer gets." />
        </Field>
        <Field label="Price in SOL">
          <input value={priceSol} onChange={(e) => setPriceSol(e.target.value)} inputMode="decimal" className={inputCls} placeholder="1.5" />
        </Field>
        {kind === "product" ? (
          <>
            <Field label="Type">
              <select value={type} onChange={(e) => setType(e.target.value)} className={inputCls}>
                {["template", "ebook", "code", "design", "music", "video", "course", "preset", "font", "other"].map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </Field>
            <Field label="Download link (given to the buyer after payment)">
              <input value={fileUrl} onChange={(e) => setFileUrl(e.target.value)} className={inputCls} placeholder="https://…" />
            </Field>
          </>
        ) : (
          <Field label="Delivery in days">
            <input value={days} onChange={(e) => setDays(e.target.value)} inputMode="numeric" className={inputCls} placeholder="3" />
          </Field>
        )}
        <Field label="Tags (comma separated)">
          <input value={tags} onChange={(e) => setTags(e.target.value)} className={inputCls} placeholder="lightroom, presets, street" />
        </Field>

        {error && <p className="text-sm" style={{ color: "var(--err)" }}>{error}</p>}

        <button
          onClick={submit}
          disabled={busy}
          className="w-full rounded-full px-5 py-3 text-sm font-semibold text-black disabled:opacity-40"
          style={{ background: "var(--brand-grad)" }}
        >
          {busy ? "Publishing…" : "Publish listing"}
        </button>
      </div>
    </div>
  );
}

const inputCls =
  "w-full rounded-[var(--radius-sm)] border bg-transparent px-3 py-2 text-sm outline-none";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm text-[var(--text-mut)]">{label}</span>
      {children}
    </label>
  );
}
