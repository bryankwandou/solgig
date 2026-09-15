"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { en, id, type Copy } from "@/content/copy";
import { cn } from "@/lib/utils";

export const LOCALES = [
  { code: "en", label: "EN", name: "English" },
  { code: "id", label: "ID", name: "Bahasa Indonesia" },
] as const;
export type Locale = (typeof LOCALES)[number]["code"];

const DICTS: Record<Locale, Copy> = { en, id };
const STORAGE_KEY = "solgig-locale";

const LocaleCtx = createContext<{
  locale: Locale;
  setLocale: (l: Locale) => void;
}>({ locale: "en", setLocale: () => {} });

/**
 * English renders first on every page (server and client agree, so there is
 * no hydration mismatch); a visitor's saved choice is applied right after.
 */
export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("en");

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === "en" || saved === "id") setLocaleState(saved);
    } catch {
      // storage blocked: stay on English
    }
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    try {
      localStorage.setItem(STORAGE_KEY, l);
    } catch {
      // storage blocked: the choice lasts for this visit only
    }
  }, []);

  return (
    <LocaleCtx.Provider value={{ locale, setLocale }}>
      {children}
    </LocaleCtx.Provider>
  );
}

export function useLocale() {
  return useContext(LocaleCtx);
}

/** The dictionary for the active language. */
export function useCopy(): Copy {
  return DICTS[useContext(LocaleCtx).locale];
}

export function LocaleSwitch({ className }: { className?: string }) {
  const { locale, setLocale } = useLocale();
  const copy = useCopy();
  return (
    <div
      role="group"
      aria-label={copy.nav.language}
      className={cn("inline-flex rounded-full border p-0.5 text-xs", className)}
    >
      {LOCALES.map((l) => (
        <button
          key={l.code}
          type="button"
          title={l.name}
          aria-pressed={locale === l.code}
          onClick={() => setLocale(l.code)}
          className={cn(
            "rounded-full px-2.5 py-1 font-medium transition-colors",
            locale === l.code
              ? "bg-[var(--surface-2)] text-[var(--text)]"
              : "text-[var(--text-mut)] hover:text-[var(--text)]",
          )}
        >
          {l.label}
        </button>
      ))}
    </div>
  );
}
