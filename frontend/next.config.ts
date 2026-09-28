import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    // Ưu tiên AVIF -> WebP
    formats: ['image/avif', 'image/webp'],
    // Giữ cache ảnh trong 1 năm
    minimumCacheTTL: 31536000,
    // Tối ưu kích thước ảnh thumbnail nhỏ đúng bằng kích thước hiển thị thực tế
    imageSizes: [64, 96, 128, 256],
    deviceSizes: [640, 750, 828, 1080],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
      },
    ],
  },
};

export default nextConfig;