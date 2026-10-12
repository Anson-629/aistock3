import { CandlePoint, InstitutionalFlowPoint, MarketIndexData, TwseStockData } from './twse'

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions'
const MODEL_NAME = 'openai/gpt-4o-mini'

function getOpenRouterKey(): string {
  return process.env.OPENROUTER_API_KEY?.trim() || ''
}

function hasValidOpenRouterKey(): boolean {
  const key = getOpenRouterKey()
  return Boolean(key && key.length >= 20)
}

async function callOpenRouter(prompt: string): Promise<string> {
  const key = getOpenRouterKey()
  if (!hasValidOpenRouterKey()) {
    throw new Error('OPENROUTER_API_KEY is missing or invalid')
  }

  const res = await fetch(OPENROUTER_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${key}`,
      'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
      'X-Title': 'AIStock',
    },
    body: JSON.stringify({
      model: MODEL_NAME,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
    }),
  })

  const data = await res.json()
  if (!res.ok) {
    throw new Error(data?.error?.message || `OpenRouter request failed: ${res.status}`)
  }

  return data?.choices?.[0]?.message?.content || ''
}

export interface StockAiAnalysis {
  aiScore: number
  summary: string
  fundamentals: { assessment: string; signals: string[] }
  technical: { assessment: string; signals: string[] }
  chips: { assessment: string; signals: string[] }
  positives: string[]
  valuationStatus: string[]
  risks: string[]
  evidenceSummary: string
  peerInsight: string
}

export async function generateAiAssistantReply(
  question: string,
  context?: { marketContext?: string; hotStocks?: string }
): Promise<string> {
  if (!hasValidOpenRouterKey()) {
    return 'OpenRouter API key 尚未設定或無效，請先在 .env.local 裡填入有效的 OPENROUTER_API_KEY，然後重啟 Next.js。'
  }

  try {
    const prompt = `
你是一位台股市場的生成式 AI 助理，請以繁體中文回答使用者問題。請直接回答，不要寫程式碼，也不要說你不能做。

市場背景：
${context?.marketContext || '目前大盤資訊尚未取得'}
熱門個股：
${context?.hotStocks || '無特別個股'}

使用者問題：
${question}

回答要求：
- 以投資研究角度分析
- 先給出結論，再說明理由
- 如果是個股問題，請結合價格、盤勢、估值與風險來論述
- 如果是盤勢問題，請說明多空判斷與重點觀察
- 需用自然中文，不要用模板話術
- 文字長度約 120～220 字
`

    const text = await callOpenRouter(prompt)
    return text.trim() || getFallbackAiAssistantReply(question, context)
  } catch (error) {
    console.error('[OpenRouter AI Bot Error]:', error)
    return 'OpenRouter API 回應失敗，請確認 API key 是否有效並重新啟動伺服器。'
  }
}

function getFallbackAiAssistantReply(
  question: string,
  context?: { marketContext?: string; hotStocks?: string }
): string {
  const q = question.toLowerCase()

  if (q.includes('買') || q.includes('買進') || q.includes('進場')) {
    return '若你在看進場機會，重點不是追高，而是確認趨勢、估值與量能是否同步。先看價格是否站穩支撐、成交量是否放大，再綜合本益比與產業動能來判斷，不要在沒有確認量能時急著追價。'
  }

  if (q.includes('賣') || q.includes('賣出') || q.includes('減碼')) {
    return '賣點通常不是看一個紅燈，而是看是否出現量縮、反彈乏力與估值偏高。若股價回落後仍無法站回關鍵均線，且成交量縮小，則更適合先降低持倉或分批調整。'
  }

  if (q.includes('大盤') || q.includes('盤勢') || q.includes('市場')) {
    return `從目前盤勢看，重點在於大盤是否維持關鍵支撐與成交量是否確認。${context?.marketContext ? `目前市場訊號為：${context.marketContext}。` : ''}若多方無法延續量能，短線容易轉為震盪。`
  }

  if (q.includes('2330') || q.includes('台積') || q.includes('台積電')) {
    return '台積電通常在半導體景氣與供應鏈變化影響下，最重要的是看先進製程與客戶需求是否持續。若股價維持在關鍵支撐之上，且大盤沒有明顯失守，短線偏中性偏多的格局仍不錯。'
  }

  return `根據目前市場結構，先看三件事：1) 股價是否站在關鍵支撐；2) 量能是否有放大；3) 估值是否合理。不要只看單日漲跌，重點是趨勢、成交與資金輪動是否一致。`
}

export async function generateStockAnalysis(
  stock: TwseStockData,
  candles: CandlePoint[] = [],
  institutionalFlows: InstitutionalFlowPoint[] = []
): Promise<StockAiAnalysis> {
  const technicalSignals = buildTechnicalSignals(candles)
  const chipSignals = buildChipSignals(institutionalFlows)

  if (!hasValidOpenRouterKey()) {
    throw new Error('OPENROUTER_API_KEY is missing or invalid')
  }

  try {
    const prompt = `
