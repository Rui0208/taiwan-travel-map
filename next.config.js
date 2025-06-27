/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    config.module.rules.push({
      test: /\.json$/,
      type: "json",
    });
    return config;
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "example.com",
      },
      {
        protocol: "https",
        hostname: "**.cloudinary.com", // 如果之後要用 Cloudinary
      },
      {
        protocol: "https",
        hostname: "**.supabase.co", // 如果之後要用 Supabase Storage
      },
      {
        protocol: "https",
        hostname: "**.googleusercontent.com", // Google 帳號頭像
      },
    ],
  },
};

module.exports = nextConfig;
