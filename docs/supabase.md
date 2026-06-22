# Supabase Setup (First Time)

This guide explains how to set up Supabase for local development if you don’t have access to the shared project.

---

## 1. Create a Supabase project

1. Go to https://supabase.com
2. Create an account (if needed)
3. Click **New Project**
4. Choose name, password and region
5. Wait for the project to be ready

---

## 2. Get API credentials

In your Supabase dashboard:

1. Go to **Project Settings → API**
2. Copy:
   - Project URL
   - `anon` (publishable) key

---

## 3. Configure environment variables

Create a `.env` file inside `/app` and add:

VITE_SUPABASE_URL=your_project_url  
VITE_SUPABASE_PUBLISHABLE_KEY=your_anon_key

Double check that these are correctly used in your Supabase client (e.g. `supabase.ts`).

Do NOT commit this file.

---

## 4. Enable authentication

Go to:

Authentication → Providers → Email

Make sure **Email/password** login is enabled.

For local development, you can disable email confirmation if needed.

---

## 5. Create database tables

Go to **Table Editor** (or SQL Editor) and run:

create table public.profiles (
id uuid primary key references auth.users(id) on delete cascade,
username text unique,
created_at timestamptz not null default now()
);

create table public.runs (
id bigint generated always as identity primary key,
user_id uuid not null references public.profiles(id) on delete cascade,
score integer not null default 0,
run_data jsonb not null default '{}'::jsonb,
is_shared boolean not null default false,
created_at timestamptz not null default now()
);

---

## 6. Enable Row Level Security

Run:

alter table public.profiles enable row level security;
alter table public.runs enable row level security;

(Note: You may need to add policies later depending on access needs.)

---

## 7. Test the setup

Start the app locally:

npm run dev

Then test:

- Register a user
- Log in

If this works, Supabase is correctly connected.

---

## 8. Two game modes — schema addition

The app ships two modes (`daily` and `roguelike`) sharing one `runs` table. Add a `mode`
column so leaderboards can be filtered per mode:

alter table public.runs
  add column if not exists mode text not null default 'roguelike'
  check (mode in ('daily', 'roguelike'));

`run_data` (jsonb) stays flexible and holds a different shape per mode (see
`docs/game-design.md`). A per-mode leaderboard is just `... where mode = 'daily'`.

---

## 9. RLS policies (do this before going further)

RLS must be enabled AND have policies, or reads/writes silently fail (or over-expose).

**Leaderboard decision (Phase 5):** the leaderboard shows EVERYONE's scores, so `runs` needs
a public read policy — `using (true)`, not "own runs only". Trade-off: all `run_data`
becomes publicly readable. For a word game that's fine (no sensitive data). Tighten later
with a view exposing only `score/username/created_at` if ever needed.

👉 Use the single copy-paste block in **§10** below — it includes these policies and is
re-runnable. The individual statements are just documented here for reference.

---

## 10. Applying to an EXISTING database (recommended) — or starting fresh

> 📄 The ready-to-run version of all this lives in **`infra/supabase/schema.sql`** —
> just open that file, copy it, and paste into the Supabase SQL Editor. The blocks below
> are the same SQL, kept here for reference/explanation.

If you already have `profiles` + `runs` (the shared project does), you do NOT need to start
over. The changes are additive. **Supabase → SQL Editor → New query**, paste, Run.

### A) Inspect what you have

```sql
select column_name from information_schema.columns
where table_schema = 'public' and table_name = 'runs';
```

### B) Idempotent migration (safe to re-run, does not touch your data)

```sql
-- mode column (skipped if it already exists)
alter table public.runs
  add column if not exists mode text not null default 'roguelike'
  check (mode in ('daily', 'roguelike'));

-- enable RLS (no-op if already on)
alter table public.profiles enable row level security;
alter table public.runs enable row level security;

-- policies: drop-then-create so this whole block is re-runnable
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

-- leaderboard + share need everyone's runs to be readable:
drop policy if exists "runs readable by everyone" on public.runs;
create policy "runs readable by everyone" on public.runs
  for select using (true);
```

After this, the app's save / leaderboard / share flows all work.

### C) Start fresh instead (only if the schema is messy — DELETES run/profile data)

```sql
drop table if exists public.runs cascade;
drop table if exists public.profiles cascade;
```
Then re-run the `create table` blocks from §5 (add the `mode` column to `runs`), then the
policy block in §10-B. Auth users in `auth.users` are NOT affected — only these tables.

---

## Notes

- This setup is for local development
- The main project uses a shared Supabase instance
- Never expose service role keys in frontend code
