import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST() {
  try {
    console.log("開始修正 user_id 欄位類型...");

    // 方法：使用 Supabase 客戶端重建表格
    
    // 1. 檢查現有資料
    let existingLikes = [];
    let existingComments = [];
    
    try {
      const { data: likes } = await supabaseAdmin.from("likes").select("*");
      existingLikes = likes || [];
    } catch (error) {
      console.log("讀取 likes 失敗:", error);
    }
    
    try {
      const { data: comments } = await supabaseAdmin.from("comments").select("*");
      existingComments = comments || [];
    } catch (error) {
      console.log("讀取 comments 失敗:", error);
    }

    console.log("現有資料:", { 
      likes: existingLikes.length, 
      comments: existingComments.length 
    });

    // 2. 由於無法直接修改欄位類型，我們創建一個測試來驗證修正是否成功
    // 嘗試插入一個測試記錄來檢查 user_id 是否接受 email 格式
    
    const testUserId = "test@example.com";
    const testPostId = "84f989ea-f323-4516-bb9b-b7b4c4a6b8b9"; // 使用已知存在的 post ID
    
    // 測試 likes 表格
    let likesTableOk = false;
    try {
      const { error: testLikeError } = await supabaseAdmin
        .from("likes")
        .insert({ user_id: testUserId, post_id: testPostId });
      
      if (testLikeError) {
        console.log("likes 表格測試失敗:", testLikeError.message);
        if (testLikeError.message.includes("invalid input syntax for type uuid")) {
          console.log("❌ likes 表格的 user_id 仍然是 UUID 類型");
        }
      } else {
        likesTableOk = true;
        console.log("✅ likes 表格可以接受 email 格式的 user_id");
        
        // 清理測試資料
        await supabaseAdmin
          .from("likes")
          .delete()
          .eq("user_id", testUserId)
          .eq("post_id", testPostId);
      }
    } catch (error) {
      console.log("likes 表格測試錯誤:", error);
    }

    // 測試 comments 表格
    let commentsTableOk = false;
    try {
      const { error: testCommentError } = await supabaseAdmin
        .from("comments")
        .insert({ 
          user_id: testUserId, 
          post_id: testPostId, 
          content: "test comment" 
        });
      
      if (testCommentError) {
        console.log("comments 表格測試失敗:", testCommentError.message);
        if (testCommentError.message.includes("invalid input syntax for type uuid")) {
          console.log("❌ comments 表格的 user_id 仍然是 UUID 類型");
        }
      } else {
        commentsTableOk = true;
        console.log("✅ comments 表格可以接受 email 格式的 user_id");
        
        // 清理測試資料
        await supabaseAdmin
          .from("comments")
          .delete()
          .eq("user_id", testUserId)
          .eq("post_id", testPostId);
      }
    } catch (error) {
      console.log("comments 表格測試錯誤:", error);
    }

    if (likesTableOk && commentsTableOk) {
      return NextResponse.json({ 
        success: true,
        message: "user_id 欄位類型已正確設定為 TEXT",
        details: {
          likesTableOk,
          commentsTableOk,
          existingData: {
            likes: existingLikes.length,
            comments: existingComments.length
          }
        }
      });
    } else {
      return NextResponse.json({ 
        success: false,
        message: "需要手動修正資料庫 user_id 欄位類型",
        details: {
          likesTableOk,
          commentsTableOk,
          instructions: "請在 Supabase Dashboard 的 SQL Editor 中執行：\nALTER TABLE likes ALTER COLUMN user_id TYPE TEXT;\nALTER TABLE comments ALTER COLUMN user_id TYPE TEXT;"
        }
      }, { status: 500 });
    }

  } catch (error) {
    console.error("檢查 user_id 欄位類型錯誤:", error);
    return NextResponse.json({ 
      success: false,
      error: error instanceof Error ? error.message : "檢查失敗" 
    }, { status: 500 });
  }
} 