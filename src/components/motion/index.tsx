"use client";

import {
  motion,
  useInView,
  useScroll,
  useTransform,
  useSpring,
  useMotionValue,
  useMotionValueEvent,
  useVelocity,
  animate,
  AnimatePresence,
  type Variants,
} from "framer-motion";
import {
  useEffect,
  useRef,
  useState,
  type ReactNode,
  type CSSProperties,
} from "react";
import { cn } from "@/lib/utils";

const EASE = [0.22, 1, 0.36, 1] as const;

type Dir = "up" | "down" | "left" | "right" | "none";

function offset(dir: Dir, d = 24) {
  switch (dir) {
    case "up":
      return { y: d };
    case "down":
      return { y: -d };
    case "left":
      return { x: d };
    case "right":
      return { x: -d };
    default:
      return {};
  }
}

/** 1. Reveal — fade plus optional slide, fires once when scrolled into view. */
export function Reveal({
  children,
  dir = "up",
  delay = 0,
  className,
}: {
  children: ReactNode;
  dir?: Dir;
  delay?: number;
  className?: string;
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, ...offset(dir) }}
      whileInView={{ opacity: 1, x: 0, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.55, ease: EASE, delay }}
    >
      {children}
    </motion.div>
  );
}

/** 2 + 3. Stagger container and item. */
const staggerParent: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
};
const staggerChild: Variants = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE } },
};

export function Stagger({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      className={className}
      variants={staggerParent}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-60px" }}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <motion.div className={className} variants={staggerChild}>
      {children}
    </motion.div>
  );
}

/** 4. SplitText — reveals a headline word by word. */
export function SplitText({
  text,
  className,
  delay = 0,
}: {
  text: string;
  className?: string;
  delay?: number;
}) {
  const words = text.split(" ");
  return (
    <motion.span
      className={className}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true }}
      variants={{
        hidden: {},
        show: { transition: { staggerChildren: 0.045, delayChildren: delay } },
      }}
      aria-label={text}
    >
      {words.map((w, i) => (
        <span key={i} className="inline-block overflow-hidden align-bottom">
          <motion.span
            className="inline-block"
            variants={{
              hidden: { y: "110%" },
              show: { y: 0, transition: { duration: 0.6, ease: EASE } },
            }}
          >
            {w}
            {i < words.length - 1 ? " " : ""}
          </motion.span>
        </span>
      ))}
    </motion.span>
  );
}

/** 5. TypewriterText — types a string, then holds. */
export function TypewriterText({
  text,
  className,
  speed = 38,
}: {
  text: string;
  className?: string;
  speed?: number;
}) {
  const [n, setN] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });

  useEffect(() => {
    if (!inView) return;
    if (n >= text.length) return;
    const t = setTimeout(() => setN((v) => v + 1), speed);
    return () => clearTimeout(t);
  }, [inView, n, text.length, speed]);

  return (
    <span ref={ref} className={cn("font-mono", className)}>
      {text.slice(0, n)}
      <span className="pulse-dot">_</span>
    </span>
  );
}

/** 6. MagneticButton — drifts toward the pointer, springs back on leave. */
export function MagneticButton({
  children,
  className,
  onClick,
  strength = 0.4,
  background,
}: {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  strength?: number;
  /** Painted on the button itself, so it can never spill onto a parent. */
  background?: string;
}) {
  const ref = useRef<HTMLButtonElement>(null);
  const x = useSpring(useMotionValue(0), { stiffness: 250, damping: 18 });
  const y = useSpring(useMotionValue(0), { stiffness: 250, damping: 18 });

  function move(e: React.MouseEvent) {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    x.set((e.clientX - (r.left + r.width / 2)) * strength);
    y.set((e.clientY - (r.top + r.height / 2)) * strength);
  }
  function reset() {
    x.set(0);
    y.set(0);
  }

  return (
    <motion.button
      ref={ref}
      style={{ x, y, background }}
      onMouseMove={move}
      onMouseLeave={reset}
      onClick={onClick}
      className={className}
      whileTap={{ scale: 0.96 }}
    >
      {children}
    </motion.button>
  );
}

