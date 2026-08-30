// The run engine ("Manuscript"). Pure reducer-style state machine: every exported
// function takes a RunState and returns a new one; nothing here touches the DOM,
// storage or the network. All randomness draws from named streams off the run seed
// (lib/rng.ts) so a seed fully determines words, bosses and shop stock.
//
// Chapter structure (the Balatro-inspired loop, our twist):
//   First Draft (1× target, skippable) → Fair Copy (1.5×) → The Censor (2× + rule)
// Clearing a blind pays ink and opens the Scriptorium (shop). Failing costs a life
// and sends you back to blind-select for the same blind. Chapter 8's censor is
// always The Editor-in-Chief; beating them wins the manuscript.
import { evaluateGuess, isSolved, isValidWord, type WordLength } from "../../lib/words";
import { pickFrom, randomSeed, rngStream } from "../../lib/rng";
import { attemptsForBlind, provisionalChips, scoreRound } from "./scoring";
import { ALL_MUSE_IDS, getMuse, MUSES, type MuseId } from "./muses";
import { ALL_INK_IDS, getInk } from "./inks";
import { CENSORS, hasRule, REGULAR_CENSOR_IDS, ruleList, type CensorId, type CensorRule } from "./censors";
import type { BlindKind, RoundState, RunState, ShopItem, ShopState } from "./types";

export const FINAL_CHAPTER = 8;
export const MAX_MUSES = 5;
export const MAX_CONSUMABLES = 2;
export const MAX_LIVES = 4;
export const STARTING_INK = 4;

const BASE_TARGETS = [100, 240, 550, 1200, 2700, 6000, 13000, 28000];
const BLIND_FACTOR: Record<BlindKind, number> = { draft: 1, faircopy: 1.5, censor: 2 };
const BLIND_PAYOUT: Record<BlindKind, number> = { draft: 3, faircopy: 4, censor: 5 };
const UNUSED_GUESS_INK_CAP = 3;
const INTEREST_PER = 5;
const SKIP_PAYOUT = 1;
const LIFE_PRICE = 8;

// ---- Ink Grades (stakes). A flat modifier bag, checked where relevant; every grade
// includes all the modifiers of the grades below it. ------------------------------
export type StakeMods = {
  startLives: number;
  targetFactor: number;
  rerollBase: number;
  interestCap: number;
  censorOnFairCopy: boolean;
};

export function stakeMods(stake: number): StakeMods {
  return {
    startLives: stake >= 2 ? 1 : 2,
    targetFactor: stake >= 3 ? 1.2 : 1,
    rerollBase: stake >= 4 ? 6 : 5,
    interestCap: stake >= 4 ? 3 : 5,
    censorOnFairCopy: stake >= 5,
  };
}

// ---- Blind helpers ---------------------------------------------------------------

// The censor rule in force for the current blind (normally censor blinds only; the
// Gold ink grade extends it to fair copies).
export function activeRule(state: RunState): CensorRule | null {
  const onThisBlind =
    state.blind === "censor" ||
    (state.blind === "faircopy" && stakeMods(state.stake).censorOnFairCopy);
  return onThisBlind ? CENSORS[state.bossId].rule : null;
}

export function targetFor(state: RunState, blind: BlindKind): number {
  let target =
    BASE_TARGETS[state.ante - 1] * BLIND_FACTOR[blind] * stakeMods(state.stake).targetFactor;
  const rule = { ...state, blind } as RunState;
  for (const r of ruleList(activeRule(rule) ?? { kind: "combined", rules: [] })) {
    if (r.kind === "raised-target") target *= r.factor;
  }
  return Math.round(target);
}

// Word lengths the player may choose for the current blind.
export function allowedLengths(state: RunState): WordLength[] {
  if (hasRule(activeRule(state), "long-words")) return [7];
  if (state.blind === "draft") return [4, 5];
  if (state.blind === "faircopy") return [5, 6];
  return [6, 7];
}

function drawBoss(seed: string, ante: number): CensorId {
  if (ante >= FINAL_CHAPTER) return "editor";
  return pickFrom(rngStream(seed, `boss:${ante}`), REGULAR_CENSOR_IDS);
}

function emptyRound(): RoundState {
  return {
    answer: "",
    wordLength: 5,
    attemptsAllowed: 0,
    guesses: [],
    results: [],
    roundScore: 0,
    status: "cleared",
    revealedLetters: [],
    ruledOut: [],
    gilded: false,
    mutedMuse: null,
    bannedLetter: null,
  };
}

// ---- Run lifecycle ---------------------------------------------------------------

