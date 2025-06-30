import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { auth } from "@/auth";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 直接執行 SQL 命令來禁用 user_profiles 表格的 RLS
    const { error } = await supabase.rpc("exec_sql", { 
      sql: "ALTER TABLE user_profiles DISABLE ROW LEVEL SECURITY;" 
    });

    if (error) {
      console.error("禁用 user_profiles RLS 失敗:", error);
      return NextResponse.json({ 
        error: "Failed to disable RLS",
        details: error.message 
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: "user_profiles 表格的 RLS 已禁用"
    });

  } catch (error) {
    console.error("修正 user_profiles RLS 政策時發生錯誤:", error);
    return NextResponse.json({ 
      error: "Internal server error",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
} 