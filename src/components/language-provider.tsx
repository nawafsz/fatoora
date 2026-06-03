"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import type { Dict } from "@/lib/i18n";

type Lang = "ar" | "en";

type LangContext = {
  lang: Lang;
  dict: Dict;
  setLang: (l: Lang) => Promise<void>;
  dir: "rtl" | "ltr";
};

const Ctx = createContext<LangContext>({
  lang: "ar",
  dict: {} as Dict,
  setLang: async () => {},
  dir: "rtl",
});

async function loadDict(lang: Lang): Promise<Dict> {
  const { ar, en } = await import("@/lib/i18n/dictionaries");
  return lang === "en" ? en : ar;
}

export function LanguageProvider({
  children,
  initialLang,
}: {
  children: React.ReactNode;
  initialLang: Lang;
}) {
  const [lang, setLangState] = useState<Lang>(initialLang);
  const [dict, setDict] = useState<Dict>({} as Dict);

  useEffect(() => {
    loadDict(lang).then(setDict);
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
  }, [lang]);

  const setLang = useCallback(async (l: Lang) => {
    await fetch("/api/settings/lang", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ language: l }),
    });
    document.cookie = `lang=${l};path=/;max-age=31536000`;
    setLangState(l);
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
