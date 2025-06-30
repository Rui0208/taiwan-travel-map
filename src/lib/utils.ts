import { COUNTY_NAMES } from "@/api/types";

// 將中文縣市名轉換為 URL 友善的格式
export function countyToSlug(countyName: string): string {
  const slugMap: Record<string, string> = {
    臺北: "taipei",
    新北: "new-taipei",
    桃園: "taoyuan",
    臺中: "taichung",
    臺南: "tainan",
    高雄: "kaohsiung",
    基隆: "keelung",
    新竹: "hsinchu",
    嘉義: "chiayi",
    苗栗: "miaoli",
    彰化: "changhua",
    南投: "nantou",
    雲林: "yunlin",
    屏東: "pingtung",
    宜蘭: "yilan",
    花蓮: "hualien",
    臺東: "taitung",
    澎湖: "penghu",
    金門: "kinmen",
    連江: "lienchiang",
  };

  return slugMap[countyName] || countyName.toLowerCase();
}

// 將 URL slug 轉換回中文縣市名
export function slugToCounty(slug: string): string {
  // 先解碼 URL 參數，以防有編碼問題
  const decodedSlug = decodeURIComponent(slug).toLowerCase();

  const reverseMap: Record<string, string> = {
    taipei: "臺北",
    "new-taipei": "新北",
    taoyuan: "桃園",
    taichung: "臺中",
    tainan: "臺南",
    kaohsiung: "高雄",
    keelung: "基隆",
    hsinchu: "新竹",
    chiayi: "嘉義",
    miaoli: "苗栗",
    changhua: "彰化",
    nantou: "南投",
    yunlin: "雲林",
    pingtung: "屏東",
    yilan: "宜蘭",
    hualien: "花蓮",
    taitung: "臺東",
    penghu: "澎湖",
    kinmen: "金門",
    lienchiang: "連江",
  };

  // 如果找到對應的縣市名，返回中文名稱
  if (reverseMap[decodedSlug]) {
    return reverseMap[decodedSlug];
  }

  // 嘗試去除空格和特殊字符後再次匹配
  const cleanSlug = decodedSlug.replace(/[\s%20]+/g, "-").toLowerCase();
  if (reverseMap[cleanSlug]) {
    return reverseMap[cleanSlug];
  }

  // 如果都找不到，返回第一個縣市作為預設值（避免錯誤）
  console.warn(`Unknown county slug: ${slug}, using default: 臺北`);
  return "臺北";
}

// 獲取所有縣市的 slug 列表（用於 generateStaticParams）
export function getAllCountySlugs(): string[] {
  return Object.keys(COUNTY_NAMES).map(countyToSlug);
}
