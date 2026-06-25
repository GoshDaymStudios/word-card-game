# Cards & Words 🎴

A web word game that mixes the simplicity of **Wordle** with the roguelike runs, stacking
modifiers and escalating tension of **Balatro** — wrapped in a small but real
ship-it-and-operate-it stack.

**Live demo:** [birkelandboss.no](https://birkelandboss.no)
**Status:** Early access / beta. Playable end to end; gameplay balance, art and audio are
still being polished.

<!-- TODO: drop a gameplay GIF / screenshots here (see docs/screenshots/). -->

---

## Why we built this

I recently finished my bachelor in **Digital Infrastructure and Cybersecurity at NTNU**, and
the part that stuck with me wasn't any single language — it was everything *around* the code:
Linux, virtualization, cloud, monitoring, infrastructure as code, and getting robust services
to actually run in production. I wanted a project where I could practise that for real: not a
tutorial, but a live app that I deploy, break, fix and keep running.

So a friend and I (we tinker under the name **GoshDaymStudios**) picked a deliberately *simple,
fun* product as the vehicle — a word game — and put the effort into the engineering behind it:
Docker, CI/CD, a VPS behind Nginx, environment/secrets handling, a health endpoint and
monitoring. The game is the fun excuse; shipping and operating it like a real product is the
point.

I love that something this small can still exercise the whole pipeline end to end.

## How it was built (and an honest note on AI)

I built the **foundation by hand** — the part most relevant to where I want to work: the repo
and project structure, Supabase auth and database, the Dockerfile and docker-compose, the
GitHub Actions CI/CD, and the Hetzner VPS with Nginx, HTTPS and a firewall. At that point the
infrastructure was real, but the game itself was a placeholder.

From there I worked **with AI as a partner**: I used Claude to build out the actual gameplay
quickly and to harden the DevOps side, while I directed the product, the architecture and the
decisions. I'm deliberately transparent about this — building effectively with AI is, I
believe, a real and increasingly valuable skill — but the vision and the engineering judgment
are mine. Being able to *explain why every part exists* (below) matters more than who typed
each line, and I can.

## What's under the hood

It looks simple on the surface, and the UX is meant to be. The interesting part is everything
behind it:

- **Two games, one app.** A daily Wordle and a Balatro-style roguelike run share one auth, one
  database, one deployment and one **word engine** (`lib/words`) — only the gameplay differs.
  Game logic is pure TypeScript, kept separate from React, and unit-tested.
- **Supabase backend** with **Row Level Security** — access is enforced in the database, not
  the frontend (which is why the public anon key is safe to ship). One `runs` table with a
  `mode` column + flexible JSON per run powers two leaderboards and public run sharing.
- **Production-minded Docker:** a multi-stage build (Node builds, Nginx serves the static
  output), with an **SPA fallback** so deep links don't 404 and a **`/health`** endpoint for
  monitoring.
- **CI/CD:** GitHub Actions runs lint + tests + build on every push, then SSH-deploys to the
  VPS on merge to `main`. Secrets live in GitHub Secrets, never in the repo.
- **Monitoring with a bit of nuance:** an external **UptimeRobot** check hits `/health` from
  off-box (a monitor on the same server dies *with* the server), while a self-hosted **Uptime
  Kuma** gives a dashboard.
- **Real-world resilience.** Shipping for real means hitting real problems: after switching the
  container from the dev server to a proper static Nginx build, production went blank — Vite
  inlines environment variables at *build* time and the Docker build had none. Diagnosing and
  fixing that (passing the values as build args) was exactly the kind of build-time-vs-runtime
  lesson I wanted from this project.
- **Drop-in art & sound pipelines** and a **live skin switcher** — add an image or audio clip
  by filename and it's picked up automatically; swap between a clean "Classic" look and a few
  Balatro-inspired dark skins on the fly.

## The game

- **Daily** — a date-seeded Wordle: everyone gets the same word, with a streak and a shareable
  result.
- **Roguelike** — a run of word rounds with rising target scores, three lives, and stacking
  **modifiers** you pick between antes (vowel bonuses, fast-solve multipliers, comebacks…).
  Clear the final ante to win; miss a target too often and the run ends.

## Tech stack

React 19 + TypeScript (Vite) · Supabase (Postgres + Row Level Security) · Vitest · Docker +
docker-compose · GitHub Actions (CI/CD) · Hetzner VPS + Nginx · UptimeRobot + Uptime Kuma ·
deployed at [birkelandboss.no](https://birkelandboss.no).

## Run it locally

The games themselves run client-side, so you can play without any backend:

```bash
cd app
npm install
npm run dev      # http://localhost:5173
```

Auth, saving and leaderboards need a Supabase project — see
[`CONTRIBUTING.md`](CONTRIBUTING.md) for the full setup, Docker usage, and the database schema
(`infra/supabase/schema.sql`). Architecture and decisions live in
[`docs/architecture-and-decisions.md`](docs/architecture-and-decisions.md).

## License

© Tor Arne Birkeland & Jørgen (GoshDaymStudios). Shared publicly for portfolio and
demonstration purposes — see [`LICENSE`](LICENSE).

---

Made by two friends who wanted an excuse to ship something real. Hope you enjoy a run or two —
and thanks for reading. 🎴
