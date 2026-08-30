# Game Design & Plan — Cards & Words

Design notes for Cards & Words: the vision, the two game modes, scoring and modifiers, the
data model, and how it was built in phases.

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
## Mode B — Manuscript (Balatro-inspired roguelike, AS BUILT)

**One sentence:** A run ("Manuscript") is 8 chapters of word rounds — two ordinary
blinds and a boss per chapter — where tile chips × Flourish must beat an escalating
target, funded by an ink economy and shaped by passive Muses, one-shot Inks and
censor rules.

**Theme/naming** (scriptorium — deliberately our own names, no Balatro terms):

| Concept | Name |
|---|---|
| Run | **Manuscript** · win screen: "Published!" |
| Ante 1–8 | **Chapter** |
| Small/Big/Boss blind | **First Draft** (skippable) / **Fair Copy** / **The Censor** |
| Jokers (max 5) | **Muses** |
| Consumables (max 2) | **Inks** (vials) |
| Currency | **Ink** ⬤ |
| Shop | **The Scriptorium** |
| Chips × Mult | **Letters × Flourish** (internally `chips`/`mult`) |
| Stakes | **Ink Grades**: Charcoal → Sepia → Crimson → Violet → Gold |

**Chapter loop:** blind-select (choose word length; Draft 4/5, Fair Copy 5/6, Censor
6/7) → play the round → scoring cascade playback → Scriptorium → next blind. Failing
a blind costs a life (start with 2) and returns to blind-select for the same blind.
Chapter 8's censor is always The Editor-in-Chief; beating them wins.

**Scoring (`scoring.ts`):** green tile +8 chips, yellow +3, counted on every guess
row; solve bonus +10 × word length; Flourish = 1 + 2 per unused guess + Σ muse
addMult, times Π muse timesMult. Unsolved round = 0. The engine returns a full
**trace** of events (tile/muse/bonus/final) which `ScorePlayback` replays as a paced
cascade. Targets: base `[100, 240, 550, 1200, 2700, 6000, 13000, 28000]` × blind
factor (1 / 1.5 / 2) × grade factor.

**Economy:** clearing pays 3/4/5⬤ by blind + 1⬤ per unused guess (cap 3) + interest
(1⬤ per 5⬤ held, cap 5). Scriptorium: 3 rarity-weighted slots (~75% muse, rare 5% /
uncommon 25% / common 70%), occasional extra-life item, reroll 5⬤ +1 per reroll,
sell-back at half price.

**Content registries** (data rows + hook functions returning effect descriptors —
see `effects.ts` for the contract):
- **30 Muses** (`muses.ts`): 18 common / 9 uncommon / 3 rare. Hooks: onRoundStart /
  onLetterScored / onGuessScored / onRoundEnd. Upgradeable via Copyist's Ink (level
  scales the config numbers).
- **8 Inks** (`inks.ts`): reveal a letter, rule out 5 letters, +1 guess, double
  greens, swap the answer, upgrade a muse, shield a failure, +5⬤.
- **11 Censors** (`censors.ts`): declarative rule bundles — banned letter, fewer
  guesses, masked yellows, forced opening, guess tax, muted muse, forced 7-letter,
  delayed feedback, demoted greens, raised target/double payout, and the combined
  Editor-in-Chief.

**Words (`lib/words/`):** answers per length (500/640/700/500 for 4/5/6/7) curated
from a frequency list; guess validation against ENABLE dictionaries (lazy-loaded,
code-split per length). Regenerate with `scripts/generate-wordlists.mjs`.

**Determinism:** every random decision draws a named stream off the run seed
(`lib/rng.ts` — `word:{n}`, `shop:{ante}:{blind}:{rerolls}`, `boss:{ante}`, …), so a
seed fully determines a run. Seeds are shareable strings.

**Persistence:** the whole `RunState` (v2, versioned) autosaves to localStorage on
every change; reload resumes silently. `persistence.ts#migrateRun` gates loading.

**Meta-progression (`lib/progress.ts`):** 13 achievements gate 20 of the 30 muses
(10 available from the start); lifetime stats; Ink Grades unlock by winning the
grade below (Sepia: 1 life · Crimson: +20% targets · Violet: pricier rerolls, lower
interest cap · Gold: censor rules on Fair Copies too). Progress lives in
localStorage and mirrors to Supabase `player_progress` when logged in (merge on
load). The Collection page (`/collection`) shows everything, locked items as
silhouettes with unlock hints.

---

## Database — one table per concern

- `runs` with `mode text` (`'daily' | 'roguelike'`) — two leaderboards by filter;
  `run_data` (jsonb) holds the full serialized state.
- `player_progress` — one row per player, `data` jsonb mirrors the client's
  ProgressData (achievements, stats, grade ladder).

See `supabase.md` for schema + RLS.

---

## Status (2026-08-30)

Phases 0–7 of the original plan are complete, plus the roguelike expansion: full
chapter/censor loop, economy + Scriptorium, consumables, scoring-cascade juice, and
the unlock tree. Remaining backlog: balance simulation tuning, editions on muse
cards, skip-bookmarks, challenges, music assets, server-side score validation.
