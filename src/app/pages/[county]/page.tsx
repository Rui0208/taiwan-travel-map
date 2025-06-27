"use client";

import { useSession } from "next-auth/react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { useTranslation } from "react-i18next";
import { useState, useEffect, useMemo } from "react";
import useSWR from "swr";

import { endpoints } from "@/api/endpoints";
import { fetcher } from "@/api/fetcher";
import { type VisitedPlace, type ApiResponse, COUNTY_NAMES } from "@/api/types";
import { slugToCounty } from "@/lib/utils";
import SocialCountyView from "@/components/SocialCountyView";
import EditVisitModal from "@/components/EditVisitModal";
import AddVisitModal from "@/components/AddVisitModal";
import LoginModal from "@/components/LoginModal";

export default function CountyPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const { t } = useTranslation();
  const [mounted, setMounted] = useState(false);
  const [selectedVisit, setSelectedVisit] = useState<VisitedPlace | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  const countySlug = decodeURIComponent(params.county as string);
  const countyName = slugToCounty(countySlug);
  
  // 讀取 URL 參數中的模式
  const viewMode = searchParams.get('mode'); // 'mine' 或 null
  const showOnlyMine = viewMode === 'mine';

  useEffect(() => {
    setMounted(true);
  }, []);

  // 根據認證狀態和視圖模式決定使用的API端點
  const apiEndpoint = useMemo(() => {
    if (status === "unauthenticated") {
      // 訪客模式：使用posts API來獲取公開文章
      return endpoints.posts.byCounty(countyName);
    } else if (status === "authenticated") {
      if (showOnlyMine) {
        // mine 模式：使用visited API來獲取自己的資料
        return endpoints.visited.list;
      } else {
        // 所有人模式：使用posts API來獲取所有公開文章
        return endpoints.posts.byCounty(countyName);
      }
    }
    return null; // loading 狀態
  }, [status, countyName, showOnlyMine]);

  // 使用 SWR 獲取造訪資料
  const { data: visitedData, mutate } = useSWR<ApiResponse<VisitedPlace[]>>(
    apiEndpoint,
    fetcher
  );

  // 篩選當前縣市的資料
  const countyVisits = useMemo(() => {
    if (!visitedData?.data) return [];

    if (status === "unauthenticated" || !showOnlyMine) {
      // 訪客模式或所有人模式：posts API已經按縣市篩選，直接返回
      return visitedData.data;
    } else {
      // mine 模式：需要篩選當前縣市的資料
      const englishCountyName = COUNTY_NAMES[countyName as keyof typeof COUNTY_NAMES];

      console.log("Filtering counties in mine mode:", {
        countyName,
        englishCountyName,
        totalRecords: visitedData.data.length,
        showOnlyMine,
        viewMode,
        allCounties: visitedData.data.map(item => item.county),
      });

      // 篩選出當前縣市的資料
      const filteredData = visitedData.data.filter((item) => {
        const matches = item.county === englishCountyName;
        console.log(`Item ${item.id}: county=${item.county}, matches=${matches}`);
        return matches;
      });

      console.log("Filtered data count:", filteredData.length);
      return filteredData;
    }
  }, [visitedData?.data, countyName, status, showOnlyMine, viewMode]);

  const handleCloseCard = () => {
    // 保留當前模式回到首頁
    const homeUrl = showOnlyMine ? "/pages/home?mode=mine" : "/pages/home";
    router.push(homeUrl);
  };

  // 處理訪客互動
  const handleGuestInteraction = () => {
    setIsLoginModalOpen(true);
  };

  const handleEdit = (id: string) => {
    if (status === "unauthenticated") {
      handleGuestInteraction();
      return;
    }

    if (id === "new") {
      setIsAddModalOpen(true);
    } else {
      const visit = visitedData?.data?.find((item) => item.id === id);
      if (visit) {
        setSelectedVisit(visit);
        setIsEditModalOpen(true);
      }
    }
  };

  const handleAdd = () => {
    if (status === "unauthenticated") {
      handleGuestInteraction();
      return;
    }
    setIsAddModalOpen(true);
  };

  const handleEditSuccess = async () => {
    setIsEditModalOpen(false);
    setSelectedVisit(null);
    await mutate();
  };

  const handleAddSuccess = async () => {
    setIsAddModalOpen(false);
    await mutate();
  };

  if (status === "loading" || !mounted) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-black p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mx-auto"></div>
          <p className="mt-4 text-gray-400 font-medium">{t("loading")}</p>
        </div>
      </main>
    );
  }



  return (
    <main className="h-full bg-black overflow-hidden">
      {/* 社交風格縣市詳細資訊 */}
      <SocialCountyView
        countyName={countyName}
        visitedData={countyVisits}
        onClose={handleCloseCard}
        onEdit={handleEdit}
        onAdd={handleAdd}
        onRefresh={mutate}
        currentUserId={session?.user?.id}
        isGuest={status === "unauthenticated"}
        onGuestInteraction={handleGuestInteraction}
        showOnlyMine={showOnlyMine} // 傳遞視圖模式給子組件
      />

      {/* 編輯 Modal */}
      {selectedVisit && (
        <EditVisitModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setSelectedVisit(null);
          }}
          onSuccess={handleEditSuccess}
          visitData={selectedVisit}
        />
      )}

      {/* 新增 Modal */}
      <AddVisitModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={handleAddSuccess}
        selectedCounty={countyName}
      />

      {/* 登入 Modal */}
      {isLoginModalOpen && (
        <LoginModal
          isOpen={true}
          onClose={() => setIsLoginModalOpen(false)}
        />
      )}
    </main>
  );
}
