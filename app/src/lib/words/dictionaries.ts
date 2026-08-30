// Guess dictionaries (real-word validation) and answer lists per word length.
// Dictionaries are the big files, so they are code-split and loaded on demand
// (loadDictionary is called when a round starts, well before the first guess).
import { WORDS } from "./wordList";

export type WordLength = 4 | 5 | 6 | 7;

const answerLists: Record<WordLength, () => Promise<readonly string[]>> = {
  4: () => import("./answers4").then((m) => m.ANSWERS4),
  5: () => Promise.resolve(WORDS),
  6: () => import("./answers6").then((m) => m.ANSWERS6),
  7: () => import("./answers7").then((m) => m.ANSWERS7),
};

const dictImports: Record<WordLength, () => Promise<string>> = {
  4: () => import("./dict4").then((m) => m.default),
  5: () => import("./dict5").then((m) => m.default),
  6: () => import("./dict6").then((m) => m.default),
  7: () => import("./dict7").then((m) => m.default),
};

const dictCache = new Map<WordLength, Set<string>>();
const answerCache = new Map<WordLength, readonly string[]>();

export async function loadDictionary(len: WordLength): Promise<Set<string>> {
  const cached = dictCache.get(len);
  if (cached) return cached;
  const set = new Set((await dictImports[len]()).split("\n"));
  dictCache.set(len, set);
  return set;
}

export async function loadAnswers(len: WordLength): Promise<readonly string[]> {
  const cached = answerCache.get(len);
  if (cached) return cached;
  const list = await answerLists[len]();
  answerCache.set(len, list);
  return list;
}

// Synchronous check against an already-loaded dictionary; null dict = accept any
// well-formed word (used before the dictionary finishes loading, and in tests).
export function isValidWord(word: string, dict: Set<string> | null): boolean {
  if (!/^[a-z]+$/.test(word)) return false;
  return dict === null || dict.has(word);
}
