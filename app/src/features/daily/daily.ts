import { wordAt } from "../../lib/words";

// Daily-mode helpers: deterministic word-of-the-day + streak tracking.
// Everything here is pure / localStorage-only — no backend needed.

// Stable integer for a given LOCAL calendar date (days since epoch).
// Local (not UTC) so "today" matches the player's own calendar.
function dayNumber(date: Date): number {
  const local = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  return Math.floor(local.getTime() / 86_400_000);
}

// "YYYY-MM-DD" key for the given local date. Used for streak + share text.
export function dateKey(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

// Word of the day. Same date -> same word for everyone (in the same timezone).
// The stride scatters consecutive days so adjacent days don't get adjacent words.
export function getWordForDate(date: Date = new Date()): string {
  return wordAt(dayNumber(date) * 7919);
}

// ---- Streak (localStorage) -------------------------------------------------

const STREAK_KEY = "daily:streak";
const LAST_DATE_KEY = "daily:lastDate";

export type StreakInfo = { streak: number; lastDate: string | null };

export function getStreak(): StreakInfo {
  if (typeof localStorage === "undefined") return { streak: 0, lastDate: null };
  const streak = Number(localStorage.getItem(STREAK_KEY) ?? "0");
  const lastDate = localStorage.getItem(LAST_DATE_KEY);
  return { streak: Number.isFinite(streak) ? streak : 0, lastDate };
}

// Call once when a daily game finishes. Won extends the streak if the previous
// win was yesterday, otherwise resets to 1. A loss breaks the streak.
export function recordResult(won: boolean, date: Date = new Date()): StreakInfo {
  if (typeof localStorage === "undefined") return { streak: 0, lastDate: null };

  const today = dateKey(date);
  const { streak, lastDate } = getStreak();

  // Already recorded today -> no double counting.
  if (lastDate === today) return { streak, lastDate };

  let next: number;
  if (!won) {
    next = 0;
  } else {
    const yesterday = dateKey(new Date(date.getTime() - 86_400_000));
    next = lastDate === yesterday ? streak + 1 : 1;
  }

  localStorage.setItem(STREAK_KEY, String(next));
  localStorage.setItem(LAST_DATE_KEY, today);
  return { streak: next, lastDate: today };
}
