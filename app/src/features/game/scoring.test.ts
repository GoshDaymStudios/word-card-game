import { describe, expect, it } from "vitest";
import { createRun, startBlind, submitGuess } from "./gameEngine";
import { scoreRound, CHIPS_PER_GREEN, CHIPS_PER_YELLOW } from "./scoring";
import type { RunState } from "./types";

const ANSWERS4 = ["cold", "warm", "tide", "lamp"];

// A run that is mid-draft with a known 4-letter answer, optionally holding muses.
function runWith(muses: RunState["muses"] = []): RunState {
  let run = createRun("TESTSEED", 1);
  run = { ...run, muses };
  run = startBlind(run, 4, ANSWERS4);
  return run;
}

function solveInOne(run: RunState): RunState {
  return submitGuess(run, run.round.answer, null);
}

describe("scoreRound", () => {
  it("unsolved rounds score 0", () => {
    const run = runWith();
    const { total, trace } = scoreRound(run, null, false);
    expect(total).toBe(0);
    expect(trace.at(-1)).toMatchObject({ kind: "final", total: 0 });
  });

  it("golden: naked solve-in-1 on a 4-letter word = (32 + 40) × 11 = 792", () => {
    const run = solveInOne(runWith());
    // 4 greens ×8 = 32 chips, solve bonus 40, mult = 1 + 2×5 unused guesses = 11.
    expect(run.round.roundScore).toBe((4 * CHIPS_PER_GREEN + 40) * 11);
    expect(run.round.status).toBe("cleared");
  });

  it("the trace's final event equals the returned total", () => {
    let run = runWith([{ id: "gilded-nib", level: 1 }, { id: "prolific", level: 1 }]);
    run = submitGuess(run, "tidy", null); // a non-answer guess first
    const solved = submitGuess(run, run.round.answer, null);
    const finalEvent = solved.lastTrace?.at(-1);
    expect(finalEvent).toMatchObject({ kind: "final", total: solved.round.roundScore });
  });

  it("muse hooks contribute: gilded-nib adds chips per green", () => {
    const plain = solveInOne(runWith());
    const nib = solveInOne(runWith([{ id: "gilded-nib", level: 1 }]));
    // +8 per green tile ×4 greens = +32 chips before mult.
    expect(nib.round.roundScore).toBe(plain.round.roundScore + 32 * 11);
  });

  it("muse level scaling increases the effect", () => {
    const lv1 = solveInOne(runWith([{ id: "quill", level: 1 }]));
    const lv2 = solveInOne(runWith([{ id: "quill", level: 2 }]));
    expect(lv2.round.roundScore).toBeGreaterThan(lv1.round.roundScore);
  });

  it("banned letter scores 0 chips for its tiles", () => {
    let run = runWith();
    run = { ...run, round: { ...run.round, bannedLetter: run.round.answer[0] } };
    const solved = solveInOne(run);
    const banned = run.round.answer[0];
    const bannedCount = [...run.round.answer].filter((c) => c === banned).length;
    expect(solved.round.roundScore).toBe((4 * CHIPS_PER_GREEN - bannedCount * CHIPS_PER_GREEN + 40) * 11);
  });

  it("gilded ink doubles green chips", () => {
    let run = runWith();
    run = { ...run, round: { ...run.round, gilded: true } };
    const solved = solveInOne(run);
    expect(solved.round.roundScore).toBe((4 * CHIPS_PER_GREEN * 2 + 40) * 11);
  });

  it("greens-demoted rule scores greens as yellows", () => {
    const run = runWith();
    const { total } = scoreRound(
      {
        ...run,
        round: {
          ...run.round,
          guesses: [run.round.answer],
          results: [Array(4).fill("correct")],
        },
      },
      { kind: "greens-demoted" },
      true,
    );
    expect(total).toBe((4 * CHIPS_PER_YELLOW + 40) * 11);
  });

  it("muted muse does not fire", () => {
    let run = runWith([{ id: "quill", level: 1 }]);
    run = { ...run, round: { ...run.round, mutedMuse: "quill" } };
    const solved = solveInOne(run);
    expect(solved.round.roundScore).toBe((4 * CHIPS_PER_GREEN + 40) * 11);
  });
});
