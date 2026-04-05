import type { Metadata } from 'next'
import { Jost, Cormorant_Garamond } from 'next/font/google'
import './globals.css'

const jost = Jost({
  subsets: ['latin', 'cyrillic'],
  weight: ['300', '400', '500'],
  variable: '--font-jost',
  display: 'swap',
})

const cormorantGaramond = Cormorant_Garamond({
  subsets: ['latin', 'cyrillic'],
  weight: ['400', '500', '600'],
  style: ['normal', 'italic'],
  variable: '--font-cormorant',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Dastarkhan — Бронирование столиков в Алматы',
  description: 'Бронируйте столики в ресторанах Алматы за секунды. Без звонков, без ожидания.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ru">
      <body className={`${jost.variable} ${cormorantGaramond.variable}`}>
        {children}
      </body>
    </html>
  )
}