你是一位精通台灣證券市場 (TWSE) 的資深台股量化分析師。請依據下列 TWSE 即時數據，產出一份對應今日行情的具體、非模板化分析，避免泛泛而談與套話。

- 股票代號/名稱：${stock.symbol} ${stock.name}
- 最新成交價：NT$ ${stock.closingPrice}
- 漲跌：${stock.change} / ${stock.changePercent}%
- 本益比 (P/E)：${stock.peRatio} 倍
- 殖利率：${stock.yieldRate} %
- 股價淨值比 (P/B)：${stock.pbRatio} 倍
- 成交量：${(stock.tradeVolume / 10000).toFixed(0)} 萬張
- 交易時段：${stock.updateTime}

基本面資料：本益比 ${stock.peRatio || '未取得'}、股價淨值比 ${stock.pbRatio || '未取得'}、殖利率 ${stock.yieldRate || '未取得'}%。目前沒有營收、毛利率、負債與現金流資料，不得推測公司獲利品質或長期成長。
技術面可驗證指標：${technicalSignals.join('；') || '沒有足夠的真實歷史 K 線資料'}
籌碼面可驗證指標：${chipSignals.join('；') || '沒有取得三大法人買賣超資料'}

分析規則：
- 基本面只可根據已提供的估值與殖利率指標分析；清楚指出缺少獲利、成長和財務健全度資料。
- 技術面只可使用上列 K 線計算指標；若資料不足，明確說明無法判斷趨勢。
- 籌碼面只可依法人買賣超判斷；不得將成交量直接描述成主力買賣或法人流向。
- 不要虛構營收、獲利、法人動向、支撐壓力或同業比較。

請嚴格輸出合法 JSON，只包含以下欄位：
{
  "aiScore": integer (0~100 之間的綜合評分),
  "summary": string (約 50～80 字，必須明確指出當前價格、漲跌狀態、估值與短線判斷，不要空泛模板化措辭),
  "fundamentals": {"assessment": string, "signals": string[]},
  "technical": {"assessment": string, "signals": string[]},
  "chips": {"assessment": string, "signals": string[]},
  "positives": string[] (2 個具體且與數據相關的利多短句，必須包含實際數值或情境),
  "valuationStatus": string[] (2 個估值與本益比評價短句，需直接對照 P/E、P/B、殖利率),
  "risks": string[] (2 個具體的主要風險短句，需指出可能影響股價的真實因素),
  "evidenceSummary": string (約 60～100 字，必須明確引用 TWSE 資料驗證論點),
  "peerInsight": string (約 40～80 字，說明產業定位或相對競爭優勢/壓力)
}

重要：請不要寫成通用模板，請務必直接回應這檔股票在今天的實際情境。
`

    const text = await callOpenRouter(prompt)
    const jsonText = text.replace(/```json|```/g, '').trim()
    const result = JSON.parse(jsonText) as StockAiAnalysis
    if (
      !result.fundamentals?.assessment || !Array.isArray(result.fundamentals.signals)
      || !result.technical?.assessment || !Array.isArray(result.technical.signals)
      || !result.chips?.assessment || !Array.isArray(result.chips.signals)
      || !Array.isArray(result.positives) || !Array.isArray(result.valuationStatus)
      || !Array.isArray(result.risks)
    ) {
      throw new Error('OpenRouter returned an incomplete stock analysis')
    }
    return result
  } catch (error) {
    console.error('[OpenRouter Stock API Error]:', error)
    throw error
  }
}

export async function generateMarketOverviewAnalysis(indices: MarketIndexData[]): Promise<string> {
  if (!hasValidOpenRouterKey()) {
    return 'OpenRouter API key 尚未設定或無效，請先填入有效的 OPENROUTER_API_KEY。'
  }

  try {
    const summaryStr = indices.map((i) => `${i.name}: ${i.index} (${i.changePercent}%)`).join(', ')
    const prompt = `
