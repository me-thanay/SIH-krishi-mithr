import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/contexts/AuthContext'
import dynamic from 'next/dynamic'

// Load navbar client-side to use client-only hooks safely
const NewNavbar = dynamic(() => import('@/components/ui/new-navbar'), { ssr: false })
import { FloatingActionButtons } from '@/components/ui/floating-action-buttons'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Krishi Mithr - AI-Powered Agriculture Platform',
  description: 'Revolutionizing agriculture with AI-powered insights, real-time monitoring, and intelligent recommendations for modern farmers.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          <NewNavbar />
          {children}
          <FloatingActionButtons />
        </AuthProvider>
      </body>
    </html>
  )
}
