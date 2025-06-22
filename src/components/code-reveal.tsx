'use client'

import { useEffect, useState } from 'react'
import { sleep } from '@/lib/utils'

interface CodeRevealProps {
  code: string
}

export function CodeReveal({ code }: CodeRevealProps) {
  const [revealedCode, setRevealedCode] = useState('')
  const [isRevealing, setIsRevealing] = useState(true)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    const revealCode = async () => {
      setIsRevealing(true)
      setRevealedCode('')
      
      // Reveal code character by character
      for (let i = 0; i <= code.length; i++) {
        await sleep(150) // 150ms delay between each character
        setRevealedCode(code.slice(0, i))
      }
      
      setIsRevealing(false)
    }

    revealCode()
  }, [code])

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  return (
    <div className="space-y-6">
      {/* Success Message */}
      <div className="text-center">
        <div className="w-16 h-16 bg-green-500 rounded-full mx-auto flex items-center justify-center mb-4 animate-bounce">
          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          🎉 领取成功！
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          您的专属兑换码已生成
        </p>
      </div>

      {/* Code Display */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-2xl p-8 border-2 border-blue-200 dark:border-blue-800">
        <div className="text-center">
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-4">
            您的兑换码
          </p>
          
          <div className="relative">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 font-mono text-2xl font-bold text-gray-900 dark:text-white tracking-wider border-2 border-dashed border-blue-300 dark:border-blue-700">
              {isRevealing ? (
                <span className="inline-block">
                  {revealedCode}
                  <span className="animate-pulse">|</span>
                </span>
              ) : (
                <span className="select-all">{code}</span>
              )}
            </div>
            
            {/* Copy Button */}
            {!isRevealing && (
              <button
                onClick={handleCopy}
                className="absolute -bottom-4 right-4 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-2 shadow-lg"
              >
                {copied ? (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>已复制</span>
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    <span>复制</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className="text-center text-sm text-gray-600 dark:text-gray-400 space-y-2">
        <p>请保存好您的兑换码，此兑换码仅限您本人使用</p>
        <p>如有疑问，请联系客服</p>
      </div>
    </div>
  )
} 