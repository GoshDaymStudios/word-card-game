import { describe, it, expect } from "vitest";
import { evaluateGuess, isSolved } from "./evaluateGuess";
import { WORDS, wordAt } from "./wordList";

describe("evaluateGuess", () => {
  it("marks an exact match all correct", () => {
    expect(evaluateGuess("crane", "crane")).toEqual([
      "correct", "correct", "correct", "correct", "correct",
    ]);
  });

  it("handles a duplicate guess letter when the answer has only one", () => {
    // answer has a single L (position 1). Guess's first L has no copy left.
    expect(evaluateGuess("llama", "aloft")).toEqual([
      "absent", "correct", "present", "absent", "absent",
    ]);
  });

  it("spends present letters left-to-right against remaining copies", () => {
    expect(evaluateGuess("level", "eagle")).toEqual([
      "present", "present", "absent", "present", "absent",
    ]);
  });

  it("does not over-award present for repeated letters", () => {
    // answer abide has a single e; guess speed's two e's -> only one present.
    expect(evaluateGuess("speed", "abide")).toEqual([
      "absent", "absent", "present", "absent", "present",
    ]);
  });

  it("is case-insensitive", () => {
    expect(evaluateGuess("CRANE", "crane")).toEqual(
      evaluateGuess("crane", "crane"),
    );
  });

  it("throws on length mismatch", () => {
    expect(() => evaluateGuess("toolong", "cat")).toThrow();
  });
});

describe("isSolved", () => {
  it("is true only when every letter is correct", () => {
    expect(isSolved(["correct", "correct", "correct"])).toBe(true);
    expect(isSolved(["correct", "present", "correct"])).toBe(false);
    expect(isSolved([])).toBe(false);
  });
});

describe("word list", () => {
  it("contains only 5-letter lowercase words", () => {
    for (const w of WORDS) expect(w).toMatch(/^[a-z]{5}$/);
  });

  it("has no duplicates", () => {
    expect(new Set(WORDS).size).toBe(WORDS.length);
  });

  it("wordAt wraps and stays in range for any index", () => {
    expect(wordAt(0)).toBe(WORDS[0]);
    expect(wordAt(-1)).toBe(WORDS[WORDS.length - 1]);
    expect(WORDS).toContain(wordAt(999999));
  });
});
