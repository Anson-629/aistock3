import { NextRequest, NextResponse } from 'next/server'
import { generateCheckMacValue } from '@/lib/ecpay'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const payload: Record<string, string> = {}

    formData.forEach((value, key) => {
      payload[key] = String(value)
    })

    const { CheckMacValue, ...paramsWithoutMac } = payload
    const calculatedMac = generateCheckMacValue(paramsWithoutMac)

    // 驗證檢查碼是否一致
    if (CheckMacValue !== calculatedMac) {
      return new NextResponse('0|CheckMacValue Verification Failed', { status: 400 })
    }

    // RtnCode === '1' 代表交易成功
    if (payload.RtnCode === '1') {
      // TODO: 在此處更新資料庫中使用者的權限 (例如 user.tier = 'PRO')
      console.log(`[ECPay Success] Order ${payload.MerchantTradeNo} paid successfully. Amount: ${payload.TradeAmt}`)
    }

    return new NextResponse('1|OK')
  } catch (error) {
    console.error('ECPay Callback Error:', error)
    return new NextResponse('0|Exception Occurred', { status: 500 })
  }
}
