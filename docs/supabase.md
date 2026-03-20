# Install supabase

# Log into supabase, create project and find "VITE_SUPABASE_URL=..." and "VITE_SUPABASE_PUBLISHABLE_KEY=...", create .end file and insert these variables to .env. Double check supabase.ts.

# Go to mysql editor:

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

alter table public.profiles enable row level security;
alter table public.runs enable row level security;

## Then ..

Authentication → Providers → Email

## Then ..

4. Sjekk én ting i dashboardet

I Supabase: Authentication → Providers → Email

Pass på at email/password er aktivert. Supabase Auth støtter dette direkte som standard login-metode.
