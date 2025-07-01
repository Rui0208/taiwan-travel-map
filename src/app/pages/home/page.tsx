"use client";

import { useSession } from "next-auth/react";
import dynamic from "next/dynamic";
import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "next/navigation";
import LoginModal from "@/components/LoginModal";

// 動態導入地圖組件以避免 SSR 問題
const TaiwanMap = dynamic(() => import("@/components/TaiwanMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mx-auto"></div>
        <p className="mt-4 text-gray-400 font-medium">Loading Map...</p>
      </div>
    </div>
  ),
});

export default function HomePage() {
  const { status } = useSession();
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const [mounted, setMounted] = useState(false);
  const [stats, setStats] = useState({ totalCounties: 0, totalPosts: 0 });
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  // 讀取 URL 參數中的模式
  const viewMode = searchParams.get('mode'); // 'mine' 或 null
  const showOnlyMine = viewMode === 'mine';

  useEffect(() => {
    setMounted(true);
  }, []);

  // 處理統計更新
  const handleStatsChange = useCallback((newStats: { totalCounties: number; totalPosts: number }) => {
    setStats(newStats);
  }, []);

  const handleDataChange = useCallback(() => {
    // 地圖資料變化時的處理
  }, []);

  if (status === "loading" || !mounted) {
    return (
      <main className="flex h-full items-center justify-center bg-black p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mx-auto"></div>
          <p className="mt-4 text-gray-400 font-medium">{t("loading")}</p>
        </div>
      </main>
    );
  }

  return (
    <main className="h-full flex flex-col bg-black overflow-hidden">
      {/* 標題欄 */}
      <div className="flex bg-black px-4 md:px-6 py-4">
        <div className="w-full mx-auto">
          <div className="flex justify-between items-center">
              <h1 className="w-full text-xl md:text-2xl font-bold text-white">
                {mounted ? t("app.name") : "Taiwan Travel Map"}
              </h1>
            
            {/* 訪客模式或登入使用者的統計 */}
            {status === "authenticated" ? (
              <div className="flex items-center justify-center md:justify-end gap-4 md:gap-6 text-gray-400">
                <div className="flex flex-col items-center gap-1">
                  <span className="text-base md:text-lg font-bold">
                    {stats.totalCounties}
                  </span>
                  <span className="text-xs md:text-sm whitespace-nowrap">{t("counties")}</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <span className="text-base md:text-lg font-bold">
                    {stats.totalPosts}
                  </span>
                  <span className="text-xs md:text-sm whitespace-nowrap">{t("posts")}</span>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-end gap-3 w-full md:gap-4">
                <div className="text-gray-400 text-sm text-center md:text-right">
                  {t("welcome_guest")}
                </div>
              
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 地圖容器 */}
      <div className="flex-1 min-h-0 relative">
        {/* 台灣地圖 */}
        <div className="absolute inset-0 bg-black">
          <TaiwanMap 
            onDataChange={handleDataChange} 
            onStatsChange={handleStatsChange}
            initialViewMode={showOnlyMine ? 'mine' : 'all'} // 傳遞初始視圖模式
          />
        </div>
      </div>

      {/* 登入 Modal */}
      {isLoginModalOpen && (
        <LoginModal
          isOpen={true}
          onClose={() => setIsLoginModalOpen(false)}
        />
      )}
    </main>
  );
} 