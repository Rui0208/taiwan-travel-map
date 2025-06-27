"use client";

import { useEffect, useState, useRef, useMemo, useCallback } from "react";
import "@svg-maps/taiwan";
import taiwan from "@svg-maps/taiwan";
import { useSession } from "next-auth/react";
import { useTranslation } from "react-i18next";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import Image from "next/image";
import { endpoints } from "@/api/endpoints";
import { fetcher } from "@/api/fetcher";
import {
  type VisitedPlace,
  type ApiResponse,
  COUNTY_NAMES_REVERSE,
} from "@/api/types";
import { countyToSlug } from "@/lib/utils";
import MapViewToggle from "./MapViewToggle";

interface TaiwanMapProps {
  onDataChange?: () => void;
  onStatsChange?: (stats: { totalCounties: number; totalPosts: number }) => void;
  initialViewMode?: 'mine' | 'all';
}

const TaiwanMap = ({ onDataChange, onStatsChange, initialViewMode = 'all' }: TaiwanMapProps) => {
  const { t } = useTranslation();
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);
  const [hoveredLocation, setHoveredLocation] = useState<string | null>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const [animatedPhotos, setAnimatedPhotos] = useState<
    Array<{ url: string; x: number; y: number; delay: number }>
  >([]);
  const [visiblePhotos, setVisiblePhotos] = useState<Set<number>>(new Set());
  const [showOnlyMine, setShowOnlyMine] = useState(initialViewMode === 'mine');
  const svgRef = useRef<SVGSVGElement>(null);
  const { data: session, status } = useSession();

  // 當 initialViewMode 改變時更新 showOnlyMine
  useEffect(() => {
    setShowOnlyMine(initialViewMode === 'mine');
  }, [initialViewMode]);

  // 決定要獲取哪些資料：所有人的或只有自己的
  const apiEndpoint = useMemo(() => {
    if (status === "unauthenticated") {
      // 訪客模式：只能看所有人的公開文章
      return endpoints.posts.list;
    } else if (status === "authenticated") {
      if (showOnlyMine) {
        return endpoints.visited.list; // 預設獲取自己的
      } else {
        return endpoints.posts.list; // 獲取所有人的
      }
    }
    return null; // loading 狀態
  }, [status, showOnlyMine]);

  const { data, error, isLoading } = useSWR<ApiResponse<VisitedPlace[]>>(
    apiEndpoint,
    fetcher
  );

  // 調試 mine 模式的資料載入問題
  useEffect(() => {
    if (showOnlyMine) {
      console.log("Mine mode debug:", {
        apiEndpoint,
        status,
        sessionUser: session?.user,
        data: data?.data,
        error,
        isLoading,
      });
    }
  }, [showOnlyMine, apiEndpoint, status, session, data, error, isLoading]);

  // 計算當前懸停縣市的遊記數量 - SVG 地圖返回的是英文名稱，需要直接使用
  const hoveredCountyCount = useMemo(() => {
    if (!data?.data || !hoveredLocation) return 0;

    // hoveredLocation 已經是英文名稱，直接使用
    return data.data.filter((item) => item.county === hoveredLocation).length;
  }, [data?.data, hoveredLocation]);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // 使用 useCallback 穩定化統計更新函數
  const updateStats = useCallback(() => {
    if (onStatsChange && data?.data) {
      const counties = new Set(data.data.map(item => item.county));
      onStatsChange({
        totalCounties: counties.size,
        totalPosts: data.data.length,
      });
    }
  }, [onStatsChange, data?.data]);

  // 當資料變化時，調用 onDataChange 並更新統計
  useEffect(() => {
    if (onDataChange && data) {
      onDataChange();
    }
    updateStats();
  }, [data, onDataChange, updateStats]);

  const handleLocationMouseOver = (event: React.MouseEvent<SVGElement>) => {
    const location = event.currentTarget.getAttribute("name");
    if (location) {
      setHoveredLocation(location);

      // 設定提示框位置和圖片位置都用瀏覽器座標
      setTooltipPosition({
        x: event.clientX,
        y: event.clientY,
      });

      setMousePosition({
        x: event.clientX,
        y: event.clientY,
      });

      // 生成隨機擴散的圖片位置
      if (data?.data) {
        // location 已經是英文名稱，直接使用來匹配資料庫中的格式
        const photosWithImages = data.data
          .filter((item) => item.county === location && item.image_url)
          .map((visit) => {
            const urls = Array.isArray(visit.image_url)
              ? visit.image_url
              : [visit.image_url];
            return urls;
          })
          .flat();

        const animatedPhotoData: Array<{
          url: string;
          x: number;
          y: number;
          delay: number;
        }> = [];

        photosWithImages.forEach((url, index) => {
          // 簡化位置計算 - 以滑鼠為中心的圓形分佈
          const angle = (index / photosWithImages.length) * 2 * Math.PI;
          const baseRadius = 80;
          const radiusVariation = (index % 3) * 25; // 分層
          const radius = baseRadius + radiusVariation;

          const x = Math.cos(angle) * radius;
          const y = Math.sin(angle) * radius;

          animatedPhotoData.push({
            url,
            x,
            y,
            delay: index * 150,
          });
        });

        setAnimatedPhotos(animatedPhotoData);
        setVisiblePhotos(new Set());

        // 逐個顯示圖片
        animatedPhotoData.forEach((_, index) => {
          setTimeout(() => {
            setVisiblePhotos((prev) => new Set([...prev, index]));
          }, index * 150);
        });
      }
    }
  };

  const handleLocationMouseMove = (event: React.MouseEvent<SVGElement>) => {
    // 更新提示框位置和圖片位置都用瀏覽器座標
    setTooltipPosition({
      x: event.clientX,
      y: event.clientY,
    });

    if (hoveredLocation) {
      setMousePosition({
        x: event.clientX,
        y: event.clientY,
      });
    }
  };

  const handleLocationMouseOut = () => {
    setHoveredLocation(null);
    setAnimatedPhotos([]);
    setVisiblePhotos(new Set());
  };

  const handleLocationClick = (event: React.MouseEvent<SVGElement>) => {
    const location = event.currentTarget.getAttribute("name");
    if (location) {
      // location 是英文名稱，需要轉換為中文再轉換為 slug
      const chineseCountyName = COUNTY_NAMES_REVERSE[location];
      if (chineseCountyName) {
        const slug = countyToSlug(chineseCountyName);
        // 根據當前模式決定要導向的 URL
        const baseUrl = `/pages/${slug}`;
        const url = showOnlyMine ? `${baseUrl}?mode=mine` : baseUrl;
        router.push(url);
      }
    }
  };

  if (!isMounted) {
    return null;
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full text-red-500">
        {t("error")}
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      {/* 視圖切換開關 */}
      <MapViewToggle
        showOnlyMine={showOnlyMine}
        onToggle={setShowOnlyMine}
        currentUserEmail={session?.user?.email || undefined}
      />
      
      {/* 載入中狀態 */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
        </div>
      )}

      {/* 地圖容器 */}
      <div className="w-full h-full flex items-center justify-center">
        {isMounted && (
          <svg
            ref={svgRef}
            viewBox="0 0 1000 1400"
            className="w-full h-full max-w-3xl transform scale-125 translate-x-[-10%] translate-y-[-10%]"
            xmlns="http://www.w3.org/2000/svg"
            onMouseMove={handleLocationMouseMove}
          >
            {/* 縣市區域 */}
            {taiwan.locations.map((location) => (
              <path
                key={location.id}
                id={location.id}
                name={location.name}
                d={location.path}
                className={
                  "stroke-[#4a5568] stroke-[1px] transition-all duration-300 ease-in-out cursor-pointer " +
                  (() => {
                    // location.name 已經是英文名稱，直接使用來匹配資料庫中的格式
                    const hasVisits = data?.data?.some(
                      (item) => item.county === location.name
                    );

                    return hasVisits
                      ? "fill-[#aaaaaa] hover:fill-[#555555]"
                      : "fill-[#222222] hover:fill-[#555555]";
                  })()
                }
                onMouseOver={handleLocationMouseOver}
                onMouseOut={handleLocationMouseOut}
                onClick={handleLocationClick}
              />
            ))}

            {/* 添加動畫樣式 */}
            <style jsx global>{`
              @keyframes fadeIn {
                from {
                  opacity: 0;
                  transform: scale(0.8);
                }
                to {
                  opacity: 1;
                  transform: scale(1);
                }
              }
            `}</style>
          </svg>
        )}
      </div>

      {/* 懸停時的照片顯示 - 以滑鼠為中心擴散 */}
      {hoveredLocation && animatedPhotos.length > 0 && (
        <div className="fixed inset-0 pointer-events-none z-40">
          {animatedPhotos.map((photo, index) => {
            const isVisible = visiblePhotos.has(index);

            return (
              <Image
                key={`photo-${index}`}
                src={photo.url}
                alt={t("visit_photo")}
                width={64}
                height={64}
                                        className="absolute object-contain bg-gray-900 rounded-lg border-2 border-white shadow-lg transition-all duration-500 ease-out"
                style={{
                  left: mousePosition.x + photo.x - 32,
                  top: mousePosition.y + photo.y - 32,
                  transform: `scale(${isVisible ? 1 : 0})`,
                  opacity: isVisible ? 1 : 0,
                  transitionDelay: `${photo.delay}ms`,
                }}
              />
            );
          })}
        </div>
      )}

      {/* 懸停提示框 */}
      {hoveredLocation && (
        <div
          className="fixed z-50 p-3 pointer-events-none transform -translate-x-1/2 -translate-y-1/2"
          style={{
            left: tooltipPosition.x,
            top: tooltipPosition.y - 60,
          }}
        >
          <div className="text-white font-medium text-center drop-shadow-lg">
            {t(
              `countiesArray.${COUNTY_NAMES_REVERSE[hoveredLocation]}`,
              COUNTY_NAMES_REVERSE[hoveredLocation] || hoveredLocation
            )}
          </div>
          <div className="text-gray-300 text-sm text-center mt-1 drop-shadow-lg">
            {t("posts_count", { count: hoveredCountyCount })}
          </div>
        </div>
      )}
    </div>
  );
};

export default TaiwanMap;
