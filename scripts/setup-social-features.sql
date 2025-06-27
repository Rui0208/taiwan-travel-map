-- 新增多圖片支援到現有的 visited_places 表格
ALTER TABLE visited_places 
ADD COLUMN image_urls TEXT[] DEFAULT '{}';

-- 建立按讚表格
CREATE TABLE IF NOT EXISTS likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  post_id UUID REFERENCES visited_places(id) ON DELETE CASCADE,
  comment_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT likes_target_check CHECK (
    (post_id IS NOT NULL AND comment_id IS NULL) OR 
    (post_id IS NULL AND comment_id IS NOT NULL)
  ),
  UNIQUE(user_id, post_id),
  UNIQUE(user_id, comment_id)
);

-- 建立留言表格
CREATE TABLE IF NOT EXISTS comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  post_id UUID NOT NULL REFERENCES visited_places(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 建立索引以提升效能
CREATE INDEX IF NOT EXISTS idx_likes_post_id ON likes(post_id);
CREATE INDEX IF NOT EXISTS idx_likes_comment_id ON likes(comment_id);
CREATE INDEX IF NOT EXISTS idx_likes_user_id ON likes(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_post_id ON comments(post_id);
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON comments(user_id);
CREATE INDEX IF NOT EXISTS idx_visited_places_county ON visited_places(county);

-- 建立 RLS (Row Level Security) 政策
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- 按讚表格的 RLS 政策
CREATE POLICY "Users can view all likes" ON likes
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own likes" ON likes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own likes" ON likes
  FOR DELETE USING (auth.uid() = user_id);

-- 留言表格的 RLS 政策
CREATE POLICY "Users can view all comments" ON comments
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own comments" ON comments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own comments" ON comments
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments" ON comments
  FOR DELETE USING (auth.uid() = user_id);

-- 建立函數來計算按讚數量
CREATE OR REPLACE FUNCTION get_likes_count(target_post_id UUID DEFAULT NULL, target_comment_id UUID DEFAULT NULL)
RETURNS INTEGER AS $$
BEGIN
  IF target_post_id IS NOT NULL THEN
    RETURN (SELECT COUNT(*) FROM likes WHERE post_id = target_post_id);
  ELSIF target_comment_id IS NOT NULL THEN
    RETURN (SELECT COUNT(*) FROM likes WHERE comment_id = target_comment_id);
  ELSE
    RETURN 0;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 建立函數來檢查用戶是否已按讚
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

-- 建立觸發器來更新 updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_comments_updated_at 
  BEFORE UPDATE ON comments
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column(); 