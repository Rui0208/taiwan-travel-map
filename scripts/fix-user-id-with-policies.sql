-- 修正 likes 和 comments 表格的 user_id 欄位類型
-- 需要先移除 RLS 政策，修改欄位類型，然後重新建立政策

-- 1. 移除 likes 表格的所有政策
DROP POLICY IF EXISTS "Users can manage their own likes" ON likes;
DROP POLICY IF EXISTS "Users can view all likes" ON likes;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON likes;
DROP POLICY IF EXISTS "Enable read access for all users" ON likes;
DROP POLICY IF EXISTS "Enable delete for users based on user_id" ON likes;

-- 2. 移除 comments 表格的所有政策
DROP POLICY IF EXISTS "Users can manage their own comments" ON comments;
DROP POLICY IF EXISTS "Users can view all comments" ON comments;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON comments;
DROP POLICY IF EXISTS "Enable read access for all users" ON comments;
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON comments;
DROP POLICY IF EXISTS "Enable delete for users based on user_id" ON comments;

-- 3. 修改欄位類型
ALTER TABLE likes ALTER COLUMN user_id TYPE TEXT;
ALTER TABLE comments ALTER COLUMN user_id TYPE TEXT;

-- 4. 重新建立 likes 表格的 RLS 政策
-- 讀取權限：所有人都可以看到按讚
CREATE POLICY "Enable read access for all users" ON likes
FOR SELECT USING (true);

-- 插入權限：只有登入用戶可以按讚（使用 email）
CREATE POLICY "Enable insert for authenticated users only" ON likes
FOR INSERT WITH CHECK (auth.email() = user_id);

-- 刪除權限：用戶只能刪除自己的按讚（使用 email）
CREATE POLICY "Enable delete for users based on user_id" ON likes
FOR DELETE USING (auth.email() = user_id);

-- 5. 重新建立 comments 表格的 RLS 政策
-- 讀取權限：所有人都可以看到留言
CREATE POLICY "Enable read access for all users" ON comments
FOR SELECT USING (true);

-- 插入權限：只有登入用戶可以留言（使用 email）
CREATE POLICY "Enable insert for authenticated users only" ON comments
FOR INSERT WITH CHECK (auth.email() = user_id);

-- 更新權限：用戶只能編輯自己的留言（使用 email）
CREATE POLICY "Enable update for users based on user_id" ON comments
FOR UPDATE USING (auth.email() = user_id);

-- 刪除權限：用戶只能刪除自己的留言（使用 email）
CREATE POLICY "Enable delete for users based on user_id" ON comments
FOR DELETE USING (auth.email() = user_id);

-- 6. 確保 RLS 是啟用的
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- 7. 顯示完成訊息
SELECT 'likes 和 comments 表格的 user_id 欄位已修正為 TEXT 類型，RLS 政策已重新建立' as message; 