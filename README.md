# 台灣旅遊地圖 (Taiwan Travel Map) v0.3.8

一個互動式台灣旅遊地圖應用程式，具備完整社交功能，讓使用者記錄、分享和互動他們在台灣各縣市的旅遊體驗。

## 🌟 專案特色

- **互動式地圖介面**：使用 SVG 地圖展示台灣 22 個縣市
- **社交互動功能**：按讚、留言、社交視圖等完整社交體驗
- **個人化旅遊記錄**：記錄每個縣市的造訪體驗
- **照片分享功能**：支援多圖片上傳並與 Instagram 連結
- **雙視圖模式**：網格視圖與社交視圖自由切換
- **多語言支援**：繁體中文和英文雙語介面
- **響應式設計**：適配各種裝置螢幕尺寸

## 🚀 主要功能

### 🗺️ 互動式地圖

- 台灣 22 縣市的 SVG 向量地圖
- 滑鼠懸停顯示縣市資訊和造訪次數
- 點擊縣市導航到專屬頁面 (`/pages/taipei`, `/pages/kaohsiung` 等)
- 動態展示該縣市的旅遊照片
- 專屬的縣市詳細頁面，包含側邊欄展示和地圖背景

### 📝 旅遊記錄管理

- **新增記錄**：選擇縣市、撰寫遊記、多圖片上傳
- **編輯記錄**：完整編輯功能，支援多圖片管理
  - 新增圖片：選擇並即時預覽新圖片
  - 管理現有圖片：移除或恢復現有圖片
  - 圖片數量顯示：即時顯示剩餘可上傳數量
- **刪除記錄**：安全的刪除確認流程
- **Instagram 連結**：可關聯 Instagram 貼文
- **社交互動**：對文章和留言進行按讚、留言等社交操作

### 💬 社交功能

- **文章按讚系統**：對旅遊記錄進行按讚/取消按讚
- **留言系統**：在旅遊記錄下方留言互動
- **留言管理功能**：
  - **留言編輯**：留言者可以編輯自己的留言
  - **留言刪除**：留言者可以刪除自己的留言
  - **發文者權限**：發文者可以刪除任何人在自己文章下的留言
  - **即時編輯**：在線編輯留言內容並即時保存
- **留言按讚**：對留言進行按讚/取消按讚
- **社交視圖**：類似小紅書的直式單欄社交瀏覽模式
- **雙視圖切換**：網格視圖與社交視圖間自由切換
- **即時更新**：所有社交操作即時同步顯示

### 🖼️ 照片功能

- **多圖片上傳**：支援一次上傳最多 10 張照片
- **圖片輪播**：在社交視圖中以輪播方式展示多張照片
- **完整圖片顯示**：使用 `object-contain` 確保圖片完整顯示，不被裁切
- **智慧適應**：自動適應橫向和直向圖片的最佳顯示方式
- **圖片預覽**：上傳前即時預覽功能
- **儲存至 Supabase**：安全的雲端圖片儲存
- **動態展示**：在地圖上動態展示縣市照片
- **自動最佳化**：照片壓縮和格式最佳化

### 👤 使用者系統

- **Google OAuth 登入驗證**：安全的第三方登入
- **個人資料管理**：顯示名稱、頭像、個人簡介編輯
- **頭像編輯器**：圓形頭像裁切，支援拖拽調整位置和縮放
- **個人化資料儲存**：所有個人設定雲端同步
- **使用者專屬的旅遊記錄**：完全個人化的旅遊體驗

### 🔐 雙重認證系統

- **Google OAuth**：一鍵使用 Google 帳號登入
- **帳號密碼登入**：支援傳統的電子郵件和密碼註冊/登入
- **統一用戶管理**：兩種登入方式的用戶資料完美串接
- **安全保護**：密碼加密儲存，支援密碼重設
- **用戶檔案同步**：自動建立和同步用戶檔案資訊
- **權限管理**：統一的權限控制系統
- **會話管理**：安全的會話管理和自動登出

### 🔔 通知系統

- **即時通知**：文章被按讚、留言時即時通知
- **通知分類**：按讚文章、按讚留言、留言文章三種通知類型
- **未讀標記**：未讀通知高亮顯示，已讀通知正常顯示
- **批量操作**：支援「全部標為已讀」功能
- **通知計數**：Sidebar 顯示未讀通知數量徽章
- **分頁載入**：支援分頁載入更多通知
- **點擊跳轉**：點擊通知跳轉到單篇文章詳情頁面

