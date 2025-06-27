import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { auth } from "@/auth";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(req: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "未授權" }, { status: 401 });
  }

  const { county, note, ig_url, image_url, image_urls, is_public } = await req.json();

  const { data, error } = await supabase
    .from("visited_places")
    .insert([
      {
        user_id: session.user.id,
        county,
        note,
        ig_url: ig_url || null,
        image_url,
        image_urls: image_urls || [],
        is_public: is_public ?? true,
      },
    ])
    .select();

  if (error) {
    console.error("Supabase 錯誤:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "未授權" }, { status: 401 });
    }

    const currentUser = session.user;

    // 統一用戶 ID 查詢邏輯：先嘗試用 session.user.id，再嘗試用 email
    let userVisits = null;
    let userError = null;

    // 首先嘗試用 session.user.id 查詢
    const { data: visitsById, error: errorById } = await supabase
      .from("visited_places")
      .select("*")
      .eq("user_id", currentUser.id)
      .order("created_at", { ascending: false });

    if (visitsById && visitsById.length > 0) {
      userVisits = visitsById;
    } else if (currentUser.email && currentUser.email !== currentUser.id) {
      // 如果沒有找到，且 email 與 id 不同，嘗試用 email 查詢
      const { data: visitsByEmail, error: errorByEmail } = await supabase
        .from("visited_places")
        .select("*")
        .eq("user_id", currentUser.email)
        .order("created_at", { ascending: false });

      if (visitsByEmail && visitsByEmail.length > 0) {
        userVisits = visitsByEmail;
      } else {
        userError = errorByEmail;
      }
    } else {
      userError = errorById;
    }

    if (userError) {
      console.error("獲取造訪記錄失敗:", userError);
      return NextResponse.json({ error: userError.message }, { status: 500 });
    }

    // 為每個造訪記錄添加社交資料和用戶資訊，使其與 posts API 格式一致
    const visitsWithSocialData = await Promise.all(
      (userVisits || []).map(async (visit) => {
        try {
          // 獲取用戶的個人資料（包含 display_name）
          const { data: userProfile } = await supabase
            .from("user_profiles")
            .select("display_name, avatar_url")
            .eq("user_id", currentUser.id)
            .single();

          // 準備用戶資訊，優先使用 display_name
          const userInfo = {
            id: currentUser.id,
            name: userProfile?.display_name || currentUser.name || currentUser.email?.split('@')[0] || "匿名用戶",
            email: currentUser.email || "",
            image: userProfile?.avatar_url || currentUser.image,
          };

          // 獲取按讚數量（如果這個造訪記錄有對應的 post）
          const { count: likesCount } = await supabase
            .from("likes")
            .select("*", { count: "exact" })
            .eq("post_id", visit.id)
            .is("comment_id", null);

          // 檢查當前用戶是否已按讚
          const { data: userLike } = await supabase
            .from("likes")
            .select("id")
            .eq("post_id", visit.id)
            .eq("user_id", currentUser.id)
            .is("comment_id", null)
            .single();

          // 獲取留言數量
          const { count: commentsCount } = await supabase
            .from("comments")
            .select("*", { count: "exact" })
            .eq("post_id", visit.id);

          // 獲取留言列表（限制數量）
          const { data: comments } = await supabase
            .from("comments")
            .select(`
              id,
              content,
              created_at,
              updated_at,
              user_id
            `)
            .eq("post_id", visit.id)
            .order("created_at", { ascending: true })
            .limit(3);

          // 為留言添加按讚資訊和用戶資訊
          const commentsWithLikes = await Promise.all(
            (comments || []).map(async (comment) => {
              const { count: commentLikesCount } = await supabase
                .from("likes")
                .select("*", { count: "exact" })
                .eq("comment_id", comment.id);

              const { data: commentUserLike } = await supabase
                .from("likes")
                .select("id")
                .eq("comment_id", comment.id)
                .eq("user_id", currentUser.id)
                .single();

              // 獲取留言者的資訊
              const commentUserInfo = comment.user_id === currentUser.id
                ? userInfo
                : (async () => {
                    // 獲取留言者的個人資料
                    const { data: commentUserProfile } = await supabase
                      .from("user_profiles")
                      .select("display_name, avatar_url")
                      .eq("user_id", comment.user_id)
                      .single();

                    return {
                      id: comment.user_id,
                      name: commentUserProfile?.display_name || comment.user_id.split('@')[0] || "用戶",
                      email: comment.user_id,
                      image: commentUserProfile?.avatar_url || undefined,
                    };
                  })();

              return {
                ...comment,
                likes_count: commentLikesCount || 0,
                is_liked: !!commentUserLike,
                user: await commentUserInfo,
              };
            })
          );

          return {
            ...visit,
            likes_count: likesCount || 0,
            is_liked: !!userLike,
            comments_count: commentsCount || 0,
            comments: commentsWithLikes,
            user: userInfo,
          };
        } catch (socialError) {
          console.warn("獲取社交資料失敗，回退到基本資料:", socialError);
          // 如果社交功能資料表還不存在，回退到基本資料
          return {
            ...visit,
            likes_count: 0,
            is_liked: false,
            comments_count: 0,
            comments: [],
            user: {
              id: currentUser.id,
              name: currentUser.name || "匿名用戶",
              email: currentUser.email || "",
              image: currentUser.image,
            },
          };
        }
      })
    );

    return NextResponse.json({ 
      success: true,
      data: visitsWithSocialData,
      count: visitsWithSocialData.length
    });

  } catch (error) {
    console.error("API 錯誤:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
