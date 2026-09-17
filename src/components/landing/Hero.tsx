"use client";

import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import {
  SplitText,
  Reveal,
  MagneticButton,
  CounterUp,
  PulseDot,
} from "@/components/motion";
import { useCopy } from "@/lib/i18n";

const TokenOrbit = dynamic(() => import("@/components/three/TokenOrbit"), {
  ssr: false,
  loading: () => <div className="float-y h-full w-full" />,
});

export function Hero() {
  const copy = useCopy();
  const router = useRouter();
  return (
    <section className="relative flex min-h-[100svh] items-center overflow-hidden pt-16">
      {/* Ledger grid: a ruled sheet that fades out toward the edges. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px)",
          backgroundSize: "56px 56px",
          maskImage: "radial-gradient(ellipse 70% 60% at 50% 40%, black 30%, transparent 75%)",
          WebkitMaskImage: "radial-gradient(ellipse 70% 60% at 50% 40%, black 30%, transparent 75%)",
          opacity: 0.55,
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-16 h-px"
        style={{ background: "linear-gradient(90deg, transparent, var(--brand-mint), transparent)", opacity: 0.5 }}
      />

      <div className="relative mx-auto grid w-full max-w-[1200px] grid-cols-1 items-center gap-10 px-5 lg:grid-cols-2">
        <div>
          <Reveal dir="up">
            <span className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs text-[var(--text-mut)]">
              <span
                className="h-1.5 w-1.5 rounded-full"
                style={{ background: "var(--brand-mint)" }}
              />
              {copy.hero.eyebrow}
            </span>
          </Reveal>

          <h1 className="font-display mt-5 text-4xl font-bold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
            <SplitText key={copy.hero.title} text={copy.hero.title} />
          </h1>

          <Reveal dir="up" delay={0.15}>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-[var(--text-mut)] sm:text-lg">
              {copy.hero.sub}
            </p>
          </Reveal>

          <Reveal dir="up" delay={0.25}>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <MagneticButton
                onClick={() => router.push("/dashboard/new")}
                background="var(--brand-grad)"
                className="rounded-full px-6 py-3 text-sm font-semibold text-[var(--on-brand)]"
              >
                {copy.hero.primary}
              </MagneticButton>
              <a
                href="#agents"
                className="rounded-full border px-6 py-3 text-sm font-medium text-[var(--text)] transition-colors hover:bg-[var(--surface)]"
              >
                {copy.hero.secondary}
              </a>
            </div>
          </Reveal>

          <Reveal dir="up" delay={0.35}>
            <dl className="mt-12 grid max-w-lg grid-cols-3 gap-6">
              <Stat
                value={<CounterUp to={2.5} decimals={1} suffix="%" />}
                label={copy.hero.statFee}
              />
              <Stat value={<span>~1s</span>} label={copy.hero.statSettle} />
              <Stat value={<span>1</span>} label={copy.hero.statEndpoint} />
            </dl>
          </Reveal>
        </div>

        <div className="relative h-[360px] sm:h-[460px] lg:h-[560px]">
          <TokenOrbit />
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
            <PulseDot label={copy.hero.live} />
          </div>
        </div>
      </div>
    </section>
  );
}

function Stat({
  value,
  label,
}: {
  value: React.ReactNode;
  label: string;
}) {
  return (
    <div>
      <div className="font-display text-xl font-bold sm:text-2xl">{value}</div>
      <div className="mt-1 text-xs text-[var(--text-mut)]">{label}</div>
    </div>
  );
}
