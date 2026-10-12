'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Mail, ShieldCheck } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  const handleEmailLogin = async () => {
    const trimmedEmail = email.trim()

    if (!trimmedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setErrorMsg('請輸入有效的 Email 地址')
      setSuccessMsg('')
      return
    }

    setErrorMsg('')
    setSuccessMsg('')
    setLoading(true)

    try {
      const supabase = createClient()
      const { error } = await supabase.auth.signInWithOtp({
        email: trimmedEmail,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) {
        throw error
      }

      setSuccessMsg('登入連結已發送到你的 Email，請前往信箱點擊驗證。')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Email 登入失敗'
      setErrorMsg(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-black px-6 py-12 text-white">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-white/[0.03] p-8 shadow-2xl shadow-blue-950/20">
        <button
          type="button"
          onClick={() => router.push('/')}
          className="mb-6 inline-flex items-center gap-2 text-xs font-medium text-neutral-300 transition hover:text-white"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          回到首頁
        </button>

        <div className="mb-6 inline-flex rounded-2xl bg-blue-500/10 p-3 text-blue-400">
          <ShieldCheck className="h-6 w-6" />
        </div>

        <h1 className="text-3xl font-black tracking-tight">電子郵件登入</h1>
        <p className="mt-2 text-sm text-neutral-400">
          請輸入你的 Email，我們會發送登入連結，直接進入 AI 股票研究與設定頁面。
        </p>

        {errorMsg && (
          <div className="mt-5 rounded-2xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">
            {errorMsg}
          </div>
        )}

        {successMsg && (
          <div className="mt-5 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-300">
            {successMsg}
          </div>
        )}

        <div className="mt-6 space-y-3">
          <label className="block text-xs font-medium uppercase tracking-[0.2em] text-neutral-400">
            Email
          </label>
          <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/30 px-3 py-3">
            <Mail className="h-4 w-4 text-neutral-400" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full bg-transparent text-sm text-white placeholder:text-neutral-500 outline-none"
            />
          </div>
        </div>

        <button
          type="button"
          disabled={loading || !email.trim()}
          onClick={handleEmailLogin}
          className="mt-6 flex w-full items-center justify-center gap-3 rounded-2xl bg-white px-4 py-3 text-sm font-bold text-slate-900 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? '發送登入連結中...' : '發送登入連結'}
        </button>

        <div className="mt-6 border-t border-white/10 pt-4 text-[11px] leading-relaxed text-neutral-500">
          這個登入方式使用 Supabase Email Magic Link，不能用 Google，且 Redirect URL 需設為：
          <span className="mt-1 block break-all text-neutral-400">{typeof window !== 'undefined' ? `${window.location.origin}/auth/callback` : '/auth/callback'}</span>
        </div>
      </div>
    </div>
  )
}
