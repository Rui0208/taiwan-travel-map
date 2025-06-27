import { NextResponse } from "next/server";
import { auth, signOut } from "@/auth";

// GET /api/auth/test-logout - 測試登出功能
export async function GET() {
  try {
    console.log("測試登出 API 被呼叫");
    
    const session = await auth();
    console.log("當前 session:", session);
    
    if (!session) {
      return NextResponse.json({
        success: false,
        error: "尚未登入",
        message: "No active session found"
      }, { status: 401 });
    }
    
    return NextResponse.json({
      success: true,
      message: "登出測試準備完成",
      sessionInfo: {
        userId: session.user?.id,
        email: session.user?.email,
        name: session.user?.name
      }
    });
    
  } catch (error) {
    console.error("測試登出 API 錯誤:", error);
    return NextResponse.json({
      success: false,
      error: "Internal server error",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}

// POST /api/auth/test-logout - 執行登出
export async function POST() {
  try {
    console.log("執行測試登出...");
    
    const session = await auth();
    console.log("登出前的 session:", session);
    
    if (!session) {
      return NextResponse.json({
        success: false,
        error: "尚未登入",
        message: "No active session found"
      }, { status: 401 });
    }
    
    // 嘗試登出
    await signOut({
      redirect: false
    });
    
    console.log("伺服器端登出完成");
    
    return NextResponse.json({
      success: true,
      message: "登出成功",
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error("伺服器端登出失敗:", error);
    return NextResponse.json({
      success: false,
      error: "Logout failed",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
} 