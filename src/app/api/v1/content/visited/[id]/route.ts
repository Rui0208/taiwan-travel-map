import { auth } from "@/auth";
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    const { id } = await params;

    if (!session?.user?.id) {
      return new NextResponse("未授權", { status: 401 });
    }

    // 改為支援 JSON 格式
    const { note, ig_url, county, image_url, image_urls, is_public } = await request.json();

    console.log("更新資料:", {
      note,
      ig_url,
      county,
      image_url: image_url || null,
      image_urls: image_urls || [],
    });

    // 準備更新資料
    const updateData: {
      note: string;
      ig_url: string | null;
      county: string;
      updated_at: string;
      image_url?: string | null;
      image_urls?: string[];
      is_public?: boolean;
    } = {
      note,
      ig_url: ig_url || null,
      county,
      updated_at: new Date().toISOString(),
      is_public: is_public ?? true,
    };

    // 處理多圖片
    if (image_urls && Array.isArray(image_urls)) {
      updateData.image_urls = image_urls;
      updateData.image_url = image_urls[0] || null; // 保持向後相容性
    } else if (image_url !== undefined) {
      // 如果只有單一圖片
      updateData.image_url = image_url || null;
      updateData.image_urls = image_url ? [image_url] : [];
    }

    const { data, error } = await supabase
      .from("visited_places")
      .update(updateData)
      .eq("id", id)
      .eq("user_id", session.user.id)
      .select()
      .single();

    if (error) {
      console.error("更新造訪地點失敗:", error);
      return new NextResponse("更新失敗", { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("更新造訪地點時發生錯誤:", error);
    return new NextResponse("更新失敗", { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    const { id } = await params;

    if (!session?.user?.id) {
      return new NextResponse("未授權", { status: 401 });
    }

    const { error } = await supabase
      .from("visited_places")
      .delete()
      .eq("id", id)
      .eq("user_id", session.user.id);

    if (error) {
      console.error("刪除造訪地點失敗:", error);
      return new NextResponse("刪除失敗", { status: 500 });
    }

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("刪除造訪地點時發生錯誤:", error);
    return new NextResponse("刪除失敗", { status: 500 });
  }
}
