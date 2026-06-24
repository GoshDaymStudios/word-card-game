# Game Design & Plan — Word Card Game

Master design doc. Vision, architecture, both game modes, DB schema, and the phased plan.

> **This doc is the living source of truth.** Update the Status section below whenever a
> phase moves. Design sections describe the target; the Status section describes reality.

## ▶ Resume here (next action) — updated 2026-06-24

DB is live (schema.sql ran: `mode` column + RLS confirmed). **Daily save → leaderboard is
verified live in the browser** (screenshot: two daily scores ranked). Code is lint/test/
build clean and committed on `feature/two-games-mvp`.

Remaining MANUAL checks (need a real browser / server — Claude's sandbox can't reach
Supabase and has no Docker):
1. **Roguelike chain:** play `/game` → Save → Leaderboard "Roguelike" shows it → click
   Share → open `/share/:id`. (Daily is already verified; roguelike + share are not.)
2. **Container `/health` + deep links:** after deploying the new image, hit
   `https://<domain>/health` (expect `ok`) and refresh a deep link like `/leaderboard`
   (must NOT 404 — the new nginx.conf SPA fallback fixes that).
3. **UptimeRobot** monitor pointing at `/health`.
4. **Push branch + open PR** (outward-facing — confirm first).

After those: **Phase 6 (juice/polish)** is the main remaining build work.

## Status (living) — updated 2026-06-24

| Phase | What | State |
|---|---|---|
| 0 | Cleanup sandboxes + this design doc | ✅ done |
| 1 | Shared `lib/words/` (wordList ~640, `evaluateGuess`, `isSolved`, `wordAt`) | ✅ done + verified |
| 1 | `mode` column on `runs` + RLS | ✅ live (ran `infra/supabase/schema.sql`; diagnostics confirmed) |
| 2 | Daily mode (`/daily`) — seed word, 6 guesses, streak, emoji share, reveal power-up | ✅ done + played in browser |
| 2 | Roguelike mode (`/game`) — antes 1–8, scoring×mult, pick-1-of-3 modifiers, win/lose | ✅ done + played in browser |
| 3 | DevOps: `/health`, nginx conf, CI lint+test, RLS, monitoring | 🟡 done: container nginx (SPA fallback + `/health`), host proxy example, CI lint+test+build, RLS live, Uptime Kuma in docker-compose + README "Health & Monitoring". Left: deploy-verify `/health`, set up UptimeRobot (external) |
| 4 | Wire completed runs → Supabase, both modes | ✅ done — both save via `lib/runs.ts`. Daily **verified live**; roguelike save pending manual check |
| 5 | Two leaderboards (filter `mode`) + share page `/share/:id` | ✅ done — mode-tabbed `LeaderboardPage` (daily verified live), `SharePage`, GamePage share button (pending manual check) |
| 6 | Juice/polish (animation, sound) | ⬜ not started |
| 7 | Docs + README refresh | 🟡 ongoing |

**Open follow-ups / known gaps (running TODO)**
- [ ] **MANUAL: verify roguelike chain live** — play `/game` → Save → Leaderboard
      "Roguelike" → Share → `/share/:id`. (Daily is verified; roguelike + share are not.)
- [ ] **MANUAL: deploy + verify `/health` and deep-link refresh** don't 404 (new nginx.conf).
      Claude's sandbox has no Docker, so this is a deploy-time check.
- [ ] **MANUAL: UptimeRobot** monitor on `/health` (external = the real check). Uptime Kuma
      is already wired in docker-compose as the same-host dashboard/demo (see README).
