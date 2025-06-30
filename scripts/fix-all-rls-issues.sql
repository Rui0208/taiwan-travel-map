-- 修復所有 RLS 相關問題
-- 檢查並啟用所有有政策但未啟用 RLS 的表格

-- 1. 檢查所有表格的 RLS 狀態和政策
SELECT 
    t.schemaname,
    t.tablename,
    t.rowsecurity as rls_enabled,
    COUNT(p.policyname) as policy_count,
    CASE 
        WHEN t.rowsecurity = true AND COUNT(p.policyname) > 0 THEN '✓ RLS 已啟用且有政策'
        WHEN t.rowsecurity = false AND COUNT(p.policyname) > 0 THEN '⚠️ 有政策但 RLS 未啟用'
        WHEN t.rowsecurity = true AND COUNT(p.policyname) = 0 THEN '⚠️ RLS 已啟用但無政策'
        ELSE '○ 無 RLS 設定'
    END as status
FROM pg_tables t
LEFT JOIN pg_policies p ON t.schemaname = p.schemaname AND t.tablename = p.tablename
WHERE t.schemaname = 'public'
GROUP BY t.schemaname, t.tablename, t.rowsecurity
ORDER BY t.tablename;

-- 2. 啟用所有需要的表格的 RLS
-- comments 表格
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

-- likes 表格（如果存在）
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'likes') THEN
        ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;

-- notifications 表格（如果存在）
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'notifications') THEN
        ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;

-- visited_places 表格（如果存在）
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'visited_places') THEN
        ALTER TABLE public.visited_places ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;

-- user_profiles 表格（如果存在）
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'user_profiles') THEN
        ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;

-- 3. 再次檢查修復結果
SELECT 
    t.schemaname,
    t.tablename,
    t.rowsecurity as rls_enabled,
    COUNT(p.policyname) as policy_count,
    CASE 
        WHEN t.rowsecurity = true AND COUNT(p.policyname) > 0 THEN '✓ RLS 已啟用且有政策'
        WHEN t.rowsecurity = false AND COUNT(p.policyname) > 0 THEN '⚠️ 有政策但 RLS 未啟用'
        WHEN t.rowsecurity = true AND COUNT(p.policyname) = 0 THEN '⚠️ RLS 已啟用但無政策'
        ELSE '○ 無 RLS 設定'
    END as status
FROM pg_tables t
LEFT JOIN pg_policies p ON t.schemaname = p.schemaname AND t.tablename = p.tablename
WHERE t.schemaname = 'public'
GROUP BY t.schemaname, t.tablename, t.rowsecurity
ORDER BY t.tablename;

-- 4. 顯示所有 RLS 政策詳情
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd as operation,
    qual as condition,
    with_check
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname; 