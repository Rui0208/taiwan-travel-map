import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// 通知類型
export type NotificationType = 'like_post' | 'like_comment' | 'comment_post';

// 建立通知的函數
export async function createNotification(
  targetUserId: string,
  actorId: string,
  type: NotificationType,
  postId?: string,
  commentId?: string
) {
  try {
    // 不要為自己的動作創建通知
    if (targetUserId === actorId) {
      return { success: false, reason: 'self_action' };
    }

    // 檢查是否已存在相同的通知（避免重複）
    // 檢查最近 1 小時內是否有相同的通知
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    
    console.log("檢查重複通知:", { targetUserId, actorId, type, postId, commentId, oneHourAgo });
    
    const { data: existingNotifications, error: checkError } = await supabase
      .from("notifications")
      .select("id, created_at")
      .eq("user_id", targetUserId)
      .eq("actor_id", actorId)
      .eq("type", type)
      .eq("post_id", postId || null)
      .eq("comment_id", commentId || null)
      .gte("created_at", oneHourAgo);

    if (checkError) {
      console.error("檢查重複通知時發生錯誤:", checkError);
    }

    if (existingNotifications && existingNotifications.length > 0) {
      console.log("發現重複通知，跳過建立:", { 
        targetUserId, 
        actorId, 
        type, 
        postId, 
        commentId,
        existingCount: existingNotifications.length,
        existingNotifications 
      });
      return { success: false, reason: 'duplicate_notification' };
    }

    console.log("沒有發現重複通知，繼續建立新通知");

    // 獲取按讚者/留言者的顯示名稱
    let actorName = "用戶";
    
    try {
      // 統一用戶資訊查詢邏輯：先嘗試用 user_id 查詢，再嘗試用 email 查詢
      let userProfile = null;
      
      // 先嘗試用 user_id 查詢
      const { data: profileByUserId } = await supabase
        .from("user_profiles")
        .select("display_name")
        .eq("user_id", actorId)
        .single();
      
      if (profileByUserId?.display_name) {
        userProfile = profileByUserId;
      } else {
        // 再嘗試用 email 查詢
        const { data: profileByEmail } = await supabase
          .from("user_profiles")
          .select("display_name")
          .eq("email", actorId)
          .single();
        userProfile = profileByEmail;
      }

      actorName = userProfile?.display_name || actorId.split('@')[0] || "用戶";
    } catch (error) {
      console.error("獲取用戶資料失敗:", error);
      // 如果查詢失敗，使用 fallback
      actorName = actorId.split('@')[0] || "用戶";
    }

    // 儲存通知類型和參數，不儲存具體的語言內容
    const notificationData = {
      user_id: targetUserId,
      actor_id: actorId,
      type: type,
      post_id: postId || null,
      comment_id: commentId || null,
      actor_name: actorName, // 儲存演員名稱
      is_read: false,
    };

    console.log('準備 insert notificationData:', {
      isArray: Array.isArray(notificationData),
      data: notificationData,
      type: typeof notificationData
    });

    const { error } = await supabase
      .from("notifications")
      .insert(notificationData);

    if (error) {
      console.error("建立通知失敗:", error);
      return { success: false, error };
    }

    return { success: true };
  } catch (error) {
    console.error("通知建立過程錯誤:", error);
    return { success: false, error };
  }
}

// 根據通知類型和當前語言生成顯示內容
export function generateNotificationDisplayContent(
  type: NotificationType,
  actorName: string,
  language: 'zh-Hant' | 'en' = 'zh-Hant'
): string {
  if (language === 'zh-Hant') {
    switch (type) {
      case 'like_post':
        return `${actorName} 按讚了你的文章`;
      case 'like_comment':
        return `${actorName} 按讚了你的留言`;
      case 'comment_post':
        return `${actorName} 留言了你的文章`;
      default:
        return `${actorName} 與你互動了`;
    }
  } else {
    switch (type) {
      case 'like_post':
        return `${actorName} liked your post`;
      case 'like_comment':
        return `${actorName} liked your comment`;
      case 'comment_post':
        return `${actorName} commented on your post`;
      default:
        return `${actorName} interacted with you`;
    }
  }
} 