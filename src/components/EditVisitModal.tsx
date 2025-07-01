"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useTranslation } from "react-i18next";
import { COUNTY_NAMES, VisitedPlace } from "@/api/types";
import { IMAGE_UPLOAD_LIMITS } from "@/lib/constants";

interface EditVisitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  visitData: VisitedPlace;
}

export default function EditVisitModal({
  isOpen,
  onClose,
  onSuccess,
  visitData,
}: EditVisitModalProps) {
  const { t } = useTranslation();
  
  // 找出對應的中文縣市名稱
  const getCountyKey = (englishName: string) => {
    // 先嘗試直接匹配
    const entry = Object.entries(COUNTY_NAMES).find(([, value]) => value === englishName);
    if (entry) return entry[0];
    
    // 如果沒有找到，嘗試移除 " County" 後綴
    const nameWithoutCounty = englishName.replace(/\s+County$/, '');
    const entryWithoutCounty = Object.entries(COUNTY_NAMES).find(([, value]) => value === nameWithoutCounty);
    if (entryWithoutCounty) return entryWithoutCounty[0];
    
    // 如果還是沒有找到，嘗試移除 " City" 後綴
    const nameWithoutCity = englishName.replace(/\s+City$/, '');
    const entryWithoutCity = Object.entries(COUNTY_NAMES).find(([, value]) => value === nameWithoutCity);
    if (entryWithoutCity) return entryWithoutCity[0];
    
    // 如果都沒有找到，預設為臺北
    console.warn(`無法找到縣市名稱對應: ${englishName}`);
    return "臺北";
  };

  const [county, setCounty] = useState<string>(getCountyKey(visitData.county));
  const [note, setNote] = useState(visitData.note || "");
  const [igUrl, setIgUrl] = useState(visitData.ig_url || "");
  const [isPublic, setIsPublic] = useState(visitData.is_public ?? true);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [removedImages, setRemovedImages] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // 初始化現有圖片
  useEffect(() => {
    if (visitData.image_urls && visitData.image_urls.length > 0) {
      setExistingImages(visitData.image_urls);
    } else if (visitData.image_url) {
      setExistingImages([visitData.image_url]);
    } else {
      setExistingImages([]);
    }
  }, [visitData]);

  useEffect(() => {
    if (isOpen) {
      console.log("Edit Modal opened with visitData:", visitData);
      setCounty(getCountyKey(visitData.county));
      setNote(visitData.note || "");
      setIgUrl(visitData.ig_url || "");
      setIsPublic(visitData.is_public ?? true);
      setImageFiles([]);
      setImagePreviews([]);
      setRemovedImages([]);
      setUploadProgress("");
      setError("");
      
      // 重新設置現有圖片
      if (visitData.image_urls && visitData.image_urls.length > 0) {
        setExistingImages(visitData.image_urls);
      } else if (visitData.image_url) {
        setExistingImages([visitData.image_url]);
      } else {
        setExistingImages([]);
      }
    }
  }, [isOpen, visitData]);

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

    // 檢查總數量限制（現有圖片 + 新圖片 - 已移除圖片）
    const totalImages = existingImages.length - removedImages.length + imageFiles.length + files.length;
    if (totalImages > IMAGE_UPLOAD_LIMITS.MAX_COUNT) {
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

  const handleRemoveNewImage = (index: number) => {
    // 清理預覽 URL
    URL.revokeObjectURL(imagePreviews[index]);
    
    // 移除檔案和預覽
    setImageFiles(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleRemoveExistingImage = (imageUrl: string) => {
    setRemovedImages(prev => [...prev, imageUrl]);
  };

  const handleRestoreExistingImage = (imageUrl: string) => {
    setRemovedImages(prev => prev.filter(url => url !== imageUrl));
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
      let newImageUrls: string[] = [];

      // 如果有新圖片，先批量上傳到 Supabase Storage
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
        newImageUrls = uploadResult.urls;

        setUploadProgress(t("uploading_images", { 
          current: uploadResult.uploadedCount, 
          total: imageFiles.length 
        }));
      }

      // 計算最終的圖片 URL 列表
      const finalImageUrls = [
        ...existingImages.filter(url => !removedImages.includes(url)),
        ...newImageUrls
      ];

      // 處理 Instagram 連結
      let processedIgUrl = igUrl.trim();
      if (processedIgUrl && !processedIgUrl.startsWith("http")) {
        processedIgUrl = `https://${processedIgUrl}`;
      }

      // 更新造訪記錄
      const res = await fetch(`/api/v1/content/visited/${visitData.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          county: county,
          note: note.trim(),
          ig_url: processedIgUrl || null,
          image_url: finalImageUrls[0] || null, // 保持向後相容性
          image_urls: finalImageUrls,
          is_public: isPublic,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || t("error_update_failed"));
      }

      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("error_update_failed"));
    } finally {
      setIsLoading(false);
      setUploadProgress("");
    }
  };

  const handleDelete = async () => {
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch(`/api/v1/content/visited/${visitData.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error(t("error_delete_failed"));
      }

      onSuccess();
      onClose();
      setIsDeleteModalOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("error_delete_failed"));
    } finally {
      setIsLoading(false);
    }
  };

  // 計算剩餘圖片總數
  const remainingImagesCount = existingImages.length - removedImages.length + imageFiles.length;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900/80 backdrop-blur-sm shadow-2xl rounded-2xl p-8 max-w-lg w-full max-h-[90vh] overflow-y-auto border border-gray-800">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white">{t("edit_place")}</h2>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsDeleteModalOpen(true)}
              className="text-red-400 hover:text-red-300 transition-colors p-1"
              title={t("delete")}
              disabled={isLoading}
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
            </button>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors p-1"
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

          {/* 多圖片編輯區域 */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                {t("upload_images")} ({remainingImagesCount}/10)
              </label>
              
              {/* 現有圖片 */}
              {existingImages.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-sm text-gray-400 mb-2">{t("existing_images")}</h4>
                  <div className="grid grid-cols-3 gap-3">
                    {existingImages.map((imageUrl, index) => (
                      <div key={`existing-${index}`} className="relative aspect-square">
                        <Image
                          src={imageUrl}
                          alt={`現有圖片 ${index + 1}`}
                          fill
                          className={`object-contain bg-gray-800 rounded-lg ${
                            removedImages.includes(imageUrl) ? 'opacity-30' : ''
                          }`}
                        />
                        {removedImages.includes(imageUrl) ? (
                          <button
                            type="button"
                            onClick={() => handleRestoreExistingImage(imageUrl)}
                            className="absolute inset-0 bg-green-500/80 rounded-lg flex items-center justify-center"
                            title="恢復圖片"
                          >
                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleRemoveExistingImage(imageUrl)}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600 text-xs"
                            title="移除圖片"
                          >
                            ×
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* 新圖片預覽 */}
              {imagePreviews.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-sm text-gray-400 mb-2">{t("new_images")}</h4>
                  <div className="grid grid-cols-3 gap-3">
                    {imagePreviews.map((preview, index) => (
                      <div key={`new-${index}`} className="relative aspect-square">
                        <Image
                          src={preview}
                          alt={`新圖片 ${index + 1}`}
                          fill
                          className="object-contain bg-gray-800 rounded-lg"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveNewImage(index)}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600 text-xs"
                          title={t("remove_image")}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
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
                  
                  if (remainingImagesCount >= IMAGE_UPLOAD_LIMITS.MAX_COUNT) {
                    setError(t("max_images_limit"));
                    return;
                  }
                  
                  const files = Array.from(e.dataTransfer.files);
                  if (files.length > 0) {
                    // 檢查總數量限制（現有圖片 + 新圖片 - 已移除圖片）
                    const totalImages = existingImages.length - removedImages.length + imageFiles.length + files.length;
                    if (totalImages > IMAGE_UPLOAD_LIMITS.MAX_COUNT) {
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
                  disabled={remainingImagesCount >= 10}
                />
                <label
                  htmlFor="images-upload"
                  className={`cursor-pointer ${
                    remainingImagesCount >= 10
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
                      {remainingImagesCount >= 10
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
              {isLoading ? t("updating") : t("update")}
            </button>
          </div>
        </form>
      </div>

      {/* 刪除確認模態框 */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-60 flex items-center justify-center p-4">
          <div className="bg-gray-900 rounded-2xl p-6 max-w-md w-full border border-gray-800">
            <h3 className="text-xl font-bold text-white mb-4">{t("delete_confirm_title")}</h3>
            <p className="text-gray-400 mb-6">{t("delete_confirm_message")}</p>
            
            {error && <div className="text-red-500 text-sm mb-4">{error}</div>}
            
            <div className="flex justify-end gap-4">
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
                disabled={isLoading}
              >
                {t("cancel")}
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isLoading}
              >
                {isLoading ? t("deleting") : t("delete")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
