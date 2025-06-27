import { NextResponse } from "next/server";
import { auth } from "@/auth";

// GET /api/auth/test-auth - 測試 NextAuth 設定
export async function GET() {
  try {
    console.log("測試 NextAuth 設定...");
    
    const session = await auth();
    console.log("當前 session:", session);
    
    return NextResponse.json({
      success: true,
      message: "NextAuth 設定正常",
      session: session ? {
        userId: session.user?.id,
        email: session.user?.email,
        name: session.user?.name
      } : null,
      isAuthenticated: !!session,
      environment: {
        hasGoogleClientId: !!process.env.GOOGLE_CLIENT_ID,
        hasGoogleClientSecret: !!process.env.GOOGLE_CLIENT_SECRET,
        hasNextAuthUrl: !!process.env.NEXTAUTH_URL,
        hasNextAuthSecret: !!process.env.NEXTAUTH_SECRET,
        nodeEnv: process.env.NODE_ENV
      }
    });
    
  } catch (error) {
    console.error("NextAuth 測試錯誤:", error);
    return NextResponse.json({
      success: false,
      error: "NextAuth test failed",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
} 