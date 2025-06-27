import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { supabase } from "@/lib/supabase";

interface UserProfile {
  id: string;
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  created_at: string;
  updated_at: string;
}

// 獲取用戶個人資料
export async function GET() {
  try {
    const session = await auth();
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: "未登入" },
        { status: 401 }
      );
    }

    const userEmail = session.user.email;

    // 獲取用戶自定義個人資料
    const { data: profile, error } = await supabase
      .from("user_profiles")
      .select("*")
      .eq("user_id", userEmail)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
      console.error("獲取用戶個人資料錯誤:", error);
      return NextResponse.json(
        { success: false, error: "獲取用戶個人資料失敗" },
        { status: 500 }
      );
    }

    // 合併 NextAuth 資料和自定義資料
    const userProfile = {
      // NextAuth 原始資料
      email: session.user.email,
      originalName: session.user.name,
      originalImage: session.user.image,
      // 自定義資料
      displayName: profile?.display_name || null,
      avatarUrl: profile?.avatar_url || null,
      bio: profile?.bio || null,
      // 最終顯示資料
      finalName: profile?.display_name || session.user.name || session.user.email?.split('@')[0] || "用戶",
      finalImage: profile?.avatar_url || session.user.image || null,
    };

    return NextResponse.json({
      success: true,
      data: userProfile
    });

  } catch (error) {
    console.error("User Profile API 錯誤:", error);
    return NextResponse.json(
      { success: false, error: "伺服器錯誤" },
      { status: 500 }
    );
  }
}

// 更新用戶個人資料
export async function PUT(request: Request) {
  try {
    const session = await auth();
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: "未登入" },
        { status: 401 }
      );
    }

    const userEmail = session.user.email;
    const body = await request.json();
    
    const { displayName, avatarUrl, bio } = body;

    // 驗證資料
    if (displayName && typeof displayName !== 'string') {
      return NextResponse.json(
        { success: false, error: "顯示名稱格式錯誤" },
        { status: 400 }
      );
    }

    if (avatarUrl && typeof avatarUrl !== 'string') {
      return NextResponse.json(
        { success: false, error: "頭像 URL 格式錯誤" },
        { status: 400 }
      );
    }

    if (bio && typeof bio !== 'string') {
      return NextResponse.json(
        { success: false, error: "個人簡介格式錯誤" },
        { status: 400 }
      );
    }

    // 檢查是否已有個人資料記錄
    const { data: existingProfile } = await supabase
      .from("user_profiles")
      .select("id")
      .eq("user_id", userEmail)
      .single();

    let result;

    if (existingProfile) {
      // 更新現有記錄
      const updateData: Partial<UserProfile> = {};
      if (displayName !== undefined) updateData.display_name = displayName || null;
      if (avatarUrl !== undefined) updateData.avatar_url = avatarUrl || null;
      if (bio !== undefined) updateData.bio = bio || null;

      const { data, error } = await supabase
        .from("user_profiles")
        .update(updateData)
        .eq("user_id", userEmail)
        .select()
        .single();

      if (error) {
        console.error("更新用戶個人資料錯誤:", error);
        return NextResponse.json(
          { success: false, error: "更新用戶個人資料失敗" },
          { status: 500 }
        );
      }

      result = data;
    } else {
      // 創建新記錄
      const { data, error } = await supabase
        .from("user_profiles")
        .insert({
          user_id: userEmail,
          display_name: displayName || null,
          avatar_url: avatarUrl || null,
          bio: bio || null,
        })
        .select()
        .single();

      if (error) {
        console.error("創建用戶個人資料錯誤:", error);
        return NextResponse.json(
          { success: false, error: "創建用戶個人資料失敗" },
          { status: 500 }
        );
      }

      result = data;
    }

    return NextResponse.json({
      success: true,
      data: result,
      message: "個人資料更新成功"
    });

  } catch (error) {
    console.error("更新用戶個人資料錯誤:", error);
    return NextResponse.json(
      { success: false, error: "伺服器錯誤" },
      { status: 500 }
    );
  }
} 