# Architecture & decisions — Cards & Words

How the project is built, the key engineering decisions behind it, and the concepts to be
able to explain. Honest about process: this started as a solo build and became a deliberate
experiment in AI-augmented development.

## The story (how it was built)

Cards & Words began as **Tor's solo project** with a DevOps focus — the goal was to learn
shipping and operating a real web app, not just writing front-end code. The **foundation was
built first, by hand**:

- Project scaffold (Vite + React + TypeScript) and repo structure.
- **Supabase**: auth (email/password + profiles), the `profiles` / `runs` tables, RLS.
- **Docker** (multi-stage build) + **docker-compose**.
- **CI/CD** with GitHub Actions: build on push, and SSH deploy to a **Hetzner VPS** on merge.
- The server itself: **Nginx** reverse proxy, **HTTPS / Let's Encrypt**, **UFW** firewall.

At that point the infrastructure was real but the game was a placeholder. From there, **AI
(Claude) was brought in on purpose** — as a way to (a) build out the actual gameplay quickly,
(b) learn the codebase by improving it, and (c) harden the DevOps side. Tor architected and
directed; the AI accelerated implementation. We're transparent about this because AI-assisted
development is a normal, useful skill — and because being able to *explain* the system (below)
matters more than who typed each line.

**Built with AI assistance:** the two game modes and the shared word engine, scoring and
modifiers, run persistence, leaderboards and sharing, the test suite, the visual theme and
the art/sound pipelines — plus DevOps hardening: container Nginx (SPA fallback + `/health`),
CI lint+test, monitoring, and a production build-time-env fix.

## What it is

A web word game mixing **Wordle** (simple, everyone knows words) with **Balatro** (roguelike
runs, stacking modifiers, escalating tension). **Two games in one app:**

- **Daily** — a date-seeded Wordle with streaks and a shareable result.
- **Roguelike** — a run of word rounds with rising target scores and stacking modifiers.

They share one auth, one database, one deployment, and one word engine — only the gameplay
differs.

## Key decisions

- **Two games, one app.** Avoids duplicating infrastructure and a second deployment; shared
  Wordle logic lives once in `lib/words/`.
- **Game logic separated from UI.** Rules are pure TypeScript (`gameEngine.ts`, `scoring.ts`);
  React only renders state. Testable and predictable.
- **One `runs` table with a `mode` column + JSON `run_data`.** Flexible per-mode data without
  many tables; leaderboards filter by `mode`.
- **Static build served by Nginx in production** (not the dev server) — small image, real web
  server, with an SPA fallback so deep links work.
- **Drop-in art & sound pipelines** (`import.meta.glob`) — add a file named after its key, no
  code change.

## What I can explain (study guide)

- **Docker multi-stage build** — Node stage builds; Nginx stage serves only the static
  output. Why: small image, closer to prod.
- **SPA deep-link 404** — a client-routed SPA 404s on refresh of `/leaderboard` under plain
  static serving; `try_files $uri /index.html` fixes it (`app/nginx.conf`).
- **Build-time vs runtime config** — Vite inlines `VITE_*` at *build* time; the Docker build
  must receive them as build args (a real bug we hit and fixed when the prod bundle shipped
  with no Supabase env → blank page).
- **Row Level Security (RLS)** — Postgres policies enforce access in the database, not the
  frontend; that's why the Supabase anon key is safe to expose.
- **CI/CD** — CI runs lint + tests + build; CD SSHes to the VPS and runs
  `docker compose up -d --build`; secrets live in GitHub Secrets.
- **Failure domains in monitoring** — a monitor on the same box dies with the box, so the real
  alert (UptimeRobot) runs off-box hitting `/health`; self-hosted Uptime Kuma is the dashboard.

See `docs/game-design.md` (architecture/plan) and `docs/design-system.md` (visual/audio) for
detail.
