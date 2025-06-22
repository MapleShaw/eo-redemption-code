'use client'

import { useState } from 'react'
import { gsap } from 'gsap'
import type { XUser } from '@/types/user'
import { authApi } from '@/lib/api'
import { formatUsername } from '@/lib/utils'
import { UserCard } from './user-card'
import { ConnectionLine } from './connection-line'
import { ClaimButton } from './claim-button'
import { CodeReveal } from './code-reveal'

interface LoggedInViewProps {
  user: XUser
}

export function LoggedInView({ user }: LoggedInViewProps) {
  const [claimState, setClaimState] = useState<{
    claiming: boolean
    claimed: boolean
    code?: string
    error?: string
  }>({
    claiming: false,
    claimed: false,
  })

  // KOC 信息 - 直接配置，无需环境变量
  const kocUser = {
    name: 'MapleShaw', // 替换为您的真实姓名
    username: '@msjiaozhu', // 替换为您的 X 用户名
    profile_image_url: '/koc-avatar.png', // 或者使用您的头像 URL
  }

  const handleClaim = async () => {
    if (claimState.claiming || claimState.claimed) return

    setClaimState(prev => ({ ...prev, claiming: true, error: undefined }))

    try {
      // Start animation
      const timeline = gsap.timeline()
      
      // Add your GSAP animation here for the "code transfer"
      timeline.to('.transfer-icon', {
        duration: 2,
        motionPath: {
          path: '.connection-path',
          autoRotate: true,
          alignOrigin: [0.5, 0.5],
        },
        ease: 'power2.inOut',
      })

      // Wait for animation to complete
      await new Promise(resolve => setTimeout(resolve, 2000))

      const response = await authApi.claimCode()
      
      if (response.success && response.code) {
        setClaimState({
          claiming: false,
          claimed: true,
          code: response.code,
        })
      } else {
        setClaimState({
          claiming: false,
          claimed: false,
          error: response.error || '领取失败',
        })
      }
    } catch (error) {
      console.error('Claim error:', error)
      setClaimState({
        claiming: false,
        claimed: false,
        error: error instanceof Error ? error.message : '网络错误',
      })
    }
  }

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center relative">
        {/* User Card */}
        <div className="order-2 md:order-1">
          <UserCard
            user={user}
            title="您的账号"
            className="animate-slide-up"
          />
        </div>

        {/* KOC Card */}
        <div className="order-1 md:order-2">
          <UserCard
            user={kocUser}
            title="KOC 账号"
            className="animate-slide-up"
            style={{ animationDelay: '0.2s' }}
          />
        </div>

        {/* Connection Line */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none order-3">
          <ConnectionLine />
        </div>
      </div>

      {/* Claim Section */}
      <div className="mt-12 text-center">
        {!claimState.claimed && !claimState.code && (
          <ClaimButton
            onClick={handleClaim}
            loading={claimState.claiming}
            error={claimState.error}
          />
        )}

        {claimState.code && (
          <CodeReveal code={claimState.code} />
        )}
      </div>
    </div>
  )
} 