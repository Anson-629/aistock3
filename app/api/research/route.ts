import { NextResponse } from 'next/server'
import { generateResearchSummary } from '@/lib/gemini'

export async function POST(req: Request) {
  try {
    const { symbol, name, closingPrice, peRatio, yieldRate } = await req.json()
    const analysis = await generateResearchSummary({ symbol, name, closingPrice, peRatio, yieldRate })
    return NextResponse.json({ success: true, analysis })
  } catch (error) {
    return NextResponse.json({ success: false, error: 'AI 分析生成失敗' }, { status: 500 })
  }
}
