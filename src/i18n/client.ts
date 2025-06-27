"use client";

import i18next from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

// 匯入翻譯資源
import en from "../../public/locales/common/en.json";
import zhHant from "../../public/locales/common/zh-Hant.json";

export const defaultNS = "common";

const resources = {
  en: {
    [defaultNS]: en,
  },
  "zh-Hant": {
    [defaultNS]: zhHant,
  },
} as const;

i18next
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    defaultNS,
    fallbackLng: "en",
    supportedLngs: ["en", "zh-Hant"],
    ns: [defaultNS],
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ["localStorage", "navigator"],
      caches: ["localStorage"],
    },
    react: {
      useSuspense: false,
    },
  });

export default i18next;
