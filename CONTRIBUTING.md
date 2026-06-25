# Developing Cards & Words

Setup, local development, and the conventions we use. For the project overview see the
[README](README.md); for the design/architecture see [`docs/`](docs/).

## Project structure

```
root/
├── app/                 # Vite + React + TypeScript frontend (the whole client app)
│   └── src/
│       ├── features/    # daily/, game/ (roguelike), auth/, leaderboard/, runs/
│       ├── lib/         # words/ (shared word engine), runs.ts, art.ts, sound.ts, supabase.ts
│       ├── components/  # shared UI (Tile, NavBar, SettingsMenu, ModifierCard…)
│       └── assets/      # drop-in art & audio (modifiers/, flips/, sfx/, music/…)
├── infra/               # Nginx examples + infra/supabase/schema.sql
├── docs/                # design, architecture, supabase, monitoring, design-system
├── docker-compose.yml
└── .github/workflows/   # CI + deploy
```

## Prerequisites

- Node.js 20+
- (optional) Docker, for the production-like container

## 1. Clone + install

```bash
git clone git@github.com:GoshDaymStudios/word-card-game.git
cd word-card-game/app
npm install
```

## 2. Environment variables

The games run client-side without a backend, but auth / saving / leaderboards need Supabase.
Create `app/.env` from `app/.env.example`:

```
VITE_SUPABASE_URL=your_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_publishable_key
```

The publishable (anon) key is public by design — access is gated by Row Level Security. Never
commit a real `.env` or a service-role key.

## 3. Run

```bash
# Local dev (recommended), with hot reload:
npm run dev          # http://localhost:5173

# Production-like container (from the repo root):
docker compose up --build
```

> Production note: the Docker build needs `VITE_*` at **build time**. docker-compose passes
> them as build args from a root `.env` (next to `docker-compose.yml`). See README
> "Engineering highlights" and `docs/supabase.md`.

## 4. Supabase (first-time)

Run [`infra/supabase/schema.sql`](infra/supabase/schema.sql) in the Supabase SQL Editor
(idempotent: creates the `profiles` / `runs` tables, the `mode` column, and RLS policies).
Enable email/password auth. Details in [`docs/supabase.md`](docs/supabase.md).

## Scripts

```bash
npm run dev          # dev server
npm test             # Vitest (engine, scoring, word logic)
npm run lint         # ESLint
npm run build        # type-check + production build
```

## Quality bar

CI runs `lint` + `test` + `build` on every push; keep all three green. Game logic lives in
pure functions (`lib/words`, `features/game/*.ts`) separate from React — add tests there when
you change rules or scoring.

## Git workflow

Simple feature branches → PR into `main`:

```bash
git checkout -b feature/short-description
# ...changes...
git commit -m "feat: short description"
git push origin feature/short-description
```

Open a PR, keep it focused, merge after CI passes. Don't work directly on `main`, and never
commit `.env` files or secrets. Merging to `main` auto-deploys to the VPS.

## Adding art & sound

Drop a file into the matching `app/src/assets/<category>/` folder named after its key — it's
picked up automatically with a graceful fallback. See
[`docs/design-system.md`](docs/design-system.md) for the naming and the skin/palette system.
