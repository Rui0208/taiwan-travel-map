import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";

// 初始化 Supabase 管理員客戶端（需要 service_role key）
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "未授權" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File;
    const bucket = (formData.get("bucket") as string) || "visit-images";
    const customPath = formData.get("path") as string;

    if (!file) {
      return NextResponse.json({ error: "未提供檔案" }, { status: 400 });
    }

    // 生成檔案名稱
    const fileExt = file.name.split(".").pop();
    const fileName = customPath || `${Math.random()}.${fileExt}`;
    const buffer = await file.arrayBuffer();

    // 上傳檔案
    const { error: uploadError } = await supabaseAdmin.storage
      .from(bucket)
      .upload(fileName, buffer, {
        contentType: file.type,
        upsert: true, // 允許覆蓋現有檔案
      });

    if (uploadError) {
      console.error("上傳檔案時發生錯誤:", uploadError);
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }

    // 取得公開存取 URL
    const {
      data: { publicUrl },
    } = supabaseAdmin.storage.from(bucket).getPublicUrl(fileName);

    return NextResponse.json({ 
      success: true,
      data: {
        url: publicUrl,
        publicUrl: publicUrl,
        path: fileName,
        bucket: bucket
      }
    });
  } catch (error) {
    console.error("處理檔案上傳時發生錯誤:", error);
    return NextResponse.json(
      { success: false, error: "處理檔案上傳時發生錯誤" },
      { status: 500 }
    );
  }
}
