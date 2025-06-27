-- 添加隱私設定欄位到 visited_places 表
-- 控制文章是否對所有人可見

-- 添加新欄位
ALTER TABLE visited_places 
ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT true;

-- 添加欄位註釋
COMMENT ON COLUMN visited_places.is_public IS '是否公開分享給所有人 (true=公開, false=僅自己可見)';

-- 建立索引以提升查詢效能
CREATE INDEX IF NOT EXISTS idx_visited_places_is_public ON visited_places(is_public);
CREATE INDEX IF NOT EXISTS idx_visited_places_user_public ON visited_places(user_id, is_public); 