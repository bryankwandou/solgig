"use client";

import { useState } from "react";
import {
  Reveal,
  Stagger,
  StaggerItem,
  SplitText,
  TypewriterText,
  MagneticButton,
  HoverTilt,
  GlowCard,
  CounterUp,
  Parallax,
  ScrollSkew,
  Marquee,
  Spotlight,
  LikeBurst,
  ShimmerSkeleton,
  PulseDot,
  ProgressRing,
  FloatingOrbs,
  GradientMesh,
  useReducedMotionFlag,
} from "@/components/motion";
import { LogoMark } from "@/components/brand/Logo";
import { useCopy } from "@/lib/i18n";

type Demo = { id: string; name: string; note: string; node: React.ReactNode };

function Card({ demo }: { demo: Demo }) {
  return (
    <div className="rounded-[var(--radius-md)] border" style={{ background: "var(--surface)" }}>
      <div className="flex items-center justify-between border-b px-4 py-2.5">
        <span className="font-mono text-xs text-[var(--text-mut)]">{demo.id}</span>
        <span className="text-sm font-medium">{demo.name}</span>
      </div>
      <div className="grid min-h-[160px] place-items-center p-6">{demo.node}</div>
      <p className="border-t px-4 py-2.5 text-xs text-[var(--text-mut)]">{demo.note}</p>
    </div>
  );
}

export default function AnimationGallery() {
  const reduced = useReducedMotionFlag();
  const [replay, setReplay] = useState(0);
  const t = useCopy().pages.gallery;
  const d = (i: number) => ({ name: t.demos[i][0], note: t.demos[i][1] });
  const label = (i: number) => t.demos[i][2];

  const demos: Demo[] = [
    { id: "01", ...d(0), node: <Reveal key={replay}><Pill>{label(0)}</Pill></Reveal> },
    { id: "02", ...d(1), node: <Stagger key={replay} className="flex gap-2">{[0,1,2,3].map(i=><StaggerItem key={i}><Pill>{i+1}</Pill></StaggerItem>)}</Stagger> },
    { id: "03", ...d(2), node: <span key={replay} className="font-display text-xl font-bold"><SplitText key={t.title} text={label(2)} /></span> },
    { id: "04", ...d(3), node: <TypewriterText key={replay} text="solgig.xyz" className="text-lg" /> },
    { id: "05", ...d(4), node: <MagneticButton background="var(--brand-grad)" className="rounded-full px-5 py-2.5 text-sm font-semibold text-black">{label(4)}</MagneticButton> },
    { id: "06", ...d(5), node: <HoverTilt><div className="grid h-24 w-36 place-items-center rounded-[var(--radius-md)] border" style={{background:"var(--surface-2)"}}><LogoMark size={36}/></div></HoverTilt> },
    { id: "07", ...d(6), node: <GlowCard className="grid h-24 w-40 place-items-center"><span className="text-sm text-[var(--text-mut)]">{label(6)}</span></GlowCard> },
    { id: "08", ...d(7), node: <span className="font-display text-3xl font-bold text-grad"><CounterUp key={replay} to={4820} suffix=" SOL" /></span> },
    { id: "09", ...d(8), node: <Parallax amount={20}><Pill>{label(8)}</Pill></Parallax> },
    { id: "10", ...d(9), node: <ScrollSkew><span className="font-display text-lg font-bold">{label(9)}</span></ScrollSkew> },
    { id: "11", ...d(10), node: <Marquee className="w-full">{["Presets","Beats","Kits","Code","Fonts"].map((t,i)=><span key={i} className="mx-2 rounded-full border px-3 py-1 text-xs">{t}</span>)}</Marquee> },
    { id: "12", ...d(11), node: <Spotlight className="grid h-24 w-40 place-items-center rounded-[var(--radius-md)] border"><span className="text-sm text-[var(--text-mut)]">{label(11)}</span></Spotlight> },
    { id: "13", ...d(12), node: <LikeBurst /> },
    { id: "14", ...d(13), node: <div className="w-full space-y-2"><ShimmerSkeleton className="h-3 w-3/4" /><ShimmerSkeleton className="h-3 w-1/2" /><ShimmerSkeleton className="h-3 w-2/3" /></div> },
    { id: "15", ...d(14), node: <PulseDot label={label(14)} /> },
    { id: "16", ...d(15), node: <ProgressRing key={replay} progress={0.72} /> },
    { id: "17", ...d(16), node: <div className="relative h-24 w-40 overflow-hidden rounded-[var(--radius-md)] border"><FloatingOrbs/></div> },
    { id: "18", ...d(17), node: <div className="relative h-24 w-40 overflow-hidden rounded-[var(--radius-md)] border"><GradientMesh/></div> },
  ];

  return (
    <main className="mx-auto max-w-[1200px] px-5 py-14">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">{t.title}</h1>
          <p className="mt-2 max-w-xl text-sm text-[var(--text-mut)]">
            {t.intro}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-[var(--text-mut)]">
            {t.reduced(reduced)}
          </span>
          <button
            onClick={() => setReplay((v) => v + 1)}
            className="rounded-full border px-4 py-2 text-sm transition-colors hover:bg-[var(--surface)]"
          >
            {t.replay}
          </button>
          <a
            href="/"
            className="rounded-full px-4 py-2 text-sm font-medium text-black"
            style={{ background: "var(--brand-grad)" }}
          >
            {t.back}
          </a>
        </div>
      </div>

      <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {demos.map((d) => (
          <Card key={d.id} demo={d} />
        ))}
      </div>

      <p className="mt-12 text-xs text-[var(--text-mut)]">
        {t.footer(demos.length)}
      </p>
    </main>
  );
}

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="inline-grid h-10 min-w-10 place-items-center rounded-full border px-4 text-sm"
      style={{ background: "var(--surface-2)" }}
    >
      {children}
    </span>
  );
}
