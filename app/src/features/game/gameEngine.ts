import type { RunState } from "./types";

export function createNewRun(): RunState {
  return {
    round: 1,
    score: 0,
    status: "playing",
    guesses: [],
  };
}

export function submitGuess(state: RunState, guess: string): RunState {
  const nextGuesses = [...state.guesses, guess];
  const nextScore = guess.length > 0 ? state.score + 10 : state.score;

  const isFinished = nextGuesses.length >= 5;

  return {
    ...state,
    guesses: nextGuesses,
    score: nextScore,
    round: state.round + 1,
    status: isFinished ? "won" : "playing",
  };
}
