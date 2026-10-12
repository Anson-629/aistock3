'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Search, Sparkles, TrendingUp, BookOpen, Bell, CreditCard, LayoutDashboard, Settings } from 'lucide-react'

export default function Navbar() {
  const pathname = usePathname()
  const router = useRouter()
  const [searchSymbol, setSearchSymbol] = useState('')

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchSymbol.trim()) {
      router.push(`/research/${searchSymbol.trim().toUpperCase()}`)
      setSearchSymbol('')
    }
  }

  const navItems = [
    { name: '儀表板', href: '/', icon: LayoutDashboard },
    { name: '關注清單', href: '/watchlist', icon: TrendingUp },
    { name: '設定', href: '/settings', icon: Settings },
    { name: '方案升級', href: '/pricing', icon: CreditCard },
  ]

  return (
    <header className="sticky top-0 z-50 w-full backdrop-blur-xl bg-black/60 border-b border-white/10 px-4 md:px-8 py-3 transition-all">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        
        {/* Brand Logo - 點擊回到 Dashboard */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-black text-sm shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-transform">
            AI
          </div>
          <span className="font-extrabold text-base tracking-tight text-white hidden sm:inline-block">
            AlphaResearch <span className="text-xs font-normal text-blue-400">TWSE</span>
          </span>
        </Link>

        {/* 搜尋框 - 可搜尋任意台股代號 */}
        <form onSubmit={handleSearch} className="relative flex-1 max-w-xs md:max-w-sm">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            value={searchSymbol}
            onChange={(e) => setSearchSymbol(e.target.value)}
            placeholder="搜尋台股代號 (如: 2330, 2454)..."
            className="w-full bg-white/5 hover:bg-white/10 focus:bg-black border border-white/10 focus:border-blue-500 rounded-full pl-9 pr-4 py-1.5 text-xs text-white placeholder-neutral-500 focus:outline-none transition-all"
          />
        </form>

        {/* 選單列表 */}
        <nav className="hidden lg:flex items-center gap-1 bg-white/5 p-1 rounded-full border border-white/10">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30 font-semibold'
                    : 'text-neutral-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {item.name}
              </Link>
            )
          })}
        </nav>

      </div>
    </header>
  )
}
