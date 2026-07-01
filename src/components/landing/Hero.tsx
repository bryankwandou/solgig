"use client";

import dynamic from "next/dynamic";
import {
  GradientMesh,
  FloatingOrbs,
  SplitText,
  Reveal,
  MagneticButton,
  CounterUp,
  PulseDot,
} from "@/components/motion";
import { copy } from "@/content/copy";

const TokenOrbit = dynamic(() => import("@/components/three/TokenOrbit"), {
  ssr: false,
  loading: () => <div className="float-y h-full w-full" />,
});

export function Hero() {
  return (
    <section className="relative flex min-h-[100svh] items-center overflow-hidden pt-16">
      <GradientMesh />
      <FloatingOrbs />

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
            <SplitText text={copy.hero.title} />
          </h1>

          <Reveal dir="up" delay={0.15}>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-[var(--text-mut)] sm:text-lg">
              {copy.hero.sub}
            </p>
          </Reveal>

          <Reveal dir="up" delay={0.25}>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <MagneticButton className="relative rounded-full px-6 py-3 text-sm font-semibold text-black">
                <span
                  className="absolute inset-0 -z-10 rounded-full"
                  style={{ background: "var(--brand-grad)" }}
                />
                <span className="relative">{copy.hero.primary}</span>
              </MagneticButton>
              <a
                href="#feed"
                className="rounded-full border px-6 py-3 text-sm font-medium text-[var(--text)] transition-colors hover:bg-[var(--surface)]"
              >
                {copy.hero.secondary}
              </a>
            </div>
          </Reveal>

          <Reveal dir="up" delay={0.35}>
            <dl className="mt-12 grid max-w-lg grid-cols-3 gap-6">
              <Stat
                value={<CounterUp to={4820} prefix="" suffix=" SOL" />}
                label={copy.hero.statSettled}
              />
              <Stat
                value={<CounterUp to={1340} suffix="+" />}
                label={copy.hero.statCreators}
              />
              <Stat
                value={<span>~1s</span>}
                label={copy.hero.statMedian}
              />
            </dl>
          </Reveal>
        </div>

        <div className="relative h-[360px] sm:h-[460px] lg:h-[560px]">
          <TokenOrbit />
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
            <PulseDot label="Live on Solana" />
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
