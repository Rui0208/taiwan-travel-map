import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST() {
  try {
    // 檢查通知表格是否已存在
    const { error: checkError } = await supabaseAdmin
      .from("notifications")
      .select("id")
      .limit(1);

    if (!checkError) {
      return NextResponse.json({
        success: true,
        message: "通知系統已經設定完成",
        alreadyExists: true,
      });
    }

    // 如果表格不存在，我們需要手動創建（這通常需要在Supabase dashboard完成）
    return NextResponse.json({
      success: false,
      error: "通知表格尚未建立",
      message: "請聯繫管理員在資料庫中建立 notifications 表格",
      sqlNeeded: `
        CREATE TABLE notifications (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id TEXT NOT NULL,
          actor_id TEXT NOT NULL,
          type VARCHAR(50) NOT NULL,
          post_id UUID REFERENCES visited_places(id) ON DELETE CASCADE,
          comment_id UUID REFERENCES comments(id) ON DELETE CASCADE,
          content TEXT,
          is_read BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMPTZ DEFAULT NOW()
        );
        
        ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
        
        CREATE POLICY "Users can view own notifications" ON notifications
          FOR SELECT USING (user_id = auth.email());
          
        CREATE POLICY "System can insert notifications" ON notifications
          FOR INSERT WITH CHECK (true);
          
        CREATE POLICY "Users can update own notifications" ON notifications
          FOR UPDATE USING (user_id = auth.email());
      `
    }, { status: 500 });

  } catch (error) {
    console.error("通知系統設定錯誤:", error);
    return NextResponse.json({
      success: false,
      error: "Failed to setup notifications",
      details: error instanceof Error ? error.message : "Unknown error",
    }, { status: 500 });
  }
}

// GET 方法用於檢查狀態
export async function GET() {
  try {
    const { error } = await supabaseAdmin
      .from("notifications")
      .select("id")
      .limit(1);

    if (error) {
      return NextResponse.json({
        success: false,
        exists: false,
        error: error.message,
      });
    }

    return NextResponse.json({
      success: true,
      exists: true,
      message: "通知系統運作正常",
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      exists: false,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
} 