import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { supabase } from "@/lib/supabase";

export async function GET() {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json({
        authenticated: false,
        message: "未登入"
      });
    }

    const user = session.user;

    // 檢查 user_profiles 表中是否有對應的資料
    const { data: profileByUserId } = await supabase
      .from("user_profiles")
      .select("*")
      .eq("user_id", user.id || "")
      .single();

    const { data: profileByEmail } = await supabase
      .from("user_profiles")
      .select("*")
      .eq("user_id", user.email || "")
      .single();

    // 檢查 visited_places 表中的資料
    const { data: visitsByUserId } = await supabase
      .from("visited_places")
      .select("id, user_id, county")
      .eq("user_id", user.id || "");

    const { data: visitsByEmail } = await supabase
      .from("visited_places")
      .select("id, user_id, county")
      .eq("user_id", user.email || "");

    return NextResponse.json({
      authenticated: true,
      session: {
        userId: user.id,
        email: user.email,
        name: user.name,
        image: user.image
      },
      profiles: {
        byUserId: profileByUserId,
        byEmail: profileByEmail
      },
      visits: {
        byUserId: visitsByUserId,
        byEmail: visitsByEmail
      },
      debug: {
        userIdType: typeof user.id,
        emailType: typeof user.email,
        userIdEqualsEmail: user.id === user.email
      }
    });

  } catch (error) {
    console.error("Debug session error:", error);
    return NextResponse.json({
      error: "Debug failed",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
} 