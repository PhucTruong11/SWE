import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // ... giữ nguyên các cấu hình cũ (nếu có)
  allowedDevOrigins: ['192.168.10.27', 'localhost'],
};

export default nextConfig;