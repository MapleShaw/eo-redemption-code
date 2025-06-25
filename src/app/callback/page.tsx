'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

// API URL configuration
const apiUrl = process.env.NEXT_PUBLIC_DEV === 'true' 
  ? 'http://localhost:8088'  // EdgeOne Functions 本地服务器
  : 'https://your-production-domain.pages.dev';

interface XUser {
  id: string
  name: string
  username: string
  profile_image_url?: string
}

function CallbackContent() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [error, setError] = useState<string>('')
  const [user, setUser] = useState<XUser | null>(null)
  const [claimedCode, setClaimedCode] = useState<string>('')
  
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const code = searchParams.get('code')
        const state = searchParams.get('state')
        const oauthError = searchParams.get('error')

        if (oauthError) {
          throw new Error(`OAuth错误: ${oauthError}`)
        }

        if (!code) {
          throw new Error('未收到授权码')
        }

        // 验证PKCE参数和state
        const storedCodeVerifier = sessionStorage.getItem('oauth_code_verifier')
        const storedState = sessionStorage.getItem('oauth_state')

        if (!storedCodeVerifier || storedState !== state) {
          throw new Error('OAuth状态验证失败')
        }

        const isDev = process.env.NEXT_PUBLIC_DEV === 'true'
        const redirectUri = isDev 
          ? 'http://localhost:3000/callback'
          : `${window.location.origin}/callback`

        // 检查必需的环境变量
        const clientId = process.env.NEXT_PUBLIC_X_CLIENT_ID
        const clientSecret = process.env.NEXT_PUBLIC_X_CLIENT_SECRET

        if (!clientId || !clientSecret) {
          throw new Error('缺少必需的环境变量: X_CLIENT_ID 或 X_CLIENT_SECRET')
        }

        if (!code || !storedCodeVerifier || !redirectUri) {
          throw new Error('OAuth参数不完整')
        }

        console.log('=== OAuth Parameter Validation ===')
        console.log('Code:', code ? 'present' : 'missing')
        console.log('Code Verifier:', storedCodeVerifier ? 'present' : 'missing')
        console.log('Redirect URI:', redirectUri)
        console.log('Client ID:', clientId ? 'present' : 'missing')
        console.log('Client Secret:', clientSecret ? 'present' : 'missing')
        console.log('====================================')

        // Confidential Client + PKCE token exchange
        const tokenParams = new URLSearchParams({
          grant_type: 'authorization_code',
          code: code,
          redirect_uri: redirectUri,
          code_verifier: storedCodeVerifier
        })

        // 使用Basic Authorization header
        const credentials = btoa(`${clientId}:${clientSecret}`)

        const tokenApiUrl = isDev 
          ? '/twitter-api/2/oauth2/token'
          : 'https://api.twitter.com/2/oauth2/token'

        console.log('=== Token Exchange Debug ===')
        console.log('Client ID:', clientId.substring(0, 10) + '...')
        console.log('Client Secret:', clientSecret.substring(0, 10) + '...')
        console.log('Code Verifier:', storedCodeVerifier.substring(0, 10) + '...')
        console.log('Authorization Code:', code.substring(0, 10) + '...')
        console.log('Redirect URI:', redirectUri)
        console.log('Token API URL:', tokenApiUrl)
        console.log('============================')

        const tokenResponse = await fetch(tokenApiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': `Basic ${credentials}`
          },
          body: tokenParams.toString()
        })

        console.log('Token response status:', tokenResponse.status)

        if (!tokenResponse.ok) {
          const errorData = await tokenResponse.json().catch(() => ({}))
          console.error('Token exchange error:', errorData)
          throw new Error(`Token交换失败: ${tokenResponse.status} - ${JSON.stringify(errorData)}`)
        }

        const tokenData = await tokenResponse.json()
        const accessToken = tokenData.access_token

        console.log('✅ Token获取成功，开始获取用户信息...')

        // 获取用户信息
        const userApiUrl = isDev
          ? '/twitter-api/2/users/me?user.fields=profile_image_url'
          : 'https://api.twitter.com/2/users/me?user.fields=profile_image_url'

        console.log('User API URL:', userApiUrl)

        const userResponse = await fetch(userApiUrl, {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        })

        console.log('User response status:', userResponse.status)

        if (!userResponse.ok) {
          const userErrorData = await userResponse.json().catch(() => ({}))
          console.error('获取用户信息失败:', userErrorData)
          throw new Error(`获取用户信息失败: ${userResponse.status} - ${JSON.stringify(userErrorData)}`)
        }

        const userData = await userResponse.json()
        const userInfo = userData.data

        console.log('✅ 用户信息获取成功:', userInfo.username)

        // 存储用户信息
        sessionStorage.setItem('eo_user_data', JSON.stringify({
          user: userInfo,
          timestamp: Date.now()
        }))

        // 清理临时数据
        sessionStorage.removeItem('oauth_code_verifier')
        sessionStorage.removeItem('oauth_state')

        setUser(userInfo)

        console.log('开始领取兑换码...')

        // 检查用户数据格式
        console.log('用户数据检查:')
        console.log('- User ID:', userInfo.id, '(类型:', typeof userInfo.id, ')')
        console.log('- Username:', userInfo.username, '(类型:', typeof userInfo.username, ')')
        console.log('- User ID 长度:', userInfo.id.length)
        console.log('- Username 长度:', userInfo.username.length)

        // 直接领取兑换码（不做关注验证）
        const claimResponse = await fetch(`${apiUrl}/claim`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: userInfo.id,
            username: userInfo.username
          })
        })

        console.log('Claim response status:', claimResponse.status)

        // 检查响应头
        console.log('Claim response headers:')
        for (const [key, value] of claimResponse.headers.entries()) {
          console.log(`- ${key}: ${value}`)
        }

        // 先获取原始文本，再解析JSON
        const responseText = await claimResponse.text()
        console.log('Claim response raw text:', responseText)
        
        let claimData
        try {
          claimData = JSON.parse(responseText)
          console.log('Claim response parsed data:', claimData)
        } catch (parseError) {
          console.error('JSON解析失败:', parseError)
          throw new Error(`响应解析失败: ${responseText}`)
        }
        
        if (!claimResponse.ok) {
          console.error('领取兑换码失败:', claimData)
          throw new Error(claimData.error || '领取失败')
        }

        console.log('✅ 兑换码领取成功，兑换码:', claimData.code)

        // 保存结果并跳转
        sessionStorage.setItem('authData', JSON.stringify({
          success: true,
          user: userInfo,
          code: claimData.code,
          isExisting: claimData.message?.includes('已经领取过')
        }))

        console.log('跳转到成功页面...')
        
        // 临时：直接在当前页面显示成功信息，不跳转
        setStatus('success')
        setUser(userInfo)
        setClaimedCode(claimData.code)
        return
        
        try {
          console.log('准备跳转到 /success 页面')
          console.log('当前URL:', window.location.href)
          
          await router.push('/success')
          
          console.log('✅ 跳转命令执行完成')
        } catch (jumpError) {
          console.error('❌ 页面跳转失败:', jumpError)
          // 如果跳转失败，直接修改location
          window.location.href = '/success'
        }

      } catch (err) {
        setError(err instanceof Error ? err.message : '未知错误')
        setStatus('error')
      }
    }

    handleCallback()
  }, [searchParams, router])

  if (status === 'error') {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 text-center max-w-md">
          <div className="text-red-500 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.232 13.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            登录失败
          </h2>
          <p className="text-red-600 dark:text-red-400 mb-6">
            {error}
          </p>
          <button
            onClick={() => router.push('/')}
            className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-xl transition-colors"
          >
            返回首页
          </button>
        </div>
      </div>
    )
  }

  if (status === 'success' && user && claimedCode) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <div className="w-full max-w-2xl mx-auto">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 text-center">
            <div className="text-green-500 mb-6">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              兑换码领取成功！
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              欢迎 {user.name || user.username}！
            </p>
            <div className="bg-gray-100 dark:bg-gray-700 rounded-xl p-6 mb-6">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">您的兑换码</p>
              <code className="text-2xl font-mono font-bold text-blue-600 dark:text-blue-400">
                {claimedCode}
              </code>
            </div>
            <p className="text-gray-600 dark:text-gray-400 mb-8">
              请妥善保存您的兑换码，此码只能使用一次
            </p>
            <button
              onClick={() => router.push('/')}
              className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-xl transition-colors"
            >
              返回首页
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 text-center max-w-md">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-6"></div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          正在处理授权...
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          请稍候，我们正在安全地验证您的身份
        </p>
      </div>
    </div>
  )
}

export default function CallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 text-center max-w-md">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">加载中...</p>
        </div>
      </div>
    }>
      <CallbackContent />
    </Suspense>
  )
} 