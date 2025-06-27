import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { auth } from "@/auth";
import { createNotification } from "@/lib/notification-utils";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// GET /api/comments?post_id=xxx - 獲取文章留言列表
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const postId = searchParams.get("post_id");

    if (!postId) {
      return NextResponse.json({ error: "Post ID is required" }, { status: 400 });
    }

    // 獲取文章的留言列表（包含按讚數量和當前用戶是否已按讚）
    const { data: comments, error } = await supabase
      .from("comments")
      .select(`
        id,
        content,
        created_at,
        updated_at,
        user_id
      `)
      .eq("post_id", postId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("獲取留言列表失敗:", error);
      return NextResponse.json({ error: "Failed to fetch comments" }, { status: 500 });
    }

    // 為每個留言獲取按讚數量和當前用戶是否已按讚
    const commentsWithLikes = await Promise.all(
      (comments || []).map(async (comment) => {
        // 獲取按讚數量
        const { count: likesCount } = await supabase
          .from("likes")
          .select("*", { count: "exact" })
          .eq("comment_id", comment.id);

                 // 檢查當前用戶是否已按讚
         const { data: userLike } = await supabase
           .from("likes")
           .select("id")
           .eq("comment_id", comment.id)
           .eq("user_id", session.user!.id)
           .single();

        return {
          ...comment,
          likes_count: likesCount || 0,
          is_liked: !!userLike,
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: commentsWithLikes,
      count: commentsWithLikes.length
    });

  } catch (error) {
    console.error("API 錯誤:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/comments - 新增留言
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { post_id, content } = body;

    if (!post_id || !content?.trim()) {
      return NextResponse.json({ 
        error: "Post ID and content are required" 
      }, { status: 400 });
    }

    // 檢查文章是否存在並獲取作者資訊
    const { data: post, error: postError } = await supabase
      .from("visited_places")
      .select("id, user_id")
      .eq("id", post_id)
      .single();

    if (postError || !post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    // 新增留言
    const { data: newComment, error } = await supabase
      .from("comments")
      .insert({
        user_id: session.user.id,
        post_id: post_id,
        content: content.trim(),
      })
      .select(`
        id,
        content,
        created_at,
        updated_at,
        user_id
      `)
      .single();

    if (error) {
      console.error("新增留言失敗:", error);
      return NextResponse.json({ error: "Failed to add comment" }, { status: 500 });
    }

    // 手動建立通知（支援 i18n）
    try {
      if (post.user_id) {
        await createNotification(
          post.user_id,
          session.user.id,
          'comment_post',
          post_id,
          newComment.id,
          'zh-Hant' // 預設使用繁體中文
        );
      }
    } catch (notificationError) {
      console.error("留言通知建立過程錯誤:", notificationError);
    }

    // 添加按讚資訊
    const commentWithLikes = {
      ...newComment,
      likes_count: 0,
      is_liked: false,
    };

    return NextResponse.json({
      success: true,
      data: commentWithLikes
    });

  } catch (error) {
    console.error("API 錯誤:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
} 