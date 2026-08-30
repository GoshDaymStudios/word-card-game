import { describe, expect, it } from "vitest";
import {
  activeRule,
  allowedLengths,
  buyItem,
  continueAfterFailure,
  createRun,
  generateShop,
  leaveShop,
  rerollShop,
  sellMuse,
  skipBlind,
  startBlind,
  stakeMods,
  submitGuess,
  applyConsumable,
  FINAL_CHAPTER,
  STARTING_INK,
} from "./gameEngine";
import { getMuse } from "./muses";
import type { RunState } from "./types";

const ANSWERS4 = ["cold", "warm", "tide", "lamp", "hush", "raft"];
const ANSWERS5 = ["about", "crane", "slate", "pride", "mount"];

function freshDraft(seed = "TESTSEED"): RunState {
  return startBlind(createRun(seed, 1), 4, ANSWERS4);
}

function failRound(run: RunState): RunState {
  // Six wrong (but well-formed) guesses; dict=null accepts any letters.
  let state = run;
  const wrong = ["zzzz", "yyyy", "xxxx", "wwww", "vvvv", "uuuu"];
  for (const g of wrong) {
    if (state.status !== "playing") break;
    state = submitGuess(state, g, null);
  }
  return state;
}

describe("run lifecycle", () => {
  it("createRun starts at chapter 1 blind-select with stake lives and ink", () => {
    const run = createRun("SEED", 1);
    expect(run.status).toBe("blind-select");
    expect(run.ante).toBe(1);
    expect(run.blind).toBe("draft");
    expect(run.lives).toBe(2);
    expect(run.ink).toBe(STARTING_INK);
  });

  it("same seed and choices give the same words, bosses and shops", () => {
    const a = freshDraft("REPRO");
    const b = freshDraft("REPRO");
    expect(a.round.answer).toBe(b.round.answer);
    expect(a.bossId).toBe(b.bossId);
    expect(generateShop(a, 0)).toEqual(generateShop(b, 0));
  });

  it("allowed word lengths follow the blind", () => {
    let run = createRun("SEED", 1);
    expect(allowedLengths(run)).toEqual([4, 5]);
    run = { ...run, blind: "faircopy" };
    expect(allowedLengths(run)).toEqual([5, 6]);
    run = { ...run, blind: "censor" };
    // Archaist forces 7; other censors allow 6 or 7.
    expect([[6, 7], [7]]).toContainEqual(allowedLengths(run));
  });

  it("clearing a blind pays out and opens the shop", () => {
    const run = freshDraft();
    const cleared = submitGuess(run, run.round.answer, null);
    expect(cleared.status).toBe("shop");
    expect(cleared.shop).not.toBeNull();
    // Payout: draft 3 + capped unused-guess bonus 3 + interest 0 (4⬤ held < 5).
    expect(cleared.ink).toBe(STARTING_INK + 6);
    expect(cleared.score).toBe(cleared.round.roundScore);
    expect(cleared.history).toHaveLength(1);
  });

  it("failing a blind costs a life and pauses; continue returns to blind-select", () => {
    const failed = failRound(freshDraft());
    expect(failed.status).toBe("round-failed");
    expect(failed.lives).toBe(1);
    const back = continueAfterFailure(failed);
    expect(back.status).toBe("blind-select");
    expect(back.blind).toBe("draft");
  });

  it("failing on the last life loses the run", () => {
    let run = freshDraft();
    run = { ...run, lives: 1 };
    expect(failRound(run).status).toBe("lost");
  });

  it("skip is only allowed on the draft and pays 1⬤", () => {
    const run = createRun("SEED", 1);
    const skipped = skipBlind(run);
    expect(skipped.blind).toBe("faircopy");
    expect(skipped.ink).toBe(run.ink + 1);
    expect(skipped.history[0]).toMatchObject({ blind: "draft", skipped: true });
    expect(skipBlind(skipped)).toBe(skipped); // no-op on faircopy
  });

  it("dictionary rejection sets rejectedGuess and changes nothing else", () => {
    const run = freshDraft();
    const rejected = submitGuess(run, "zzzz", new Set(["cold", "warm"]));
    expect(rejected.rejectedGuess).toBe("zzzz");
    expect(rejected.round.guesses).toHaveLength(0);
  });

  it("winning: clearing the chapter-8 censor ends the run", () => {
    let run = createRun("SEED", 1);
    run = { ...run, ante: FINAL_CHAPTER, blind: "censor", bossId: "editor" };
    run = startBlind(run, 7, ["silence"]);
    // Give the run enough muses to beat the huge target — or just lower it for the test.
    run = { ...run, targetScore: 1 };
    const done = submitGuess(run, "silence", null);
    expect(done.status).toBe("won");
  });
});

describe("censor rules", () => {
  it("the chapter-8 boss is always the Editor-in-Chief", () => {
    // bossId is drawn per chapter on entry; simulate via the leaveShop path:
    let s = createRun("ANY", 1);
    s = { ...s, ante: FINAL_CHAPTER - 1, blind: "censor", status: "shop", shop: generateShop(s, 0) };
    const next = leaveShop(s);
    expect(next.ante).toBe(FINAL_CHAPTER);
    expect(next.bossId).toBe("editor");
  });

  it("rules only apply on censor blinds (at low stakes)", () => {
    const run = createRun("SEED", 1);
    expect(activeRule(run)).toBeNull();
    expect(activeRule({ ...run, blind: "censor" })).not.toBeNull();
  });

  it("gold grade extends censor rules to fair copies", () => {
    const run = createRun("SEED", 5);
    expect(activeRule({ ...run, blind: "faircopy" })).not.toBeNull();
  });

  it("stake mods stack downward", () => {
    expect(stakeMods(1)).toMatchObject({ startLives: 2, targetFactor: 1 });
    expect(stakeMods(3)).toMatchObject({ startLives: 1, targetFactor: 1.2 });
    expect(stakeMods(5).censorOnFairCopy).toBe(true);
  });
});

