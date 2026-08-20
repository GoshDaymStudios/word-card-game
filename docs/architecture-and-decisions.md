# Architecture & decisions — Cards & Words

How the project is built, the key engineering decisions behind it, and the concepts to be
able to explain. Honest about process: this started as a solo build and became a deliberate
experiment in AI-augmented development.

## The story (how it was built)

Cards & Words began as **a solo project** with a DevOps focus — the goal was to learn
shipping and operating a real web app, not just writing front-end code. The **foundation was
built first, by hand**:

- Project scaffold (Vite + React + TypeScript) and repo structure.
- **Supabase**: auth (email/password + profiles), the `profiles` / `runs` tables, RLS.
- **Docker** (multi-stage build) + **docker-compose**.
- **CI/CD** with GitHub Actions: build on push, and SSH deploy to a **Hetzner VPS** on merge.
- The server itself: **Nginx** reverse proxy, **HTTPS / Let's Encrypt**, **UFW** firewall.

At that point the infrastructure was real but the game was a placeholder. From there, **AI
(Claude) was brought in on purpose** — as a way to (a) build out the actual gameplay quickly,
(b) learn the codebase by improving it, and (c) harden the DevOps side. I (Tor) architected and
directed; the AI accelerated implementation. We're transparent about this because AI-assisted
development is a normal, useful skill — and because being able to _explain_ the system (below)
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

See `docs/game-design.md` (the game design/plan) and `docs/design-system.md` (visual/audio)
for detail.

## Planned: infrastructure as code (Azure + Terraform)

**Decision (2026-08-20):** the infrastructure this app runs on is currently set up by hand — a
Hetzner VPS with host-Nginx, Let's Encrypt and UFW, described in prose rather than defined in
code. That is the one real gap in an otherwise complete ship-it-and-operate-it stack, and it
gets closed by defining an Azure environment for this same app in Terraform under
`infra/terraform/`.

**How:** Azure Container Apps running the existing image, Key Vault for secrets, a custom domain
with a managed certificate, and Log Analytics. Supabase stays as the database in the first pass —
swapping it for Postgres Flexible Server is a separate exercise, not a prerequisite.

**Run it alongside production, not as a cutover.** The Hetzner deployment keeps serving
birkelandboss.no while the Terraform environment is built and torn down repeatedly. Whether Azure
becomes the real production is decided later, with actual monthly cost numbers on the table — not
as a side effect of learning the tool.

**Cost control is part of the exercise:** a budget alert is set before the first `terraform apply`,
and the environment is destroyed between sessions. Being able to answer "what does this cost per
month" is part of the skill.

**Definition of done:** `terraform destroy` followed by `terraform apply` takes an empty
subscription to a running app that answers 200 on `/health`, with no manual clicking in the
portal, documented in `infra/terraform/README.md`.

Rationale and the wider sequence live in `../cashflow-os/docs/strategy/05-plattformstigen.md`
(steps P1 and P3).

## Case study material

This project doubles as the reference case for production/platform work. The parts worth telling:

- **A real production outage, diagnosed and fixed.** Switching the container from the Vite dev
  server to a static Nginx build took production blank: Vite inlines environment variables at
  *build* time, and the Docker build had none. Fixed by passing them as build args. A concrete
  build-time-vs-runtime lesson, not a hypothetical one.
- **Security enforced in the database, not the client.** Row-level security means the public
  Supabase key is safe to ship.
- **Monitoring with the right nuance.** An external UptimeRobot check hits `/health` from
  off-box, because a monitor on the same server dies with the server; Uptime Kuma provides the
  dashboard. See `docs/monitoring.md`.
- **Deployment secrets never live in the repo** — they are GitHub Secrets, injected at build time.
