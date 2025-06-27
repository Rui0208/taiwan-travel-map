import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { auth } from "@/auth";
import { COUNTY_NAMES } from "@/api/types";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// GET /api/posts - 獲取帶有社交資料的文章列表
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    const isGuest = !session?.user?.id;

    const { searchParams } = new URL(request.url);
    const county = searchParams.get("county");
    const userId = searchParams.get("userId");

    // 建立基本查詢
    let query = supabase
      .from("visited_places")
      .select("*")
      .order("created_at", { ascending: false });

    // 如果指定了用戶 ID，則過濾特定用戶的貼文，否則獲取所有公開貼文 + 自己的私人貼文
    if (userId) {
      query = query.eq("user_id", userId);
    } else if (isGuest) {
      // 訪客模式：只顯示公開貼文
      query = query.eq("is_public", true);
    } else {
      // 已登入用戶：顯示所有公開貼文 + 自己的所有貼文（包括私人）
      query = query.or(`is_public.eq.true,user_id.eq.${session!.user!.id}`);
    }

    // 如果有指定縣市，則篩選（需要轉換為英文縣市名稱）
    if (county) {
      const englishCountyName = COUNTY_NAMES[county as keyof typeof COUNTY_NAMES];
      if (englishCountyName) {
        query = query.eq("county", englishCountyName);
      } else {
        // 如果傳入的已經是英文名稱，直接使用
        query = query.eq("county", county);
      }
    }

    const { data: posts, error } = await query;

    if (error) {
      console.error("獲取文章列表失敗:", error);
      return NextResponse.json({ error: "Failed to fetch posts" }, { status: 500 });
    }

    // 為每篇文章添加社交資料和用戶資訊
    const postsWithSocialData = await Promise.all(
      (posts || []).map(async (post) => {
        try {
          // 為每個貼文準備用戶資訊（整合個人資料）- 修復查詢邏輯不一致問題
          const getUserInfo = async (postUserId: string) => {
            // 統一查詢邏輯：先嘗試用 user_id 查詢，再嘗試用 email 查詢
            let userProfile = null;
            
            // 先嘗試用 user_id 查詢
            const { data: profileByUserId } = await supabase
              .from("user_profiles")
              .select("display_name, avatar_url")
              .eq("user_id", postUserId)
              .single();
            
            if (profileByUserId) {
              userProfile = profileByUserId;
            } else {
              // 再嘗試用 email 查詢
              const { data: profileByEmail } = await supabase
                .from("user_profiles")
                .select("display_name, avatar_url")
                .eq("email", postUserId)
                .single();
              userProfile = profileByEmail;
            }

            if (!isGuest && postUserId === session!.user!.id) {
              // 當前用戶的貼文
              return {
                id: postUserId,
                name: userProfile?.display_name || session!.user!.name || "匿名用戶",
                email: session!.user!.email || "",
                image: userProfile?.avatar_url || session!.user!.image,
              };
            } else {
              // 其他用戶的貼文
              const fallbackName = postUserId.split('@')[0] || "用戶";
              return {
                id: postUserId,
                name: userProfile?.display_name || fallbackName,
                email: postUserId,
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

        // 獲取留言列表（可選，用於展示）
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
          .order("created_at", { ascending: true })
          .limit(3); // 只取前 3 則留言

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

          return {
            ...post,
            likes_count: likesCount || 0,
            is_liked: !!userLike,
            comments_count: commentsCount || 0,
            comments: commentsWithLikes,
            user: userInfo,
          };
        } catch (socialError) {
          console.warn("獲取社交資料失敗，回退到基本資料:", socialError);
          // 如果社交功能資料表還不存在，回退到基本資料
          const fallbackUserInfo = (!isGuest && post.user_id === session?.user?.id)
            ? {
                id: session!.user!.id!,
                name: session!.user!.name || "匿名用戶",
                email: session!.user!.email || "",
                image: session!.user!.image || undefined,
              }
            : {
                id: post.user_id,
                name: post.user_id.split('@')[0] || "用戶",
                email: post.user_id,
                image: undefined,
              };
          
          return {
            ...post,
            likes_count: 0,
            is_liked: false,
            comments_count: 0,
            comments: [],
            user: fallbackUserInfo,
          };
        }
      })
    );

    return NextResponse.json({
      success: true,
      data: postsWithSocialData,
      count: postsWithSocialData.length
    });

  } catch (error) {
    console.error("API 錯誤:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
} 