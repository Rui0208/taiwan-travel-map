-- 檢查 sync_google_user_profile 函數是否存在
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.routines 
        WHERE routine_name = 'sync_google_user_profile' 
        AND routine_schema = 'public'
    ) THEN
        RAISE NOTICE 'sync_google_user_profile 函數不存在，正在建立...';
        
        -- 建立函數
        CREATE OR REPLACE FUNCTION public.sync_google_user_profile(
            p_user_id TEXT,
            p_email TEXT,
            p_name TEXT,
            p_image TEXT
        )
        RETURNS VOID AS $$
        BEGIN
            INSERT INTO public.user_profiles (
                user_id,
                auth_provider,
                email,
                display_name,
                avatar_url
            )
            VALUES (
                p_user_id,
                'google',
                p_email,
                p_name,
                p_image
            )
            ON CONFLICT (user_id) DO UPDATE SET
                email = EXCLUDED.email,
                display_name = COALESCE(user_profiles.display_name, EXCLUDED.display_name),
                avatar_url = COALESCE(user_profiles.avatar_url, EXCLUDED.avatar_url),
                updated_at = NOW();
        END;
        $$ LANGUAGE plpgsql SECURITY DEFINER;
        
        RAISE NOTICE 'sync_google_user_profile 函數建立完成！';
    ELSE
        RAISE NOTICE 'sync_google_user_profile 函數已存在';
    END IF;
END $$;

-- 檢查 user_profiles 表格是否存在
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'user_profiles' 
        AND table_schema = 'public'
    ) THEN
        RAISE NOTICE 'user_profiles 表格不存在，正在建立...';
        
        -- 建立 user_profiles 表格
        CREATE TABLE public.user_profiles (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id TEXT NOT NULL UNIQUE,
            auth_provider TEXT NOT NULL DEFAULT 'google',
            auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
            email TEXT NOT NULL,
            display_name TEXT,
            avatar_url TEXT,
            bio TEXT,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
        );
        
        -- 建立索引
        CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON public.user_profiles(user_id);
        CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON public.user_profiles(email);
        
        RAISE NOTICE 'user_profiles 表格建立完成！';
    ELSE
        RAISE NOTICE 'user_profiles 表格已存在';
    END IF;
END $$;

-- 測試函數
DO $$
BEGIN
    RAISE NOTICE '測試 sync_google_user_profile 函數...';
    -- 這裡可以添加測試呼叫
    RAISE NOTICE '函數測試完成！';
END $$; 