### 📱 個人檔案

- **個人資訊展示**：頭像、姓名、email 顯示
- **統計數據**：貼文數、造訪縣市數、獲得讚數、留言數統計
- **貼文網格**：Instagram 風格的 3x3 網格展示個人貼文
- **數據格式化**：大數字自動格式化（1K、1M 等）
- **點擊跳轉**：點擊貼文跳轉到對應縣市頁面
- **懸停效果**：網格貼文懸停顯示縣市名稱和內容預覽

### 🔍 搜尋功能

- **即時搜尋**：500ms 防抖的即時搜尋體驗
- **多語言搜尋**：支援中英文縣市名稱搜尋
- **內容搜尋**：搜尋貼文內容和縣市名稱
- **搜尋結果展示**：與社交視圖一致的搜尋結果顯示
- **互動功能**：搜尋結果支援按讚、留言、編輯等完整功能
- **空狀態處理**：初始狀態、載入狀態、無結果狀態的優雅處理
- **統一使用者資訊顯示**：修復搜尋和文章中的使用者名稱顯示不一致問題

### 📄 單篇文章詳情

- **獨立文章頁面**：每篇文章都有專屬的詳情頁面 (`/pages/post/[id]`)
- **完整社交功能**：支援按讚、留言、留言按讚等所有社交互動
- **通知直接跳轉**：點擊通知直接跳轉到相關文章詳情頁
- **編輯功能**：文章作者可直接在詳情頁編輯文章
- **返回導航**：優雅的返回上一頁功能
- **權限控制**：私人文章僅作者可見，公開文章所有人可見
- **錯誤處理**：文章不存在或無權限時的友善錯誤頁面

### 🌐 國際化

- 繁體中文（預設）
- 英文介面
- 動態語言切換
- 縣市名稱根據當前語言顯示（中文/英文）

### 📊 統計資訊

- 已造訪縣市數量
- 總遊記篇數
- 個人旅遊統計

## 🛠️ 技術架構

### 前端框架

- **Next.js 15** - React 全端框架
- **React 19** - 使用者介面函式庫
- **TypeScript** - 類型安全的 JavaScript

### 樣式設計

- **Tailwind CSS** - 實用程式優先的 CSS 框架
- **響應式設計** - 支援各種螢幕尺寸
- **深色主題** - 現代化的深色介面

### 地圖系統

- **@svg-maps/taiwan** - 台灣 SVG 地圖資料
- **react-svg-map** - SVG 地圖互動組件
- 自定義地圖互動邏輯

### 後端服務

- **NextAuth.js** - 身份驗證解決方案
- **Supabase** - 後端即服務 (BaaS)
  - PostgreSQL 資料庫
  - 檔案儲存
  - 即時訂閱

### 狀態管理

- **SWR** - 資料獲取和快取
- React Hooks - 本地狀態管理

### 國際化

- **react-i18next** - 國際化框架
- **i18next** - 國際化核心函式庫

## 📁 專案結構

```
taiwan-travel-map/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/               # API 路由
│   │   │   ├── auth/         # 身份驗證 API
│   │   │   ├── visited/      # 造訪記錄 API
│   │   │   ├── posts/        # 社交功能 API
│   │   │   │   └── [id]/     # 單篇文章 API
│   │   │   ├── likes/        # 按讚功能 API
│   │   │   ├── comments/     # 留言功能 API
│   │   │   ├── notifications/ # 通知功能 API
│   │   │   ├── search/       # 搜尋功能 API
│   │   │   ├── profile/      # 個人資料 API
│   │   │   └── storage/      # 檔案上傳 API
│   │   ├── pages/            # 應用頁面（重新組織後）
│   │   │   ├── home/         # 首頁
│   │   │   ├── dashboard/    # 地圖和縣市頁面
│   │   │   │   └── [county]/ # 動態縣市路由 (/pages/dashboard/taipei)
│   │   │   ├── post/         # 單篇文章頁面
│   │   │   │   └── [id]/     # 動態文章路由 (/pages/post/[id])
│   │   │   ├── profile/      # 個人檔案頁面
│   │   │   │   └── posts/    # 個人貼文頁面
│   │   │   ├── notifications/ # 通知頁面
│   │   │   └── search/       # 搜尋頁面
│   │   └── globals.css       # 全局樣式
│   ├── components/           # React 組件
│   │   ├── TaiwanMap.tsx    # 主要地圖組件
│   │   ├── AddVisitModal.tsx # 新增記錄模態框
│   │   ├── EditVisitModal.tsx # 編輯記錄模態框
│   │   ├── CountyDetailCard.tsx # 縣市詳情卡片
│   │   └── LanguageSwitcher.tsx # 語言切換器
│   ├── api/                  # API 工具
│   │   ├── endpoints.ts      # API 端點定義
│   │   ├── fetcher.ts        # 資料獲取工具
│   │   └── types.ts          # 類型定義
│   ├── i18n/                 # 國際化設定
│   ├── lib/                  # 工具函式庫
│   │   ├── supabase.ts       # Supabase 客戶端
│   │   └── utils.ts          # 工具函數（縣市名稱轉換等）
│   └── types/                # TypeScript 類型定義
├── public/
│   └── locales/              # 國際化資源檔
│       └── common/
│           ├── zh-Hant.json  # 繁體中文
│           └── en.json       # 英文
└── scripts/                  # 部署腳本
```

