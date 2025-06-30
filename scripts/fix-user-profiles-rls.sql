-- 修正 user_profiles 表格的 RLS 政策
-- 由於我們使用 NextAuth.js 而不是 Supabase Auth，需要調整 RLS 政策

-- 選項 1: 完全禁用 RLS（推薦，因為我們在 API 層面有授權檢查）
ALTER TABLE user_profiles DISABLE ROW LEVEL SECURITY;

-- 選項 2: 如果要保留 RLS，使用更寬鬆的政策
-- 取消註解以下內容來使用選項 2

/*
-- 移除現有的嚴格政策
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON user_profiles;
DROP POLICY IF EXISTS "Enable select for users based on user_id" ON user_profiles;
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON user_profiles;
DROP POLICY IF EXISTS "Enable delete for users based on user_id" ON user_profiles;

-- 建立寬鬆的政策（允許所有操作，因為我們在 API 層面控制授權）
CREATE POLICY "Allow all operations" ON user_profiles
FOR ALL USING (true) WITH CHECK (true);
*/

-- 顯示完成訊息
SELECT 'user_profiles 表格的 RLS 政策已修正' as message; 