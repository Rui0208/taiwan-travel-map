"use client";

import { useState, useRef } from "react";
import { useTranslation } from "react-i18next";
import Image from "next/image";
import AvatarEditor from "./AvatarEditor";

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  currentProfile: {
    email: string;
    originalName: string | null;
    originalImage: string | null;
    displayName: string | null;
    avatarUrl: string | null;
    bio: string | null;
    finalName: string;
    finalImage: string | null;
  };
}

export default function EditProfileModal({
  isOpen,
  onClose,
  onSuccess,
  currentProfile,
}: EditProfileModalProps) {
  const { t } = useTranslation();
  const [displayName, setDisplayName] = useState(currentProfile.displayName || "");
  const [bio, setBio] = useState(currentProfile.bio || "");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [showAvatarEditor, setShowAvatarEditor] = useState(false);
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 處理頭像檔案選擇
  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // 檢查檔案大小（限制 5MB）
      if (file.size > 5 * 1024 * 1024) {
        setError("圖片檔案大小不能超過 5MB");
        return;
      }

      // 檢查檔案類型
      if (!file.type.startsWith('image/')) {
        setError("請選擇圖片檔案");
        return;
      }

      setSelectedImageFile(file);
      setShowAvatarEditor(true);
      setError(null);
    }
  };

  // 處理頭像編輯完成
  const handleAvatarEditSave = (croppedImage: Blob) => {
    // 將 Blob 轉換為 File
    const file = new File([croppedImage], 'avatar.png', { type: 'image/png' });
    setAvatarFile(file);
    
    // 創建預覽
    const reader = new FileReader();
    reader.onload = (e) => {
      setAvatarPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
    
    setShowAvatarEditor(false);
    setSelectedImageFile(null);
  };

  // 取消頭像編輯
  const handleAvatarEditCancel = () => {
    setShowAvatarEditor(false);
    setSelectedImageFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // 移除頭像（回到原始狀態）
  const handleRemoveAvatar = () => {
    setAvatarFile(null);
    setAvatarPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // 清理檔案名稱，移除特殊字符
  const sanitizeFileName = (fileName: string): string => {
    // 取得檔案副檔名
    const extension = fileName.split('.').pop() || 'jpg';
    // 移除副檔名，清理檔案名稱
    const nameWithoutExt = fileName.replace(/\.[^/.]+$/, '');
    // 只保留字母、數字、連字號和底線
    const cleanName = nameWithoutExt.replace(/[^a-zA-Z0-9\-_]/g, '');
    // 如果清理後是空的，使用預設名稱
    const finalName = cleanName || 'avatar';
    return `${finalName}.${extension}`;
  };

  // 上傳頭像到 Supabase Storage
  const uploadAvatar = async (file: File): Promise<string | null> => {
    try {
      const cleanFileName = sanitizeFileName(file.name);
      const formData = new FormData();
      formData.append('file', file);
      formData.append('bucket', 'visit-images');
      formData.append('path', `avatars/${currentProfile.email.replace(/[^a-zA-Z0-9]/g, '_')}/${Date.now()}-${cleanFileName}`);

      const response = await fetch('/api/v1/storage/upload', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();
      
      if (result.success) {
        return result.data.publicUrl;
      } else {
        throw new Error(result.error || "上傳失敗");
      }
    } catch (error) {
      console.error("上傳頭像錯誤:", error);
      throw error;
    }
  };

  // 提交表單
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      let avatarUrl = currentProfile.avatarUrl;

      // 如果有新的頭像檔案，先上傳
      if (avatarFile) {
        avatarUrl = await uploadAvatar(avatarFile);
      }

      // 更新個人資料
      const response = await fetch('/api/v1/user/user-profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          displayName: displayName.trim() || null,
          avatarUrl,
          bio: bio.trim() || null,
        }),
      });

      const result = await response.json();

      if (result.success) {
        onSuccess();
        onClose();
      } else {
        setError(result.error || "更新失敗");
      }
    } catch (error) {
      console.error("更新個人資料錯誤:", error);
      setError("更新失敗，請稍後再試");
    } finally {
      setIsSubmitting(false);
    }
  };

  // 重置表單
  const handleClose = () => {
    if (!isSubmitting) {
      setDisplayName(currentProfile.displayName || "");
      setBio(currentProfile.bio || "");
      setAvatarFile(null);
      setAvatarPreview(null);
      setError(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* 標題欄 */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <h2 className="text-xl font-bold text-white">{t("profile.edit_profile")}</h2>
          <button
            onClick={handleClose}
            disabled={isSubmitting}
            className="text-gray-400 hover:text-white transition-colors disabled:opacity-50"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* 表單內容 */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* 錯誤訊息 */}
          {error && (
            <div className="bg-red-900/50 border border-red-700 rounded-xl p-4">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-red-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <span className="text-red-200 text-sm">{error}</span>
              </div>
            </div>
          )}

          {/* 頭像編輯 */}
          <div className="text-center">
            <div className="mb-4">
              <div className="w-24 h-24 mx-auto rounded-full overflow-hidden bg-gray-700 relative">
                {avatarPreview ? (
                  <Image
                    src={avatarPreview}
                    alt="頭像預覽"
                    width={96}
                    height={96}
                    className="w-full h-full object-cover"
                  />
                ) : currentProfile.finalImage ? (
                  <Image
                    src={currentProfile.finalImage}
                    alt="當前頭像"
                    width={96}
                    height={96}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                    <span className="text-white text-2xl font-bold">
                      {currentProfile.finalName.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-center space-x-3">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isSubmitting}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm transition-colors disabled:opacity-50"
              >
                {t("profile.change_avatar")}
              </button>
              
              {avatarPreview && (
                <button
                  type="button"
                  onClick={handleRemoveAvatar}
                  disabled={isSubmitting}
                  className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg text-sm transition-colors disabled:opacity-50"
                >
                  {t("profile.remove_avatar")}
                </button>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarChange}
              className="hidden"
            />
          </div>

          {/* 顯示名稱 */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              {t("profile.display_name")}
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder={currentProfile.originalName || currentProfile.email.split('@')[0]}
              disabled={isSubmitting}
              className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
              maxLength={50}
            />
            <p className="mt-1 text-xs text-gray-400">
              {t("profile.display_name_hint")}
            </p>
          </div>

          {/* 個人簡介 */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              {t("profile.bio")}
            </label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder={t("profile.bio_placeholder")}
              disabled={isSubmitting}
              rows={3}
              className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none disabled:opacity-50"
              maxLength={200}
            />
            <p className="mt-1 text-xs text-gray-400">
              {t("profile.character_count", { count: bio.length, max: 200 })}
            </p>
          </div>

          {/* 按鈕區域 */}
          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-3 rounded-xl transition-colors disabled:opacity-50"
            >
              {t("cancel")}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2"></div>
                  {t("profile.saving")}
                </>
              ) : (
                t("profile.save_changes")
              )}
            </button>
          </div>
        </form>
      </div>

      {/* 頭像編輯器 */}
      {showAvatarEditor && selectedImageFile && (
        <AvatarEditor
          imageFile={selectedImageFile}
          onSave={handleAvatarEditSave}
          onCancel={handleAvatarEditCancel}
        />
      )}
    </div>
  );
} 