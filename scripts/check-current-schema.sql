-- 檢查 visited_places 表格結構
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'visited_places' 
ORDER BY ordinal_position;

-- 檢查是否存在 image_urls 欄位
SELECT EXISTS (
  SELECT 1 
  FROM information_schema.columns 
  WHERE table_name = 'visited_places' 
  AND column_name = 'image_urls'
) as has_image_urls_column;

-- 檢查是否存在 likes 表格
SELECT EXISTS (
  SELECT 1 
  FROM information_schema.tables 
  WHERE table_name = 'likes'
) as has_likes_table;

-- 檢查是否存在 comments 表格
SELECT EXISTS (
  SELECT 1 
  FROM information_schema.tables 
  WHERE table_name = 'comments'
) as has_comments_table;

-- 檢查 RLS 政策
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies 
WHERE tablename IN ('visited_places', 'likes', 'comments'); 