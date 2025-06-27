"use client";

import { useTranslation } from "react-i18next";
import {
  changeLanguage,
  getCurrentLanguage,
  type SupportedLanguage,
} from "@/i18n/utils";
import { useEffect, useState } from "react";

const languages = [
  { code: "en", name: "English" },
  { code: "zh-Hant", name: "繁體中文" },
] as const;

export function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const [mounted, setMounted] = useState(false);
  const [currentLanguage, setCurrentLanguage] =
    useState<SupportedLanguage>("en");

  useEffect(() => {
    setMounted(true);
    setCurrentLanguage(getCurrentLanguage());
  }, []);

  const handleLanguageChange = async (lng: SupportedLanguage) => {
    try {
      await i18n.changeLanguage(lng);
      await changeLanguage(lng);
      setCurrentLanguage(lng);
    } catch (error) {
      console.error("Failed to change language:", error);
    }
  };

  // 在客戶端渲染之前不顯示組件
  if (!mounted) {
    return null;
  }

  return (
    <div className="bg-black/80 backdrop-blur-sm rounded-xl p-3 shadow-2xl border border-gray-700/50">
      <div className="flex items-center gap-3">
        {/* 地球圖標 */}
        <div className="w-8 h-8 bg-gray-800 rounded-full flex items-center justify-center">
          <svg className="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        
        {/* 語言按鈕 */}
        <div className="flex gap-1">
          {languages.map((language) => (
            <button
              key={language.code}
              onClick={() => handleLanguageChange(language.code as SupportedLanguage)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
                currentLanguage === language.code
                  ? "bg-white text-black"
                  : "bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white"
              }`}
            >
              {language.code === "en" ? "EN" : "中"}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
