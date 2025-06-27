"use client";

import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination, Zoom } from "swiper/modules";
import Image from "next/image";
import { useState } from "react";

// 引入 Swiper 樣式
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import "swiper/css/zoom";

interface ImageCarouselProps {
  images: string[];
  alt?: string;
  className?: string;
  aspectRatio?: "square" | "portrait" | "landscape" | "auto";
  objectFit?: "cover" | "contain";
}

export default function ImageCarousel({
  images,
  alt = "圖片",
  className = "",
  aspectRatio = "auto",
  objectFit = "contain"
}: ImageCarouselProps) {
  const [currentSlide, setCurrentSlide] = useState(0);

  if (!images || images.length === 0) {
    return null;
  }

  // 單張圖片時不需要輪播
  if (images.length === 1) {
    return (
      <div className={`relative overflow-hidden bg-gray-900 ${className}`}>
        <div className={`relative w-full ${getAspectRatioClass(aspectRatio)}`}>
          <Image
            src={images[0]}
            alt={alt}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className={objectFit === "contain" ? "object-contain" : "object-cover"}
          />
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>

      <Swiper
        modules={[Navigation, Pagination, Zoom]}
        spaceBetween={0}
        slidesPerView={1}
        navigation={{
          nextEl: ".swiper-button-next-custom",
          prevEl: ".swiper-button-prev-custom",
        }}
        pagination={{
          clickable: true,
          bulletClass: "swiper-pagination-bullet",
          bulletActiveClass: "swiper-pagination-bullet-active",
        }}
        zoom={true}
        onSlideChange={(swiper) => setCurrentSlide(swiper.activeIndex)}
        className="w-full h-full"
      >
        {images.map((image, index) => (
          <SwiperSlide key={index}>
            <div className={`relative w-full bg-gray-900 ${getAspectRatioClass(aspectRatio)}`}>
              <div className="swiper-zoom-container">
                <Image
                  src={image}
                  alt={`${alt} ${index + 1}`}
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  className={objectFit === "contain" ? "object-contain" : "object-cover"}
                />
              </div>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>

      {/* 自定義導航按鈕 */}
      {images.length > 1 && (
        <>
          <button
            className="swiper-button-prev-custom absolute left-2 top-1/2 -translate-y-1/2 z-10 bg-black/50 text-white rounded-full p-2 hover:bg-black/70 transition-colors"
            aria-label="上一張圖片"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>
          <button
            className="swiper-button-next-custom absolute right-2 top-1/2 -translate-y-1/2 z-10 bg-black/50 text-white rounded-full p-2 hover:bg-black/70 transition-colors"
            aria-label="下一張圖片"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>
        </>
      )}

      {/* 圖片計數器 */}
      {images.length > 1 && (
        <div className="absolute top-2 right-2 z-10 bg-black/50 text-white text-xs px-2 py-1 rounded-full">
          {currentSlide + 1} / {images.length}
        </div>
      )}
    </div>
  );
}

function getAspectRatioClass(aspectRatio: string): string {
  switch (aspectRatio) {
    case "square":
      return "aspect-square";
    case "portrait":
      return "aspect-[3/4]";
    case "landscape":
      return "aspect-[4/3]";
    case "auto":
    default:
      // 使用較寬的比例來適應不同圖片尺寸
      return "aspect-[4/3] min-h-[200px] max-h-[400px]";
  }
} 