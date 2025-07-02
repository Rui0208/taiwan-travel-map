import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { auth } from "@/auth";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// 獲取用戶通知
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = parseInt(url.searchParams.get("limit") || "20");
    const unreadOnly = url.searchParams.get("unread_only") === "true";
    const offset = (page - 1) * limit;

    const userId = session.user.id;

    // 構建查詢條件 - 先只獲取通知基本資料
    let query = supabase
      .from("notifications")
      .select(`
        id,
        user_id,
        actor_id,
        type,
        post_id,
        comment_id,
        content,
        actor_name,
        is_read,
        created_at
      `)
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (unreadOnly) {
      query = query.eq("is_read", false);
    }

    const { data: notifications, error } = await query;

    if (error) {
      console.error("獲取通知失敗:", error);
      return NextResponse.json({ error: "Failed to fetch notifications" }, { status: 500 });
    }

    // 手動獲取相關的貼文和留言資料
    const processedNotifications = await Promise.all(
      (notifications || []).map(async (notification) => {
        let post = null;
        let comment = null;
        let actor = null;

        // 如果有 post_id，獲取貼文資料
        if (notification.post_id) {
          const { data: postData } = await supabase
            .from("visited_places")
            .select("id, county, note, image_url, image_urls")
            .eq("id", notification.post_id)
            .single();
          post = postData;
        }

        // 如果有 comment_id，獲取留言資料
        if (notification.comment_id) {
          const { data: commentData } = await supabase
            .from("comments")
            .select("id, content")
            .eq("id", notification.comment_id)
            .single();
          comment = commentData;
        }

        // 獲取發送者（actor）資訊
        if (notification.actor_id) {
          // 統一用戶資訊查詢邏輯：先嘗試用 user_id 查詢，再嘗試用 email 查詢
          let userProfile = null;
          
          // 先嘗試用 user_id 查詢
          const { data: profileByUserId } = await supabase
            .from("user_profiles")
            .select("display_name, avatar_url")
            .eq("user_id", notification.actor_id)
            .single();
          
          if (profileByUserId) {
            userProfile = profileByUserId;
          } else {
            // 再嘗試用 email 查詢
            const { data: profileByEmail } = await supabase
              .from("user_profiles")
              .select("display_name, avatar_url")
              .eq("email", notification.actor_id)
              .single();
            userProfile = profileByEmail;
          }

          const fallbackName = notification.actor_id.split('@')[0] || "用戶";
          actor = {
            id: notification.actor_id,
            name: userProfile?.display_name || fallbackName,
            image: userProfile?.avatar_url || null, // 暫時移除 session 回退，因為這裡沒有 session
          };
        }

        return {
          ...notification,
          post,
          comment,
          actor,
        };
      })
    );

    const cleanNotifications = processedNotifications;

    // 獲取未讀數量
    const { count: unreadCount } = await supabase
      .from("notifications")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("is_read", false);

    return NextResponse.json({
      success: true,
      data: cleanNotifications || [],
      pagination: {
        page,
        limit,
        hasMore: (cleanNotifications?.length || 0) === limit,
      },
      unreadCount: unreadCount || 0,
    });

  } catch (error) {
    console.error("通知 API 錯誤:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// 標記通知為已讀
export async function PATCH(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { notificationIds, markAllRead } = await request.json();
    const userId = session.user.id;

    if (markAllRead) {
      // 標記所有通知為已讀
      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("user_id", userId)
        .eq("is_read", false);

      if (error) {
        console.error("標記全部已讀失敗:", error);
        return NextResponse.json({ error: "Failed to mark all as read" }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        message: "All notifications marked as read",
      });
    } else if (notificationIds && Array.isArray(notificationIds)) {
      // 標記指定通知為已讀
      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("user_id", userId)
        .in("id", notificationIds);

      if (error) {
        return NextResponse.json({ error: "Failed to mark notifications as read" }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        message: "Notifications marked as read",
      });
    } else {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

  } catch (error) {
    console.error("標記已讀 API 錯誤:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
} 

// 刪除通知
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { notificationIds } = await request.json();
    const userId = session.user.id;

    if (!notificationIds || !Array.isArray(notificationIds)) {
      return NextResponse.json({ error: "Invalid notification IDs" }, { status: 400 });
    }

    // 刪除指定的通知（確保只能刪除自己的通知）
    const { error } = await supabase
      .from("notifications")
      .delete()
      .eq("user_id", userId)
      .in("id", notificationIds);

    if (error) {
      console.error("刪除通知失敗:", error);
      return NextResponse.json({ error: "Failed to delete notifications" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: "Notifications deleted successfully",
    });

  } catch (error) {
    console.error("刪除通知 API 錯誤:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
} 