-- 修正用戶個人資料表的腳本
-- 解決 RLS 和觸發器重複創建的問題

-- 禁用 RLS（因為我們在 API 層面處理權限）
ALTER TABLE user_profiles DISABLE ROW LEVEL SECURITY;

-- 確保觸發器函數存在
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 重新創建觸發器
DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles;
CREATE TRIGGER update_user_profiles_updated_at 
    BEFORE UPDATE ON user_profiles 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column(); 