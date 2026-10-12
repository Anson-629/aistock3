create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.user_preferences (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  preferences jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.watchlist_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  symbol text not null,
  name text,
  market text not null default 'TWSE',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, symbol)
);

create table if not exists public.market_snapshots (
  id uuid primary key default gen_random_uuid(),
  symbol text not null,
  name text,
  price numeric(18,2) not null,
  change numeric(18,2) not null default 0,
  change_percent numeric(18,2) not null default 0,
  volume bigint,
  market text not null default 'TWSE',
  source text not null default 'api',
  created_at timestamptz not null default now()
);

create table if not exists public.user_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  event_type text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_watchlist_items_user_id on public.watchlist_items(user_id);
create index if not exists idx_market_snapshots_symbol_created_at on public.market_snapshots(symbol, created_at desc);
create index if not exists idx_user_events_user_id_created_at on public.user_events(user_id, created_at desc);

alter table public.profiles enable row level security;
alter table public.user_preferences enable row level security;
alter table public.watchlist_items enable row level security;
alter table public.market_snapshots enable row level security;
alter table public.user_events enable row level security;

drop policy if exists "Users can view own profile" on public.profiles;
drop policy if exists "Users can update own profile" on public.profiles;
drop policy if exists "Users can insert own profile" on public.profiles;
drop policy if exists "Users can manage own preferences" on public.user_preferences;
drop policy if exists "Users can manage own watchlist" on public.watchlist_items;
drop policy if exists "Users can manage own events" on public.user_events;
drop policy if exists "Public read market snapshots" on public.market_snapshots;
drop policy if exists "Authenticated users can insert market snapshots" on public.market_snapshots;

create policy "Users can view own profile" on public.profiles
  for select using (auth.uid() = id);

create policy "Users can update own profile" on public.profiles
  for update using (auth.uid() = id);

create policy "Users can insert own profile" on public.profiles
  for insert with check (auth.uid() = id);

create policy "Users can manage own preferences" on public.user_preferences
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Users can manage own watchlist" on public.watchlist_items
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Users can manage own events" on public.user_events
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Public read market snapshots" on public.market_snapshots
  for select using (true);

create policy "Authenticated users can insert market snapshots" on public.market_snapshots
  for insert with check (auth.role() = 'authenticated');