## 🔧 環境設定

### 必要環境變數

創建 `.env.local` 檔案並設定以下變數：

```env
# NextAuth.js
NEXTAUTH_SECRET=your-nextauth-secret
NEXTAUTH_URL=http://localhost:3000

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Supabase
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### Supabase 資料庫設定

需要在 Supabase 中創建以下資料表：

```sql
-- 造訪地點表
CREATE TABLE visited_places (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  county TEXT NOT NULL,
  note TEXT,
  ig_url TEXT,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 建立 RLS 政策
ALTER TABLE visited_places ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own visited places" ON visited_places
  FOR ALL USING (auth.uid()::text = user_id);
```

## 🚀 開發環境設定

### 安裝依賴

```bash
# 使用 Yarn（推薦）
yarn install

# 或使用 npm
npm install
```

### ⚠️ 解決認證問題

如果遇到 "Email not confirmed" 錯誤，請參考 [認證設置指南](docs/auth-setup-guide.md)。

**快速解決方案**（開發環境）：
1. 前往 Supabase Dashboard > Authentication > Settings
2. 將 "Confirm Email" 設為 **DISABLED**
3. 重新測試登入功能

### 啟動開發伺服器

```bash
yarn dev
```

開啟瀏覽器前往 [http://localhost:3000](http://localhost:3000)

### 建置專案

```bash
yarn build
```

### 啟動正式環境

```bash
yarn start
```

## 📋 功能詳細說明

### 地圖互動

1. **縣市懸停**：滑鼠懸停顯示縣市名稱和造訪次數
2. **照片展示**：懸停時動態展示該縣市的旅遊照片
3. **縣市點擊**：點擊縣市開啟詳細資訊卡片
4. **視覺回饋**：已造訪縣市有視覺標示

### 記錄管理

1. **新增記錄**：

   - 選擇縣市
   - 撰寫遊記描述
   - 上傳旅遊照片
   - 新增 Instagram 連結

2. **編輯記錄**：

   - 修改遊記內容
   - 更換照片
   - 更新 Instagram 連結

3. **刪除記錄**：
   - 確認對話框
   - 安全刪除

### 使用者體驗

1. **響應式設計**：適配手機、平板、桌機
2. **載入狀態**：優雅的載入動畫
3. **錯誤處理**：友善的錯誤訊息
4. **無障礙設計**：鍵盤導航支援

## 🔒 資安考量

- Google OAuth 安全登入
- Supabase Row Level Security (RLS)
- 環境變數保護敏感資訊
- CSRF 保護
- 檔案上傳安全檢查

## 🚀 部署指南

### 部署前檢查清單

#### 1. Google OAuth 設定（生產環境）

**Google Cloud Console 設定：**
1. 前往 [Google Cloud Console](https://console.cloud.google.com/)
2. 選擇你的專案 > "APIs & Services" > "Credentials"
3. 編輯 OAuth 2.0 客戶端 ID
4. **新增生產環境重新導向 URI**：
   ```
   https://yourdomain.com/api/auth/callback/google
   ```

**Supabase Dashboard 設定：**
1. Authentication > Settings
2. **Site URL**: `https://yourdomain.com`
3. **Redirect URLs**: `https://yourdomain.com/api/auth/callback/google`

#### 2. 環境變數設定

**生產環境環境變數：**
```env
# NextAuth.js
NEXTAUTH_SECRET=your-production-secret-key
NEXTAUTH_URL=https://yourdomain.com

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Supabase
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
```

#### 3. 資料庫設定

**執行必要的 SQL 腳本：**
1. 在 Supabase SQL Editor 中執行 `scripts/setup-auth-users.sql`
2. 執行 `scripts/setup-social-features.sql`
3. 執行 `scripts/setup-notifications.sql`

#### 4. 部署平台選擇

**推薦部署平台：**
- **Vercel** (推薦) - 最適合 Next.js
- **Netlify** - 支援 SSR
- **Railway** - 簡單易用
- **DigitalOcean App Platform** - 企業級

### Vercel 部署步驟

1. **連接 GitHub 倉庫**
2. **設定環境變數**（在 Vercel Dashboard）
3. **自動部署**（每次 push 到 main 分支）

### 建置測試

```bash
# 建置專案
yarn build

# 啟動生產環境
yarn start
```

---

## 📝 更新記錄

### v0.3.8 (2024-12-19)
- **i18n 多語言支援優化**：完善國際化翻譯系統
  - **通知工具函數優化**：重構通知內容生成邏輯，使用統一的翻譯函數
  - **時間格式化優化**：加入 `minutes_ago` 翻譯，支援分鐘級別的時間顯示
  - **硬編碼文字修正**：修正搜尋頁面和通知頁面中的硬編碼中文文字
  - **翻譯完整性**：確保所有使用者介面文字都有對應的中英文翻譯
  - **統一翻譯格式**：保持翻譯鍵的一致性和可維護性
- **RWD 響應式設計優化**：全面優化各頁面的手機版顯示
  - **Sidebar 響應式設計**：手機版改為下排水平導航，桌面版保持左側垂直導航
  - **AppLayout 優化**：調整主內容區域的 padding，適配手機版下排導航
  - **首頁 RWD**：標題欄和統計資訊在手機版垂直排列，桌面版水平排列
  - **縣市詳情頁面 RWD**：標題列、按鈕和內容區域適配手機螢幕
  - **個人檔案頁面 RWD**：用戶資訊區域在手機版垂直排列，統計數據改為 2x2 網格
  - **統一設計語言**：所有頁面保持一致的響應式斷點和間距
- **個人貼文頁面留言功能優化**：優化個人貼文頁面的留言互動體驗
  - 留言按讚使用樂觀更新，立即響應使用者操作
  - 留言新增、編輯、刪除操作重新獲取資料，確保資料一致性
  - 與縣市詳情頁面保持一致的優化策略
  - 提升個人貼文頁面的操作流暢度
- **留言功能優化**：修復留言時整個頁面重新載入的問題
  - 實作樂觀更新（Optimistic Updates）技術
  - 留言、按讚、編輯、刪除操作立即更新 UI，無需重新載入
  - 提升使用者體驗，操作更流暢
  - 只在發生錯誤時才重新獲取資料
- **容量限制調整**：將圖片上傳容量限制從 10MB 調整為 5MB，提升上傳速度和系統效能
- **拖放功能修復**：修復圖片拖放上傳功能，現在可以正常拖放圖片到上傳區域
- **縣市資料顯示修復**：修復新增地點後在所有人模式中縣市詳情頁面沒有資料的問題
  - 修正縣市名稱對應邏輯，支援英文縣市名稱（新增時使用）和中文縣市名稱（查詢時使用）
  - 在 posts API 和縣市詳情頁面中加入英文縣市名稱對應表
- **多語言支援**：更新容量限制相關的多語言翻譯，提供更清楚的錯誤訊息
- **常數管理**：統一管理圖片上傳限制常數，便於維護和調整

### v0.3.3 (2024-12-19)
- ✅ 修復 TypeScript `any` 類型錯誤
- ✅ 完善 i18n 翻譯鍵（添加 `google_signin_failed`）
- ✅ 優化認證系統類型定義
- ✅ 建置成功，準備部署

### v0.3.2 (2024-12-19)
- ✅ 為 LoginModal 組件添加完整 i18n 支援
- ✅ 修復用戶顯示名稱問題（mine 模式下）
- ✅ 統一 API 回傳格式
- ✅ 完善認證 session 處理

### v0.3.1 (2024-12-19)
- ✅ 修復通知功能
- ✅ 建立通知工具函數
- ✅ 更新 likes 和 comments API
- ✅ 添加 Google 同步用戶資料函數

### v0.3.0 (2024-12-19)
- ✅ 修復 mine 模式下的資料顯示問題
- ✅ 統一用戶 ID 查詢邏輯
- ✅ 加強縣市詳情頁面的資料篩選
- ✅ 修正 NextAuth JWT 回調函數

### v0.2.0 (2024-12-18)
- ✅ 實現雙重認證系統（Google OAuth + 帳號密碼）
- ✅ 添加社交功能（按讚、留言、通知）
- ✅ 完善用戶檔案管理
- ✅ 實現 i18n 國際化支援

### v0.1.0 (2024-12-17)
- ✅ 基礎地圖功能
- ✅ 縣市互動
- ✅ 造訪記錄管理
- ✅ 圖片上傳功能

---

## 🔧 技術架構

- **前端**: Next.js 15.3.3, React 19, TypeScript
- **認證**: NextAuth.js v5, Google OAuth, Supabase Auth
- **資料庫**: Supabase (PostgreSQL)
- **樣式**: Tailwind CSS
- **國際化**: react-i18next
- **狀態管理**: SWR
- **部署**: Vercel (推薦)

## 📞 支援

如有問題，請：
1. 檢查 [認證設置指南](docs/auth-setup-guide.md)
2. 查看 Supabase Dashboard 設定
3. 確認環境變數正確設定
4. 檢查 Google Cloud Console 設定

---

**台灣旅遊地圖** - 記錄你的旅行足跡 🗺️✨

## 最新更新 (2024-12-19)

### 🔧 通知系統動態語言翻譯修正
- **問題**: 留言時如果是中文，顯示的通知切換英文後還是中文
- **解決方案**: 
  - 修改通知系統架構，改為儲存通知類型和參數而非固定語言內容
  - 在顯示通知時根據當前介面語言動態翻譯
  - 更新 `Notification` 類型定義，加入 `actor_name` 欄位
  - 修正通知 API 查詢，包含 `actor_name` 欄位
  - 更新通知頁面使用 `generateNotificationDisplayContent` 函數
- **效果**: 
  - 通知內容會根據當前語言設定動態顯示
  - 切換語言時，所有通知都會即時更新為對應語言
  - 保持資料庫結構簡潔，只儲存必要資訊

### 🌐 i18n 優化
- 優化通知內容生成使用 i18n
- 修正通知頁面和搜尋頁面硬編碼文字
- 新增 `minutes_ago` 翻譯
- 更新單篇文章詳情頁面使用 i18n

### 📱 RWD 響應式設計優化
- 修改 AppLayout 和 Sidebar 組件
- 實作手機版下排水平導航，桌面版左側垂直導航
- 優化首頁、縣市詳情、個人檔案和社交縣市視圖的 RWD

### 💬 留言功能優化
- 實作樂觀更新優化留言、按讚、編輯、刪除功能
- 修正快取更新機制，避免文章消失問題
- 按讚立即響應，留言等操作穩定且不消失

### 🖼️ 智慧圖片顯示系統
- 新增 SmartImage 智慧圖片組件和 ImageEditor 圖片編輯器
- 整合到新增與編輯旅遊記錄模態框
- 更新社交貼文和縣市詳細卡片圖片顯示
- 參考 Instagram 圖片處理方式，實作簡潔的圖片編輯器

### 📸 圖片上傳限制優化
- 加入 5MB 容量限制檢查
- 加入詳細錯誤訊息和使用者提示
- 新增與編輯模態框上傳區域加入容量限制提示
- 建立常數檔統一管理限制值
- 加入拖放圖片功能

### 🗺️ 縣市資料顯示修正
- 修正縣市名稱對應問題
- 於 posts API 和縣市詳情頁面加入英文縣市名稱對應表
- 修正縣市資料顯示

### 👤 通知顯示名稱修正
- **問題**: 通知中顯示的是信箱而不是用戶的顯示名稱
- **解決方案**:
  - 改進 `createNotification` 函數，更完善地查詢 `user_profiles` 表
  - 支援不同的 `user_id` 格式（user_id 和 email）
  - 通知頁面優先使用 `actor` 物件中的 `name`，其次使用 `actor_name` 欄位
  - 加入錯誤處理，確保查詢失敗時有 fallback
- **效果**:
  - 通知中正確顯示用戶的 `display_name`
  - 如果用戶沒有設定顯示名稱，則顯示信箱的用戶名部分
  - 保持向後相容性

## 功能特色
