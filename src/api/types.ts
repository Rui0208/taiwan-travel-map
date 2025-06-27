export interface VisitedPlace {
  id: string;
  user_id: string;
  county: string;
  location?: {
    x: number;
    y: number;
  };
  title: string;
  image_url: string | null;
  image_urls: string[];
  ig_url: string | null;
  instagram_url?: string;
  created_at: string;
  updated_at: string;
  visited_at?: string;
  note: string | null;
  is_public?: boolean;
  likes_count?: number;
  comments_count?: number;
  is_liked?: boolean;
  user?: {
    id: string;
    name: string;
    email: string;
    image?: string;
  };
}

export interface Like {
  id: string;
  user_id: string;
  post_id?: string;
  comment_id?: string;
  created_at: string;
}

export interface Comment {
  id: string;
  user_id: string;
  post_id: string;
  content: string;
  created_at: string;
  updated_at: string;
  likes_count?: number;
  is_liked?: boolean;
  user?: {
    id: string;
    name: string;
    image?: string;
  };
}

export interface Notification {
  id: string;
  user_id: string;
  actor_id: string;
  type: 'like_post' | 'like_comment' | 'comment_post';
  post_id?: string;
  comment_id?: string;
  content: string;
  is_read: boolean;
  created_at: string;
  post?: {
    id: string;
    county: string;
    note: string;
    image_url: string;
    image_urls: string[];
  };
  comment?: {
    id: string;
    content: string;
  };
  actor?: {
    id: string;
    name: string;
    image?: string;
  };
}

export interface PostWithDetails extends VisitedPlace {
  comments: Comment[];
  recent_likes: Like[];
}

export interface ApiResponse<T> {
  data: T;
  error: string | null;
}

// 縣市名稱對照表
export const COUNTY_NAMES = {
  臺北市: "Taipei City",
  新北市: "New Taipei City",
  桃園市: "Taoyuan City",
  臺中市: "Taichung City",
  臺南市: "Tainan City",
  高雄市: "Kaohsiung City",
  基隆市: "Keelung City",
  新竹市: "Hsinchu City",
  嘉義市: "Chiayi City",
  新竹縣: "Hsinchu County",
  苗栗縣: "Miaoli County",
  彰化縣: "Changhua County",
  南投縣: "Nantou County",
  雲林縣: "Yunlin County",
  嘉義縣: "Chiayi County",
  屏東縣: "Pingtung County",
  宜蘭縣: "Yilan County",
  花蓮縣: "Hualien County",
  臺東縣: "Taitung County",
  澎湖縣: "Penghu County",
  金門縣: "Kinmen County",
  連江縣: "Lienchiang County",
} as const;

// 反向對照表（英文到中文）
export const COUNTY_NAMES_REVERSE = Object.entries(COUNTY_NAMES).reduce(
  (acc, [zh, en]) => ({ ...acc, [en]: zh }),
  {} as Record<string, string>
);

export type CountyName = keyof typeof COUNTY_NAMES;
