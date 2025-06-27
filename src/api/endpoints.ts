export const endpoints = {
  visited: {
    list: "/api/v1/content/visited",
    create: "/api/v1/content/visited",
    update: (id: string) => `/api/v1/content/visited/${id}`,
    delete: (id: string) => `/api/v1/content/visited/${id}`,
  },
  posts: {
    list: "/api/v1/content/posts",
    byCounty: (county: string) => `/api/v1/content/posts?county=${encodeURIComponent(county)}`,
    byUser: "/api/v1/content/posts",
    byId: (id: string) => `/api/v1/content/posts/${id}`,
  },
  likes: {
    list: (postId: string) => `/api/v1/social/likes?post_id=${postId}`,
    create: "/api/v1/social/likes",
    delete: (postId: string) => `/api/v1/social/likes?post_id=${postId}`,
    createComment: "/api/v1/social/likes",
    deleteComment: (commentId: string) => `/api/v1/social/likes?comment_id=${commentId}`,
  },
  comments: {
    list: (postId: string) => `/api/v1/social/comments?post_id=${postId}`,
    create: "/api/v1/social/comments",
    update: (id: string) => `/api/v1/social/comments/${id}`,
    delete: (id: string) => `/api/v1/social/comments/${id}`,
  },
  search: {
    posts: (query: string) => `/api/v1/content/search?q=${encodeURIComponent(query)}`,
  },
  notifications: {
    list: "/api/v1/social/notifications",
    markRead: "/api/v1/social/notifications",
    setup: "/api/v1/system/setup-notifications",
  },
  profile: {
    get: "/api/v1/user/profile",
    getByUserId: (userId: string) => `/api/v1/user/profile?userId=${encodeURIComponent(userId)}`,
  },
} as const;
