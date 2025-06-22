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
            onSuccess={(code) => {
              setClaimState({
                claiming: false,
                claimed: true,
                code: code,
              })
            }}
          />
        )}

        {claimState.code && (
          <CodeReveal code={claimState.code} />
        )}
      </div>
    </div>
  )
} 