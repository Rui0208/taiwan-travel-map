import i18next from "./client";

export type SupportedLanguage = "en" | "zh-Hant";

export const changeLanguage = async (lng: SupportedLanguage) => {
  try {
    await i18next.changeLanguage(lng);
    return true;
  } catch (error) {
    console.error("Failed to change language:", error);
    return false;
  }
};

export const getCurrentLanguage = (): SupportedLanguage => {
  return (i18next.language as SupportedLanguage) || "en";
};

export const isSupportedLanguage = (
  lang: string
): lang is SupportedLanguage => {
  return ["en", "zh-Hant"].includes(lang);
};
