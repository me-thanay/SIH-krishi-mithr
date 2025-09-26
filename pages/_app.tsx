import '../src/app/globals.css'
import type { AppProps } from 'next/app'
import { AuthProvider } from '../src/contexts/AuthContext'

export default function App({ Component, pageProps }: AppProps) {
  return (
    <AuthProvider>
      <Component {...pageProps} />
    </AuthProvider>
  )
}