export function createRun(
  seed: string = randomSeed(),
  stake = 1,
  musePool: MuseId[] = ALL_MUSE_IDS,
): RunState {
  const state: RunState = {
    version: 2,
    seed,
    stake,
    ante: 1,
    blind: "draft",
    blindIndex: 0,
    targetScore: 0,
    score: 0,
    ink: STARTING_INK,
    lives: stakeMods(stake).startLives,
    muses: [],
    musePool,
    consumables: [],
    bossId: drawBoss(seed, 1),
    shielded: false,
    shop: null,
    status: "blind-select",
    round: emptyRound(),
    rejectedGuess: null,
    lastTrace: null,
    history: [],
  };
  state.targetScore = targetFor(state, "draft");
  return state;
}

// Start the current blind with the chosen word length. `answers` is the loaded answer
// list for that length (the engine stays synchronous; the UI awaits loadAnswers first).
export function startBlind(state: RunState, len: WordLength, answers: readonly string[]): RunState {
  if (state.status !== "blind-select") return state;
  if (!allowedLengths(state).includes(len)) return state;

  const blindIndex = state.blindIndex + 1;
  const rule = activeRule(state);
  const wordRng = rngStream(state.seed, `word:${blindIndex}`);
  const answer = pickFrom(wordRng, answers);

  const next: RunState = {
    ...state,
    blindIndex,
    targetScore: targetFor(state, state.blind),
    status: "playing",
    rejectedGuess: null,
    lastTrace: null,
    round: {
      ...emptyRound(),
      answer,
      wordLength: len,
      status: "playing",
    },
  };
  next.round.attemptsAllowed = attemptsForBlind(next, rule);

  if (rule) {
    const censorRng = rngStream(state.seed, `censor:${blindIndex}`);
    if (hasRule(rule, "banned-letter")) {
      next.round.bannedLetter = answer[Math.floor(censorRng() * answer.length)];
    }
    if (hasRule(rule, "mute-muse") && state.muses.length > 0) {
      next.round.mutedMuse = pickFrom(censorRng, state.muses).id;
    }
    if (hasRule(rule, "forced-opening")) {
      const forced = pickFrom(censorRng, answers.filter((w) => w !== answer));
      next.round.guesses = [forced];
      next.round.results = [evaluateGuess(forced, answer)];
    }
  }
  return next;
}

// Skip the First Draft: a small ink nudge, straight to the Fair Copy.
export function skipBlind(state: RunState): RunState {
  if (state.status !== "blind-select" || state.blind !== "draft") return state;
  const next: RunState = {
    ...state,
    ink: state.ink + SKIP_PAYOUT,
    blind: "faircopy",
    history: [...state.history, { ante: state.ante, blind: "draft", score: 0, skipped: true }],
  };
  next.targetScore = targetFor(next, "faircopy");
  return next;
}

// ---- Guessing --------------------------------------------------------------------

export function submitGuess(state: RunState, guess: string, dict: Set<string> | null): RunState {
  if (state.status !== "playing") return state;
  const round = state.round;
  const clean = guess.toLowerCase();
  if (clean.length !== round.wordLength || !isValidWord(clean, dict)) {
    return { ...state, rejectedGuess: clean };
  }

  const rule = activeRule(state);
  const result = evaluateGuess(clean, round.answer);
  const guesses = [...round.guesses, clean];
  const results = [...round.results, result];
  const solved = isSolved(result);
  const roundOver = solved || guesses.length >= round.attemptsAllowed;

  // Guess tax (The Miser) applies per submitted guess.
  let ink = state.ink;
  for (const r of ruleList(rule ?? { kind: "combined", rules: [] })) {
    if (r.kind === "guess-tax") ink = Math.max(0, ink - r.ink);
  }

  const midRound: RunState = {
    ...state,
    ink,
    rejectedGuess: null,
    round: { ...round, guesses, results },
  };
  midRound.round.roundScore = provisionalChips(midRound.round, rule);

  if (!roundOver) return midRound;

  // Round finished — score it for real.
  const { total, inkEarned, trace } = scoreRound(midRound, rule, solved);
  const cleared = total >= state.targetScore;
  const finishedRound: RoundState = {
    ...midRound.round,
    roundScore: total,
    status: cleared ? "cleared" : "failed",
  };

  if (cleared) {
    const payout = clearPayout(midRound, rule, guesses.length);
    const next: RunState = {
      ...midRound,
      round: finishedRound,
      score: state.score + total,
      ink: midRound.ink + payout + inkEarned,
      lastTrace: trace,
      history: [
        ...state.history,
        { ante: state.ante, blind: state.blind, score: total, skipped: false },
      ],
    };
    if (state.blind === "censor" && state.ante >= FINAL_CHAPTER) {
      return { ...next, status: "won", shop: null };
    }
    return { ...next, status: "shop", shop: generateShop(next, 0) };
  }

  // Missed the target. Blotting Paper absorbs one failure; otherwise it costs a life.
  if (state.shielded) {
    return { ...midRound, round: finishedRound, shielded: false, lastTrace: trace, status: "round-failed" };
  }
  const lives = state.lives - 1;
  if (lives <= 0) {
    return { ...midRound, round: finishedRound, lives: 0, lastTrace: trace, status: "lost" };
  }
  return { ...midRound, round: finishedRound, lives, lastTrace: trace, status: "round-failed" };
}

