import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { auth } from "@/auth";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// GET /api/v1/content/posts/[id] - 獲取單篇文章詳細資訊
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    const isGuest = !session?.user?.id;
    const { id } = await params;

    // 獲取文章基本資訊
    const { data: post, error: postError } = await supabase
      .from("visited_places")
      .select("*")
      .eq("id", id)
      .single();

    if (postError || !post) {
      return NextResponse.json({ error: "文章不存在" }, { status: 404 });
    }

    // 檢查訪問權限：公開文章或自己的文章
    if (!post.is_public && (isGuest || post.user_id !== session?.user?.id)) {
      return NextResponse.json({ error: "無權限查看此文章" }, { status: 403 });
    }

    // 獲取用戶資訊的統一函數
    const getUserInfo = async (userId: string) => {
      // 統一查詢邏輯：先嘗試用 user_id 查詢，再嘗試用 email 查詢
      let userProfile = null;
      
      // 先嘗試用 user_id 查詢
      const { data: profileByUserId } = await supabase
        .from("user_profiles")
        .select("display_name, avatar_url")
        .eq("user_id", userId)
        .single();
      
      if (profileByUserId) {
        userProfile = profileByUserId;
      } else {
        // 再嘗試用 email 查詢
        const { data: profileByEmail } = await supabase
          .from("user_profiles")
          .select("display_name, avatar_url")
          .eq("email", userId)
          .single();
        userProfile = profileByEmail;
      }

      if (!isGuest && userId === session!.user!.id) {
        // 當前用戶的文章
        return {
          id: userId,
          name: userProfile?.display_name || session!.user!.name || "匿名用戶",
          email: session!.user!.email || "",
          image: userProfile?.avatar_url || session!.user!.image,
        };
      } else {
        // 其他用戶的文章
        const fallbackName = userId.split('@')[0] || "用戶";
        return {
          id: userId,
          name: userProfile?.display_name || fallbackName,
          email: userId,
          image: userProfile?.avatar_url,
        };
      }
    };

    const userInfo = await getUserInfo(post.user_id);

    // 獲取按讚數量
    const { count: likesCount } = await supabase
      .from("likes")
      .select("*", { count: "exact" })
      .eq("post_id", post.id)
      .is("comment_id", null);

    // 檢查當前用戶是否已按讚
    let userLike = null;
    if (!isGuest) {
      const { data } = await supabase
        .from("likes")
        .select("id")
        .eq("post_id", post.id)
        .eq("user_id", session!.user!.id)
        .is("comment_id", null)
        .single();
      userLike = data;
    }

    // 獲取留言數量
    const { count: commentsCount } = await supabase
      .from("comments")
      .select("*", { count: "exact" })
      .eq("post_id", post.id);

    // 獲取留言列表
    const { data: comments } = await supabase
      .from("comments")
      .select(`
        id,
        content,
        created_at,
        updated_at,
        user_id
      `)
      .eq("post_id", post.id)
      .order("created_at", { ascending: true });

    // 為留言添加按讚資訊和用戶資訊
    const commentsWithLikes = await Promise.all(
      (comments || []).map(async (comment) => {
        const { count: commentLikesCount } = await supabase
          .from("likes")
          .select("*", { count: "exact" })
          .eq("comment_id", comment.id);

        let commentUserLike = null;
        if (!isGuest) {
          const { data } = await supabase
            .from("likes")
            .select("id")
            .eq("comment_id", comment.id)
            .eq("user_id", session!.user!.id)
            .single();
          commentUserLike = data;
        }

        // 獲取留言者的個人資料
        const commentUserInfo = await getUserInfo(comment.user_id);

        return {
          ...comment,
          likes_count: commentLikesCount || 0,
          is_liked: !!commentUserLike,
          user: commentUserInfo,
        };
      })
    );

    // 組合完整的文章資料
    const postWithSocialData = {
      ...post,
      likes_count: likesCount || 0,
      is_liked: !!userLike,
      comments_count: commentsCount || 0,
      comments: commentsWithLikes,
      user: userInfo,
    };

    return NextResponse.json({
      success: true,
      data: postWithSocialData
    });

  } catch (error) {
    console.error("獲取文章詳情 API 錯誤:", error);
    return NextResponse.json({ error: "伺服器錯誤" }, { status: 500 });
  }
} 