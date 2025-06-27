import { COUNTY_NAMES } from "@/api/types";

// 將中文縣市名轉換為 URL 友善的格式
export function countyToSlug(countyName: string): string {
  const slugMap: Record<string, string> = {
    臺北市: "taipei",
    新北市: "new-taipei",
    桃園市: "taoyuan",
    臺中市: "taichung",
    臺南市: "tainan",
    高雄市: "kaohsiung",
    基隆市: "keelung",
    新竹市: "hsinchu-city",
    嘉義市: "chiayi-city",
    新竹縣: "hsinchu-county",
    苗栗縣: "miaoli",
    彰化縣: "changhua",
    南投縣: "nantou",
    雲林縣: "yunlin",
    嘉義縣: "chiayi-county",
    屏東縣: "pingtung",
    宜蘭縣: "yilan",
    花蓮縣: "hualien",
    臺東縣: "taitung",
    澎湖縣: "penghu",
    金門縣: "kinmen",
    連江縣: "lienchiang",
  };

  return slugMap[countyName] || countyName.toLowerCase();
}

// 將 URL slug 轉換回中文縣市名
export function slugToCounty(slug: string): string {
  // 先解碼 URL 參數，以防有編碼問題
  const decodedSlug = decodeURIComponent(slug).toLowerCase();

  const reverseMap: Record<string, string> = {
    taipei: "臺北市",
    "new-taipei": "新北市",
    taoyuan: "桃園市",
    taichung: "臺中市",
    tainan: "臺南市",
    kaohsiung: "高雄市",
    keelung: "基隆市",
    "hsinchu-city": "新竹市",
    "chiayi-city": "嘉義市",
    "hsinchu-county": "新竹縣",
    miaoli: "苗栗縣",
    changhua: "彰化縣",
    nantou: "南投縣",
    yunlin: "雲林縣",
    "chiayi-county": "嘉義縣",
    pingtung: "屏東縣",
    yilan: "宜蘭縣",
    hualien: "花蓮縣",
    taitung: "臺東縣",
    penghu: "澎湖縣",
    kinmen: "金門縣",
    lienchiang: "連江縣",
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
  console.warn(`Unknown county slug: ${slug}, using default: 臺北市`);
  return "臺北市";
}

// 獲取所有縣市的 slug 列表（用於 generateStaticParams）
export function getAllCountySlugs(): string[] {
  return Object.keys(COUNTY_NAMES).map(countyToSlug);
}
