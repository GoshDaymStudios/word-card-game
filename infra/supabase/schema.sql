-- Word Card Game — full Supabase schema + RLS (idempotent).
-- Safe to run on an existing database OR a fresh one. Does not delete data.
-- Run in: Supabase Dashboard -> SQL Editor -> New query -> paste -> Run.
--
-- To start COMPLETELY fresh instead, first run (DELETES all run/profile data):
--   drop table if exists public.runs cascade;
--   drop table if exists public.profiles cascade;
-- then run this file.

-- 1. Tables ------------------------------------------------------------------
create table if not exists public.profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  username   text unique,
  created_at timestamptz not null default now()
);

create table if not exists public.runs (
  id         bigint generated always as identity primary key,
  user_id    uuid not null references public.profiles(id) on delete cascade,
  score      integer not null default 0,
  run_data   jsonb not null default '{}'::jsonb,
  is_shared  boolean not null default false,
  created_at timestamptz not null default now()
);

-- 2. mode column (daily | roguelike) ----------------------------------------
alter table public.runs
  add column if not exists mode text not null default 'roguelike'
  check (mode in ('daily', 'roguelike'));

-- 3. Row Level Security ------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.runs     enable row level security;

-- 4. Policies (drop-then-create so this whole file is re-runnable) -----------
drop policy if exists "profiles readable by everyone" on public.profiles;
create policy "profiles readable by everyone" on public.profiles
  for select using (true);

drop policy if exists "users insert own profile" on public.profiles;
create policy "users insert own profile" on public.profiles
  for insert with check (auth.uid() = id);

drop policy if exists "users update own profile" on public.profiles;
create policy "users update own profile" on public.profiles
  for update using (auth.uid() = id);

drop policy if exists "users insert own runs" on public.runs;
create policy "users insert own runs" on public.runs
  for insert with check (auth.uid() = user_id);

-- Needed so a user can flag their own run as shared (shareRun -> update is_shared).
drop policy if exists "users update own runs" on public.runs;
create policy "users update own runs" on public.runs
  for update using (auth.uid() = user_id);

-- Leaderboard + share need everyone's runs to be readable.
-- Trade-off: all run_data is publicly readable (fine for a word game).
drop policy if exists "runs readable by everyone" on public.runs;
create policy "runs readable by everyone" on public.runs
  for select using (true);

-- 5. OPTIONAL cleanup --------------------------------------------------------
-- Older databases may have legacy duplicate policies (capitalised names) from
-- an earlier setup. They're harmless (permissive policies OR together) but
-- cluttered. Uncomment to drop them; the policies created above fully replace them.
--
-- drop policy if exists "Users can view own profile"   on public.profiles;
-- drop policy if exists "Users can insert own profile" on public.profiles;
-- drop policy if exists "Users can update own profile" on public.profiles;
-- drop policy if exists "Anyone can view shared runs"  on public.runs;
-- drop policy if exists "Users can view own runs"      on public.runs;
-- drop policy if exists "Users can insert own runs"    on public.runs;
-- drop policy if exists "Users can update own runs"    on public.runs;
