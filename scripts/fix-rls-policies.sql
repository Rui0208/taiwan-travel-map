-- 修正 RLS 政策以支援 NextAuth.js
-- 由於我們使用 NextAuth.js 而不是 Supabase Auth，需要調整 RLS 政策

-- 選項 1: 完全禁用 RLS（推薦，因為我們在 API 層面有授權檢查）
ALTER TABLE likes DISABLE ROW LEVEL SECURITY;
ALTER TABLE comments DISABLE ROW LEVEL SECURITY;

-- 選項 2: 如果要保留 RLS，使用更寬鬆的政策
-- 取消註解以下內容來使用選項 2

/*
-- 移除現有的嚴格政策
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON likes;
DROP POLICY IF EXISTS "Enable delete for users based on user_id" ON likes;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON comments;
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON comments;
DROP POLICY IF EXISTS "Enable delete for users based on user_id" ON comments;

-- 建立寬鬆的政策（允許所有操作，因為我們在 API 層面控制授權）
CREATE POLICY "Allow all operations" ON likes
FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations" ON comments
FOR ALL USING (true) WITH CHECK (true);
*/

-- 顯示完成訊息
SELECT 'RLS 政策已修正，現在應該可以正常使用按讚和留言功能' as message; 