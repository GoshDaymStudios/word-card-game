import { describe, it, expect } from "vitest";
import {
  createRun,
  submitGuess,
  chooseModifier,
  targetForAnte,
  FINAL_ANTE,
  STARTING_LIVES,
} from "./gameEngine";

describe("targetForAnte", () => {
  it("follows the 40 * 1.5^(ante-1) curve", () => {
    expect(targetForAnte(1)).toBe(40);
    expect(targetForAnte(2)).toBe(60);
    expect(targetForAnte(3)).toBe(90);
    expect(targetForAnte(FINAL_ANTE)).toBe(683);
  });
});

describe("createRun", () => {
  it("starts at ante 1 with a fresh 5-letter round", () => {
    const run = createRun(123);
    expect(run.status).toBe("playing");
    expect(run.ante).toBe(1);
    expect(run.lives).toBe(STARTING_LIVES);
    expect(run.targetScore).toBe(40);
    expect(run.round.answer).toMatch(/^[a-z]{5}$/);
    expect(run.round.attemptsAllowed).toBe(6);
    expect(run.round.guesses).toEqual([]);
  });

  it("is deterministic for a given seed", () => {
    expect(createRun(42).round.answer).toBe(createRun(42).round.answer);
  });
});

describe("submitGuess", () => {
  it("ignores invalid guesses", () => {
    const run = createRun(1);
    expect(submitGuess(run, "abcd")).toBe(run); // too short
    expect(submitGuess(run, "12345")).toBe(run); // not letters
  });

  it("records an in-progress guess without ending the round", () => {
    const run = createRun(1);
    const wrong = run.round.answer === "stone" ? "crane" : "stone";
    const next = submitGuess(run, wrong);
    expect(next.round.guesses).toHaveLength(1);
    expect(next.status).toBe("playing");
  });

  it("clears the ante and offers modifiers when the target is met", () => {
    const run = createRun(7);
    const next = submitGuess(run, run.round.answer); // solve in 1 -> 75 >= 40
    expect(next.status).toBe("choosing");
    expect(next.score).toBe(75);
    expect(next.antesCleared).toBe(1);
    expect(next.offered.length).toBeGreaterThan(0);
    expect(next.offered.length).toBeLessThanOrEqual(3);
  });

  it("wins when the final ante is cleared", () => {
    const base = createRun(7);
    const atFinal = { ...base, ante: FINAL_ANTE, targetScore: 10 };
    const won = submitGuess(atFinal, atFinal.round.answer);
    expect(won.status).toBe("won");
  });

  it("loses a life on a failed round and ends the run at zero lives", () => {
    let run = createRun(3);
    for (let life = STARTING_LIVES; life > 0; life--) {
      // Exhaust the round with wrong-but-valid guesses (never the answer).
      const filler = run.round.answer === "xxxxx" ? "yyyyy" : "xxxxx";
      for (let i = 0; i < run.round.attemptsAllowed; i++) {
        run = submitGuess(run, filler);
      }
    }
    expect(run.lives).toBe(0);
    expect(run.status).toBe("lost");
  });
});

describe("chooseModifier", () => {
  it("adds the chosen modifier and advances to the next ante", () => {
    const cleared = submitGuess(createRun(7), createRun(7).round.answer);
    const pick = cleared.offered[0];
    const next = chooseModifier(cleared, pick);
    expect(next.status).toBe("playing");
    expect(next.ante).toBe(2);
    expect(next.targetScore).toBe(60);
    expect(next.modifiers).toContain(pick);
    expect(next.round.guesses).toEqual([]);
  });

  it("can skip without taking a modifier", () => {
    const cleared = submitGuess(createRun(7), createRun(7).round.answer);
    const next = chooseModifier(cleared, null);
    expect(next.ante).toBe(2);
    expect(next.modifiers).toEqual([]);
  });
});
