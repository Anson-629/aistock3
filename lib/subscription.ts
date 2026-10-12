export type PlanTier = 'FREE' | 'PRO' | 'PREMIUM'

export interface SubscriptionPlan {
  id: PlanTier
  name: string
  priceNTD: number
  description: string
  features: string[]
  monthlyReportLimit: number
  hasThesisTracker: boolean
  hasRealtimeAlerts: boolean
}

export const SUBSCRIPTION_PLANS: Record<PlanTier, SubscriptionPlan> = {
  FREE: {
    id: 'FREE',
    name: '免費體驗版',
    priceNTD: 0,
    description: '適合初學者體驗 AI 研報生成',
    features: ['每月 3 份 AI 研報生成', '基礎財務數據圖表', '同業比較分析'],
    monthlyReportLimit: 3,
    hasThesisTracker: false,
    hasRealtimeAlerts: false,
  },
  PRO: {
    id: 'PRO',
    name: '專業投資人版',
    priceNTD: 599,
    description: '適合個股研究者與專業散戶',
    features: [
      '無限次 AI 研報生成',
      '完整 Valuation 估值模型與三段情境',
      'Evidence 證據鏈溯源系統',
      '即時基本面 Alerts 警示通知',
    ],
    monthlyReportLimit: 9999,
    hasThesisTracker: false,
    hasRealtimeAlerts: true,
  },
  PREMIUM: {
    id: 'PREMIUM',
    name: 'Premium / 頂級研究版',
    priceNTD: 999,
    description: '適合研究團隊與小型基金',
    features: [
      '包含 Pro 版所有功能',
      '專屬客製化 AI 分析模組',
      'API 資料導出權限 (JSON/PDF)',
      '優先客服與數據同步服務',
    ],
    monthlyReportLimit: 9999,
    hasThesisTracker: true,
    hasRealtimeAlerts: true,
  },
}

export function checkUserAccess(userTier: PlanTier, requiredFeature: 'thesis' | 'alerts'): boolean {
  const plan = SUBSCRIPTION_PLANS[userTier]
  if (requiredFeature === 'thesis') return plan.hasThesisTracker
  if (requiredFeature === 'alerts') return plan.hasRealtimeAlerts
  return false
}
