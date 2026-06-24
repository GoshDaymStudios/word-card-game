import { useMemo, useState } from "react";
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

  return { state, streak, guess, reveal, shareText, score: dailyScore(state), dateKey: dateKey(today) };
}
