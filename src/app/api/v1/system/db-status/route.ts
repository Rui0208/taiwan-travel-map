import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { auth } from "@/auth";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const status = {
      visited_places: false,
      likes: false,
      comments: false,
      image_urls_column: false,
    };

    // 檢查 visited_places 表格
    try {
      const { error: visitedError } = await supabase
        .from("visited_places")
        .select("id")
        .limit(1);
      status.visited_places = !visitedError;
    } catch {
      console.log("visited_places 表格不存在或無法訪問");
    }

    // 檢查 likes 表格
    try {
      const { error: likesError } = await supabase
        .from("likes")
        .select("id")
        .limit(1);
      status.likes = !likesError;
    } catch {
      console.log("likes 表格不存在");
    }

    // 檢查 comments 表格
    try {
      const { error: commentsError } = await supabase
        .from("comments")
        .select("id")
        .limit(1);
      status.comments = !commentsError;
    } catch {
      console.log("comments 表格不存在");
    }

    // 檢查 image_urls 欄位
    try {
      const { error: imageUrlsError } = await supabase
        .from("visited_places")
        .select("image_urls")
        .limit(1);
      status.image_urls_column = !imageUrlsError;
    } catch {
      console.log("image_urls 欄位不存在");
    }

    return NextResponse.json({
      success: true,
      status,
      needsSetup: !status.likes || !status.comments || !status.image_urls_column,
      message: status.likes && status.comments && status.image_urls_column 
        ? "資料庫設定完整" 
        : "需要執行社交功能設定"
    });

  } catch (error) {
    console.error("檢查資料庫狀態錯誤:", error);
    return NextResponse.json({ 
      error: "Internal server error",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
} 