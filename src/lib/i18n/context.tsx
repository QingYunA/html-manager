"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { translations, type Locale } from "./translations";

interface LanguageContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: typeof translations.zh;
}

const LanguageContext = createContext<LanguageContextType>({
  locale: "zh",
  setLocale: () => {},
  t: translations.zh,
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("zh");

  useEffect(() => {
    // 1. Read stored preference
    const saved = localStorage.getItem("html_manager_locale") as Locale | null;
    if (saved && (saved === "zh" || saved === "en")) {
      setLocaleState(saved);
      return;
    }

    // 2. Otherwise detect from browser navigator.language
    const browserLang = typeof navigator !== "undefined" ? navigator.language.toLowerCase() : "";
    if (browserLang.startsWith("zh")) {
      setLocaleState("zh");
    } else {
      setLocaleState("en");
    }
  }, []);

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale);
    try {
      localStorage.setItem("html_manager_locale", newLocale);
      document.documentElement.lang = newLocale === "zh" ? "zh-CN" : "en";
    } catch {
      // ignore
    }
  };

  const t = translations[locale];

  return (
    <LanguageContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
