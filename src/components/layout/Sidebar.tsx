"use client";

import { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { useTranslation } from "react-i18next";
import { usePathname, useRouter } from "next/navigation";
import AddVisitModal from "@/components/AddVisitModal";
import LoginModal from "@/components/LoginModal";
import {
  changeLanguage,
  getCurrentLanguage,
  type SupportedLanguage,
} from "@/i18n/utils";

interface SidebarProps {
  onDataChange?: () => void;
}

const Sidebar = ({ onDataChange }: SidebarProps) => {
  const { status } = useSession();
  const { t, i18n } = useTranslation();
  const pathname = usePathname();
  const router = useRouter();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState<SupportedLanguage>("en");
  const [unreadCount, setUnreadCount] = useState(0);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    setMounted(true);
    setCurrentLanguage(getCurrentLanguage());
  }, []);

  // 獲取未讀通知數量
  useEffect(() => {
    const fetchUnreadCount = async () => {
      if (status === "authenticated") {
        try {
          const response = await fetch("/api/v1/social/notifications?unread_only=true&limit=1");
          const result = await response.json();
          if (result.success) {
            setUnreadCount(result.unreadCount || 0);
          }
        } catch (error) {
          console.error("獲取未讀通知數量失敗:", error);
        }
      }
    };

    fetchUnreadCount();
    
    // 每30秒更新一次未讀數量
    const interval = setInterval(fetchUnreadCount, 30000);

    // 監聽視窗焦點事件，當用戶切換回應用時更新計數
    const handleFocus = () => {
      if (status === "authenticated") {
        fetchUnreadCount();
      }
    };

    // 監聽路由變化，當離開通知頁面時更新計數
    const handleRouteChange = () => {
      if (status === "authenticated" && pathname !== "/pages/notifications") {
        setTimeout(fetchUnreadCount, 500); // 延遲執行以確保 API 請求完成
      }
    };

    // 監聽通知已讀事件
    const handleNotificationRead = () => {
      if (status === "authenticated") {
        fetchUnreadCount();
      }
    };

    window.addEventListener('focus', handleFocus);
    window.addEventListener('notificationRead', handleNotificationRead);
    handleRouteChange(); // 初始檢查

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('notificationRead', handleNotificationRead);
    };
  }, [status, pathname]);

  const handleLanguageChange = async (lng: SupportedLanguage) => {
    try {
      await i18n.changeLanguage(lng);
      await changeLanguage(lng);
      setCurrentLanguage(lng);
    } catch (error) {
      console.error("Failed to change language:", error);
    }
  };

  const languages = [
    { code: "en" as SupportedLanguage, label: "EN" },
    { code: "zh-Hant" as SupportedLanguage, label: "中" },
  ];

  const handleAddSuccess = () => {
    setIsAddModalOpen(false);
    if (onDataChange) {
      onDataChange();
    }
  };

  const handleAddClick = () => {
    if (status === "unauthenticated") {
      setIsLoginModalOpen(true);
      return;
    }
    setIsAddModalOpen(true);
  };

  const handleLogout = async () => {
    try {
      // 使用 NextAuth signOut
      try {
        console.log("嘗試 NextAuth signOut...");
        await signOut({ 
          callbackUrl: "/pages/home",
          redirect: false
        });
        
        console.log("NextAuth 登出成功");
        
        // 清除客戶端狀態
        if (typeof window !== 'undefined') {
          localStorage.clear();
          sessionStorage.clear();
        }
        
        // 手動跳轉到首頁
        window.location.href = "/pages/home";
        return;
      } catch (nextAuthError) {
        console.error("NextAuth 登出失敗:", nextAuthError);
      }
      
      // 備用方案：強制登出
      console.log("使用強制登出方案...");
      if (typeof window !== 'undefined') {
        // 清除所有存儲
        localStorage.clear();
        sessionStorage.clear();
        
        // 清除所有 cookies
        document.cookie.split(";").forEach((c) => {
          const eqPos = c.indexOf("=");
          const name = eqPos > -1 ? c.substr(0, eqPos) : c;
          document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
          document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=" + window.location.hostname;
        });
        
        // 強制跳轉
        window.location.href = "/pages/home";
      }
      
    } catch (error) {
      console.error("登出失敗:", error);
      
      // 最終備用方案
      if (typeof window !== 'undefined') {
        alert("登出遇到問題，將重新載入頁面");
        window.location.reload();
      }
    }
  };

  const navigationItems = [
    {
      id: "home",
      label: t("sidebar.home", "主頁"),
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      ),
      href: "/pages/home",
      isActive: mounted && pathname === "/pages/home",
    },
    {
      id: "search",
      label: t("sidebar.search", "搜尋"),
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      ),
      href: "/pages/search",
      isActive: mounted && pathname === "/pages/search",
    },
    {
      id: "add",
      label: t("sidebar.add", "新增"),
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
      ),
      onClick: handleAddClick,
      isActive: false,
    },
    {
      id: "notifications",
      label: t("sidebar.notifications", "通知"),
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
      ),
      href: "/pages/notifications",
      isActive: mounted && pathname === "/pages/notifications",
    },
    {
      id: "profile",
      label: t("sidebar.profile", "個人檔案"),
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
      href: "/pages/profile",
      isActive: mounted && pathname === "/pages/profile",
    },
  ];

  const handleNavClick = (item: typeof navigationItems[0]) => {
    if (item.onClick) {
      item.onClick();
    } else if (item.href) {
      router.push(item.href);
    }
  };

  const handleMouseEnter = (e: React.MouseEvent, itemId: string) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setTooltipPosition({
      x: rect.right + 10,
      y: rect.top + rect.height / 2,
    });
    setHoveredItem(itemId);
  };

  const handleMouseLeave = () => {
    setHoveredItem(null);
  };

  return (
    <>
      {/* 桌面版 Sidebar - 左側垂直 */}
      <div className="hidden md:flex fixed left-0 top-0 h-full w-20 bg-black flex-col z-40">
        {/* Logo */}
        <div className="p-4">
          <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-black" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
            </svg>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 flex flex-col items-center py-8 space-y-8">
          {navigationItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleNavClick(item)}
              onMouseEnter={(e) => handleMouseEnter(e, item.id)}
              onMouseLeave={handleMouseLeave}
              className={`w-12 h-12 flex items-center justify-center rounded-xl transition-all duration-200 relative ${
                item.isActive
                  ? "text-white"
                  : "text-gray-400 hover:text-white hover:bg-gray-800"
              }`}
            >
              {item.icon}
              {/* 未讀通知數量顯示 */}
              {item.id === "notifications" && unreadCount > 0 && (
                <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs font-bold">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                </div>
              )}
            </button>
          ))}
        </nav>

        {/* Logout Button (只在已登入時顯示) */}
        {status === "authenticated" && (
          <div className="px-4 pb-4">
            <button
              onClick={handleLogout}
              onMouseEnter={(e) => handleMouseEnter(e, "logout")}
              onMouseLeave={handleMouseLeave}
              className="w-12 h-12 bg-gray-800 hover:bg-red-600 rounded-xl flex items-center justify-center transition-all duration-200 group"
            >
              <svg className="w-5 h-5 text-gray-300 group-hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        )}

        {/* Language Switcher */}
        <div className="p-4">
          <div className="flex flex-col items-center space-y-2">
            {/* 地球圖標 */}
            <div className="w-8 h-8 bg-gray-800 rounded-full flex items-center justify-center mb-2">
              <svg className="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            
            {/* 語言按鈕 */}
            {languages.map((language) => (
              <button
                key={language.code}
                onClick={() => handleLanguageChange(language.code)}
                className={`w-12 h-6 rounded-md text-xs font-medium transition-all duration-200 ${
                  currentLanguage === language.code
                    ? "bg-white text-black"
                    : "bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white"
                }`}
                title={language.code === "en" ? "English" : "繁體中文"}
              >
                {language.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 手機版 Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 h-20 bg-black border-t border-gray-800 z-40">
        <div className="flex items-center justify-around h-full px-4">
          {/* Navigation Items */}
          <div className="flex items-center justify-around flex-1 max-w-sm">
            {navigationItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleNavClick(item)}
                className={`flex flex-col items-center justify-center w-12 h-12 rounded-xl transition-all duration-200 relative ${
                  item.isActive
                    ? "text-white"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                <div className="relative">
                  {item.icon}
                  {/* 未讀通知數量顯示 */}
                  {item.id === "notifications" && unreadCount > 0 && (
                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs font-bold">
                        {unreadCount > 99 ? "99+" : unreadCount}
                      </span>
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>

          {/* 右側功能區 */}
          <div className="flex items-center space-x-2 ml-4">
            {/* 語言切換 */}
            <div className="flex items-center space-x-1">
              {languages.map((language) => (
                <button
                  key={language.code}
                  onClick={() => handleLanguageChange(language.code)}
                  className={`w-8 h-6 rounded text-xs font-medium transition-all duration-200 ${
                    currentLanguage === language.code
                      ? "bg-white text-black"
                      : "bg-gray-800 text-gray-300"
                  }`}
                >
                  {language.label}
                </button>
              ))}
            </div>

            {/* 登出按鈕 */}
            {status === "authenticated" && (
              <button
                onClick={handleLogout}
                className="w-8 h-8 bg-gray-800 rounded flex items-center justify-center transition-all duration-200"
              >
                <svg className="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Tooltip - 只在桌面版顯示 */}
      {hoveredItem && (
        <div
          className="hidden md:block fixed z-50 bg-gray-800 text-white px-3 py-2 rounded-lg text-sm font-medium shadow-lg pointer-events-none"
          style={{
            left: tooltipPosition.x,
            top: tooltipPosition.y,
            transform: 'translateY(-50%)',
          }}
        >
          {hoveredItem === "logout" ? t("sidebar.logout") : 
           navigationItems.find(item => item.id === hoveredItem)?.label}
        </div>
      )}

      {/* Add Visit Modal */}
      <AddVisitModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={handleAddSuccess}
      />

      {/* Login Modal */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
      />
    </>
  );
};

export default Sidebar; 