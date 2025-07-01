"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useIsMobile } from "@/app/hooks/useIsMobile";
interface MapViewToggleProps {
  showOnlyMine: boolean;
  onToggle: (showOnlyMine: boolean) => void;
  currentUserEmail?: string;
}

export default function MapViewToggle({
  showOnlyMine,
  onToggle,
  currentUserEmail,
}: MapViewToggleProps) {
  const { t } = useTranslation();
  const [hoveredButton, setHoveredButton] = useState<string | null>(null);
  const isMobile = useIsMobile();
  // 只有登入用戶才顯示視圖切換
  if (!currentUserEmail) return null;

  return (
    <div className={`absolute right-6 z-10 ${isMobile ? "bottom-24" : "bottom-6"}`}>
      {/* Tooltip */}
      {hoveredButton && (
        <div className="absolute bottom-full right-0 mb-3 px-3 py-2 bg-gray-900/95 backdrop-blur-sm text-white text-xs rounded-lg border border-gray-600 shadow-xl whitespace-nowrap">
          <div className="relative">
            {hoveredButton === 'all' ? t("map_view.showing_all") : t("map_view.showing_mine")}
            {/* 箭頭 */}
            <div className="absolute top-full right-4 w-2 h-2 bg-gray-900 border-r border-b border-gray-600 transform rotate-45 translate-y-[-50%]"></div>
          </div>
        </div>
      )}

      {/* 主要切換器 */}
      <div className="bg-black/90 backdrop-blur-sm rounded-full border border-gray-600 shadow-xl">
        <div className="relative flex">
          {/* 滑動背景 */}
          <div
            className={`absolute top-0.5 bottom-0.5 w-[calc(50%-2px)] bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-transform duration-300 ease-out shadow-lg ${
              showOnlyMine ? "transform translate-x-[calc(100%+2px)]" : ""
            }`}
          />
          
          {/* 按鈕 */}
          <button
            onClick={() => onToggle(false)}
            onMouseEnter={() => setHoveredButton('all')}
            onMouseLeave={() => setHoveredButton(null)}
            className={`relative z-10 px-4 py-2.5 text-sm font-medium rounded-full transition-all duration-300 ${
              !showOnlyMine
                ? "text-white"
                : "text-gray-300 hover:text-white"
            }`}
          >
            <div className="flex items-center space-x-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <span>{t("map_view.all_posts")}</span>
            </div>
          </button>
          
          <button
            onClick={() => onToggle(true)}
            onMouseEnter={() => setHoveredButton('mine')}
            onMouseLeave={() => setHoveredButton(null)}
            className={`relative z-10 px-4 py-2.5 text-sm font-medium rounded-full transition-all duration-300 ${
              showOnlyMine
                ? "text-white"
                : "text-gray-300 hover:text-white"
            }`}
          >
            <div className="flex items-center space-x-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span>{t("map_view.my_posts")}</span>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
} 