export type EvidenceType = 'FACT' | 'INFERENCE' | 'ASSUMPTION' | 'PREDICTION'

export interface EvidenceItem {
  id: string
  type: EvidenceType
  title: string
  content: string
  sourceName: string
  sourceUrl?: string
  publishedAt: string
}

export interface ResearchScore {
  total: number // 0 ~ 100
  fundamentals: number // 權重 25%
  growth: number // 權重 20%
  valuation: number // 權重 20%
  industry: number // 權重 15%
  financialQuality: number // 權重 10%
  risk: number // 權重 10%
}

export interface ScenarioCase {
  targetPrice: number
  cagr: string
  operatingMargin: string
  impliedPE: string
  assumptions: string[]
}

export interface AIResearchReport {
  symbol: string
  stockName: string
  summary: {
    positive: string[]
    neutral: string[]
    risk: string[]
  }
  score: ResearchScore
  fundamentals: {
    revenueQuarterlyYoY: string
    grossMarginTrend: string
    epsStatus: string
    freeCashFlowStatus: string
  }
  growth: {
    drivers: string[]
    marketExpansion: string
  }
  valuation: {
    currentPE: number
    historicalPEAvg: number
    dcfFairValue: number
    wacc: string
    terminalGrowth: string
  }
  scenarios: {
    bull: ScenarioCase
    base: ScenarioCase
    bear: ScenarioCase
  }
  risks: {
    category: string
    level: 'Low' | 'Medium' | 'High'
    description: string
    invalidationTrigger: string
  }[]
  evidence: EvidenceItem[]
}

export interface AIProvider {
  generateResearchReport(symbol: string): Promise<AIResearchReport>
  analyzeFinancials(symbol: string): Promise<Record<string, unknown>>
  summarizeNews(symbol: string): Promise<string[]>
}
