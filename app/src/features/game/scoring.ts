import { getModifier, type ModifierContext, type ModifierId } from "./modifiers";

// Points per solved letter (a solved word is all "correct").
export const POINTS_PER_LETTER = 10;
// Bonus per unused guess, rewarding fast solves.
export const BONUS_PER_UNUSED_GUESS = 5;

// Score one finished round. An unsolved round scores 0.
export function scoreRound(
  ctx: ModifierContext,
  modifiers: ModifierId[],
): number {
  if (!ctx.solved) return 0;

  const letterPoints = ctx.answer.length * POINTS_PER_LETTER;
  const attemptsBonus =
    (ctx.attemptsAllowed - ctx.attemptsUsed) * BONUS_PER_UNUSED_GUESS;

  let base = letterPoints + attemptsBonus;
  let mult = 1;
  let multFactor = 1;

  for (const id of modifiers) {
    const m = getModifier(id);
    if (m.addBase) base += m.addBase(ctx);
    if (m.addMult) mult += m.addMult(ctx);
    if (m.timesMult) multFactor *= m.timesMult(ctx);
  }

  return Math.round(base * mult * multFactor);
}

// Attempts a round allows, after modifier adjustments (floored at 1).
export function attemptsForRound(
  baseAttempts: number,
  modifiers: ModifierId[],
): number {
  let attempts = baseAttempts;
  for (const id of modifiers) {
    attempts += getModifier(id).extraGuesses ?? 0;
  }
  return Math.max(1, attempts);
}
