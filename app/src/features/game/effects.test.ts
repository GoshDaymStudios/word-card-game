import { describe, expect, it } from "vitest";
import { rngStream } from "../../lib/rng";
import { scaleDescriptor, type ScoreCtx } from "./effects";
import { ALL_MUSE_IDS, MUSES, museDescription } from "./muses";
import { ALL_INK_IDS, INKS } from "./inks";
import { ALL_CENSOR_IDS, CENSORS, hasRule, ruleList } from "./censors";

// A representative context: a solved 5-letter round with a bit of everything.
function ctx(overrides: Partial<ScoreCtx> = {}): ScoreCtx {
  return {
    answer: "queen",
    wordLength: 5,
    guesses: ["query", "queen"],
    results: [
      ["correct", "correct", "correct", "absent", "present"],
      ["correct", "correct", "correct", "correct", "correct"],
    ],
    solved: true,
    attemptsUsed: 2,
    attemptsAllowed: 6,
    lives: 1,
    ante: 3,
    blind: "censor",
    chaptersCleared: 2,
    censorsBeaten: 2,
    ink: 12,
    rng: (stream: string) => rngStream("EFFECTS", stream),
    ...overrides,
  };
}

describe("muse registry", () => {
  it("every muse's hooks return sane descriptors on representative contexts", () => {
    for (const id of ALL_MUSE_IDS) {
      const def = MUSES[id];
      for (const [hook, fn] of Object.entries(def.hooks)) {
        const c =
          hook === "onLetterScored"
            ? ctx({ letter: { letter: "q", result: "correct", position: 0, guessIndex: 0, wordLength: 5 } })
            : hook === "onGuessScored"
              ? ctx({ guessIndex: 0 })
              : ctx();
        const effect = fn(c);
        if (effect === null) continue;
        for (const v of [effect.addChips, effect.addMult, effect.timesMult, effect.ink, effect.extraGuesses]) {
          if (v !== undefined) expect(Number.isFinite(v)).toBe(true);
        }
      }
    }
  });

  it("ids match keys, prices fit rarity bands, descriptions resolve their placeholders", () => {
    for (const id of ALL_MUSE_IDS) {
      const def = MUSES[id];
      expect(def.id).toBe(id);
      expect(def.price).toBeGreaterThan(0);
      expect(museDescription(id)).not.toMatch(/\{\w+\}/);
      expect(museDescription(id, 3)).not.toMatch(/\{\w+\}/);
    }
    const counts = { common: 0, uncommon: 0, rare: 0 };
    for (const id of ALL_MUSE_IDS) counts[MUSES[id].rarity]++;
    expect(counts).toEqual({ common: 18, uncommon: 9, rare: 3 });
  });

  it("scaleDescriptor grows effects with level and leaves level 1 unchanged", () => {
    const d = { addChips: 10, addMult: 2, timesMult: 1.5 };
    expect(scaleDescriptor(d, 1)).toEqual(d);
    const up = scaleDescriptor(d, 2);
    expect(up.addChips).toBeGreaterThan(10);
    expect(up.addMult).toBeGreaterThan(2);
    expect(up.timesMult).toBeGreaterThan(1.5);
  });
});

describe("ink registry", () => {
  it("ids match keys and prices are positive", () => {
    for (const id of ALL_INK_IDS) {
      expect(INKS[id].id).toBe(id);
      expect(INKS[id].price).toBeGreaterThan(0);
    }
    expect(ALL_INK_IDS).toHaveLength(8);
  });
});

describe("censor registry", () => {
  it("ids match keys and every rule flattens to known kinds", () => {
    for (const id of ALL_CENSOR_IDS) {
      expect(CENSORS[id].id).toBe(id);
      for (const r of ruleList(CENSORS[id].rule)) {
        expect(r.kind).not.toBe("combined");
      }
    }
    expect(ALL_CENSOR_IDS).toHaveLength(11);
  });

  it("hasRule sees through combined rules", () => {
    expect(hasRule(CENSORS.editor.rule, "greens-demoted")).toBe(true);
    expect(hasRule(CENSORS.editor.rule, "fewer-guesses")).toBe(true);
    expect(hasRule(CENSORS.editor.rule, "banned-letter")).toBe(false);
    expect(hasRule(null, "banned-letter")).toBe(false);
  });
});
