import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { supabase } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    const isGuest = !session?.user?.email;
    
    // 從 URL 參數獲取要查看的用戶 ID
    const { searchParams } = new URL(request.url);
    const targetUserId = searchParams.get("userId");
    
    if (isGuest && !targetUserId) {
      // 訪客試圖查看自己的檔案
      return NextResponse.json(
        { success: false, error: "需要登入才能查看個人檔案" },
        { status: 401 }
      );
    }
    
    if (!targetUserId && !session?.user?.email) {
      return NextResponse.json(
        { success: false, error: "無效的用戶ID" },
        { status: 400 }
      );
    }
    
    const finalTargetUserId = targetUserId || session!.user!.email!;
    const isOwnProfile = !isGuest && finalTargetUserId === session!.user!.email;

    // 獲取用戶的個人資料
    const { data: userProfile, error: profileError } = await supabase
      .from("user_profiles")
      .select("display_name, avatar_url, bio")
      .eq("user_id", finalTargetUserId)
      .single();

    if (profileError && profileError.code !== "PGRST116") {
      console.error("獲取用戶個人資料錯誤:", profileError);
    }

    // 獲取用戶的貼文 - 如果是本人則顯示所有，否則只顯示公開的
    let postsQuery = supabase
      .from("visited_places")
      .select("*")
      .eq("user_id", finalTargetUserId)
      .order("created_at", { ascending: false });

    // 如果不是本人，只顯示公開的貼文
    if (!isOwnProfile) {
      postsQuery = postsQuery.eq("is_public", true);
    }

    const { data: posts, error: postsError } = await postsQuery;

    if (postsError) {
      console.error("獲取貼文錯誤:", postsError);
      return NextResponse.json(
        { success: false, error: "獲取貼文失敗" },
        { status: 500 }
      );
    }

    // 計算統計數據
    const totalPosts = posts?.length || 0;
    const totalCounties = new Set(posts?.map(post => post.county) || []).size;

    // 獲取總按讚數（只計算文章按讚，不包括留言按讚）
    const { data: likesData } = await supabase
      .from("likes")
      .select("id")
      .in("post_id", posts?.map(p => p.id) || [])
      .is("comment_id", null);

    const totalLikes = likesData?.length || 0;

    // 獲取總留言數
    const { data: commentsData } = await supabase
      .from("comments")
      .select("id")
      .in("post_id", posts?.map(p => p.id) || []);

    const totalComments = commentsData?.length || 0;

    // 組織回應資料
    const profileData = {
      user: {
        id: finalTargetUserId,
        name: userProfile?.display_name || finalTargetUserId.split('@')[0] || "用戶",
        email: isOwnProfile ? finalTargetUserId : undefined, // 只有本人才能看到 email
        image: userProfile?.avatar_url || (isOwnProfile && session?.user?.image) || null,
        bio: userProfile?.bio || null,
      },
      stats: {
        totalPosts,
        totalCounties,
        totalLikes,
        totalComments
      },
      posts: posts || [],
      isOwnProfile
    };

    return NextResponse.json({
      success: true,
      data: profileData
    });

  } catch (error) {
    console.error("Profile API 錯誤:", error);
    return NextResponse.json(
      { success: false, error: "伺服器錯誤" },
      { status: 500 }
    );
  }
} 