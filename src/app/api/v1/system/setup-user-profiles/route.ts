import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST() {
  try {
    console.log("開始設定用戶個人資料系統...");

    // 直接執行 SQL 命令
    const sqlCommands = [
      `CREATE TABLE IF NOT EXISTS user_profiles (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        user_id TEXT NOT NULL UNIQUE,
        display_name TEXT,
        avatar_url TEXT,
        bio TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );`,
      `CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);`,
      `ALTER TABLE user_profiles DISABLE ROW LEVEL SECURITY;`,
      `CREATE OR REPLACE FUNCTION update_updated_at_column()
        RETURNS TRIGGER AS $$
        BEGIN
            NEW.updated_at = NOW();
            RETURN NEW;
        END;
        $$ language 'plpgsql';`,
      `DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles;`,
      `CREATE TRIGGER update_user_profiles_updated_at 
          BEFORE UPDATE ON user_profiles 
          FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();`
    ];

    // 逐個執行 SQL 命令
    for (const sql of sqlCommands) {
      const { error } = await supabase.rpc('exec_sql', { sql });
      if (error) {
        console.error("執行 SQL 命令失敗:", error);
        return NextResponse.json(
          { success: false, error: "設定用戶個人資料系統失敗", details: error },
          { status: 500 }
        );
      }
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