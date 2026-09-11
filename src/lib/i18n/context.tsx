"use client";

import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from "react";
import { translations, type Locale } from "./translations";

interface LanguageContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: typeof translations.en;
}

const LanguageContext = createContext<LanguageContextType>({
  locale: "en",
  setLocale: () => {},
  t: translations.en,
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("en");

  useEffect(() => {
    // 1. Read stored preference
    const saved = localStorage.getItem("html_manager_locale") as Locale | null;
    let resolved: Locale | null = null;

    if (saved && (saved === "zh" || saved === "en")) {
      resolved = saved;
    } else {
      // 2. Otherwise detect from browser navigator.language
      const browserLang = typeof navigator !== "undefined" ? navigator.language.toLowerCase() : "";
      resolved = browserLang.startsWith("zh") ? "zh" : "en";
    }

    setLocaleState(resolved);
    // Keep the document lang attribute in sync with the resolved locale for a11y & SEO
    try {
      document.documentElement.lang = resolved === "zh" ? "zh-CN" : "en";
    } catch {
      // ignore
    }
  }, []);

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale);
    try {
      localStorage.setItem("html_manager_locale", newLocale);
      document.documentElement.lang = newLocale === "zh" ? "zh-CN" : "en";
    } catch {
      // ignore
    }
  }, []);

  const t = translations[locale];

  const value = useMemo(() => ({ locale, setLocale, t }), [locale, setLocale, t]);

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
