'use client'

import { useState } from 'react'
import { TwseStockData } from '@/lib/twse'
import { StockAiAnalysis } from '@/lib/gemini'
import { AlertTriangle, BarChart3, Building2, Loader2, RefreshCw, Sparkles, Users } from 'lucide-react'

export default function StockAiAnalysisSection({ stock }: { stock: TwseStockData }) {
  const [analysis, setAnalysis] = useState<StockAiAnalysis | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleFetchAnalysis = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'stock', symbol: stock.symbol }),
      })
      const data = await res.json()

      if (data.success) {
        setAnalysis(data.analysis)
      } else {
        setError(data.error || '無法取得生成式 AI 整理結果')
      }
    } catch {
      setError('網路請求失敗，請重試')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      
      {/* 頂部控制列：評分與觸發按鈕 */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/10 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 text-cyan-300 text-xs font-bold mb-1">
            <Sparkles className="w-4 h-4" /> OpenRouter AI 個股研究報告
          </div>
          <h2 className="text-xl font-bold text-white">AI 三面向分析</h2>
          <p className="text-neutral-400 text-xs mt-1">
            基本面看價值、技術面看趨勢、籌碼面看法人流向；缺少的資料會直接標示。
          </p>
        </div>

        {/* 按鈕與 AI 評分區塊 */}
        <div className="flex items-center gap-4 self-end sm:self-auto">
          {analysis && (
            <div className="text-right border-r border-white/10 pr-4">
              <div className="text-[10px] font-bold text-cyan-300 uppercase">綜合觀察分數</div>
              <div className="text-2xl font-black text-white">
                {analysis.aiScore} <span className="text-xs font-normal text-neutral-500">/ 100</span>
              </div>
            </div>
          )}

          <button
            onClick={handleFetchAnalysis}
            disabled={loading}
            className="flex items-center gap-2 rounded-xl bg-cyan-300 px-4 py-3 text-xs font-bold text-neutral-950 transition hover:bg-cyan-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>分析中...</span>
              </>
            ) : analysis ? (
              <>
                <RefreshCw className="w-4 h-4" />
                <span>更新分析</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>開始分析</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* 錯誤提示 */}
      {error && (
        <div role="alert" className="flex items-center gap-2 border border-rose-500/20 bg-rose-500/10 p-4 text-rose-300 text-xs font-semibold">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {/* 尚未生成時的預設提示區 */}
      {!analysis && !loading && !error && (
        <div className="border border-dashed border-white/15 p-10 text-center space-y-3">
          <Sparkles className="w-8 h-8 text-cyan-300 mx-auto" />
          <h3 className="text-base font-bold text-white">尚未建立分析報告</h3>
          <p className="text-xs text-neutral-400 max-w-md mx-auto">
            分析 {stock.name} ({stock.symbol}) 的估值指標、真實歷史走勢，以及可取得的三大法人買賣超。
          </p>
        </div>
      )}

      {/* 生成後的 AI 研報內容 */}
      {analysis && (
        <div className="space-y-6">
          <div className="space-y-6">
            <p className="border-l-2 border-cyan-300 bg-white/[0.03] p-5 text-sm leading-relaxed text-neutral-200">
              {analysis.summary}
            </p>

            <div className="grid gap-0 border-y border-white/10 md:grid-cols-3">
              {[
                { title: '基本面', subtitle: '公司體質與價值', icon: Building2, content: analysis.fundamentals },
                { title: '技術面', subtitle: '走勢與量價訊號', icon: BarChart3, content: analysis.technical },
                { title: '籌碼面', subtitle: '三大法人動向', icon: Users, content: analysis.chips },
              ].map(({ title, subtitle, icon: Icon, content }) => (
                <section key={title} className="border-b border-white/10 px-4 py-5 first:pl-0 last:border-0 md:border-b-0 md:border-r md:last:border-r-0 md:last:pr-0">
                  <div className="flex items-center gap-2 text-sm font-bold text-white"><Icon className="h-4 w-4 text-cyan-300" />{title}</div>
                  <p className="mt-1 text-[11px] text-neutral-500">{subtitle}</p>
                  <p className="mt-4 text-xs leading-relaxed text-neutral-300">{content.assessment}</p>
                  <ul className="mt-4 space-y-2 text-xs leading-relaxed text-neutral-400">
                    {content.signals.map((signal, index) => <li key={`${title}-${index}`} className="border-l border-white/15 pl-3">{signal}</li>)}
                  </ul>
                </section>
              ))}
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              <div>
                <h3 className="text-xs font-bold text-emerald-300">行情摘要</h3>
                <ul className="mt-3 space-y-2 text-xs leading-relaxed text-neutral-300">{analysis.positives.map((item, index) => <li key={index}>{item}</li>)}</ul>
              </div>
              <div>
                <h3 className="text-xs font-bold text-neutral-300">估值現況</h3>
                <ul className="mt-3 space-y-2 text-xs leading-relaxed text-neutral-300">{analysis.valuationStatus.map((item, index) => <li key={index}>{item}</li>)}</ul>
              </div>
              <div>
                <h3 className="text-xs font-bold text-amber-300">主要風險</h3>
                <ul className="mt-3 space-y-2 text-xs leading-relaxed text-neutral-300">{analysis.risks.map((item, index) => <li key={index}>{item}</li>)}</ul>
              </div>
            </div>
          </div>

          <p className="text-[11px] leading-relaxed text-neutral-500">資料依據：TWSE 行情與公開資訊。基本面未涵蓋完整財報，法人買賣超不等於主力持倉；本報告為研究參考，不構成投資建議。</p>
        </div>
      )}

    </div>
  )
}
