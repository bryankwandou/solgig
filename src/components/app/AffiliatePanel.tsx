"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Transaction } from "@solana/web3.js";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { fromWire, type WireInstruction } from "@/lib/solana/program";
import { useLocale } from "@/lib/i18n";
import { affiliateCopy } from "@/content/affiliate";
import { formatSol, shortAddress, LAMPORTS_PER_SOL } from "@/lib/utils";

type Campaign = {
  address: string;
  bps: number;
  holdSeconds: number;
  balanceLamports: string;
  reservedLamports: string;
  paidLamports: string;
  availableLamports: string;
};
type Earned = {
  id: string;
  order_number: string;
  title: string | null;
  slug: string | null;
  commission_lamports: string | null;
  commission_status: string;
  commission_release_at: string | null;
  commission_tx: string | null;
};
type Data =
  | { enabled: false }
  | {
      enabled: true;
      network: string;
      programId: string;
      campaign: Campaign | null;
      earned: Earned[];
      referredSales: { order_number: string; amount_lamports: string; commission_lamports: string | null; commission_status: string; referrer_username: string | null }[];
    };

const sol = (lamports: string | number | null) => formatSol(Number(lamports ?? 0));
const toLamports = (s: string) => Math.round(Number(s) * LAMPORTS_PER_SOL);

