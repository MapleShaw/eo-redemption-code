'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface XUser {
  id: string
  name: string
  username: string
  profile_image_url?: string
}

interface AuthData {
  success: boolean
  user: XUser
  code: string
  isExisting?: boolean
}

export default function SuccessPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [authData, setAuthData] = useState<AuthData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    const loadAuthData = () => {
      try {
        const storedData = sessionStorage.getItem('authData')
        if (!storedData) {
          router.push('/')
          return
        }

        const data: AuthData = JSON.parse(storedData)
        
        if (!data.success || !data.code) {
          router.push('/')
          return
        }

        setAuthData(data)
      } catch (error) {
        console.error('加载认证数据失败:', error)
        setError('数据加载失败')
      } finally {
        setIsLoading(false)
      }
    }

    loadAuthData()
  }, [router])

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      alert('兑换码已复制到剪贴板')
    } catch (err) {
      console.error('复制失败:', err)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 text-center max-w-md">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">加载中...</p>
        </div>
      </div>
    )
  }

  if (error || !authData) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 text-center max-w-md">
          <div className="text-red-500 mb-4">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.232 13.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            {error || '数据加载失败'}
          </h2>
          <button
            onClick={() => router.push('/')}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            返回首页
          </button>
        </div>
      </div>
    )
  }

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
            {authData.isExisting ? '兑换码获取成功！' : '兑换码领取成功！'}
          </h2>
          
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            欢迎 {authData.user.name || authData.user.username}！
            {authData.isExisting ? ' 这是您之前领取的兑换码。' : ''}
          </p>
          
          <div className="bg-gray-100 dark:bg-gray-700 rounded-xl p-6 mb-6">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">您的兑换码</p>
            <div className="flex items-center justify-center gap-4">
              <code className="text-2xl font-mono font-bold text-blue-600 dark:text-blue-400">
                {authData.code}
              </code>
              <button
                onClick={() => copyToClipboard(authData.code)}
                className="p-2 text-gray-500 hover:text-blue-600 transition-colors"
                title="复制兑换码"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </button>
            </div>
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
