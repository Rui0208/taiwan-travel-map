-- 設置帳號密碼認證系統
-- 注意：這個腳本需要在 Supabase SQL Editor 中執行

-- 1. 確保 auth schema 有正確的權限
-- (Supabase 預設已經有 auth.users 表，我們主要是配置它)

-- 2. 建立或更新 user_profiles 表格以支援兩種登入方式
-- 檢查 user_profiles 表是否存在，如果不存在則建立
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_profiles') THEN
        CREATE TABLE public.user_profiles (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id TEXT NOT NULL UNIQUE, -- 可以是 email 或 auth.users.id
            auth_provider TEXT NOT NULL DEFAULT 'password', -- 'google' 或 'password'
            auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE, -- 關聯到 auth.users
            email TEXT NOT NULL,
            display_name TEXT,
            avatar_url TEXT,
            bio TEXT,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
        );
    ELSE
        -- 如果表已存在，添加新欄位
        BEGIN
            ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS auth_provider TEXT DEFAULT 'google';
            ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
        EXCEPTION
            WHEN duplicate_column THEN
                NULL; -- 忽略已存在的欄位錯誤
        END;
    END IF;
END $$;

-- 3. 建立索引以提高查詢效能
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON public.user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON public.user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_user_profiles_auth_user_id ON public.user_profiles(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_auth_provider ON public.user_profiles(auth_provider);

-- 4. 建立觸發器以自動維護 updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON public.user_profiles;
CREATE TRIGGER update_user_profiles_updated_at
    BEFORE UPDATE ON public.user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 5. 建立觸發器自動創建用戶檔案當新用戶註冊時
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    user_identifier TEXT;
BEGIN
    -- 決定用戶識別符：優先使用 email，如果沒有則使用 id
    user_identifier := COALESCE(NEW.email, NEW.id::TEXT);
    
    INSERT INTO public.user_profiles (
        user_id,
        auth_provider,
        auth_user_id,
        email,
        display_name
    )
    VALUES (
        user_identifier,
        'password', -- 透過 Supabase Auth 註冊的都是密碼登入
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email)
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 建立觸發器
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- 6. 建立函數來處理用戶資料同步（當 Google 用戶資料改變時）
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

-- 7. 設定 RLS (Row Level Security) 政策
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- 刪除現有政策（如果存在）
DROP POLICY IF EXISTS "Users can view their own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Anyone can view public profiles" ON public.user_profiles;

-- 建立新的 RLS 政策
CREATE POLICY "Users can view their own profile" ON public.user_profiles
    FOR SELECT USING (
        auth.uid() IS NOT NULL AND (
            user_id = auth.jwt()->>'email' OR 
            auth_user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update their own profile" ON public.user_profiles
    FOR UPDATE USING (
        auth.uid() IS NOT NULL AND (
            user_id = auth.jwt()->>'email' OR 
            auth_user_id = auth.uid()
        )
    );

CREATE POLICY "Anyone can view public profiles for social features" ON public.user_profiles
    FOR SELECT USING (true);

-- 8. 確保其他表格的 user_id 欄位能正確關聯
-- 更新現有的 visited_places 表格 RLS 政策以支援兩種認證方式
DROP POLICY IF EXISTS "Users can manage their own visited places" ON public.visited_places;
DROP POLICY IF EXISTS "Users can view public visited places" ON public.visited_places;

CREATE POLICY "Users can manage their own visited places" ON public.visited_places
    FOR ALL USING (
        auth.uid() IS NOT NULL AND (
            user_id = auth.jwt()->>'email' OR 
            user_id IN (
                SELECT user_id FROM public.user_profiles 
                WHERE auth_user_id = auth.uid()
            )
        )
    );

CREATE POLICY "Users can view public visited places" ON public.visited_places
    FOR SELECT USING (is_public = true OR (
        auth.uid() IS NOT NULL AND (
            user_id = auth.jwt()->>'email' OR 
            user_id IN (
                SELECT user_id FROM public.user_profiles 
                WHERE auth_user_id = auth.uid()
            )
        )
    ));

-- 9. 更新其他社交功能表格的 RLS 政策
-- Comments 表格
DROP POLICY IF EXISTS "Users can manage their own comments" ON public.comments;
DROP POLICY IF EXISTS "Anyone can view comments" ON public.comments;

CREATE POLICY "Users can manage their own comments" ON public.comments
    FOR ALL USING (
        auth.uid() IS NOT NULL AND (
            user_id = auth.jwt()->>'email' OR 
            user_id IN (
                SELECT user_id FROM public.user_profiles 
                WHERE auth_user_id = auth.uid()
            )
        )
    );

CREATE POLICY "Anyone can view comments" ON public.comments
    FOR SELECT USING (true);

-- Likes 表格
DROP POLICY IF EXISTS "Users can manage their own likes" ON public.likes;
DROP POLICY IF EXISTS "Anyone can view likes" ON public.likes;

CREATE POLICY "Users can manage their own likes" ON public.likes
    FOR ALL USING (
        auth.uid() IS NOT NULL AND (
            user_id = auth.jwt()->>'email' OR 
            user_id IN (
                SELECT user_id FROM public.user_profiles 
                WHERE auth_user_id = auth.uid()
            )
        )
    );

CREATE POLICY "Anyone can view likes" ON public.likes
    FOR SELECT USING (true);

-- Notifications 表格
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;

CREATE POLICY "Users can view their own notifications" ON public.notifications
    FOR SELECT USING (
        auth.uid() IS NOT NULL AND (
            user_id = auth.jwt()->>'email' OR 
            user_id IN (
                SELECT user_id FROM public.user_profiles 
                WHERE auth_user_id = auth.uid()
            )
        )
    );

CREATE POLICY "Users can update their own notifications" ON public.notifications
    FOR UPDATE USING (
        auth.uid() IS NOT NULL AND (
            user_id = auth.jwt()->>'email' OR 
            user_id IN (
                SELECT user_id FROM public.user_profiles 
                WHERE auth_user_id = auth.uid()
            )
        )
    );

-- 10. 建立幫助函數來獲取當前用戶的統一 user_id
CREATE OR REPLACE FUNCTION public.get_current_user_id()
RETURNS TEXT AS $$
BEGIN
    -- 如果是透過 JWT 登入（Google OAuth），返回 email
    IF auth.jwt()->>'email' IS NOT NULL THEN
        RETURN auth.jwt()->>'email';
    END IF;
    
    -- 如果是透過 Supabase Auth 登入，從 user_profiles 中獲取 user_id
    IF auth.uid() IS NOT NULL THEN
        RETURN (
            SELECT user_id 
            FROM public.user_profiles 
            WHERE auth_user_id = auth.uid() 
            LIMIT 1
        );
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 11. 為開發環境設置：自動確認新註冊用戶的電子郵件（可選）
-- 這個函數可以在開發環境中自動確認用戶電子郵件，避免確認步驟
CREATE OR REPLACE FUNCTION public.auto_confirm_user_email()
RETURNS TRIGGER AS $$
BEGIN
    -- 在開發環境中自動確認電子郵件
    -- 生產環境請刪除此觸發器
    IF NEW.email_confirmed_at IS NULL THEN
        NEW.email_confirmed_at = NOW();
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 創建觸發器（僅限開發環境使用）
-- 生產環境請移除此觸發器
DROP TRIGGER IF EXISTS auto_confirm_email_on_signup ON auth.users;
CREATE TRIGGER auto_confirm_email_on_signup
    BEFORE INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.auto_confirm_user_email();

-- 12. 啟用 Supabase Auth
-- 注意：這些設定需要在 Supabase Dashboard 中確認
-- 
-- 開發環境設置：
-- 確保在 Authentication > Settings 中：
-- - Confirm Email: DISABLED (開發環境推薦)
-- - Enable password recovery
-- - 設定適當的 Site URL: http://localhost:3000
-- - 設定適當的 Redirect URLs: http://localhost:3000/api/auth/callback/google
--
-- 生產環境設置：
-- - Confirm Email: ENABLED (生產環境必須)
-- - 移除 auto_confirm_user_email 觸發器
-- - 設定正確的生產環境 URL

-- 12. 建立視圖以簡化用戶資料查詢
CREATE OR REPLACE VIEW public.unified_user_view AS
SELECT 
    up.user_id,
    up.email,
    up.display_name,
    up.avatar_url,
    up.bio,
    up.auth_provider,
    up.created_at,
    au.email_confirmed_at,
    au.last_sign_in_at
FROM public.user_profiles up
LEFT JOIN auth.users au ON up.auth_user_id = au.id;

-- 給視圖設定 RLS
ALTER VIEW public.unified_user_view SET (security_barrier = true);

COMMENT ON TABLE public.user_profiles IS '統一用戶檔案表，支援 Google OAuth 和帳號密碼登入';
COMMENT ON COLUMN public.user_profiles.user_id IS '統一用戶識別符（Google: email, Password: 可自定義）';
COMMENT ON COLUMN public.user_profiles.auth_provider IS '認證提供者：google 或 password';
COMMENT ON COLUMN public.user_profiles.auth_user_id IS '關聯到 auth.users 的 ID（僅限密碼登入）';

-- 完成訊息
SELECT 'Auth system setup completed! Please configure Supabase Auth settings in Dashboard.' as message; 