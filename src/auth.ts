import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { supabase } from "@/lib/supabase-auth";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    Credentials({
      id: "supabase",
      name: "Supabase",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          // 嘗試使用 Supabase 登入
          const { data, error } = await supabase.auth.signInWithPassword({
            email: credentials.email as string,
            password: credentials.password as string,
          });

          if (error) {
            console.error("Supabase auth error:", error);
            
            // 處理特定的錯誤類型
            if (error.message.includes('Email not confirmed')) {
              throw new Error('請先確認您的電子郵件地址。請檢查您的收件箱並點擊確認連結。');
            }
            
            if (error.message.includes('Invalid login credentials')) {
              throw new Error('電子郵件或密碼不正確。');
            }
            
            throw new Error(error.message || '登入失敗');
          }

          if (!data.user) {
            console.error("No user data returned");
            return null;
          }

          // 獲取用戶檔案
          const { data: profile } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('auth_user_id', data.user.id)
            .single();

          return {
            id: profile?.user_id || data.user.email || data.user.id,
            email: data.user.email,
            name: profile?.display_name || data.user.email?.split('@')[0],
            image: profile?.avatar_url,
            provider: "supabase",
          };
        } catch (error) {
          console.error("Auth error:", error);
          throw error; // 拋出原始錯誤以保持錯誤訊息
        }
      }
    })
  ],
  pages: {
    signIn: "/pages/home",
  },
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google") {
        // Google OAuth 登入處理
        try {
          // 同步 Google 用戶資料到 user_profiles 表
          const { error } = await supabase.rpc('sync_google_user_profile', {
            p_user_id: user.email!,
            p_email: user.email!,
            p_name: user.name || '',
            p_image: user.image || '',
          });

          if (error) {
            console.error("Failed to sync Google user profile:", error);
          }
        } catch (error) {
          console.error("Error syncing Google profile:", error);
        }
      }
      return true;
    },
    async session({ session, token }) {
      if (session.user) {
        // 設定統一的用戶 ID
        session.user.id = (token.sub as string) || session.user.email || "";
        
        // 從 token 中獲取認證提供者資訊
        (session.user as { provider?: string }).provider = (token.provider as string) || "google";
      }
      return session;
    },
    async jwt({ token, user, account }) {
      // 在首次登入時儲存用戶資訊
      if (user) {
        token.provider = account?.provider || "google";
        // 確保所有登入方式都設定 token.sub
        if (account?.provider === "supabase") {
          token.sub = user.id;
        } else if (account?.provider === "google") {
          // Google OAuth 使用 email 作為統一 ID
          token.sub = user.email || user.id || "";
        }
      }
      return token;
    },
    async redirect({ url, baseUrl }) {
      // 確保登入後跳轉到正確的頁面
      if (url.startsWith(baseUrl)) {
        return url;
      }
      // 預設跳轉到首頁
      return baseUrl + "/pages/home";
    },
  },
  session: {
    strategy: "jwt"
  },
  debug: process.env.NODE_ENV === "development",
  trustHost: true,
});
