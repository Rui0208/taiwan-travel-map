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
} from "@/api/types";
import { countyToSlug } from "@/lib/utils";
import MapViewToggle from "./MapViewToggle";

// SVG 地圖英文名稱對應到資料庫中文名稱的對照表
const SVG_TO_DB_COUNTY_MAP: Record<string, string> = {
  "Taipei City": "臺北",
  "Taipei": "臺北",
  "New Taipei City": "新北",
  "New Taipei": "新北",
  "Taoyuan City": "桃園",
  "Taoyuan": "桃園",
  "Taichung City": "臺中",
  "Taichung": "臺中",
  "Tainan City": "臺南",
  "Tainan": "臺南",
  "Kaohsiung City": "高雄",
  "Kaohsiung": "高雄",
  "Keelung City": "基隆",
  "Keelung": "基隆",
  "Hsinchu City": "新竹",
  "Hsinchu County": "新竹",
  "Hsinchu": "新竹",
  "Chiayi City": "嘉義",
  "Chiayi County": "嘉義",
  "Chiayi": "嘉義",
  "Miaoli County": "苗栗",
  "Miaoli": "苗栗",
  "Changhua County": "彰化",
  "Changhua": "彰化",
  "Nantou County": "南投",
  "Nantou": "南投",
  "Yunlin County": "雲林",
  "Yunlin": "雲林",
  "Pingtung County": "屏東",
  "Pingtung": "屏東",
  "Yilan County": "宜蘭",
  "Yilan": "宜蘭",
  "Hualien County": "花蓮",
  "Hualien": "花蓮",
  "Taitung County": "臺東",
  "Taitung": "臺東",
  "Penghu County": "澎湖",
  "Penghu": "澎湖",
  "Kinmen County": "金門",
  "Kinmen": "金門",
  "Lienchiang County": "連江",
  "Lienchiang": "連江",
};