/** 7. HoverTilt — a card that tilts in 3D toward the pointer. */
export function HoverTilt({
  children,
  className,
  max = 10,
}: {
  children: ReactNode;
  className?: string;
  max?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const rx = useSpring(useMotionValue(0), { stiffness: 200, damping: 15 });
  const ry = useSpring(useMotionValue(0), { stiffness: 200, damping: 15 });

  function move(e: React.MouseEvent) {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    ry.set(px * max);
    rx.set(-py * max);
  }
  function reset() {
    rx.set(0);
    ry.set(0);
  }

  return (
    <motion.div
      ref={ref}
      onMouseMove={move}
      onMouseLeave={reset}
      style={{ rotateX: rx, rotateY: ry, transformPerspective: 800 }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/** 8. GlowCard — a pointer-following glow inside a bordered surface. */
export function GlowCard({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const mx = useMotionValue(50);
  const my = useMotionValue(50);

  function move(e: React.MouseEvent) {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    mx.set(((e.clientX - r.left) / r.width) * 100);
    my.set(((e.clientY - r.top) / r.height) * 100);
  }

  const bg = useTransform(
    [mx, my],
    ([a, b]) =>
      `radial-gradient(380px circle at ${a}% ${b}%, oklch(0.55 0.24 295 / 0.18), transparent 60%)`,
  );

  return (
    <div
      ref={ref}
      onMouseMove={move}
      className={cn(
        "relative overflow-hidden rounded-[var(--radius-md)] border",
        className,
      )}
      style={{ background: "var(--surface)" }}
    >
      <motion.div
        className="pointer-events-none absolute inset-0"
        style={{ background: bg }}
      />
      <div className="relative">{children}</div>
    </div>
  );
}

/** 9. CounterUp — counts to a target when scrolled into view. */
export function CounterUp({
  to,
  suffix = "",
  prefix = "",
  decimals = 0,
  className,
}: {
  to: number;
  suffix?: string;
  prefix?: string;
  decimals?: number;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const [val, setVal] = useState(0);

  useEffect(() => {
    if (!inView) return;
    const controls = animate(0, to, {
      duration: 1.4,
      ease: EASE,
      onUpdate: (v) => setVal(v),
    });
    return () => controls.stop();
  }, [inView, to]);

  return (
    <span ref={ref} className={className}>
      {prefix}
      {val.toLocaleString("en-US", {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      })}
      {suffix}
    </span>
  );
}

/** 10. ScrollProgress — a thin gradient rail at the top of the page. */
export function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 120, damping: 30 });
  return (
    <motion.div
      className="fixed inset-x-0 top-0 z-50 h-[3px] origin-left"
      style={{ scaleX, background: "var(--brand-grad)" }}
    />
  );
}

/** 11. Parallax — moves its child against the scroll. */
export function Parallax({
  children,
  amount = 60,
  className,
}: {
  children: ReactNode;
  amount?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const y = useTransform(scrollYProgress, [0, 1], [amount, -amount]);
  return (
    <motion.div ref={ref} style={{ y }} className={className}>
      {children}
    </motion.div>
  );
}

/** 12. ScrollSkew — skews briefly with scroll velocity. */
export function ScrollSkew({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const { scrollY } = useScroll();
  const velocity = useVelocity(scrollY);
  const smooth = useSpring(velocity, { stiffness: 300, damping: 40 });
  const skew = useTransform(smooth, [-2000, 0, 2000], [4, 0, -4], {
    clamp: true,
  });
  return (
    <motion.div style={{ skewY: skew }} className={className}>
      {children}
    </motion.div>
  );
}

/** 13. Marquee — an auto-scrolling row that pauses on hover (CSS driven). */
export function Marquee({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("overflow-hidden", className)}>
      <div className="marquee-track gap-4">
        {children}
        {children}
      </div>
    </div>
  );
}

/** 14. Spotlight — a soft glow that tracks the pointer across a section. */
export function Spotlight({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const mx = useMotionValue(50);
  const my = useMotionValue(0);
  function move(e: React.MouseEvent) {
    const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
    mx.set(((e.clientX - r.left) / r.width) * 100);
    my.set(((e.clientY - r.top) / r.height) * 100);
  }
  const bg = useTransform(
    [mx, my],
    ([a, b]) =>
      `radial-gradient(600px circle at ${a}% ${b}%, oklch(0.86 0.20 165 / 0.10), transparent 55%)`,
  );
  return (
    <div onMouseMove={move} className={cn("relative", className)}>
      <motion.div
        className="pointer-events-none absolute inset-0"
        style={{ background: bg }}
      />
      {children}
    </div>
  );
}

/** 15. LikeBurst — a heart that pops and scatters on tap. */
export function LikeBurst({ className }: { className?: string }) {
  const [on, setOn] = useState(false);
  return (
    <button
      onClick={() => setOn((v) => !v)}
      className={cn("relative h-9 w-9", className)}
      aria-pressed={on}
      aria-label="Like"
    >
      <motion.span
        animate={on ? { scale: [1, 1.4, 1] } : { scale: 1 }}
        transition={{ duration: 0.35, ease: EASE }}
        className="absolute inset-0 grid place-items-center text-lg"
        style={{ color: on ? "var(--err)" : "var(--text-mut)" }}
      >
        {on ? heartFilled : heartOutline}
      </motion.span>
      <AnimatePresence>
        {on &&
          [0, 1, 2, 3, 4, 5].map((i) => (
            <motion.span
              key={i}
              initial={{ opacity: 0.9, scale: 0.4, x: 0, y: 0 }}
              animate={{
                opacity: 0,
                scale: 1,
                x: Math.cos((i / 6) * Math.PI * 2) * 22,
                y: Math.sin((i / 6) * Math.PI * 2) * 22,
              }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="absolute left-1/2 top-1/2 h-1.5 w-1.5 rounded-full"
              style={{ background: "var(--err)" }}
            />
          ))}
      </AnimatePresence>
    </button>
  );
}

const heartFilled = (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 21s-7.5-4.9-10-9.2C.6 9.1 1.6 5.5 5 4.6c2-.5 3.8.4 5 2 .8-1.6 3-2.5 5-2 3.4.9 4.4 4.5 3 7.2C19.5 16.1 12 21 12 21z" />
  </svg>
);
const heartOutline = (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.7"
  >
    <path d="M12 21s-7.5-4.9-10-9.2C.6 9.1 1.6 5.5 5 4.6c2-.5 3.8.4 5 2 .8-1.6 3-2.5 5-2 3.4.9 4.4 4.5 3 7.2C19.5 16.1 12 21 12 21z" />
  </svg>
);

/** 16. ShimmerSkeleton — a loading block with a moving sheen. */
export function ShimmerSkeleton({
  className,
  style,
}: {
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <div
      className={cn("skeleton rounded-[var(--radius-sm)]", className)}
      style={style}
    />
  );
}

/** 17. PulseDot — a small status indicator that breathes. */
export function PulseDot({ label }: { label?: string }) {
  return (
    <span className="inline-flex items-center gap-2 text-sm">
      <span
        className="pulse-dot inline-block h-2 w-2 rounded-full"
        style={{ background: "var(--ok)" }}
      />
      {label}
    </span>
  );
}

/** 18. ProgressRing — a circular fill, handy for a pending transaction. */
export function ProgressRing({
  progress = 0.7,
  size = 64,
}: {
  progress?: number;
  size?: number;
}) {
  const r = size / 2 - 6;
  const c = 2 * Math.PI * r;
  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="var(--border)"
        strokeWidth="5"
      />
      <motion.circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="var(--brand-mint)"
        strokeWidth="5"
        strokeLinecap="round"
        strokeDasharray={c}
        initial={{ strokeDashoffset: c }}
        whileInView={{ strokeDashoffset: c * (1 - progress) }}
        viewport={{ once: true }}
        transition={{ duration: 1.2, ease: EASE }}
      />
    </svg>
  );
}

/** 19. FloatingOrbs — blurred brand orbs that drift behind content. */
export function FloatingOrbs() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div
        className="float-y absolute -left-20 top-10 h-72 w-72 rounded-full opacity-30 blur-3xl"
        style={{ background: "var(--brand-violet)" }}
      />
      <div
        className="float-y absolute -right-10 top-40 h-80 w-80 rounded-full opacity-20 blur-3xl"
        style={{ background: "var(--brand-mint)", animationDelay: "1.5s" }}
      />
    </div>
  );
}

/** 20. GradientMesh — a slow drifting brand backdrop for the hero. */
export function GradientMesh() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div
        className="mesh-drift absolute inset-[-20%] opacity-50 blur-2xl"
        style={{
          background:
            "radial-gradient(40% 40% at 30% 30%, oklch(0.55 0.24 295 / 0.5), transparent), radial-gradient(35% 35% at 70% 60%, oklch(0.86 0.20 165 / 0.35), transparent)",
        }}
      />
    </div>
  );
}

/** Reports whether the visitor asked the system to reduce motion. */
export function useReducedMotionFlag() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const m = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(m.matches);
    const fn = () => setReduced(m.matches);
    m.addEventListener("change", fn);
    return () => m.removeEventListener("change", fn);
  }, []);
  return reduced;
}

export { useMotionValueEvent };
