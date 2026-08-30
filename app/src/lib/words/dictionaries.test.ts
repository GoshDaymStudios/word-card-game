import { describe, expect, it } from "vitest";
import { isValidWord, loadAnswers, loadDictionary, type WordLength } from "./dictionaries";

const LENGTHS: WordLength[] = [4, 5, 6, 7];

describe("word lists", () => {
  it("every answer exists in its guess dictionary, correct length, no duplicates", async () => {
    for (const len of LENGTHS) {
      const [answers, dict] = await Promise.all([loadAnswers(len), loadDictionary(len)]);
      expect(answers.length).toBeGreaterThan(300);
      expect(new Set(answers).size).toBe(answers.length);
      for (const w of answers) {
        expect(w).toHaveLength(len);
        expect(dict.has(w)).toBe(true);
      }
    }
  });

  it("dictionaries only contain lowercase words of the right length", async () => {
    for (const len of LENGTHS) {
      const dict = await loadDictionary(len);
      expect(dict.size).toBeGreaterThan(1000);
      for (const w of dict) {
        expect(w).toHaveLength(len);
        expect(w).toMatch(/^[a-z]+$/);
      }
    }
  });

  it("isValidWord accepts dictionary words and rejects junk", async () => {
    const dict = await loadDictionary(5);
    expect(isValidWord("about", dict)).toBe(true);
    expect(isValidWord("zzzzz", dict)).toBe(false);
    expect(isValidWord("ab0ut", dict)).toBe(false);
    expect(isValidWord("zzzzz", null)).toBe(true); // no dict loaded → format check only
  });
});
