import { NextResponse } from 'next/server'
import { getTwseStockInfo, getRealtimeMarketOverview, getRecentInstitutionalFlows, getStockPriceHistory } from '@/lib/twse'
import { generateStockAnalysis, generateMarketOverviewAnalysis } from '@/lib/gemini'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { type, symbol } = body

    // 1. 大盤動態分析
    if (type === 'market') {
      const { indices } = await getRealtimeMarketOverview()
      const analysis = await generateMarketOverviewAnalysis(indices)
      return NextResponse.json({ success: true, analysis })
    }

    // 2. 個股深度研報分析
    if (!symbol) {
      return NextResponse.json({ success: false, error: '缺少股票代號' }, { status: 400 })
    }

    if (!/^[A-Z0-9]{2,12}$/.test(String(symbol).toUpperCase())) {
      return NextResponse.json({ success: false, error: '股票代號格式不正確' }, { status: 400 })
    }

    const normalizedSymbol = String(symbol).toUpperCase()
    const [stock, candles, institutionalFlows] = await Promise.all([
      getTwseStockInfo(normalizedSymbol),
      getStockPriceHistory(normalizedSymbol, '3M'),
      getRecentInstitutionalFlows(normalizedSymbol),
    ])
    const analysis = await generateStockAnalysis(stock, candles, institutionalFlows)

    return NextResponse.json({ success: true, analysis })
  } catch (error) {
    console.error('[API Analyze Error]:', error)
    const missingKey = error instanceof Error && error.message === 'OPENROUTER_API_KEY is missing or invalid'
    const message = missingKey
      ? '伺服器缺少有效的 OPENROUTER_API_KEY，請確認 Vercel 環境變數並重新部署。'
      : 'OpenRouter AI 分析失敗，請稍後重試或查看部署日誌。'
    return NextResponse.json({ success: false, error: message }, { status: 503 })
  }
}
