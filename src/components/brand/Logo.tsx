import { cn } from "@/lib/utils";

/**
 * SG monogram. The S reads as a Solana wave with a lightning kick; the G opens
 * like a coin slot with a token settling in the counter. Speaks "sell and get
 * paid on Solana" from the silhouette alone.
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
        <linearGradient id="sg-grad" x1="0" y1="0" x2="40" y2="40">
          <stop offset="0" stopColor="#9945FF" />
          <stop offset="1" stopColor="#14F195" />
        </linearGradient>
      </defs>
      {/* S wave with a lightning kick on the lower terminal */}
      <path
        d="M19 7.5c-5 0-8 2.2-8 5.4 0 3 2.4 4.3 6.6 5 3 .5 4 .9 4 1.9 0 1-1.4 1.7-3.6 1.7-2.2 0-3.8-.6-4.9-1.8l-2.4 4.6 4.8-1.1-2.2 4.8"
        stroke="url(#sg-grad)"
        strokeWidth="3.1"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* G ring with a coin-slot crossbar */}
      <path
        d="M33 16.2a8.4 8.4 0 1 0 0 8.2h-4.2"
        stroke="url(#sg-grad)"
        strokeWidth="3.1"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* token settling in the counter */}
      <circle cx="28.6" cy="20.3" r="1.7" fill="#14F195" />
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
