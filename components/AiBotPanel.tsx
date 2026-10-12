'use client'

import { useState } from 'react'
import { Bot, Loader2, Send, Sparkles, X } from 'lucide-react'

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

export default function AiBotPanel() {
  const [isOpen, setIsOpen] = useState(false)
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content: '你好，我是生成式 AI 助理。你可以直接問我台股、盤勢、個股估值或投資策略相關問題。',
    },
  ])

  const handleSend = async () => {
    const question = input.trim()
    if (!question || loading) return

    setMessages((prev) => [...prev, { role: 'user', content: question }])
    setInput('')
    setLoading(true)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: question }),
      })

      const data = await res.json()

      if (data.success) {
        setMessages((prev) => [...prev, { role: 'assistant', content: data.answer }])
      } else {
        setMessages((prev) => [...prev, { role: 'assistant', content: data.error || '目前無法回答，請稍後再試。' }])
      }
    } catch (error) {
      setMessages((prev) => [...prev, { role: 'assistant', content: '連線異常，請稍後再試。' }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed bottom-5 right-5 z-50">
      {isOpen ? (
        <div className="w-[360px] max-w-[calc(100vw-24px)] max-h-[calc(100vh-80px)] min-h-[320px] min-w-[320px] resize overflow-auto rounded-3xl border border-blue-500/30 bg-[#09090b]/95 backdrop-blur-xl shadow-2xl shadow-blue-500/10">
          <div className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-3">
            <div className="flex items-center gap-2 text-blue-400 text-xs font-bold uppercase tracking-[0.12em]">
              <Bot className="w-4 h-4" /> 生成式 AI 小助理
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/5 text-neutral-300 transition hover:text-white"
              aria-label="關閉 AI 助理"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="space-y-3 max-h-[420px] overflow-y-auto p-4">
            {messages.map((msg, index) => (
              <div
                key={`${msg.role}-${index}`}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed border ${
                    msg.role === 'user'
                      ? 'bg-blue-600 text-white border-blue-500/30'
                      : 'bg-white/[0.02] text-neutral-200 border-white/10'
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="bg-white/[0.02] text-neutral-200 border border-white/10 rounded-2xl px-4 py-3 text-sm flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-blue-400" /> 生成式 AI 正在整理答案中...
                </div>
              </div>
            )}
          </div>

          <div className="border-t border-white/10 p-3">
            <div className="flex gap-2">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                rows={3}
                placeholder="例如：2330 最近這幾天為什麼還是偏弱？"
                className="flex-1 resize-none rounded-2xl border border-white/10 bg-black/40 text-white placeholder:text-neutral-500 px-3 py-2 text-sm outline-none focus:border-blue-500/50"
              />
              <button
                type="button"
                onClick={handleSend}
                disabled={loading || !input.trim()}
                className="self-end rounded-2xl bg-blue-600 px-3 py-2 text-xs font-bold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <span className="flex items-center gap-2">
                  <Send className="w-4 h-4" /> 提問
                </span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="group flex items-center gap-3 rounded-full border border-blue-400/40 bg-gradient-to-r from-blue-600 to-cyan-500 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-blue-500/30 transition hover:scale-[1.02] hover:shadow-xl hover:shadow-blue-500/40"
          aria-label="開啟 AI 助理"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10">
            <Bot className="h-5 w-5" />
          </div>
          <span className="hidden sm:inline">AI 助理</span>
          <Sparkles className="h-4 w-4 text-cyan-200" />
        </button>
      )}
    </div>
  )
}
