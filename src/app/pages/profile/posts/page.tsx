"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useTranslation } from "react-i18next";
import { useRouter, useSearchParams } from "next/navigation";
import { PostWithDetails } from "@/api/types";
import SocialPostCard from "@/components/SocialPostCard";
import EditVisitModal from "@/components/EditVisitModal";
import { endpoints } from "@/api/endpoints";

export default function UserPostsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useTranslation();
  
  const [posts, setPosts] = useState<PostWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [editingPost, setEditingPost] = useState<PostWithDetails | null>(null);

  // 從 URL 參數獲取用戶 ID，如果沒有則使用當前用戶
  const targetUserId = searchParams.get('userId') || session?.user?.email || '';
  const isOwnPosts = !searchParams.get('userId') || searchParams.get('userId') === session?.user?.email;

  useEffect(() => {
    setMounted(true);
  }, []);

  // 獲取用戶貼文
  const fetchUserPosts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const url = endpoints.posts.byUser(targetUserId);
      
      const response = await fetch(url);
      const result = await response.json();

      if (result.success) {
        setPosts(result.data || []);
      } else {
        setError("獲取貼文失敗");
      }
    } catch (error) {
      console.error("獲取貼文錯誤:", error);
      setError("獲取貼文失敗");
    } finally {
      setLoading(false);
    }
  }, [targetUserId]);

  // 處理按讚
  const handleLike = async (postId: string) => {
    try {
      const post = posts.find(p => p.id === postId);
      if (!post) return;

      const isCurrentlyLiked = post.is_liked;
      const method = isCurrentlyLiked ? "DELETE" : "POST";
      const url = isCurrentlyLiked 
        ? `${endpoints.likes.delete(postId)}`
        : endpoints.likes.create;

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: method === "POST" ? JSON.stringify({ post_id: postId }) : undefined,
      });

      if (response.ok) {
        setPosts(prevPosts =>
          prevPosts.map(p =>
            p.id === postId
              ? {
                  ...p,
                  is_liked: !isCurrentlyLiked,
                  likes_count: (p.likes_count || 0) + (isCurrentlyLiked ? -1 : 1),
                }
              : p
          )
        );
      }
    } catch (error) {
      console.error("按讚操作失敗:", error);
    }
  };

  // 處理留言
  const handleComment = async (postId: string, content: string) => {
    try {
      const response = await fetch(endpoints.comments.create, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          post_id: postId,
          content: content.trim(),
        }),
      });

      if (response.ok) {
        // 重新獲取貼文資料以包含正確的使用者資訊
        fetchUserPosts();
      }
    } catch (error) {
      console.error("留言失敗:", error);
    }
  };

  // 處理留言按讚
  const handleCommentLike = async (commentId: string) => {
    try {
      const comment = posts
        .flatMap(p => p.comments || [])
        .find(c => c.id === commentId);
      
      if (!comment) return;

      const isCurrentlyLiked = comment.is_liked;
      const method = isCurrentlyLiked ? "DELETE" : "POST";
      const url = isCurrentlyLiked
        ? `${endpoints.likes.deleteComment(commentId)}`
        : endpoints.likes.createComment;

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: method === "POST" ? JSON.stringify({ comment_id: commentId }) : undefined,
      });

      if (response.ok) {
        // 重新獲取貼文資料以確保資料一致性
        fetchUserPosts();
      }
    } catch (error) {
      console.error("留言按讚失敗:", error);
    }
  };

  // 處理留言編輯
  const handleCommentEdit = async (commentId: string, newContent: string) => {
    try {
      const response = await fetch(endpoints.comments.update(commentId), {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ content: newContent }),
      });

      if (response.ok) {
        // 重新獲取貼文資料以包含正確的使用者資訊
        fetchUserPosts();
      }
    } catch (error) {
      console.error("編輯留言失敗:", error);
    }
  };

  // 處理留言刪除
  const handleCommentDelete = async (commentId: string) => {
    try {
      const response = await fetch(endpoints.comments.delete(commentId), {
        method: "DELETE",
      });

      if (response.ok) {
        // 重新獲取貼文資料以包含正確的使用者資訊
        fetchUserPosts();
      }
    } catch (error) {
      console.error("刪除留言失敗:", error);
    }
  };

  // 處理貼文編輯
  const handleEdit = (postId: string) => {
    const post = posts.find(p => p.id === postId);
    if (post) {
      setEditingPost(post);
    }
  };

  // 處理編輯完成
  const handleEditComplete = () => {
    setEditingPost(null);
    fetchUserPosts(); // 重新獲取資料
  };

  // 返回個人頁面
  const handleGoBack = () => {
    router.back();
  };

  // 用戶名稱和檔案資料
  const [userProfile, setUserProfile] = useState<{name: string; image?: string} | null>(null);

  // 獲取用戶顯示名稱
  const getUserDisplayName = () => {
    if (isOwnPosts) {
      return session?.user?.name || session?.user?.email?.split('@')[0] || t("profile.my_posts");
    }
    return userProfile?.name || targetUserId?.split('@')[0] || t("user");
  };

  // 獲取用戶資料（用於顯示名稱）
  const fetchUserProfile = useCallback(async () => {
    if (isOwnPosts || !targetUserId) return;

    try {
      const response = await fetch(`/api/v1/user/profile?userId=${encodeURIComponent(targetUserId)}`);
      const result = await response.json();

      if (result.success) {
        setUserProfile({
          name: result.data.user.name,
          image: result.data.user.image
        });
      }
    } catch (error) {
      console.error("獲取用戶資料錯誤:", error);
    }
  }, [isOwnPosts, targetUserId]);

  useEffect(() => {
    if (status === "authenticated" && targetUserId) {
      fetchUserPosts();
      fetchUserProfile();
    }
  }, [status, targetUserId, fetchUserPosts, fetchUserProfile]);

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
      <main className="h-full flex flex-col items-center justify-center bg-black p-6">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mb-6">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white mb-4">{t("profile.posts")}</h1>
          <p className="text-gray-400 mb-6">{t("profile.login_desc")}</p>
          <button
            onClick={() => router.push("/pages/home")}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl transition-colors"
          >
            {t("login")}
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="h-full bg-black overflow-y-auto [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-gray-900 [&::-webkit-scrollbar-thumb]:bg-gray-700 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-gray-600">
      <div className="max-w-3xl mx-auto px-4">
        {/* 標題欄 */}
        <div className="py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button
              onClick={handleGoBack}
              className="p-2 hover:bg-gray-800 rounded-full transition-colors"
            >
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h1 className="text-2xl font-bold text-white">
              {isOwnPosts ? t("profile.my_posts") : `${getUserDisplayName()} ${t("profile.posts")}`}
            </h1>
          </div>
        </div>

        {/* 貼文內容 */}
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
              <p className="text-gray-400">{t("loading")}...</p>
            </div>
          ) : posts.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-96 text-center">
              <div className="w-24 h-24 bg-gray-800 rounded-full flex items-center justify-center mb-6">
                <svg className="w-12 h-12 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">
                {isOwnPosts ? t("profile.no_posts") : t("profile.no_posts")}
              </h3>
              <p className="text-gray-400">
                {isOwnPosts ? t("profile.no_posts_desc") : ""}
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {posts.map((post) => (
                <SocialPostCard
                  key={post.id}
                  post={post}
                  currentUserId={session?.user?.email || undefined}
                  onLike={handleLike}
                  onComment={handleComment}
                  onCommentLike={handleCommentLike}
                  onCommentEdit={handleCommentEdit}
                  onCommentDelete={handleCommentDelete}
                  onEdit={handleEdit}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 編輯模態框 */}
      {editingPost && (
        <EditVisitModal
          isOpen={true}
          visitData={editingPost}
          onClose={() => setEditingPost(null)}
          onSuccess={handleEditComplete}
        />
      )}
    </main>
  );
} 