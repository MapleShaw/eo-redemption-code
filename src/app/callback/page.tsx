'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

function CallbackContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<string>('处理登录...')
  const [error, setError] = useState<string>('')

  useEffect(() => {
    handleCallback()
  }, [])

  const handleCallback = async () => {
    try {
      console.log('=== CALLBACK PROCESSING START ===')
      
      // 获取OAuth参数
      const code = searchParams.get('code')
      const state = searchParams.get('state')
      const error = searchParams.get('error')

      if (error) {
        throw new Error(`OAuth error: ${error}`)
      }

      if (!code || !state) {
        throw new Error('Missing code or state parameter')
      }

      // 验证state
      const storedState = sessionStorage.getItem('oauth_state')
      if (state !== storedState) {
        throw new Error('State parameter mismatch')
      }

      // 获取存储的PKCE参数
      const codeVerifier = sessionStorage.getItem('oauth_code_verifier')
      if (!codeVerifier) {
        throw new Error('Missing code verifier')
      }

      console.log('OAuth parameters validated')
      setStatus('交换访问令牌...')

      // Step 1: 交换code获取access token
      const tokenResponse = await fetch('https://api.twitter.com/2/oauth2/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${btoa(`${process.env.NEXT_PUBLIC_X_CLIENT_ID}:${process.env.NEXT_PUBLIC_X_CLIENT_SECRET || ''}`)}`,
        },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          code: code,
          redirect_uri: 'http://localhost:3000/callback',
          code_verifier: codeVerifier,
          client_id: process.env.NEXT_PUBLIC_X_CLIENT_ID!,
        }),
      })

      if (!tokenResponse.ok) {
        const errorText = await tokenResponse.text()
        console.error('Token exchange failed:', errorText)
        throw new Error(`Token exchange failed: ${tokenResponse.status}`)
      }

      const tokenData = await tokenResponse.json()
      console.log('Token exchange successful')
      
      setStatus('获取用户信息...')

      // Step 2: 获取用户信息
      const userResponse = await fetch('https://api.twitter.com/2/users/me?user.fields=profile_image_url,public_metrics', {
        headers: {
          'Authorization': `Bearer ${tokenData.access_token}`,
        },
      })

      if (!userResponse.ok) {
        const errorText = await userResponse.text()
        console.error('User fetch failed:', errorText)
        throw new Error(`User fetch failed: ${userResponse.status}`)
      }

      const userData = await userResponse.json()
      console.log('User data retrieved:', userData.data.username)
      
      setStatus('创建用户会话...')

      // Step 3: 发送到EdgeOne Functions创建会话
      const isDev = process.env.NODE_ENV === 'development'
      const loginUrl = isDev ? 'http://localhost:8088/login' : '/login'
      
      const loginResponse = await fetch(loginUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          userProfile: userData.data,
          accessToken: tokenData.access_token,
        }),
      })

      if (!loginResponse.ok) {
        const errorText = await loginResponse.text()
        console.error('Login failed:', errorText)
        throw new Error(`Login failed: ${loginResponse.status}`)
      }

      const loginData = await loginResponse.json()
      console.log('Login successful:', loginData.user.username)

      // 清理sessionStorage
      sessionStorage.removeItem('oauth_code_verifier')
      sessionStorage.removeItem('oauth_state')

      console.log('=== CALLBACK PROCESSING SUCCESS ===')
      
      // 重定向到首页
      router.push('/')

    } catch (error) {
      console.error('Callback error:', error)
      setError(error instanceof Error ? error.message : 'Unknown error')
      setStatus('登录失败')
    }
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="bg-white p-8 rounded-xl shadow-lg text-center max-w-md">
          <div className="text-red-500 text-4xl mb-4">❌</div>
          <h1 className="text-xl font-semibold text-gray-900 mb-2">登录失败</h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => router.push('/')}
            className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg transition-colors"
          >
            返回首页
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="bg-white p-8 rounded-xl shadow-lg text-center max-w-md">
        <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
        <h1 className="text-xl font-semibold text-gray-900 mb-2">正在登录</h1>
        <p className="text-gray-600">{status}</p>
      </div>
    </div>
  )
}

export default function CallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
      </div>
    }>
      <CallbackContent />
    </Suspense>
  )
} 