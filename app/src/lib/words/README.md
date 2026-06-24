# lib/words — shared word engine

Used by **both** game modes (`features/daily` and `features/game`). Build once here.

Planned files:
- `wordList.ts` — curated word list(s).
- `evaluateGuess.ts` — `evaluate(guess: string, answer: string): LetterResult[]`.
  Must handle duplicate letters correctly (the classic Wordle edge case: a letter guessed
  twice but present once should not show two yellows).
- `types.ts` — `export type LetterResult = "correct" | "present" | "absent";`

Keep these as **pure functions** (no React, no Supabase) so both modes and tests can import
them. See `docs/game-design.md`.
