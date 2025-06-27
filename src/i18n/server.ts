import { createInstance } from "i18next";
import { initReactI18next } from "react-i18next/initReactI18next";

import { defaultNS } from "./client";

// 匯入翻譯資源
import en from "../../public/locales/common/en.json";
import zhHant from "../../public/locales/common/zh-Hant.json";

const resources = {
  en: {
    [defaultNS]: en,
  },
  "zh-Hant": {
    [defaultNS]: zhHant,
  },
} as const;

export async function initI18next(lng: string, ns: string = defaultNS) {
  const i18nInstance = createInstance();
  await i18nInstance.use(initReactI18next).init({
    lng,
    ns,
    defaultNS,
    fallbackLng: "en",
    supportedLngs: ["en", "zh-Hant"],
    fallbackNS: defaultNS,
    resources,
    interpolation: {
      escapeValue: false,
    },
  });

  return i18nInstance;
}
