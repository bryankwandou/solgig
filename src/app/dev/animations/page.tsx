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

  const demos: Demo[] = [
    { id: "01", name: "Reveal", note: "Fade and slide in on scroll, once.", node: <Reveal key={replay}><Pill>In view</Pill></Reveal> },
    { id: "02", name: "Stagger", note: "Children enter one after another.", node: <Stagger key={replay} className="flex gap-2">{[0,1,2,3].map(i=><StaggerItem key={i}><Pill>{i+1}</Pill></StaggerItem>)}</Stagger> },
    { id: "03", name: "Split text", note: "Headline reveals word by word.", node: <span key={replay} className="font-display text-xl font-bold"><SplitText text="Sell your work" /></span> },
    { id: "04", name: "Typewriter", note: "Types on enter, then holds.", node: <TypewriterText key={replay} text="solgig.xyz" className="text-lg" /> },
    { id: "05", name: "Magnetic button", note: "Drifts toward the pointer.", node: <MagneticButton className="rounded-full px-5 py-2.5 text-sm font-semibold text-black"><span className="absolute inset-0 -z-10 rounded-full" style={{background:"var(--brand-grad)"}}/><span className="relative">Hover me</span></MagneticButton> },
    { id: "06", name: "Hover tilt", note: "Card tilts in 3D toward the pointer.", node: <HoverTilt><div className="grid h-24 w-36 place-items-center rounded-[var(--radius-md)] border" style={{background:"var(--surface-2)"}}><LogoMark size={36}/></div></HoverTilt> },
    { id: "07", name: "Glow card", note: "A glow follows the pointer inside.", node: <GlowCard className="grid h-24 w-40 place-items-center"><span className="text-sm text-[var(--text-mut)]">Move inside</span></GlowCard> },
    { id: "08", name: "Counter up", note: "Counts to a target in view.", node: <span className="font-display text-3xl font-bold text-grad"><CounterUp key={replay} to={4820} suffix=" SOL" /></span> },
    { id: "09", name: "Parallax", note: "Moves against the scroll.", node: <Parallax amount={20}><Pill>Scroll the page</Pill></Parallax> },
    { id: "10", name: "Scroll skew", note: "Skews with scroll velocity.", node: <ScrollSkew><span className="font-display text-lg font-bold">Scroll fast</span></ScrollSkew> },
    { id: "11", name: "Marquee", note: "Auto-scrolls, pauses on hover.", node: <Marquee className="w-full">{["Presets","Beats","Kits","Code","Fonts"].map((t,i)=><span key={i} className="mx-2 rounded-full border px-3 py-1 text-xs">{t}</span>)}</Marquee> },
    { id: "12", name: "Spotlight", note: "Soft glow tracks the pointer.", node: <Spotlight className="grid h-24 w-40 place-items-center rounded-[var(--radius-md)] border"><span className="text-sm text-[var(--text-mut)]">Move here</span></Spotlight> },
    { id: "13", name: "Like burst", note: "Heart pops and scatters on tap.", node: <LikeBurst /> },
    { id: "14", name: "Shimmer skeleton", note: "Loading block with a moving sheen.", node: <div className="w-full space-y-2"><ShimmerSkeleton className="h-3 w-3/4" /><ShimmerSkeleton className="h-3 w-1/2" /><ShimmerSkeleton className="h-3 w-2/3" /></div> },
    { id: "15", name: "Pulse dot", note: "Status indicator that breathes.", node: <PulseDot label="Live on Solana" /> },
    { id: "16", name: "Progress ring", note: "Circular fill for a pending action.", node: <ProgressRing key={replay} progress={0.72} /> },
    { id: "17", name: "Floating orbs", note: "Blurred brand orbs drift behind.", node: <div className="relative h-24 w-40 overflow-hidden rounded-[var(--radius-md)] border"><FloatingOrbs/></div> },
    { id: "18", name: "Gradient mesh", note: "Slow brand backdrop for the hero.", node: <div className="relative h-24 w-40 overflow-hidden rounded-[var(--radius-md)] border"><GradientMesh/></div> },
  ];

  return (
    <main className="mx-auto max-w-[1200px] px-5 py-14">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">Motion gallery</h1>
          <p className="mt-2 max-w-xl text-sm text-[var(--text-mut)]">
            Every effect wired into SolGig, running live. Each one collapses to a quiet
            fade when the system is set to reduce motion.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-[var(--text-mut)]">
            Reduced motion: {reduced ? "on" : "off"}
          </span>
          <button
            onClick={() => setReplay((v) => v + 1)}
            className="rounded-full border px-4 py-2 text-sm transition-colors hover:bg-[var(--surface)]"
          >
            Replay entrances
          </button>
          <a
            href="/"
            className="rounded-full px-4 py-2 text-sm font-medium text-black"
            style={{ background: "var(--brand-grad)" }}
          >
            Back to landing
          </a>
        </div>
      </div>

      <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {demos.map((d) => (
          <Card key={d.id} demo={d} />
        ))}
      </div>

      <p className="mt-12 text-xs text-[var(--text-mut)]">
        {demos.length} effects shown. The same primitives compose the larger scenes on
        the landing page, where they are combined into the hero, the escrow flow, and
        the feed preview.
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