// Ink paid out for clearing the current blind.
function clearPayout(state: RunState, rule: CensorRule | null, attemptsUsed: number): number {
  let base = BLIND_PAYOUT[state.blind];
  for (const r of ruleList(rule ?? { kind: "combined", rules: [] })) {
    if (r.kind === "raised-target") base *= r.payoutFactor;
  }
  const unused = Math.min(
    UNUSED_GUESS_INK_CAP,
    Math.max(0, state.round.attemptsAllowed - attemptsUsed),
  );
  const cap =
    stakeMods(state.stake).interestCap +
    state.muses.reduce((sum, m) => sum + (getMuse(m.id).interestCapBonus ?? 0), 0);
  const interest = Math.min(cap, Math.floor(state.ink / INTEREST_PER));
  return base + unused + interest;
}

// After a "round-failed" pause: back to blind-select for the same blind (new word).
export function continueAfterFailure(state: RunState): RunState {
  if (state.status !== "round-failed") return state;
  return { ...state, status: "blind-select", round: emptyRound(), lastTrace: null };
}

// ---- The Scriptorium (shop) ------------------------------------------------------

export function generateShop(state: RunState, rerolls: number): ShopState {
  const rng = rngStream(state.seed, `shop:${state.ante}:${state.blind}:${rerolls}`);
  const items: ShopItem[] = [];
  const owned = new Set(state.muses.map((m) => m.id));
  const inShop = new Set<string>();

  const pickMuse = (): MuseId | null => {
    const r = rng();
    const rarity = r < 0.05 ? "rare" : r < 0.3 ? "uncommon" : "common";
    let pool = state.musePool.filter(
      (id) => MUSES[id].rarity === rarity && !owned.has(id) && !inShop.has(id),
    );
    if (pool.length === 0)
      pool = state.musePool.filter((id) => !owned.has(id) && !inShop.has(id));
    if (pool.length === 0) return null;
    return pickFrom(rng, pool);
  };

  for (let slot = 0; slot < 3; slot++) {
    const roll = rng();
    if (roll < 0.75) {
      const id = pickMuse();
      if (id) {
        inShop.add(id);
        items.push({ kind: "muse", id, price: MUSES[id].price, sold: false });
        continue;
      }
    }
    const inkId = pickFrom(rng, ALL_INK_IDS);
    items.push({ kind: "ink", id: inkId, price: getInk(inkId).price, sold: false });
  }

  if (rng() < 0.25 && state.lives < MAX_LIVES) {
    items.push({ kind: "life", price: LIFE_PRICE, sold: false });
  }
  return { items, rerolls };
}

export function buyItem(state: RunState, index: number): RunState {
  if (state.status !== "shop" || !state.shop) return state;
  const item = state.shop.items[index];
  if (!item || item.sold || state.ink < item.price) return state;
  if (item.kind === "muse" && state.muses.length >= MAX_MUSES) return state;
  if (item.kind === "ink" && state.consumables.length >= MAX_CONSUMABLES) return state;
  if (item.kind === "life" && state.lives >= MAX_LIVES) return state;

  const items = state.shop.items.map((it, i) => (i === index ? { ...it, sold: true } : it));
  const next: RunState = {
    ...state,
    ink: state.ink - item.price,
    shop: { ...state.shop, items },
  };
  if (item.kind === "muse") next.muses = [...state.muses, { id: item.id, level: 1 }];
  else if (item.kind === "ink") next.consumables = [...state.consumables, item.id];
  else next.lives = state.lives + 1;
  return next;
}

export function sellMuse(state: RunState, museIndex: number): RunState {
  if (state.status !== "shop") return state;
  const owned = state.muses[museIndex];
  if (!owned) return state;
  const refund = Math.floor(getMuse(owned.id).price / 2) + (owned.level - 1);
  return {
    ...state,
    ink: state.ink + refund,
    muses: state.muses.filter((_, i) => i !== museIndex),
  };
}

