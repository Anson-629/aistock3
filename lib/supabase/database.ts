import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

export function createSupabaseClient() {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY')
  }

  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
    db: {
      schema: 'public',
    },
  })
}

export function createSupabaseAdminClient() {
  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error('Missing Supabase environment variables: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY')
  }

  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
    db: {
      schema: 'public',
    },
  })
}

export async function getDbHealthCheck() {
  const supabase = createSupabaseClient()
  const { error } = await supabase.from('profiles').select('id').limit(1)

  if (error) {
    throw error
  }

  return true
}

export async function upsertUserProfile(userId: string, profile: {
  email?: string | null
  full_name?: string | null
  avatar_url?: string | null
}) {
  const supabase = createSupabaseClient()

  const { data, error } = await supabase
    .from('profiles')
    .upsert(
      {
        id: userId,
        email: profile.email ?? null,
        full_name: profile.full_name ?? null,
        avatar_url: profile.avatar_url ?? null,
      },
      { onConflict: 'id' }
    )
    .select()
    .single()

  if (error) throw error
  return data
}

export async function getUserProfile(userId: string) {
  const supabase = createSupabaseClient()
  const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle()

  if (error) throw error
  return data
}

export async function saveUserPreferences(userId: string, preferences: Record<string, unknown>) {
  const supabase = createSupabaseClient()

  const { data, error } = await supabase
    .from('user_preferences')
    .upsert(
      {
        user_id: userId,
        preferences,
      },
      { onConflict: 'user_id' }
    )
    .select()
    .single()

  if (error) throw error
  return data
}

export async function getUserPreferences(userId: string) {
  const supabase = createSupabaseClient()
  const { data, error } = await supabase.from('user_preferences').select('*').eq('user_id', userId).maybeSingle()

  if (error) throw error
  return data?.preferences ?? {}
}

export async function upsertWatchlistItem(userId: string, symbol: string, meta: Partial<{ name: string; market: string }> = {}) {
  const supabase = createSupabaseClient()

  const { data, error } = await supabase
    .from('watchlist_items')
    .upsert(
      {
        user_id: userId,
        symbol: symbol.toUpperCase(),
        name: meta.name ?? symbol,
        market: meta.market ?? 'TWSE',
      },
      { onConflict: 'user_id,symbol' }
    )
    .select()
    .single()

  if (error) throw error
  return data
}

export async function getUserWatchlist(userId: string) {
  const supabase = createSupabaseClient()
  const { data, error } = await supabase
    .from('watchlist_items')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data ?? []
}

export async function syncUserWatchlist(userId: string, symbols: string[]) {
  if (!userId || symbols.length === 0) return []

  const uniqueSymbols = [...new Set(symbols.map((symbol) => symbol.trim().toUpperCase()).filter(Boolean))]

  const result = await Promise.all(
    uniqueSymbols.map((symbol) =>
      upsertWatchlistItem(userId, symbol, {
        name: symbol,
        market: 'TWSE',
      })
    )
  )

  return result
}

export async function saveMarketSnapshot(snapshot: {
  symbol: string
  name: string
  price: number
  change: number
  change_percent: number
  volume?: number | null
  market?: string
  source?: string
}) {
  const supabase = createSupabaseClient()

  const { data, error } = await supabase
    .from('market_snapshots')
    .insert({
      symbol: snapshot.symbol.toUpperCase(),
      name: snapshot.name,
      price: snapshot.price,
      change: snapshot.change,
      change_percent: snapshot.change_percent,
      volume: snapshot.volume ?? null,
      market: snapshot.market ?? 'TWSE',
      source: snapshot.source ?? 'api',
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function saveUserEvent(userId: string, eventType: string, payload?: Record<string, unknown>) {
  const supabase = createSupabaseClient()

  const { data, error } = await supabase
    .from('user_events')
    .insert({
      user_id: userId,
      event_type: eventType,
      payload: payload ?? {},
    })
    .select()
    .single()

  if (error) throw error
  return data
}
