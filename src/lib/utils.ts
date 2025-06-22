import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function generateRandomString(length: number): string {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~'
  let result = ''
  for (let i = 0; i < length; i++) {
    result += charset.charAt(Math.floor(Math.random() * charset.length))
  }
  return result
}

export function generateSessionId(): string {
  return generateRandomString(32)
}

export function createOAuthState(): string {
  return generateRandomString(16)
}

export function createCodeVerifier(): string {
  return generateRandomString(128)
}

export async function createCodeChallenge(verifier: string): Promise<string> {
  // Create SHA256 hash of verifier
  const encoder = new TextEncoder()
  const data = encoder.encode(verifier)
  const digest = await crypto.subtle.digest('SHA-256', data)
  
  // Convert to base64url
  const uint8Array = new Uint8Array(digest)
  const base64 = btoa(String.fromCharCode.apply(null, Array.from(uint8Array)))
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
}

export function getApiUrl(path: string): string {
  if (typeof window === 'undefined') {
    // Server-side
    return path
  }
  
  // Client-side
  const isDev = process.env.NEXT_PUBLIC_DEV === 'true'
  
  if (isDev) {
    // 开发环境：使用 Next.js 代理
    return `/api${path}`
  } else {
    // 生产环境：直接使用相对路径（EdgeOne Pages 会处理路由）
    return path
  }
}

// EdgeOne Functions 版本 - 接受环境变量作为参数
export function getRedirectUrl(path: string, env?: any): string {
  if (env) {
    // EdgeOne Functions 环境
    const isDev = env.DEV === 'true'
    const baseUrl = isDev 
      ? env.FRONT_END_URL_DEV || 'http://localhost:3000'
      : ''
    return `${baseUrl}${path}`
  }
  
  // 客户端环境
  if (typeof window !== 'undefined') {
    return path
  }
  
  // 默认返回路径
  return path
}

export function formatUsername(username: string): string {
  return username.startsWith('@') ? username : `@${username}`
}

export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
} 