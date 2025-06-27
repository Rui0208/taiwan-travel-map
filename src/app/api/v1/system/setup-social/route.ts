import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { auth } from "@/auth";
import fs from "fs";
import path from "path";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // 需要 service role key 來執行 DDL
);

export async function POST() {
  const session = await auth();

  // 只允許管理員執行此操作
  if (!session?.user?.email || !session.user.email.includes('admin')) {
    return NextResponse.json({ error: "未授權" }, { status: 401 });
  }

  try {
    // 讀取 SQL 腳本
    const sqlPath = path.join(process.cwd(), 'scripts', 'setup-social-features.sql');
    const sqlScript = fs.readFileSync(sqlPath, 'utf8');

    // 執行 SQL 腳本
    const { error } = await supabase.rpc('execute_sql', { sql_script: sqlScript });

    if (error) {
      console.error("執行 SQL 腳本錯誤:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ 
      message: "社交功能資料庫設定完成",
      data: { success: true }
    });
  } catch (err) {
    console.error("設定社交功能錯誤:", err);
    return NextResponse.json({ 
      error: err instanceof Error ? err.message : "設定失敗" 
    }, { status: 500 });
  }
} 