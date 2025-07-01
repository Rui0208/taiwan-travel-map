"use client";

import { useSession } from "next-auth/react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { useTranslation } from "react-i18next";
import { useState, useEffect, useMemo } from "react";
import useSWR from "swr";
import dynamic from "next/dynamic";

import { endpoints } from "@/api/endpoints";
import { fetcher } from "@/api/fetcher";
import { type VisitedPlace, type ApiResponse } from "@/api/types";
import { slugToCounty } from "@/lib/utils";

// 動態導入大型組件
const SocialCountyView = dynamic(() => import("@/components/SocialCountyView"), {
  ssr: false,
  loading: () => (
    <div className="bg-white rounded-lg shadow-md p-4 animate-pulse">
      <div className="h-32 bg-gray-200 rounded mb-4"></div>
      <div className="h-4 bg-gray-200 rounded mb-2"></div>
      <div className="h-4 bg-gray-200 rounded w-1/2"></div>
    </div>
  ),
});

const EditVisitModal = dynamic(() => import("@/components/EditVisitModal"), {
  ssr: false,
  loading: () => null,
});

const AddVisitModal = dynamic(() => import("@/components/AddVisitModal"), {
  ssr: false,
  loading: () => null,
});

const LoginModal = dynamic(() => import("@/components/LoginModal"), {
  ssr: false,
  loading: () => null,
});

// 資料庫縣市名稱對應表（支援舊格式和新格式）
const DB_COUNTY_MAP: Record<string, string> = {
  // 舊格式
  "Taipei City": "臺北",
  "New Taipei City": "新北",
  "Taoyuan City": "桃園",
  "Taichung City": "臺中",
  "Tainan City": "臺南",
  "Kaohsiung City": "高雄",
  "Keelung City": "基隆",
  "Hsinchu City": "新竹",
  "Chiayi City": "嘉義",
  "Hsinchu County": "新竹",
  "Miaoli County": "苗栗",
  "Changhua County": "彰化",
  "Nantou County": "南投",
  "Yunlin County": "雲林",
  "Chiayi County": "嘉義",
  "Pingtung County": "屏東",
  "Yilan County": "宜蘭",
  "Hualien County": "花蓮",
  "Taitung County": "臺東",
  "Penghu County": "澎湖",
  "Kinmen County": "金門",
  "Lienchiang County": "連江",
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
  // 英文格式（新增地點時使用）
  "Taipei": "臺北",
  "New Taipei": "新北",
  "Taoyuan": "桃園",
  "Taichung": "臺中",
  "Tainan": "臺南",
  "Kaohsiung": "高雄",
  "Keelung": "基隆",
  "Hsinchu": "新竹",
  "Chiayi": "嘉義",
  "Miaoli": "苗栗",
  "Changhua": "彰化",
  "Nantou": "南投",
  "Yunlin": "雲林",
  "Pingtung": "屏東",
  "Yilan": "宜蘭",
  "Hualien": "花蓮",
  "Taitung": "臺東",
  "Penghu": "澎湖",
  "Kinmen": "金門",
  "Lienchiang": "連江",
};

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
        // mine 模式：使用posts API來獲取當前用戶的文章
        return endpoints.posts.byUser(session?.user?.id);
      } else {
        // 所有人模式：使用posts API來獲取所有公開文章
        return endpoints.posts.byCounty(countyName);
      }
    }
    return null; // loading 狀態
  }, [status, countyName, showOnlyMine, session?.user?.id]);

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
      // 現在資料庫使用中文縣市名稱（如：臺北、新北）
      console.log("Filtering counties in mine mode:", {
        countyName,
        totalRecords: visitedData.data.length,
        showOnlyMine,
        viewMode,
        allCounties: visitedData.data.map(item => item.county),
      });

      // 篩選出當前縣市的資料（使用對應表來處理舊格式和新格式）
      const filteredData = visitedData.data.filter((item) => {
        const dbCountyName = DB_COUNTY_MAP[item.county] || item.county;
        const matches = dbCountyName === countyName;
        console.log(`Item ${item.id}: county=${item.county}, mapped=${dbCountyName}, target=${countyName}, matches=${matches}`);
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

  // 處理社交互動的更新（留言、按讚等）
  const handleSocialUpdate = async () => {
    // 重新驗證資料，但不重新載入整個頁面
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
    <main className="min-h-screen bg-black">
      {/* 社交風格縣市詳細資訊 */}
      <SocialCountyView
        countyName={countyName}
        visitedData={countyVisits}
        onClose={handleCloseCard}
        onEdit={handleEdit}
        onAdd={handleAdd}
        onRefresh={handleSocialUpdate}
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
