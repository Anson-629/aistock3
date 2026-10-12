'use client'

import { useState, useEffect, useMemo } from 'react'
import { getStockPriceHistory, CandlePoint } from '@/lib/twse'
import { TrendingUp, BarChart2, Loader2, Calendar } from 'lucide-react'

interface StockChartProps {
  symbol: string
}

export default function StockChart({ symbol }: StockChartProps) {
  const [timeframe, setTimeframe] = useState<'5D' | '1M' | '3M'>('1M')
  const [data, setData] = useState<CandlePoint[]>([])
  const [loading, setLoading] = useState(true)
  const [hoverPoint, setHoverPoint] = useState<CandlePoint | null>(null)

  useEffect(() => {
    let isMounted = true
    setLoading(true)
    
    // 呼叫 TWSE 歷史行情 API
    getStockPriceHistory(symbol, timeframe).then((res) => {
      if (isMounted) {
        setData(res)
        setHoverPoint(null)
        setLoading(false)
      }
    })
    return () => { isMounted = false }
  }, [symbol, timeframe])

  // 計算 5 日與 20 日算術平均線 (MA5 / MA20)
  const chartData = useMemo(() => {
    return data.map((item, idx, arr) => {
      const ma5 = idx >= 4 
        ? arr.slice(idx - 4, idx + 1).reduce((acc, curr) => acc + curr.close, 0) / 5 
        : null
      const ma20 = idx >= 19 
        ? arr.slice(idx - 19, idx + 1).reduce((acc, curr) => acc + curr.close, 0) / 20 
        : null
      return { ...item, ma5, ma20 }
    })
  }, [data])

  // 計算繪圖範圍 (Min / Max)
  const { minPrice, maxPrice, maxVolume } = useMemo(() => {
    if (chartData.length === 0) return { minPrice: 0, maxPrice: 100, maxVolume: 100 }
    let minP = Math.min(...chartData.map((d) => d.low))
    let maxP = Math.max(...chartData.map((d) => d.high))
    const maxV = Math.max(...chartData.map((d) => d.volume))
    
    // 留出上下 5% 緩衝邊界
    const padding = (maxP - minP) * 0.08 || 5
    return {
      minPrice: minP - padding,
      maxPrice: maxP + padding,
      maxVolume: maxV || 1,
    }
  }, [chartData])

  // 當前顯示的焦點資料 (Hover 時顯示 Hover 點，否則顯示最新一筆)
  const currentDisplay = hoverPoint || chartData[chartData.length - 1]

  if (loading) {
    return (
      <div className="apple-card rounded-3xl p-12 text-center h-[420px] flex flex-col items-center justify-center space-y-3">
        <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
        <span className="text-xs text-neutral-400 font-medium">繪製高階 K 線走勢圖中...</span>
      </div>
    )
  }

  if (chartData.length === 0) {
    return (
      <div className="apple-card rounded-3xl p-12 text-center h-[420px] flex items-center justify-center text-neutral-500 text-xs">
        暫無走勢圖歷史數據
      </div>
    )
  }

  // 繪圖區域尺寸常數
  const svgWidth = 800
  const priceHeight = 220
  const volumeHeight = 60
  const gap = 20
  const totalSvgHeight = priceHeight + gap + volumeHeight

  // 座標轉換映射函數
  const getY = (price: number) => 
    priceHeight - ((price - minPrice) / (maxPrice - minPrice)) * priceHeight

  const getVolY = (vol: number) => 
    totalSvgHeight - (vol / maxVolume) * volumeHeight

  const barWidth = Math.max((svgWidth / chartData.length) * 0.55, 4)

  return (
    <div className="apple-card rounded-3xl p-6 md:p-8 space-y-6 relative overflow-hidden bg-neutral-900/60 backdrop-blur-xl border border-white/10 shadow-2xl">
      
      {/* 1. Header 與時間切換鈕 */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-neutral-400">
            <TrendingUp className="w-4 h-4 text-rose-400" /> 技術 K 線與成交量走勢
          </div>
          
          {/* 即時 OHLC 指標資訊 */}
          {currentDisplay && (
            <div className="flex items-center gap-3 mt-2 flex-wrap text-xs">
              <span className="text-neutral-400 font-mono flex items-center gap-1">
                <Calendar className="w-3 h-3 text-purple-400" /> {currentDisplay.date}
              </span>
              <span className="text-neutral-400">開 <strong className="text-white">{currentDisplay.open}</strong></span>
              <span className="text-neutral-400">高 <strong className="text-rose-400">{currentDisplay.high}</strong></span>
              <span className="text-neutral-400">低 <strong className="text-emerald-400">{currentDisplay.low}</strong></span>
              <span className="text-neutral-400">收 <strong className="text-white">{currentDisplay.close}</strong></span>
              <span className="text-neutral-400">量 <strong className="text-amber-300">{currentDisplay.volume.toLocaleString()} 張</strong></span>
            </div>
          )}
        </div>

        {/* 時間軸切換 (5D / 1M / 3M) */}
        <div className="flex items-center bg-white/5 p-1 rounded-xl border border-white/10 self-end sm:self-auto">
          {(['5D', '1M', '3M'] as const).map((tf) => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                timeframe === tf
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/30'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              {tf}
            </button>
          ))}
        </div>
      </div>

      {/* 2. 均線圖例說明 (MA Legend) */}
      <div className="flex items-center gap-4 text-[11px] font-mono border-t border-white/5 pt-3">
        <span className="flex items-center gap-1.5 text-amber-300 font-bold">
          <span className="w-2.5 h-0.5 bg-amber-300 rounded-full" /> MA5
        </span>
        <span className="flex items-center gap-1.5 text-blue-400 font-bold">
          <span className="w-2.5 h-0.5 bg-blue-400 rounded-full" /> MA20
        </span>
        <span className="flex items-center gap-1.5 text-rose-500/80 font-medium">
          <span className="w-2 h-2 rounded-full bg-rose-500" /> 上漲 (陽線)
        </span>
        <span className="flex items-center gap-1.5 text-emerald-500/80 font-medium">
          <span className="w-2 h-2 rounded-full bg-emerald-500" /> 下跌 (陰線)
        </span>
      </div>

      {/* 3. SVG 主圖表區域 */}
      <div className="relative w-full overflow-x-auto touch-pan-x">
        <svg
          viewBox={`0 0 ${svgWidth} ${totalSvgHeight}`}
          className="w-full h-auto min-w-[600px] overflow-visible"
          onMouseLeave={() => setHoverPoint(null)}
        >
          <defs>
            {/* 上漲陽線霓虹發光效果 */}
            <filter id="glow-rose" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor="#f43f5e" floodOpacity="0.3" />
            </filter>
            {/* 下跌陰線綠色發光效果 */}
            <filter id="glow-emerald" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor="#10b981" floodOpacity="0.3" />
            </filter>
          </defs>

          {/* 背景橫向參考網格線 */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
            const y = priceHeight * ratio
            const priceVal = (maxPrice - ratio * (maxPrice - minPrice)).toFixed(1)
            return (
              <g key={i}>
                <line
                  x1="0"
                  y1={y}
                  x2={svgWidth}
                  y2={y}
                  stroke="rgba(255, 255, 255, 0.05)"
                  strokeDasharray="4 4"
                />
                <text
                  x={svgWidth - 5}
                  y={y - 4}
                  fill="rgba(255, 255, 255, 0.3)"
                  fontSize="10"
                  textAnchor="end"
                  fontFamily="monospace"
                >
                  {priceVal}
                </text>
              </g>
            )
          })}

          {/* K 線圖與成交量渲染 */}
          {chartData.map((d, i) => {
            const x = (i + 0.5) * (svgWidth / chartData.length)
            const isUp = d.close >= d.open
            const candleColor = isUp ? '#f43f5e' : '#10b981' // 台股規範：紅漲綠跌
            const filterEffect = isUp ? 'url(#glow-rose)' : 'url(#glow-emerald)'

            const yOpen = getY(d.open)
            const yClose = getY(d.close)
            const yHigh = getY(d.high)
            const yLow = getY(d.low)
            const topY = Math.min(yOpen, yClose)
            const candleH = Math.max(Math.abs(yOpen - yClose), 2) // 確保至少有 2px 高度

            const volY = getVolY(d.volume)
            const volH = totalSvgHeight - volY

            return (
              <g
                key={i}
                className="cursor-pointer transition-opacity duration-150 hover:opacity-100"
                onMouseEnter={() => setHoverPoint(d)}
              >
                {/* 影線 (High/Low Wick) */}
                <line
                  x1={x}
                  y1={yHigh}
                  x2={x}
                  y2={yLow}
                  stroke={candleColor}
                  strokeWidth="1.5"
                  opacity="0.8"
                />

                {/* 實體 (Candle Body) */}
                <rect
                  x={x - barWidth / 2}
                  y={topY}
                  width={barWidth}
                  height={candleH}
                  fill={candleColor}
                  rx="2"
                  filter={filterEffect}
                />

                {/* 成交量柱狀圖 (Volume Bar) */}
                <rect
                  x={x - barWidth / 2}
                  y={volY}
                  width={barWidth}
                  height={volH}
                  fill={candleColor}
                  opacity="0.35"
                  rx="1"
                />

                {/* 懸浮熱區捕捉線 (Crosshair) */}
                {hoverPoint?.date === d.date && (
                  <g>
                    <line
                      x1={x}
                      y1="0"
                      x2={x}
                      y2={totalSvgHeight}
                      stroke="rgba(255, 255, 255, 0.25)"
                      strokeWidth="1"
                      strokeDasharray="2 2"
                    />
                    <circle cx={x} cy={yClose} r="4" fill="#ffffff" />
                  </g>
                )}
              </g>
            )
          })}

          {/* 4. MA5 均線 (黃線) */}
          <path
            d={chartData.reduce((acc, d, i) => {
              if (d.ma5 === null) return acc
              const x = (i + 0.5) * (svgWidth / chartData.length)
              const y = getY(d.ma5)
              return i === 4 ? `M ${x} ${y}` : `${acc} L ${x} ${y}`
            }, '')}
            fill="none"
            stroke="#fde047"
            strokeWidth="1.8"
            strokeLinecap="round"
            opacity="0.9"
          />

          {/* 5. MA20 均線 (藍線) */}
          <path
            d={chartData.reduce((acc, d, i) => {
              if (d.ma20 === null) return acc
              const x = (i + 0.5) * (svgWidth / chartData.length)
              const y = getY(d.ma20)
              return i === 19 ? `M ${x} ${y}` : `${acc} L ${x} ${y}`
            }, '')}
            fill="none"
            stroke="#60a5fa"
            strokeWidth="1.8"
            strokeLinecap="round"
            opacity="0.9"
          />
        </svg>
      </div>

      {/* X 軸日期標示 */}
      <div className="flex justify-between text-[10px] font-mono text-neutral-500 px-1 pt-1 border-t border-white/5">
        <span>{chartData[0]?.date}</span>
        <span>{chartData[Math.floor(chartData.length / 2)]?.date}</span>
        <span>{chartData[chartData.length - 1]?.date}</span>
      </div>
    </div>
  )
}
