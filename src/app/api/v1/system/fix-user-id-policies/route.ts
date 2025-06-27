import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST() {
  try {
    console.log("開始執行完整的 user_id 欄位和 RLS 政策修正...");

    // 讀取 SQL 腳本
    const sqlPath = path.join(process.cwd(), 'scripts', 'fix-user-id-with-policies.sql');
    const sqlScript = fs.readFileSync(sqlPath, 'utf8');

    console.log("SQL 腳本內容:", sqlScript.substring(0, 200) + "...");

    // 將 SQL 腳本分解為單獨的語句
    const statements = sqlScript
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    console.log(`準備執行 ${statements.length} 個 SQL 語句`);

    const results = [];
    const errors = [];

    // 逐一執行每個語句
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      console.log(`執行語句 ${i + 1}:`, statement.substring(0, 100) + "...");

      try {
        if (statement.toLowerCase().includes('select')) {
          // 對於 SELECT 語句，使用 .from().select()
          const { data, error } = await supabaseAdmin
            .rpc('exec_sql', { sql: statement + ';' });
          
          if (error) {
            console.error(`語句 ${i + 1} 失敗:`, error);
            errors.push(`語句 ${i + 1}: ${error.message}`);
          } else {
            console.log(`語句 ${i + 1} 成功:`, data);
            results.push(`語句 ${i + 1}: 成功`);
          }
        } else {
          // 對於其他語句，嘗試執行
          const { error } = await supabaseAdmin
            .rpc('exec_sql', { sql: statement + ';' });
          
          if (error) {
            console.error(`語句 ${i + 1} 失敗:`, error);
            errors.push(`語句 ${i + 1}: ${error.message}`);
          } else {
            console.log(`語句 ${i + 1} 成功`);
            results.push(`語句 ${i + 1}: 成功`);
          }
        }
      } catch (err) {
        console.error(`語句 ${i + 1} 執行錯誤:`, err);
        errors.push(`語句 ${i + 1}: ${err instanceof Error ? err.message : '未知錯誤'}`);
      }
    }

    if (errors.length > 0) {
      return NextResponse.json({ 
        success: false,
        message: `執行過程中有 ${errors.length} 個錯誤`,
        results,
        errors,
        sqlExecuted: statements.length
      }, { status: 500 });
    }

    // 驗證修正是否成功
    const testUserId = "test@example.com";
    const testPostId = "84f989ea-f323-4516-bb9b-b7b4c4a6b8b9";
    
    const testResults = {
      likesInsert: false,
      commentsInsert: false
    };

    // 測試 likes 表格
    try {
      const { error: testLikeError } = await supabaseAdmin
        .from("likes")
        .insert({ user_id: testUserId, post_id: testPostId });
      
      if (!testLikeError) {
        testResults.likesInsert = true;
        // 清理測試資料
        await supabaseAdmin
          .from("likes")
          .delete()
          .eq("user_id", testUserId);
      }
    } catch (error) {
      console.log("likes 測試失敗:", error);
    }

    // 測試 comments 表格
    try {
      const { error: testCommentError } = await supabaseAdmin
        .from("comments")
        .insert({ 
          user_id: testUserId, 
          post_id: testPostId, 
          content: "test comment" 
        });
      
      if (!testCommentError) {
        testResults.commentsInsert = true;
        // 清理測試資料
        await supabaseAdmin
          .from("comments")
          .delete()
          .eq("user_id", testUserId);
      }
    } catch (error) {
      console.log("comments 測試失敗:", error);
    }

    return NextResponse.json({ 
      success: true,
      message: "user_id 欄位類型和 RLS 政策修正完成",
      results,
      testResults,
      sqlExecuted: statements.length
    });

  } catch (error) {
    console.error("執行 SQL 修正錯誤:", error);
    return NextResponse.json({ 
      success: false,
      error: error instanceof Error ? error.message : "執行失敗" 
    }, { status: 500 });
  }
} 