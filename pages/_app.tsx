import '../src/app/globals.css'
import type { AppProps } from 'next/app'
import { Kantumruy_Pro } from 'next/font/google'
import { AuthProvider } from '../src/contexts/AuthContext'

const kantumruy = Kantumruy_Pro({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  variable: '--font-kanturmuy',
})

export default function App({ Component, pageProps }: AppProps) {
  return (
    <div className={kantumruy.variable}>
      <AuthProvider>
        <Component {...pageProps} />
      </AuthProvider>
    </div>
  )
}
