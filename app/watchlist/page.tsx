'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Plus, ArrowUpRight, Trash2, RefreshCw, X, AlertCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { syncUserWatchlist } from '@/lib/supabase/database'

interface WatchlistItem {
  symbol: string
  name: string
  market: string
  price: string
  change: string
  isPositive: boolean
  recommendation: string
  targetPrice12M: string
  upsidePotential: number
  aiConfidence: number
  thesisText: string
}

const STORAGE_KEY = 'tw_stock_watchlist'
const DEFAULT_SYMBOLS = ['2330', '2454', '2382', '6175']

export function resolveWatchlistSymbols(raw: string | null): string[] {
  if (!raw) return DEFAULT_SYMBOLS

  try {
    const parsed = JSON.parse(raw)
    const normalized = Array.isArray(parsed)
      ? parsed
          .map((sym) => String(sym).trim().toUpperCase())
          .filter(Boolean)
          .filter((sym, index, arr) => arr.indexOf(sym) === index)
      : []

    return normalized.length > 0 ? normalized : DEFAULT_SYMBOLS
  } catch {
    return DEFAULT_SYMBOLS
  }
}

export default function WatchlistPage() {
  const [symbols, setSymbols] = useState<string[]>([])
  const [items, setItems] = useState<WatchlistItem[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [newSymbolInput, setNewSymbolInput] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    const initialSymbols = resolveWatchlistSymbols(saved)

    setSymbols(initialSymbols)
    if (!saved || JSON.stringify(initialSymbols) !== saved) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(initialSymbols))
    }
  }, [])

  useEffect(() => {
    const hasSupabaseAuth = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
    if (!hasSupabaseAuth) return

    const supabase = createClient()
    supabase.auth.getSession().then(({ data }) => {
      setUserId(data.session?.user.id ?? null)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setUserId(nextSession?.user.id ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!userId) return

    syncUserWatchlist(userId, symbols).catch((err) => {
      console.error('同步 watchlist 到 Supabase 失敗:', err)
    })
  }, [userId, symbols])

  // 直接使用專案現有的 lib 數據方法
  const fetchWatchlistData = async (symbolList: string[]) => {
    if (symbolList.length === 0) {
      setItems([])
      setLoading(false)
      return
    }

    setLoading(true)
    try {
      const promises = symbolList.map(async (sym) => {
        try {
          const res = await fetch(`/api/stock?symbol=${encodeURIComponent(sym)}`)
          if (!res.ok) throw new Error(`HTTP ${res.status}`)

          const data = await res.json()
          const closingPrice = Number(data?.currentPrice ?? data?.closingPrice ?? 0)
          const changeVal = Number(data?.change ?? 0)
          const changePercent = Number(data?.changePercent ?? 0)
          const isPositive = changeVal >= 0

          return {
            symbol: data?.symbol || sym,
            name: data?.name || sym,
            market: 'TWSE',
            price: closingPrice > 0 ? `NT$ ${closingPrice}` : 'NT$ --',
            change: `${isPositive ? '+' : ''}${changePercent.toFixed(2)}%`,
            isPositive,
            recommendation: data?.recommendation || '逢低佈局',
            targetPrice12M: data?.targetPrice12M ? `NT$ ${data.targetPrice12M}` : '--',
            upsidePotential: Number(data?.upsidePotential ?? 0),
            aiConfidence: Math.round(Number(data?.aiConfidence ?? 85)),
            thesisText: data?.catalysts?.[0] || 'AI 供應鏈動能與產業基本面追蹤中',
          } as WatchlistItem
        } catch (err) {
          console.error(`更新 ${sym} 數據失敗:`, err)
          return {
            symbol: sym,
            name: sym,
            market: 'TWSE',
            price: 'NT$ --',
            change: '0.00%',
            isPositive: true,
            recommendation: '區間觀望',
            targetPrice12M: '--',
            upsidePotential: 0,
            aiConfidence: 0,
            thesisText: '暫時無法取得行情資料，請稍後再試',
          } as WatchlistItem
        }
      })

      const results = await Promise.all(promises)
      setItems(results)
    } catch (err) {
      console.error('更新 Watchlist 數據失敗:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (symbols.length > 0) {
      fetchWatchlistData(symbols)
    }
  }, [symbols])

  const handleAddStock = (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg('')
    const code = newSymbolInput.trim().toUpperCase()

    if (!code) return
    if (symbols.includes(code)) {
      setErrorMsg('該標的已在關注清單中')
      return
    }

    const newSymbols = [...new Set([...symbols, code].map((sym) => sym.toUpperCase()))]
    setSymbols(newSymbols)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newSymbols))
    setNewSymbolInput('')
    setIsModalOpen(false)
  }

  const handleRemoveStock = (symbolToRemove: string) => {
    const newSymbols = symbols.filter((s) => s !== symbolToRemove)
    setSymbols(newSymbols.length > 0 ? newSymbols : DEFAULT_SYMBOLS)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newSymbols.length > 0 ? newSymbols : DEFAULT_SYMBOLS))
  }

  return (
    <div className="w-full min-h-screen bg-black text-white p-6 md:p-8 space-y-6">
      {/* 頂部 Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-black border border-white/10 p-6 rounded-2xl backdrop-blur-sm shadow-2xl shadow-black/40">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <span>📌</span> Watchlist 關注清單
          </h1>
          <p className="text-slate-400 text-xs mt-1">同步 Dashboard 數據：最新股價、AI 目標價與投資 Thesis</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => fetchWatchlistData(symbols)}
            disabled={loading}
            className="p-2.5 bg-black hover:bg-zinc-900 text-slate-400 hover:text-white rounded-xl border border-white/10 transition shadow-sm disabled:opacity-50"
            title="手動刷新行情"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition flex items-center gap-2 shadow-lg shadow-blue-600/20"
          >
            <Plus className="w-4 h-4" /> 新增標的
          </button>
        </div>
      </div>

      {/* 清單卡片 */}
      {loading && items.length === 0 ? (
        <div className="text-center py-20 text-slate-400 animate-pulse bg-black rounded-2xl border border-white/10">
          載入專案市場數據與估值模型中...
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-20 bg-black rounded-2xl border border-dashed border-white/10 text-slate-500">
          目前清單無任何標的，點擊「新增標的」開始追蹤。
        </div>
      ) : (
        <div className="grid gap-3">
          {items.map((item) => (
            <div
              key={item.symbol}
              className="bg-black border border-white/10 hover:border-white/20 p-5 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-all shadow-sm backdrop-blur-sm"
            >
              {/* 左側：代號、名稱、Thesis */}
              <div className="flex items-center gap-4">
                <div className="bg-black px-3 py-2 rounded-xl border border-white/10 text-center min-w-[70px]">
                  <span className="text-[10px] text-slate-500 block font-semibold">{item.market}</span>
                  <span className="text-sm font-extrabold text-white">{item.symbol}</span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-base text-slate-100">{item.name}</h3>
                    <span className={`text-xs font-semibold ${item.isPositive ? 'text-red-400' : 'text-emerald-400'}`}>
                      {item.change}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                    <span className="text-slate-500 font-medium">Thesis:</span>
                    <span className="text-slate-300">{item.thesisText}</span>
                  </p>
                </div>
              </div>

              {/* 右側：即時股價與 AI 估值欄位 */}
              <div className="flex flex-wrap items-center gap-6 w-full md:w-auto justify-between border-t md:border-t-0 border-white/10 pt-3 md:pt-0">
                <div className="text-right">
                  <div className="text-[11px] text-slate-500">最新股價</div>
                  <div className="text-sm font-bold text-slate-100">{item.price}</div>
                </div>

                <div className="text-right">
                  <div className="text-[11px] text-slate-500">12M 目標價</div>
                  <div className="text-sm font-bold text-blue-400">{item.targetPrice12M}</div>
                </div>

                <div className="text-right">
                  <div className="text-[11px] text-slate-500">潛在漲幅</div>
                  <div className={`text-xs font-bold ${item.upsidePotential >= 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                    {item.upsidePotential >= 0 ? '+' : ''}{item.upsidePotential}%
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-[11px] text-slate-500">AI 評等</div>
                  <span className={`inline-block text-[10px] font-extrabold px-2 py-0.5 rounded mt-0.5 border ${
                    item.recommendation === '強烈買進' || item.recommendation === '逢低佈局'
                      ? 'bg-red-950/50 text-red-400 border-red-800/40'
                      : item.recommendation === '分批減碼' || item.recommendation === '風險避險'
                      ? 'bg-emerald-950/50 text-emerald-400 border-emerald-800/40'
                      : 'bg-black text-slate-300 border-white/10'
                  }`}>
                    {item.recommendation}
                  </span>
                </div>

                <div className="text-right">
                  <div className="text-[11px] text-slate-500">AI 信心度</div>
                  <div className="text-xs font-bold text-slate-300">{item.aiConfidence}%</div>
                </div>

                <div className="flex items-center gap-2">
                  <Link
                    href={`/research/${item.symbol}`}
                    className="p-2 bg-black hover:bg-zinc-900 rounded-xl border border-white/10 transition text-slate-300 hover:text-white"
                    title="研報中心"
                  >
                    <ArrowUpRight className="w-4 h-4" />
                  </Link>
                  <button
                    onClick={() => handleRemoveStock(item.symbol)}
                    className="p-2 bg-black hover:bg-red-950/30 text-slate-500 hover:text-red-400 rounded-xl border border-white/10 transition"
                    title="移除股票"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 新增股票 Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-black border border-white/10 w-full max-w-md rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-white/10 pb-3">
              <h3 className="font-bold text-base text-slate-100">新增關注股票</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-500 hover:text-slate-300 transition">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddStock} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">台股代號</label>
                <input
                  type="text"
                  placeholder="例如: 2330, 6175"
                  value={newSymbolInput}
                  onChange={(e) => setNewSymbolInput(e.target.value)}
                  className="w-full bg-black border border-white/10 rounded-xl px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-blue-500 transition placeholder:text-slate-600"
                  autoFocus
                />
              </div>

              {errorMsg && (
                <div className="text-xs text-red-400 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" /> {errorMsg}
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs text-slate-400 hover:text-slate-200 font-medium transition"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-500 text-white text-xs px-4 py-2 rounded-xl font-medium transition shadow-md shadow-blue-600/20"
                >
                  加入關注
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
