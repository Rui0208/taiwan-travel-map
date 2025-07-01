"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useTranslation } from "react-i18next";
import { useRouter } from "next/navigation";
import Image from "next/image";
import dynamic from "next/dynamic";
import { Notification } from "@/api/types";
import { generateNotificationDisplayContent } from "@/lib/notification-utils";

// 動態導入登入模態框
const LoginModal = dynamic(() => import("@/components/LoginModal"), {
  ssr: false,
  loading: () => null,
});

interface NotificationResponse {
  success: boolean;
  data: Notification[];
  pagination: {
    page: number;
    limit: number;
    hasMore: boolean;
  };
  unreadCount: number;
}

export default function NotificationsPage() {
  const { status } = useSession();
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [mounted, setMounted] = useState(false);
  const [markingAllRead, setMarkingAllRead] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // 獲取通知
  const fetchNotifications = async (pageNum: number = 1, append: boolean = false) => {
    try {
      if (pageNum === 1) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      const response = await fetch(`/api/v1/social/notifications?page=${pageNum}&limit=20`);
      const result: NotificationResponse = await response.json();

      if (result.success) {
        if (append) {
          setNotifications(prev => [...prev, ...result.data]);
        } else {
          setNotifications(result.data);
        }
        setHasMore(result.pagination.hasMore);
        setUnreadCount(result.unreadCount);
        setPage(pageNum);
      } else {
        setError("獲取通知失敗");
      }
    } catch (error) {
      console.error("獲取通知錯誤:", error);
      setError("獲取通知失敗");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  // 加載更多通知
  const loadMore = () => {
    if (hasMore && !loadingMore) {
      fetchNotifications(page + 1, true);
    }
  };

  // 標記單個通知為已讀
  const markAsRead = async (notificationId: string) => {
    try {
      const response = await fetch("/api/v1/social/notifications", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          notificationIds: [notificationId],
        }),
      });

      if (response.ok) {
        setNotifications(prev =>
          prev.map(notification =>
            notification.id === notificationId
              ? { ...notification, is_read: true }
              : notification
          )
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
        
        // 觸發自定義事件通知其他組件更新未讀數量
        window.dispatchEvent(new CustomEvent('notificationRead'));
      }
    } catch (error) {
      console.error("標記已讀失敗:", error);
    }
  };

  // 標記所有通知為已讀
  const markAllAsRead = async () => {
    if (unreadCount === 0 || markingAllRead) return;

    try {
      setMarkingAllRead(true);
      const response = await fetch("/api/v1/social/notifications", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          markAllRead: true,
        }),
      });

      if (response.ok) {
        setNotifications(prev =>
          prev.map(notification => ({ ...notification, is_read: true }))
        );
        setUnreadCount(0);
        
        // 觸發自定義事件通知其他組件更新未讀數量
        window.dispatchEvent(new CustomEvent('notificationRead'));
      }
    } catch (error) {
      console.error("標記全部已讀失敗:", error);
    } finally {
      setMarkingAllRead(false);
    }
  };

  // 處理通知點擊
  const handleNotificationClick = (notification: Notification) => {
    // 如果未讀，標記為已讀
    if (!notification.is_read) {
      markAsRead(notification.id);
    }

    // 根據通知類型導航到對應頁面
    if (notification.post_id) {
      // 導航到單篇文章詳情頁
      router.push(`/pages/post/${notification.post_id}`);
    }
  };

  // 格式化時間
  const formatTime = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) {
      return t("just_now");
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return t("minutes_ago", { count: minutes });
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return t("hours_ago", { count: hours });
    } else {
      const days = Math.floor(diffInSeconds / 86400);
      return t("days_ago", { count: days });
    }
  };

  // 獲取通知圖標 - 顯示發送者頭像
  const getNotificationIcon = (notification: Notification) => {
    const avatarUrl = notification.actor?.image;
    const actorName = notification.actor?.name || "用戶";

    if (avatarUrl) {
      return (
        <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 border-2 border-gray-600">
          <Image
            src={avatarUrl}
            alt={`${actorName}的頭像`}
            width={40}
            height={40}
            className="w-full h-full object-cover"
          />
        </div>
      );
    }

    // 如果沒有頭像，顯示預設圓形頭像
    return (
      <div className="w-10 h-10 bg-gray-600 rounded-full flex items-center justify-center">
        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      </div>
    );
  };

  // 生成通知顯示內容
  const getNotificationContent = (notification: Notification) => {
    // 優先使用 actor 物件中的 name，如果沒有才使用 actor_name 欄位
    const actorName = notification.actor?.name || notification.actor_name || '用戶';
    
    // 如果有 actor_name 欄位，使用新的動態翻譯方式
    if (notification.type) {
      return generateNotificationDisplayContent(
        notification.type,
        actorName,
        i18n.language as 'zh-Hant' | 'en'
      );
    }
    
    // 如果沒有，回退到原本的 content 欄位
    return notification.content || '';
  };

  useEffect(() => {
    if (status === "authenticated") {
      fetchNotifications();
    }
  }, [status]);

  if (status === "loading" || !mounted) {
    return (
      <main className="h-full flex items-center justify-center bg-black">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mx-auto"></div>
          <p className="mt-4 text-gray-400 font-medium">{t("loading")}</p>
        </div>
      </main>
    );
  }

  if (status === "unauthenticated") {
    return (
      <>
        <main className="h-full flex flex-col items-center justify-center bg-black p-6">
          <div className="text-center max-w-md">
           
            <h1 className="text-2xl font-bold text-white mb-4">{t("sidebar.notifications")}</h1>
            <p className="text-gray-400 mb-6">
            {t("notifications.login_desc")}
            </p>
            <button
              onClick={() => setIsLoginModalOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl transition-colors"
            >
              {t("login")}
            </button>
          </div>
        </main>

        {/* 登入 Modal - 未認證狀態 */}
        {isLoginModalOpen && (
          <LoginModal
            isOpen={true}
            onClose={() => setIsLoginModalOpen(false)}
          />
        )}
      </>
    );
  }

  return (
    <main className="h-full bg-black overflow-y-auto [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-gray-900 [&::-webkit-scrollbar-thumb]:bg-gray-700 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-gray-600">
      <div className="max-w-3xl mx-auto px-4">
        {/* 通知標題欄 */}
        <div className="py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-white">{t("sidebar.notifications")}</h1>
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              disabled={markingAllRead}
              className="text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors disabled:opacity-50"
            >
              {markingAllRead ? t("notifications.marking") : t("notifications.mark_all_read")}
            </button>
          )}
        </div>

        {/* 通知內容 */}
        <div className="pb-20">
          {error && (
            <div className="bg-red-900/50 border border-red-700 rounded-xl p-4 mb-6">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-red-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <span className="text-red-200">{error}</span>
              </div>
            </div>
          )}

          {loading ? (
            <div className="flex flex-col items-center justify-center h-96">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mb-4"></div>
              <p className="text-gray-400">{t("notifications.loading")}</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-96 text-center">
              <div className="w-24 h-24 bg-gray-800 rounded-full flex items-center justify-center mb-6">
                <svg className="w-12 h-12 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">{t("notifications.no_notifications")}</h3>
              <p className="text-gray-400 max-w-sm">
                {t("notifications.no_notifications_desc")}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`p-4 rounded-xl cursor-pointer transition-all duration-200 hover:bg-gray-800/50 ${
                    !notification.is_read 
                      ? "bg-gray-800/30 border border-blue-500/30" 
                      : "bg-gray-900/30"
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    {/* 通知圖標 */}
                    {getNotificationIcon(notification)}

                    {/* 通知內容 */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <p className="text-white font-medium text-sm">
                          {getNotificationContent(notification)}
                        </p>
                        {!notification.is_read && (
                          <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></div>
                        )}
                      </div>
                      
                      {/* 時間 */}
                      <p className="text-gray-400 text-xs mt-1">
                        {formatTime(notification.created_at)}
                      </p>
                    </div>

                    {/* 相關圖片 */}
                    {notification.post?.image_urls?.[0] && (
                      <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
                        <Image
                          src={notification.post.image_urls[0]}
                          alt="貼文圖片"
                          width={48}
                          height={48}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {/* 載入更多按鈕 */}
              {hasMore && (
                <div className="text-center pt-6">
                  <button
                    onClick={loadMore}
                    disabled={loadingMore}
                    className="bg-gray-800 hover:bg-gray-700 text-white px-6 py-3 rounded-xl transition-colors disabled:opacity-50"
                  >
                    {loadingMore ? t("notifications.loading_more") : t("notifications.load_more")}
                  </button>
                </div>
              )}
            </div>
          )}
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