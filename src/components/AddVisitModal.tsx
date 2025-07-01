"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { COUNTY_NAMES } from "@/api/types";
import { useTranslation } from "react-i18next";
import ImageEditor from "./ImageEditor";
import { IMAGE_UPLOAD_LIMITS } from "@/lib/constants";

interface AddVisitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  selectedCounty?: string;
}

export default function AddVisitModal({
  isOpen,
  onClose,
  onSuccess,
  selectedCounty = "",
}: AddVisitModalProps) {
  const { t } = useTranslation();
  const [county, setCounty] = useState<string>(selectedCounty);
  const [note, setNote] = useState("");
  const [igUrl, setIgUrl] = useState("");
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [isPublic, setIsPublic] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [editingImageIndex, setEditingImageIndex] = useState<number | null>(null);
  const [editingImageFile, setEditingImageFile] = useState<File | null>(null);

  useEffect(() => {
    console.log("AddVisitModal selectedCounty:", selectedCounty);
    setCounty(selectedCounty);
  }, [selectedCounty]);

  useEffect(() => {
    if (isOpen) {
      console.log("Modal opened with selectedCounty:", selectedCounty);
      setCounty(selectedCounty);
      setNote("");
      setIgUrl("");
      setImageFiles([]);
      setImagePreviews([]);
      setIsPublic(true);
      setUploadProgress("");
      setError("");
    }
  }, [isOpen, selectedCounty]);

  // 清理預覽 URL
  useEffect(() => {
    return () => {
      imagePreviews.forEach(preview => {
        URL.revokeObjectURL(preview);
      });
    };
  }, [imagePreviews]);

  if (!isOpen) return null;

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    if (files.length === 0) return;

    // 檢查總數量限制
    if (imageFiles.length + files.length > IMAGE_UPLOAD_LIMITS.MAX_COUNT) {
      setError(t("max_images_limit"));
      return;
    }

    // 驗證每個檔案
    const validFiles: File[] = [];
    const newPreviews: string[] = [];
    const errors: string[] = [];

    files.forEach(file => {
      // 檢查檔案類型
      if (!file.type.startsWith("image/")) {
        errors.push(t("image_upload_limits.invalid_format", { filename: file.name }));
        return;
      }

      // 檢查檔案大小（10MB 限制）
      if (file.size > IMAGE_UPLOAD_LIMITS.MAX_FILE_SIZE) {
        const fileSizeMB = (file.size / (1024 * 1024)).toFixed(1);
        const maxSizeMB = IMAGE_UPLOAD_LIMITS.MAX_FILE_SIZE / (1024 * 1024);
        errors.push(t("image_upload_limits.file_too_large", { 
          filename: file.name, 
          size: fileSizeMB, 
          limit: maxSizeMB 
        }));
        return;
      }


      validFiles.push(file);
      newPreviews.push(URL.createObjectURL(file));
    });

    // 顯示錯誤訊息
    if (errors.length > 0) {
      setError(errors.join('\n'));
      return;
    }

    if (validFiles.length > 0) {
      setImageFiles(prev => [...prev, ...validFiles]);
      setImagePreviews(prev => [...prev, ...newPreviews]);
      setError(""); // 清除錯誤訊息
    }
  };

  const handleRemoveImage = (index: number) => {
    // 清理預覽 URL
    URL.revokeObjectURL(imagePreviews[index]);
    
    // 移除檔案和預覽
    setImageFiles(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleEditImage = (index: number) => {
    setEditingImageIndex(index);
    setEditingImageFile(imageFiles[index]);
  };

  const handleImageEditSave = (editedImage: Blob) => {
    if (editingImageIndex === null) return;

    // 將編輯後的圖片轉換為 File
    const editedFile = new File([editedImage], `edited_${Date.now()}.jpg`, { type: 'image/jpeg' });
    
    // 更新檔案和預覽
    const newImageFiles = [...imageFiles];
    newImageFiles[editingImageIndex] = editedFile;
    setImageFiles(newImageFiles);

    // 更新預覽
    const newPreviews = [...imagePreviews];
    newPreviews[editingImageIndex] = URL.createObjectURL(editedFile);
    setImagePreviews(newPreviews);

    // 清理編輯狀態
    setEditingImageIndex(null);
    setEditingImageFile(null);
  };

  const handleImageEditCancel = () => {
    setEditingImageIndex(null);
    setEditingImageFile(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!county) {
      setError(t("error_required"));
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      let imageUrls: string[] = [];

      // 如果有選擇圖片，先批量上傳到 Supabase Storage
      if (imageFiles.length > 0) {
        setUploadProgress(t("uploading_images", { current: 0, total: imageFiles.length }));

        const formData = new FormData();
        imageFiles.forEach(file => {
          formData.append("files", file);
        });

        const uploadRes = await fetch("/api/v1/storage/upload-multiple", {
          method: "POST",
          body: formData,
        });

        if (!uploadRes.ok) {
          const data = await uploadRes.json();
          throw new Error(data.error || t("error_upload_failed"));
        }

        const uploadResult = await uploadRes.json();
        imageUrls = uploadResult.urls;

        setUploadProgress(t("uploading_images", { 
          current: uploadResult.uploadedCount, 
          total: imageFiles.length 
        }));
      }

      // 處理 Instagram 連結
      let processedIgUrl = igUrl.trim();
      if (processedIgUrl && !processedIgUrl.startsWith("http")) {
        processedIgUrl = `https://${processedIgUrl}`;
      }

      // 儲存造訪記錄
      const res = await fetch("/api/v1/content/visited", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          county: COUNTY_NAMES[county as keyof typeof COUNTY_NAMES],
          note: note.trim(),
          ig_url: processedIgUrl || null,
          image_url: imageUrls[0] || null, // 保持向後相容性
          image_urls: imageUrls,
          is_public: isPublic,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || t("error_save_failed"));
      }

      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("error_save_failed"));
    } finally {
      setIsLoading(false);
      setUploadProgress("");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900/80 backdrop-blur-sm shadow-2xl rounded-2xl p-8 max-w-lg w-full max-h-[90vh] overflow-y-auto border border-gray-800">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white">{t("add_place")}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
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
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label
              htmlFor="county"
              className="block text-sm font-medium text-gray-300 mb-2"
            >
              {t("county")}
            </label>
            <select
              id="county"
              value={county}
              onChange={(e) => setCounty(e.target.value)}
              className="w-full bg-gray-800 text-white px-4 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              required
            >
              <option value="">{t("select_county")}</option>
              {Object.keys(COUNTY_NAMES).map((name) => (
                <option key={name} value={name}>
                  {t(`countiesArray.${name}`, name)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="note"
              className="block text-sm font-medium text-gray-300 mb-2"
            >
              {t("description")}
            </label>
            <textarea
              id="note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full bg-gray-800 text-white px-4 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              rows={3}
              placeholder={t("description_placeholder")}
            />
          </div>

          <div>
            <label
              htmlFor="igUrl"
              className="block text-sm font-medium text-gray-300 mb-2"
            >
              {t("instagram_url")}
            </label>
            <input
              type="url"
              id="igUrl"
              value={igUrl}
              onChange={(e) => setIgUrl(e.target.value)}
              className="w-full bg-gray-800 text-white px-4 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              placeholder={t("instagram_url_placeholder")}
            />
          </div>

          {/* 多圖片上傳區域 */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                {t("upload_images")}
              </label>
              
              {/* 圖片預覽網格 */}
              {imagePreviews.length > 0 && (
                <div className="grid grid-cols-3 gap-3 mb-4">
                  {imagePreviews.map((preview, index) => (
                    <div key={index} className="relative aspect-square">
                      <Image
                        src={preview}
                        alt={`${t("visit_photo")} ${index + 1}`}
                        fill
                        className="object-contain bg-gray-800 rounded-lg"
                      />
                      {/* 編輯按鈕 */}
                      <button
                        type="button"
                        onClick={() => handleEditImage(index)}
                        className="absolute top-2 left-2 bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-blue-600 text-xs opacity-80 hover:opacity-100 transition-opacity z-10"
                        title="編輯圖片"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      {/* 移除按鈕 */}
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(index)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600 text-xs"
                        title={t("remove_image")}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* 上傳區域 */}
              <div 
                className="border-2 border-dashed border-gray-600 rounded-lg p-6 text-center hover:border-gray-500 transition-colors"
                onDragOver={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  
                  if (imageFiles.length >= IMAGE_UPLOAD_LIMITS.MAX_COUNT) {
                    setError(t("max_images_limit"));
                    return;
                  }
                  
                  const files = Array.from(e.dataTransfer.files);
                  if (files.length > 0) {
                    // 檢查總數量限制
                    if (imageFiles.length + files.length > IMAGE_UPLOAD_LIMITS.MAX_COUNT) {
                      setError(t("max_images_limit"));
                      return;
                    }

                    // 驗證每個檔案
                    const validFiles: File[] = [];
                    const newPreviews: string[] = [];
                    const errors: string[] = [];

                    files.forEach(file => {
                      // 檢查檔案類型
                      if (!file.type.startsWith("image/")) {
                        errors.push(t("image_upload_limits.invalid_format", { filename: file.name }));
                        return;
                      }

                      // 檢查檔案大小（5MB 限制）
                      if (file.size > IMAGE_UPLOAD_LIMITS.MAX_FILE_SIZE) {
                        const fileSizeMB = (file.size / (1024 * 1024)).toFixed(1);
                        const maxSizeMB = IMAGE_UPLOAD_LIMITS.MAX_FILE_SIZE / (1024 * 1024);
                        errors.push(t("image_upload_limits.file_too_large", { 
                          filename: file.name, 
                          size: fileSizeMB, 
                          limit: maxSizeMB 
                        }));
                        return;
                      }


                      validFiles.push(file);
                      newPreviews.push(URL.createObjectURL(file));
                    });

                    // 顯示錯誤訊息
                    if (errors.length > 0) {
                      setError(errors.join('\n'));
                      return;
                    }

                    if (validFiles.length > 0) {
                      setImageFiles(prev => [...prev, ...validFiles]);
                      setImagePreviews(prev => [...prev, ...newPreviews]);
                      setError(""); // 清除錯誤訊息
                    }
                  }
                }}
              >
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageChange}
                  className="hidden"
                  id="images-upload"
                  disabled={imageFiles.length >= IMAGE_UPLOAD_LIMITS.MAX_COUNT}
                />
                <label
                  htmlFor="images-upload"
                  className={`cursor-pointer ${
                    imageFiles.length >= IMAGE_UPLOAD_LIMITS.MAX_COUNT 
                      ? "text-gray-500 cursor-not-allowed" 
                      : "text-gray-300 hover:text-white"
                  }`}
                >
                  <div className="space-y-2">
                    <svg
                      className="w-8 h-8 mx-auto text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                      />
                    </svg>
                    <p className="text-sm">
                      {imageFiles.length >= IMAGE_UPLOAD_LIMITS.MAX_COUNT 
                        ? t("max_images_limit")
                        : t("drag_drop_images")
                      }
                    </p>
                    {imageFiles.length > 0 && (
                      <p className="text-xs text-blue-400">
                        {t("selected_images", { count: imageFiles.length })}
                      </p>
                    )}
                    {/* 容量限制提示 */}
                    <div className="text-xs text-gray-500 space-y-1">
                      <p>• {t("image_upload_limits.max_count", { count: IMAGE_UPLOAD_LIMITS.MAX_COUNT })}</p>
                      <p>• {t("image_upload_limits.max_size", { size: IMAGE_UPLOAD_LIMITS.MAX_FILE_SIZE / (1024 * 1024) })}</p>
                      <p>• {t("image_upload_limits.supported_formats", { formats: IMAGE_UPLOAD_LIMITS.SUPPORTED_EXTENSIONS.join(", ").toUpperCase() })}</p>
                    </div>
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* 隱私設定 */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-300">
              {t("privacy.title")}
            </label>
            <div className="space-y-2">
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="radio"
                  name="privacy"
                  checked={isPublic}
                  onChange={() => setIsPublic(true)}
                  className="w-4 h-4 text-blue-600 bg-gray-800 border-gray-600 focus:ring-blue-500"
                />
                <div>
                  <div className="text-white text-sm font-medium">{t("privacy.public")}</div>
                  <div className="text-gray-400 text-xs">{t("privacy.public_desc")}</div>
                </div>
              </label>
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="radio"
                  name="privacy"
                  checked={!isPublic}
                  onChange={() => setIsPublic(false)}
                  className="w-4 h-4 text-blue-600 bg-gray-800 border-gray-600 focus:ring-blue-500"
                />
                <div>
                  <div className="text-white text-sm font-medium">{t("privacy.private")}</div>
                  <div className="text-gray-400 text-xs">{t("privacy.private_desc")}</div>
                </div>
              </label>
            </div>
          </div>

          {error && <div className="text-red-500 text-sm mt-2">{error}</div>}
          
          {uploadProgress && (
            <div className="text-blue-400 text-sm mt-2">{uploadProgress}</div>
          )}

          <div className="flex justify-end gap-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
              disabled={isLoading}
            >
              {t("cancel")}
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isLoading}
            >
              {isLoading ? t("loading") : t("save")}
            </button>
          </div>
        </form>
      </div>

      {/* 圖片編輯器 */}
      {editingImageFile && (
        <ImageEditor
          imageFile={editingImageFile}
          onSave={handleImageEditSave}
          onCancel={handleImageEditCancel}
        />
      )}
    </div>
  );
}
