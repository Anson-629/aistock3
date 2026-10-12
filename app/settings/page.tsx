'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { AlertCircle, Bell, Check, ChevronRight, Database, LogIn, LogOut, MoonStar, RefreshCw, ShieldCheck, SlidersHorizontal, Sparkles, UserRound } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

type SettingsState = {
  marketColorMode: 'red-up-green-down' | 'green-up-red-down'
  autoRefresh: boolean
  aiSummary: boolean
  pushAlerts: boolean
  defaultSource: 'TWSE' | 'AI Insights'
}

const defaultSettings: SettingsState = {
  marketColorMode: 'red-up-green-down',
  autoRefresh: true,
  aiSummary: true,
  pushAlerts: false,
  defaultSource: 'TWSE',
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<SettingsState>(defaultSettings)
  const [mounted, setMounted] = useState(false)
  const [account, setAccount] = useState<{ id: string; email: string; fullName: string } | null>(null)
  const [fullName, setFullName] = useState('')
  const [accountLoading, setAccountLoading] = useState(true)
  const [savingProfile, setSavingProfile] = useState(false)
  const [accountMessage, setAccountMessage] = useState('')
  const [accountError, setAccountError] = useState(false)

  useEffect(() => {
    let active = true

    const loadAccountAndPreferences = async () => {
      let nextSettings = defaultSettings
      const saved = localStorage.getItem('alpha-research-settings')
      if (saved) {
        try {
          nextSettings = { ...defaultSettings, ...JSON.parse(saved) }
        } catch {
          nextSettings = defaultSettings
        }
      }

      const hasSupabaseConfig = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
      if (hasSupabaseConfig) {
        try {
          const supabase = createClient()
          const { data: { user }, error } = await supabase.auth.getUser()
          if (error) throw error

          if (user) {
            const { data: savedProfile } = await supabase.from('profiles').select('full_name').eq('id', user.id).maybeSingle()
            const userName = String(user.user_metadata?.full_name ?? savedProfile?.full_name ?? '')
            const profileResult = await supabase.from('profiles').upsert({
              id: user.id,
              email: user.email ?? null,
              full_name: userName || null,
            }, { onConflict: 'id' })
            const { data: preferenceRow } = await supabase
              .from('user_preferences')
              .select('preferences')
              .eq('user_id', user.id)
              .maybeSingle()

            if (preferenceRow?.preferences && typeof preferenceRow.preferences === 'object') {
              nextSettings = { ...nextSettings, ...preferenceRow.preferences }
            }
            if (active) {
              setAccount({ id: user.id, email: user.email ?? '', fullName: userName })
              setFullName(userName)
              if (profileResult.error) setAccountMessage('已登入；個人資料資料表尚未就緒，設定仍會保存在本機。')
            }
          }
        } catch {
          if (active) {
            setAccountError(true)
            setAccountMessage('無法連線至帳號服務，請確認 Supabase 設定。')
          }
        }
      }

      if (active) {
        setSettings(nextSettings)
        setMounted(true)
        setAccountLoading(false)
      }
    }

    void loadAccountAndPreferences()
    return () => { active = false }
  }, [])

  useEffect(() => {
    if (!mounted) return
    localStorage.setItem('alpha-research-settings', JSON.stringify(settings))
  }, [settings, mounted])

  useEffect(() => {
    if (!mounted || !account) return

    const supabase = createClient()
    supabase.from('user_preferences').upsert({
      user_id: account.id,
      preferences: settings,
    }, { onConflict: 'user_id' }).then(({ error }) => {
      if (error) {
        setAccountError(true)
        setAccountMessage('偏好已保存在本機，但雲端同步失敗。')
      } else if (!accountError) {
        setAccountMessage('帳號與偏好設定已同步。')
      }
    })
  }, [settings, mounted, account, accountError])

  const updateSetting = <K extends keyof SettingsState>(key: K, value: SettingsState[K]) => {
    setSettings((prev) => ({ ...prev, [key]: value }))
  }

  const toggleRows = [
    {
      key: 'autoRefresh',
      title: '自動刷新行情',
      description: '每 5 分鐘自動更新大盤與焦點股資料',
      icon: RefreshCw,
    },
    {
      key: 'aiSummary',
      title: 'AI 智慧摘要',
      description: '在儀表板中顯示 OpenRouter 生成的市場觀點',
      icon: Sparkles,
    },
    {
      key: 'pushAlerts',
      title: '價格提醒通知',
      description: '當目標價或漲跌幅超過阈值時提醒您',
      icon: Bell,
    },
  ] as const

  const handleSaveProfile = async () => {
    if (!account) return
    setSavingProfile(true)
    setAccountError(false)
    setAccountMessage('')

    try {
      const supabase = createClient()
      const trimmedName = fullName.trim()
      const { error: authUpdateError } = await supabase.auth.updateUser({ data: { full_name: trimmedName } })
      if (authUpdateError) throw authUpdateError

      const { error } = await supabase.from('profiles').upsert({
        id: account.id,
        email: account.email,
        full_name: trimmedName || null,
      }, { onConflict: 'id' })
      if (error) throw error

      setAccount({ ...account, fullName: trimmedName })
      setAccountMessage('個人資料已更新。')
    } catch {
      setAccountError(true)
      setAccountMessage('個人資料更新失敗，請確認資料表權限後重試。')
    } finally {
      setSavingProfile(false)
    }
  }

  const handleSignOut = async () => {
    const { error } = await createClient().auth.signOut()
    if (error) {
      setAccountError(true)
      setAccountMessage('登出失敗，請稍後重試。')
      return
    }
    setAccount(null)
    setFullName('')
    setAccountError(false)
    setAccountMessage('已安全登出。')
  }

  return (
    <div className="min-h-screen bg-black text-white p-6 md:p-10">
      <div className="mx-auto max-w-5xl space-y-8">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-bold tracking-[0.2em] text-blue-400 uppercase">Preferences</p>
            <h1 className="mt-2 text-3xl md:text-4xl font-black tracking-tight">設定中心</h1>
          </div>
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-neutral-200 transition hover:bg-white/10"
          >
            回到儀表板
          </Link>
        </div>

        <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 shadow-2xl shadow-blue-950/20">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-emerald-500/10 p-2 text-emerald-400">
                <ShieldCheck className="h-4 w-4" />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-400">Account</p>
                <h2 className="text-lg font-bold">個人帳號</h2>
              </div>
            </div>

            {accountLoading ? (
              <span className="text-xs text-neutral-400">確認登入狀態中...</span>
            ) : account ? (
              <button type="button" onClick={handleSignOut} className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-3.5 py-2 text-xs font-semibold text-neutral-300 transition hover:border-red-400/40 hover:text-red-300">
                <LogOut className="h-4 w-4" /> 登出
              </button>
            ) : (
              <Link href="/login" className="inline-flex items-center gap-2 rounded-xl bg-white px-3.5 py-2 text-xs font-bold text-neutral-900 transition hover:bg-neutral-200">
                <LogIn className="h-4 w-4" /> Email 登入
              </Link>
            )}
          </div>

          {account ? (
            <div className="mt-6 grid gap-5 border-t border-white/10 pt-5 md:grid-cols-[1fr_auto] md:items-end">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="account-email" className="mb-2 block text-xs font-semibold text-neutral-400">登入 Email</label>
                  <div id="account-email" className="flex min-h-11 items-center gap-2 rounded-xl border border-white/10 bg-black/30 px-3 text-sm text-neutral-300">
                    <UserRound className="h-4 w-4 text-neutral-500" />{account.email || '未提供 Email'}
                  </div>
                </div>
                <div>
                  <label htmlFor="account-name" className="mb-2 block text-xs font-semibold text-neutral-400">顯示名稱</label>
                  <input id="account-name" value={fullName} onChange={(event) => setFullName(event.target.value)} maxLength={80} placeholder="輸入你的名稱" className="min-h-11 w-full rounded-xl border border-white/10 bg-black/30 px-3 text-sm text-white outline-none transition focus:border-blue-400/60" />
                </div>
              </div>
              <button type="button" onClick={handleSaveProfile} disabled={savingProfile} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-blue-500 px-4 text-xs font-bold text-white transition hover:bg-blue-400 disabled:cursor-wait disabled:opacity-60">
                <Check className="h-4 w-4" /> {savingProfile ? '儲存中...' : '儲存資料'}
              </button>
            </div>
          ) : (
            <div className="mt-5 border-t border-white/10 pt-4 text-sm text-neutral-400">
              登入後可同步個人資料與偏好設定；未登入時偏好會保存在目前瀏覽器。
            </div>
          )}

          {accountMessage && (
            <div role="status" className={`mt-4 flex items-center gap-2 text-xs ${accountError ? 'text-amber-300' : 'text-emerald-300'}`}>
              {accountError ? <AlertCircle className="h-4 w-4" /> : <Check className="h-4 w-4" />}{accountMessage}
            </div>
          )}
        </section>

        <section className="grid gap-6 md:grid-cols-2">
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 shadow-2xl shadow-blue-950/20">
            <div className="mb-5 flex items-center gap-3">
              <div className="rounded-2xl bg-blue-500/10 p-2 text-blue-400">
                <SlidersHorizontal className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-lg font-bold">市場顏色設定</h2>
                <p className="text-xs text-neutral-400">依據台股慣例調整價格顯示方式</p>
              </div>
            </div>

            <div className="space-y-3">
              <button
                type="button"
                onClick={() => updateSetting('marketColorMode', 'red-up-green-down')}
                className={`flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left transition ${
                  settings.marketColorMode === 'red-up-green-down'
                    ? 'border-red-500/40 bg-red-500/10 text-red-300'
                    : 'border-white/10 bg-slate-950/60 text-neutral-300 hover:border-white/20'
                }`}
              >
                <span className="flex items-center gap-3">
                  <span className="flex gap-1.5">
                    <span className="h-3 w-3 rounded-full bg-red-400" />
                    <span className="h-3 w-3 rounded-full bg-emerald-400" />
                  </span>
                  紅漲 / 綠跌
                </span>
                <ChevronRight className="h-4 w-4" />
              </button>

              <button
                type="button"
                onClick={() => updateSetting('marketColorMode', 'green-up-red-down')}
                className={`flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left transition ${
                  settings.marketColorMode === 'green-up-red-down'
                    ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300'
                    : 'border-white/10 bg-slate-950/60 text-neutral-300 hover:border-white/20'
                }`}
              >
                <span className="flex items-center gap-3">
                  <span className="flex gap-1.5">
                    <span className="h-3 w-3 rounded-full bg-emerald-400" />
                    <span className="h-3 w-3 rounded-full bg-red-400" />
                  </span>
                  綠漲 / 紅跌
                </span>
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 shadow-2xl shadow-violet-950/20">
            <div className="mb-5 flex items-center gap-3">
              <div className="rounded-2xl bg-violet-500/10 p-2 text-violet-400">
                <Database className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-lg font-bold">資料來源</h2>
                <p className="text-xs text-neutral-400">設定預設行情與分析來源</p>
              </div>
            </div>

            <div className="space-y-3">
              {(['TWSE', 'AI Insights'] as const).map((source) => (
                <button
                  key={source}
                  type="button"
                  onClick={() => updateSetting('defaultSource', source)}
                  className={`flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left transition ${
                    settings.defaultSource === source
                      ? 'border-violet-500/40 bg-violet-500/10 text-violet-200'
                      : 'border-white/10 bg-slate-950/60 text-neutral-300 hover:border-white/20'
                  }`}
                >
                  <span>{source}</span>
                  <span className="text-xs text-neutral-400">
                    {source === 'TWSE' ? '即時股價資料' : 'AI 分析摘要'}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
          <div className="mb-5 flex items-center gap-3">
            <div className="rounded-2xl bg-emerald-500/10 p-2 text-emerald-400">
              <MoonStar className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-lg font-bold">個人化偏好</h2>
              <p className="text-xs text-neutral-400">控制 dashboard 與提醒行為</p>
            </div>
          </div>

          <div className="space-y-3">
            {toggleRows.map(({ key, title, description, icon: Icon }) => (
              <div key={key} className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-white/5 p-2 text-neutral-300">
                    <Icon className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="font-semibold text-white">{title}</div>
                    <div className="text-xs text-neutral-400">{description}</div>
                  </div>
                </div>

                <button
                  type="button"
                  aria-label={title}
                  onClick={() => updateSetting(key, !settings[key])}
                  className={`relative inline-flex h-7 w-12 items-center rounded-full border transition ${
                    settings[key] ? 'border-blue-500/60 bg-blue-500/60' : 'border-white/15 bg-white/5'
                  }`}
                >
                  <span
                    className={`inline-block h-5 w-5 rounded-full bg-white shadow-md transition ${
                      settings[key] ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-3xl border border-emerald-500/20 bg-emerald-500/5 p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-emerald-400">
                <ShieldCheck className="h-4 w-4" />
                <span className="text-xs font-bold uppercase tracking-[0.2em]">Account Safety</span>
              </div>
              <h3 className="mt-2 text-xl font-bold text-white">偏好設定已保存</h3>
            </div>
            <div className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-300">
              {account ? '本機與雲端' : '本機'}
            </div>
          </div>
          <p className="mt-3 text-sm text-emerald-100/80">
            本頁設定會保存在瀏覽器；登入後也會同步至你的帳號。
          </p>
        </section>
      </div>
    </div>
  )
}
