'use client'

import { Suspense, useState, useEffect } from 'react'
import { CodeReveal } from '@/components/code-reveal'
import { ClaimButton } from '@/components/claim-button'
import { useRouter } from 'next/navigation'
import { authApi } from '@/lib/api'

function SuccessContent() {
  const [isLoading, setIsLoading] = useState(true)
  const [userProfile, setUserProfile] = useState<any>(null)
  const [claimedCode, setClaimedCode] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await authApi.checkAuth()
        
        if (response.loggedIn) {
          setUserProfile(response.user!)
        } else {
          router.push('/')
        }
      } catch (error) {
        console.error('认证检查失败:', error)
        router.push('/')
      } finally {
        setIsLoading(false)
      }
    }

    checkAuth()
  }, [router])

  const handleClaimSuccess = (code: string) => {
    setClaimedCode(code)
  }

  if (isLoading) {
    return (
      <div className="w-full max-w-md mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">检查登录状态...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="w-full max-w-md mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 text-center">
          <div className="text-red-500 mb-4">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.232 13.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            {error}
          </h2>
          <button
            onClick={() => window.location.href = '/'}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            返回首页
          </button>
        </div>
      </div>
    )
  }

  if (claimedCode) {
    return (
      <div className="w-full max-w-2xl mx-auto">
        <CodeReveal code={claimedCode} />
        
        <div className="mt-8 text-center">
          <button
            onClick={() => window.location.href = '/'}
            className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-xl transition-colors"
          >
            返回首页
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 text-center">
        <div className="text-green-500 mb-4">
          <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          登录成功！
        </h2>
        
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          欢迎 {userProfile?.name || userProfile?.username}！<br/>
          现在可以领取你的专属兑换码了
        </p>
        
        <ClaimButton onSuccess={handleClaimSuccess} />
        
        <div className="mt-6">
          <button
            onClick={() => window.location.href = '/'}
            className="text-gray-500 hover:text-gray-700 text-sm transition-colors"
          >
            返回首页
          </button>
        </div>
      </div>
    </div>
  )
}

export default function SuccessPage() {
  return (
    <Suspense fallback={
      <div className="w-full max-w-md mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">加载中...</p>
        </div>
      </div>
    }>
      <SuccessContent />
    </Suspense>
  )
}
