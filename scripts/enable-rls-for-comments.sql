-- 啟用 comments 表格的 Row Level Security (RLS)
-- 修復 "Policy Exists RLS Disabled" 問題

-- 啟用 comments 表格的 RLS
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

-- 檢查 RLS 是否已啟用
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled,
    CASE 
        WHEN rowsecurity = true THEN 'RLS 已啟用'
        ELSE 'RLS 未啟用'
    END as status
FROM pg_tables 
WHERE schemaname = 'public' 
    AND tablename = 'comments';

-- 檢查現有的 RLS 政策
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE schemaname = 'public' 
    AND tablename = 'comments'
ORDER BY policyname; 