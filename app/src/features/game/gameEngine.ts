import { evaluateGuess, isSolved, wordAt, WORDS } from "../../lib/words";
import { ALL_MODIFIER_IDS, type ModifierContext, type ModifierId } from "./modifiers";
import { attemptsForRound, scoreRound } from "./scoring";
import type { RoundState, RunState } from "./types";

export const FINAL_ANTE = 8;
export const BASE_ATTEMPTS = 6;
export const STARTING_LIVES = 3;
export const MAX_MODIFIERS = 5;

// Score the current round must reach to clear a given ante. Base 40 means simply
// solving the word always clears ante 1 (even a slow solve scores 50); the 1.5x
// curve quickly forces the player to build score via modifiers.
export function targetForAnte(ante: number): number {
  return Math.round(40 * Math.pow(1.5, ante - 1));
}

// --- Seeded RNG (mulberry32) ------------------------------------------------
function rngFor(seed: number, roundNumber: number): () => number {
  let a = (seed ^ (roundNumber * 0x9e3779b1)) >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pickWord(rng: () => number): string {
  return wordAt(Math.floor(rng() * WORDS.length));
}

// Up to 3 modifiers the player doesn't already hold, drawn with the seeded RNG.
function offerModifiers(rng: () => number, held: ModifierId[]): ModifierId[] {
  const pool = ALL_MODIFIER_IDS.filter((id) => !held.includes(id));
  // Fisher–Yates with the seeded rng.
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, 3);
}

function beginRound(seed: number, roundNumber: number, modifiers: ModifierId[]): RoundState {
  const rng = rngFor(seed, roundNumber);
  return {
    answer: pickWord(rng),
    attemptsAllowed: attemptsForRound(BASE_ATTEMPTS, modifiers),
    guesses: [],
    results: [],
    roundScore: 0,
    status: "playing",
  };
}

export function createRun(seed: number = Math.floor(Math.random() * 1_000_000)): RunState {
  return {
    seed,
    ante: 1,
    targetScore: targetForAnte(1),
    score: 0,
    lives: STARTING_LIVES,
    modifiers: [],
    antesCleared: 0,
    roundNumber: 1,
    offered: [],
    status: "playing",
    round: beginRound(seed, 1, []),
  };
}

function isValidGuess(guess: string): boolean {
  return guess.length === 5 && /^[a-zA-Z]+$/.test(guess);
}

// Apply one guess. No-op unless the run is actively playing and the guess is valid.
export function submitGuess(state: RunState, guess: string): RunState {
  if (state.status !== "playing") return state;
  const clean = guess.toLowerCase();
  if (!isValidGuess(clean)) return state;

  const round = state.round;
  const result = evaluateGuess(clean, round.answer);
  const guesses = [...round.guesses, clean];
  const results = [...round.results, result];
  const solved = isSolved(result);
  const attemptsUsed = guesses.length;
  const roundOver = solved || attemptsUsed >= round.attemptsAllowed;

  // Round still in progress.
  if (!roundOver) {
    return { ...state, round: { ...round, guesses, results } };
  }

  // Round finished — score it.
  const ctx: ModifierContext = {
    answer: round.answer,
    attemptsUsed,
    attemptsAllowed: round.attemptsAllowed,
    lives: state.lives,
    ante: state.ante,
    antesCleared: state.antesCleared,
    solved,
  };
  const roundScore = scoreRound(ctx, state.modifiers);
  const cleared = roundScore >= state.targetScore;

  const finishedRound: RoundState = {
    ...round,
    guesses,
    results,
    roundScore,
    status: cleared ? "cleared" : "failed",
  };

  if (cleared) {
    const antesCleared = state.antesCleared + 1;
    const score = state.score + roundScore;

    if (state.ante >= FINAL_ANTE) {
      return { ...state, round: finishedRound, antesCleared, score, status: "won" };
    }

    // Offer modifiers; the actual ante advance happens on chooseModifier/skip.
    const offered = offerModifiers(rngFor(state.seed, state.roundNumber + 1000), state.modifiers);
    return {
      ...state,
      round: finishedRound,
      antesCleared,
      score,
      offered,
      status: "choosing",
    };
  }

  // Missed the target — lose a life. End the run on the last life, otherwise pause
  // on a "round-failed" screen so the player sees what happened (continueAfterFailure
  // starts the next attempt).
  const lives = state.lives - 1;
  if (lives <= 0) {
    return { ...state, round: finishedRound, lives: 0, status: "lost" };
  }
  return { ...state, round: finishedRound, lives, status: "round-failed" };
}

// After a "round-failed" pause, start the next attempt at the same ante.
export function continueAfterFailure(state: RunState): RunState {
  if (state.status !== "round-failed") return state;
  const roundNumber = state.roundNumber + 1;
  return {
    ...state,
    roundNumber,
    round: beginRound(state.seed, roundNumber, state.modifiers),
    status: "playing",
  };
}

// Advance to the next ante after the choosing step. id === null means "skip".
export function chooseModifier(state: RunState, id: ModifierId | null): RunState {
  if (state.status !== "choosing") return state;

  let modifiers = state.modifiers;
  if (id !== null && state.offered.includes(id) && modifiers.length < MAX_MODIFIERS) {
    modifiers = [...modifiers, id];
  }

  const ante = state.ante + 1;
  const roundNumber = state.roundNumber + 1;
  return {
    ...state,
    modifiers,
    ante,
    targetScore: targetForAnte(ante),
    roundNumber,
    offered: [],
    round: beginRound(state.seed, roundNumber, modifiers),
    status: "playing",
  };
}
