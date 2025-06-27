# 通知系統調試指南

## 🔍 檢查步驟

### 1. 檢查 Supabase 通知表格
在 Supabase Dashboard 的 SQL Editor 中執行：

```sql
-- 檢查 notifications 表格是否存在
SELECT * FROM information_schema.tables 
WHERE table_name = 'notifications';

-- 如果表格存在，檢查結構
\d notifications;

-- 檢查現有通知
SELECT * FROM notifications ORDER BY created_at DESC LIMIT 10;
```

### 2. 如果表格不存在，建立它
```sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  actor_id TEXT NOT NULL,
  type VARCHAR(50) NOT NULL,
  post_id UUID REFERENCES visited_places(id) ON DELETE CASCADE,
  comment_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  content TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 啟用 RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- 建立政策（寬鬆版本用於測試）
CREATE POLICY "Allow all operations for notifications" 
ON notifications FOR ALL USING (true);
```

### 3. 測試通知建立
```sql
-- 手動建立一個測試通知（替換成你的 email）
INSERT INTO notifications (user_id, actor_id, type, content)
VALUES ('你的email@gmail.com', 'test@example.com', 'like_post', '測試通知');

-- 檢查是否建立成功
SELECT * FROM notifications WHERE user_id = '你的email@gmail.com';
```

### 4. 檢查按讚和留言記錄
```sql
-- 檢查最近的按讚記錄
SELECT * FROM likes ORDER BY created_at DESC LIMIT 5;

-- 檢查最近的留言記錄
SELECT * FROM comments ORDER BY created_at DESC LIMIT 5;

-- 檢查文章作者
SELECT id, user_id, county FROM visited_places ORDER BY created_at DESC LIMIT 5;
```

## 🐛 常見問題

### 問題 1: 表格不存在
**解決方法**: 在 Supabase Dashboard 手動建立表格

### 問題 2: RLS 政策阻擋
**解決方法**: 暫時使用寬鬆政策測試，確認功能後再收緊

### 問題 3: 用戶ID不匹配
**解決方法**: 檢查 session.user.id 的格式是否與資料庫中的 user_id 一致

### 問題 4: API 權限問題
**解決方法**: 確認 SUPABASE_SERVICE_ROLE_KEY 已正確設定

## 🧪 測試流程

1. **用帳號A登入** → 發布一篇公開文章
2. **用帳號B登入** → 按讚帳號A的文章
3. **檢查控制台日誌** → 看是否有 "建立通知成功" 訊息
4. **切換回帳號A** → 檢查通知頁面
5. **查看資料庫** → 確認 notifications 表格有新記錄

## 📝 調試日誌

開啟開發者工具的 Console，按讚或留言時應該看到：
- "建立通知給: user@email.com 類型: like_post"
- "通知建立成功" 或錯誤訊息

如果看到錯誤，檢查：
- 是否有 CORS 錯誤
- 是否有 RLS 政策錯誤
- 是否有權限錯誤 