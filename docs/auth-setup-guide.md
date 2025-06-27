# 認證系統設置指南

## 🔐 雙重認證系統概述

我們的應用支援兩種登入方式：
1. **Google OAuth** - 一鍵登入
2. **帳號密碼** - 傳統電子郵件/密碼註冊和登入

## 📧 解決「Email not confirmed」錯誤

### 問題描述

當你嘗試用帳號密碼登入時，可能會遇到以下錯誤：
```
Error [AuthApiError]: Email not confirmed
```

這是因為 Supabase 預設要求新註冊的用戶在登入前先確認電子郵件地址。

### 🛠️ 解決方案

#### 方案一：關閉電子郵件確認（推薦用於開發環境）

1. **前往 Supabase Dashboard**
   - 登入您的 Supabase 專案
   - 選擇正確的專案

2. **前往認證設定**
   - 點擊左側選單的 `Authentication`
   - 選擇 `Settings`

3. **關閉電子郵件確認**
   - 找到 `Email` 部分
   - 將 `Confirm Email` 設為 **`DISABLED`**
   - 點擊 `Save` 儲存變更

4. **設定其他必要選項**
   - `Site URL`: `http://localhost:3000` (開發環境)
   - `Redirect URLs`: `http://localhost:3000/api/auth/callback/google`

#### 方案二：使用自動確認觸發器（進階）

如果你想保持電子郵件確認功能但在開發環境中自動確認，可以執行以下 SQL：

```sql
-- 在 Supabase SQL Editor 中執行
CREATE OR REPLACE FUNCTION public.auto_confirm_user_email()
RETURNS TRIGGER AS $$
BEGIN
    -- 自動確認電子郵件（僅限開發環境）
    IF NEW.email_confirmed_at IS NULL THEN
        NEW.email_confirmed_at = NOW();
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 創建觸發器
DROP TRIGGER IF EXISTS auto_confirm_email_on_signup ON auth.users;
CREATE TRIGGER auto_confirm_email_on_signup
    BEFORE INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.auto_confirm_user_email();
```

⚠️ **注意**: 這個觸發器僅適用於開發環境，生產環境請移除！

## 🚀 完整設置步驟

### 1. 資料庫設置

執行 `scripts/setup-auth-users.sql` 中的完整腳本：

```bash
# 複製腳本內容到 Supabase SQL Editor 執行
cat scripts/setup-auth-users.sql
```

### 2. Supabase Dashboard 設定

#### 開發環境設定：
- **Confirm Email**: `DISABLED`
- **Site URL**: `http://localhost:3000`
- **Redirect URLs**: `http://localhost:3000/api/auth/callback/google`

#### 生產環境設定：
- **Confirm Email**: `ENABLED`
- **Site URL**: `https://yourdomain.com`
- **Redirect URLs**: `https://yourdomain.com/api/auth/callback/google`

### 3. 環境變數設定

確保 `.env.local` 包含以下變數：

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# NextAuth
NEXTAUTH_SECRET=your_nextauth_secret
NEXTAUTH_URL=http://localhost:3000

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

### 4. Google OAuth 設定

1. **前往 Google Cloud Console**
2. **建立專案或選擇現有專案**
3. **啟用 Google+ API**
4. **建立 OAuth 2.0 認證**
5. **設定重新導向 URI**:
   - 開發環境: `http://localhost:3000/api/auth/callback/google`
   - 生產環境: `https://yourdomain.com/api/auth/callback/google`

## 🧪 測試認證功能

### 測試 Google OAuth
1. 點擊「使用 Google 登入」
2. 完成 Google 認證流程
3. 確認用戶資料正確同步

### 測試帳號密碼註冊
1. 點擊「建立新帳號」
2. 輸入電子郵件和密碼
3. 如果開啟了電子郵件確認，檢查確認郵件
4. 完成註冊流程

### 測試帳號密碼登入
1. 使用已註冊的帳號登入
2. 確認登入成功
3. 驗證用戶資料正確載入

## 🐛 常見問題排除

### 問題：「Email not confirmed」
**解決方案**: 按照上述方案一或方案二處理

### 問題：「Invalid login credentials」
**可能原因**:
- 密碼錯誤
- 電子郵件地址不存在
- 帳號被停用

**解決方案**: 檢查輸入資料，或重新註冊

### 問題：Google OAuth 重新導向失敗
**解決方案**:
1. 檢查 Google Cloud Console 中的重新導向 URI 設定
2. 確認環境變數正確
3. 檢查 Supabase 中的 Site URL 設定

### 問題：用戶資料不同步
**解決方案**:
1. 檢查 `sync_google_user_profile` 函數是否正確執行
2. 確認 `user_profiles` 表格的 RLS 政策
3. 檢查資料庫觸發器是否正常運作

## 🔒 安全考量

### 開發環境
- 可以關閉電子郵件確認以加快開發速度
- 使用 localhost URL
- 確保開發環境與生產環境隔離

### 生產環境
- 必須啟用電子郵件確認
- 使用 HTTPS
- 設定正確的重新導向 URI
- 移除開發環境專用的自動確認觸發器

## 📚 進階配置

### 自訂電子郵件樣板
在 Supabase Dashboard 的 Authentication > Email Templates 中自訂：
- 註冊確認郵件
- 密碼重設郵件
- 魔術連結郵件

### 多因素驗證 (MFA)
可在 Supabase 中啟用 TOTP 或 SMS 多因素驗證

### 社交登入擴展
除了 Google，還可以新增：
- GitHub
- Facebook
- Discord
- 等其他 OAuth 提供者

---

如有其他問題，請參考 [Supabase 官方文檔](https://supabase.com/docs/guides/auth) 或提交 issue。 