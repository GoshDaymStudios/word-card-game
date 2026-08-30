// Muse registry — the run's passive companions (the joker analog). 30 at launch:
// 18 common / 9 uncommon / 3 rare. Each is a data row; behavior lives in small hook
// functions reading tunables from `config` (see effects.ts for the contract).
import type { EffectDescriptor, MuseDef, ScoreCtx } from "./effects";

export type MuseId =
  // commons
  | "inkwell"
  | "quill"
  | "marginalia"
  | "typesetter"
  | "chorister"
  | "second-draft"
  | "laconic"
  | "wastebasket"
  | "patron"
  | "illuminated-initial"
  | "echo"
  | "lexicographer"
  | "slow-ink"
  | "prolific"
  | "treasurer"
  | "overture"
  | "minimalist"
  | "apprentice"
  // uncommons
  | "prodigy"
  | "deadline"
  | "serialist"
  | "first-take"
  | "novelist"
  | "lyricist"
  | "gold-leaf"
  | "fair-hand"
  | "unbowed"
  // rares
  | "oracle"
  | "magnum-opus"
  | "gilded-nib";

const VOWELS = new Set(["a", "e", "i", "o", "u"]);
const RARE_LETTERS = new Set(["j", "q", "x", "z"]);
const isVowel = (c: string) => VOWELS.has(c);
const countVowels = (w: string) => [...w].filter(isVowel).length;
const hasDoubledLetter = (w: string) => new Set(w).size < w.length;
const scored = (r: string) => r === "correct" || r === "present";

// Shorthand for "only fires when the tile counts".
function perTile(
  fn: (ctx: ScoreCtx) => EffectDescriptor | null,
): (ctx: ScoreCtx) => EffectDescriptor | null {
  return (ctx) => (ctx.letter ? fn(ctx) : null);
}

