/** @type {import('next').NextConfig} */
const nextConfig = {
  // 實驗性功能
  experimental: {
    // 啟用 SWC 編譯器
    swcMinify: true,
  },

  // 圖片優化配置
  images: {
    // 允許的圖片域名
    domains: [
      'localhost',
      '127.0.0.1',
      'lh3.googleusercontent.com',
      'graph.facebook.com',
    ],
    // 遠端圖片模式配置
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'https',
        hostname: 'supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
    ],
    // 圖片格式支援
    formats: ['image/webp', 'image/avif'],
    // 響應式圖片尺寸
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },

  // 編譯配置
  compiler: {
    // 移除 console.log (生產環境)
    removeConsole: process.env.NODE_ENV === 'production',
  },

  // 程式碼分割配置
  webpack: (config, { dev, isServer }) => {
    // 生產環境優化
    if (!dev && !isServer) {
      // 分離第三方庫
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          // React 相關庫
          react: {
            test: /[\\/]node_modules[\\/](react|react-dom|react-i18next)[\\/]/,
            name: 'react',
            chunks: 'all',
            priority: 40,
          },
          // Next.js 相關庫
          next: {
            test: /[\\/]node_modules[\\/](next|@next)[\\/]/,
            name: 'next',
            chunks: 'all',
            priority: 30,
          },
          // Supabase 相關庫
          supabase: {
            test: /[\\/]node_modules[\\/](@supabase)[\\/]/,
            name: 'supabase',
            chunks: 'all',
            priority: 20,
          },
          // 其他第三方庫
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendor',
            chunks: 'all',
            priority: 10,
          },
        },
      };
    }

    return config;
  },

  // 壓縮配置
  compress: true,

  // 效能優化
  poweredByHeader: false,
  generateEtags: false,

  // 靜態資源優化
  assetPrefix: process.env.NODE_ENV === 'production' ? undefined : '',

  // 環境變數
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },

  // 重定向配置
  async redirects() {
    return [
      {
        source: '/',
        destination: '/pages/home',
        permanent: true,
      },
    ];
  },

  // 標頭配置
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
