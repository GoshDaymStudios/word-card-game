// Scoring pipeline. Computes the round total synchronously AND emits a trace — the
// ordered list of everything that fired (tile chips, muse triggers, totals) — which
// the UI plays back as a paced cascade. The pipeline order is the game design:
//
//   tiles score chips (per row, in order) → muses react per tile → muses react per
//   guess → solve bonus → muses react to the round → total = chips × Flourish
//
// where Flourish = (1 + Σ addMult) × Π timesMult. An unsolved round scores 0.
import type { LetterResult } from "../../lib/words";
import { rngStream } from "../../lib/rng";
import { scaleDescriptor, type EffectDescriptor, type HookName, type ScoreCtx } from "./effects";
import { getMuse, type MuseId } from "./muses";
import { hasRule, type CensorRule } from "./censors";
import type { RoundState, RunState } from "./types";

export const CHIPS_PER_GREEN = 8;
export const CHIPS_PER_YELLOW = 3;
export const SOLVE_CHIPS_PER_LETTER = 10;
export const MULT_PER_UNUSED_GUESS = 2;

export type ScoringEvent =
  | { kind: "tile"; guessIndex: number; position: number; letter: string; result: LetterResult; chips: number }
  | { kind: "muse"; museId: MuseId; hook: HookName; effect: EffectDescriptor }
  | { kind: "guess-total"; guessIndex: number; chips: number }
  | { kind: "solve-bonus"; chips: number; mult: number }
  | { kind: "final"; chips: number; mult: number; times: number; total: number };

export type ScoreResult = {
  total: number;
  inkEarned: number; // ink granted by muse effects (paid when the round clears)
  trace: ScoringEvent[];
};

// The result a tile is *scored* as, after censor rules (display stays truthful).
function effectiveResult(result: LetterResult, rule: CensorRule | null): LetterResult {
  if (result === "correct" && hasRule(rule, "greens-demoted")) return "present";
  return result;
}

function tileChips(letter: string, result: LetterResult, round: RoundState): number {
  if (round.bannedLetter !== null && letter === round.bannedLetter) return 0;
  if (result === "correct") return round.gilded ? CHIPS_PER_GREEN * 2 : CHIPS_PER_GREEN;
  if (result === "present") return CHIPS_PER_YELLOW;
  return 0;
}

export function chaptersCleared(state: RunState): number {
  return state.history.filter((h) => h.blind === "censor" && !h.skipped).length;
}

// Score a finished (or in-progress, for provisional display) round.
export function scoreRound(state: RunState, rule: CensorRule | null, solved: boolean): ScoreResult {
  const round = state.round;
  const trace: ScoringEvent[] = [];
  if (!solved) {
    trace.push({ kind: "final", chips: 0, mult: 1, times: 1, total: 0 });
    return { total: 0, inkEarned: 0, trace };
  }

  const activeMuses = state.muses.filter((m) => m.id !== round.mutedMuse);
  const effResults = round.results.map((row) => row.map((r) => effectiveResult(r, rule)));
  const beaten = chaptersCleared(state);

  const baseCtx: Omit<ScoreCtx, "letter" | "guessIndex"> = {
    answer: round.answer,
    wordLength: round.wordLength,
    guesses: round.guesses,
    results: effResults,
    solved,
    attemptsUsed: round.guesses.length,
    attemptsAllowed: round.attemptsAllowed,
    lives: state.lives,
    ante: state.ante,
    blind: state.blind,
    chaptersCleared: beaten,
    censorsBeaten: beaten,
    ink: state.ink,
    rng: (stream: string) => rngStream(state.seed, `${stream}:${state.blindIndex}`),
  };

  let chips = 0;
  let multAdd = 0;
  let times = 1;
  let inkEarned = 0;

  const applyMuseHook = (hook: HookName, ctx: ScoreCtx) => {
    for (const owned of activeMuses) {
      const fn = getMuse(owned.id).hooks[hook];
      if (!fn) continue;
      const raw = fn(ctx);
      if (!raw) continue;
      const effect = scaleDescriptor(raw, owned.level);
      chips += effect.addChips ?? 0;
      multAdd += effect.addMult ?? 0;
      times *= effect.timesMult ?? 1;
      inkEarned += effect.ink ?? 0;
      trace.push({ kind: "muse", museId: owned.id, hook, effect });
    }
  };

  round.guesses.forEach((guess, guessIndex) => {
    let rowChips = 0;
    for (let position = 0; position < guess.length; position++) {
      const letter = guess[position];
      const result = effResults[guessIndex][position];
      const earned = tileChips(letter, result, round);
      rowChips += earned;
      trace.push({ kind: "tile", guessIndex, position, letter, result, chips: earned });
      applyMuseHook("onLetterScored", {
        ...baseCtx,
        letter: { letter, result, position, guessIndex, wordLength: round.wordLength },
      });
    }
    chips += rowChips;
    applyMuseHook("onGuessScored", { ...baseCtx, guessIndex });
    trace.push({ kind: "guess-total", guessIndex, chips: rowChips });
  });

  const bonusChips = SOLVE_CHIPS_PER_LETTER * round.wordLength;
  const unused = round.attemptsAllowed - round.guesses.length;
  const bonusMult = MULT_PER_UNUSED_GUESS * Math.max(0, unused);
  chips += bonusChips;
  multAdd += bonusMult;
  trace.push({ kind: "solve-bonus", chips: bonusChips, mult: bonusMult });

  applyMuseHook("onRoundEnd", { ...baseCtx });

  const mult = 1 + multAdd;
  const total = Math.round(chips * mult * times);
  trace.push({ kind: "final", chips, mult, times, total });
  return { total, inkEarned, trace };
}

// Chips accumulated so far in an unfinished round (provisional display only —
// an unsolved round still scores 0 in the end).
export function provisionalChips(round: RoundState, rule: CensorRule | null): number {
  let sum = 0;
  round.results.forEach((row, gi) => {
    row.forEach((r, pos) => {
      sum += tileChips(round.guesses[gi][pos], effectiveResult(r, rule), round);
    });
  });
  return sum;
}

// How many guesses a round allows: base 6, muse onRoundStart adjustments, censor rule.
export const BASE_ATTEMPTS = 6;

export function attemptsForBlind(state: RunState, rule: CensorRule | null): number {
  let attempts = BASE_ATTEMPTS;
  const stub: ScoreCtx = {
    answer: "",
    wordLength: 5,
    guesses: [],
    results: [],
    solved: false,
    attemptsUsed: 0,
    attemptsAllowed: BASE_ATTEMPTS,
    lives: state.lives,
    ante: state.ante,
    blind: state.blind,
    chaptersCleared: chaptersCleared(state),
    censorsBeaten: chaptersCleared(state),
    ink: state.ink,
    rng: (stream: string) => rngStream(state.seed, `${stream}:${state.blindIndex}`),
  };
  for (const owned of state.muses) {
    const fn = getMuse(owned.id).hooks.onRoundStart;
    const effect = fn?.(stub);
    attempts += effect?.extraGuesses ?? 0;
  }
  if (rule) {
    for (const r of rule.kind === "combined" ? rule.rules : [rule]) {
      if (r.kind === "fewer-guesses") attempts -= r.count;
    }
  }
  return Math.max(1, attempts);
}