export const MUSES: Record<MuseId, MuseDef> = {
  // ---- Commons ---------------------------------------------------------------
  inkwell: {
    id: "inkwell",
    name: "Inkwell",
    description: "+{mult} Flourish.",
    flavor: "Never runs dry. Rarely runs deep.",
    rarity: "common",
    price: 4,
    config: { mult: 2 },
    hooks: { onRoundEnd: () => ({ addMult: MUSES.inkwell.config.mult, message: `+${MUSES.inkwell.config.mult} Flourish` }) },
  },
  quill: {
    id: "quill",
    name: "Quill",
    description: "+{chips} Letters.",
    flavor: "Standard issue. Dependable.",
    rarity: "common",
    price: 4,
    config: { chips: 20 },
    hooks: { onRoundEnd: () => ({ addChips: MUSES.quill.config.chips, message: `+${MUSES.quill.config.chips} Letters` }) },
  },
  marginalia: {
    id: "marginalia",
    name: "Marginalia",
    description: "+{chips} Letters per yellow tile.",
    flavor: "The notes in the margin matter most.",
    rarity: "common",
    price: 5,
    config: { chips: 8 },
    hooks: {
      onLetterScored: perTile((ctx) =>
        ctx.letter!.result === "present" ? { addChips: MUSES.marginalia.config.chips } : null,
      ),
    },
  },
  typesetter: {
    id: "typesetter",
    name: "The Typesetter",
    description: "+{chips} Letters per green consonant.",
    flavor: "Sets every letter in its place.",
    rarity: "common",
    price: 4,
    config: { chips: 4 },
    hooks: {
      onLetterScored: perTile((ctx) =>
        ctx.letter!.result === "correct" && !isVowel(ctx.letter!.letter)
          ? { addChips: MUSES.typesetter.config.chips }
          : null,
      ),
    },
  },
  chorister: {
    id: "chorister",
    name: "The Chorister",
    description: "+{chips} Letters per scored vowel.",
    flavor: "A, E, I, O, U — a five-part harmony.",
    rarity: "common",
    price: 4,
    config: { chips: 4 },
    hooks: {
      onLetterScored: perTile((ctx) =>
        scored(ctx.letter!.result) && isVowel(ctx.letter!.letter)
          ? { addChips: MUSES.chorister.config.chips }
          : null,
      ),
    },
  },
  "second-draft": {
    id: "second-draft",
    name: "Second Draft",
    description: "+{guesses} guess each round.",
    flavor: "Nobody has to see the first one.",
    rarity: "common",
    price: 5,
    config: { guesses: 1 },
    hooks: { onRoundStart: () => ({ extraGuesses: MUSES["second-draft"].config.guesses }) },
  },
  laconic: {
    id: "laconic",
    name: "The Laconic",
    description: "+{mult} Flourish per unused guess.",
    flavor: "Says less. Means more.",
    rarity: "common",
    price: 5,
    config: { mult: 1 },
    hooks: {
      onRoundEnd: (ctx) => {
        const unused = ctx.attemptsAllowed - ctx.attemptsUsed;
        return unused > 0 ? { addMult: MUSES.laconic.config.mult * unused } : null;
      },
    },
  },
  wastebasket: {
    id: "wastebasket",
    name: "Wastebasket",
    description: "+{chips} Letters per gray tile.",
    flavor: "Every discarded page taught you something.",
    rarity: "common",
    price: 4,
    config: { chips: 2 },
    hooks: {
      onLetterScored: perTile((ctx) =>
        ctx.letter!.result === "absent" ? { addChips: MUSES.wastebasket.config.chips } : null,
      ),
    },
  },
  patron: {
    id: "patron",
    name: "The Patron",
    description: "+{ink}⬤ when you clear a round.",
    flavor: "Art needs funding. Funding needs flattery.",
    rarity: "common",
    price: 5,
    config: { ink: 2 },
    hooks: { onRoundEnd: () => ({ ink: MUSES.patron.config.ink, message: `+${MUSES.patron.config.ink}⬤` }) },
  },
  "illuminated-initial": {
    id: "illuminated-initial",
    name: "Illuminated Initial",
    description: "+{chips} Letters when the first letter is green.",
    flavor: "Begin in gold leaf.",
    rarity: "common",
    price: 5,
    config: { chips: 12 },
    hooks: {
      onLetterScored: perTile((ctx) =>
        ctx.letter!.position === 0 && ctx.letter!.result === "correct"
          ? { addChips: MUSES["illuminated-initial"].config.chips }
          : null,
      ),
    },
  },
  echo: {
    id: "echo",
    name: "Echo",
    description: "+{mult} Flourish if the answer has a doubled letter.",
    flavor: "…letter… letter…",
    rarity: "common",
    price: 4,
    config: { mult: 3 },
    hooks: {
      onRoundEnd: (ctx) =>
        hasDoubledLetter(ctx.answer) ? { addMult: MUSES.echo.config.mult } : null,
    },
  },
  lexicographer: {
    id: "lexicographer",
    name: "The Lexicographer",
    description: "+{chips} Letters per scored J, Q, X or Z.",
    flavor: "Collects the words nobody else wants.",
    rarity: "common",
    price: 4,
    config: { chips: 15 },
    hooks: {
      onLetterScored: perTile((ctx) =>
        scored(ctx.letter!.result) && RARE_LETTERS.has(ctx.letter!.letter)
          ? { addChips: MUSES.lexicographer.config.chips }
          : null,
      ),
    },
  },
  "slow-ink": {
    id: "slow-ink",
    name: "Slow Ink",
    description: "+{mult} Flourish if you solve on your 5th guess or later.",
    flavor: "Dries slowly. Sets permanently.",
    rarity: "common",
    price: 4,
    config: { mult: 4, fromGuess: 5 },
    hooks: {
      onRoundEnd: (ctx) =>
        ctx.solved && ctx.attemptsUsed >= MUSES["slow-ink"].config.fromGuess
          ? { addMult: MUSES["slow-ink"].config.mult }
          : null,
    },
  },
  prolific: {
    id: "prolific",
    name: "The Prolific",
    description: "+{chips} Letters per guess you submit.",
    flavor: "Quantity has a quality all of its own.",
    rarity: "common",
    price: 4,
    config: { chips: 8 },
    hooks: { onGuessScored: () => ({ addChips: MUSES.prolific.config.chips }) },
  },
  treasurer: {
    id: "treasurer",
    name: "The Treasurer",
    description: "Interest cap raised by {cap}⬤.",
    flavor: "Compound interest is the strongest ink.",
    rarity: "common",
    price: 5,
    config: { cap: 3 },
    interestCapBonus: 3,
    hooks: {},
  },
  overture: {
    id: "overture",
    name: "Overture",
    description: "+{chips} Letters if the answer starts with a vowel.",
    flavor: "Open on a high note.",
    rarity: "common",
    price: 4,
    config: { chips: 25 },
    hooks: {
      onRoundEnd: (ctx) =>
        isVowel(ctx.answer[0]) ? { addChips: MUSES.overture.config.chips } : null,
    },
  },
  minimalist: {
    id: "minimalist",
    name: "The Minimalist",
    description: "+{chips} Letters on 4-letter words.",
    flavor: "Less is more. More or less.",
    rarity: "common",
    price: 4,
    config: { chips: 30 },
    hooks: {
      onRoundEnd: (ctx) =>
        ctx.wordLength === 4 ? { addChips: MUSES.minimalist.config.chips } : null,
    },
  },
  apprentice: {
    id: "apprentice",
    name: "The Apprentice",
    description: "+{chips} Letters if your first guess finds a green.",
    flavor: "Eager. Occasionally correct.",
    rarity: "common",
    price: 4,
    config: { chips: 10 },
    hooks: {
      onRoundEnd: (ctx) =>
        ctx.results[0]?.some((r) => r === "correct")
          ? { addChips: MUSES.apprentice.config.chips }
          : null,
    },
  },

  // ---- Uncommons -------------------------------------------------------------
  prodigy: {
    id: "prodigy",
    name: "The Prodigy",
    description: "×{times} Flourish if you solve in {guesses} guesses or fewer.",
    flavor: "Annoying, isn't it?",
    rarity: "uncommon",
    price: 7,
    config: { times: 1.5, guesses: 3 },
    hooks: {
      onRoundEnd: (ctx) =>
        ctx.solved && ctx.attemptsUsed <= MUSES.prodigy.config.guesses
          ? { timesMult: MUSES.prodigy.config.times }
          : null,
    },
  },
  deadline: {
    id: "deadline",
    name: "Deadline",
    description: "×{times} Flourish on your last life.",
    flavor: "Nothing sharpens prose like midnight.",
    rarity: "uncommon",
    price: 6,
    config: { times: 2 },
    hooks: {
      onRoundEnd: (ctx) => (ctx.lives <= 1 ? { timesMult: MUSES.deadline.config.times } : null),
    },
  },
  serialist: {
    id: "serialist",
    name: "The Serialist",
    description: "+{mult} Flourish per chapter finished.",
    flavor: "To be continued. And continued.",
    rarity: "uncommon",
    price: 6,
    config: { mult: 1 },
    hooks: {
      onRoundEnd: (ctx) =>
        ctx.chaptersCleared > 0
          ? { addMult: MUSES.serialist.config.mult * ctx.chaptersCleared }
          : null,
    },
  },
  "first-take": {
    id: "first-take",
    name: "First Take",
    description: "+{mult} Flourish, but {guesses} fewer guess each round.",
    flavor: "No edits. No regrets. Some regrets.",
    rarity: "uncommon",
    price: 6,
    config: { mult: 4, guesses: 1 },
    hooks: {
      onRoundStart: () => ({ extraGuesses: -MUSES["first-take"].config.guesses }),
      onRoundEnd: () => ({ addMult: MUSES["first-take"].config.mult }),
    },
  },
  novelist: {
    id: "novelist",
    name: "The Novelist",
    description: "×{times} Flourish on words of 6+ letters.",
    flavor: "Why use one word when eleven will do?",
    rarity: "uncommon",
    price: 7,
    config: { times: 1.5 },
    hooks: {
      onRoundEnd: (ctx) =>
        ctx.wordLength >= 6 ? { timesMult: MUSES.novelist.config.times } : null,
    },
  },
  lyricist: {
    id: "lyricist",
    name: "The Lyricist",
    description: "+{mult} Flourish per vowel in the answer.",
    flavor: "Everything rhymes if you're brave enough.",
    rarity: "uncommon",
    price: 6,
    config: { mult: 2 },
    hooks: {
      onRoundEnd: (ctx) => ({ addMult: MUSES.lyricist.config.mult * countVowels(ctx.answer) }),
    },
  },
  "gold-leaf": {
    id: "gold-leaf",
    name: "Gold Leaf",
    description: "+{ink}⬤ per guess containing a green tile.",
    flavor: "Thin, brilliant, and worth more than the page.",
    rarity: "uncommon",
    price: 6,
    config: { ink: 1 },
    hooks: {
      onGuessScored: (ctx) => {
        const row = ctx.results[ctx.guessIndex!];
        return row?.some((r) => r === "correct") ? { ink: MUSES["gold-leaf"].config.ink } : null;
      },
    },
  },
  "fair-hand": {
    id: "fair-hand",
    name: "Fair Hand",
    description: "+{chips} Letters per guess with no gray tiles.",
    flavor: "Not a stroke out of place.",
    rarity: "uncommon",
    price: 7,
    config: { chips: 40 },
    hooks: {
      onGuessScored: (ctx) => {
        const row = ctx.results[ctx.guessIndex!];
        return row && row.every((r) => r !== "absent")
          ? { addChips: MUSES["fair-hand"].config.chips }
          : null;
      },
    },
  },
  unbowed: {
    id: "unbowed",
    name: "The Unbowed",
    description: "+{mult} Flourish per censor defeated this manuscript.",
    flavor: "Print it anyway.",
    rarity: "uncommon",
    price: 7,
    config: { mult: 2 },
    hooks: {
      onRoundEnd: (ctx) =>
        ctx.censorsBeaten > 0 ? { addMult: MUSES.unbowed.config.mult * ctx.censorsBeaten } : null,
    },
  },

  // ---- Rares -----------------------------------------------------------------
  oracle: {
    id: "oracle",
    name: "The Oracle",
    description: "×{times} Flourish if you solve in {guesses} guesses or fewer.",
    flavor: "Knew you'd buy this.",
    rarity: "rare",
    price: 8,
    config: { times: 3, guesses: 2 },
    hooks: {
      onRoundEnd: (ctx) =>
        ctx.solved && ctx.attemptsUsed <= MUSES.oracle.config.guesses
          ? { timesMult: MUSES.oracle.config.times }
          : null,
    },
  },
  "magnum-opus": {
    id: "magnum-opus",
    name: "Magnum Opus",
    description: "×{times} Flourish. Always.",
    flavor: "The work of a lifetime, sold for 8⬤.",
    rarity: "rare",
    price: 8,
    config: { times: 1.5 },
    hooks: { onRoundEnd: () => ({ timesMult: MUSES["magnum-opus"].config.times }) },
  },
  "gilded-nib": {
    id: "gilded-nib",
    name: "Gilded Nib",
    description: "Green tiles score +{chips} extra Letters.",
    flavor: "Writes in light.",
    rarity: "rare",
    price: 8,
    config: { chips: 8 },
    hooks: {
      onLetterScored: perTile((ctx) =>
        ctx.letter!.result === "correct" ? { addChips: MUSES["gilded-nib"].config.chips } : null,
      ),
    },
  },
};

export const ALL_MUSE_IDS = Object.keys(MUSES) as MuseId[];

export function getMuse(id: MuseId): MuseDef {
  return MUSES[id];
}

// Description with {key} placeholders filled from config (scaled for the muse's level).
export function museDescription(id: MuseId, level = 1): string {
  const def = MUSES[id];
  const f = level <= 1 ? 1 : 1 + 0.25 * (level - 1);
  return def.description.replace(/\{(\w+)\}/g, (_, key: string) => {
    const v = def.config[key] ?? 0;
    if (key === "times") return String(Math.round((1 + (v - 1) * f) * 100) / 100);
    if (key === "chips" || key === "mult" || key === "ink")
      return String(Math.round(v * f * 10) / 10);
    return String(v);
  });
}
