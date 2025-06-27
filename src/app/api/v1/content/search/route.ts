import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { auth } from "@/auth";
import { COUNTY_NAMES, COUNTY_NAMES_REVERSE } from "@/api/types";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// GET /api/search?q=keyword - 搜尋文章內容
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    const isGuest = !session?.user?.id;

    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q");

    if (!query?.trim()) {
      return NextResponse.json({ 
        success: true, 
        data: [], 
        count: 0 
      });
    }

    const searchTerm = query.trim();

    // 建立縣市名稱搜尋條件 - 支援中英文
    const countySearchTerms = [];
    
    // 1. 直接搜尋輸入的關鍵字
    countySearchTerms.push(`county.ilike.%${searchTerm}%`);
    
    // 2. 如果輸入的是中文縣市，也搜尋對應的英文（處理繁簡體差異）
    const searchTermVariants = [
      searchTerm,
      searchTerm.replace('台', '臺'),
      searchTerm.replace('臺', '台')
    ];
    
    searchTermVariants.forEach(variant => {
      if (COUNTY_NAMES[variant as keyof typeof COUNTY_NAMES]) {
        const englishName = COUNTY_NAMES[variant as keyof typeof COUNTY_NAMES];
        countySearchTerms.push(`county.ilike.%${englishName}%`);
      }
    });
    
    // 3. 如果輸入的是英文縣市，也搜尋對應的中文
    if (COUNTY_NAMES_REVERSE[searchTerm]) {
      const chineseName = COUNTY_NAMES_REVERSE[searchTerm];
      countySearchTerms.push(`county.ilike.%${chineseName}%`);
    }
    
    // 4. 模糊搜尋中文縣市名稱（部分匹配）
    Object.keys(COUNTY_NAMES).forEach(chineseName => {
      // 處理繁體/簡體字差異（如：台北 vs 臺北）
      const normalizedCountyName = chineseName.replace('臺', '台');
      const normalizedSearchTerm = searchTerm.replace('臺', '台');
      
      if (chineseName.includes(searchTerm) || 
          normalizedCountyName.includes(normalizedSearchTerm) ||
          chineseName.includes(searchTerm.replace('台', '臺'))) {
        countySearchTerms.push(`county.ilike.%${chineseName}%`);
        const englishName = COUNTY_NAMES[chineseName as keyof typeof COUNTY_NAMES];
        countySearchTerms.push(`county.ilike.%${englishName}%`);
      }
    });
    
    // 5. 模糊搜尋英文縣市名稱（部分匹配）
    Object.values(COUNTY_NAMES).forEach(englishName => {
      if (englishName.toLowerCase().includes(searchTerm.toLowerCase())) {
        countySearchTerms.push(`county.ilike.%${englishName}%`);
        const chineseName = COUNTY_NAMES_REVERSE[englishName];
        if (chineseName) {
          countySearchTerms.push(`county.ilike.%${chineseName}%`);
        }
      }
    });

    // 去除重複的搜尋條件
    const uniqueCountyTerms = [...new Set(countySearchTerms)];
    
    // 組合搜尋條件：內容搜尋 + 縣市搜尋
    const searchConditions = [
      `note.ilike.%${searchTerm}%`,
      ...uniqueCountyTerms
    ];



    // 搜尋文章 - 使用 ilike 進行模糊搜尋
    const { data: allPosts, error: postsError } = await supabase
      .from("visited_places")
      .select(`
        id,
        user_id,
        county,
        image_url,
        image_urls,
        ig_url,
        created_at,
        updated_at,
        note,
        is_public
      `)
      .or(searchConditions.join(','))
      .order("created_at", { ascending: false })
      .limit(100); // 先獲取更多結果，然後進行隱私過濾

    if (postsError) {
      console.error("搜尋文章失敗:", postsError);
      console.error("搜尋條件:", searchConditions);
      console.error("搜尋關鍵字:", searchTerm);
      return NextResponse.json({ 
        error: "Failed to search posts",
        details: postsError.message 
      }, { status: 500 });
    }

    // 在應用層進行隱私過濾：只顯示公開文章或自己的文章
    const posts = (allPosts || []).filter(post => 
      post.is_public === true || (!isGuest && post.user_id === session?.user?.id)
    ).slice(0, 50); // 限制最終結果為50個

    if (!posts || posts.length === 0) {
      return NextResponse.json({
        success: true,
        data: [],
        count: 0
      });
    }

    // 由於系統使用 NextAuth 管理用戶，用戶資訊不存儲在資料庫中
    // 我們使用 user_id（email）來顯示用戶資訊

    // 為每篇文章添加社交資料和用戶資訊
    const postsWithSocialData = await Promise.all(
      posts.map(async (post) => {
        try {
          // 獲取用戶資訊（整合個人資料）- 修復查詢邏輯不一致問題
          const getUserInfoFixed = async (userId: string) => {
            if (userId === session?.user?.id) {
              // 當前用戶：統一使用 user_id 和 email 查詢
              let userProfile = null;
              
              // 先嘗試用 user_id 查詢
              const { data: profileByUserId } = await supabase
                .from("user_profiles")
                .select("display_name, avatar_url")
                .eq("user_id", userId)
                .single();
              
              if (profileByUserId) {
                userProfile = profileByUserId;
              } else {
                // 再嘗試用 email 查詢
                const { data: profileByEmail } = await supabase
                  .from("user_profiles")
                  .select("display_name, avatar_url")
                  .eq("email", userId)
                  .single();
                userProfile = profileByEmail;
              }

              return {
                id: userId,
                name: userProfile?.display_name || session?.user?.name || "我",
                email: userId,
                image: userProfile?.avatar_url || session?.user?.image,
              };
            } else {
              // 其他用戶：統一使用 user_id 和 email 查詢
              let userProfile = null;
              
              // 先嘗試用 user_id 查詢
              const { data: profileByUserId } = await supabase
                .from("user_profiles")
                .select("display_name, avatar_url")
                .eq("user_id", userId)
                .single();
              
              if (profileByUserId) {
                userProfile = profileByUserId;
              } else {
                // 再嘗試用 email 查詢
                const { data: profileByEmail } = await supabase
                  .from("user_profiles")
                  .select("display_name, avatar_url")
                  .eq("email", userId)
                  .single();
                userProfile = profileByEmail;
              }

              const fallbackName = userId.split('@')[0];
              return {
                id: userId,
                name: userProfile?.display_name || fallbackName.charAt(0).toUpperCase() + fallbackName.slice(1),
                email: userId,
                image: userProfile?.avatar_url,
              };
            }
          };

          const userInfo = await getUserInfoFixed(post.user_id);

          // 獲取按讚數量
          const { count: likesCount } = await supabase
            .from("likes")
            .select("*", { count: "exact" })
            .eq("post_id", post.id)
            .is("comment_id", null);

          // 檢查當前用戶是否已按讚
          let userLike = null;
          if (!isGuest) {
            const { data } = await supabase
              .from("likes")
              .select("id")
              .eq("post_id", post.id)
              .eq("user_id", session!.user!.id)
              .is("comment_id", null)
              .single();
            userLike = data;
          }

          // 獲取留言數量
          const { count: commentsCount } = await supabase
            .from("comments")
            .select("*", { count: "exact" })
            .eq("post_id", post.id);

          // 獲取留言列表（限制數量）
          const { data: comments } = await supabase
            .from("comments")
            .select(`
              id,
              content,
              created_at,
              updated_at,
              user_id
            `)
            .eq("post_id", post.id)
            .order("created_at", { ascending: true })
            .limit(5); // 只取前 5 則留言

          // 為留言添加按讚資訊和用戶資訊
          const commentsWithLikes = await Promise.all(
            (comments || []).map(async (comment) => {
              const { count: commentLikesCount } = await supabase
                .from("likes")
                .select("*", { count: "exact" })
                .eq("comment_id", comment.id);

              let commentUserLike = null;
              if (!isGuest) {
                const { data } = await supabase
                  .from("likes")
                  .select("id")
                  .eq("comment_id", comment.id)
                  .eq("user_id", session!.user!.id)
                  .single();
                commentUserLike = data;
              }

              // 獲取留言者的個人資料
              const commentUserInfo = await getUserInfoFixed(comment.user_id);

              return {
                ...comment,
                likes_count: commentLikesCount || 0,
                is_liked: !!commentUserLike,
                user: commentUserInfo,
              };
            })
          );

          return {
            ...post,
            title: post.note ? post.note.substring(0, 50) + (post.note.length > 50 ? '...' : '') : post.county, // 從 note 生成標題
            location: undefined, // 資料庫中沒有此欄位，設為 undefined
            instagram_url: post.ig_url, // 使用 ig_url 作為 instagram_url
            visited_at: post.created_at, // 使用 created_at 作為 visited_at
            likes_count: likesCount || 0,
            is_liked: !!userLike,
            comments_count: commentsCount || 0,
            comments: commentsWithLikes,
            user: userInfo,
          };
        } catch (socialError) {
          console.warn("獲取社交資料失敗，回退到基本資料:", socialError);
          // 如果社交功能資料表還不存在，回退到基本資料
          return {
            ...post,
            title: post.note ? post.note.substring(0, 50) + (post.note.length > 50 ? '...' : '') : post.county, // 從 note 生成標題
            location: undefined, // 資料庫中沒有此欄位，設為 undefined
            instagram_url: post.ig_url, // 使用 ig_url 作為 instagram_url
            visited_at: post.created_at, // 使用 created_at 作為 visited_at
            likes_count: 0,
            is_liked: false,
            comments_count: 0,
            comments: [],
            user: {
              id: post.user_id,
              name: post.user_id === session?.user?.id ? (session?.user?.name || "我") : post.user_id.split('@')[0],
              email: post.user_id,
              image: post.user_id === session?.user?.id ? session?.user?.image : undefined,
            },
          };
        }
      })
    );

    return NextResponse.json({
      success: true,
      data: postsWithSocialData,
      count: postsWithSocialData.length
    });

  } catch (error) {
    console.error("搜尋 API 錯誤:", error);
    return NextResponse.json({ 
      error: "Internal server error" 
    }, { status: 500 });
  }
} 