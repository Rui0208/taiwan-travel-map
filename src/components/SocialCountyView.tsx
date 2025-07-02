"use client";

import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import useSWR from "swr";
import { type VisitedPlace, type PostWithDetails, COUNTY_NAMES, COUNTY_NAMES_REVERSE } from "@/api/types";
import { endpoints } from "@/api/endpoints";
import { fetcher } from "@/api/fetcher";
import SocialPostCard from "./SocialPostCard";

interface SocialCountyViewProps {
  countyName: string;
  visitedData: VisitedPlace[];
  onClose: () => void;
  onEdit: (id: string) => void;
  onAdd: () => void;
  currentUserId?: string;
  isGuest?: boolean;
  onGuestInteraction?: () => void;
  showOnlyMine?: boolean;
}

export default function SocialCountyView({
  countyName,
  visitedData,
  onClose,
  onEdit,
  onAdd,
  currentUserId,
  isGuest = false,
  onGuestInteraction,
  showOnlyMine = false,
}: SocialCountyViewProps) {
  const { t } = useTranslation();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // 使用新的 posts API 獲取帶有社交資料的文章
  // 只有在已登入模式下才調用API，訪客模式的資料已經從縣市頁面傳入
  const { data: postsData, mutate: mutatePosts, error: postsError } = useSWR<{ data: PostWithDetails[] }>(
    !isGuest ? (showOnlyMine ? endpoints.posts.byUser(currentUserId) : endpoints.posts.byCounty(countyName)) : null,
    fetcher
  );

  // 根據當前語言決定顯示的縣市名稱
  const displayCountyName = t(`countiesArray.${countyName}`, countyName);
  
  // 處理資料載入狀態
  const postsWithSocialData: PostWithDetails[] = (() => {
    if (isGuest) {
      // 訪客模式：直接使用傳入的 visitedData（已包含社交資料）
      return visitedData as PostWithDetails[];
    }
    
    // 已登入模式：優先使用API資料，否則使用傳入資料
    if (postsData?.data) {
      if (showOnlyMine) {
        // mine 模式：API 已經返回當前用戶的所有文章，需要篩選當前縣市
        const allPossibleEnglishNames = Object.entries(COUNTY_NAMES)
          .filter(([zh]) => zh === countyName)
          .map(([, en]) => en as string)
          .concat(
            Object.keys(COUNTY_NAMES_REVERSE).filter(
              en => COUNTY_NAMES_REVERSE[en] === countyName
            )
          );
        const legacyEnglish = allPossibleEnglishNames.map(name => name + " County");
        const allNames: string[] = [
          ...allPossibleEnglishNames,
          ...legacyEnglish,
          countyName,
          displayCountyName,
        ];
        
        const filteredData = postsData.data.filter((item) => {
          const matches = allNames.includes(item.county);
          return matches;
        });
        
        return filteredData;
      } else {
        // 所有人模式：posts API已經按縣市篩選，直接返回
        return postsData.data;
      }
    }
    
    // 如果有錯誤，回退到原始資料
    if (postsError) {
      console.warn("API 錯誤，回退到原始資料:", postsError);
    }
    
    // 回退到原始資料（加上預設社交資料）
    return visitedData.map(post => ({
      ...post,
      likes_count: 0,
      is_liked: false,
      comments_count: 0,
      comments: [],
      recent_likes: [],
    }));
  })();
  
  const visitCount = postsWithSocialData.length;

  // 真實的按讚處理函數
  const handleLike = async (postId: string) => {
    if (isGuest) {
      onGuestInteraction?.();
      return;
    }

    try {
      const post = postsWithSocialData.find((p: PostWithDetails) => p.id === postId);
      if (!post) return;

      // 樂觀更新按讚狀態
      mutatePosts(
        (currentData) => {
          if (!currentData?.data) return currentData;
          
          return {
            ...currentData,
            data: currentData.data.map((p) => {
              if (p.id === postId) {
                return {
                  ...p,
                  is_liked: !p.is_liked,
                  likes_count: (p.likes_count || 0) + (p.is_liked ? -1 : 1),
                };
              }
              return p;
            }),
          };
        },
        false // 不重新驗證
      );

      if (post.is_liked) {
        // 取消按讚
        const response = await fetch(endpoints.likes.delete(postId), {
          method: "DELETE",
        });

        if (!response.ok) {
          const error = await response.json();
          // 如果是 409，代表已經按過讚，不用報錯
          if (response.status === 409) {
            // 可以選擇忽略或顯示「已經按過讚」
            return;
          }
          throw new Error(error.error || "取消按讚失敗");
        }
      } else {
        // 新增按讚
        const response = await fetch(endpoints.likes.create, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ post_id: postId }),
        });

        if (!response.ok) {
          const error = await response.json();
          // 如果是 409，代表已經按過讚，不用報錯
          if (response.status === 409) {
            // 可以選擇忽略或顯示「已經按過讚」
            return;
          }
          throw new Error(error.error || "按讚失敗");
        }
      }

      // 只在成功後通知父組件更新，避免重複呼叫
      // 移除 onRefresh() 呼叫，因為樂觀更新已經處理了 UI 更新
      // onRefresh();
    } catch (error) {
      console.error("按讚操作失敗:", error);
      // 發生錯誤時重新獲取資料
      await mutatePosts();
      // 可以在這裡添加錯誤提示，但不使用 alert
      console.error(`操作失敗：${error instanceof Error ? error.message : "未知錯誤"}`);
    }
  };

  // 真實的留言處理函數
  const handleComment = async (postId: string, content: string) => {
    if (isGuest) {
      onGuestInteraction?.();
      return;
    }

    try {
      const response = await fetch(endpoints.comments.create, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          post_id: postId, 
          content: content.trim() 
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "留言失敗");
      }

      // 重新獲取資料以包含新的留言
      await mutatePosts();
      // 移除 onRefresh() 呼叫，避免重複更新
      // onRefresh();
    } catch (error) {
      console.error("留言失敗:", error);
      alert(`留言失敗：${error instanceof Error ? error.message : "未知錯誤"}`);
    }
  };

  // 留言按讚處理函數
  const handleCommentLike = async (commentId: string) => {
    if (isGuest) {
      onGuestInteraction?.();
      return;
    }

    try {
      // 找出這個留言對應的資料
      const postWithComment = postsWithSocialData.find((post: PostWithDetails) => 
        post.comments?.some(comment => comment.id === commentId)
      );
      
      if (!postWithComment) {
        throw new Error("找不到對應的留言");
      }

      const comment = postWithComment.comments?.find(c => c.id === commentId);
      if (!comment) {
        throw new Error("找不到留言");
      }

      if (comment.is_liked) {
        // 取消按讚留言
        const response = await fetch(endpoints.likes.deleteComment(commentId), {
          method: "DELETE",
        });

        if (!response.ok) {
          const error = await response.json();
          // 如果是 409，代表已經按過讚，不用報錯
          if (response.status === 409) {
            return;
          }
          throw new Error(error.error || "取消按讚失敗");
        }
      } else {
        // 新增按讚留言
        const response = await fetch(endpoints.likes.createComment, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ comment_id: commentId }),
        });

        if (!response.ok) {
          const error = await response.json();
          // 如果是 409，代表已經按過讚，不用報錯
          if (response.status === 409) {
            return;
          }
          throw new Error(error.error || "按讚失敗");
        }
      }

      // 重新獲取資料
      await mutatePosts();
      // 移除 onRefresh() 呼叫，避免重複更新
      // onRefresh();
    } catch (error) {
      console.error("留言按讚操作失敗:", error);
      // 可以在這裡添加錯誤提示，但不使用 alert
      console.error(`操作失敗：${error instanceof Error ? error.message : "未知錯誤"}`);
    }
  };

  const handleCommentEdit = async (commentId: string, newContent: string) => {
    try {
      const response = await fetch(endpoints.comments.update(commentId), {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newContent }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "編輯留言失敗");
      }

      // 只更新該 post，不全頁重抓
      await mutatePosts();
    } catch (error) {
      console.error("編輯留言失敗:", error);
      alert(`編輯失敗：${error instanceof Error ? error.message : "未知錯誤"}`);
    }
  };

  const handleCommentDelete = async (commentId: string) => {
    try {
      const response = await fetch(endpoints.comments.delete(commentId), {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "刪除留言失敗");
      }

      // 只更新該 post，不全頁重抓
      await mutatePosts();
    } catch (error) {
      console.error("刪除留言失敗:", error);
      alert(`刪除失敗：${error instanceof Error ? error.message : "未知錯誤"}`);
    }
  };

  if (!mounted) {
    return (
      <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mx-auto"></div>
          <p className="mt-4 text-gray-400 font-medium">{t("loading")}</p>
        </div>
      </div>
    );
  }


  return (
    <div className="flex bg-black/90 backdrop-blur-sm z-50 flex-col min-h-screen">
      {/* 標題列 - 固定在頂部 */}
      <div className="flex-none z-10 backdrop-blur-sm border-b border-gray-800">
        <div className="w-full mx-auto px-4 py-3 md:py-4 flex justify-between items-center">
          <div className="flex items-center space-x-3 md:space-x-4">
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
              aria-label={t("close")}
            >
              <svg
                className="w-5 h-5 md:w-6 md:h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>
            <div>
              <h1 className="text-lg md:text-xl font-bold text-white flex items-center space-x-2">
                <span>{displayCountyName}</span>
                {showOnlyMine && (
                  <span className="bg-blue-600 text-white text-xs px-2 py-1 rounded-full">
                    {t("map_view.my_posts")}
                  </span>
                )}
              </h1>
              <p className="text-xs md:text-sm text-blue-400">
                {showOnlyMine ? 
                  t("visit_count", { count: visitCount }) : 
                  t("posts_count", { count: visitCount })
                }
              </p>
            </div>
          </div>
          
          {/* 新增按鈕 - 只有登入用戶才顯示 */}
          {!isGuest && (
            <button
              onClick={onAdd}
              className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 md:px-4 md:py-2 rounded-lg text-xs md:text-sm transition-colors flex items-center space-x-1 md:space-x-2"
            >
              <svg
                className="w-3 h-3 md:w-4 md:h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              <span>{t("add_place")}</span>
            </button>
          )}
        </div>
      </div>

      {/* 主要內容區域 - 允許自然延展 */}
      <div className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-gray-900 [&::-webkit-scrollbar-thumb]:bg-gray-700 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-gray-600">
        <div className="max-w-3xl mx-auto px-3 md:px-4 py-4 md:py-6 pb-20 min-h-full">
          {postsWithSocialData.length > 0 ? (
            <div className="space-y-4 md:space-y-6">
              {postsWithSocialData.map((post: PostWithDetails) => (
                <SocialPostCard
                  key={post.id}
                  post={post}
                  currentUserId={currentUserId}
                  onLike={handleLike}
                  onComment={handleComment}
                  onCommentLike={handleCommentLike}
                  onCommentEdit={(commentId, newContent) => handleCommentEdit(commentId, newContent)}
                  onCommentDelete={(commentId) => handleCommentDelete(commentId)}
                  onEdit={onEdit}
                  isGuest={isGuest}
                />
              ))}
            </div>
          ) : (
            // 空狀態
            <div className="flex flex-col items-center justify-center h-80 md:h-96 text-center">
              <div className="w-20 h-20 md:w-24 md:h-24 bg-gray-800 rounded-full flex items-center justify-center mb-4 md:mb-6">
                <svg
                  className="w-10 h-10 md:w-12 md:h-12 text-gray-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
              </div>
              <h3 className="text-lg md:text-xl font-semibold text-white mb-2">
                {t("no_visits_yet")}
              </h3>
          
              {!isGuest && (
                <button
                  onClick={onAdd}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 md:px-6 md:py-3 rounded-xl text-sm md:text-base font-medium transition-colors flex items-center space-x-2"
                >
                  <svg
                    className="w-4 h-4 md:w-5 md:h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                  <span>{t("add_first_visit")}</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}