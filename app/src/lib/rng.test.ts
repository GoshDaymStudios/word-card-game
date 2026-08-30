import { describe, expect, it } from "vitest";
import { pickFrom, rngStream, shuffled } from "./rng";

describe("rngStream", () => {
  it("is deterministic for the same seed and stream", () => {
    const a = rngStream("SEED1234", "word:1");
    const b = rngStream("SEED1234", "word:1");
    expect([a(), a(), a()]).toEqual([b(), b(), b()]);
  });

  it("streams are independent — drawing from one never shifts another", () => {
    const wordFirst = rngStream("SEED1234", "word:1")();
    const shop = rngStream("SEED1234", "shop:1:0");
    shop();
    shop();
    shop();
    expect(rngStream("SEED1234", "word:1")()).toBe(wordFirst);
  });

  it("different seeds or streams give different sequences", () => {
    expect(rngStream("SEED1234", "word:1")()).not.toBe(rngStream("SEED1234", "word:2")());
    expect(rngStream("AAAA", "word:1")()).not.toBe(rngStream("BBBB", "word:1")());
  });

  it("produces values in [0, 1)", () => {
    const rng = rngStream("X", "y");
    for (let i = 0; i < 1000; i++) {
      const v = rng();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });
});

describe("helpers", () => {
  it("pickFrom picks a member", () => {
    const rng = rngStream("S", "pick");
    const list = ["a", "b", "c"];
    for (let i = 0; i < 20; i++) expect(list).toContain(pickFrom(rng, list));
  });

  it("shuffled returns a permutation without mutating the input", () => {
    const input = [1, 2, 3, 4, 5];
    const out = shuffled(rngStream("S", "shuf"), input);
    expect(input).toEqual([1, 2, 3, 4, 5]);
    expect([...out].sort()).toEqual([1, 2, 3, 4, 5]);
  });
});
