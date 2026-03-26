import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Ad Swipe — Meta Ad Library Intelligence',
  description: 'Discover, analyze and save winning ads from Meta Ad Library with spend estimates, performance scores, and pixel detection.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
