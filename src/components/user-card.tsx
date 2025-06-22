'use client'

import { cn } from '@/lib/utils'

interface UserCardProps {
  user: {
    name: string
    username: string
    profile_image_url: string
  }
  title: string
  className?: string
  style?: React.CSSProperties
}

export function UserCard({ user, title, className, style }: UserCardProps) {
  return (
    <div 
      className={cn(
        "bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 text-center transform transition-all duration-300 hover:scale-105",
        className
      )}
      style={style}
    >
      <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-4">
        {title}
      </h3>
      
      <div className="mb-4">
        <img
          src={user.profile_image_url}
          alt={`${user.name}的头像`}
          className="w-20 h-20 rounded-full mx-auto object-cover border-4 border-blue-100 dark:border-blue-900"
          onError={(e) => {
            const target = e.target as HTMLImageElement
            target.src = '/default-avatar.png'
          }}
        />
      </div>
      
      <div>
        <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
          {user.name}
        </h4>
        <p className="text-gray-600 dark:text-gray-400">
          {user.username}
        </p>
      </div>
    </div>
  )
} 