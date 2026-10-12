import Link from 'next/link'
import { getRealtimeMarketOverview, getTrendingStocks } from '@/lib/twse'
import { generateMarketOverviewAnalysis } from '@/lib/gemini'
import AutoRefresh from '@/components/AutoRefresh'
import { TrendingUp, TrendingDown, Sparkles, ArrowRight, Flame, BarChart3, Clock, Bot } from 'lucide-react'

export const revalidate = 300

export default async function DashboardPage() {
  const { isOpen, indices } = await getRealtimeMarketOverview()
  const trendingStocks = await getTrendingStocks()

  // 呼叫 OpenRouter 生成即時大盤解析
  const aiMarketAnalysis = await generateMarketOverviewAnalysis(indices)

  return (
    <div className="min-h-screen bg-black text-[#f5f5f7] p-6 md:p-12 font-sans space-y-10 max-w-7xl mx-auto">
      
      <AutoRefresh isOpen={isOpen} />

      {/* Header */}
      <section className="space-y-4 relative z-10">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold">
            <Bot className="w-3.5 h-3.5" /> TWSE 生成式 AI 市場洞察
          </div>

          <div className="flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-medium">
            <span className={`w-2 h-2 rounded-full ${isOpen ? 'bg-emerald-400 animate-pulse' : 'bg-neutral-500'}`} />
            <span className="text-neutral-300">
              {isOpen ? '盤中交易中（每 5 分鐘自動更新）' : '已收盤 / 非交易時段'}
            </span>
            <Clock className="w-3.5 h-3.5 text-neutral-500 ml-1" />
          </div>
        </div>

        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-white">
          大盤即時洞察與熱門標的
        </h1>
      </section>

      {/* 大盤指數 */}
      <section className="grid md:grid-cols-2 gap-6">
        {indices.map((item, idx) => {
          const isPositive = item.change >= 0
          return (
            <div key={idx} className="apple-card p-6 rounded-3xl space-y-4">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-neutral-400 uppercase tracking-wider">{item.name}</span>
                <span className="text-neutral-500">更新時間：{item.updateTime}</span>
              </div>
              <div className="flex items-baseline justify-between">
                <div className="text-3xl md:text-4xl font-black text-white">{item.index.toLocaleString()}</div>
                <div className={`flex items-center text-sm font-extrabold ${isPositive ? 'text-red-400' : 'text-emerald-400'}`}>
                  {isPositive ? <TrendingUp className="w-4 h-4 mr-1" /> : <TrendingDown className="w-4 h-4 mr-1" />}
                  {isPositive ? `+${item.change}` : item.change} ({item.changePercent}%)
                </div>
              </div>
            </div>
          )
        })}
      </section>

      {/* OpenRouter 生成的大盤動態 */}
      <section className="apple-card rounded-3xl p-6 border-blue-500/20 bg-blue-500/[0.02] space-y-2">
        <div className="flex items-center gap-2 text-blue-400 text-xs font-bold">
          <BarChart3 className="w-4 h-4" /> 生成式 AI 盤中即時籌碼與觀點
        </div>
        <p className="text-sm font-medium text-neutral-200 leading-relaxed">
          {aiMarketAnalysis}
        </p>
      </section>

      {/* 熱門個股 */}
      <section className="space-y-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-amber-500" />
            <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight">熱門焦點股票</h2>
          </div>
          <span className="text-xs text-neutral-400">點擊卡片啟動生成式深度分析</span>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {trendingStocks.map((stock) => {
            const isPositive = stock.change >= 0
            const volumeDisplay = stock.tradeVolume >= 10000
              ? `${(stock.tradeVolume / 10000).toFixed(2)} 萬張`
              : `${stock.tradeVolume.toLocaleString()} 股`
            return (
              <Link key={stock.symbol} href={`/research/${stock.symbol}`}>
                <div className="apple-card p-6 rounded-3xl apple-card-hover flex flex-col justify-between space-y-5 h-full group cursor-pointer">
                  
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-xs font-bold text-blue-400 bg-blue-500/10 px-2.5 py-0.5 rounded-full border border-blue-500/20">
                        {stock.symbol}
                      </span>
                      <h3 className="text-xl font-extrabold text-white mt-2 group-hover:text-blue-400 transition-colors">
                        {stock.name}
                      </h3>
                    </div>

                    <div className="text-right">
                      <div className="text-2xl font-black text-white">NT$ {stock.closingPrice}</div>
                      <div className={`text-xs font-bold ${isPositive ? 'text-red-400' : 'text-emerald-400'}`}>
                        {isPositive ? `+${stock.change}` : stock.change} ({stock.changePercent}%)
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 py-3 border-y border-white/5 text-center">
                    <div>
                      <div className="text-[10px] text-neutral-500">本益比</div>
                      <div className="text-xs font-bold text-white mt-0.5">{stock.peRatio} x</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-neutral-500">殖利率</div>
                      <div className="text-xs font-bold text-emerald-400 mt-0.5">{stock.yieldRate} %</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-neutral-500">成交量</div>
                      <div className="text-xs font-bold text-white mt-0.5">{volumeDisplay}</div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs font-semibold text-neutral-400 group-hover:text-white transition-colors">
                    <span>生成式 AI 分析</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>

                </div>
              </Link>
            )
          })}
        </div>
      </section>

    </div>
  )
}
