"use client";

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

interface ImageEditorProps {
  imageFile: File;
  onSave: (editedImage: Blob) => void;
  onCancel: () => void;
}

export default function ImageEditor({
  imageFile,
  onSave,
  onCancel,
}: ImageEditorProps) {
  const { t } = useTranslation();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const [imageUrl, setImageUrl] = useState<string>('');
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [scale, setScale] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });

  // 觸控縮放支援
  const [touchStart, setTouchStart] = useState<{ x: number; y: number; distance: number } | null>(null);
  const [lastTouchDistance, setLastTouchDistance] = useState<number>(0);

  // 載入圖片
  useEffect(() => {
    if (imageFile) {
      const url = URL.createObjectURL(imageFile);
      setImageUrl(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [imageFile]);

  // 圖片載入完成
  const handleImageLoad = () => {
    const img = imageRef.current;
    if (img) {
      setImageSize({ width: img.naturalWidth, height: img.naturalHeight });
      setImageLoaded(true);
    }
  };

  // 繪製預覽
  const drawPreview = useCallback(() => {
    const canvas = canvasRef.current;
    const image = imageRef.current;
    if (!canvas || !image || !imageLoaded) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 設定畫布大小（Instagram 風格的比例）
    const canvasWidth = 400;
    const canvasHeight = 500; // 4:5 比例，類似 Instagram
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;

    // 清除畫布
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);

    // 計算圖片繪製位置和大小
    const imageAspect = image.naturalWidth / image.naturalHeight;
    const canvasAspect = canvasWidth / canvasHeight;
    
    let drawWidth, drawHeight;
    
    if (imageAspect > canvasAspect) {
      // 圖片較寬，以寬度為準
      drawWidth = canvasWidth * scale;
      drawHeight = drawWidth / imageAspect;
    } else {
      // 圖片較高，以高度為準
      drawHeight = canvasHeight * scale;
      drawWidth = drawHeight * imageAspect;
    }

    const drawX = (canvasWidth - drawWidth) / 2 + position.x;
    const drawY = (canvasHeight - drawHeight) / 2 + position.y;

    // 繪製圖片
    ctx.drawImage(image, drawX, drawY, drawWidth, drawHeight);
  }, [position, scale, imageLoaded]);

  // 重新繪製預覽
  useEffect(() => {
    drawPreview();
  }, [drawPreview]);

  // 滑鼠按下
  const handleMouseDown = (e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setIsDragging(true);
    setDragStart({ x: x - position.x, y: y - position.y });
  };

  // 滑鼠移動
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setPosition({
      x: x - dragStart.x,
      y: y - dragStart.y
    });
  };

  // 滑鼠放開
  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // 計算兩點之間的距離
  const getTouchDistance = (touches: React.TouchList) => {
    if (touches.length < 2) return 0;
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  // 觸控開始
  const handleTouchStart = (e: React.TouchEvent) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (e.touches.length === 2) {
      // 雙指觸控 - 準備縮放
      const distance = getTouchDistance(e.touches);
      setTouchStart({ x: 0, y: 0, distance });
      setLastTouchDistance(distance);
    } else if (e.touches.length === 1) {
      // 單指觸控 - 準備拖拽
      const rect = canvas.getBoundingClientRect();
      const touch = e.touches[0];
      const x = touch.clientX - rect.left;
      const y = touch.clientY - rect.top;

      setIsDragging(true);
      setDragStart({ x: x - position.x, y: y - position.y });
    }
  };

  // 觸控移動
  const handleTouchMove = (e: React.TouchEvent) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (e.touches.length === 2 && touchStart) {
      // 雙指觸控 - 縮放
      const distance = getTouchDistance(e.touches);
      
      if (lastTouchDistance > 0) {
        const scaleDelta = (distance - lastTouchDistance) / 200;
        const newScale = Math.max(0.5, Math.min(3, scale + scaleDelta));
        setScale(newScale);
      }
      
      setLastTouchDistance(distance);
    } else if (e.touches.length === 1 && isDragging) {
      // 單指觸控 - 拖拽
      const rect = canvas.getBoundingClientRect();
      const touch = e.touches[0];
      const x = touch.clientX - rect.left;
      const y = touch.clientY - rect.top;

      setPosition({
        x: x - dragStart.x,
        y: y - dragStart.y
      });
    }
  };

  // 觸控結束
  const handleTouchEnd = (e: React.TouchEvent) => {
    e.preventDefault();
    if (e.touches.length === 0) {
      // 所有手指都離開，重置狀態
      setIsDragging(false);
      setTouchStart(null);
      setLastTouchDistance(0);
    }
  };

  // 縮放變更
  const handleScaleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setScale(parseFloat(e.target.value));
  };

  // 重置
  const handleReset = () => {
    setPosition({ x: 0, y: 0 });
    setScale(1);
  };

  // 儲存編輯後的圖片
  const handleSave = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.toBlob((blob) => {
      if (blob) {
        onSave(blob);
      }
    }, 'image/jpeg', 0.9);
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-gray-900 rounded-2xl p-4 sm:p-6 w-full max-w-sm sm:max-w-lg mx-auto max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <h3 className="text-lg sm:text-xl font-bold text-white">
            {t("edit_image")}
          </h3>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-white transition-colors p-1"
          >
            <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* 隱藏的原始圖片 */}
        {imageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            ref={imageRef}
            src={imageUrl}
            alt="Original"
            className="hidden"
            onLoad={handleImageLoad}
          />
        )}

        {/* 預覽畫布 */}
        <div className="flex justify-center mb-4 sm:mb-6">
          <div className="relative w-full max-w-xs sm:max-w-sm">
            <canvas
              ref={canvasRef}
              className="border-2 border-gray-600 rounded-lg cursor-move w-full h-auto touch-none"
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            />
            <div className="absolute top-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
              {imageSize.width} × {imageSize.height}
            </div>
          </div>
        </div>

        {/* 縮放控制 */}
        <div className="mb-4 sm:mb-6">
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs sm:text-sm font-medium text-gray-300">
              {t("scale")}
            </label>
            <span className="text-xs sm:text-sm text-gray-400">
              {Math.round(scale * 100)}%
            </span>
          </div>
          <input
            type="range"
            min="0.5"
            max="3"
            step="0.1"
            value={scale}
            onChange={handleScaleChange}
            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider touch-manipulation"
            style={{ touchAction: 'manipulation' }}
          />
        </div>

        {/* 操作說明 */}
        <div className="mb-4 sm:mb-6 p-2 sm:p-3 bg-gray-800 rounded-lg">
          <p className="text-gray-300 text-xs sm:text-sm text-center">
            {t("image_editor_instruction")}
          </p>
        </div>

        {/* 按鈕區域 */}
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
          <button
            type="button"
            onClick={handleReset}
            className="flex-1 px-3 sm:px-4 py-2 text-gray-300 border border-gray-600 rounded-lg hover:bg-gray-800 transition-colors touch-manipulation text-sm sm:text-base"
            style={{ touchAction: 'manipulation' }}
          >
            {t("reset")}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 px-3 sm:px-4 py-2 text-gray-300 border border-gray-600 rounded-lg hover:bg-gray-800 transition-colors touch-manipulation text-sm sm:text-base"
            style={{ touchAction: 'manipulation' }}
          >
            {t("cancel")}
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="flex-1 px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors touch-manipulation text-sm sm:text-base"
            style={{ touchAction: 'manipulation' }}
          >
            {t("save")}
          </button>
        </div>
      </div>
    </div>
  );
} 