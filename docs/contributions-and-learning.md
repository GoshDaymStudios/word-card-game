# Contributions & Learning — Word Card Game

Purpose: an honest record of **who built what**, and a **study guide** of the concepts you
should be able to explain (e.g. in a job interview). Be straight about AI assistance — the
value you can defend is *understanding the system*, not having typed every line.

---

## 1. What Tor (+ Jørgen) built BEFORE AI assistance

This was the foundation — and it's the part most relevant to a DevOps role.

**Project & tooling**
- GitHub repo + clean folder structure (`app/`, `docs/`, `infra/`, `scripts/`).
- Vite + React + TypeScript scaffold.

**Backend (Supabase)**
- Supabase project + client wiring (`app/src/lib/supabase.ts`).
- Auth: email/password sign-up & login, creating a `profiles` row on sign-up.
- Database tables `profiles` and `runs`, with initial Row Level Security policies.

**Infrastructure / DevOps (the core of Tor's work)**
- **Multi-stage Dockerfile** (Node build stage → Nginx runtime serving the static build).
- **docker-compose** to run the app with one command.
- **CI** (GitHub Actions): install + build on push.
- **CD** (GitHub Actions): SSH to the Hetzner VPS and `docker compose up -d --build` on
  push to `main`.
- **The actual server**: Hetzner VPS with Nginx (reverse proxy), HTTPS/Let's Encrypt, UFW
  firewall — and a deployed MVP shell.
- README + `docs/supabase.md`.

**Gameplay**
- A placeholder/stub only: the "engine" added 10 points per guess and ended after 5 — no
  real Wordle logic, no game yet.

> Summary: **strong DevOps/infra scaffold + working auth + DB tables, but no real game.**

---

## 2. What was built WITH AI assistance (Claude)

Built collaboratively in this project. You directed decisions; Claude wrote/most of the
code and explained it. Treat all of it as *your project to understand*.

**Direction & cleanup**
- Decided **two games in one app** (Daily + Roguelike) sharing one backend/engine.
- Archived dead sandbox folders; established `word-card-game/` as canonical.
- A living design/status doc (`docs/game-design.md`).

**Gameplay (the missing core)**
- **Shared word engine** `app/src/lib/words/`: `evaluateGuess` with correct duplicate-letter
  handling, `isSolved`, a ~640-word list, deterministic `wordAt`.
- **Daily** (`/daily`): date-seeded Wordle, 6 guesses, color feedback, streak (localStorage),
  emoji share, one "reveal a letter" power-up.
- **Roguelike** (`/game`): seeded run, antes 1–8 with rising targets (`40 × 1.5^(ante-1)`),
  3 lives, scoring × multiplier pipeline, 8 stacking modifiers, pick-1-of-3 between antes,
  win/lose. Pure logic in `gameEngine.ts` / `scoring.ts` / `modifiers.ts`, separate from UI.

**Persistence & features**
- `app/src/lib/runs.ts` — one place for all DB calls (`saveRun`, `getLeaderboard`,
  `shareRun`, `getSharedRun`, `getMyRuns`).
- Mode-tabbed leaderboard, public share page `/share/:id`, cleaned-up "my runs" page.
- `infra/supabase/schema.sql` — idempotent schema + RLS (`mode` column, public-read for the
  leaderboard).

**Quality & infra**
- **Vitest**: 30 tests over the engine, scoring and word logic.
- Fixed all ESLint errors; added `lint` + `test` to **CI** (now lint + test + build).
- **Container Nginx** (`app/nginx.conf`): SPA fallback (fixes deep-link 404s) + `/health`
  endpoint; filled the host reverse-proxy example.
- **Monitoring**: Uptime Kuma added to docker-compose (same-host dashboard/demo) + README
  documenting why UptimeRobot (external) is the real check.
- Git: feature branch, logical commits, opened PR #1, CI green.

---

## 3. What you should be able to EXPLAIN (study guide)

Short answers so you can speak to the whole system honestly. If asked "did you write this?",
the honest and strong answer is: *"I architected and directed it, used AI to accelerate the
code, and I understand how every part works — here's how."*

### Architecture
- **Two games, one app.** Both modes share auth, DB, Docker/CI and a word engine; only the
  gameplay differs. Why: avoid duplicating infrastructure and a second deployment.
- **Game logic separated from UI.** Rules live in pure TypeScript functions
  (`gameEngine.ts`, `scoring.ts`); React only renders state and calls those functions. Why:
  testable, predictable, reusable.
- **Central state object** (`RunState`) updated by one function per action — easy to save
  (it's JSON), test, and reason about.

### Docker
- **Multi-stage build.** Stage 1 (Node) installs deps and runs `npm run build`; stage 2
  (`nginx:alpine`) only copies the built static files. Why: the final image has no Node or
  source — small and closer to prod.
- **Why Nginx, not `npm run dev`, in prod.** Vite's dev server is for development (HMR,
  unminified). In prod you serve the pre-built static files with a real web server.
- **`docker compose up --build`** builds and runs everything with one command. Port mapping
  `"5173:80"` = host 5173 → container 80.

### The SPA deep-link bug (good story)
- A React Router SPA does routing in the browser. With plain static serving, refreshing or
  directly opening `/leaderboard` makes Nginx look for a file at that path → **404**.
- Fix: `try_files $uri $uri/ /index.html;` — unknown paths fall back to `index.html`, and
  React Router takes over. This is in `app/nginx.conf`.

### Health endpoint & monitoring
- **`/health`** returns `200 "ok"` (served directly by the container's Nginx). It's a cheap
  "is the app responding?" probe for monitors and load balancers.
- **Failure domains** (the key insight): a monitor on the *same server* dies with the server,
  so it can't tell you the server is down. So **UptimeRobot runs off-box** (the real alert),
  while **Uptime Kuma** on the same VPS is a dashboard/demo, not the safety net. A true
  self-hosted external monitor would need a separate host.

### CI/CD
- **CI** (on every push/PR): install → lint → test → build. Catches breakage before deploy.
- **CD** (on push to `main`): GitHub Actions SSHes into the VPS and runs
  `docker compose up -d --build`. Secrets (host, user, SSH key) are stored as GitHub Secrets,
  never in the repo.
- **Feature-branch workflow**: branch → PR → CI must pass → review → merge → auto-deploy.

### Supabase / database
- Managed **Postgres** + **Auth**. The frontend talks to it with the **anon/publishable
  key** (safe to expose; it's gated by RLS).
- **Row Level Security (RLS)**: Postgres policies decide which rows each user can read/write.
  Examples here: users insert/update only their own runs; everyone can read runs (so the
  leaderboard works). RLS is *enforced by the database*, not the frontend.
- **`run_data` as JSONB**: flexible per-mode game data in one column instead of many tables.
- **`mode` column**: one `runs` table serves both games; leaderboards filter by `mode`.

### Environment variables & secrets
- `VITE_`-prefixed vars are embedded in the frontend build (public by design — only put
  publishable keys there). Real secrets live in GitHub Secrets / on the server, never
  committed. `.env` is gitignored; `.env.example` documents the shape.

### Testing
- **Vitest** unit-tests the pure logic (guess evaluation incl. the tricky duplicate-letter
  case, scoring, run flow). Why test these: they're deterministic and the part most likely
  to have subtle bugs. CI runs them so a regression fails the build.

### Frontend basics
- **React + hooks** (`useState`, `useEffect`), **React Router** for client-side routes,
  custom hooks (`useGame`, `useDaily`) wrapping the pure engine for the UI.
- A **seeded RNG** makes runs reproducible (same seed → same words/modifiers) — useful for
  daily challenges and testing.

---

## 4. Honesty note (for portfolio / interviews)

Lean into what's true and strong: you own the **architecture, the DevOps pipeline, and the
understanding of the whole system**, and you used AI as a force-multiplier for implementation
— which is itself a relevant, modern skill. Don't claim to have hand-written every line.
Being able to explain *why* each piece exists (this doc) is worth more than authorship, and
it's defensible.
