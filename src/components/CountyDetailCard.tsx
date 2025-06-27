"use client";

import { type VisitedPlace } from "@/api/types";
import Image from "next/image";
import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";

interface CountyDetailCardProps {
  countyName: string;
  visitedData: VisitedPlace[];
  onClose: () => void;
  onEdit: (id: string) => void;
  onAdd?: (countyName: string) => void;
  isSidebar?: boolean;
}

const CountyDetailCard = ({
  countyName,
  visitedData,
  onClose,
  onEdit,
  onAdd,
  isSidebar = false,
}: CountyDetailCardProps) => {
  const { t, i18n } = useTranslation();
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const visitCount = visitedData.length;

  // 當 visitedData 改變時，重置 selectedImageIndex
  useEffect(() => {
    if (visitedData.length > 0 && selectedImageIndex >= visitedData.length) {
      setSelectedImageIndex(0);
    }
  }, [visitedData.length, selectedImageIndex]);

  const handleCardClick = (visit: VisitedPlace) => {
    if (visit.ig_url) {
      // 如果有 Instagram 連結，在新視窗開啟
      window.open(visit.ig_url, "_blank");
    } else {
      // 如果沒有 Instagram 連結，開啟編輯 Modal
      onEdit(visit.id);
    }
  };

  // 根據當前語言設定時間格式
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const locale = i18n.language === "zh-Hant" ? "zh-TW" : "en-US";

    return date.toLocaleDateString(locale, {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // 根據當前語言決定顯示的縣市名稱
  const displayCountyName = t(`countiesArray.${countyName}`, countyName);

  if (isSidebar) {
    return (
      <div className="h-full flex flex-col">
        <div className="flex-none p-4 border-b border-gray-800">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-xl font-bold text-white">
                {displayCountyName}
              </h2>
              <p className="text-sm text-blue-400 mt-1">
                {t("visit_count", { count: visitCount })}
              </p>
            </div>
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
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {visitedData.length > 0 ? (
            <div className="space-y-4">
              {visitedData.map((visit) => (
                <div
                  key={visit.id}
                  className={`bg-gray-800/50 rounded-lg overflow-hidden border border-gray-700 hover:border-gray-600 transition-colors ${
                    visit.ig_url ? "cursor-pointer" : ""
                  }`}
                  onClick={() => handleCardClick(visit)}
                >
                  {visit.image_url && (
                    <div className="relative w-full aspect-[16/9] overflow-hidden">
                      <Image
                        src={visit.image_url}
                        alt={visit.note || t("visit_photo")}
                        fill
                        sizes="400px"
                                                  className="object-contain hover:scale-105 transition-transform duration-300"
                      />
                      {visit.ig_url && (
                        <div className="absolute inset-0 bg-black/0 hover:bg-black/20 transition-colors flex items-center justify-center">
                          <div className="opacity-0 hover:opacity-100 transition-opacity text-white flex items-center gap-2">
                            <svg
                              className="w-4 h-4"
                              viewBox="0 0 24 24"
                              fill="currentColor"
                            >
                              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                            </svg>
                            <span className="text-xs font-medium">
                              {t("view_instagram_post")}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  <div className="p-3">
                    <p className="text-gray-300 text-sm mb-2 line-clamp-2">
                      {visit.note}
                    </p>
                    <div className="flex justify-between items-center mt-3">
                      <p className="text-gray-500 text-xs">
                        {formatDate(visit.created_at)}
                      </p>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onEdit(visit.id);
                        }}
                        className="text-gray-400 hover:text-white transition-colors p-1"
                        title={t("edit")}
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center py-8">
                <p className="text-gray-400 text-base mb-4">
                  {t("no_visits_yet")}
                </p>
                <button
                  onClick={() => (onAdd ? onAdd(countyName) : onEdit("new"))}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm transition-colors"
                >
                  {t("add_first_visit")}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="w-full h-full bg-gray-900/95 backdrop-blur-sm relative overflow-y-auto">
        <div className="sticky top-0 z-10 bg-gray-900/95 backdrop-blur-sm border-b border-gray-800 p-4">
          <div className="max-w-7xl mx-auto flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold text-white">
                {displayCountyName}
              </h2>
              <p className="text-sm text-blue-400 mt-1">
                {t("visit_count", { count: visitCount })}
              </p>
            </div>
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
        </div>

        <div className="max-w-7xl mx-auto p-4">
          {visitedData.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {visitedData.map((visit) => (
                <div
                  key={visit.id}
                  className={`bg-gray-800/50 rounded-xl overflow-hidden border border-gray-700 hover:border-gray-600 transition-colors ${
                    visit.ig_url ? "cursor-pointer" : ""
                  }`}
                  onClick={() => handleCardClick(visit)}
                >
                  {/* 圖片顯示 - 支援多圖片 */}
                  {(() => {
                    const images = visit.image_urls && visit.image_urls.length > 0 
                      ? visit.image_urls 
                      : visit.image_url 
                        ? [visit.image_url] 
                        : [];
                    
                    if (images.length === 0) return null;
                    
                    return (
                      <div className="relative w-full aspect-[4/3] overflow-hidden bg-gray-800">
                        <Image
                          src={images[0]}
                          alt={visit.note || t("visit_photo")}
                          fill
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                          className="object-contain hover:scale-105 transition-transform duration-300"
                        />
                        {/* 多圖片指示器 */}
                        {images.length > 1 && (
                          <div className="absolute top-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded-full">
                            1/{images.length}
                          </div>
                        )}
                        {visit.ig_url && (
                          <div className="absolute inset-0 bg-black/0 hover:bg-black/20 transition-colors flex items-center justify-center">
                            <div className="opacity-0 hover:opacity-100 transition-opacity text-white flex items-center gap-2">
                              <svg
                                className="w-5 h-5"
                                viewBox="0 0 24 24"
                                fill="currentColor"
                              >
                                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                              </svg>
                              <span className="text-sm font-medium">
                                {t("view_instagram_post")}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                  <div className="p-4">
                    <p className="text-gray-300 text-sm mb-2 line-clamp-2">
                      {visit.note}
                    </p>
                    <div className="flex justify-between items-center mt-3">
                      <p className="text-gray-500 text-xs">
                        {formatDate(visit.created_at)}
                      </p>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onEdit(visit.id);
                        }}
                        className="text-gray-400 hover:text-white transition-colors p-1"
                        title={t("edit")}
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
                            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center py-16">
                <p className="text-gray-400 text-lg mb-6">
                  {t("no_visits_yet")}
                </p>
                <button
                  onClick={() => (onAdd ? onAdd(countyName) : onEdit("new"))}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg text-base transition-colors"
                >
                  {t("add_first_visit")}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CountyDetailCard;