// 資料庫縣市名稱對應表（支援舊格式和新格式）
const DB_COUNTY_MAP: Record<string, string> = {
  // 舊格式
  "Taipei City": "臺北",
  "Taipei": "臺北",
  "New Taipei City": "新北",
  "New Taipei": "新北",
  "Taoyuan City": "桃園",
  "Taoyuan": "桃園",
  "Taichung City": "臺中",
  "Taichung": "臺中",
  "Tainan City": "臺南",
  "Tainan": "臺南",
  "Kaohsiung City": "高雄",
  "Kaohsiung": "高雄",
  "Keelung City": "基隆",
  "Keelung": "基隆",
  "Hsinchu City": "新竹",
  "Hsinchu County": "新竹",
  "Hsinchu": "新竹",
  "Chiayi City": "嘉義",
  "Chiayi County": "嘉義",
  "Chiayi": "嘉義",
  "Miaoli County": "苗栗",
  "Miaoli": "苗栗",
  "Changhua County": "彰化",
  "Changhua": "彰化",
  "Nantou County": "南投",
  "Nantou": "南投",
  "Yunlin County": "雲林",
  "Yunlin": "雲林",
  "Pingtung County": "屏東",
  "Pingtung": "屏東",
  "Yilan County": "宜蘭",
  "Yilan": "宜蘭",
  "Hualien County": "花蓮",
  "Hualien": "花蓮",
  "Taitung County": "臺東",
  "Taitung": "臺東",
  "Penghu County": "澎湖",
  "Penghu": "澎湖",
  "Kinmen County": "金門",
  "Kinmen": "金門",
  "Lienchiang County": "連江",
  "Lienchiang": "連江",
  // 新格式（已經是中文）
  "臺北": "臺北",
  "新北": "新北",
  "桃園": "桃園",
  "臺中": "臺中",
  "臺南": "臺南",
  "高雄": "高雄",
  "基隆": "基隆",
  "新竹": "新竹",
  "嘉義": "嘉義",
  "苗栗": "苗栗",
  "彰化": "彰化",
  "南投": "南投",
  "雲林": "雲林",
  "屏東": "屏東",
  "宜蘭": "宜蘭",
  "花蓮": "花蓮",
  "臺東": "臺東",
  "澎湖": "澎湖",
  "金門": "金門",
  "連江": "連江",
};

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
  
  // 縮放相關狀態
  const [scale, setScale] = useState(1.25);  // 初始縮放比例
  const [translateX, setTranslateX] = useState(-100); // 初始水平位置
  const [translateY, setTranslateY] = useState(-50);  // 初始垂直位置
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  
  const svgRef = useRef<SVGSVGElement>(null);
  const { data: session, status } = useSession();

  // 縮放限制
  const MIN_SCALE = 0.5;
  const MAX_SCALE = 3;

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
        // mine 模式：使用 posts API 的 byUser 端點，與縣市詳情頁面一致
        return endpoints.posts.byUser(session?.user?.id);
      } else {
        return endpoints.posts.list; // 獲取所有人的
      }
    }
    return null; // loading 狀態
  }, [status, showOnlyMine, session?.user?.id]);

  const { data, error, isLoading } = useSWR<ApiResponse<VisitedPlace[]>>(
    apiEndpoint,
    fetcher
  );

  // 調試資料載入問題
  useEffect(() => {
    console.log("TaiwanMap debug:", {
      apiEndpoint,
      status,
      sessionUser: session?.user,
      dataCount: data?.data?.length || 0,
      data: data?.data?.slice(0, 3), // 只顯示前3筆資料
      error,
      isLoading,
      showOnlyMine,
    });
  }, [apiEndpoint, status, session, data, error, isLoading, showOnlyMine]);

  // 計算當前懸停縣市的遊記數量 - SVG 地圖返回的是英文名稱，需要轉換為中文
  const hoveredCountyCount = useMemo(() => {
    if (!data?.data || !hoveredLocation) return 0;

    // hoveredLocation 是英文名稱，需要轉換為中文來匹配資料庫
    const chineseCountyName = SVG_TO_DB_COUNTY_MAP[hoveredLocation];
    if (!chineseCountyName) return 0;

    // 使用新的對應表來匹配資料庫中的縣市名稱（支援舊格式和新格式）
    return data.data.filter((item) => {
      const dbCountyName = DB_COUNTY_MAP[item.county] || item.county;
      return dbCountyName === chineseCountyName;
    }).length;
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
          // location 是英文名稱，需要轉換為中文來匹配資料庫
          const chineseCountyName = SVG_TO_DB_COUNTY_MAP[location];
          const photosWithImages = data.data
            .filter((item) => {
              if (!chineseCountyName || !item.image_url) return false;
              const dbCountyName = DB_COUNTY_MAP[item.county] || item.county;
              return dbCountyName === chineseCountyName;
            })
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
            delay: index * 100,
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

  // 拖拽開始
  const handleMouseDown = (event: React.MouseEvent) => {
    if (event.button === 0) { // 左鍵
      setIsDragging(true);
      setDragStart({ x: event.clientX - translateX, y: event.clientY - translateY });
    }
  };

  // 拖拽中
  const handleMouseMove = (event: React.MouseEvent) => {
    if (isDragging) {
      setTranslateX(event.clientX - dragStart.x);
      setTranslateY(event.clientY - dragStart.y);
    }
  };

  // 拖拽結束
  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // 縣市點擊處理（避免拖拽時觸發）
  const handleLocationClick = (event: React.MouseEvent<SVGElement> | React.TouchEvent<SVGElement>) => {
    if (isDragging) return; // 如果正在拖拽，不觸發點擊
    
    const location = event.currentTarget.getAttribute("name");
    if (location) {
      // location 是英文名稱，需要轉換為中文再轉換為 slug
      const chineseCountyName = SVG_TO_DB_COUNTY_MAP[location];
      if (chineseCountyName) {
        const slug = countyToSlug(chineseCountyName);
        // 根據當前模式決定要導向的 URL
        const baseUrl = `/pages/${slug}`;
        const url = showOnlyMine ? `${baseUrl}?mode=mine` : baseUrl;
        router.push(url);
      }
    }
  };

  // 觸控點擊處理
  const handleLocationTouchEnd = (event: React.TouchEvent<SVGElement>) => {
    // 檢查是否為點擊（沒有拖移）
    if (touchStart && touchStart.isDragging) {
      const touch = event.changedTouches[0];
      const startTouch = touchStart;
      const moveDistance = Math.sqrt(
        Math.pow(touch.clientX - (startTouch.x + translateX), 2) +
        Math.pow(touch.clientY - (startTouch.y + translateY), 2)
      );
      
      // 如果移動距離小於閾值，視為點擊
      if (moveDistance < 10) {
        const location = event.currentTarget.getAttribute("name");
        if (location) {
          const chineseCountyName = SVG_TO_DB_COUNTY_MAP[location];
          if (chineseCountyName) {
            const slug = countyToSlug(chineseCountyName);
            const baseUrl = `/pages/${slug}`;
            const url = showOnlyMine ? `${baseUrl}?mode=mine` : baseUrl;
            router.push(url);
          }
        }
      }
    }
  };

  // 縮放功能 - 以地圖中心為縮放點
  const handleZoom = (delta: number) => {
    const newScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, scale + delta));
    
    const rect = svgRef.current?.getBoundingClientRect();
    if (rect) {
      // 以容器中心為縮放點
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      
      // 計算縮放比例變化
      const scaleRatio = newScale / scale;
      
      // 計算新的位移，保持中心點不變
      const newTranslateX = centerX - (centerX - translateX) * scaleRatio;
      const newTranslateY = centerY - (centerY - translateY) * scaleRatio;
      
      setScale(newScale);
      setTranslateX(newTranslateX);
      setTranslateY(newTranslateY);
    }
  };

  // 觸控支援 - 拖移和縮放
  const [touchStart, setTouchStart] = useState<{ x: number; y: number; distance: number; isDragging: boolean } | null>(null);
  const [lastTouchDistance, setLastTouchDistance] = useState<number>(0);

  // 計算兩點之間的距離
  const getTouchDistance = (touches: React.TouchList) => {
    if (touches.length < 2) return 0;
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  // 計算兩點的中心位置
  const getTouchCenter = (touches: React.TouchList) => {
    if (touches.length < 2) return { x: touches[0].clientX, y: touches[0].clientY };
    const x = (touches[0].clientX + touches[1].clientX) / 2;
    const y = (touches[0].clientY + touches[1].clientY) / 2;
    return { x, y };
  };

  // 觸控開始
  const handleTouchStart = (event: React.TouchEvent) => {
    if (event.touches.length === 2) {
      // 雙指觸控 - 準備縮放
      event.preventDefault();
      const distance = getTouchDistance(event.touches);
      const center = getTouchCenter(event.touches);
      setTouchStart({ x: center.x, y: center.y, distance, isDragging: false });
      setLastTouchDistance(distance);
    } else if (event.touches.length === 1) {
      // 單指觸控 - 準備拖移
      const touch = event.touches[0];
      setTouchStart({ x: touch.clientX - translateX, y: touch.clientY - translateY, distance: 0, isDragging: true });
      setIsDragging(true);
    }
  };

  // 觸控移動
  const handleTouchMove = (event: React.TouchEvent) => {
    if (event.touches.length === 2 && touchStart && !touchStart.isDragging) {
      // 雙指觸控 - 縮放
      event.preventDefault();
      const distance = getTouchDistance(event.touches);
      
      if (lastTouchDistance > 0) {
        const scaleDelta = (distance - lastTouchDistance) / 100;
        handleZoom(scaleDelta);
      }
      
      setLastTouchDistance(distance);
    } else if (event.touches.length === 1 && touchStart && touchStart.isDragging) {
      // 單指觸控 - 拖移
      event.preventDefault();
      const touch = event.touches[0];
      setTranslateX(touch.clientX - touchStart.x);
      setTranslateY(touch.clientY - touchStart.y);
    }
  };

  // 觸控結束
  const handleTouchEnd = (event: React.TouchEvent) => {
    if (event.touches.length === 0) {
      // 所有手指都離開，重置狀態
      setTouchStart(null);
      setLastTouchDistance(0);
      setIsDragging(false);
    }
  };

  // 重置縮放
  const resetZoom = () => {
    setScale(1.25);  // 原本的 scale-125
    setTranslateX(-100); // 原本的 translate-x-[-20%] 約等於 -200px
    setTranslateY(-50);  // 原本的 translate-y-[-5%] 約等於 -50px
  };

  // 縮放按鈕
  const zoomIn = () => {
    handleZoom(0.2);
  };

  const zoomOut = () => {
    handleZoom(-0.2);
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
      <div className="w-full h-full flex items-center justify-center relative touch-none">
        {isMounted && (
          <svg
            ref={svgRef}
            viewBox="0 0 1000 1400"
            className="w-full h-full max-w-3xl cursor-grab active:cursor-grabbing touch-none"
            xmlns="http://www.w3.org/2000/svg"
            onMouseMove={(event) => {
              handleMouseMove(event);
              handleLocationMouseMove(event);
            }}
            onMouseDown={handleMouseDown}
            onMouseUp={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            style={{
              transform: `translate(${translateX}px, ${translateY}px) scale(${scale})`,
              touchAction: 'none', // 防止瀏覽器預設的觸控行為
            }}
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
                    // location.name 是英文名稱，需要轉換為中文來匹配資料庫
                    const chineseCountyName = SVG_TO_DB_COUNTY_MAP[location.name];
                    const hasVisits = chineseCountyName && data?.data?.some((item) => {
                      const dbCountyName = DB_COUNTY_MAP[item.county] || item.county;
                      return dbCountyName === chineseCountyName;
                    });

                    return hasVisits
                      ? "fill-[#aaaaaa] hover:fill-[#555555]"
                      : "fill-[#222222] hover:fill-[#555555]";
                  })()
                }
                onMouseOver={handleLocationMouseOver}
                onMouseOut={handleLocationMouseOut}
                onClick={handleLocationClick}
                onTouchEnd={handleLocationTouchEnd}
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

        {/* 縮放控制按鈕 */}
        <div className="absolute top-4 right-4 flex flex-col space-y-2">
          <button
            onClick={zoomIn}
            className="w-10 h-10 bg-gray-800 hover:bg-gray-700 text-white rounded-lg flex items-center justify-center transition-colors"
            title="放大"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </button>
          <button
            onClick={zoomOut}
            className="w-10 h-10 bg-gray-800 hover:bg-gray-700 text-white rounded-lg flex items-center justify-center transition-colors"
            title="縮小"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
            </svg>
          </button>
          <button
            onClick={resetZoom}
            className="w-10 h-10 bg-gray-800 hover:bg-gray-700 text-white rounded-lg flex items-center justify-center transition-colors"
            title="重置"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
            </svg>
          </button>
        </div>
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
            {(() => {
              const chineseCountyName = SVG_TO_DB_COUNTY_MAP[hoveredLocation];
              return chineseCountyName 
                ? t(`countiesArray.${chineseCountyName}`, chineseCountyName)
                : hoveredLocation;
            })()}
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
