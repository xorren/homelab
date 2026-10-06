"use client";

import { createContext, useContext, useEffect, useState } from "react";

export type Locale = "en" | "ko";

interface LocaleContextValue {
  locale: Locale;
  setLocale: (l: Locale) => void;
}

const LocaleContext = createContext<LocaleContextValue>({
  locale: "en",
  setLocale: () => {},
});

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  // SSR/hydration 불일치 방지: 초기값은 항상 "en", 마운트 후 localStorage 읽기
  const [locale, setLocaleState] = useState<Locale>("en");

  useEffect(() => {
    try {
      const saved = localStorage.getItem("homelab_locale");
      if (saved === "ko" || saved === "en") setLocaleState(saved);
    } catch {}
  }, []);

  function setLocale(l: Locale) {
    setLocaleState(l);
    try {
      localStorage.setItem("homelab_locale", l);
    } catch {}
  }

  return (
    <LocaleContext.Provider value={{ locale, setLocale }}>
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale() {
  return useContext(LocaleContext);
}
