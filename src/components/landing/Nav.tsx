"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogoLockup } from "@/components/brand/Logo";
import { MagneticButton } from "@/components/motion";
import { LocaleSwitch, useCopy } from "@/lib/i18n";

export function Nav() {
  const copy = useCopy();
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 24);
    fn();
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  return (
    <header
      className="fixed inset-x-0 top-0 z-40 transition-[background-color,border-color,backdrop-filter] duration-300"
      style={{
        backgroundColor: scrolled
          ? "color-mix(in oklch, var(--bg) 72%, transparent)"
          : "transparent",
        backdropFilter: scrolled ? "blur(12px)" : "none",
        borderBottom: scrolled ? "1px solid var(--border)" : "1px solid transparent",
      }}
    >
      <nav className="mx-auto flex h-16 max-w-[1200px] items-center justify-between px-5">
        <Link href="/" aria-label="SolGig home">
          <LogoLockup />
        </Link>
        <div className="hidden items-center gap-7 md:flex">
          {copy.nav.links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="text-sm text-[var(--text-mut)] transition-colors hover:text-[var(--text)]"
            >
              {l.label}
            </a>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <LocaleSwitch />
          <Link
            href="/marketplace"
            className="hidden text-sm text-[var(--text-mut)] transition-colors hover:text-[var(--text)] sm:block"
          >
            {copy.nav.signIn}
          </Link>
          <MagneticButton
            onClick={() => router.push("/dashboard/new")}
            background="var(--brand-grad)"
            className="rounded-full px-4 py-2 text-sm font-medium text-[var(--on-brand)]"
          >
            {copy.nav.cta}
          </MagneticButton>
        </div>
      </nav>
    </header>
  );
}
