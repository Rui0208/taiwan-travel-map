import { auth } from "@/auth";
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    const { id } = await params;

    if (!session?.user?.id) {
      return new NextResponse("未授權", { status: 401 });
    }

    const { content } = await request.json();

    if (!content || !content.trim()) {
      return new NextResponse("留言內容不能為空", { status: 400 });
    }

    // 檢查是否為留言作者
    const { data: comment, error: commentError } = await supabase
      .from("comments")
      .select("user_id")
      .eq("id", id)
      .single();

    if (commentError) {
      return new NextResponse("留言不存在", { status: 404 });
    }

    if (comment.user_id !== session.user.id) {
      return new NextResponse("無權限編輯此留言", { status: 403 });
    }

    // 更新留言
    const { data, error } = await supabase
      .from("comments")
      .update({
        content: content.trim(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("更新留言失敗:", error);
      return new NextResponse("更新失敗", { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("更新留言時發生錯誤:", error);
    return new NextResponse("更新失敗", { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    const { id } = await params;

    if (!session?.user?.id) {
      return new NextResponse("未授權", { status: 401 });
    }

    // 獲取留言資訊
    const { data: comment, error: commentError } = await supabase
      .from("comments")
      .select("user_id, post_id")
      .eq("id", id)
      .single();

    if (commentError) {
      return new NextResponse("留言不存在", { status: 404 });
    }

    // 獲取對應的文章資訊
    const { data: post, error: postError } = await supabase
      .from("visited_places")
      .select("user_id")
      .eq("id", comment.post_id)
      .single();

    if (postError) {
      return new NextResponse("文章不存在", { status: 404 });
    }

    // 檢查權限：留言作者或文章作者可以刪除
    const isCommentAuthor = comment.user_id === session.user.id;
    const isPostAuthor = post.user_id === session.user.id;

    if (!isCommentAuthor && !isPostAuthor) {
      return new NextResponse("無權限刪除此留言", { status: 403 });
    }

    // 刪除留言（會自動刪除相關的按讚記錄）
    const { error } = await supabase
      .from("comments")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("刪除留言失敗:", error);
      return new NextResponse("刪除失敗", { status: 500 });
    }

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("刪除留言時發生錯誤:", error);
    return new NextResponse("刪除失敗", { status: 500 });
  }
} 