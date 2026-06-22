// Modifier ("joker") system. RunState only stores ModifierId[] (serializable);
// the behavior lives here in a registry. Each modifier tweaks scoring and/or how
// many guesses a round allows. Scoring pipeline (see scoring.ts):
//
//   base  = letterPoints + attemptsBonus + Σ addBase(ctx)
//   mult  = (1 + Σ addMult(ctx)) × Π timesMult(ctx)
//   round = round(base × mult)

export type ModifierId =
  | "vowel-lover"
  | "patient"
  | "sniper"
  | "comeback"
  | "snowball"
  | "scholar"
  | "gambler"
  | "consonant-crusher";

// Context passed to a modifier when scoring/setting up a round.
export type ModifierContext = {
  answer: string;
  attemptsUsed: number;
  attemptsAllowed: number;
  lives: number;
  ante: number;
  antesCleared: number;
  solved: boolean;
};

export type ModifierDef = {
  id: ModifierId;
  name: string;
  description: string;
  extraGuesses?: number; // changes attemptsAllowed when the round starts
  addBase?: (ctx: ModifierContext) => number;
  addMult?: (ctx: ModifierContext) => number;
  timesMult?: (ctx: ModifierContext) => number;
};

const VOWELS = new Set(["a", "e", "i", "o", "u"]);
const countVowels = (w: string) => [...w].filter((c) => VOWELS.has(c)).length;

export const MODIFIERS: Record<ModifierId, ModifierDef> = {
  "vowel-lover": {
    id: "vowel-lover",
    name: "Vowel Lover",
    description: "+2 mult for each vowel in the answer.",
    addMult: (ctx) => 2 * countVowels(ctx.answer),
  },
  patient: {
    id: "patient",
    name: "Patient",
    description: "+1 guess each round.",
    extraGuesses: 1,
  },
  sniper: {
    id: "sniper",
    name: "Sniper",
    description: "Solve in 2 guesses or fewer: ×2 round score.",
    timesMult: (ctx) => (ctx.solved && ctx.attemptsUsed <= 2 ? 2 : 1),
  },
  comeback: {
    id: "comeback",
    name: "Comeback",
    description: "On your last life: ×2 round score.",
    timesMult: (ctx) => (ctx.lives <= 1 ? 2 : 1),
  },
  snowball: {
    id: "snowball",
    name: "Snowball",
    description: "+1 mult for every ante you have already cleared.",
    addMult: (ctx) => ctx.antesCleared,
  },
  scholar: {
    id: "scholar",
    name: "Scholar",
    description: "+15 base points.",
    addBase: () => 15,
  },
  gambler: {
    id: "gambler",
    name: "Gambler",
    description: "+4 mult, but −1 guess each round.",
    extraGuesses: -1,
    addMult: () => 4,
  },
  "consonant-crusher": {
    id: "consonant-crusher",
    name: "Consonant Crusher",
    description: "+1 base for each consonant in the answer.",
    addBase: (ctx) => ctx.answer.length - countVowels(ctx.answer),
  },
};

export const ALL_MODIFIER_IDS = Object.keys(MODIFIERS) as ModifierId[];

export function getModifier(id: ModifierId): ModifierDef {
  return MODIFIERS[id];
}
