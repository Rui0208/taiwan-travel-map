-- 修正 likes 和 comments 表格的 user_id 欄位類型
-- 從 UUID 改為 TEXT 以支援 email 作為 user_id

-- 修正 likes 表格
ALTER TABLE likes 
ALTER COLUMN user_id TYPE TEXT;

-- 修正 comments 表格  
ALTER TABLE comments 
ALTER COLUMN user_id TYPE TEXT;

-- 顯示修正結果
SELECT 'likes table user_id column fixed' as message;
SELECT 'comments table user_id column fixed' as message; 