"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useTranslation } from "react-i18next";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { VisitedPlace } from "@/api/types";
import EditProfileModal from "@/components/EditProfileModal";
import LoginModal from "@/components/LoginModal";

interface UserStats {
  totalPosts: number;
  totalCounties: number;
  totalLikes: number;
  totalComments: number;
}

interface ProfileData {
  user: {
    id: string;
    name: string;
    email?: string;
    image?: string | null;
    bio?: string | null;
  };
  stats: UserStats;
  posts: VisitedPlace[];
  isOwnProfile: boolean;
}

interface UserProfileData {
  email: string;
  originalName: string | null;
  originalImage: string | null;
  displayName: string | null;
  avatarUrl: string | null;
  bio: string | null;
  finalName: string;
  finalImage: string | null;
}

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useTranslation();
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [userProfileData, setUserProfileData] = useState<UserProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // 獲取個人檔案資料
  const fetchProfileData = useCallback(async () => {
    try {
      setLoading(true);
      
      // 從 URL 參數獲取要查看的用戶 ID
      const userId = searchParams.get("userId");
      const url = userId 
        ? `/api/v1/user/profile?userId=${encodeURIComponent(userId)}`
        : "/api/v1/user/profile";
      
      const response = await fetch(url);
      const result = await response.json();

      if (result.success) {
        setProfileData(result.data);
      } else {
        setError("獲取個人檔案失敗");
      }
    } catch (error) {
      console.error("獲取個人檔案錯誤:", error);
      setError("獲取個人檔案失敗");
    } finally {
      setLoading(false);
    }
  }, [searchParams]);

  // 獲取用戶個人資料（只有本人才需要）
  const fetchUserProfile = useCallback(async () => {
    // 只有查看自己的檔案才需要獲取詳細資料
    const userId = searchParams.get("userId");
    if (userId && userId !== session?.user?.email) {
      return;
    }

    try {
      const response = await fetch("/api/v1/user/user-profile");
      const result = await response.json();

      if (result.success) {
        setUserProfileData(result.data);
      }
    } catch (error) {
      console.error("獲取用戶個人資料錯誤:", error);
    }
  }, [searchParams, session?.user?.email]);

  // 處理編輯成功
  const handleEditSuccess = () => {
    setIsEditModalOpen(false);
    fetchProfileData();
    fetchUserProfile();
  };

  // 處理貼文點擊
  const handlePostClick = () => {
    // 導航到個人貼文頁面（直列式瀏覽）
    const userId = searchParams.get("userId");
    if (userId) {
      router.push(`/pages/profile/posts?userId=${encodeURIComponent(userId)}`);
    } else {
      router.push('/pages/profile/posts');
    }
  };

  // 格式化數字顯示
  const formatCount = (count: number) => {
    if (count >= 1000000) {
      return (count / 1000000).toFixed(1) + 'M';
    } else if (count >= 1000) {
      return (count / 1000).toFixed(1) + 'K';
    }
    return count.toString();
  };



  useEffect(() => {
    if (status === "authenticated") {
      fetchProfileData();
      fetchUserProfile();
    } else if (status === "unauthenticated") {
      // 訪客模式：只有在查看其他用戶檔案時才載入資料
      const userId = searchParams.get("userId");
      if (userId) {
        fetchProfileData(); // 只載入基本檔案資料，不載入個人資料
      }
    }
  }, [status, fetchProfileData, fetchUserProfile, searchParams]);

  // 處理登入
  const handleSignIn = () => {
    setIsLoginModalOpen(true);
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

  if (status === "unauthenticated") {
    const userId = searchParams.get("userId");
    
    if (!userId) {
      // 訪客試圖查看自己的檔案，顯示登入提示
      return (
        <main className="h-full flex flex-col items-center justify-center bg-black p-6">
          <div className="text-center max-w-md">
            <h1 className="text-3xl font-bold text-white mb-4">{t("sidebar.profile")}</h1>
            <p className="text-gray-400 mb-8 text-lg leading-relaxed">
              {t("profile.login_desc")}
            </p>
            
            <button
              onClick={handleSignIn}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl transition-colors"
            >
              {t("login")}
            </button>
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
    
    // 訪客查看其他用戶檔案，繼續載入（會在下面的主要 return 中顯示）
  }

  return (
    <main className="h-full bg-black overflow-y-auto [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-gray-900 [&::-webkit-scrollbar-thumb]:bg-gray-700 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-gray-600">
      <div className="max-w-4xl mx-auto px-4">
        {/* 個人檔案標題欄 */}
        <div className="py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {!profileData?.isOwnProfile && (
              <button
                onClick={() => router.back()}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            )}
            <h1 className="text-2xl font-bold text-white">
              {profileData?.isOwnProfile ? t("sidebar.profile") : (profileData?.user.name || "用戶檔案")}
            </h1>
          </div>
          
          {/* 只有本人才能看到編輯按鈕 */}
          {profileData?.isOwnProfile && (
            <button
              onClick={() => setIsEditModalOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm transition-colors flex items-center space-x-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
              <span>{t("profile.edit_profile")}</span>
            </button>
          )}
        </div>

        {/* 個人檔案內容 */}
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
              <p className="text-gray-400">{t("profile.loading")}</p>
            </div>
          ) : profileData ? (
            <div className="space-y-8">
              {/* 用戶資訊區域 */}
              <div className="flex items-center space-x-6 p-6 bg-gray-900/30 rounded-xl">
                {/* 頭像 */}
                <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-700 flex-shrink-0">
                  {profileData.user.image ? (
                    <Image
                      src={profileData.user.image}
                      alt="用戶頭像"
                      width={96}
                      height={96}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                      <span className="text-white text-2xl font-bold">
                        {profileData.user.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                </div>

                {/* 用戶資訊 */}
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-white mb-2">
                    {profileData.user.name}
                  </h2>
                 
                  {profileData.user.bio && (
                    <p className="text-gray-300 mb-4 text-sm">
                      {profileData.user.bio}
                    </p>
                  )}

                  {/* 統計數據 */}
                  <div className="grid grid-cols-4 gap-6">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-white">
                        {formatCount(profileData.stats.totalPosts)}
                      </div>
                      <div className="text-sm text-gray-400">{t("profile.posts")}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-white">
                        {formatCount(profileData.stats.totalCounties)}
                      </div>
                      <div className="text-sm text-gray-400">{t("profile.counties")}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-white">
                        {formatCount(profileData.stats.totalLikes)}
                      </div>
                      <div className="text-sm text-gray-400">{t("profile.likes")}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-white">
                        {formatCount(profileData.stats.totalComments)}
                      </div>
                      <div className="text-sm text-gray-400">{t("profile.comments")}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 貼文網格 */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-white">
                    {profileData.isOwnProfile ? t("profile.my_posts") : "貼文"}
                  </h3>
                  <div className="text-gray-400 text-sm">
                    {t("posts_count", { count: profileData.posts.length })}
                  </div>
                </div>

                {profileData.posts.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-64 text-center">
                    <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mb-4">
                      <svg className="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                    </div>
                    <h4 className="text-lg font-semibold text-white mb-2">{t("profile.no_posts")}</h4>
                    <p className="text-gray-400">{t("profile.no_posts_desc")}</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-2">
                    {profileData.posts.map((post) => (
                      <div
                        key={post.id}
                        onClick={handlePostClick}
                        className="aspect-square bg-gray-800 rounded-lg overflow-hidden cursor-pointer group relative"
                      >
                        {post.image_urls?.[0] ? (
                          <Image
                            src={post.image_urls[0]}
                            alt={`${post.county} 貼文`}
                            width={200}
                            height={200}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center">
                            <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                        )}

                        {/* 懸停效果 */}
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-200 flex items-center justify-center">
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-white text-center">
                            <div className="text-sm font-medium">{post.county}</div>
                            {post.note && (
                              <div className="text-xs text-gray-300 mt-1">
                                {post.note.substring(0, 30)}...
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-96 text-center">
              <div className="w-24 h-24 bg-gray-800 rounded-full flex items-center justify-center mb-6">
                <svg className="w-12 h-12 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">{t("profile.error")}</h3>
              <p className="text-gray-400">{t("error_save_failed")}</p>
            </div>
          )}
        </div>
      </div>

      {/* 編輯個人檔案 Modal - 只有本人才能編輯 */}
      {userProfileData && profileData?.isOwnProfile && (
        <EditProfileModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          onSuccess={handleEditSuccess}
          currentProfile={userProfileData}
        />
      )}

      {/* 登入 Modal */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
      />
    </main>
  );
} 