'use client'

import { LoadingSpinner } from './ui/loading-spinner'

interface ClaimButtonProps {
  onClick: () => void
  loading: boolean
  error?: string
}

export function ClaimButton({ onClick, loading, error }: ClaimButtonProps) {
  return (
    <div className="space-y-4">
      <button
        onClick={onClick}
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