// Meta-progression: achievements, muse unlocks, ink-grade ladder and lifetime stats.
// Storage model: localStorage is the source of truth for instant reads; when the
// player is logged in, progress is mirrored to Supabase (player_progress) and merged
// on load (union of unlocks, max of stats) so it follows them across devices.
// Achievement checks are client-side — same trust model as scores today.
import { supabase } from "./supabase";
import { ALL_MUSE_IDS, MUSES, type MuseId } from "../features/game/muses";
import type { RunState } from "../features/game/types";

export type AchievementId =
  | "first-censor"
  | "chapter3"
  | "vowels3"
  | "long-word"
  | "seven-in-3"
  | "solve2"
  | "last-life"
  | "no-gray"
  | "rare-letter"
  | "hold25"
  | "censors3"
  | "win-run"
  | "win-sepia";

export type AchievementDef = {
  id: AchievementId;
  name: string;
  description: string;
  // Pure predicate over a run snapshot; evaluated after every state change.
  check: (run: RunState) => boolean;
};

const VOWELS = new Set(["a", "e", "i", "o", "u"]);
const RARE = new Set(["j", "q", "x", "z"]);
const censorsCleared = (run: RunState) =>
  run.history.filter((h) => h.blind === "censor" && !h.skipped).length;
const roundCleared = (run: RunState) => run.round.status === "cleared" && run.round.answer !== "";

export const ACHIEVEMENTS: Record<AchievementId, AchievementDef> = {
  "first-censor": {
    id: "first-censor",
    name: "Past the Censor",
    description: "Defeat your first censor.",
    check: (run) => censorsCleared(run) >= 1,
  },
  chapter3: {
    id: "chapter3",
    name: "Serialized",
    description: "Reach chapter 3.",
    check: (run) => run.ante >= 3,
  },
  vowels3: {
    id: "vowels3",
    name: "Assonance",
    description: "Clear a round whose answer has 3+ vowels.",
    check: (run) =>
      roundCleared(run) && [...run.round.answer].filter((c) => VOWELS.has(c)).length >= 3,
  },
  "long-word": {
    id: "long-word",
    name: "Sesquipedalian",
    description: "Clear a round with a 7-letter word.",
    check: (run) => roundCleared(run) && run.round.wordLength === 7,
  },
  "seven-in-3": {
    id: "seven-in-3",
    name: "Clairvoyant",
    description: "Solve a 7-letter word in 3 guesses or fewer.",
    check: (run) =>
      roundCleared(run) && run.round.wordLength === 7 && run.round.guesses.length <= 3,
  },
  solve2: {
    id: "solve2",
    name: "Second Sight",
    description: "Solve a word in 2 guesses or fewer.",
    check: (run) => roundCleared(run) && run.round.guesses.length <= 2,
  },
  "last-life": {
    id: "last-life",
    name: "Deadline Delivery",
    description: "Clear a blind on your last life.",
    check: (run) => roundCleared(run) && run.lives === 1,
  },
  "no-gray": {
    id: "no-gray",
    name: "Clean Copy",
    description: "Clear a round without a single gray tile.",
    check: (run) =>
      roundCleared(run) &&
      run.round.results.length > 0 &&
      run.round.results.every((row) => row.every((r) => r !== "absent")),
  },
  "rare-letter": {
    id: "rare-letter",
    name: "Deep Cuts",
    description: "Score a J, Q, X or Z tile.",
    check: (run) =>
      roundCleared(run) &&
      run.round.results.some((row, gi) =>
        row.some((r, i) => r !== "absent" && RARE.has(run.round.guesses[gi][i])),
      ),
  },
  hold25: {
    id: "hold25",
    name: "Deep Pockets",
    description: "Hold 25⬤ at once.",
    check: (run) => run.ink >= 25,
  },
  censors3: {
    id: "censors3",
    name: "Uncensorable",
    description: "Defeat 3 censors in one manuscript.",
    check: (run) => censorsCleared(run) >= 3,
  },
  "win-run": {
    id: "win-run",
    name: "Published",
    description: "Win a manuscript.",
    check: (run) => run.status === "won",
  },
  "win-sepia": {
    id: "win-sepia",
    name: "Second Edition",
    description: "Win a manuscript at Sepia grade or higher.",
    check: (run) => run.status === "won" && run.stake >= 2,
  },
};

export const ALL_ACHIEVEMENT_IDS = Object.keys(ACHIEVEMENTS) as AchievementId[];

