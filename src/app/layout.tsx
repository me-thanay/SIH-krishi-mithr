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
        {/* Simple Inline Navbar */}
        <nav style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 1000,
          backgroundColor: '#ffffff',
          borderBottom: '2px solid #16a34a',
          padding: '1rem 0',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <div style={{
            maxWidth: '1200px',
            margin: '0 auto',
            padding: '0 1rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            {/* Logo */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{
                width: '32px',
                height: '32px',
                backgroundColor: '#16a34a',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: '18px'
              }}>
                🌱
              </div>
              <div>
                <h1 style={{ margin: 0, fontSize: '20px', fontWeight: 'bold', color: '#1f2937' }}>
                  Krishi Mithr
                </h1>
                <p style={{ margin: 0, fontSize: '12px', color: '#6b7280' }}>
                  AI-Powered Agriculture
                </p>
              </div>
            </div>

            {/* Navigation Items */}
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <a href="/" style={{ color: '#374151', textDecoration: 'none', fontWeight: '500' }}>Home</a>
              <a href="#weather" style={{ color: '#374151', textDecoration: 'none', fontWeight: '500' }}>Weather</a>
              <a href="#soil" style={{ color: '#374151', textDecoration: 'none', fontWeight: '500' }}>Soil</a>
              <a href="#market" style={{ color: '#374151', textDecoration: 'none', fontWeight: '500' }}>Market</a>
              <a href="#voice" style={{ color: '#374151', textDecoration: 'none', fontWeight: '500' }}>Voice</a>
              <button 
                onClick={() => window.open('https://wa.me/7670997498?text=Hello! I need agricultural support.', '_blank')}
                style={{
                  backgroundColor: '#16a34a',
                  color: 'white',
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: '8px',
                  fontWeight: '500',
                  cursor: 'pointer'
                }}
              >
                WhatsApp
              </button>
            </div>
          </div>
        </nav>
        
        <div style={{ paddingTop: '80px' }}>
          {children}
        </div>
      </body>
    </html>
  )
}
