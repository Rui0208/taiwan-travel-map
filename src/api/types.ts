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

// 縣市名稱對照表 - 統一簡潔格式
export const COUNTY_NAMES = {
  臺北: "Taipei",
  新北: "New Taipei",
  桃園: "Taoyuan",
  臺中: "Taichung",
  臺南: "Tainan",
  高雄: "Kaohsiung",
  基隆: "Keelung",
  新竹: "Hsinchu",
  嘉義: "Chiayi",
  苗栗: "Miaoli",
  彰化: "Changhua",
  南投: "Nantou",
  雲林: "Yunlin",
  屏東: "Pingtung",
  宜蘭: "Yilan",
  花蓮: "Hualien",
  臺東: "Taitung",
  澎湖: "Penghu",
  金門: "Kinmen",
  連江: "Lienchiang",
} as const;

// 反向對照表（英文到中文）
export const COUNTY_NAMES_REVERSE = Object.entries(COUNTY_NAMES).reduce(
  (acc, [zh, en]) => ({ ...acc, [en]: zh }),
  {} as Record<string, string>
);

export type CountyName = keyof typeof COUNTY_NAMES;
