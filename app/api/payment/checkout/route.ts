import { NextRequest, NextResponse } from 'next/server'
import { SUBSCRIPTION_PLANS, PlanTier } from '@/lib/subscription'
import { createECPayPaymentPayload } from '@/lib/ecpay'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const planId = body.planId as PlanTier

    const selectedPlan = SUBSCRIPTION_PLANS[planId]
    if (!selectedPlan || selectedPlan.priceNTD === 0) {
      return NextResponse.json({ success: false, error: '無效的訂閱方案' }, { status: 400 })
    }

    const tradeNo = `ORD${Date.now()}`
    const now = new Date()
    const formattedDate = now.toISOString().replace(/T/, ' ').replace(/\..+/, '').replace(/-/g, '/')

    const protocol = request.headers.get('x-forwarded-proto') || 'http'
    const host = request.headers.get('host') || 'localhost:3000'
    const baseUrl = `${protocol}://${host}`

    const paymentFormData = createECPayPaymentPayload({
      MerchantTradeNo: tradeNo,
      MerchantTradeDate: formattedDate,
      TotalAmount: selectedPlan.priceNTD,
      TradeDesc: `訂閱 ${selectedPlan.name}`,
      ItemName: `AI Research Report ${selectedPlan.name}`,
      ReturnURL: `${baseUrl}/api/payment/callback`,
      OrderResultURL: `${baseUrl}/pricing?status=success`,
    })

    return NextResponse.json({
      success: true,
      tradeNo,
      paymentFormData,
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Checkout failed' },
      { status: 500 }
    )
  }
}
