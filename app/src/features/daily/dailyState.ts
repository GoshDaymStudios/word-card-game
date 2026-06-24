import { evaluateGuess, isSolved, type LetterResult } from "../../lib/words";

// Central state for one daily game. JSON-serializable.
export type DailyState = {
  answer: string; // hidden from the player in the UI
  maxAttempts: number;
  guesses: string[];
  results: LetterResult[][];
  status: "playing" | "won" | "lost";
  powerUpUsed: boolean;
  revealedIndex: number | null; // position revealed by the power-up, if any
};

export function createDailyGame(answer: string, maxAttempts = 6): DailyState {
  return {
    answer: answer.toLowerCase(),
    maxAttempts,
    guesses: [],
    results: [],
    status: "playing",
    powerUpUsed: false,
    revealedIndex: null,
  };
}

// A guess is valid if it's the right length and all letters a-z.
export function isValidGuess(guess: string, answerLength: number): boolean {
  return guess.length === answerLength && /^[a-zA-Z]+$/.test(guess);
}

// Apply a guess. No-op if the game is over or the guess is invalid.
export function submitGuess(state: DailyState, guess: string): DailyState {
  if (state.status !== "playing") return state;

  const clean = guess.toLowerCase();
  if (!isValidGuess(clean, state.answer.length)) return state;

  const result = evaluateGuess(clean, state.answer);
  const guesses = [...state.guesses, clean];
  const results = [...state.results, result];

  let status: DailyState["status"] = "playing";
  if (isSolved(result)) status = "won";
  else if (guesses.length >= state.maxAttempts) status = "lost";

  return { ...state, guesses, results, status };
}

// One-time power-up: reveal one not-yet-solved answer position as a free hint.
export function applyPowerUp(state: DailyState): DailyState {
  if (state.powerUpUsed || state.status !== "playing") return state;

  // Positions the player hasn't already pinned as "correct".
  const solved = new Set<number>();
  for (const row of state.results) {
    row.forEach((r, i) => {
      if (r === "correct") solved.add(i);
    });
  }
  const candidates = [...Array(state.answer.length).keys()].filter(
    (i) => !solved.has(i),
  );
  if (candidates.length === 0) return { ...state, powerUpUsed: true };

  const revealedIndex = candidates[Math.floor(Math.random() * candidates.length)];
  return { ...state, powerUpUsed: true, revealedIndex };
}

// Leaderboard score for a finished daily: solved faster = higher. Lost = 0.
// Solve in 1 -> 600, in 6 -> 100 (with the default 6 attempts).
export function dailyScore(state: DailyState): number {
  if (state.status !== "won") return 0;
  return (state.maxAttempts - state.guesses.length + 1) * 100;
}

// Build the shareable emoji grid (Wordle-style).
export function toEmojiGrid(state: DailyState, label: string): string {
  const glyph: Record<LetterResult, string> = {
    correct: "🟩",
    present: "🟨",
    absent: "⬜",
  };
  const score =
    state.status === "won" ? `${state.guesses.length}/${state.maxAttempts}` : "X/" + state.maxAttempts;
  const rows = state.results.map((row) => row.map((r) => glyph[r]).join("")).join("\n");
  return `${label} ${score}\n${rows}`;
}
