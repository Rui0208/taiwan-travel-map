import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import fs from 'fs';
import path from 'path';

export async function POST() {
  try {
    console.log("開始設定用戶個人資料系統...");

    // 讀取 SQL 腳本
    const sqlPath = path.join(process.cwd(), 'scripts', 'setup-user-profiles.sql');
    const sqlScript = fs.readFileSync(sqlPath, 'utf8');

    // 執行 SQL 腳本
    const { error } = await supabase.rpc('exec_sql', { sql: sqlScript });

    if (error) {
      console.error("執行 SQL 腳本錯誤:", error);
      return NextResponse.json(
        { success: false, error: "設定用戶個人資料系統失敗", details: error },
        { status: 500 }
      );
    }

    console.log("用戶個人資料系統設定完成");

    return NextResponse.json({
      success: true,
      message: "用戶個人資料系統設定完成",
    });

  } catch (error) {
    console.error("設定用戶個人資料系統錯誤:", error);
    return NextResponse.json(
      { success: false, error: "伺服器錯誤" },
      { status: 500 }
    );
  }
} 