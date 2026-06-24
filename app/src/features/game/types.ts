import type { LetterResult } from "../../lib/words";
import type { ModifierId } from "./modifiers";

// One word challenge inside a run.
export type RoundState = {
  answer: string; // hidden from the player in the UI
  attemptsAllowed: number;
  guesses: string[];
  results: LetterResult[][];
  roundScore: number;
  status: "playing" | "cleared" | "failed";
};

// The whole run. Fully JSON-serializable (modifiers stored as ids) so it drops
// straight into the Supabase `runs.run_data` column.
export type RunState = {
  seed: number;
  ante: number; // current ante (1..FINAL_ANTE)
  targetScore: number; // score the current round must reach to clear the ante
  score: number; // cumulative score across the run
  lives: number;
  modifiers: ModifierId[]; // held modifiers (stack)
  antesCleared: number;
  roundNumber: number; // global counter, drives the seeded RNG
  offered: ModifierId[]; // the 3 choices shown while status === "choosing"
  // round-failed = missed the ante target but still have lives left (pause screen)
  status: "playing" | "choosing" | "round-failed" | "won" | "lost";
  round: RoundState;
};
