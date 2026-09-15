"use client";

import {
  Reveal,
  Stagger,
  StaggerItem,
  HoverTilt,
  GlowCard,
  CounterUp,
  Parallax,
  Marquee,
  Spotlight,
  LikeBurst,
  ProgressRing,
  ScrollSkew,
} from "@/components/motion";
import { LogoLockup } from "@/components/brand/Logo";
import Link from "next/link";
import { useCopy } from "@/lib/i18n";
import type { Copy } from "@/content/copy";
import { shortAddress } from "@/lib/utils";

function SectionHeading({
  title,
  sub,
}: {
  title: string;
  sub?: string;
}) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      <Reveal>
        <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
          {title}
        </h2>
      </Reveal>
      {sub && (
        <Reveal delay={0.1}>
          <p className="mt-3 text-[var(--text-mut)]">{sub}</p>
        </Reveal>
      )}
    </div>
  );
}

/* Proof strip — auto-scrolling row of categories. */
export function ProofStrip() {
  const copy = useCopy();
  const tags = [
    "Presets",
    "Notion templates",
    "Beat packs",
    "Figma kits",
    "Code starters",
    "3D assets",
    "Lightroom",
    "Fonts",
    "Mixing",
    "Logo design",
    "Datasets",
    "Courses",
  ];
  return (
    <section className="border-y py-6">
      <p className="mb-4 text-center text-xs uppercase tracking-widest text-[var(--text-mut)]">
        {copy.proof.line}
      </p>
      <Marquee>
        {tags.map((t, i) => (
          <span
            key={i}
            className="mx-2 whitespace-nowrap rounded-full border px-4 py-2 text-sm text-[var(--text-mut)]"
            style={{ background: "var(--surface)" }}
          >
            {t}
          </span>
        ))}
      </Marquee>
    </section>
  );
}

