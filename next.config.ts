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
  // 暂时禁用实验性功能以避免构建错误
  // experimental: {
  //   optimizeCss: true,
  // },
  // 开发环境代理配置
  async rewrites() {
    // 只在开发环境启用代理，生产环境下不使用rewrites
    if (isDev) {
      return [
        {
          source: '/api/:path*',
          destination: 'http://localhost:8088/:path*',
        },
        // 临时代理 Twitter API（仅开发环境）
        {
          source: '/twitter-api/:path*',
          destination: 'https://api.twitter.com/:path*',
        },
      ]
    }
    return []
  },
}

export default nextConfig 