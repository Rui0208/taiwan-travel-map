-- ==========================================
-- 安全地更新資料庫以支援社交功能
-- ==========================================

-- 1. 新增 image_urls 欄位到現有的 visited_places 表格（如果不存在）
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'visited_places' AND column_name = 'image_urls'
    ) THEN
        ALTER TABLE visited_places ADD COLUMN image_urls TEXT[] DEFAULT '{}';
        RAISE NOTICE 'Added image_urls column to visited_places table';
    ELSE
        RAISE NOTICE 'image_urls column already exists in visited_places table';
    END IF;
END $$;

-- 2. 建立 likes 表格（如果不存在）
CREATE TABLE IF NOT EXISTS likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  post_id UUID DEFAULT NULL,
  comment_id UUID DEFAULT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- 確保只能按讚文章或留言中的一個
  CONSTRAINT likes_target_check CHECK (
    (post_id IS NOT NULL AND comment_id IS NULL) OR 
    (post_id IS NULL AND comment_id IS NOT NULL)
  ),
  
  -- 防止重複按讚
  CONSTRAINT unique_user_post_like UNIQUE(user_id, post_id),
  CONSTRAINT unique_user_comment_like UNIQUE(user_id, comment_id)
);

-- 3. 建立 comments 表格（如果不存在）
CREATE TABLE IF NOT EXISTS comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  post_id UUID NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. 建立索引以提升效能
CREATE INDEX IF NOT EXISTS idx_likes_post_id ON likes(post_id);
CREATE INDEX IF NOT EXISTS idx_likes_comment_id ON likes(comment_id);
CREATE INDEX IF NOT EXISTS idx_likes_user_id ON likes(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_post_id ON comments(post_id);
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON comments(user_id);
CREATE INDEX IF NOT EXISTS idx_visited_places_county ON visited_places(county);
CREATE INDEX IF NOT EXISTS idx_visited_places_user_id ON visited_places(user_id);

-- 5. 建立外鍵約束（如果不存在）
DO $$ 
BEGIN
    -- 為 likes 表格建立外鍵約束
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'likes_post_id_fkey' AND table_name = 'likes'
    ) THEN
        ALTER TABLE likes ADD CONSTRAINT likes_post_id_fkey 
        FOREIGN KEY (post_id) REFERENCES visited_places(id) ON DELETE CASCADE;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'likes_comment_id_fkey' AND table_name = 'likes'
    ) THEN
        ALTER TABLE likes ADD CONSTRAINT likes_comment_id_fkey 
        FOREIGN KEY (comment_id) REFERENCES comments(id) ON DELETE CASCADE;
    END IF;
    
    -- 為 comments 表格建立外鍵約束
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'comments_post_id_fkey' AND table_name = 'comments'
    ) THEN
        ALTER TABLE comments ADD CONSTRAINT comments_post_id_fkey 
        FOREIGN KEY (post_id) REFERENCES visited_places(id) ON DELETE CASCADE;
    END IF;
END $$;

-- 6. 啟用 RLS
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- 7. 建立 RLS 政策

-- likes 表格的政策
DROP POLICY IF EXISTS "Users can view all likes" ON likes;
CREATE POLICY "Users can view all likes" ON likes
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can manage their own likes" ON likes;
CREATE POLICY "Users can manage their own likes" ON likes
  FOR ALL USING (auth.uid() = user_id);

-- comments 表格的政策
DROP POLICY IF EXISTS "Users can view all comments" ON comments;
CREATE POLICY "Users can view all comments" ON comments
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can manage their own comments" ON comments;
CREATE POLICY "Users can manage their own comments" ON comments
  FOR ALL USING (auth.uid() = user_id);

-- 8. 建立實用函數

-- 計算按讚數量的函數
CREATE OR REPLACE FUNCTION get_likes_count(target_post_id UUID DEFAULT NULL, target_comment_id UUID DEFAULT NULL)
RETURNS INTEGER AS $$
BEGIN
  IF target_post_id IS NOT NULL THEN
    RETURN (SELECT COUNT(*)::INTEGER FROM likes WHERE post_id = target_post_id);
  ELSIF target_comment_id IS NOT NULL THEN
    RETURN (SELECT COUNT(*)::INTEGER FROM likes WHERE comment_id = target_comment_id);
  ELSE
    RETURN 0;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 檢查用戶是否已按讚的函數
CREATE OR REPLACE FUNCTION is_liked_by_user(
  target_user_id UUID,
  target_post_id UUID DEFAULT NULL,
  target_comment_id UUID DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
  IF target_post_id IS NOT NULL THEN
    RETURN EXISTS (
      SELECT 1 FROM likes 
      WHERE user_id = target_user_id AND post_id = target_post_id
    );
  ELSIF target_comment_id IS NOT NULL THEN
    RETURN EXISTS (
      SELECT 1 FROM likes 
      WHERE user_id = target_user_id AND comment_id = target_comment_id
    );
  ELSE
    RETURN FALSE;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. 建立觸發器來自動更新 updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_comments_updated_at ON comments;
CREATE TRIGGER update_comments_updated_at 
  BEFORE UPDATE ON comments
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- 10. 測試資料遷移（將現有的 image_url 轉為 image_urls）
UPDATE visited_places 
SET image_urls = CASE 
  WHEN image_url IS NOT NULL AND image_url != '' 
  THEN ARRAY[image_url] 
  ELSE '{}' 
END
WHERE image_urls = '{}' OR image_urls IS NULL;

-- 輸出完成訊息
DO $$ 
BEGIN
    RAISE NOTICE '===========================================';
    RAISE NOTICE '資料庫更新完成！';
    RAISE NOTICE '新增功能：';
    RAISE NOTICE '- visited_places.image_urls (多圖片支援)';
    RAISE NOTICE '- likes 表格 (按讚功能)';
    RAISE NOTICE '- comments 表格 (留言功能)';
    RAISE NOTICE '- RLS 政策已設定';
    RAISE NOTICE '- 索引已建立';
    RAISE NOTICE '- 實用函數已建立';
    RAISE NOTICE '===========================================';
END $$; 