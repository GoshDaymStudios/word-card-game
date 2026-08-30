import { describe, expect, it } from "vitest";
import { evaluateGuess, WORDS, type LetterResult, type WordLength } from "../../../lib/words";
import { ANSWERS4 } from "../../../lib/words/answers4";
import { ANSWERS6 } from "../../../lib/words/answers6";
import { ANSWERS7 } from "../../../lib/words/answers7";
import {
  applyConsumable,
  buyItem,
  continueAfterFailure,
  createRun,
  leaveShop,
  skipBlind,
  startBlind,
  submitGuess,
} from "../gameEngine";
import type { RunState } from "../types";

// Balance harness: a greedy bot plays seeded runs end to end. Not a perfect player —
// it guesses consistently with all feedback (hard-mode style) and buys the cheapest
// affordable muse — so real players land somewhere above it with better word choices
// and below optimal shop play. The assertions are wide bounds meant to catch balance
// regressions (targets too brutal / trivial), not to pin exact win rates.

const ANSWERS: Record<WordLength, readonly string[]> = {
  4: ANSWERS4,
  5: WORDS,
  6: ANSWERS6,
  7: ANSWERS7,
};

// Pick the next guess: any answer-list word consistent with every result so far.
function nextGuess(len: WordLength, guesses: string[], results: LetterResult[][]): string {
  const pool = ANSWERS[len];
  outer: for (const candidate of pool) {
    if (guesses.includes(candidate)) continue;
    for (let g = 0; g < guesses.length; g++) {
      // The candidate must reproduce the observed feedback if it were the answer.
      const simulated = evaluateGuess(guesses[g], candidate);
      for (let i = 0; i < simulated.length; i++) {
        if (simulated[i] !== results[g][i]) continue outer;
      }
    }
    return candidate;
  }
  return pool.find((w) => !guesses.includes(w)) ?? pool[0];
}

function playRound(state: RunState): RunState {
  let run = state;
  let safety = 20;
  while (run.status === "playing" && safety-- > 0) {
    const guess = nextGuess(run.round.wordLength, run.round.guesses, run.round.results);
    run = submitGuess(run, guess, null);
  }
  return run;
}

function greedyShop(state: RunState): RunState {
  let run = state;
  // The bot's late-game scaling lever: buy Copyist's Ink whenever it appears and
  // drink it on the spot (+25% to a random held muse, permanently).
  for (;;) {
    if (!run.shop || run.muses.length === 0) break;
    const copyist = run.shop.items.findIndex(
      (item) => !item.sold && item.kind === "ink" && item.id === "copyists-ink" && item.price <= run.ink,
    );
    if (copyist === -1) break;
    const bought = buyItem(run, copyist);
    if (bought === run) break;
    run = applyConsumable(bought, bought.consumables.length - 1);
  }
  // Then the priciest affordable muses (price ≈ strength).
  for (;;) {
    if (!run.shop) break;
    const buyable = run.shop.items
      .map((item, index) => ({ item, index }))
      .filter(({ item }) => !item.sold && item.kind === "muse" && item.price <= run.ink)
      .sort((a, b) => b.item.price - a.item.price);
    if (buyable.length === 0) break;
    const next = buyItem(run, buyable[0].index);
    if (next === run) break;
    run = next;
  }
  return leaveShop(run);
}

type SimResult = { won: boolean; chapter: number; score: number };

function playRun(seed: string): SimResult {
  let run = createRun(seed, 1);
  let safety = 400;
  while (run.status !== "won" && run.status !== "lost" && safety-- > 0) {
    switch (run.status) {
      case "blind-select": {
        // Longest allowed length: more tiles = more chips against the target.
        const lens = ([4, 5, 6, 7] as WordLength[]).filter(
          (l) => startBlind(run, l, ANSWERS[l]) !== run,
        );
        const len = lens[lens.length - 1];
        run = startBlind(run, len, ANSWERS[len]);
        if (run.status === "blind-select") run = skipBlind(run);
        break;
      }
      case "playing":
        run = playRound(run);
        break;
      case "round-failed":
        run = continueAfterFailure(run);
        break;
      case "shop":
        run = greedyShop(run);
        break;
    }
  }
  return { won: run.status === "won", chapter: run.ante, score: run.score };
}

describe("balance simulation (greedy bot, 120 seeded runs)", () => {
  const results: SimResult[] = [];
  for (let i = 0; i < 120; i++) results.push(playRun(`SIM-${i}`));

  const reached = (ch: number) => results.filter((r) => r.chapter >= ch).length / results.length;

  it("chapter 1 is nearly always cleared", () => {
    expect(reached(2)).toBeGreaterThan(0.9);
  });

  it("the mid-game thins the field", () => {
    expect(reached(4)).toBeGreaterThan(0.2);
    expect(reached(7)).toBeLessThan(0.9);
  });

  it("winning is possible but far from guaranteed for a greedy bot", () => {
    const winRate = results.filter((r) => r.won).length / results.length;
    expect(winRate).toBeLessThan(0.6);
    // Document the observed rate so tuning changes show up in test output.
    const dist = Array.from({ length: 8 }, (_, i) =>
      results.filter((r) => r.chapter === i + 1).length,
    );
    console.log(
      `win rate ${(winRate * 100).toFixed(1)}% · reach ch4 ${(reached(4) * 100).toFixed(1)}% · ` +
        `reach ch8 ${(reached(8) * 100).toFixed(1)}% · best score ${Math.max(...results.map((r) => r.score))} · ` +
        `died at chapter [${dist.join(", ")}]`,
    );
  });
});
