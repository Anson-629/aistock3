// 台股慣例：紅漲 (+) / 綠跌 (-) / 灰平盤
export const getTrendColor = (val: number) => {
  if (val > 0) return 'text-red-400'      // 漲：紅色
  if (val < 0) return 'text-emerald-400'  // 跌：綠色
  return 'text-slate-400'                 // 平盤：灰色
}

export const getTrendBadgeStyle = (recommendation: string) => {
  switch (recommendation) {
    case '強烈買進':
    case '逢低佈局':
      return 'bg-red-950/50 text-red-400 border-red-800/40' // 多頭看漲：紅框紅字
    case '分批減碼':
    case '風險避險':
      return 'bg-emerald-950/50 text-emerald-400 border-emerald-800/40' // 空頭看跌：綠框綠字
    default:
      return 'bg-slate-800/80 text-slate-300 border-slate-700/60' // 中性觀望：灰框白字
  }
}
