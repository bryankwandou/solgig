"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/useAuth";
import { solToLamports } from "@/lib/utils";
import { useCopy } from "@/lib/i18n";

export default function NewListingPage() {
  const { user } = useAuth();
  const t = useCopy().pages.newListing;
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
        {t.connect}
      </p>
    );

  async function submit() {
    setError(null);
    const price = parseFloat(priceSol);
    if (!title.trim() || !Number.isFinite(price) || price < 0.001) {
      setError(t.invalid);
      return;
    }
    setBusy(true);
    const tagList = tags
      .split(",")
      .map((s) => s.trim())
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
      setError(d.error?.message ?? t.saveFailed);
      return;
    }
    router.push(kind === "product" ? "/marketplace" : "/services");
  }

  return (
    <div className="mx-auto max-w-xl">
      <h1 className="font-display text-2xl font-bold">{t.title}</h1>
      <p className="mt-1 text-sm text-[var(--text-mut)]">
        {t.sub}
      </p>

      <div className="mt-6 flex gap-2">
        {(["product", "service"] as const).map((k) => (
          <button
            key={k}
            onClick={() => setKind(k)}
            aria-pressed={kind === k}
            className="rounded-full border px-4 py-2 text-sm"
            style={kind === k ? { background: "var(--brand-grad)", color: "var(--on-brand)" } : undefined}
          >
            {t.kinds[k]}
          </button>
        ))}
      </div>

      <div className="mt-6 space-y-4">
        <Field label={t.fTitle}>
          <input value={title} onChange={(e) => setTitle(e.target.value)} className={inputCls} placeholder={t.phTitle} />
        </Field>
        <Field label={t.fDescription}>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} className={inputCls} placeholder={t.phDescription} />
        </Field>
        <Field label={t.fPrice}>
          <input value={priceSol} onChange={(e) => setPriceSol(e.target.value)} inputMode="decimal" className={inputCls} placeholder="1.5" />
        </Field>
        {kind === "product" ? (
          <>
            <Field label={t.fType}>
              <select value={type} onChange={(e) => setType(e.target.value)} className={inputCls}>
                {["template", "ebook", "code", "design", "music", "video", "course", "preset", "font", "other"].map((v) => (
                  <option key={v} value={v}>{t.types[v] ?? v}</option>
                ))}
              </select>
            </Field>
            <Field label={t.fFile}>
              <input value={fileUrl} onChange={(e) => setFileUrl(e.target.value)} className={inputCls} placeholder="https://…" />
            </Field>
          </>
        ) : (
          <Field label={t.fDays}>
            <input value={days} onChange={(e) => setDays(e.target.value)} inputMode="numeric" className={inputCls} placeholder="3" />
          </Field>
        )}
        <Field label={t.fTags}>
          <input value={tags} onChange={(e) => setTags(e.target.value)} className={inputCls} placeholder={t.phTags} />
        </Field>

        {error && <p className="text-sm" style={{ color: "var(--err)" }}>{error}</p>}

        <button
          onClick={submit}
          disabled={busy}
          className="w-full rounded-full px-5 py-3 text-sm font-semibold text-black disabled:opacity-40"
          style={{ background: "var(--brand-grad)" }}
        >
          {busy ? t.publishing : t.publish}
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
