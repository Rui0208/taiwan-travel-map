-- 簡單的 Storage 測試腳本

-- 1. 檢查現有的 buckets
SELECT * FROM storage.buckets WHERE id = 'visit-images';

-- 2. 如果沒有 bucket，建立一個簡單的 public bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('visit-images', 'visit-images', true, 52428800, '{"image/*"}')
ON CONFLICT (id) DO UPDATE SET 
  public = true,
  file_size_limit = 52428800,
  allowed_mime_types = '{"image/*"}';

-- 3. 移除所有現有的 Storage RLS 政策（重新開始）
DROP POLICY IF EXISTS "Users can upload their own images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own images" ON storage.objects;

-- 4. 建立簡單的允許所有操作的政策（測試用）
CREATE POLICY "Allow all operations on visit-images" ON storage.objects
FOR ALL USING (bucket_id = 'visit-images');

-- 5. 確認政策已建立
SELECT policyname, cmd FROM pg_policies 
WHERE tablename = 'objects' AND schemaname = 'storage' AND policyname LIKE '%visit-images%';

RAISE NOTICE '簡化的 Storage 設定完成！現在應該可以上傳檔案了。'; 