describe("the Scriptorium", () => {
  function inShop(): RunState {
    const run = freshDraft();
    return submitGuess(run, run.round.answer, null);
  }

  it("buying a muse deducts ink and adds it to the run", () => {
    let run = inShop();
    run = { ...run, ink: 50 };
    const idx = run.shop!.items.findIndex((i) => i.kind === "muse");
    if (idx === -1) return; // stock had no muse for this seed (possible but rare)
    const item = run.shop!.items[idx];
    const bought = buyItem(run, idx);
    expect(bought.ink).toBe(50 - item.price);
    expect(bought.muses).toHaveLength(1);
    expect(bought.shop!.items[idx].sold).toBe(true);
    // Can't buy the same slot twice.
    expect(buyItem(bought, idx)).toBe(bought);
  });

  it("cannot afford → no-op", () => {
    let run = inShop();
    run = { ...run, ink: 0 };
    expect(buyItem(run, 0)).toBe(run);
  });

  it("selling refunds half price", () => {
    let run = inShop();
    run = { ...run, muses: [{ id: "quill", level: 1 }] };
    const sold = sellMuse(run, 0);
    expect(sold.muses).toHaveLength(0);
    expect(sold.ink).toBe(run.ink + Math.floor(getMuse("quill").price / 2));
  });

  it("reroll costs escalate and regenerate stock deterministically", () => {
    let run = inShop();
    run = { ...run, ink: 50 };
    const once = rerollShop(run);
    expect(once.ink).toBe(45);
    const twice = rerollShop(once);
    expect(twice.ink).toBe(45 - 6);
    // Deterministic per (seed, ante, blind, rerolls).
    const again = rerollShop({ ...run, ink: 50 });
    expect(again.shop).toEqual(once.shop);
  });

  it("leaveShop advances draft → faircopy → censor → next chapter", () => {
    let run = inShop();
    run = leaveShop(run);
    expect(run.blind).toBe("faircopy");
    run = { ...run, status: "shop", shop: generateShop(run, 0) };
    run = leaveShop(run);
    expect(run.blind).toBe("censor");
    run = { ...run, status: "shop", shop: generateShop(run, 0) };
    run = leaveShop(run);
    expect(run.blind).toBe("draft");
    expect(run.ante).toBe(2);
  });
});

describe("consumables", () => {
  it("india ink grants 5⬤ anywhere", () => {
    let run = freshDraft();
    run = { ...run, consumables: ["india-ink"] };
    const used = applyConsumable(run, 0);
    expect(used.ink).toBe(run.ink + 5);
    expect(used.consumables).toHaveLength(0);
  });

  it("sympathetic ink adds a guess mid-round", () => {
    let run = freshDraft();
    run = { ...run, consumables: ["sympathetic-ink"] };
    const used = applyConsumable(run, 0);
    expect(used.round.attemptsAllowed).toBe(run.round.attemptsAllowed + 1);
  });

  it("blotting paper absorbs one failure without losing a life", () => {
    let run = freshDraft();
    run = { ...run, consumables: ["blotting-paper"] };
    run = applyConsumable(run, 0);
    expect(run.shielded).toBe(true);
    const failed = failRound(run);
    expect(failed.status).toBe("round-failed");
    expect(failed.lives).toBe(2);
    expect(failed.shielded).toBe(false);
  });

  it("diviner's ink reveals a correct letter", () => {
    let run = freshDraft();
    run = { ...run, consumables: ["diviners-ink"] };
    const used = applyConsumable(run, 0);
    expect(used.round.revealedLetters).toHaveLength(1);
    const { position, letter } = used.round.revealedLetters[0];
    expect(used.round.answer[position]).toBe(letter);
  });

  it("bleach rules out letters that are not in the answer", () => {
    let run = freshDraft();
    run = { ...run, consumables: ["bleach"] };
    const used = applyConsumable(run, 0);
    expect(used.round.ruledOut).toHaveLength(5);
    for (const c of used.round.ruledOut) expect(used.round.answer).not.toContain(c);
  });

  it("sepia swaps the answer and re-marks previous guesses", () => {
    let run = startBlind(createRun("SEPIA", 1), 5, ANSWERS5);
    run = submitGuess(run, "pouty", null); // not in ANSWERS5, so never the answer
    run = { ...run, consumables: ["sepia"] };
    const used = applyConsumable(run, 0, ANSWERS5);
    expect(used.round.answer).not.toBe(run.round.answer);
    expect(used.round.results).toHaveLength(used.round.guesses.length);
  });

  it("copyist's ink levels up a muse permanently", () => {
    let run = freshDraft();
    run = { ...run, muses: [{ id: "quill", level: 1 }], consumables: ["copyists-ink"] };
    const used = applyConsumable(run, 0);
    expect(used.muses[0].level).toBe(2);
  });
});
