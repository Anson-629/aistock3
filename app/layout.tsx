import type { Metadata } from 'next'
import './globals.css'
import Navbar from '@/components/Navbar'
import AiBotPanel from '@/components/AiBotPanel'

export const metadata: Metadata = {
  title: 'AlphaResearch - TWSE AI 股票研究決策平台',
  description: '整合 TWSE 即時資料與 AI 自動化研報生成系統',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-TW" className="dark">
      <body className="bg-black text-[#f5f5f7] antialiased min-h-screen flex flex-col font-sans">
        <Navbar />
        <main className="flex-1">{children}</main>
        <AiBotPanel />
      </body>
    </html>
  )
}
