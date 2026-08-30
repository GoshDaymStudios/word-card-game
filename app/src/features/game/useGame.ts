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
import type { RunState } from "./types";

// Thin stateful wrapper around the pure engine. Owns three things the engine can't:
// autosave (every state change hits localStorage; a reload resumes silently), the
// async-loaded dictionary/answer lists, and the seam between UI events and reducers.
export function useGame() {
  const [run, setRun] = useState<RunState>(() => loadLocal() ?? createRun());
  const dictRef = useRef<Set<string> | null>(null);
  const answersRef = useRef<readonly string[]>([]);

  useEffect(() => saveLocal(run), [run]);

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
    setRun(createRun(seed, stake));
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
