// Effect system for the roguelike run ("Manuscript"). The design splits content from
// behavior the same way modifiers.ts did, but generalized:
//
//   - Content is data: each muse/ink/censor is a registry row whose tunable numbers
//     live in `config`, so balancing never touches logic.
//   - Behavior is a set of hook functions keyed by hook name. Hooks are pure queries:
//     they receive a read-only context and return an EffectDescriptor (or null),
//     never mutating anything. The scorer applies descriptors in a fixed order.
//
// This keeps every effect independently testable and lets the UI replay scoring as a
// paced cascade (see scoring.ts, which emits a trace of everything that fired).
import type { LetterResult, WordLength } from "../../lib/words";
import type { BlindKind } from "./types";

export type Rarity = "common" | "uncommon" | "rare";

export type HookName =
  | "onRoundStart" // may grant extraGuesses before the round begins
  | "onLetterScored" // fires per scored tile (ctx.letter is set)
  | "onGuessScored" // fires per submitted guess row (ctx.guessIndex is set)
  | "onRoundEnd"; // fires once when a solved round is scored

// What an effect contributes. All fields optional; the scorer applies them in a fixed
// order: addChips accumulate, addMult accumulates, timesMult multiplies at the end.
export type EffectDescriptor = {
  addChips?: number;
  addMult?: number;
  timesMult?: number;
  ink?: number; // currency granted (paid out when the round is cleared)
  extraGuesses?: number; // only meaningful from onRoundStart
  message?: string; // floating text shown by the juice layer
};

export type LetterCtx = {
  letter: string;
  result: LetterResult; // effective result (after censor rules)
  position: number; // 0-based within the word
  guessIndex: number;
  wordLength: WordLength;
};

// Read-only snapshot handed to every hook.
export type ScoreCtx = {
  answer: string;
  wordLength: WordLength;
  guesses: string[];
  results: LetterResult[][]; // effective results (after censor rules)
  solved: boolean;
  attemptsUsed: number;
  attemptsAllowed: number;
  lives: number;
  ante: number;
  blind: BlindKind;
  chaptersCleared: number;
  censorsBeaten: number;
  ink: number;
  letter?: LetterCtx; // set for onLetterScored
  guessIndex?: number; // set for onGuessScored
  rng: (stream: string) => () => number; // named PRNG streams off the run seed
};

export type MuseHooks = Partial<Record<HookName, (ctx: ScoreCtx) => EffectDescriptor | null>>;

export type MuseDef = {
  id: string;
  name: string;
  description: string;
  flavor?: string;
  rarity: Rarity;
  price: number;
  config: Record<string, number>; // tunable numbers, referenced by the hooks
  interestCapBonus?: number; // static economy tweak (no hook needed)
  unlock?: string; // achievement id gating this muse; undefined = always available
  hooks: MuseHooks;
};

// Scale a descriptor by a muse's level (Copyist's Ink upgrades): additive effects grow
// linearly, multiplicative effects grow in their distance from 1.
export function scaleDescriptor(d: EffectDescriptor, level: number): EffectDescriptor {
  if (level <= 1) return d;
  const f = 1 + 0.25 * (level - 1);
  return {
    ...d,
    addChips: d.addChips !== undefined ? Math.round(d.addChips * f) : undefined,
    addMult: d.addMult !== undefined ? Math.round(d.addMult * f * 10) / 10 : undefined,
    timesMult: d.timesMult !== undefined ? 1 + (d.timesMult - 1) * f : undefined,
  };
}
