import crypto from 'crypto'

export interface ECPayOrderParams {
  MerchantTradeNo: string
  MerchantTradeDate: string
  TotalAmount: number
  TradeDesc: string
  ItemName: string
  ReturnURL: string
  OrderResultURL: string
}

const ECP_HASH_KEY = process.env.ECPAY_HASH_KEY || 'pw521rL9a2D6A4hi' // 測試 Key
const ECP_HASH_IV = process.env.ECPAY_HASH_IV || 'v77hoKGq4kWxNNIS'   // 測試 IV
const ECP_MERCHANT_ID = process.env.ECPAY_MERCHANT_ID || '3002607'   // 測試 MerchantID

export function generateCheckMacValue(params: Record<string, string | number>): string {
  // 1. 按照 key 字母順序排序
  const sortedKeys = Object.keys(params).sort()
  
  // 2. 組合為 raw query string
  let rawStr = `HashKey=${ECP_HASH_KEY}&`
  sortedKeys.forEach((key) => {
    rawStr += `${key}=${params[key]}&`
  })
  rawStr += `HashIV=${ECP_HASH_IV}`

  // 3. URL encode & 特殊字元替換（依綠界規範）
  let urlEncodedStr = encodeURIComponent(rawStr)
    .replace(/%20/g, '+')
    .replace(/%21/g, '!')
    .replace(/%28/g, '(')
    .replace(/%29/g, ')')
    .toLowerCase()

  // 4. SHA256 計算並轉大寫
  return crypto.createHash('sha256').update(urlEncodedStr).digest('hex').toUpperCase()
}

export function createECPayPaymentPayload(order: ECPayOrderParams) {
  const baseParams: Record<string, string | number> = {
    MerchantID: ECP_MERCHANT_ID,
    MerchantTradeNo: order.MerchantTradeNo,
    MerchantTradeDate: order.MerchantTradeDate,
    PaymentType: 'aio',
    TotalAmount: order.TotalAmount,
    TradeDesc: order.TradeDesc,
    ItemName: order.ItemName,
    ReturnURL: order.ReturnURL,
    OrderResultURL: order.OrderResultURL,
    ChoosePayment: 'ALL',
    EncryptType: 1,
  }

  const checkMacValue = generateCheckMacValue(baseParams)

  return {
    ...baseParams,
    CheckMacValue: checkMacValue,
    ActionUrl: 'https://payment-stage.ecpay.com.tw/Cashier/AioCheckOut/V5', // 測試環境 URL
  }
}
