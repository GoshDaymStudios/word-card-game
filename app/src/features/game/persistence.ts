// Run autosave. The whole RunState is one serializable object, so saving is just
// JSON in localStorage — written on every state change (useGame), cleared when a run
// ends or is abandoned. `migrateRun` gates loading: unknown versions are discarded
// (the player is offered a fresh run) rather than half-migrated.
import { ALL_MUSE_IDS } from "./muses";
import type { RunState } from "./types";

const KEY = "manuscript-run-v1";

export function saveLocal(run: RunState): void {
  try {
    if (run.status === "won" || run.status === "lost") {
      localStorage.removeItem(KEY);
    } else {
      localStorage.setItem(KEY, JSON.stringify(run));
    }
  } catch {
    // Storage unavailable (private mode etc.) — autosave is best-effort.
  }
}

export function clearLocal(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}

export function loadLocal(): RunState | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    return migrateRun(JSON.parse(raw));
  } catch {
    return null;
  }
}

// Accepts a parsed blob of unknown shape; returns a usable RunState or null.
// Add a `case` here on every breaking RunState change (and bump the version).
export function migrateRun(raw: unknown): RunState | null {
  if (typeof raw !== "object" || raw === null) return null;
  const version = (raw as { version?: unknown }).version;
  switch (version) {
    case 2: {
      const run = raw as RunState;
      // Field added after the first v2 saves shipped; default keeps old saves valid.
      return { ...run, musePool: run.musePool ?? ALL_MUSE_IDS };
    }
    default:
      return null;
  }
}