/** Referral commissions on the dashboard: the seller's campaign and the referrer's earnings. */
export function AffiliatePanel() {
  const { locale } = useLocale();
  const t = affiliateCopy(locale);
  const { publicKey, sendTransaction } = useWallet();
  const { connection } = useConnection();
  const [data, setData] = useState<Data | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [now, setNow] = useState(() => Date.now());

  const load = useCallback(() => {
    fetch("/api/affiliate")
      .then((r) => r.json())
      .then((d) => setData(d.error ? { enabled: false } : d));
  }, []);
  useEffect(load, [load]);
  // Ticks so a held commission turns claimable without a reload.
  useEffect(() => {
    const i = setInterval(() => setNow(Date.now()), 5_000);
    return () => clearInterval(i);
  }, []);

  /** Ask the server for instructions, sign them in the wallet, wait for confirmation. */
  async function signAndSend(body: object): Promise<{ signature: string; res: Record<string, unknown> }> {
    if (!publicKey) throw new Error("Connect a wallet first.");
    const res = await fetch("/api/affiliate", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    }).then((r) => r.json());
    if (res.error) throw new Error(res.error.message);
    const tx = new Transaction();
    for (const w of res.instructions as WireInstruction[]) {
      const ix = fromWire(w);
      // The seller is the only signer the server may ask for.
      if (ix.keys.some((k) => k.isSigner && !k.pubkey.equals(publicKey))) throw new Error("Unexpected signer requested.");
      tx.add(ix);
    }
    const signature = await sendTransaction(tx, connection);
    const latest = await connection.getLatestBlockhash("confirmed");
    const conf = await connection.confirmTransaction({ signature, ...latest }, "confirmed");
    if (conf.value.err) throw new Error(t.failed);
    return { signature, res };
  }

  async function run(key: string, fn: () => Promise<void>) {
    setBusy(key);
    setMsg(null);
    try {
      await fn();
      setMsg({ ok: true, text: t.done });
      load();
    } catch (e) {
      setMsg({ ok: false, text: e instanceof Error ? e.message : t.failed });
    } finally {
      setBusy(null);
    }
  }

  if (!data || !data.enabled) return null;
  const c = data.campaign;
  const explorer = (sig: string) => `https://explorer.solana.com/tx/${sig}?cluster=${data.network}`;

  return (
    <section className="mt-8">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="font-display text-lg font-semibold">{t.title}</h2>
        <a
          href={`https://explorer.solana.com/address/${data.programId}?cluster=${data.network}`}
          target="_blank"
          rel="noreferrer"
          className="text-xs text-[var(--text-mut)] hover:underline"
        >
          {t.poweredBy}
        </a>
      </div>

      <div className="mt-3 grid gap-4 md:grid-cols-2">
        {/* Seller: the campaign */}
        <div className="rounded-[var(--radius-md)] border p-5" style={{ background: "var(--surface)" }}>
          <h3 className="text-sm font-semibold">{t.sellerHead}</h3>
          {c ? (
            <CampaignView c={c} t={t} busy={busy} onFund={(l) => run("fund", async () => void (await signAndSend({ action: "fund", lamports: l })))} onWithdraw={(l) => run("withdraw", async () => void (await signAndSend({ action: "withdraw", lamports: l })))} network={data.network} />
          ) : (
            <OpenCampaign
              t={t}
              busy={busy === "open"}
              onOpen={(bps, holdSeconds, fundLamports) =>
                run("open", async () => {
                  const { res } = await signAndSend({ action: "prepare", bps, holdSeconds, fundLamports });
                  const reg = await fetch("/api/affiliate", {
                    method: "POST",
                    headers: { "content-type": "application/json" },
                    body: JSON.stringify({ action: "register", campaign: res.campaign }),
                  }).then((r) => r.json());
                  if (reg.error) throw new Error(reg.error.message);
                })
              }
            />
          )}
          {c && (
            <>
              <h4 className="mt-5 text-xs font-semibold uppercase tracking-wide text-[var(--text-mut)]">{t.referredSales}</h4>
              {data.referredSales.length ? (
                <ul className="mt-2 divide-y text-sm">
                  {data.referredSales.map((s) => (
                    <li key={s.order_number} className="flex justify-between gap-2 py-2">
                      <span>
                        <span className="font-mono text-xs">{s.order_number}</span>{" "}
                        <span className="text-[var(--text-mut)]">@{s.referrer_username ?? "—"}</span>
                      </span>
                      <span className="text-[var(--text-mut)]">
                        {sol(s.commission_lamports)} · {t.status[s.commission_status] ?? s.commission_status}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2 text-sm text-[var(--text-mut)]">{t.noReferredSales}</p>
              )}
            </>
          )}
        </div>

        {/* Referrer: earnings */}
        <div className="rounded-[var(--radius-md)] border p-5" style={{ background: "var(--surface)" }}>
          <h3 className="text-sm font-semibold">{t.earnedHead}</h3>
          {data.earned.length ? (
            <ul className="mt-2 divide-y text-sm">
              {data.earned.map((e) => {
                const due = e.commission_release_at ? new Date(e.commission_release_at).getTime() : 0;
                const claimable = e.commission_status === "recorded" && now >= due;
                return (
                  <li key={e.id} className="flex items-center justify-between gap-3 py-2">
                    <span className="min-w-0">
                      {e.slug ? (
                        <Link href={`/marketplace/${e.slug}`} className="hover:underline">{e.title}</Link>
                      ) : (
                        e.title
                      )}
                      <span className="block text-xs text-[var(--text-mut)]">
                        {t.status[e.commission_status] ?? e.commission_status}
                        {e.commission_status === "recorded" && !claimable && due ? ` · ${t.due(new Date(due).toLocaleString())}` : ""}
                        {e.commission_tx && (
                          <>
                            {" · "}
                            <a href={explorer(e.commission_tx)} target="_blank" rel="noreferrer" className="hover:underline">tx</a>
                          </>
                        )}
                      </span>
                    </span>
                    <span className="flex shrink-0 items-center gap-2">
                      <span className="font-medium">{sol(e.commission_lamports)}</span>
                      {claimable && (
                        <button
                          disabled={!!busy}
                          onClick={() =>
                            run(`claim-${e.id}`, async () => {
                              const r = await fetch("/api/affiliate/release", {
                                method: "POST",
                                headers: { "content-type": "application/json" },
                                body: JSON.stringify({ orderId: e.id }),
                              }).then((x) => x.json());
                              if (r.error) throw new Error(r.error.message);
                            })
                          }
                          className="rounded-full px-3 py-1 text-xs font-semibold text-[var(--on-brand)] disabled:opacity-50"
                          style={{ background: "var(--brand-grad)" }}
                        >
                          {busy === `claim-${e.id}` ? t.claiming : t.claim}
                        </button>
                      )}
                    </span>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="mt-2 text-sm text-[var(--text-mut)]">{t.noEarned}</p>
          )}
          <p className="mt-3 text-xs text-[var(--text-mut)]">{t.feeNote}</p>
        </div>
      </div>
      {msg && (
        <p className="mt-3 text-sm" style={{ color: msg.ok ? "var(--ok, #16a34a)" : "var(--err)" }}>
          {msg.text}
        </p>
      )}
    </section>
  );
}

type T = ReturnType<typeof affiliateCopy>;

function OpenCampaign({ t, busy, onOpen }: { t: T; busy: boolean; onOpen: (bps: number, hold: number, fund: number) => void }) {
  const [rate, setRate] = useState("10");
  const [hold, setHold] = useState(120);
  const [fund, setFund] = useState("0.1");
  const bps = Math.round(Number(rate) * 100);
  const valid = bps >= 1 && bps <= 5_000 && Number(fund) >= 0;
  return (
    <div className="mt-2">
      <p className="text-sm text-[var(--text-mut)]">{t.sellerSub}</p>
      <div className="mt-4 grid grid-cols-3 gap-3">
        <Field label={t.rate}>
          <input value={rate} onChange={(e) => setRate(e.target.value)} inputMode="decimal" className="w-full rounded-md border bg-transparent px-2 py-1.5 text-sm" />
        </Field>
        <Field label={t.window}>
          <select value={hold} onChange={(e) => setHold(Number(e.target.value))} className="w-full rounded-md border bg-transparent px-2 py-1.5 text-sm">
            {Object.entries(t.windows).map(([s, label]) => (
              <option key={s} value={s} style={{ background: "var(--surface)" }}>{label}</option>
            ))}
          </select>
        </Field>
        <Field label={t.fund}>
          <input value={fund} onChange={(e) => setFund(e.target.value)} inputMode="decimal" className="w-full rounded-md border bg-transparent px-2 py-1.5 text-sm" />
        </Field>
      </div>
      <button
        disabled={busy || !valid}
        onClick={() => onOpen(bps, hold, toLamports(fund))}
        className="mt-4 rounded-full px-4 py-2 text-sm font-semibold text-[var(--on-brand)] disabled:opacity-50"
        style={{ background: "var(--brand-grad)" }}
      >
        {busy ? t.opening : t.open}
      </button>
    </div>
  );
}

function CampaignView({ c, t, busy, onFund, onWithdraw, network }: { c: Campaign; t: T; busy: string | null; onFund: (l: number) => void; onWithdraw: (l: number) => void; network: string }) {
  const [amount, setAmount] = useState("0.05");
  const hold = t.windows[c.holdSeconds] ?? `${c.holdSeconds}s`;
  return (
    <div className="mt-2">
      <p className="text-sm">
        <span className="font-display text-2xl font-bold text-grad">{c.bps / 100}%</span>{" "}
        <span className="text-[var(--text-mut)]">· {t.window.toLowerCase()} {hold} ·{" "}
          <a href={`https://explorer.solana.com/address/${c.address}?cluster=${network}`} target="_blank" rel="noreferrer" className="font-mono text-xs hover:underline">
            {shortAddress(c.address)}
          </a>
        </span>
      </p>
      <dl className="mt-3 grid grid-cols-4 gap-2 text-center">
        {[
          [t.budget, c.balanceLamports],
          [t.reserved, c.reservedLamports],
          [t.available, c.availableLamports],
          [t.paid, c.paidLamports],
        ].map(([k, v]) => (
          <div key={k} className="rounded-md border px-1 py-2">
            <dt className="text-[10px] uppercase tracking-wide text-[var(--text-mut)]">{k}</dt>
            <dd className="text-sm font-semibold">{sol(v)}</dd>
          </div>
        ))}
      </dl>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <input value={amount} onChange={(e) => setAmount(e.target.value)} aria-label={t.amountSol} inputMode="decimal" className="w-24 rounded-md border bg-transparent px-2 py-1.5 text-sm" />
        <button disabled={!!busy} onClick={() => onFund(toLamports(amount))} className="rounded-full border px-3 py-1.5 text-xs font-semibold disabled:opacity-50">
          {busy === "fund" ? t.opening : t.addFunds}
        </button>
        <button disabled={!!busy} onClick={() => onWithdraw(toLamports(amount))} className="rounded-full border px-3 py-1.5 text-xs font-semibold disabled:opacity-50">
          {busy === "withdraw" ? t.opening : t.withdraw}
        </button>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs text-[var(--text-mut)]">{label}</span>
      {children}
    </label>
  );
}
