import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

// 初始化 Supabase 管理員客戶端（需要 service_role key）
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST() {
  try {
    // 檢查 bucket 是否已存在
    const { data: buckets } = await supabaseAdmin.storage.listBuckets();
    const visitImagesBucket = (buckets ?? []).find(
      (b) => b.name === "visit-images"
    );

    if (!visitImagesBucket) {
      // 建立新的 bucket
      const { error: createError } = await supabaseAdmin.storage.createBucket(
        "visit-images",
        {
          public: true, // 設定為公開存取
          fileSizeLimit: 5242880, // 5MB
          allowedMimeTypes: [
            "image/jpeg",
            "image/png",
            "image/webp",
            "image/jpg",
          ], // 允許的圖片類型
        }
      );

      if (createError) {
        throw createError;
      }

      // 設定 bucket 的存取策略
      const { error: policyError } = await supabaseAdmin.rpc(
        "create_storage_policy",
        {
          bucket_name: "visit-images",
          policy_name: "Allow authenticated uploads",
          definition:
            "(bucket_id = 'visit-images'::text AND auth.role() = 'authenticated')",
          operation: "INSERT",
        }
      );

      if (policyError) {
        console.error("設定存取策略時發生錯誤:", policyError);
        throw policyError;
      }

      // 設定公開讀取策略
      const { error: readPolicyError } = await supabaseAdmin.rpc(
        "create_storage_policy",
        {
          bucket_name: "visit-images",
          policy_name: "Allow public read access",
          definition: "(bucket_id = 'visit-images'::text)",
          operation: "SELECT",
        }
      );

      if (readPolicyError) {
        console.error("設定公開讀取策略時發生錯誤:", readPolicyError);
        throw readPolicyError;
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("設定 Storage bucket 時發生錯誤:", error);
    return NextResponse.json(
      { error: "設定 Storage bucket 失敗" },
      { status: 500 }
    );
  }
}
