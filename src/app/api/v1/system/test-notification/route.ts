import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { auth } from "@/auth";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "未授權" }, { status: 401 });
    }

    const { targetUserId, content } = await request.json();

    // 建立測試通知
    const { data: notification, error } = await supabase
      .from("notifications")
      .insert({
        user_id: targetUserId || session.user.id,
        actor_id: session.user.id,
        type: "like_post",
        content: content || "這是一個測試通知",
        is_read: false,
      })
      .select()
      .single();

    if (error) {
      console.error("建立測試通知失敗:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: notification,
      message: "測試通知建立成功"
    });

  } catch (error) {
    console.error("測試通知 API 錯誤:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "未授權" }, { status: 401 });
    }

    // 獲取當前用戶的通知
    const { data: notifications, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", session.user.id)
      .order("created_at", { ascending: false })
      .limit(10);

    if (error) {
      console.error("獲取通知失敗:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: notifications,
      count: notifications?.length || 0
    });

  } catch (error) {
    console.error("獲取通知 API 錯誤:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
} 