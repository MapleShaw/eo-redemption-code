'use client'

import { LoginButton } from './LoginButton'
import { APP_CONFIG } from '@/lib/constants'

export function LoginView() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 text-center">
          <div className="mb-6">
            <img 
              src="/koc-avatar.png" 
              alt="KOC Avatar" 
              className="w-20 h-20 rounded-full mx-auto mb-4 border-4 border-blue-100"
              onError={(e) => {
                e.currentTarget.src = 'https://via.placeholder.com/80/3B82F6/FFFFFF?text=KOC'
              }}
            />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              {APP_CONFIG.name}
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {APP_CONFIG.description}
            </p>
          </div>

          <LoginButton />

          <p className="text-xs text-gray-500 dark:text-gray-400 mt-6">
            使用您的 X 账号登录，即可领取专属兑换码
          </p>
        </div>
      </div>
    </div>
  )
} 