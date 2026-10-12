'use client'

import { useState } from 'react'
import { Sparkles, BarChart3, Loader2 } from 'lucide-react'

export default function MarketAiSection() {
  const [analysis, setAnalysis] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleFetchMarketAi = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'market' }),
      })
      const data = await res.json()
      if (data.success) {
        setAnalysis(data.analysis)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="apple-card rounded-3xl p-6 border-blue-500/20 bg-blue-500/[0.02] flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
      <div className="space-y-1 flex-1">
        <div className="flex items-center gap-2 text-blue-400 text-xs font-bold">
          <BarChart3 className="w-4 h-4" /> 生成式 AI 整理盤中觀點
        </div>
        <p className="text-sm font-medium text-neutral-200 leading-relaxed">
          {analysis || '點擊右側按鈕，讓生成式 AI 整理今日 TWSE 大盤走勢與即時盤中總結。'}
        </p>
      </div>

      <button
        onClick={handleFetchMarketAi}
        disabled={loading}
        className="px-4 py-2 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 text-blue-400 text-xs font-bold flex items-center gap-2 shrink-0 cursor-pointer disabled:opacity-50"
      >
        {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
        <span>{analysis ? '更新整理' : '整理大盤觀點'}</span>
      </button>
    </section>
  )
}
