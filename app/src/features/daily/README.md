# features/daily — Daily Wordle-lite mode

Route: `/daily`. The simplest mode: one date-seeded word per day, 6 guesses, streak,
shareable emoji grid, one optional power-up.

Imports the shared engine from `lib/words/` (do NOT reimplement guess evaluation here).

Planned files (keep logic separate from UI):
- `daily.ts` — `getWordForDate(date): string` (seeded), streak helpers (localStorage).
- `dailyState.ts` — `DailyState` type + `submitGuess(state, guess): DailyState`.
- `useDaily.ts` — React hook wrapping the state.
- `DailyPage.tsx` — UI only; renders state, no game rules.

Full spec + state shape: `docs/game-design.md` (Mode A).
