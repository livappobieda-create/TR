"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { translations, type Lang, type TranslationKey } from "@/lib/i18n";

interface LangContextValue {
  lang: Lang;
  dir: "ltr" | "rtl";
  t: (key: TranslationKey, vars?: Record<string, string | number>) => string;
  setLang: (lang: Lang) => void;
  isArabic: boolean;
}

const LangContext = createContext<LangContextValue>({
  lang: "en",
  dir: "ltr",
  t: (key) => key,
  setLang: () => {},
  isArabic: false,
});

const STORAGE_KEY = "neon-trade-lang";

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");

  useEffect(() => {
    const stored = (localStorage.getItem(STORAGE_KEY) as Lang) || "en";
    setLangState(stored);
    applyLang(stored);
  }, []);

  const applyLang = (l: Lang) => {
    const dir = l === "ar" ? "rtl" : "ltr";
    document.documentElement.setAttribute("lang", l);
    document.documentElement.setAttribute("dir", dir);
    // Switch body font per language
    if (l === "ar") {
      document.documentElement.style.fontFamily =
        "'Cairo', 'Noto Sans Arabic', sans-serif";
    } else {
      document.documentElement.style.fontFamily =
        "'Roboto Mono', 'JetBrains Mono', monospace";
    }
  };

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    localStorage.setItem(STORAGE_KEY, l);
    applyLang(l);
  }, []);

  const t = useCallback(
    (key: TranslationKey, vars?: Record<string, string | number>): string => {
      const dict = translations[lang] as Record<string, string>;
      let text = dict[key] ?? (translations.en as Record<string, string>)[key] ?? key;
      if (vars) {
        Object.entries(vars).forEach(([k, v]) => {
          text = text.replace(`{${k}}`, String(v));
        });
      }
      return text;
    },
    [lang]
  );

  return (
    <LangContext.Provider
      value={{ lang, dir: lang === "ar" ? "rtl" : "ltr", t, setLang, isArabic: lang === "ar" }}
    >
      {children}
    </LangContext.Provider>
  );
}

export function useLang() {
  return useContext(LangContext);
}
