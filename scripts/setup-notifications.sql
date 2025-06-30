-- ==========================================
-- 設定通知系統資料庫
-- ==========================================

-- 建立通知表格
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL, -- 接收通知的用戶 (email)
  actor_id TEXT NOT NULL, -- 執行動作的用戶 (email)
  type VARCHAR(50) NOT NULL, -- 通知類型: 'like_post', 'like_comment', 'comment_post'
  post_id UUID REFERENCES visited_places(id) ON DELETE CASCADE,
  comment_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  content TEXT, -- 通知內容文字（保留用於向後相容）
  actor_name TEXT, -- 演員名稱，用於動態語言翻譯
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- 確保通知有對應的文章或留言
  CONSTRAINT notifications_target_check CHECK (
    (post_id IS NOT NULL) OR (comment_id IS NOT NULL)
  ),
  
  -- 防止重複通知（同一用戶對同一目標的同類型動作）
  CONSTRAINT unique_notification UNIQUE(user_id, actor_id, type, post_id, comment_id)
);

-- 建立索引以提升效能
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_actor_name ON notifications(actor_name);

-- 建立複合索引用於查詢
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id, is_read, created_at DESC);

-- 啟用 RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- 建立 RLS 政策（先檢查是否已存在）
DO $$
BEGIN
    -- 檢查並建立 "Users can view their own notifications" 政策
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'notifications' 
        AND policyname = 'Users can view their own notifications'
    ) THEN
        CREATE POLICY "Users can view their own notifications" ON notifications
          FOR SELECT USING (user_id = auth.email());
    END IF;

    -- 檢查並建立 "System can insert notifications" 政策
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'notifications' 
        AND policyname = 'System can insert notifications'
    ) THEN
        CREATE POLICY "System can insert notifications" ON notifications
          FOR INSERT WITH CHECK (true);
    END IF;

    -- 檢查並建立 "Users can update their own notifications" 政策
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'notifications' 
        AND policyname = 'Users can update their own notifications'
    ) THEN
        CREATE POLICY "Users can update their own notifications" ON notifications
          FOR UPDATE USING (user_id = auth.email());
    END IF;
END $$;

-- 建立函數來創建通知
CREATE OR REPLACE FUNCTION create_notification(
  target_user_id TEXT,
  p_actor_id TEXT,
  p_type VARCHAR(50),
  p_post_id UUID DEFAULT NULL,
  p_comment_id UUID DEFAULT NULL,
  p_content TEXT DEFAULT NULL,
  p_actor_name TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
  -- 不要為自己的動作創建通知
  IF target_user_id = p_actor_id THEN
    RETURN FALSE;
  END IF;
  
  -- 如果沒有提供 actor_name，從 actor_id 提取
  IF p_actor_name IS NULL THEN
    p_actor_name := split_part(p_actor_id, '@', 1);
  END IF;
  
  -- 插入通知（ON CONFLICT DO NOTHING 避免重複通知）
  INSERT INTO notifications (user_id, actor_id, type, post_id, comment_id, content, actor_name)
  VALUES (target_user_id, p_actor_id, p_type, p_post_id, p_comment_id, p_content, p_actor_name)
  ON CONFLICT (user_id, actor_id, type, post_id, comment_id) DO NOTHING;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 建立函數來獲取未讀通知數量
CREATE OR REPLACE FUNCTION get_unread_notifications_count(target_user_id TEXT)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)::INTEGER 
    FROM notifications 
    WHERE user_id = target_user_id AND is_read = FALSE
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 建立觸發器：當有人按讚文章時創建通知
CREATE OR REPLACE FUNCTION notify_post_liked()
RETURNS TRIGGER AS $$
DECLARE
  post_owner_id TEXT;
  actor_name TEXT;
BEGIN
  -- 只處理新增的按讚
  IF TG_OP = 'INSERT' AND NEW.post_id IS NOT NULL THEN
    -- 獲取文章擁有者
    SELECT user_id INTO post_owner_id
    FROM visited_places
    WHERE id = NEW.post_id;
    
    -- 獲取按讚者名稱（從 email 提取用戶名）
    actor_name := split_part(NEW.user_id, '@', 1);
    
    -- 創建通知
    PERFORM create_notification(
      post_owner_id,
      NEW.user_id,
      'like_post',
      NEW.post_id,
      NULL,
      actor_name || ' 讚了你的貼文',
      actor_name
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 建立觸發器：當有人按讚留言時創建通知
CREATE OR REPLACE FUNCTION notify_comment_liked()
RETURNS TRIGGER AS $$
DECLARE
  comment_owner_id TEXT;
  actor_name TEXT;
BEGIN
  -- 只處理新增的按讚
  IF TG_OP = 'INSERT' AND NEW.comment_id IS NOT NULL THEN
    -- 獲取留言擁有者
    SELECT user_id INTO comment_owner_id
    FROM comments
    WHERE id = NEW.comment_id;
    
    -- 獲取按讚者名稱
    actor_name := split_part(NEW.user_id, '@', 1);
    
    -- 創建通知
    PERFORM create_notification(
      comment_owner_id,
      NEW.user_id,
      'like_comment',
      NULL,
      NEW.comment_id,
      actor_name || ' 讚了你的留言',
      actor_name
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 建立觸發器：當有人留言時創建通知
CREATE OR REPLACE FUNCTION notify_post_commented()
RETURNS TRIGGER AS $$
DECLARE
  post_owner_id TEXT;
  actor_name TEXT;
BEGIN
  -- 只處理新增的留言
  IF TG_OP = 'INSERT' THEN
    -- 獲取文章擁有者
    SELECT user_id INTO post_owner_id
    FROM visited_places
    WHERE id = NEW.post_id;
    
    -- 獲取留言者名稱
    actor_name := split_part(NEW.user_id, '@', 1);
    
    -- 創建通知
    PERFORM create_notification(
      post_owner_id,
      NEW.user_id,
      'comment_post',
      NEW.post_id,
      NEW.id,
      actor_name || ' 留言了你的貼文',
      actor_name
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 設定觸發器
DROP TRIGGER IF EXISTS trigger_notify_post_liked ON likes;
CREATE TRIGGER trigger_notify_post_liked
  AFTER INSERT ON likes
  FOR EACH ROW
  EXECUTE FUNCTION notify_post_liked();

DROP TRIGGER IF EXISTS trigger_notify_comment_liked ON likes;
CREATE TRIGGER trigger_notify_comment_liked
  AFTER INSERT ON likes
  FOR EACH ROW
  EXECUTE FUNCTION notify_comment_liked();

DROP TRIGGER IF EXISTS trigger_notify_post_commented ON comments;
CREATE TRIGGER trigger_notify_post_commented
  AFTER INSERT ON comments
  FOR EACH ROW
  EXECUTE FUNCTION notify_post_commented();

-- 輸出完成訊息
DO $$ 
BEGIN
    RAISE NOTICE '===========================================';
    RAISE NOTICE '通知系統設定完成！';
    RAISE NOTICE '- notifications 表格已建立';
    RAISE NOTICE '- RLS 政策已設定';
    RAISE NOTICE '- 索引已建立';
    RAISE NOTICE '- 通知觸發器已設定';
    RAISE NOTICE '- 支援的通知類型：';
    RAISE NOTICE '  * like_post: 按讚文章';
    RAISE NOTICE '  * like_comment: 按讚留言';
    RAISE NOTICE '  * comment_post: 留言文章';
    RAISE NOTICE '===========================================';
END $$; 