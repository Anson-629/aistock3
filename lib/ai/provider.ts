import { AIProvider, AIResearchReport } from './types'

export class DefaultAIProvider implements AIProvider {
  async generateResearchReport(symbol: string): Promise<AIResearchReport> {
    // 預留實際 API 呼叫 (可切換 OpenRouter / OpenAI / Claude API)
    // 嚴格遵守防幻覺規範：預測必須標註 PREDICTION / ASSUMPTION，客觀數據必須附帶來源
    
    return {
      symbol,
      stockName: symbol === '2330' ? '台積電' : '台股標的',
      summary: {
        positive: [
          'HPC 與 AI 晶片需求持續帶動高階製程利用率',
          '3nm 產能擴張順利，營收比重達歷年新高'
        ],
        neutral: [
          '本益比目前接近歷史中高區間',
          '成熟製程終端需求復甦較為平緩'
        ],
        risk: [
          '地緣政治風險導致供應鏈海外分散成本增加',
          '海外擴廠初期對整體毛利率產生 1-2% 稀釋壓力'
        ]
      },
      score: {
        total: 86,
        fundamentals: 92,
        growth: 89,
        valuation: 74,
        industry: 95,
        financialQuality: 91,
        risk: 68
      },
      fundamentals: {
        revenueQuarterlyYoY: '+28.5%',
        grossMarginTrend: '60.2% (高於歷史平均)',
        epsStatus: 'NT$ 15.6 (單季新高)',
        freeCashFlowStatus: '強勁 (經營現金流足以支應 CapEx)'
      },
      growth: {
        drivers: [
          'AI Accelerator & Server 需求年增率超過 50%',
          'N2 (2nm) 將於預定時程量產'
        ],
        marketExpansion: '全球半導體晶圓代工市占率超過 60%'
      },
      valuation: {
        currentPE: 21.4,
        historicalPEAvg: 19.5,
        dcfFairValue: 1050,
        wacc: '8.5%',
        terminalGrowth: '3.0%'
      },
      scenarios: {
        bull: {
          targetPrice: 1280,
          cagr: '22%',
          operatingMargin: '52%',
          impliedPE: '24x',
          assumptions: ['AI 需求超乎預期', 'CoWoS 產能年增 100% 以上']
        },
        base: {
          targetPrice: 1050,
          cagr: '18%',
          operatingMargin: '48%',
          impliedPE: '20x',
          assumptions: ['晶圓代工市場穩健成長', '先進製程維持競爭優勢']
        },
        bear: {
          targetPrice: 820,
          cagr: '10%',
          operatingMargin: '42%',
          impliedPE: '16x',
          assumptions: ['地緣政治影響加劇', '海外廠成本大幅侵蝕獲利']
        }
      },
      risks: [
        {
          category: 'Geopolitical Risk',
          level: 'High',
          description: '地緣政治局勢變動影響跨國客戶下單策略',
          invalidationTrigger: '客戶大幅轉移訂單至第二供應商'
        },
        {
          category: 'Financial Risk',
          level: 'Medium',
          description: '資本支出居高不下稀釋短中期 FCF',
          invalidationTrigger: '自由現金流連續兩季轉負'
        }
      ],
      evidence: [
        {
          id: 'ev-1',
          type: 'FACT',
          title: '2026 Q2 財報公布',
          content: '合併營收達新台幣 6,700 億元，YoY 增長 28.5%。',
          sourceName: 'TSMC Investor Relations',
          publishedAt: '2026-07-16'
        },
        {
          id: 'ev-2',
          type: 'INFERENCE',
          title: '產能利用率評估',
          content: '先進封裝產能持續供不應求，推升營業利益率維持高檔。',
          sourceName: 'AI 基本面推理模型',
          publishedAt: '2026-08-01'
        }
      ]
    }
  }

  async analyzeFinancials(symbol: string) {
    return { symbol, status: 'Financial analysis generated' }
  }

  async summarizeNews(symbol: string) {
    return ['AI 晶片需求持續拉升', '海外建廠進度更新']
  }
}

export function getAIProvider(): AIProvider {
  return new DefaultAIProvider()
}
