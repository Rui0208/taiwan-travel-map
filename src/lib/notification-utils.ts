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
  commentId?: string,
  language: 'zh-Hant' | 'en' = 'zh-Hant'
) {
  try {
    // 不要為自己的動作創建通知
    if (targetUserId === actorId) {
      return { success: false, reason: 'self_action' };
    }

    // 獲取按讚者/留言者的顯示名稱
    const { data: actorProfile } = await supabase
      .from("user_profiles")
      .select("display_name")
      .eq("user_id", actorId)
      .single();

    const actorName = actorProfile?.display_name || actorId.split('@')[0] || "用戶";

    // 根據語言和類型生成通知內容
    let content = "";
    if (language === 'zh-Hant') {
      switch (type) {
        case 'like_post':
          content = `${actorName} 按讚了你的文章`;
          break;
        case 'like_comment':
          content = `${actorName} 按讚了你的留言`;
          break;
        case 'comment_post':
          content = `${actorName} 留言了你的文章`;
          break;
      }
    } else {
      switch (type) {
        case 'like_post':
          content = `${actorName} liked your post`;
          break;
        case 'like_comment':
          content = `${actorName} liked your comment`;
          break;
        case 'comment_post':
          content = `${actorName} commented on your post`;
          break;
      }
    }

    const notificationData = {
      user_id: targetUserId,
      actor_id: actorId,
      type: type,
      post_id: postId || null,
      comment_id: commentId || null,
      content: content,
      is_read: false,
    };

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