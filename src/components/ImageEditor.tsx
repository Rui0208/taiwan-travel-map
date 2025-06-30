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
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-2xl p-6 max-w-lg w-full mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-white">
            {t("edit_image")}
          </h3>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
        <div className="flex justify-center mb-6">
          <div className="relative">
            <canvas
              ref={canvasRef}
              className="border-2 border-gray-600 rounded-lg cursor-move max-w-full"
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            />
            <div className="absolute top-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
              {imageSize.width} × {imageSize.height}
            </div>
          </div>
        </div>

        {/* 縮放控制 */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-gray-300">
              {t("scale")}
            </label>
            <span className="text-sm text-gray-400">
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
            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
          />
        </div>

        {/* 操作說明 */}
        <div className="mb-6 p-3 bg-gray-800 rounded-lg">
          <p className="text-gray-300 text-sm text-center">
            {t("image_editor_instruction")}
          </p>
        </div>

        {/* 按鈕區域 */}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={handleReset}
            className="flex-1 px-4 py-2 text-gray-300 border border-gray-600 rounded-lg hover:bg-gray-800 transition-colors"
          >
            {t("reset")}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 px-4 py-2 text-gray-300 border border-gray-600 rounded-lg hover:bg-gray-800 transition-colors"
          >
            {t("cancel")}
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            {t("save")}
          </button>
        </div>
      </div>
    </div>
  );
} 