import { getTwseStockInfo } from '@/lib/twse'
import StockAiAnalysisSection from '@/components/research/StockAiAnalysisSection'
import FinancialChart from '@/components/charts/FinancialChart'

import ValuationSection from '@/components/research/StockPredictionPanel'
import { TrendingUp, TrendingDown } from 'lucide-react'

export const revalidate = 300

export default async function ResearchReportPage({
  params,
}: {
  params: Promise<{ symbol: string }>
}) {
  const resolvedParams = await params
  const symbol = (resolvedParams?.symbol || '2330').toUpperCase()

  // 1. 抓取 TWSE 即時資料
  const stock = await getTwseStockInfo(symbol)
  const isPositive = stock.change >= 0
  const volumeDisplay = stock.tradeVolume >= 10000
    ? `${(stock.tradeVolume / 10000).toFixed(2)} 萬張`
    : `${stock.tradeVolume.toLocaleString()} 股`

  return (
    <div className="min-h-screen bg-black text-[#f5f5f7] p-6 md:p-12 font-sans space-y-10 max-w-6xl mx-auto">
      
      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-white/10 pb-8">
        <div className="space-y-2">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-white flex items-center gap-3">
            {stock.symbol} <span className="text-white/90">{stock.name}</span>
          </h1>
          <p className="text-neutral-400 text-xs font-medium">即時更新：{stock.updateTime} • 來源：TWSE 證交所 API</p>
        </div>

        <div className="apple-card px-5 py-3 rounded-2xl flex items-center gap-4">
          <div>
            <div className="text-[10px] font-bold text-neutral-400 uppercase">TWSE 即時價</div>
            <div className="text-2xl font-black text-white">NT$ {stock.closingPrice}</div>
          </div>
          <div className={`flex items-center text-xs font-bold ${isPositive ? 'text-red-400' : 'text-emerald-400'}`}>
            {isPositive ? <TrendingUp className="w-4 h-4 mr-0.5" /> : <TrendingDown className="w-4 h-4 mr-0.5" />}
            {isPositive ? `+${stock.change}` : stock.change} ({stock.changePercent}%)
          </div>
        </div>
      </header>

      {/* 基本面指標 */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="apple-card p-4 rounded-2xl space-y-1">
          <div className="text-xs text-neutral-400 font-medium">本益比 (P/E)</div>
          <div className="text-xl font-bold text-white">{stock.peRatio > 0 ? `${stock.peRatio} x` : '--'}</div>
        </div>
        <div className="apple-card p-4 rounded-2xl space-y-1">
          <div className="text-xs text-neutral-400 font-medium">殖利率 (Yield)</div>
          <div className="text-xl font-bold text-emerald-400">{stock.yieldRate > 0 ? `${stock.yieldRate} %` : '--'}</div>
        </div>
        <div className="apple-card p-4 rounded-2xl space-y-1">
          <div className="text-xs text-neutral-400 font-medium">股價淨值比 (P/B)</div>
          <div className="text-xl font-bold text-white">{stock.pbRatio > 0 ? `${stock.pbRatio} x` : '--'}</div>
        </div>
        <div className="apple-card p-4 rounded-2xl space-y-1">
          <div className="text-xs text-neutral-400 font-medium">成交量 (股)</div>
          <div className="text-xl font-bold text-white">{volumeDisplay}</div>
        </div>
      </section>

      {/* 按鈕觸發式 OpenRouter AI 分析 */}
      <StockAiAnalysisSection stock={stock} />

      {/* 動態 TWSE 技術走勢與成交量圖表 */}
      <FinancialChart symbol={stock.symbol} />

      {/* 動態本益比河流圖與估值階梯 */}
      <ValuationSection symbol={stock.symbol} />

    </div>
  )
}
