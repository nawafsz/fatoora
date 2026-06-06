"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { ar, en } from "@/lib/i18n/dictionaries";
import type { Dict } from "@/lib/i18n";

type Lang = "ar" | "en";

type LangContext = {
  lang: Lang;
  dict: Dict;
  setLang: (l: Lang) => Promise<void>;
  dir: "rtl" | "ltr";
};

const defaultDict: Dict = ar;

const Ctx = createContext<LangContext>({
  lang: "ar",
  dict: defaultDict,
  setLang: async () => {},
  dir: "rtl",
});

export function LanguageProvider({
  children,
  initialLang,
}: {
  children: React.ReactNode;
  initialLang: Lang;
}) {
  const [lang, setLangState] = useState<Lang>(initialLang);
  const [dict, setDict] = useState<Dict>(initialLang === "en" ? en : ar);

  const setLang = useCallback(async (l: Lang) => {
    await fetch("/api/settings/lang", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ language: l }),
    });
    document.cookie = `lang=${l};path=/;max-age=31536000`;
    setLangState(l);
    setDict(l === "en" ? en : ar);
  }, []);

  return (
    <Ctx.Provider value={{ lang, dict, setLang, dir: lang === "ar" ? "rtl" : "ltr" }}>
      {children}
    </Ctx.Provider>
  );
}

export function useLanguage() {
  return useContext(Ctx);
}
