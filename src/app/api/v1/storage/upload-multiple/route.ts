import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { auth } from "@/auth";

// 使用 service role key 來繞過 RLS 限制
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  const session = await auth();

  if (!session?.user?.email) {
    return NextResponse.json({ error: "未授權" }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const files = formData.getAll("files") as File[];

    // 驗證檔案數量
    if (files.length === 0) {
      return NextResponse.json({ error: "請選擇至少一張圖片" }, { status: 400 });
    }

    if (files.length > 10) {
      return NextResponse.json({ error: "最多只能上傳 10 張圖片" }, { status: 400 });
    }

    const uploadResults = [];
    const errors = [];

    // 批量上傳圖片
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      // 驗證檔案類型
      if (!file.type.startsWith("image/")) {
        errors.push(`檔案 ${i + 1}: 不是有效的圖片格式`);
        continue;
      }

      // 驗證檔案大小（10MB 限制）
      if (file.size > 10 * 1024 * 1024) {
        errors.push(`檔案 ${i + 1}: 檔案大小不能超過 10MB`);
        continue;
      }

      try {
        // 生成唯一檔案名 - 使用和單圖片上傳相同的方式
        const fileExt = file.name.split(".").pop();
        const fileName = `${session.user.email}/${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;
        
        // 轉換為 ArrayBuffer - 使用和單圖片上傳相同的方式
        const buffer = await file.arrayBuffer();

        // 上傳到 Supabase Storage
        const { data, error } = await supabase.storage
          .from("visit-images")
          .upload(fileName, buffer, {
            contentType: file.type,
            cacheControl: "3600",
            upsert: false,
          });

        if (error) {
          console.error("Supabase 上傳錯誤:", error);
          errors.push(`檔案 ${i + 1}: ${error.message}`);
          continue;
        }

        // 獲取公開 URL - 使用和單圖片上傳相同的方式
        const { data: urlData } = supabase.storage
          .from("visit-images")
          .getPublicUrl(fileName);

        uploadResults.push({
          index: i,
          fileName: file.name,
          url: urlData.publicUrl,
          path: data.path || fileName,
        });

      } catch (uploadError) {
        console.error(`檔案 ${i + 1} 上傳失敗:`, uploadError);
        errors.push(`檔案 ${i + 1}: 上傳失敗`);
      }
    }

    // 如果所有檔案都上傳失敗
    if (uploadResults.length === 0) {
      return NextResponse.json({ 
        error: "所有圖片上傳失敗", 
        details: errors 
      }, { status: 500 });
    }

    // 返回結果
    return NextResponse.json({
      success: true,
      uploadedCount: uploadResults.length,
      totalCount: files.length,
      urls: uploadResults.map(result => result.url),
      results: uploadResults,
      errors: errors.length > 0 ? errors : null,
    });

  } catch (err) {
    console.error("批量上傳錯誤:", err);
    return NextResponse.json({ 
      error: err instanceof Error ? err.message : "上傳失敗" 
    }, { status: 500 });
  }
} 