'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function AutoRefresh({ isOpen }: { isOpen: boolean }) {
  const router = useRouter()

  useEffect(() => {
    // 僅在開盤時間（週一至週五 09:00 - 13:30）啟動每 5 分鐘 (300,000 ms) 定時更新
    if (!isOpen) return

    const interval = setInterval(() => {
      router.refresh()
    }, 300000)

    return () => clearInterval(interval)
  }, [isOpen, router])

  return null
}
