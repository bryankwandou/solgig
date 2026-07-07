import { cn } from "@/lib/utils";

/**
 * The SolGig mark: three stacked bars — Solana's silhouette — where the
 * middle bar is a terminal prompt chevron. Top bar leans right, bottom bar
 * leans left, so the stack reads as an "S". The chevron says the quiet part
 * out loud: this marketplace has a command line, and machines shop here too.
 */
export function LogoMark({
  size = 32,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      className={className}
      role="img"
      aria-label="SolGig"
    >
      <defs>
        <linearGradient id="sg-top" x1="8" y1="8" x2="34" y2="14">
          <stop offset="0" stopColor="#9945FF" />
          <stop offset="1" stopColor="#7C6CFF" />
        </linearGradient>
        <linearGradient id="sg-bottom" x1="6" y1="28" x2="32" y2="34">
          <stop offset="0" stopColor="#2BD9A8" />
          <stop offset="1" stopColor="#14F195" />
        </linearGradient>
      </defs>
      {/* top bar — leans right */}
      <path
        d="M13 8h18.4a1.3 1.3 0 0 1 .92 2.22l-3.4 3.4a2.6 2.6 0 0 1-1.84.76H8.6a1.3 1.3 0 0 1-.92-2.22l3.4-3.4A2.6 2.6 0 0 1 13 8Z"
        fill="url(#sg-top)"
      />
      {/* middle bar — the prompt chevron, drawn as a single stroke */}
      <path
        d="M11.5 16.6 17 20l-5.5 3.4"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M21.5 23.2h8"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        opacity="0.55"
      />
      {/* bottom bar — leans left */}
      <path
        d="M11.9 25.6h18.5a1.3 1.3 0 0 1 .92 2.22l-3.4 3.4a2.6 2.6 0 0 1-1.84.78H7.5a1.3 1.3 0 0 1-.92-2.22l3.4-3.4a2.6 2.6 0 0 1 1.92-.78Z"
        fill="url(#sg-bottom)"
        transform="translate(0 2.4)"
      />
    </svg>
  );
}

export function Wordmark({ className }: { className?: string }) {
  return (
    <span
      className={cn("font-display text-lg font-bold tracking-tight", className)}
    >
      Sol<span className="font-medium text-[var(--text-mut)]">Gig</span>
    </span>
  );
}

export function LogoLockup({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <LogoMark size={28} />
      <Wordmark />
    </div>
  );
}
