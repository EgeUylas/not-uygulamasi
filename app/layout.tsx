import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import ClientThemeProvider from '../components/ClientThemeProvider'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Not Uygulaması',
  description: 'Notlarınızı organize edin ve yönetin',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="tr" suppressHydrationWarning>
      <body className={inter.className}>
        <ClientThemeProvider>
          {children}
        </ClientThemeProvider>
      </body>
    </html>
  )
}
