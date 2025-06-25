'use client'

import { useState } from 'react'
import { generateCodeVerifier, generateCodeChallenge, generateRandomState } from '@/lib/oauth'

export function LoginButton() {
  const [isLoading, setIsLoading] = useState(false)

  const handleLogin = async () => {
    setIsLoading(true)
    
    try {
      const clientId = process.env.NEXT_PUBLIC_X_CLIENT_ID
      
      if (!clientId) {
        throw new Error('缺少必需的环境变量: NEXT_PUBLIC_X_CLIENT_ID')
      }
      
      // 生成PKCE参数和state（Confidential Client + PKCE增强安全性）
      const codeVerifier = generateCodeVerifier()
      const codeChallenge = await generateCodeChallenge(codeVerifier)
      const state = generateRandomState()
      
      // 存储到sessionStorage
      sessionStorage.setItem('oauth_code_verifier', codeVerifier)
      sessionStorage.setItem('oauth_state', state)
      
      const isDev = process.env.NEXT_PUBLIC_DEV === 'true'
      const redirectUri = isDev 
        ? 'http://localhost:3000/callback'
        : `${window.location.origin}/callback`
      
      // 验证所有参数
      if (!codeChallenge || !state || !redirectUri) {
        throw new Error('OAuth参数生成失败')
      }
      
      console.log('=== OAuth Login Parameters ===')
      console.log('Client ID:', clientId ? 'present' : 'missing')
      console.log('Code Challenge:', codeChallenge ? 'present' : 'missing')
      console.log('State:', state ? 'present' : 'missing')
      console.log('Redirect URI:', redirectUri)
      console.log('==============================')
      
      // Confidential Client + PKCE OAuth URL
      const params = new URLSearchParams({
        response_type: 'code',
        client_id: clientId,
        redirect_uri: redirectUri,
        scope: 'tweet.read users.read follows.read',
        state: state,
        code_challenge: codeChallenge,
        code_challenge_method: 'S256'
      })
      
      const authUrl = `https://twitter.com/i/oauth2/authorize?${params.toString()}`
      
      console.log('Confidential Client + PKCE OAuth URL:', authUrl)
      console.log('Redirect URI:', redirectUri)
      
      window.location.href = authUrl
      
    } catch (error) {
      console.error('Login failed:', error)
      setIsLoading(false)
    }
  }

  return (
    <button
      onClick={handleLogin}
      disabled={isLoading}
      className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 disabled:from-blue-300 disabled:to-indigo-300 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 transform hover:scale-105 hover:shadow-lg disabled:hover:scale-100 disabled:hover:shadow-none flex items-center justify-center space-x-2"
    >
      <svg
        className="w-5 h-5"
        fill="currentColor"
        viewBox="0 0 24 24"
      >
        <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
      </svg>
      <span>{isLoading ? '登录中...' : '使用 X 登录'}</span>
    </button>
  )
} 