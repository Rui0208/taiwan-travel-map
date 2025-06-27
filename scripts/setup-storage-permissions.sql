-- ==========================================
-- 設定 Supabase Storage 權限
-- ==========================================

-- 1. 建立 visit-images bucket（如果不存在）
INSERT INTO storage.buckets (id, name, public)
VALUES ('visit-images', 'visit-images', true)
ON CONFLICT (id) DO NOTHING;

-- 2. 設定 Storage 的 RLS 政策
-- 允許經過身份驗證的用戶上傳檔案到自己的資料夾
CREATE POLICY "Users can upload their own images" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'visit-images' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

-- 允許所有人查看圖片（因為 bucket 是 public）
CREATE POLICY "Anyone can view images" ON storage.objects
FOR SELECT USING (bucket_id = 'visit-images');

-- 允許用戶刪除自己的圖片
CREATE POLICY "Users can delete their own images" ON storage.objects
FOR DELETE USING (
  bucket_id = 'visit-images' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

-- 3. 檢查現有政策
SELECT 
  schemaname,
  tablename, 
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'objects' AND schemaname = 'storage';

-- 輸出完成訊息
DO $$ 
BEGIN
    RAISE NOTICE '===========================================';
    RAISE NOTICE 'Storage 權限設定完成！';
    RAISE NOTICE '- visit-images bucket 已建立';
    RAISE NOTICE '- RLS 政策已設定';
    RAISE NOTICE '- 用戶可以上傳/刪除自己的圖片';
    RAISE NOTICE '- 所有人可以查看圖片';
    RAISE NOTICE '===========================================';
END $$; 