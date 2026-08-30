import { useEffect, useMemo, useRef, useState } from "react";
import { isValidWord, loadDictionary } from "../../lib/words";
import { getWordForDate, dateKey, getStreak, recordResult, type StreakInfo } from "./daily";
import {
  createDailyGame,
  submitGuess,
  applyPowerUp,
  toEmojiGrid,
  dailyScore,
  type DailyState,
} from "./dailyState";

// Hook wrapping today's daily game. UI stays dumb; rules live in dailyState.ts.
export function useDaily() {
  const today = useMemo(() => new Date(), []);
  const answer = useMemo(() => getWordForDate(today), [today]);

  const [state, setState] = useState<DailyState>(() => createDailyGame(answer));
  const [streak, setStreak] = useState<StreakInfo>(() => getStreak());

  // Real-word validation (same dictionary the roguelike uses; null until loaded,
  // in which case only the format is checked).
  const dictRef = useRef<Set<string> | null>(null);
  useEffect(() => {
    void loadDictionary(5).then((d) => (dictRef.current = d));
  }, []);

  function isGuessValid(word: string): boolean {
    return word.length === 5 && isValidWord(word.toLowerCase(), dictRef.current);
  }

  function guess(word: string) {
    setState((current) => {
      const next = submitGuess(current, word);
      // Record streak exactly once, on the transition into a finished state.
      if (current.status === "playing" && next.status !== "playing") {
        setStreak(recordResult(next.status === "won", today));
      }
      return next;
    });
  }

  function reveal() {
    setState((current) => applyPowerUp(current));
  }

  function shareText(): string {
    return toEmojiGrid(state, `Word Card — Daily ${dateKey(today)}`);
  }

  return {
    state,
    streak,
    guess,
    isGuessValid,
    reveal,
    shareText,
    score: dailyScore(state),
    dateKey: dateKey(today),
  };
}
