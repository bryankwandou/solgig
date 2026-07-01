"use client";

import { useEffect, useState } from "react";
import { LogoLockup } from "@/components/brand/Logo";
import { MagneticButton } from "@/components/motion";
import { copy } from "@/content/copy";

export function Nav() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 24);
    fn();
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  return (
    <header
      className="fixed inset-x-0 top-0 z-40 transition-all duration-300"
      style={{
        backgroundColor: scrolled ? "oklch(0.16 0.01 280 / 0.7)" : "transparent",
        backdropFilter: scrolled ? "blur(12px)" : "none",
        borderBottom: scrolled ? "1px solid var(--border)" : "1px solid transparent",
      }}
    >
      <nav className="mx-auto flex h-16 max-w-[1200px] items-center justify-between px-5">
        <LogoLockup />
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
          <button className="hidden text-sm text-[var(--text-mut)] transition-colors hover:text-[var(--text)] sm:block">
            {copy.nav.signIn}
          </button>
          <MagneticButton
            onClick={() => {
              window.location.href = "/dashboard/new";
            }}
            className="rounded-full px-4 py-2 text-sm font-medium text-black"
          >
            <span
              className="absolute inset-0 -z-10 rounded-full"
              style={{ background: "var(--brand-grad)" }}
            />
            <span className="relative">{copy.nav.cta}</span>
          </MagneticButton>
        </div>
      </nav>
    </header>
  );
}
