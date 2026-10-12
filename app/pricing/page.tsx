'use client'

import { useState } from 'react'
import { Check, Zap, Sparkles, Shield } from 'lucide-react'

export default function PricingPage() {
  const [loadingTier, setLoadingTier] = useState<string | null>(null)

  const handleCheckout = async (planId: string) => {
    if (planId === 'FREE') {
      alert('您目前已在免費體驗方案。')
      return
    }

    setLoadingTier(planId)
    try {
      const res = await fetch('/api/payment/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId }),
      })

      const data = await res.json()

      if (data.success && data.paymentFormData) {
        // 動態建立 Form 並自動提交至綠界付款頁面
        const form = document.createElement('form')
        form.method = 'POST'
        form.action = data.paymentFormData.ActionUrl

        Object.entries(data.paymentFormData).forEach(([key, value]) => {
          if (key !== 'ActionUrl') {
            const input = document.createElement('input')
            input.type = 'hidden'
            input.name = key
            input.value = String(value)
            form.appendChild(input)
          }
        })

        document.body.appendChild(form)
        form.submit()
      } else {
        alert(data.error || '金流發起失敗')
      }
    } catch {
      alert('發生錯誤，請稍後再試')
    } finally {
      setLoadingTier(null)
    }
  }

  return (
    <div className="w-full min-h-screen bg-black text-slate-100 p-6 md:p-8 space-y-8">
      {/* 統一 Dashboard Header 樣式 */}
      <div className="text-center bg-black border border-white/10 p-8 rounded-2xl backdrop-blur-sm space-y-3 max-w-4xl mx-auto shadow-2xl shadow-black/40">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white flex items-center justify-center gap-2">
          <span>💎</span> 升級 AI 投資研究決策系統
        </h1>
        <p className="text-slate-400 text-xs md:text-sm max-w-xl mx-auto">
          解鎖完整估值模型、投資論點自動驗證與基本面即時 Alerts 警示通知
        </p>
      </div>

      {/* 方案卡片區塊 - 與 Dashboard 網格/背景統一 */}
      <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto items-stretch">
        {/* FREE */}
        <div className="bg-black border border-white/10 hover:border-white/20 p-6 rounded-2xl flex flex-col justify-between transition-all shadow-sm backdrop-blur-sm">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Shield className="w-4 h-4 text-slate-400" />
                免費體驗版
              </h3>
            </div>
            <div>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-extrabold text-white">NT$ 0</span>
                <span className="text-xs text-slate-500 font-medium">/ 月</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">適合初步體驗基礎 AI 分析的投資人</p>
            </div>
            <div className="border-t border-slate-800/80 pt-4">
              <ul className="text-xs text-slate-300 space-y-3">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>每月 3 份 AI 研報生成</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>基礎財務數據圖表</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>同業比較分析</span>
                </li>
              </ul>
            </div>
          </div>
          <button
            disabled
            className="w-full mt-8 py-2.5 rounded-xl border border-slate-800/80 bg-slate-950/80 text-slate-500 text-xs font-semibold cursor-not-allowed"
          >
            目前使用中
          </button>
        </div>

        {/* PRO */}
        <div className="bg-black border-2 border-blue-500/80 hover:border-blue-500 p-6 rounded-2xl flex flex-col justify-between transition-all shadow-xl shadow-blue-950/40 backdrop-blur-sm relative">
          <div className="absolute -top-3 right-6 bg-blue-600 text-white text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider shadow-md shadow-blue-600/30">
            MOST POPULAR
          </div>
          <div className="space-y-6">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-blue-400" />
                專業投資人版
              </h3>
            </div>
            <div>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-extrabold text-blue-400">NT$ 599</span>
                <span className="text-xs text-slate-500 font-medium">/ 月</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">專為尋求超額報酬的個人投資人設計</p>
            </div>
            <div className="border-t border-slate-800/80 pt-4">
              <ul className="text-xs text-slate-200 space-y-3">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-blue-400 shrink-0" />
                  <span className="font-medium">無限次 AI 研報生成</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-blue-400 shrink-0" />
                  <span>Valuation 估值模型與三段情境</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-blue-400 shrink-0" />
                  <span>Evidence 證據鏈溯源系統</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-blue-400 shrink-0" />
                  <span>即時基本面 Alerts 警示通知</span>
                </li>
              </ul>
            </div>
          </div>
          <button
            onClick={() => handleCheckout('PRO')}
            disabled={loadingTier === 'PRO'}
            className="w-full mt-8 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition shadow-lg shadow-blue-600/25 disabled:opacity-50"
          >
            {loadingTier === 'PRO' ? '處理中...' : '立即升級 Pro'}
          </button>
        </div>

        {/* PREMIUM */}
        <div className="bg-black border border-white/10 hover:border-white/20 p-6 rounded-2xl flex flex-col justify-between transition-all shadow-sm backdrop-blur-sm">
          <div className="space-y-6">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                Premium / 頂級研究版
              </h3>
            </div>
            <div>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-extrabold text-white">NT$ 999</span>
                <span className="text-xs text-slate-500 font-medium">/ 月</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">極致深度分析與數據導出支援</p>
            </div>
            <div className="border-t border-slate-800/80 pt-4">
              <ul className="text-xs text-slate-300 space-y-3">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>包含 Pro 版所有功能</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>專屬客製化 AI 分析模組</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>API 資料導出權限 (JSON/PDF)</span>
                </li>
              </ul>
            </div>
          </div>
          <button
            onClick={() => handleCheckout('PREMIUM')}
            disabled={loadingTier === 'PREMIUM'}
            className="w-full mt-8 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold border border-slate-700/80 transition shadow-sm disabled:opacity-50"
          >
            {loadingTier === 'PREMIUM' ? '處理中...' : '訂閱 Premium 版'}
          </button>
        </div>
      </div>
    </div>
  )
}