// Which achievement unlocks each locked muse. Muses absent here are available from
// the start (10 baseline muses).
export const MUSE_UNLOCKS: Partial<Record<MuseId, AchievementId>> = {
  echo: "first-censor",
  apprentice: "first-censor",
  overture: "vowels3",
  lyricist: "vowels3",
  minimalist: "chapter3",
  "illuminated-initial": "chapter3",
  "slow-ink": "long-word",
  novelist: "long-word",
  oracle: "seven-in-3",
  prodigy: "solve2",
  "first-take": "solve2",
  deadline: "last-life",
  "fair-hand": "no-gray",
  lexicographer: "rare-letter",
  treasurer: "hold25",
  "gold-leaf": "hold25",
  unbowed: "censors3",
  serialist: "win-run",
  "magnum-opus": "win-run",
  "gilded-nib": "win-sepia",
};

export type ProgressData = {
  version: 1;
  achievements: Partial<Record<AchievementId, string>>; // id → ISO date earned
  stakeCleared: number; // highest Ink Grade won (0 = none yet)
  stats: {
    runsStarted: number;
    runsWon: number;
    bestScore: number;
    wordsSolved: number;
  };
};

const KEY = "manuscript-progress-v1";

export function emptyProgress(): ProgressData {
  return {
    version: 1,
    achievements: {},
    stakeCleared: 0,
    stats: { runsStarted: 0, runsWon: 0, bestScore: 0, wordsSolved: 0 },
  };
}

export function loadProgress(): ProgressData {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return emptyProgress();
    const parsed = JSON.parse(raw) as ProgressData;
    return parsed.version === 1 ? { ...emptyProgress(), ...parsed } : emptyProgress();
  } catch {
    return emptyProgress();
  }
}

function saveProgress(progress: ProgressData): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(progress));
  } catch {
    /* best-effort */
  }
}

export function unlockedMuses(progress: ProgressData): MuseId[] {
  return ALL_MUSE_IDS.filter((id) => {
    const gate = MUSE_UNLOCKS[id];
    return gate === undefined || progress.achievements[gate] !== undefined;
  });
}

// Evaluate a run snapshot against the stored progress; persist and return anything
// newly earned. `event` marks countable transitions the caller detected.
export function recordSnapshot(
  run: RunState,
  event: { runStarted?: boolean; wordSolved?: boolean; runWon?: boolean } = {},
): AchievementDef[] {
  const progress = loadProgress();
  const now = new Date().toISOString();
  const earned: AchievementDef[] = [];

  for (const id of ALL_ACHIEVEMENT_IDS) {
    if (progress.achievements[id] === undefined && ACHIEVEMENTS[id].check(run)) {
      progress.achievements[id] = now;
      earned.push(ACHIEVEMENTS[id]);
    }
  }
  if (event.runStarted) progress.stats.runsStarted += 1;
  if (event.wordSolved) progress.stats.wordsSolved += 1;
  if (event.runWon) {
    progress.stats.runsWon += 1;
    progress.stakeCleared = Math.max(progress.stakeCleared, run.stake);
  }
  progress.stats.bestScore = Math.max(progress.stats.bestScore, run.score);

  saveProgress(progress);
  void pushRemote(progress);
  return earned;
}

// Muses newly unlocked by a set of just-earned achievements.
export function musesUnlockedBy(achievements: AchievementDef[]): MuseId[] {
  const ids = new Set(achievements.map((a) => a.id));
  return ALL_MUSE_IDS.filter((m) => {
    const gate = MUSE_UNLOCKS[m];
    return gate !== undefined && ids.has(gate);
  });
}

export function museName(id: MuseId): string {
  return MUSES[id].name;
}

// ---- Supabase mirror (best-effort; localStorage stays authoritative) -------------

function mergeProgress(a: ProgressData, b: ProgressData): ProgressData {
  const achievements = { ...b.achievements, ...a.achievements };
  return {
    version: 1,
    achievements,
    stakeCleared: Math.max(a.stakeCleared, b.stakeCleared),
    stats: {
      runsStarted: Math.max(a.stats.runsStarted, b.stats.runsStarted),
      runsWon: Math.max(a.stats.runsWon, b.stats.runsWon),
      bestScore: Math.max(a.stats.bestScore, b.stats.bestScore),
      wordsSolved: Math.max(a.stats.wordsSolved, b.stats.wordsSolved),
    },
  };
}

async function pushRemote(progress: ProgressData): Promise<void> {
  try {
    const { data } = await supabase.auth.getUser();
    if (!data.user) return;
    await supabase
      .from("player_progress")
      .upsert({ user_id: data.user.id, data: progress, updated_at: new Date().toISOString() });
  } catch {
    /* offline / logged out — fine */
  }
}

// Pull the remote copy (if logged in), merge with local, save both ways.
export async function syncProgress(): Promise<ProgressData> {
  const local = loadProgress();
  try {
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) return local;
    const { data } = await supabase
      .from("player_progress")
      .select("data")
      .eq("user_id", auth.user.id)
      .maybeSingle();
    const remote = (data?.data as ProgressData | undefined) ?? emptyProgress();
    const merged = mergeProgress(local, remote);
    saveProgress(merged);
    void pushRemote(merged);
    return merged;
  } catch {
    return local;
  }
}
