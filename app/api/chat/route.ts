import { NextResponse } from 'next/server'
import { getRealtimeMarketOverview, getTrendingStocks } from '@/lib/twse'
import { generateAiAssistantReply } from '@/lib/gemini'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const message = typeof body?.message === 'string' ? body.message.trim() : ''

    if (!message) {
      return NextResponse.json({ success: false, error: '請輸入問題' }, { status: 400 })
    }

    const [{ indices }, trendingStocks] = await Promise.all([
      getRealtimeMarketOverview(),
      getTrendingStocks(),
    ])

    const marketContext = indices
      .slice(0, 2)
      .map((item) => `${item.name}: ${item.index} (${item.changePercent}%)`)
      .join('；')

    const hotStocks = trendingStocks
      .slice(0, 5)
      .map((stock) => `${stock.symbol} ${stock.name} ${stock.closingPrice} 元 ${stock.changePercent}%`)
      .join('；')

    const answer = await generateAiAssistantReply(message, {
      marketContext,
      hotStocks,
    })

    return NextResponse.json({ success: true, answer })
  } catch (error) {
    console.error('[AI Chat Error]:', error)
    return NextResponse.json({ success: false, error: 'AI 助理目前忙線中，請稍後再試。' }, { status: 500 })
  }
}
