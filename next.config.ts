import type { NextConfig } from 'next'

const isDev = process.env.NODE_ENV === 'development'

const nextConfig: NextConfig = {
  // 只在生产环境使用静态导出
  ...(isDev ? {} : { output: 'export' }),
  trailingSlash: true,
  skipTrailingSlashRedirect: true,
  images: {
    unoptimized: true,
  },
  experimental: {
    optimizeCss: true,
  },
  // 开发环境代理配置
  async rewrites() {
    // 只在开发环境启用代理
    if (isDev) {
      return [
        {
          source: '/api/:path*',
          destination: 'http://localhost:8088/:path*',
        },
      ]
    }
    return []
  },
}

export default nextConfig 