- [ ] **MANUAL: Uptime Kuma first-run setup** after deploy (SSH tunnel to `127.0.0.1:3001`,
      create admin user, add a monitor on the app's `/health`).
- [ ] **Push branch + open PR** (outward-facing — confirm first).
- [ ] **Daily allows multiple saves per day** → leaderboard can show duplicate entries per
      user/day. Add a "one save per day" guard or a "best per user" leaderboard query.
- [ ] **Roguelike UX:** failing a target mid-ante silently swaps the board — add a "round
      failed / life lost" interstitial (Phase 6 polish).
- [ ] **Balance pass** on roguelike once more modifiers exist (targets/scoring are a first cut).
- [ ] **No nav/header** — pages have ad-hoc `← Home` links; a shared nav would be nicer (Phase 6).
- [x] ~~No test runner~~ — Vitest added; 30 tests cover `evaluateGuess`, scoring, engine flow.
- [x] ~~Leaderboard reads legacy fields~~ — rewritten mode-aware in `LeaderboardPage`.
- [x] ~~Daily not wired to Supabase~~ — both modes now save via `lib/runs.ts` (daily verified live).
- [x] ~~Lint not in CI / RunsPage legacy code~~ — RunsPage rewritten (getMyRuns), all
      set-state-in-effect errors fixed, `npm run lint` now runs in CI.
- [x] ~~DB not live~~ — `infra/supabase/schema.sql` run; `mode` column + RLS confirmed.

## Vision

A web word game that blends **Wordle** (dead-simple, everyone knows words) with **Balatro**
(roguelike runs, stacking modifiers, escalating tension, flashy juice/music). We ship
**two games inside one app** — they share a backend and a word engine.

## Core decision: two games, ONE app

We are NOT picking a single direction. We build both:

| Mode | Route | Folder | Lead (suggested) |
|---|---|---|---|
| **Daily** (Wordle-lite) | `/daily` | `app/src/features/daily/` | Tor |
| **Roguelike run** (Balatro-core) | `/game` | `app/src/features/game/` | Jørgen |

They share **one** auth, **one** Supabase, **one** Docker/CI/CD, **one** domain, and a
**shared word engine** in `app/src/lib/words/` (word list + guess evaluation). Only the
gameplay doubles — everything else is built once. This keeps work parallel and
merge-conflict-free: one dev per feature folder, both meet in `lib/words/`.

---

## Shared core — `lib/words/`

Both modes need identical Wordle mechanics, so build once:
- `wordList.ts` — curated word list(s).
- `evaluateGuess.ts` — `evaluate(guess, answer): LetterResult[]`, with correct handling of
  duplicate letters (the classic Wordle edge case).
- Shared types: `type LetterResult = "correct" | "present" | "absent";`

---

## Mode A — Daily (Wordle-lite)

**One sentence:** Wordle, one puzzle/day, same word for everyone, plus a small twist and
some Balatro juice.

**Loop:**
1. Today's word from a **date seed** (`daysSinceEpoch % wordList.length`) — same for all, no server.
2. Guess a 5-letter word, max **6 attempts**.
3. Feedback per letter: correct / present / absent (green / yellow / gray).
4. Win on all-green; lose after 6 misses.
5. **Streak** in `localStorage`. **Shareable emoji grid** on the end screen.

**Twist (optional, recommended):** one single-use daily power-up — `Reveal a letter` or
`50/50`. A nod to the roguelike side.

**State:**
```ts
type DailyState = {
  answer: string;                 // hidden from player
  guesses: string[];
  results: LetterResult[][];
  status: "playing" | "won" | "lost";
  powerUpUsed: boolean;
};
```

**Out of scope (for now):** multiple lengths, languages, themed days.

---

## Mode B — Roguelike run (Balatro-core)

**One sentence:** A run is a series of Wordle rounds with an escalating target score;
between rounds you pick stacking modifiers — play until you fail a target or clear the
final ante.

**Loop (one run):**
1. Start: `lives = 3`, `score = 0`, `ante = 1`, no modifiers. Seeded RNG.
2. Round = one word (Wordle feedback, ~5 attempts).
3. Score = `(letter points + bonuses) × multiplier` (see below).
4. Each ante has a **target score** — beat it to advance, miss it → lose a life / end.
5. After clearing an ante: **pick 1 of 3 modifiers**; they stack (hold up to ~5).
6. Difficulty scales: higher targets, longer/rarer words, later an alphabet/language axis.
7. End: WIN by clearing the final ante (~8), LOSE on running out.
8. Result (final score + modifiers) → saved & leaderboarded.

**Scoring (AS BUILT, `scoring.ts`):** solved word = `5 × 10 = 50` base; `+5` per unused
guess (rewards fast solves); a round is only scored if solved (else 0). Pipeline:
`base = letterPoints + attemptsBonus + Σ addBase`, `mult = (1 + Σ addMult) × Π timesMult`,
`roundScore = round(base × mult)`. Targets: `round(40 × 1.5^(ante-1))` →
40, 60, 90, 135, 203, 304, 456, 683. Base 40 means any solve clears ante 1; the curve
forces modifier-driven scaling after that. Miss the target → lose a life, retry same ante.

**Modifiers (AS BUILT — 8, `modifiers.ts`):** Vowel Lover (+2 mult/vowel), Patient (+1
guess), Sniper (×2 if solved in ≤2), Comeback (×2 on last life), Snowball (+1 mult per ante
already cleared), Scholar (+15 base), Gambler (+4 mult but −1 guess), Consonant Crusher (+1
base per consonant). Stored as `ModifierId[]`; behavior lives in a registry. Hold up to 5.
_(Design backlog, not yet built: Hot Start / Lucky 7 / Polyglot / Long Word Lover — need
per-guess reveals or longer words first.)_

**State (AS BUILT, `types.ts`):**
```ts
type RunState = {
  seed: number;
  ante: number;
  targetScore: number;
  score: number;            // cumulative across the run
  lives: number;
  modifiers: ModifierId[];
  antesCleared: number;
  roundNumber: number;      // drives the seeded RNG
  offered: ModifierId[];    // the 3 choices shown while status === "choosing"
  status: "playing" | "choosing" | "won" | "lost";
  round: RoundState;
};
type RoundState = {
  answer: string;
  attemptsAllowed: number;
  guesses: string[];
  results: LetterResult[][];
  roundScore: number;
  status: "playing" | "cleared" | "failed";
};
```
All JSON-serializable → fits `runs.run_data`.

**Out of scope (for now):** persistence/login/leaderboard (real app does it), heavy
animation, the full alphabet/language system (stub as one late-game difficulty modifier).

---

## Database — one table, two modes

Keep the minimal schema, add **one column** so both modes coexist:
- `runs` gets `mode text not null default 'roguelike'` (`'daily' | 'roguelike'`).
- Two leaderboards = filter by `mode`. `run_data` (jsonb) stays flexible per mode.

See `supabase.md` for the migration + RLS policies.

---

## Phased plan (two games, one app)

- **Phase 0** — Cleanup sandbox folders; this design doc. (done this session)
- **Phase 1** — Shared `lib/words/` (list + `evaluateGuess`). Add `mode` column to `runs`.
- **Phase 2 (parallel gameplay)** — A: `features/game/` (roguelike) · B: `features/daily/`.
- **Phase 3 (parallel, gameplay-independent — Tor)** — `/health`, fill `infra/nginx/example.conf`,
  CI lint+test, RLS policies, monitoring (UptimeRobot).
- **Phase 4** — Wire completed runs to Supabase for both modes (real data shapes).
- **Phase 5** — Two leaderboards (filter `mode`) + public share page (`/share/:id`).
- **Phase 6** — Juice/polish both (animation, sound, theming).
- **Phase 7** — Docs + README refresh.

**Known cleanups folded into the phases:** leaderboard reads wrong fields
(`run_data.result/rounds` vs saved `round/guesses/status`) → fix in Phase 4/5; empty
`infra/nginx/example.conf` → Phase 3; `birkelandboss.no` in `vite.config.ts` `allowedHosts`
only affects the dev server (prod serves a static build via nginx) → tidy in Phase 3.
