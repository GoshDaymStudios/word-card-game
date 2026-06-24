# Cards & Words

A web-based word game inspired by Wordle and Balatro.

Built as a small full-stack project with focus on gameplay, persistence, and simple deployment.

---

## Tech Stack

- Frontend: React + TypeScript (Vite)
- Backend: Supabase (Auth + Database)
- DevOps: Docker, docker-compose (local setup)
- Hosting (planned): VPS (Hetzner) + Nginx

---

## Project Structure

```
root/
├── app/ # Frontend application
├── docker-compose.yml # Docker setup
├── docs/ # Notes / architecture / ideas
├── infra/ # Nginx + deployment config
```

---

## Getting Started

### 1. Clone the repository

```
git clone <repo-url>
cd word-card-game
```

---

### 2. Set up environment variables

Create a `.env` file inside `/app` based on `.env.example`.

Example:

```
VITE_SUPABASE_URL=your_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_key
```

Do NOT commit real secrets.

---

### 3. Run the project

You can run the project in two ways:

#### Option A – Local development (recommended)

```
cd app
npm install
npm run dev
```

App runs on:  
http://localhost:5173

---

#### Option B – Docker

From the project root:

```
docker compose up --build
```

App runs on:  
http://localhost:5173

---

## Development Environments

The project can be run in two separate environments:

### Local (npm)

- Runs directly on your machine
- Uses local `node_modules`
- Best for fast development

### Docker

- Runs inside a container
- Has its own isolated `node_modules`
- Ensures consistent environment across machines
- Closer to production setup

These environments are completely separate.

Running `npm install` locally does not affect Docker, and Docker does not affect your local setup.

---

## Supabase Setup

This project uses a shared Supabase project.

To get started:

1. Ask a maintainer for the project URL and publishable key
2. Create a `.env` file inside `app/`
3. Add the required variables:

```
VITE_SUPABASE_URL=your_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_key
```

Do not commit secrets or local `.env` files.

> **Note:** If you don’t have access to the shared project, create your own and follow the setup guide in `/docs`.

> Database schema + RLS: run `infra/supabase/schema.sql` in the Supabase SQL Editor
> (idempotent — safe on an existing DB). Details in `docs/supabase.md`.

---

## Deployment (production)

CI/CD: pushing to `main` triggers a GitHub Action that SSHes into the VPS and runs
`git pull` + `docker compose up -d --build`.

**Important — build-time env vars.** Vite inlines `VITE_*` variables at *build* time, and
the Docker build does not include `.env` (it's gitignored / dockerignored). So the values
are passed as **build args** from a `.env` file sitting next to `docker-compose.yml` on the
server. Without it the app builds fine but shows a **blank page** (the Supabase client throws
on load). Create it once on the server:

```
# /home/<user>/apps/word-card-game/.env  (NOT committed; the anon key is public-safe)
VITE_SUPABASE_URL=https://<your-project>.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_xxx
```

Then `docker compose up -d --build` rebuilds with the values baked in.

---

## Health & Monitoring

The app container serves a health endpoint:

```
GET /health  ->  200 "ok"
```

Monitoring is intentionally two layers:

- **UptimeRobot (external — the real check).** A free HTTP monitor hits
  `https://<domain>/health` from outside the server. Because it runs off-box, it catches
  the case that matters most: the whole VPS being down. **This is the alert we rely on.**

- **Uptime Kuma (self-hosted — dashboard / demo).** Runs as a container on the same VPS
  (`uptime-kuma` service in `docker-compose.yml`). Nice dashboard and history, but it lives
  on the same machine as the app, so it shares the same **failure domain** — if the server
  dies, Kuma dies with it and can't alert. So Kuma is for the dashboard and as a DevOps
  demonstration, **not** the safety net. To be a true external monitor it would need to run
  on a separate host (e.g. a free-tier VM elsewhere).

Kuma listens on `127.0.0.1:3001` (not exposed publicly). Reach it for first-time setup via
an SSH tunnel:

```
ssh -L 3001:localhost:3001 <user>@<vps>
# then open http://localhost:3001
```

…or proxy a subdomain to it from the host Nginx (see `infra/nginx/example.conf`).

---

## Git Workflow

We use a simple feature branch workflow.

### 1. Create a branch

```
git checkout -b feature/short-description
```

Examples:

- feature/auth-page
- feature/leaderboard
- fix/navbar-layout

---

### 2. Make changes and commit

```
git add .
git commit -m "Add: short description"
```

---

### 3. Push your branch

```
git push origin feature/short-description
```

---

### 4. Open Pull Request

- Open a PR into `main`
- Describe what you changed
- Keep it focused and small

---

### 5. Merge

- Merge after review
- Delete branch after merge

---

### Sync your local branch

```
git checkout main
git pull origin main
```

---

### Guidelines

- Do not work directly on `main`
- Keep branches small and focused
- Use clear commit messages
- Do not commit `.env` files or secrets

---

## Current Status

- Two games in one app, sharing a word engine (`app/src/lib/words`):
  - **Daily** (`/daily`) — Wordle-style, date-seeded word, streak, emoji share.
  - **Roguelike** (`/game`) — Balatro-style run: antes, target scores, stacking modifiers.
- Auth, run saving, two leaderboards (per mode), and public run sharing (`/share/:id`).
- Vitest suite (engine + scoring + word logic); CI runs lint + tests + build.
- Dockerised (multi-stage Nginx) with SPA fallback + `/health`; deploy to Hetzner via CI/CD.

See `docs/game-design.md` for the living status/plan.

---

## Roadmap

- [x] Core gameplay loop (both modes)
- [x] Save runs to database
- [x] Leaderboard (per mode)
- [x] Sharing runs
- [x] Deploy to VPS (Docker + Nginx + CI/CD)
- [ ] Polish / juice: animation, sound, "round failed" screen, balance pass
- [ ] Monitoring: UptimeRobot (external) + Uptime Kuma (dashboard)

---

## Authors

Tor – DevOps, infrastructure, deployment, project coordination (+ misc & potatoes)  
Jørgen – Lead developer, frontend, backend, gameplay (+ misc & potatoes)
