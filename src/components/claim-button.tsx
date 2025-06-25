'use client'

import { useState } from 'react'
import { LoadingSpinner } from './ui/loading-spinner'

interface XUser {
  id: string
  name: string
  username: string
  profile_image_url?: string
}

interface UserData {
  user: XUser
  accessToken: string
  isFollowing: boolean
  timestamp: number
}

interface ClaimButtonProps {
  userData: UserData
  onSuccess: (code: string) => void
}

export function ClaimButton({ userData, onSuccess }: ClaimButtonProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleClaim = async () => {
    setLoading(true)
    setError(null)
    
    try {
      // 先检查本地是否已领取
      const existingClaim = localStorage.getItem(`claimed_${userData.user.id}`)
      if (existingClaim) {
        setError('您已经领取过兑换码了')
        setLoading(false)
        return
      }

      // 调用EdgeOne Function
      const isDev = window.location.hostname === 'localhost'
      const apiUrl = isDev ? 'http://localhost:8088/claim' : '/claim'
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: userData.user.id,
          username: userData.user.username
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || '领取失败')
      }

      const data = await response.json()
      const claimedCode = data.code

      // 记录本地领取状态
      localStorage.setItem(`claimed_${userData.user.id}`, JSON.stringify({
        code: claimedCode,
        claimedAt: new Date().toISOString(),
        username: userData.user.username
      }))

      onSuccess(claimedCode)
      
    } catch (err) {
      console.error('领取兑换码失败:', err)
      setError(err instanceof Error ? err.message : '领取失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <button
        onClick={handleClaim}
        disabled={loading}
        className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-bold py-4 px-8 rounded-2xl text-lg transition-all duration-300 transform hover:scale-105 hover:shadow-2xl disabled:scale-100 disabled:shadow-none flex items-center space-x-3 mx-auto"
      >
        {loading ? (
          <>
            <LoadingSpinner size="md" className="border-white border-t-transparent" />
            <span>兑换码传输中...</span>
          </>
        ) : (
          <>
            <span>🎁</span>
            <span>领取我的专属兑换码</span>
          </>
        )}
      </button>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 px-4 py-3 rounded-lg">
          <div className="flex items-center space-x-2">
            <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <span>{error}</span>
          </div>
        </div>
      )}
    </div>
  )
} 