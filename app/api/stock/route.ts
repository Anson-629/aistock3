// app/api/stock/route.ts
import { NextResponse } from 'next/server'
import { getStockPriceEstimation, getTwseStockInfo } from '@/lib/twse'
import { saveMarketSnapshot } from '@/lib/supabase/database'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const symbol = searchParams.get('symbol')

  if (!symbol) {
    return NextResponse.json({ error: '缺少股票代號 (symbol)' }, { status: 400 })
  }

  try {
    // 在 Node.js 後端執行，不會受瀏覽器 CORS 限制，且可安全讀取 process.env.OPENROUTER_API_KEY
    const stock = await getTwseStockInfo(symbol)
    const estimation = await getStockPriceEstimation(symbol)

    const response = {
      ...stock,
      ...estimation,
      currentPrice: stock.closingPrice,
      change: stock.change,
      changePercent: stock.changePercent,
    }

    try {
      const hasSupabaseConfig = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
      if (hasSupabaseConfig) {
        await saveMarketSnapshot({
          symbol: stock.symbol,
          name: stock.name,
          price: Number(stock.closingPrice ?? 0),
          change: Number(stock.change ?? 0),
          change_percent: Number(stock.changePercent ?? 0),
          volume: Number(stock.tradeVolume ?? 0),
          market: 'TWSE',
          source: 'api/stock',
        })
      }
    } catch (dbError) {
      console.error('寫入 market_snapshots 失敗:', dbError)
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Stock Route Error:', error)
    return NextResponse.json({ error: '獲取股票估值失敗' }, { status: 500 })
  }
}
