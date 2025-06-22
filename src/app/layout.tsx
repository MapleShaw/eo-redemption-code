import type { Metadata } from 'next'
import { APP_CONFIG } from '@/lib/constants'
import './globals.css'

export const metadata: Metadata = {
  title: APP_CONFIG.name,
  description: APP_CONFIG.description,
  keywords: ['X', 'Twitter', '兑换码', 'KOC', '粉丝专属'],
  authors: [{ name: 'EdgeOne Pages' }],
  creator: 'EdgeOne Pages',
  publisher: 'EdgeOne Pages',
  robots: {
    index: false,
    follow: false,
  },
  viewport: 'width=device-width, initial-scale=1',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN">
      <body className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        <div className="min-h-screen flex flex-col">
          <header className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700">
            <div className="container mx-auto px-4 py-4">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white text-center">
                {APP_CONFIG.name}
              </h1>
            </div>
          </header>
          
          <main className="flex-1 flex items-center justify-center p-4">
            {children}
          </main>
          
          <footer className="bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm border-t border-gray-200 dark:border-gray-700 py-4">
            <div className="container mx-auto px-4 text-center text-sm text-gray-600 dark:text-gray-400">
              <p>Powered by EdgeOne Pages</p>
            </div>
          </footer>
        </div>
      </body>
    </html>
  )
} 