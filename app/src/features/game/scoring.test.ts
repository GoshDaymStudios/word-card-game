import { describe, it, expect } from "vitest";
import { scoreRound, attemptsForRound } from "./scoring";
import type { ModifierContext } from "./modifiers";

// Base context: solved "crane" (2 vowels, 3 consonants) in 1 of 6 guesses.
const ctx = (over: Partial<ModifierContext> = {}): ModifierContext => ({
  answer: "crane",
  attemptsUsed: 1,
  attemptsAllowed: 6,
  lives: 3,
  ante: 1,
  antesCleared: 0,
  solved: true,
  ...over,
});

describe("scoreRound", () => {
  it("scores 0 for an unsolved round", () => {
    expect(scoreRound(ctx({ solved: false }), [])).toBe(0);
  });

  it("scores letters plus a fast-solve bonus with no modifiers", () => {
    // 5*10 + (6-1)*5 = 75
    expect(scoreRound(ctx(), [])).toBe(75);
    // slower solve -> smaller bonus: 50 + (6-4)*5 = 60
    expect(scoreRound(ctx({ attemptsUsed: 4 }), [])).toBe(60);
  });

  it("adds flat base from Scholar", () => {
    expect(scoreRound(ctx(), ["scholar"])).toBe(90); // (50+25+15)*1
  });

  it("multiplies by Vowel Lover (+2 mult per vowel)", () => {
    // crane has 2 vowels -> mult 1 + 4 = 5 -> 75*5
    expect(scoreRound(ctx(), ["vowel-lover"])).toBe(375);
  });

  it("applies Sniper x2 only when solved in <= 2", () => {
    expect(scoreRound(ctx({ attemptsUsed: 2 }), ["sniper"])).toBe(140);
    expect(scoreRound(ctx({ attemptsUsed: 3 }), ["sniper"])).toBe(65); // 50 + (6-3)*5
  });

  it("applies Comeback x2 only on the last life", () => {
    expect(scoreRound(ctx({ lives: 1 }), ["comeback"])).toBe(150);
    expect(scoreRound(ctx({ lives: 2 }), ["comeback"])).toBe(75);
  });

  it("stacks additive mult then multiplicative factors", () => {
    // vowel-lover (mult 5) then sniper x2 at attemptsUsed 1: 75 * 5 * 2 = 750
    expect(scoreRound(ctx(), ["vowel-lover", "sniper"])).toBe(750);
  });
});

describe("attemptsForRound", () => {
  it("returns the base with no modifiers", () => {
    expect(attemptsForRound(6, [])).toBe(6);
  });
  it("applies extra-guess modifiers", () => {
    expect(attemptsForRound(6, ["patient"])).toBe(7);
    expect(attemptsForRound(6, ["gambler"])).toBe(5);
    expect(attemptsForRound(6, ["patient", "gambler"])).toBe(6);
  });
  it("never drops below 1", () => {
    expect(attemptsForRound(1, ["gambler", "gambler"])).toBe(1);
  });
});
