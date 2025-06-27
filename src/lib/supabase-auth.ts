import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// 定義類型
interface UserData {
  display_name?: string;
  [key: string]: unknown;
}

interface ProfileData {
  user_id: string;
  auth_user_id: string;
  email: string;
  display_name?: string;
  avatar_url?: string;
  bio?: string;
  auth_provider?: string;
  [key: string]: unknown;
}

interface ProfileUpdates {
  display_name?: string;
  avatar_url?: string;
  bio?: string;
  [key: string]: unknown;
}

// 客戶端 Supabase 客戶端
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
  },
})

// 服務端 Supabase 客戶端（用於 API routes）
export function createServerSupabaseClient(request: NextRequest, response: NextResponse) {
  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
        response = NextResponse.next({
          request: {
            headers: request.headers,
          },
        })
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        )
      },
    },
  })
}

// 用戶認證相關函數
export const auth = {
  // 註冊新用戶
  async signUp(email: string, password: string, userData?: UserData) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: userData,
      },
    })
    return { data, error }
  },

  // 登入
  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    return { data, error }
  },

  // 登出
  async signOut() {
    const { error } = await supabase.auth.signOut()
    return { error }
  },

  // 重設密碼
  async resetPassword(email: string) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    return { error }
  },

  // 重新發送確認郵件
  async resendConfirmation(email: string) {
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: email,
    })
    return { error }
  },

  // 更新密碼
  async updatePassword(newPassword: string) {
    const { error } = await supabase.auth.updateUser({
      password: newPassword
    })
    return { error }
  },

  // 獲取當前用戶
  async getCurrentUser() {
    const { data: { user }, error } = await supabase.auth.getUser()
    return { user, error }
  },

  // 獲取當前 session
  async getSession() {
    const { data: { session }, error } = await supabase.auth.getSession()
    return { session, error }
  },

  // 監聽認證狀態變化
  onAuthStateChange(callback: (event: string, session: unknown) => void) {
    return supabase.auth.onAuthStateChange(callback)
  },
}

// 用戶檔案相關函數
export const userProfile = {
  // 獲取用戶檔案
  async getUserProfile(userId: string) {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', userId)
      .single()
    
    return { data, error }
  },

  // 更新用戶檔案
  async updateUserProfile(userId: string, updates: ProfileUpdates) {
    const { data, error } = await supabase
      .from('user_profiles')
      .update(updates)
      .eq('user_id', userId)
      .select()
      .single()
    
    return { data, error }
  },

  // 創建用戶檔案（主要用於 Google 登入用戶）
  async createUserProfile(profileData: ProfileData) {
    const { data, error } = await supabase
      .from('user_profiles')
      .insert(profileData)
      .select()
      .single()
    
    return { data, error }
  },

  // 同步 Google 用戶檔案
  async syncGoogleUserProfile(userId: string, email: string, name: string, image: string) {
    const { error } = await supabase.rpc('sync_google_user_profile', {
      p_user_id: userId,
      p_email: email,
      p_name: name,
      p_image: image,
    })
    
    return { error }
  },
} 