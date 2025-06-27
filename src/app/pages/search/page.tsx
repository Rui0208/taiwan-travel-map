"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useTranslation } from "react-i18next";

import SocialPostCard from "@/components/SocialPostCard";
import EditVisitModal from "@/components/EditVisitModal";
import LoginModal from "@/components/LoginModal";
import { type PostWithDetails, type VisitedPlace } from "@/api/types";

interface SearchResult {
  success: boolean;
  data: PostWithDetails[];
  count: number;
}

export default function SearchPage() {
  const { data: session, status } = useSession();
  const { t } = useTranslation();
  const [mounted, setMounted] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<PostWithDetails[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedVisit, setSelectedVisit] = useState<VisitedPlace | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);



  useEffect(() => {
    setMounted(true);
    
    // 清理函數：組件卸載時清除定時器
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  // 搜尋函數
  const performSearch = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      setHasSearched(false);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    setError(null);

    try {
      const response = await fetch(`/api/v1/content/search?q=${encodeURIComponent(query.trim())}`);
      const result: SearchResult = await response.json();

      if (!response.ok) {
        throw new Error(result.success ? "搜尋失敗" : "搜尋失敗");
      }

      setSearchResults(result.data || []);
      setHasSearched(true);
    } catch (err) {
      console.error("搜尋錯誤:", err);
      setError(err instanceof Error ? err.message : "搜尋時發生錯誤");
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  // 處理搜尋輸入變化
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    
    // 清除之前的定時器
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    // 設置新的防抖定時器
    searchTimeoutRef.current = setTimeout(() => {
      performSearch(value);
    }, 500);
  };

  // 處理文章互動
  const handleLike = async (postId: string) => {
    try {
      const post = searchResults.find(p => p.id === postId);
      if (!post) return;

      const endpoint = post.is_liked ? `/api/v1/social/likes?post_id=${postId}` : "/api/v1/social/likes";
      const method = post.is_liked ? "DELETE" : "POST";
      
      const response = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: method === "POST" ? JSON.stringify({ post_id: postId }) : undefined,
      });

      if (!response.ok) {
        throw new Error("操作失敗");
      }

      // 更新本地狀態
      setSearchResults(prevResults => 
        prevResults.map(post => 
          post.id === postId 
            ? { 
                ...post, 
                is_liked: !post.is_liked,
                likes_count: post.is_liked 
                  ? (post.likes_count || 1) - 1 
                  : (post.likes_count || 0) + 1
              }
            : post
        )
      );
    } catch (error) {
      console.error("按讚操作失敗:", error);
    }
  };

  const handleComment = async (postId: string, content: string) => {
    try {
      const response = await fetch("/api/v1/social/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ post_id: postId, content }),
      });

      if (!response.ok) {
        throw new Error("留言失敗");
      }

      // 重新搜尋以更新留言數據
      if (searchQuery.trim()) {
        performSearch(searchQuery);
      }
    } catch (error) {
      console.error("留言失敗:", error);
    }
  };

  const handleCommentLike = async (commentId: string) => {
    try {
      const postWithComment = searchResults.find(post => 
        post.comments?.some(comment => comment.id === commentId)
      );
      
      if (!postWithComment) return;

      const comment = postWithComment.comments?.find(c => c.id === commentId);
      if (!comment) return;

      const endpoint = comment.is_liked 
                  ? `/api/v1/social/likes?comment_id=${commentId}` 
        : "/api/v1/social/likes";
      const method = comment.is_liked ? "DELETE" : "POST";
      
      const response = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: method === "POST" ? JSON.stringify({ comment_id: commentId }) : undefined,
      });

      if (!response.ok) {
        throw new Error("操作失敗");
      }

      // 重新搜尋以更新資料
      if (searchQuery.trim()) {
        performSearch(searchQuery);
      }
    } catch (error) {
      console.error("留言按讚操作失敗:", error);
    }
  };

  const handleCommentEdit = async (commentId: string, newContent: string) => {
    try {
      const response = await fetch(`/api/v1/social/comments/${commentId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newContent }),
      });

      if (!response.ok) {
        throw new Error("編輯失敗");
      }

      // 重新搜尋以更新資料
      if (searchQuery.trim()) {
        performSearch(searchQuery);
      }
    } catch (error) {
      console.error("編輯留言失敗:", error);
    }
  };

  const handleCommentDelete = async (commentId: string) => {
    try {
      const response = await fetch(`/api/v1/social/comments/${commentId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("刪除失敗");
      }

      // 重新搜尋以更新資料
      if (searchQuery.trim()) {
        performSearch(searchQuery);
      }
    } catch (error) {
      console.error("刪除留言失敗:", error);
    }
  };

  const handleEdit = (postId: string) => {
    const post = searchResults.find(p => p.id === postId);
    if (post) {
      // 將 PostWithDetails 轉換為 VisitedPlace
      const visitedPlace: VisitedPlace = {
        id: post.id,
        user_id: post.user_id,
        county: post.county,
        image_url: post.image_url,
        image_urls: post.image_urls,
        ig_url: post.ig_url,
        created_at: post.created_at,
        updated_at: post.updated_at,
        note: post.note,
        title: post.title || post.note?.substring(0, 50) || "",
        location: post.location,
        instagram_url: post.instagram_url,
        visited_at: post.visited_at,
        user: post.user,
      };
      setSelectedVisit(visitedPlace);
      setIsEditModalOpen(true);
    }
  };

  const handleEditSuccess = async () => {
    setIsEditModalOpen(false);
    setSelectedVisit(null);
    // 重新搜尋以更新資料
    if (searchQuery.trim()) {
      performSearch(searchQuery);
    }
  };

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

  // 訪客模式的互動處理
  const handleGuestInteraction = (action: string) => {
    console.log(`訪客嘗試進行 ${action}，需要登入`);
    setIsLoginModalOpen(true);
  };

  return (
    <main className="h-full bg-black overflow-y-auto [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-gray-900 [&::-webkit-scrollbar-thumb]:bg-gray-700 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-gray-600">
      <div className="max-w-3xl mx-auto px-4">
        {/* 搜尋標題欄 */}
        <div className="py-4">
          <h1 className="text-2xl font-bold text-white">{t("search")}</h1>
          {status === "unauthenticated" && (
            <div className="mt-3 bg-blue-900/30 border border-blue-500/30 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-blue-300 text-sm">您正在以訪客模式瀏覽，可搜尋但無法互動</span>
                </div>
                <button
                  onClick={() => setIsLoginModalOpen(true)}
                  className="text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors"
                >
                  登入
                </button>
              </div>
            </div>
          )}
        </div>

        {/* 搜尋框 */}
        <div className="pb-4">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={handleSearchChange}
              placeholder={t("search_placeholder")}
              className="w-full bg-gray-900 text-white placeholder-gray-500 px-4 py-3 pl-12 rounded-xl border border-gray-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition-colors"
            />
            <svg
              className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            {isSearching && (
              <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-500 border-t-transparent"></div>
              </div>
            )}
          </div>
        </div>

        {/* 搜尋結果區域 */}
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

          {!hasSearched && !isSearching ? (
            // 初始狀態
            <div className="flex flex-col items-center justify-center h-96 text-center">
              <div className="w-24 h-24 bg-gray-800 rounded-full flex items-center justify-center mb-6">
                <svg className="w-12 h-12 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">
                {t("search_for_content")}
              </h3>
              <p className="text-gray-400 max-w-sm">
                {t("search_initial_desc")}
              </p>
            </div>
          ) : hasSearched && searchResults.length === 0 && !isSearching ? (
            // 無結果狀態
            <div className="flex flex-col items-center justify-center h-96 text-center">
              <div className="w-24 h-24 bg-gray-800 rounded-full flex items-center justify-center mb-6">
                <svg className="w-12 h-12 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.29-1.2-5.535-2.877m0 0a7.962 7.962 0 01-2.465-2.226m0 0L12 6.5l7.465 3.397m0 0A7.962 7.962 0 0117 12v4.291" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">
                {t("no_search_results")}
              </h3>
              <p className="text-gray-400 max-w-sm">
                {t("no_search_results_desc")}
              </p>
            </div>
          ) : (
            // 搜尋結果
            <div className="space-y-6">
              {searchResults.length > 0 && (
                <div className="text-gray-400 text-sm mb-4">
                  {t("search_results_count", { count: searchResults.length })}
                </div>
              )}
              {searchResults.map((post) => (
                <SocialPostCard
                  key={post.id}
                  post={post}
                  currentUserId={session?.user?.id}
                  onLike={status === "authenticated" ? handleLike : () => handleGuestInteraction("按讚")}
                  onComment={status === "authenticated" ? handleComment : () => handleGuestInteraction("留言")}
                  onCommentLike={status === "authenticated" ? handleCommentLike : () => handleGuestInteraction("留言按讚")}
                  onCommentEdit={status === "authenticated" ? handleCommentEdit : () => handleGuestInteraction("編輯留言")}
                  onCommentDelete={status === "authenticated" ? handleCommentDelete : () => handleGuestInteraction("刪除留言")}
                  onEdit={status === "authenticated" ? handleEdit : () => handleGuestInteraction("編輯文章")}
                  isGuest={status !== "authenticated"}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 編輯 Modal */}
      {selectedVisit && (
        <EditVisitModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setSelectedVisit(null);
          }}
          onSuccess={handleEditSuccess}
          visitData={selectedVisit}
        />
      )}

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