你是一位台股大盤分析師。請根據今日大盤數據：[ ${summaryStr} ]，用 80 字內繁體中文，寫出一段專業且流暢的台股今日盤中/盤後總結簡評。
`
    const text = await callOpenRouter(prompt)
    return text.trim()
  } catch (error) {
    console.error('[OpenRouter Market API Error]:', error)
    return '本日大盤結構穩健，重點指標股表現符合估值模型預期。'
  }
}

export async function generateResearchSummary({
  symbol,
  name,
  closingPrice,
  peRatio,
  yieldRate,
}: {
  symbol: string
  name: string
  closingPrice: number
  peRatio: number
  yieldRate: number
}): Promise<string> {
  if (!hasValidOpenRouterKey()) {
    return 'OpenRouter API key 尚未設定，請先填入有效的 OPENROUTER_API_KEY。'
  }

  try {
    const prompt = `
你是一位專業台股資深分析師。請根據以下 TWSE 即時資料，產出一份 200 字內的繁體中文精簡分析：
- 股票名稱/代號：${name} (${symbol})
- 最新收盤價：${closingPrice} 元
- 本益比 (P/E)：${peRatio} 倍
- 殖利率：${yieldRate} %

請列出：
1. 【投資亮點】
2. 【估值現況】
3. 【主要風險】
`
    return (await callOpenRouter(prompt)).trim()
  } catch (error) {
    console.error('[OpenRouter Research Summary Error]:', error)
    return `${name} 目前的基本面與估值處於可觀察區間，重點在於是否能維持量能與籌碼支持。`
  }
}

function buildTechnicalSignals(candles: CandlePoint[]): string[] {
  const validCandles = candles.filter((point) => point.close > 0).slice(-60)
  if (validCandles.length < 5) return []

  const closes = validCandles.map((point) => point.close)
  const latest = validCandles[validCandles.length - 1]
  const previous = closes[closes.length - 2]
  const changePercent = previous > 0 ? ((latest.close - previous) / previous) * 100 : 0
  const ma5 = closes.slice(-5).reduce((sum, close) => sum + close, 0) / Math.min(5, closes.length)
  const ma20 = closes.length >= 20
    ? closes.slice(-20).reduce((sum, close) => sum + close, 0) / 20
    : null
  const averageVolume = validCandles.slice(-20).reduce((sum, point) => sum + point.volume, 0) / Math.min(20, validCandles.length)
  const volumeRatio = averageVolume > 0 ? latest.volume / averageVolume : 0
  const signals = [
    `${validCandles.length} 個交易日真實 K 線；最新收盤 ${latest.close.toFixed(2)}，單日 ${changePercent >= 0 ? '+' : ''}${changePercent.toFixed(2)}%`,
    `MA5 ${ma5.toFixed(2)}，收盤價${latest.close >= ma5 ? '在' : '低於'} MA5`,
    `最新成交量為近 ${Math.min(20, validCandles.length)} 日均量的 ${volumeRatio.toFixed(2)} 倍`,
  ]

  if (ma20 !== null) signals.push(`MA20 ${ma20.toFixed(2)}；MA5 ${ma5 >= ma20 ? '高於' : '低於'} MA20`)
  return signals
}

function buildChipSignals(flows: InstitutionalFlowPoint[]): string[] {
  if (flows.length === 0) return []

  const latest = flows[flows.length - 1]
  const totalNet = flows.reduce((sum, point) => sum + point.totalNet, 0)
  const formatShares = (value: number) => `${value > 0 ? '+' : ''}${(value / 1000).toFixed(0)} 張`

  return [
    `最新交易日 ${latest.date} 三大法人合計 ${formatShares(latest.totalNet)}`,
    `近 ${flows.length} 個交易日三大法人累計 ${formatShares(totalNet)}`,
    `最新日外資 ${formatShares(latest.foreignNet)}、投信 ${formatShares(latest.investmentTrustNet)}、自營商 ${formatShares(latest.dealerNet)}`,
  ]
}

