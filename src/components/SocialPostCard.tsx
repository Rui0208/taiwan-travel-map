"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { type VisitedPlace, type Comment, COUNTY_NAMES_REVERSE } from "@/api/types";
import ImageCarousel from "./ImageCarousel";

interface SocialPostCardProps {
  post: VisitedPlace & {
    comments?: Comment[];
    likes_count?: number;
    is_liked?: boolean;
  };
  currentUserId?: string;
  onLike: (postId: string) => void;
  onComment: (postId: string, content: string) => void;
  onCommentLike: (commentId: string) => void;
  onCommentEdit: (commentId: string, newContent: string) => void;
  onCommentDelete: (commentId: string) => void;
  onEdit: (postId: string) => void;
  isGuest?: boolean;
}

export default function SocialPostCard({
  post,
  currentUserId,
  onLike,
  onComment,
  onCommentLike,
  onCommentEdit,
  onCommentDelete,
  onEdit,
  isGuest = false
}: SocialPostCardProps) {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState("");

  // 取得縣市顯示名稱的函數
  const getCountyDisplayName = (county: string) => {
    // 如果是英文縣市名稱，先轉換為中文作為翻譯鍵
    const chineseKey = COUNTY_NAMES_REVERSE[county] || county;
    // 使用中文鍵來查找翻譯
    return t(`countiesArray.${chineseKey}`, chineseKey);
  };

  // 格式化時間
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const locale = i18n.language === "zh-Hant" ? "zh-TW" : "en-US";
    
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      return t("just_now");
    } else if (diffInHours < 24) {
      return t("hours_ago", { count: diffInHours });
    } else if (diffInHours < 168) { // 一週內
      const days = Math.floor(diffInHours / 24);
      return t("days_ago", { count: days });
    } else {
      return date.toLocaleDateString(locale, {
        month: "short",
        day: "numeric",
        year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
      });
    }
  };

  // 處理按讚
  const handleLike = () => {
    onLike(post.id);
  };

  // 處理留言提交
  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || isSubmittingComment) return;

    setIsSubmittingComment(true);
    try {
      await onComment(post.id, newComment.trim());
      setNewComment("");
      setShowComments(true);
    } catch (error) {
      console.error("提交留言失敗:", error);
    } finally {
      setIsSubmittingComment(false);
    }
  };

  // 處理編輯留言
  const handleEditComment = (comment: Comment) => {
    setEditingCommentId(comment.id);
    setEditingContent(comment.content);
  };

  // 處理保存編輯
  const handleSaveEdit = async (commentId: string) => {
    if (!editingContent.trim()) return;
    
    try {
      await onCommentEdit(commentId, editingContent.trim());
      setEditingCommentId(null);
      setEditingContent("");
    } catch (error) {
      console.error("編輯留言失敗:", error);
    }
  };

  // 處理刪除留言
  const handleDeleteComment = async (commentId: string) => {
    if (confirm(t("confirm_delete"))) {
      try {
        await onCommentDelete(commentId);
      } catch (error) {
        console.error("刪除留言失敗:", error);
      }
    }
  };

  // 處理點擊用戶名稱
  const handleUserClick = (userId: string) => {
    if (userId && userId !== currentUserId) {
      router.push(`/pages/profile?userId=${encodeURIComponent(userId)}`);
    } else if (userId === currentUserId) {
      router.push('/pages/profile');
    }
  };

  // 準備圖片數組（支援新舊格式）
  const images = (() => {
    // 先檢查新格式的 image_urls
    if (post.image_urls && post.image_urls.length > 0) {
      return post.image_urls;
    }
    // 再檢查舊格式的 image_url
    if (post.image_url) {
      return [post.image_url];
    }
    // 都沒有則返回空數組
    return [];
  })();

  return (
    <article className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-2xl overflow-hidden mb-4 hover:border-gray-700 transition-colors">
      {/* 頭像和用戶資訊 */}
      <div className="p-4 flex items-center justify-between border-b border-gray-800/50">
        <div className="flex items-center space-x-3">
          {/* 用戶大頭貼 */}
          {post.user?.image ? (
            <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-700">
              <Image
                src={post.user.image}
                alt={post.user.name || "用戶頭像"}
                width={32}
                height={32}
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-medium">
                {post.user?.name?.substring(0, 1)?.toUpperCase() || post.county?.substring(0, 1) || "T"}
              </span>
            </div>
          )}
          <div>
            <button
              onClick={() => handleUserClick(post.user_id)}
              className="text-white font-medium text-sm hover:text-purple-400 transition-colors cursor-pointer text-left"
            >
              {post.user?.name || "匿名用戶"}
            </button>
            <p className="text-gray-400 text-xs">
              {getCountyDisplayName(post.county)} • {formatDate(post.created_at)}
            </p>
          </div>
        </div>
        
        {/* 更多選項按鈕 - 只對本人文章顯示 */}
        {currentUserId === post.user_id && (
          <button
            onClick={() => onEdit(post.id)}
            className="text-gray-400 hover:text-white transition-colors p-1"
            title={t("edit")}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
              />
            </svg>
          </button>
        )}
      </div>

      {/* 圖片輪播 */}
      {images.length > 0 && (
        <div className="px-4">
          <ImageCarousel
            images={images}
            alt={post.note || t("visit_photo")}
            aspectRatio="auto"
            objectFit="contain"
            className="w-full max-h-96 rounded-xl overflow-hidden"
          />
        </div>
      )}

      {/* 文章內容 */}
      {post.note && (
        <div className="p-4">
          <p className="text-gray-200 text-sm leading-relaxed whitespace-pre-wrap">
            {post.note}
          </p>
          
          {/* Instagram 連結 */}
          {post.ig_url && (
            <a
              href={post.ig_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center mt-2 text-blue-400 hover:text-blue-300 text-xs transition-colors"
            >
              <svg className="w-3 h-3 mr-1" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
              </svg>
              {t("view_on_instagram")}
            </a>
          )}
        </div>
      )}

      {/* 互動按鈕 */}
      <div className="px-4 pb-3 flex items-center justify-between border-t border-gray-800/50 pt-3">
        <div className="flex items-center space-x-4">
          {/* 按讚按鈕 */}
          <button
            onClick={handleLike}
            disabled={isGuest}
            className={`flex items-center space-x-1 transition-colors ${
              isGuest 
                ? "text-gray-500 cursor-not-allowed" 
                : post.is_liked 
                  ? "text-red-500 hover:text-red-400" 
                  : "text-gray-400 hover:text-red-500"
            }`}
            title={isGuest ? "請登入以按讚" : undefined}
          >
            <svg 
              className={`w-5 h-5 ${post.is_liked && !isGuest ? "fill-current" : ""}`} 
              fill={post.is_liked && !isGuest ? "currentColor" : "none"} 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={post.is_liked && !isGuest ? 0 : 2}
                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
              />
            </svg>
            <span className="text-sm">{post.likes_count || 0}</span>
          </button>

          {/* 留言按鈕 */}
          <button
            onClick={() => setShowComments(!showComments)}
            className="flex items-center space-x-1 text-gray-400 hover:text-blue-400 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
            <span className="text-sm">{post.comments?.length || 0}</span>
          </button>
        </div>
      </div>

      {/* 留言區域 */}
      {showComments && (
        <div className="border-t border-gray-800/50">
          {/* 留言列表 */}
          {post.comments && post.comments.length > 0 && (
            <div className="px-4 py-3 space-y-3 max-h-80 overflow-y-auto [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-gray-800 [&::-webkit-scrollbar-thumb]:bg-gray-600 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-gray-500">
              {post.comments.map((comment) => (
                <div key={comment.id} className="flex space-x-2">
                  {/* 留言者頭像 */}
                  {comment.user?.image ? (
                    <div className="w-6 h-6 rounded-full overflow-hidden bg-gray-700 flex-shrink-0">
                      <Image
                        src={comment.user.image}
                        alt={comment.user.name || "用戶頭像"}
                        width={24}
                        height={24}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-6 h-6 bg-gradient-to-br from-green-500 to-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-white text-xs font-medium">
                        {comment.user?.name?.substring(0, 1)?.toUpperCase() || 
                         comment.user_id?.substring(0, 1)?.toUpperCase() || "U"}
                      </span>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="bg-gray-800/50 rounded-lg px-3 py-2">
                      <div className="flex items-center justify-between mb-1">
                        <button
                          onClick={() => handleUserClick(comment.user_id)}
                          className="text-gray-300 text-xs font-medium hover:text-purple-400 transition-colors cursor-pointer"
                        >
                          {comment.user?.name || comment.user_id || "匿名用戶"}
                        </button>
                        {/* 留言操作按鈕 */}
                        {(currentUserId === comment.user_id || currentUserId === post.user_id) && (
                          <div className="flex items-center space-x-1">
                            {currentUserId === comment.user_id && (
                              <button
                                onClick={() => handleEditComment(comment)}
                                className="text-gray-500 hover:text-blue-400 transition-colors p-1"
                                title={t("edit")}
                              >
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                              </button>
                            )}
                            <button
                              onClick={() => handleDeleteComment(comment.id)}
                              className="text-gray-500 hover:text-red-400 transition-colors p-1"
                              title={t("delete")}
                            >
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        )}
                      </div>
                      
                      {/* 留言內容或編輯區域 */}
                      {editingCommentId === comment.id ? (
                        <div className="space-y-2">
                          <textarea
                            value={editingContent}
                            onChange={(e) => setEditingContent(e.target.value)}
                            className="w-full bg-gray-700 text-white text-sm px-2 py-1 rounded resize-none focus:ring-1 focus:ring-blue-500 focus:outline-none"
                            rows={2}
                          />
                          <div className="flex justify-end space-x-2">
                            <button
                              onClick={() => setEditingCommentId(null)}
                              className="text-gray-400 hover:text-white text-xs px-2 py-1 transition-colors"
                            >
                              {t("cancel")}
                            </button>
                            <button
                              onClick={() => handleSaveEdit(comment.id)}
                              className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-2 py-1 rounded transition-colors"
                            >
                              {t("save")}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <p className="text-gray-200 text-sm">{comment.content}</p>
                      )}
                    </div>
                    <div className="flex items-center mt-1 space-x-3">
                      <span className="text-gray-500 text-xs">
                        {formatDate(comment.created_at)}
                      </span>
                      <button 
                        onClick={() => onCommentLike(comment.id)}
                        disabled={isGuest}
                        className={`text-xs transition-colors ${
                          isGuest 
                            ? "text-gray-600 cursor-not-allowed" 
                            : comment.is_liked 
                              ? "text-red-500 hover:text-red-400" 
                              : "text-gray-500 hover:text-red-400"
                        }`}
                        title={isGuest ? "請登入以按讚留言" : undefined}
                      >
                        {t("like")} {comment.likes_count || 0}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* 新留言輸入 */}
          {!isGuest ? (
            <form onSubmit={handleCommentSubmit} className="p-4">
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder={t("add_comment_placeholder")}
                  className="flex-1 bg-gray-800/50 text-white text-sm px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  disabled={isSubmittingComment}
                />
                <button
                  type="submit"
                  disabled={!newComment.trim() || isSubmittingComment}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg text-sm transition-colors"
                >
                  {isSubmittingComment ? t("sending") : t("send")}
                </button>
              </div>
            </form>
          ) : (
            <div className="p-4 text-center">
              <p className="text-gray-500 text-sm">請登入後留言</p>
            </div>
          )}
        </div>
      )}
    </article>
  );
} 