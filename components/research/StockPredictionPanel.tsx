'use client'

import { useState, useEffect } from 'react'
import { PriceEstimation } from '@/lib/twse'
import { Bot, ShieldAlert, Target, AlertTriangle, CheckCircle2, Loader2, Cpu, RefreshCw } from 'lucide-react'

export default function StockPredictionPanel({ symbol }: { symbol: string }) {
  const [est, setEst] = useState<PriceEstimation | null>(null)
  const [loading, setLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const fetchEstimation = async () => {
    setLoading(true)
    setErrorMsg(null)

    try {
      // 呼叫自己的 Next.js API Route，避免瀏覽器 CORS 跨域限制
      const res = await fetch(`/api/stock?symbol=${encodeURIComponent(symbol)}`)
      if (!res.ok) throw new Error(`HTTP Error: ${res.status}`)
      
      const data: PriceEstimation = await res.json()
      setEst(data)
    } catch (err) {
      console.error('Fetch Estimation Error:', err)
      setErrorMsg('連線異常，無法取得數據')
    } finally {
      // 確保無論成功或失敗都會關閉 Loading 轉圈
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchEstimation()
  }, [symbol])

  // 1. 載入中狀態
  if (loading) {
    return (
      <div className="apple-card rounded-3xl p-12 text-center space-y-4">
        <div className="relative w-10 h-10 mx-auto">
          <Cpu className="w-10 h-10 text-purple-400 animate-pulse" />
          <Loader2 className="w-10 h-10 text-blue-400 animate-spin absolute inset-0 opacity-40" />
        </div>
        <p className="text-xs text-neutral-300 font-medium">
          正在從 TWSE 證交所抓取 {symbol} 即時行情，並由生成式 AI 整理估值推演...
        </p>
      </div>
    )
  }

  // 2. 失敗或無數據狀態
  if (errorMsg || !est || est.currentPrice === 0) {
    return (
      <div className="apple-card rounded-3xl p-8 text-center space-y-4 border border-rose-500/20 bg-rose-500/5">
        <AlertTriangle className="w-10 h-10 text-rose-400 mx-auto" />
        <div className="space-y-1">
          <h4 className="text-base font-bold text-white">暫時無法取得 {symbol} 行情數據</h4>
          <p className="text-xs text-neutral-400">
            {errorMsg || '證交所 API 忙碌或非交易時段連線逾時，請稍後再試。'}
          </p>
        </div>
        <button
          onClick={fetchEstimation}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold text-white transition-all"
        >
          <RefreshCw className="w-3.5 h-3.5" /> 重新嘗試連線
        </button>
      </div>
    )
  }

  // 3. 正常計算與渲染
  const minVal = est.cheapPrice * 0.9
  const maxVal = est.expensivePrice * 1.1
  const pricePercent = maxVal > minVal 
    ? Math.min(Math.max(((est.currentPrice - minVal) / (maxVal - minVal)) * 100, 5), 95)
    : 50

  const recColorMap: Record<string, string> = {
    '強烈買進': 'bg-rose-500/20 text-rose-400 border-rose-500/30',
    '逢低佈局': 'bg-rose-500/20 text-rose-400 border-rose-500/30',
    '區間觀望': 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    '分批減碼': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    '風險避險': 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  }

  const recClass = recColorMap[est.recommendation] || 'bg-neutral-500/20 text-neutral-300 border-neutral-500/30'

  return (
    <div className="space-y-6">
      <div className="apple-card rounded-3xl p-6 md:p-8 space-y-8 relative overflow-hidden">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-white/10 pb-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-purple-400">
              <Bot className="w-4 h-4" /> {est.aiModelName}
            </div>
            <h3 className="text-2xl font-black text-white mt-1">
              {est.name} ({est.symbol}) 生成式 AI 整理估值與目標價推演
            </h3>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] bg-purple-500/20 text-purple-300 px-3 py-1 rounded-full border border-purple-500/30 font-bold">
              生成式 AI 信心度: {est.aiConfidence}%
            </span>
            <div className={`px-4 py-1.5 rounded-full border text-xs font-bold flex items-center gap-1.5 ${recClass}`}>
              <Target className="w-4 h-4" /> {est.recommendation}
            </div>
          </div>
        </div>

        {/* 6M / 12M 目標價 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white/[0.03] p-5 rounded-2xl border border-white/5 space-y-1">
            <span className="text-xs text-neutral-400 font-bold">TWSE 即時成交價</span>
            <div className="text-2xl font-black text-white">
              NT$ {est.currentPrice.toLocaleString()}
            </div>
            <span className="text-[10px] text-neutral-500">證交所即時 API 錨點</span>
          </div>

          <div className="bg-white/[0.03] p-5 rounded-2xl border border-white/5 space-y-1">
            <span className="text-xs text-neutral-400 font-bold">生成式 AI 6 個月預估目標</span>
            <div className="text-2xl font-black text-blue-400">
              NT$ {est.targetPrice6M.toLocaleString()}
            </div>
            <span className="text-[10px] text-blue-400/70 font-medium">中短期波段估值</span>
          </div>

          <div className="bg-white/[0.03] p-5 rounded-2xl border border-white/5 space-y-1">
            <span className="text-xs text-neutral-400 font-bold">生成式 AI 12 個月預估目標</span>
            <div className="text-2xl font-black flex items-center gap-2">
              <span className={est.upsidePotential >= 0 ? 'text-rose-400' : 'text-emerald-400'}>
                NT$ {est.targetPrice12M.toLocaleString()}
              </span>
              <span className={`text-xs font-bold px-2 py-0.5 rounded-md ${est.upsidePotential >= 0 ? 'bg-rose-500/20 text-rose-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                {est.upsidePotential >= 0 ? `+${est.upsidePotential}%` : `${est.upsidePotential}%`}
              </span>
            </div>
            <span className="text-[10px] text-neutral-500">長線價值中樞</span>
          </div>
        </div>

        {/* 估值三關點位 */}
        <div className="space-y-3 bg-white/[0.02] p-6 rounded-2xl border border-white/5">
          <div className="flex justify-between items-center text-xs font-bold text-neutral-300">
            <span>生成式 AI 價值位階分佈 (Valuation Bands)</span>
            <span className="text-neutral-500 text-[11px]">{est.valuationMethod}</span>
          </div>

          <div className="relative pt-6 pb-2">
            <div className="h-3 rounded-full bg-gradient-to-r from-emerald-500/80 via-blue-500/80 to-rose-500/80 w-full" />
            <div
              className="absolute top-0 transition-all duration-500 flex flex-col items-center"
              style={{ left: `${pricePercent}%`, transform: 'translateX(-50%)' }}
            >
              <span className="text-[10px] font-black bg-white text-black px-2 py-0.5 rounded-full shadow-lg whitespace-nowrap">
                現價 ${est.currentPrice.toLocaleString()}
              </span>
              <div className="w-0.5 h-4 bg-white mt-0.5" />
            </div>
          </div>

          <div className="flex justify-between text-xs font-medium text-neutral-400 pt-1">
            <div className="text-left">
              <div className="text-emerald-400 font-bold">便宜價 ${est.cheapPrice.toLocaleString()}</div>
              <div className="text-[10px] text-neutral-500">安全邊際買點</div>
            </div>

            <div className="text-center">
              <div className="text-blue-400 font-bold">合理價 ${est.fairPrice.toLocaleString()}</div>
              <div className="text-[10px] text-neutral-500">價值中樞點</div>
            </div>

            <div className="text-right">
              <div className="text-rose-400 font-bold">昂貴價 ${est.expensivePrice.toLocaleString()}</div>
              <div className="text-[10px] text-neutral-500">警戒賣點區</div>
            </div>
          </div>
        </div>

        {/* 利多與風險 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" /> 生成式 AI 整理利多催化劑
            </h4>
            <ul className="space-y-1.5 text-xs text-neutral-300">
              {est.catalysts.map((item, idx) => (
                <li key={idx} className="bg-white/[0.02] p-2.5 rounded-xl border border-white/5 flex items-start gap-2">
                  <span className="text-emerald-400 font-bold">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-2">
            <h4 className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4" /> 生成式 AI 整理潛在風險
            </h4>
            <ul className="space-y-1.5 text-xs text-neutral-300">
              {est.risks.map((item, idx) => (
                <li key={idx} className="bg-white/[0.02] p-2.5 rounded-xl border border-white/5 flex items-start gap-2">
                  <span className="text-amber-400 font-bold">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* 風險與免責聲明 Banner */}
      <div className="bg-amber-500/10 border border-amber-500/30 rounded-3xl p-5 md:p-6 text-amber-200/90 space-y-2 shadow-lg backdrop-blur-md">
        <div className="flex items-center gap-2 font-bold text-amber-400 text-sm">
          <ShieldAlert className="w-5 h-5 shrink-0" />
          <span>【重要提醒】股市投資風險與免責聲明</span>
        </div>
        <p className="text-xs leading-relaxed text-amber-200/80 pl-7 whitespace-pre-line">
          {est.disclaimer}
        </p>
      </div>
    </div>
  )
}
