"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import dynamic from "next/dynamic";
import { LogoLockup } from "@/components/brand/Logo";
import { useAuth } from "@/lib/auth/useAuth";
import { shortAddress } from "@/lib/utils";
import { cn } from "@/lib/utils";

const WalletMultiButton = dynamic(
  () =>
    import("@solana/wallet-adapter-react-ui").then(
      (m) => m.WalletMultiButton,
    ),
  { ssr: false },
);

const NAV = [
  { href: "/feed", label: "Feed" },
  { href: "/marketplace", label: "Marketplace" },
  { href: "/services", label: "Services" },
  { href: "/dashboard", label: "Dashboard" },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, signOut, signingIn } = useAuth();

  return (
    <div className="min-h-screen">
      <header
        className="sticky top-0 z-40 border-b"
        style={{
          background: "oklch(0.16 0.01 280 / 0.8)",
          backdropFilter: "blur(12px)",
        }}
      >
        <div className="mx-auto flex h-16 max-w-[1200px] items-center justify-between gap-4 px-5">
          <Link href="/">
            <LogoLockup />
          </Link>
          <nav className="hidden items-center gap-6 md:flex">
            {NAV.map((n) => (
              <Link
                key={n.href}
                href={n.href}
                className={cn(
                  "text-sm transition-colors",
                  pathname.startsWith(n.href)
                    ? "text-[var(--text)]"
                    : "text-[var(--text-mut)] hover:text-[var(--text)]",
                )}
              >
                {n.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            {signingIn && (
              <span className="text-xs text-[var(--text-mut)]">Signing in…</span>
            )}
            {user && (
              <button
                onClick={signOut}
                className="hidden text-sm text-[var(--text-mut)] transition-colors hover:text-[var(--text)] sm:block"
              >
                Sign out
              </button>
            )}
            <WalletMultiButton
              style={{
                background: "var(--brand-grad)",
                color: "#000",
                height: 38,
                borderRadius: 999,
                fontSize: 14,
                fontWeight: 600,
                lineHeight: "38px",
                padding: "0 16px",
              }}
            />
          </div>
        </div>
        <nav className="flex items-center justify-around border-t px-2 py-2 md:hidden">
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className={cn(
                "rounded-full px-3 py-1.5 text-xs",
                pathname.startsWith(n.href)
                  ? "text-[var(--text)]"
                  : "text-[var(--text-mut)]",
              )}
            >
              {n.label}
            </Link>
          ))}
        </nav>
      </header>

      {user && (
        <div className="border-b" style={{ background: "var(--surface)" }}>
          <div className="mx-auto max-w-[1200px] px-5 py-1.5 text-xs text-[var(--text-mut)]">
            Connected as{" "}
            <span className="font-mono">
              {user.username ? `@${user.username}` : shortAddress(user.wallet_address)}
            </span>
          </div>
        </div>
      )}

      <main className="mx-auto max-w-[1200px] px-5 py-8">{children}</main>
    </div>
  );
}
