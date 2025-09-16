import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { FloatingAssistant } from '@/components/ui/floating-assistant'
import { DebugNavbar } from '@/components/ui/debug-navbar'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Smart AgriTech - AI-Powered Agriculture Platform',
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
        <DebugNavbar />
        <div className="pt-16">
          {children}
        </div>
        <FloatingAssistant />
      </body>
    </html>
  )
}
