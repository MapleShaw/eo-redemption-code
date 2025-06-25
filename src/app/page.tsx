'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { LoginView } from '@/components/login-view'
import { APP_CONFIG } from '@/lib/constants'

interface XUser {
  id: string
  name: string
  username: string
  profile_image_url?: string
}

interface UserData {
  user: XUser
  timestamp: number
}

export default function HomePage() {
  const [isLoading, setIsLoading] = useState(true)
  const [userData, setUserData] = useState<UserData | null>(null)
  const router = useRouter()

  useEffect(() => {
    const checkAuth = () => {
      try {
        const storedData = sessionStorage.getItem('eo_user_data')
        if (storedData) {
          const data: UserData = JSON.parse(storedData)
          
          // 检查数据是否过期（24小时）
          const isExpired = Date.now() - data.timestamp > 24 * 60 * 60 * 1000
          if (!isExpired) {
            setUserData(data)
            // 如果已经认证，直接跳转到成功页面
            router.push('/success')
            return
          } else {
            sessionStorage.removeItem('eo_user_data')
          }
        }
        
        setUserData(null)
      } catch (error) {
        console.error('检查认证状态失败:', error)
        setUserData(null)
      } finally {
        setIsLoading(false)
      }
    }

    checkAuth()
  }, [router])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  // 如果未认证，显示登录视图
  return <LoginView />
} 