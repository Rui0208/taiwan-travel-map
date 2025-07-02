"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useTranslation } from "react-i18next";
import { useRouter, useParams } from "next/navigation";
import useSWR from "swr";
import dynamic from "next/dynamic";
import { PostWithDetails } from "@/api/types";
import { endpoints } from "@/api/endpoints";
import { fetcher } from "@/api/fetcher";

// 動態導入大型組件
const SocialPostCard = dynamic(() => import("@/components/SocialPostCard"), {
  ssr: false,
  loading: () => (
    <div className="bg-white rounded-lg shadow-md p-4 animate-pulse">
      <div className="h-48 bg-gray-200 rounded mb-4"></div>
      <div className="h-4 bg-gray-200 rounded mb-2"></div>
      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
    </div>
  ),
});

const EditVisitModal = dynamic(() => import("@/components/EditVisitModal"), {
  ssr: false,
  loading: () => null,
});

const LoginModal = dynamic(() => import("@/components/LoginModal"), {
  ssr: false,
  loading: () => null,
});

export default function PostPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const { t } = useTranslation();
  const [mounted, setMounted] = useState(false);
  const [editingPost, setEditingPost] = useState<PostWithDetails | null>(null);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  const postId = params.id as string;

  useEffect(() => {
    setMounted(true);
  }, []);

  // 獲取單篇文章資料
  const { data: postData, mutate, error } = useSWR<{ success: boolean; data: PostWithDetails }>(
    postId ? endpoints.posts.byId(postId) : null,
    fetcher
  );

  // 處理按讚
  const handleLike = async (postId: string) => {
    if (status === "unauthenticated") {
      setIsLoginModalOpen(true);
      return;
    }

    try {
      const post = postData?.data;
      if (!post) return;

      const isCurrentlyLiked = post.is_liked;
      const method = isCurrentlyLiked ? "DELETE" : "POST";
      const url = isCurrentlyLiked 
        ? endpoints.likes.delete(postId)
        : endpoints.likes.create;

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: method === "POST" ? JSON.stringify({ post_id: postId }) : undefined,
      });

      if (response.ok) {
        // 重新獲取資料
        await mutate();
      } else {
        // 處理錯誤情況
        const errorData = await response.json();
        console.error("按讚操作失敗:", errorData);
        // 如果是 409 錯誤（已經按過讚），可以忽略
        if (response.status !== 409) {
          throw new Error(errorData.error || "按讚操作失敗");
        }
      }
    } catch (error) {
      console.error("按讚操作失敗:", error);
      // 可以在這裡添加錯誤提示
    }
  };

  // 處理留言
  const handleComment = async (postId: string, content: string) => {
    if (status === "unauthenticated") {
      setIsLoginModalOpen(true);
      return;
    }

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
        // 重新獲取資料
        await mutate();
      }
    } catch (error) {
      console.error("留言失敗:", error);
    }
  };

  // 處理留言按讚
  const handleCommentLike = async (commentId: string) => {
    if (status === "unauthenticated") {
      setIsLoginModalOpen(true);
      return;
    }

    try {
      const comment = postData?.data.comments?.find(c => c.id === commentId);
      if (!comment) return;

      const isCurrentlyLiked = comment.is_liked;
      const method = isCurrentlyLiked ? "DELETE" : "POST";
      const url = isCurrentlyLiked
        ? endpoints.likes.deleteComment(commentId)
        : endpoints.likes.createComment;

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: method === "POST" ? JSON.stringify({ comment_id: commentId }) : undefined,
      });

      if (response.ok) {
        // 重新獲取資料
        await mutate();
      } else {
        // 處理錯誤情況
        const errorData = await response.json();
        console.error("留言按讚失敗:", errorData);
        // 如果是 409 錯誤（已經按過讚），可以忽略
        if (response.status !== 409) {
          throw new Error(errorData.error || "留言按讚失敗");
        }
      }
    } catch (error) {
      console.error("留言按讚失敗:", error);
      // 可以在這裡添加錯誤提示
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
        // 重新獲取資料
        await mutate();
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
        // 重新獲取資料
        await mutate();
      }
    } catch (error) {
      console.error("刪除留言失敗:", error);
    }
  };

  // 處理文章編輯
  const handleEdit = () => {
    if (status === "unauthenticated") {
      setIsLoginModalOpen(true);
      return;
    }

    if (postData?.data) {
      setEditingPost(postData.data);
    }
  };

  // 處理編輯完成
  const handleEditComplete = () => {
    setEditingPost(null);
    mutate(); // 重新獲取資料
  };

  // 處理返回
  const handleGoBack = () => {
    router.back();
  };

  if (!mounted) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-black p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mx-auto"></div>
          <p className="mt-4 text-gray-400 font-medium">{t("loading")}</p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-black p-4">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-900/20 rounded-full flex items-center justify-center mb-4 mx-auto">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 18.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-white mb-2">{t("post.not_found")}</h2>
          <p className="text-gray-400 mb-6">{t("post.not_found_desc")}</p>
          <button
            onClick={handleGoBack}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
          >
            {t("post.go_back")}
          </button>
        </div>
      </main>
    );
  }

  if (!postData?.data) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-black p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mx-auto"></div>
          <p className="mt-4 text-gray-400 font-medium">{t("loading")}</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black">
      <div className="max-w-4xl mx-auto">
        {/* 標題列 */}
        <div className="sticky top-0 z-10 bg-black/90 backdrop-blur-sm border-b border-gray-800">
          <div className="px-4 py-4 flex items-center space-x-4">
            <button
              onClick={handleGoBack}
              className="text-gray-400 hover:text-white transition-colors"
              aria-label={t("post.back")}
            >
              <svg
                className="w-6 h-6"
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
            <h1 className="text-lg font-semibold text-white">
              {t("post.title")}
            </h1>
          </div>
        </div>

        {/* 文章內容 */}
        <div className="p-4">
          <SocialPostCard
            post={postData.data}
            currentUserId={session?.user?.id}
            onLike={handleLike}
            onComment={handleComment}
            onCommentLike={handleCommentLike}
            onCommentEdit={handleCommentEdit}
            onCommentDelete={handleCommentDelete}
            onEdit={handleEdit}
            isGuest={status === "unauthenticated"}
          />
        </div>
      </div>

      {/* 編輯 Modal */}
      {editingPost && (
        <EditVisitModal
          isOpen={true}
          onClose={() => setEditingPost(null)}
          onSuccess={handleEditComplete}
          visitData={editingPost}
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