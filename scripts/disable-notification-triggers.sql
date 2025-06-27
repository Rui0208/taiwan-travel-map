-- 停用通知觸發器，改為在 API 層面處理
-- 這樣可以支援 i18n 多語言

-- 停用按讚文章觸發器
DROP TRIGGER IF EXISTS trigger_notify_post_liked ON likes;

-- 停用按讚留言觸發器
DROP TRIGGER IF EXISTS trigger_notify_comment_liked ON likes;

-- 停用留言文章觸發器
DROP TRIGGER IF EXISTS trigger_notify_post_commented ON comments;

-- 保留通知表格和函數，但不再自動觸發
-- 通知將由 API 手動建立，以支援多語言

DO $$ 
BEGIN
    RAISE NOTICE '===========================================';
    RAISE NOTICE '通知觸發器已停用！';
    RAISE NOTICE '通知將由 API 手動建立以支援 i18n';
    RAISE NOTICE '===========================================';
END $$; 