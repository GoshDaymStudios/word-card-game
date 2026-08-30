import { useEffect, useRef, useState } from "react";
import { isValidWord, loadAnswers, loadDictionary, type WordLength } from "../../lib/words";
import {
  buyItem,
  continueAfterFailure,
  createRun,
  leaveShop,
  rerollShop,
  sellMuse,
  skipBlind,
  startBlind,
  submitGuess,
  applyConsumable,
} from "./gameEngine";
import { clearLocal, loadLocal, saveLocal } from "./persistence";
import {
  loadProgress,
  museName,
  musesUnlockedBy,
  recordSnapshot,
  unlockedMuses,
} from "../../lib/progress";
import type { RunState } from "./types";

// Thin stateful wrapper around the pure engine. Owns three things the engine can't:
// autosave (every state change hits localStorage; a reload resumes silently), the
// async-loaded dictionary/answer lists, and the seam between UI events and reducers.
export function useGame() {
  const [run, setRun] = useState<RunState>(() => {
    const saved = loadLocal();
    // Drop the trace on resume so the scoring cascade doesn't replay after a reload.
    if (saved) return { ...saved, lastTrace: null };
    return createRun(undefined, 1, unlockedMuses(loadProgress()));
  });
  const [notices, setNotices] = useState<string[]>([]);
  const dictRef = useRef<Set<string> | null>(null);
  const answersRef = useRef<readonly string[]>([]);

  useEffect(() => saveLocal(run), [run]);

  // Meta-progression: after every state transition, evaluate achievements/stats
  // against the new snapshot. Newly earned ones surface as notices (toasts).
  const prevRunRef = useRef<RunState | null>(null);
  useEffect(() => {
    const prev = prevRunRef.current;
    prevRunRef.current = run;
    if (!prev || prev === run || prev.seed !== run.seed) return;
    const last = run.history[run.history.length - 1];
    const wordSolved = run.history.length > prev.history.length && last?.skipped === false;
    const runWon = prev.status !== "won" && run.status === "won";
    const earned = recordSnapshot(run, { wordSolved, runWon });
    if (earned.length > 0) {
      const lines = earned.map((a) => {
        const muses = musesUnlockedBy([a]).map(museName);
        return `🏅 ${a.name}${muses.length > 0 ? ` — unlocked: ${muses.join(", ")}` : ""}`;
      });
      // Deferred so the effect itself stays free of synchronous state updates.
      window.setTimeout(() => setNotices((n) => [...n, ...lines]), 0);
    }
  }, [run]);

  // Keep the dictionary/answers for the active word length loaded (covers resuming
  // a saved run mid-round; beginBlind pre-loads them on the normal path).
  const { status } = run;
  const wordLength = run.round.wordLength;
  useEffect(() => {
    if (status !== "playing") return;
    void loadDictionary(wordLength).then((d) => (dictRef.current = d));
    void loadAnswers(wordLength).then((a) => (answersRef.current = a));
  }, [status, wordLength]);

  function startNewGame(seed?: string, stake?: number) {
    clearLocal();
    const fresh = createRun(seed, stake, unlockedMuses(loadProgress()));
    recordSnapshot(fresh, { runStarted: true });
    setRun(fresh);
  }

  async function beginBlind(len: WordLength) {
    const [answers, dictionary] = await Promise.all([loadAnswers(len), loadDictionary(len)]);
    dictRef.current = dictionary;
    answersRef.current = answers;
    setRun((current) => startBlind(current, len, answers));
  }

  function playGuess(guess: string) {
    setRun((current) => submitGuess(current, guess, dictRef.current));
  }

  // Synchronous pre-check so the UI can react (shake/sound) before dispatching.
  function isGuessValid(guess: string): boolean {
    return (
      guess.length === run.round.wordLength && isValidWord(guess.toLowerCase(), dictRef.current)
    );
  }

  function useInk(slot: number) {
    setRun((current) => applyConsumable(current, slot, answersRef.current));
  }

  const dispatch = (fn: (state: RunState) => RunState) => () => setRun(fn);

  return {
    run,
    notices,
    dismissNotice: (index: number) => setNotices((n) => n.filter((_, i) => i !== index)),
    startNewGame,
    beginBlind,
    playGuess,
    isGuessValid,
    useInk,
    skip: dispatch(skipBlind),
    continueRound: dispatch(continueAfterFailure),
    buy: (index: number) => setRun((current) => buyItem(current, index)),
    sell: (museIndex: number) => setRun((current) => sellMuse(current, museIndex)),
    reroll: dispatch(rerollShop),
    leave: dispatch(leaveShop),
  };
}
