-- ==========================================
-- 為 notifications 表加入 actor_name 欄位
-- 用於支援動態語言翻譯
-- ==========================================

-- 檢查欄位是否已存在並新增
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'notifications' 
        AND column_name = 'actor_name'
    ) THEN
        -- 加入 actor_name 欄位
        ALTER TABLE notifications ADD COLUMN actor_name TEXT;
        
        -- 為現有資料填充 actor_name（從 actor_id 提取用戶名）
        UPDATE notifications 
        SET actor_name = split_part(actor_id, '@', 1)
        WHERE actor_name IS NULL;
        
        -- 建立索引以提升查詢效能
        CREATE INDEX IF NOT EXISTS idx_notifications_actor_name ON notifications(actor_name);
        
        RAISE NOTICE 'Successfully added actor_name column to notifications table';
    ELSE
        RAISE NOTICE 'actor_name column already exists in notifications table';
    END IF;
END $$;

-- 更新 create_notification 函數以支援 actor_name
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

-- 顯示更新結果
SELECT 
    'notifications table updated successfully' as status,
    COUNT(*) as total_notifications,
    COUNT(CASE WHEN actor_name IS NOT NULL THEN 1 END) as notifications_with_actor_name
FROM notifications; 