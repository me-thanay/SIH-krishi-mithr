import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { SmartAgriTechNavbar } from '@/components/ui/smart-agritech-navbar'

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
        <SmartAgriTechNavbar />
        <div className="pt-20">
          {children}
        </div>
      </body>
    </html>
  )
}
