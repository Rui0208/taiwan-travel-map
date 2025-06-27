import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

interface AvatarEditorProps {
  imageFile: File;
  onSave: (croppedImage: Blob) => void;
  onCancel: () => void;
  initialPosition?: { x: number; y: number };
  initialScale?: number;
}

export default function AvatarEditor({
  imageFile,
  onSave,
  onCancel,
  initialPosition = { x: 0, y: 0 },
  initialScale = 1
}: AvatarEditorProps) {
  const { t } = useTranslation();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const [imageUrl, setImageUrl] = useState<string>('');
  const [position, setPosition] = useState(initialPosition);
  const [scale, setScale] = useState(initialScale);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [imageLoaded, setImageLoaded] = useState(false);

  // 載入圖片
  useEffect(() => {
    if (imageFile) {
      const url = URL.createObjectURL(imageFile);
      setImageUrl(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [imageFile]);

  // 繪製預覽
  const drawPreview = useCallback(() => {
    const canvas = canvasRef.current;
    const image = imageRef.current;
    if (!canvas || !image || !imageLoaded) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 設定畫布大小
    const size = 200;
    canvas.width = size;
    canvas.height = size;

    // 清除畫布
    ctx.clearRect(0, 0, size, size);

    // 建立圓形遮罩
    ctx.save();
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
    ctx.clip();

    // 計算圖片繪製位置和大小
    const imageAspect = image.naturalWidth / image.naturalHeight;
    let drawWidth = size * scale;
    let drawHeight = size * scale;
    
    if (imageAspect > 1) {
      drawHeight = drawWidth / imageAspect;
    } else {
      drawWidth = drawHeight * imageAspect;
    }

    const drawX = (size - drawWidth) / 2 + position.x;
    const drawY = (size - drawHeight) / 2 + position.y;

    // 繪製圖片
    ctx.drawImage(image, drawX, drawY, drawWidth, drawHeight);
    ctx.restore();

    // 繪製圓形邊框
    ctx.strokeStyle = '#374151';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size / 2 - 1, 0, Math.PI * 2);
    ctx.stroke();
  }, [position, scale, imageLoaded]);

  // 圖片載入完成
  const handleImageLoad = () => {
    setImageLoaded(true);
  };

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

  // 重置位置
  const handleReset = () => {
    setPosition({ x: 0, y: 0 });
    setScale(1);
  };

  // 儲存裁切後的圖片
  const handleSave = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.toBlob((blob) => {
      if (blob) {
        onSave(blob);
      }
    }, 'image/png', 0.9);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-2xl p-6 max-w-md w-full mx-auto">
        <h3 className="text-xl font-bold text-white mb-6 text-center">
          {t("avatar_editor.edit_avatar")}
        </h3>

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
          <canvas
            ref={canvasRef}
            className="border-2 border-gray-600 rounded-full cursor-move"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          />
        </div>

        {/* 縮放滑桿 */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            {t("avatar_editor.scale")}: {Math.round(scale * 100)}%
          </label>
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
            {t("avatar_editor.avatar_editor_instruction")}
          </p>
        </div>

        {/* 按鈕區域 */}
        <div className="flex space-x-3">
          <button
            onClick={handleReset}
            className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
          >
            {t("avatar_editor.reset")}
          </button>
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded-lg transition-colors"
          >
            {t("cancel")}
          </button>
          <button
            onClick={handleSave}
            disabled={!imageLoaded}
            className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
          >
            {t("save")}
          </button>
        </div>
      </div>

      <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: #3b82f6;
          cursor: pointer;
          border: 2px solid #1f2937;
        }
        
        .slider::-moz-range-thumb {
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: #3b82f6;
          cursor: pointer;
          border: 2px solid #1f2937;
        }
      `}</style>
    </div>
  );
} 