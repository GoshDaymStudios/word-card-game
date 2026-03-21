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

## Notes

- This setup is for local development
- The main project uses a shared Supabase instance
- Never expose service role keys in frontend code
