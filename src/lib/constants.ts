// 圖片上傳限制常數
export const IMAGE_UPLOAD_LIMITS = {
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
  MIN_FILE_SIZE: 10 * 1024, // 10KB
  MAX_COUNT: 10, // 最多 10 張圖片
  SUPPORTED_FORMATS: ['image/jpeg', 'image/png', 'image/gif'],
  SUPPORTED_EXTENSIONS: ['jpg', 'jpeg', 'png', 'gif'],
} as const;

// 檔案大小格式化函數
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}; 