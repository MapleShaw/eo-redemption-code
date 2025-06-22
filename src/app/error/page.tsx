'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { ERROR_REASONS } from '@/lib/constants'

function ErrorContent() {
  const searchParams = useSearchParams()
  const reason = searchParams.get('reason')
  const detail = searchParams.get('detail')

  const getErrorMessage = (reason: string | null): { title: string; message: string; icon: string } => {
    switch (reason) {
      case ERROR_REASONS.notFollower:
        return {
          title: '需要关注 KOC',
          message: '您需要先关注指定的 KOC 账号才能领取兑换码',
          icon: '👥'
        }
      case ERROR_REASONS.alreadyClaimed:
        return {
          title: '已经领取过了',
          message: '您已经领取过兑换码了，每个账号只能领取一次',
          icon: '✅'
        }
      case ERROR_REASONS.noCodesLeft:
        return {
          title: '兑换码已领完',
          message: '很抱歉，兑换码已经全部被领取完了',
          icon: '📦'
        }
      case ERROR_REASONS.authError:
        return {
          title: '认证失败',
          message: '登录过程中出现了问题，请重试',
          icon: '🔐'
        }
      default:
        return {
          title: '出现了问题',
          message: '请稍后重试或联系客服',
          icon: '❌'
        }
    }
  }

  const errorInfo = getErrorMessage(reason)

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 text-center">
        <div className="text-6xl mb-4">{errorInfo.icon}</div>
        
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          {errorInfo.title}
        </h2>
        
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          {errorInfo.message}
        </p>

        {detail && (
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-6">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              详细信息: {decodeURIComponent(detail)}
            </p>
          </div>
        )}

        <div className="space-y-3">
          <button
            onClick={() => window.location.href = '/'}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 px-6 rounded-xl transition-colors"
          >
            返回首页
          </button>
          
          {reason === ERROR_REASONS.notFollower && (
            <button
              onClick={() => window.open('https://x.com', '_blank')}
              className="w-full bg-gray-500 hover:bg-gray-600 text-white font-semibold py-3 px-6 rounded-xl transition-colors"
            >
              前往 X 关注 KOC
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default function ErrorPage() {
  return (
    <Suspense fallback={
      <div className="w-full max-w-md mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">加载中...</p>
        </div>
      </div>
    }>
      <ErrorContent />
    </Suspense>
  )
}
