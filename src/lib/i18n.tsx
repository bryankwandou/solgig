"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { MotionConfig } from "framer-motion";
import { en, id, type Copy } from "@/content/copy";
import { cn } from "@/lib/utils";

export const LOCALES = [
  { code: "en", name: "English" },
  { code: "id", name: "Bahasa Indonesia" },
  { code: "es", name: "Español" },
  { code: "pt", name: "Português" },
  { code: "fr", name: "Français" },
  { code: "de", name: "Deutsch" },
  { code: "it", name: "Italiano" },
  { code: "nl", name: "Nederlands" },
  { code: "pl", name: "Polski" },
  { code: "tr", name: "Türkçe" },
  { code: "ru", name: "Русский" },
  { code: "uk", name: "Українська" },
  { code: "ar", name: "العربية" },
  { code: "hi", name: "हिन्दी" },
  { code: "th", name: "ไทย" },
  { code: "vi", name: "Tiếng Việt" },
  { code: "ms", name: "Bahasa Melayu" },
  { code: "zh", name: "简体中文" },
  { code: "ja", name: "日本語" },
  { code: "ko", name: "한국어" },
] as const;
export type Locale = (typeof LOCALES)[number]["code"];

const RTL = new Set<Locale>(["ar"]);
const STORAGE_KEY = "solgig-locale";

function isLocale(v: string | null): v is Locale {
  return !!v && LOCALES.some((l) => l.code === v);
}

// English and Indonesian ship with the page. The rest load on first use, so
// twenty dictionaries do not all land in every visitor's bundle.
const LOADERS: Record<Exclude<Locale, "en" | "id">, () => Promise<Copy>> = {
  es: () => import("@/content/locales/es").then((m) => m.es),
  pt: () => import("@/content/locales/pt").then((m) => m.pt),
  fr: () => import("@/content/locales/fr").then((m) => m.fr),
  de: () => import("@/content/locales/de").then((m) => m.de),
  it: () => import("@/content/locales/it").then((m) => m.it),
  nl: () => import("@/content/locales/nl").then((m) => m.nl),
  pl: () => import("@/content/locales/pl").then((m) => m.pl),
  tr: () => import("@/content/locales/tr").then((m) => m.tr),
  ru: () => import("@/content/locales/ru").then((m) => m.ru),
  uk: () => import("@/content/locales/uk").then((m) => m.uk),
  ar: () => import("@/content/locales/ar").then((m) => m.ar),
  hi: () => import("@/content/locales/hi").then((m) => m.hi),
  th: () => import("@/content/locales/th").then((m) => m.th),
  vi: () => import("@/content/locales/vi").then((m) => m.vi),
  ms: () => import("@/content/locales/ms").then((m) => m.ms),
  zh: () => import("@/content/locales/zh").then((m) => m.zh),
  ja: () => import("@/content/locales/ja").then((m) => m.ja),
  ko: () => import("@/content/locales/ko").then((m) => m.ko),
};

const LocaleCtx = createContext<{
  locale: Locale;
  dict: Copy;
  setLocale: (l: Locale) => void;
}>({ locale: "en", dict: en, setLocale: () => {} });

/**
 * English renders first on every page (server and client agree, so there is
 * no hydration mismatch); a visitor's saved choice is applied right after.
 */
export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("en");
  const [dict, setDict] = useState<Copy>(en);

  // Switch only once the dictionary is in hand, so no half-translated frame.
  const apply = useCallback(async (l: Locale) => {
    const next =
      l === "en" ? en : l === "id" ? id : await LOADERS[l]().catch(() => en);
    setDict(next);
    setLocaleState(l);
  }, []);

  useEffect(() => {
    try {
      // A ?lang= link wins over the saved choice, so a shared link opens in
      // the language it was shared in.
      const fromUrl = new URLSearchParams(window.location.search).get("lang");
      if (isLocale(fromUrl)) {
        localStorage.setItem(STORAGE_KEY, fromUrl);
        void apply(fromUrl);
        return;
      }
      const saved = localStorage.getItem(STORAGE_KEY);
      if (isLocale(saved)) void apply(saved);
    } catch {
      // storage blocked: stay on English
    }
  }, [apply]);

  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = RTL.has(locale) ? "rtl" : "ltr";
  }, [locale]);

  const setLocale = useCallback(
    (l: Locale) => {
      void apply(l);
      try {
        localStorage.setItem(STORAGE_KEY, l);
      } catch {
        // storage blocked: the choice lasts for this visit only
      }
    },
    [apply],
  );

  return (
    <LocaleCtx.Provider value={{ locale, dict, setLocale }}>
      {/* Visitors who turned motion off get fades without movement, site-wide. */}
      <MotionConfig reducedMotion="user">{children}</MotionConfig>
    </LocaleCtx.Provider>
  );
}

export function useLocale() {
  return useContext(LocaleCtx);
}

/** The dictionary for the active language. */
export function useCopy(): Copy {
  return useContext(LocaleCtx).dict;
}

export function LocaleSwitch({ className }: { className?: string }) {
  const { locale, setLocale } = useLocale();
  const copy = useCopy();
  return (
    <label className={cn("relative inline-flex items-center", className)}>
      <span className="sr-only">{copy.nav.language}</span>
      <select
        value={locale}
        onChange={(e) => setLocale(e.target.value as Locale)}
        className="h-9 appearance-none rounded-full border bg-transparent py-0 pe-7 ps-3 text-xs font-medium text-[var(--text)] transition-colors hover:bg-[var(--surface-2)]"
      >
        {LOCALES.map((l) => (
          <option key={l.code} value={l.code} style={{ background: "var(--surface)" }}>
            {l.code.toUpperCase()} · {l.name}
          </option>
        ))}
      </select>
      <svg aria-hidden width="10" height="10" viewBox="0 0 10 10" className="pointer-events-none absolute end-3 text-[var(--text-mut)]">
        <path d="M1 3l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    </label>
  );
}

const THEME_KEY = "solgig-theme";

/** Runs before paint so a saved light theme never flashes dark first. */
export const THEME_BOOT =
  'try{var t=localStorage.getItem("' + THEME_KEY + '");' +
  'if(t==="light"||(!t&&matchMedia("(prefers-color-scheme: light)").matches))' +
  '{document.documentElement.classList.add("light")}}catch(e){}';

export function ThemeToggle({ className }: { className?: string }) {
  const [light, setLight] = useState(false);
  useEffect(() => {
    setLight(document.documentElement.classList.contains("light"));
  }, []);
  function flip() {
    const next = !light;
    setLight(next);
    document.documentElement.classList.toggle("light", next);
    try {
      localStorage.setItem(THEME_KEY, next ? "light" : "dark");
    } catch {
      // storage blocked: the choice lasts for this visit only
    }
  }
  return (
    <button
      type="button"
      onClick={flip}
      aria-label={light ? "Switch to dark theme" : "Switch to light theme"}
      aria-pressed={light}
      className={cn(
        "grid h-9 w-9 shrink-0 place-items-center rounded-full border text-[var(--text-mut)] transition-colors hover:bg-[var(--surface-2)] hover:text-[var(--text)]",
        className,
      )}
    >
      {light ? (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
          <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
        </svg>
      ) : (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
        </svg>
      )}
    </button>
  );
}