/* How it works — three steps. */
export function HowItWorks() {
  const copy = useCopy();
  return (
    <section id="how" className="mx-auto max-w-[1200px] px-5 py-24">
      <SectionHeading title={copy.how.title} />
      <Stagger className="mt-14 grid gap-5 md:grid-cols-3">
        {copy.how.steps.map((s) => (
          <StaggerItem key={s.k}>
            <HoverTilt className="h-full">
              <GlowCard className="h-full p-7">
                <div
                  className="font-display text-sm font-bold"
                  style={{ color: "var(--brand-mint)" }}
                >
                  {s.k}
                </div>
                <h3 className="font-display mt-4 text-xl font-semibold">
                  {s.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-[var(--text-mut)]">
                  {s.body}
                </p>
              </GlowCard>
            </HoverTilt>
          </StaggerItem>
        ))}
      </Stagger>
    </section>
  );
}

/* For sellers and buyers — two columns with counting figures. */
export function SellersBuyers() {
  const copy = useCopy();
  const block = (
    heading: string,
    points: readonly string[],
    accent: string,
  ) => (
    <GlowCard className="p-8">
      <h3 className="font-display text-xl font-semibold">{heading}</h3>
      <ul className="mt-5 space-y-3">
        {points.map((p, i) => (
          <li key={i} className="flex gap-3 text-sm text-[var(--text-mut)]">
            <span
              className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full"
              style={{ background: accent }}
            />
            {p}
          </li>
        ))}
      </ul>
    </GlowCard>
  );

  return (
    <section id="sellers" className="mx-auto max-w-[1200px] px-5 py-24">
      <SectionHeading title={copy.sellers.title} />
      <div className="mt-12 grid gap-6 md:grid-cols-2">
        <Reveal dir="right">
          {block(
            copy.sellers.forSellers.heading,
            copy.sellers.forSellers.points,
            "var(--brand-violet)",
          )}
        </Reveal>
        <Reveal dir="left" delay={0.1}>
          {block(
            copy.sellers.forBuyers.heading,
            copy.sellers.forBuyers.points,
            "var(--brand-mint)",
          )}
        </Reveal>
      </div>

      <div className="mt-10 grid grid-cols-2 gap-6 sm:grid-cols-4">
        <Figure value={<CounterUp to={97.5} decimals={1} suffix="%" />} label={copy.landing.figures[0]} />
        <Figure value={<CounterUp to={2} decimals={0} suffix=" min" />} label={copy.landing.figures[1]} />
        <Figure value={<><CounterUp to={1} decimals={0} />s</>} label={copy.landing.figures[2]} />
        <Figure value={<CounterUp to={0} decimals={0} suffix={copy.landing.chargebacks} />} label={copy.landing.figures[3]} />
      </div>
    </section>
  );
}

function Figure({ value, label }: { value: React.ReactNode; label: string }) {
  return (
    <Reveal>
      <div className="rounded-[var(--radius-md)] border p-5" style={{ background: "var(--surface)" }}>
        <div className="font-display text-2xl font-bold text-grad">{value}</div>
        <div className="mt-1 text-xs text-[var(--text-mut)]">{label}</div>
      </div>
    </Reveal>
  );
}

/* Agents — the thesis section: a terminal replays a real autonomous purchase. */
const AGENT_TRACE = [
  { t: "$ node agent-demo.mjs", d: 0 },
  { t: "[agent]   new wallet GHosw…WMs1w — no history, no account", d: 900 },
  { t: "[catalog] GET /api/agent/catalog → picked \"Pixel Icon Pack Vol. 2\" (0.4 SOL)", d: 1900 },
  { t: "[auth]    signed nonce with own key → session open", d: 2900 },
  { t: "[order]   SG-2026-000001 created", d: 3700 },
  { t: "[pay]     transfer sent, confirmed on Solana devnet", d: 4700 },
  { t: "[verify]  server checked signer, amounts, balances on-chain", d: 5700 },
  { t: "[collect] download unlocked — purchase complete, no human involved", d: 6700 },
] as const;

export function AgentSection() {
  const copy = useCopy();
  return (
    <section id="agents" className="mx-auto max-w-[1200px] px-5 py-24">
      <SectionHeading title={copy.agents.title} sub={copy.agents.sub} />
      <div className="mt-12 grid items-start gap-8 lg:grid-cols-[1fr_1.1fr]">
        <Stagger className="grid gap-5">
          {copy.agents.points.map((p, i) => (
            <StaggerItem key={i}>
              <GlowCard className="p-6">
                <h3 className="font-display text-lg font-semibold">{p.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-[var(--text-mut)]">
                  {p.body}
                </p>
              </GlowCard>
            </StaggerItem>
          ))}
        </Stagger>
        <Reveal dir="left">
          <AgentTerminal />
          <p className="mt-3 text-center text-xs text-[var(--text-mut)]">
            {copy.agents.demo}
          </p>
        </Reveal>
      </div>
    </section>
  );
}

function AgentTerminal() {
  const copy = useCopy();
  return (
    <div
      className="overflow-hidden rounded-[var(--radius-md)] border font-mono text-[13px] leading-relaxed"
      style={{ background: "oklch(0.13 0.01 280)" }}
    >
      <div className="flex items-center gap-1.5 border-b px-4 py-2.5">
        <span className="h-2.5 w-2.5 rounded-full" style={{ background: "oklch(0.6 0.18 25)" }} />
        <span className="h-2.5 w-2.5 rounded-full" style={{ background: "oklch(0.75 0.15 90)" }} />
        <span className="h-2.5 w-2.5 rounded-full" style={{ background: "var(--brand-mint)" }} />
        <span className="ml-3 text-xs text-[var(--text-mut)]">agent-demo — devnet</span>
      </div>
      <div className="min-h-[290px] px-4 py-4">
        {AGENT_TRACE.map((line, i) => (
          <Reveal key={i} delay={line.d / 1000} dir="up">
            <div className="whitespace-pre-wrap py-0.5">
              <span style={{ color: i === 0 ? "var(--brand-mint)" : undefined }}>
                {line.t}
              </span>
            </div>
          </Reveal>
        ))}
        <Reveal delay={7.4} dir="up">
          <div className="mt-2 flex items-center gap-2 text-xs" style={{ color: "var(--brand-mint)" }}>
            <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full" style={{ background: "var(--brand-mint)" }} />
            {copy.landing.replayed}
          </div>
        </Reveal>
      </div>
    </div>
  );
}

/* Trust — the escrow flow, nodes light up in sequence. */
export function TrustFlow() {
  const copy = useCopy();
  return (
    <Spotlight>
      <section id="trust" className="mx-auto max-w-[1200px] px-5 py-24">
        <SectionHeading title={copy.trust.title} sub={copy.trust.sub} />
        <Stagger className="mt-14 grid gap-5 md:grid-cols-3">
          {copy.trust.nodes.map((n, i) => (
            <StaggerItem key={i}>
              <div className="relative rounded-[var(--radius-md)] border p-7" style={{ background: "var(--surface)" }}>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs text-[var(--text-mut)]">
                    {copy.landing.step} {i + 1}
                  </span>
                  <ProgressRing progress={(i + 1) / 3} size={44} />
                </div>
                <h3 className="font-display mt-4 text-lg font-semibold">
                  {n.title}
                </h3>
                <p className="mt-2 text-sm text-[var(--text-mut)]">{n.body}</p>
              </div>
            </StaggerItem>
          ))}
        </Stagger>
      </section>
    </Spotlight>
  );
}

/* Feed preview — the same card the app uses, read only. */
export function FeedPreview() {
  const copy = useCopy();
  return (
    <section id="feed" className="mx-auto max-w-[1200px] px-5 py-24">
      <SectionHeading title={copy.feed.title} sub={copy.feed.sub} />
      <div className="mx-auto mt-12 grid max-w-3xl gap-5">
        {copy.feed.posts.map((p, i) => (
          <Reveal key={i} dir="up" delay={i * 0.08}>
            <FeedCard post={p} index={i} />
          </Reveal>
        ))}
      </div>
    </section>
  );
}

function FeedCard({
  post,
  index,
}: {
  post: Copy["feed"]["posts"][number];
  index: number;
}) {
  const copy = useCopy();
  const fakeWallet = ["7xKXtg2C", "3nQpLm9", "Bv4Re8Z"][index % 3] + "aZ9fA1bQ";
  return (
    <article className="rounded-[var(--radius-md)] border p-5" style={{ background: "var(--surface)" }}>
      <div className="flex items-center gap-3">
        <div
          className="grid h-10 w-10 place-items-center rounded-full font-display text-sm font-bold text-black"
          style={{ background: "var(--brand-grad)" }}
        >
          {post.author.slice(0, 1).toUpperCase()}
        </div>
        <div className="leading-tight">
          <div className="text-sm font-medium">{post.author}</div>
          <div className="font-mono text-xs text-[var(--text-mut)]">
            {shortAddress(fakeWallet)} · {post.time}
          </div>
        </div>
      </div>
      <p className="mt-4 text-sm leading-relaxed">{post.body}</p>
      <div className="mt-4 flex items-center justify-between">
        <div className="flex items-center gap-4 text-sm text-[var(--text-mut)]">
          <LikeBurst />
          <span>{post.likes}</span>
          <span>{post.comments} {copy.landing.replies}</span>
        </div>
        <Link
          href="/marketplace"
          className="rounded-full px-4 py-2 text-sm font-medium text-black"
          style={{ background: "var(--brand-grad)" }}
        >
          {copy.landing.buy} · {post.price}
        </Link>
      </div>
    </article>
  );
}

/* Final call to action. */
export function FinalCta() {
  const copy = useCopy();
  return (
    <section className="relative overflow-hidden py-28">
      <Parallax amount={40} className="absolute inset-0">
        <div
          className="absolute inset-[-10%] opacity-40 blur-3xl"
          style={{
            background:
              "radial-gradient(40% 50% at 50% 50%, oklch(0.55 0.24 295 / 0.5), transparent)",
          }}
        />
      </Parallax>
      <div className="relative mx-auto max-w-2xl px-5 text-center">
        <ScrollSkew>
          <h2 className="font-display text-3xl font-bold tracking-tight sm:text-5xl">
            {copy.finalCta.title}
          </h2>
        </ScrollSkew>
        <Reveal delay={0.1}>
          <p className="mx-auto mt-4 max-w-md text-[var(--text-mut)]">
            {copy.finalCta.sub}
          </p>
        </Reveal>
        <Reveal delay={0.2}>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              href="/dashboard/new"
              className="rounded-full px-6 py-3 text-sm font-semibold text-black"
              style={{ background: "var(--brand-grad)" }}
            >
              {copy.finalCta.primary}
            </Link>
            <a
              href="/dev/animations"
              className="rounded-full border px-6 py-3 text-sm font-medium transition-colors hover:bg-[var(--surface)]"
            >
              {copy.landing.gallery}
            </a>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* Footer. */
export function Footer() {
  const copy = useCopy();
  return (
    <footer className="border-t">
      <div className="mx-auto grid max-w-[1200px] gap-10 px-5 py-14 md:grid-cols-[1.5fr_1fr_1fr_1fr]">
        <div>
          <LogoLockup />
          <p className="mt-4 max-w-xs text-sm text-[var(--text-mut)]">
            {copy.footer.tagline}
          </p>
        </div>
        {copy.footer.columns.map((c) => (
          <div key={c.title}>
            <h4 className="text-sm font-semibold">{c.title}</h4>
            <ul className="mt-3 space-y-2">
              {c.links.map((l) => (
                <li key={l.href}>
                  <a
                    href={l.href}
                    {...(l.href.startsWith("http") ? { target: "_blank", rel: "noreferrer" } : {})}
                    className="text-sm text-[var(--text-mut)] transition-colors hover:text-[var(--text)]"
                  >
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t">
        <p className="mx-auto max-w-[1200px] px-5 py-6 text-xs text-[var(--text-mut)]">
          {copy.footer.legal}
        </p>
      </div>
    </footer>
  );
}
