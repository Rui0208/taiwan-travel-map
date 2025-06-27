-- 用戶個人資料表設定腳本
-- 用於儲存用戶自定義的名稱和圖像

-- 創建用戶個人資料表
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL UNIQUE, -- 對應 NextAuth 的 user.email
  display_name TEXT, -- 自定義顯示名稱
  avatar_url TEXT, -- 自定義頭像 URL
  bio TEXT, -- 個人簡介（可選）
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 建立索引
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);

-- 暫時禁用 RLS，在 API 層面處理權限控制
ALTER TABLE user_profiles DISABLE ROW LEVEL SECURITY;

-- 創建更新時間戳觸發器函數
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 刪除現有觸發器（如果存在）然後重新創建
DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles;

CREATE TRIGGER update_user_profiles_updated_at 
    BEFORE UPDATE ON user_profiles 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 插入說明註釋
COMMENT ON TABLE user_profiles IS '用戶個人資料表，儲存自定義的名稱、頭像等資訊';
COMMENT ON COLUMN user_profiles.user_id IS '用戶 ID（NextAuth 的 email）';
COMMENT ON COLUMN user_profiles.display_name IS '自定義顯示名稱';
COMMENT ON COLUMN user_profiles.avatar_url IS '自定義頭像 URL';
COMMENT ON COLUMN user_profiles.bio IS '個人簡介'; 