export function rerollCost(state: RunState): number {
  return stakeMods(state.stake).rerollBase + (state.shop?.rerolls ?? 0);
}

export function rerollShop(state: RunState): RunState {
  if (state.status !== "shop" || !state.shop) return state;
  const cost = rerollCost(state);
  if (state.ink < cost) return state;
  const rerolls = state.shop.rerolls + 1;
  const next = { ...state, ink: state.ink - cost };
  return { ...next, shop: generateShop(next, rerolls) };
}

// Leave the shop and advance to the next blind (or chapter).
export function leaveShop(state: RunState): RunState {
  if (state.status !== "shop") return state;
  let { ante, blind, bossId } = state;
  if (blind === "draft") blind = "faircopy";
  else if (blind === "faircopy") blind = "censor";
  else {
    ante += 1;
    blind = "draft";
    bossId = drawBoss(state.seed, ante);
  }
  const next: RunState = {
    ...state,
    ante,
    blind,
    bossId,
    shop: null,
    status: "blind-select",
    round: emptyRound(),
    lastTrace: null,
  };
  next.targetScore = targetFor(next, blind);
  return next;
}

// ---- Consumables (Inks) ----------------------------------------------------------

const ALPHABET = "abcdefghijklmnopqrstuvwxyz";

// Use the vial in slot `slot`. `answers` is only needed for Sepia (same length as the
// current word); other vials ignore it.
export function applyConsumable(state: RunState, slot: number, answers?: readonly string[]): RunState {
  const id = state.consumables[slot];
  if (!id) return state;
  const def = getInk(id);
  const inRound = state.status === "playing";
  if (def.usable === "round" && !inRound) return state;
  if (def.usable === "anywhere" && !inRound && state.status !== "shop") return state;

  const round = state.round;
  const consume = (patch: Partial<RunState>): RunState => ({
    ...state,
    ...patch,
    consumables: state.consumables.filter((_, i) => i !== slot),
  });
  const rng = rngStream(state.seed, `ink:${id}:${state.blindIndex}:${round.guesses.length}`);

  switch (id) {
    case "diviners-ink": {
      const known = new Set(round.revealedLetters.map((r) => r.position));
      round.results.forEach((row, gi) => {
        row.forEach((r, pos) => {
          if (r === "correct" && round.guesses[gi][pos] === round.answer[pos]) known.add(pos);
        });
      });
      const candidates = [...round.answer].map((_, i) => i).filter((i) => !known.has(i));
      if (candidates.length === 0) return state;
      const position = pickFrom(rng, candidates);
      return consume({
        round: {
          ...round,
          revealedLetters: [...round.revealedLetters, { position, letter: round.answer[position] }],
        },
      });
    }
    case "bleach": {
      const seen = new Set(round.guesses.flatMap((g) => [...g]));
      const inAnswer = new Set([...round.answer]);
      const pool = [...ALPHABET].filter(
        (c) => !inAnswer.has(c) && !round.ruledOut.includes(c) && !seen.has(c),
      );
      const picked: string[] = [];
      while (picked.length < 5 && pool.length > 0) {
        const i = Math.floor(rng() * pool.length);
        picked.push(pool.splice(i, 1)[0]);
      }
      if (picked.length === 0) return state;
      return consume({ round: { ...round, ruledOut: [...round.ruledOut, ...picked] } });
    }
    case "sympathetic-ink":
      return consume({ round: { ...round, attemptsAllowed: round.attemptsAllowed + 1 } });
    case "gilded-ink":
      return consume({ round: { ...round, gilded: true } });
    case "sepia": {
      if (!answers || answers.length === 0) return state;
      const pool = answers.filter((w) => w !== round.answer && !round.guesses.includes(w));
      if (pool.length === 0) return state;
      const answer = pickFrom(rng, pool);
      return consume({
        round: {
          ...round,
          answer,
          results: round.guesses.map((g) => evaluateGuess(g, answer)),
          revealedLetters: [],
          ruledOut: [],
        },
      });
    }
    case "copyists-ink": {
      if (state.muses.length === 0) return state;
      const i = Math.floor(rng() * state.muses.length);
      return consume({
        muses: state.muses.map((m, j) => (j === i ? { ...m, level: m.level + 1 } : m)),
      });
    }
    case "blotting-paper":
      if (state.shielded) return state;
      return consume({ shielded: true });
    case "india-ink":
      return consume({ ink: state.ink + 5 });
  }
}
