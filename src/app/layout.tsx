import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

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
        {/* Ultra Simple Navbar */}
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 99999,
          backgroundColor: 'white',
          borderBottom: '5px solid green',
          padding: '20px',
          fontSize: '20px',
          fontWeight: 'bold',
          color: 'black',
          textAlign: 'center',
          boxShadow: '0 5px 10px rgba(0,0,0,0.3)'
        }}>
          🌱 KRISHI MITHR - AI-POWERED AGRICULTURE 🌱
          <div style={{ marginTop: '10px', fontSize: '16px' }}>
            <a href="/" style={{ margin: '0 20px', color: 'green', textDecoration: 'none' }}>HOME</a>
            <a href="#weather" style={{ margin: '0 20px', color: 'green', textDecoration: 'none' }}>WEATHER</a>
            <a href="#soil" style={{ margin: '0 20px', color: 'green', textDecoration: 'none' }}>SOIL</a>
            <a href="#market" style={{ margin: '0 20px', color: 'green', textDecoration: 'none' }}>MARKET</a>
            <a href="#voice" style={{ margin: '0 20px', color: 'green', textDecoration: 'none' }}>VOICE</a>
            <a href="/auth/login" style={{ margin: '0 20px', color: 'green', textDecoration: 'none' }}>LOGIN</a>
            <a href="/auth/signup" style={{ margin: '0 20px', color: 'darkgreen', textDecoration: 'none', fontWeight: 'bold' }}>SIGNUP</a>
            <button 
              onClick={() => window.open('https://wa.me/7670997498?text=Hello! I need agricultural support.', '_blank')}
              style={{
                backgroundColor: 'green',
                color: 'white',
                border: 'none',
                padding: '10px 20px',
                borderRadius: '5px',
                marginLeft: '20px',
                fontSize: '16px',
                cursor: 'pointer'
              }}
            >
              WHATSAPP
            </button>
          </div>
        </div>
        
        <div style={{ paddingTop: '120px' }}>
          {children}
        </div>
      </body>
    </html>
  )
}
