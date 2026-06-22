import type { LetterResult } from "./types";

// Evaluate a guess against the answer, Wordle-style.
//
// Two passes so duplicate letters behave correctly: a letter only earns "present"
// if there is still an unmatched copy of it left in the answer. Example:
//   answer "ALOFT", guess "LLAMA" -> the second L is "absent", not "present",
//   because the answer's single L was already consumed by an earlier letter.
//
// Comparison is case-insensitive; guess and answer must be the same length.
export function evaluateGuess(guess: string, answer: string): LetterResult[] {
  const g = guess.toLowerCase();
  const a = answer.toLowerCase();

  if (g.length !== a.length) {
    throw new Error(
      `Guess length (${g.length}) must match answer length (${a.length}).`,
    );
  }

  const results: LetterResult[] = new Array(g.length).fill("absent");

  // Count answer letters that are NOT already an exact match, so later passes
  // can "spend" them for "present" hits.
  const remaining = new Map<string, number>();

  // Pass 1: exact matches.
  for (let i = 0; i < g.length; i++) {
    if (g[i] === a[i]) {
      results[i] = "correct";
    } else {
      remaining.set(a[i], (remaining.get(a[i]) ?? 0) + 1);
    }
  }

  // Pass 2: present (wrong spot) for letters with an unmatched copy left.
  for (let i = 0; i < g.length; i++) {
    if (results[i] === "correct") continue;

    const left = remaining.get(g[i]) ?? 0;
    if (left > 0) {
      results[i] = "present";
      remaining.set(g[i], left - 1);
    }
  }

  return results;
}

// True when every position is an exact match (the word is solved).
export function isSolved(results: LetterResult[]): boolean {
  return results.length > 0 && results.every((r) => r === "correct");
}
