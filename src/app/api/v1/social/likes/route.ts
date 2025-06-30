import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { auth } from "@/auth";
import { createNotification } from "@/lib/notification-utils";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// GET /api/likes?post_id=xxx - 獲取文章按讚列表
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

    // 獲取文章的按讚列表（user_id 是 email）
    const { data: likes, error } = await supabase
      .from("likes")
      .select(`
        id,
        user_id,
        created_at
      `)
      .eq("post_id", postId)
      .is("comment_id", null);

    if (error) {
      console.error("獲取按讚列表失敗:", error);
      return NextResponse.json({ error: "Failed to fetch likes" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: likes || [],
      count: likes?.length || 0
    });

  } catch (error) {
    console.error("API 錯誤:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/likes - 新增按讚
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { post_id, comment_id } = body;

    if (!post_id && !comment_id) {
      return NextResponse.json({ 
        error: "Either post_id or comment_id is required" 
      }, { status: 400 });
    }

    // 檢查是否已經按讚
    const { data: existingLike } = await supabase
      .from("likes")
      .select("id")
      .eq("user_id", session.user.id)
      .eq(post_id ? "post_id" : "comment_id", post_id || comment_id)
      .single();

    if (existingLike) {
      return NextResponse.json({ 
        error: "Already liked" 
      }, { status: 409 });
    }

    // 新增按讚
    const { data: newLike, error } = await supabase
      .from("likes")
      .insert({
        user_id: session.user.id,
        post_id: post_id || null,
        comment_id: comment_id || null,
      })
      .select()
      .single();

    if (error) {
      console.error("新增按讚失敗:", error);
      return NextResponse.json({ error: "Failed to add like" }, { status: 500 });
    }

    // 手動建立通知（支援 i18n）
    try {
      let authorId = null;
      let notificationType: 'like_post' | 'like_comment' = 'like_post';

      if (post_id) {
        // 獲取文章作者
        const { data: post } = await supabase
          .from("visited_places")
          .select("user_id")
          .eq("id", post_id)
          .single();
        
        if (post) {
          authorId = post.user_id;
          notificationType = "like_post";
        }
      } else if (comment_id) {
        // 獲取留言作者
        const { data: comment } = await supabase
          .from("comments")
          .select("user_id")
          .eq("id", comment_id)
          .single();
        
        if (comment) {
          authorId = comment.user_id;
          notificationType = "like_comment";
        }
      }

      // 如果找到作者，建立通知
      if (authorId) {
        await createNotification(
          authorId,
          session.user.id,
          notificationType,
          post_id || undefined,
          comment_id || undefined
        );
      }
    } catch (notificationError) {
      console.error("通知建立過程錯誤:", notificationError);
    }

    return NextResponse.json({
      success: true,
      data: newLike
    });

  } catch (error) {
    console.error("API 錯誤:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/likes - 取消按讚
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const postId = searchParams.get("post_id");
    const commentId = searchParams.get("comment_id");

    if (!postId && !commentId) {
      return NextResponse.json({ 
        error: "Either post_id or comment_id is required" 
      }, { status: 400 });
    }

    // 刪除按讚
    const { error } = await supabase
      .from("likes")
      .delete()
      .eq("user_id", session.user.id)
      .eq(postId ? "post_id" : "comment_id", postId || commentId);

    if (error) {
      console.error("取消按讚失敗:", error);
      return NextResponse.json({ error: "Failed to remove like" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: "Like removed successfully"
    });

  } catch (error) {
    console.error("API 錯誤:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
} 