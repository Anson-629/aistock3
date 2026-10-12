// app/dashboard/page.tsx
import Link from 'next/link'
import { Search, TrendingUp, AlertTriangle, CheckCircle2 } from 'lucide-react'

export default function DashboardPage() {
  const recentReport = {
    symbol: "2330",
    name: "台積電",
    score: 86,
    breakdown: { fundamentals: 92, growth: 89, valuation: 74, industry: 95, quality: 91, risk: 68 }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-10 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold">Good evening.</h1>
            <p className="text-slate-400 text-sm">Your Research Dashboard</p>
          </div>
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
            <input 
              type="text" 
              placeholder="搜尋股票代號 (如 2330, 2454)..." 
              className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-4 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        {/* Recent Research Highlight */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <span className="text-xs text-blue-400 font-semibold tracking-wider">LATEST AI ANALYSIS</span>
              <h2 className="text-2xl font-bold text-white mt-1">{recentReport.symbol} {recentReport.name}</h2>
            </div>
            <Link href={`/research/${recentReport.symbol}`} className="bg-blue-600 hover:bg-blue-500 text-white text-sm px-4 py-2 rounded-lg font-medium transition">
              完整研究報告
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-7 gap-4 bg-slate-950 p-4 rounded-xl border border-slate-800/80">
            <div className="col-span-2 md:col-span-1 border-r border-slate-800/80 pr-4">
              <div className="text-xs text-slate-500">AI Score</div>
              <div className="text-3xl font-extrabold text-blue-400 mt-1">{recentReport.score} <span className="text-xs text-slate-500 font-normal">/ 100</span></div>
            </div>
            <div>
              <div className="text-xs text-slate-500">Fundamentals</div>
              <div className="text-lg font-bold text-slate-200 mt-1">{recentReport.breakdown.fundamentals}</div>
            </div>
            <div>
              <div className="text-xs text-slate-500">Growth</div>
              <div className="text-lg font-bold text-slate-200 mt-1">{recentReport.breakdown.growth}</div>
            </div>
            <div>
              <div className="text-xs text-slate-500">Valuation</div>
              <div className="text-lg font-bold text-slate-200 mt-1">{recentReport.breakdown.valuation}</div>
            </div>
            <div>
              <div className="text-xs text-slate-500">Industry</div>
              <div className="text-lg font-bold text-slate-200 mt-1">{recentReport.breakdown.industry}</div>
            </div>
            <div>
              <div className="text-xs text-slate-500">Quality</div>
              <div className="text-lg font-bold text-slate-200 mt-1">{recentReport.breakdown.quality}</div>
            </div>
            <div>
              <div className="text-xs text-slate-500">Risk</div>
              <div className="text-lg font-bold text-amber-400 mt-1">{recentReport.breakdown.risk}</div>
            </div>
          </div>
        </div>

        {/* Watchlist & Thesis Grid */}
        <div className="grid md:grid-cols-2 gap-6">
          
          {/* Quick Watchlist */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <h3 className="text-base font-bold text-slate-200 mb-4">Watchlist</h3>
            <div className="space-y-2">
              {[
                { symbol: "2330", name: "台積電", price: "NT$ 980", score: 86 },
                { symbol: "2454", name: "聯發科", price: "NT$ 1,210", score: 82 },
                { symbol: "2317", name: "鴻海", price: "NT$ 185", score: 78 },
              ].map((item) => (
                <div key={item.symbol} className="p-3 rounded-xl bg-slate-950 border border-slate-800/60 flex items-center justify-between">
                  <div>
                    <div className="text-sm font-bold text-slate-200">{item.symbol} {item.name}</div>
                    <div className="text-xs text-slate-500">{item.price}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-slate-500">AI Score</div>
                    <div className="text-sm font-bold text-blue-400">{item.score}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>
    </div>
  )
}
