'use client'

import { useEffect, useState } from 'react'
import type { AuthCheckResponse } from '@/types/user'
import { authApi } from '@/lib/api'
import { LoginView } from './login-view'
import { LoggedInView } from './logged-in-view'
import { LoadingSpinner } from './ui/loading-spinner'

export function AuthChecker() {
  const [authState, setAuthState] = useState<{
    loading: boolean
    loggedIn: boolean
    user?: AuthCheckResponse['user']
    error?: string
  }>({
    loading: true,
    loggedIn: false,
  })

  useEffect(() => {
    checkAuthStatus()
  }, [])

  const checkAuthStatus = async () => {
    try {
      setAuthState(prev => ({ ...prev, loading: true, error: undefined }))
      const response = await authApi.checkAuth()
      
      setAuthState({
        loading: false,
        loggedIn: response.loggedIn,
        user: response.user,
        error: undefined,
      })
    } catch (error) {
      console.error('Auth check error:', error)
      setAuthState({
        loading: false,
        loggedIn: false,
        error: error instanceof Error ? error.message : '检查登录状态失败',
      })
    }
  }

  if (authState.loading) {
    return (
      <div className="w-full max-w-md mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 text-center">
          <LoadingSpinner className="mx-auto mb-4" size="lg" />
          <p className="text-gray-600 dark:text-gray-400">正在检查登录状态...</p>
        </div>
      </div>
    )
  }

  if (authState.error) {
    return (
      <div className="w-full max-w-md mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 text-center">
          <div className="text-red-500 mb-4">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.232 13.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            检查登录状态失败
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {authState.error}
          </p>
          <button
            onClick={checkAuthStatus}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            重试
          </button>
        </div>
      </div>
    )
  }

  if (authState.loggedIn && authState.user) {
    return <LoggedInView user={authState.user} />
  }

  return <LoginView />
} 