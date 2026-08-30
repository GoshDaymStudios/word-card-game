import type { LetterResult, WordLength } from "../../lib/words";
import type { MuseId } from "./muses";
import type { InkId } from "./inks";
import type { CensorId } from "./censors";
import type { ScoringEvent } from "./scoring";

export type BlindKind = "draft" | "faircopy" | "censor";

// One word challenge inside a run.
export type RoundState = {
  answer: string; // hidden from the player in the UI
  wordLength: WordLength;
  attemptsAllowed: number;
  guesses: string[];
  results: LetterResult[][]; // truthful results; censor display rules are applied in the UI
  roundScore: number; // provisional chips while playing; final score once finished
  status: "playing" | "cleared" | "failed";
  // Consumable state for this round:
  revealedLetters: { position: number; letter: string }[]; // Diviner's Ink
  ruledOut: string[]; // Bleach — letters known absent
  gilded: boolean; // Gilded Ink — greens score double this round
  mutedMuse: MuseId | null; // The Silencer — disabled for this round
  bannedLetter: string | null; // The Redactor — scores 0 chips
};

export type OwnedMuse = { id: MuseId; level: number };

export type ShopItem =
  | { kind: "muse"; id: MuseId; price: number; sold: boolean }
  | { kind: "ink"; id: InkId; price: number; sold: boolean }
  | { kind: "life"; price: number; sold: boolean };

export type ShopState = {
  items: ShopItem[];
  rerolls: number; // rerolls bought this visit (drives escalating cost)
};

// The whole run ("Manuscript"). Fully JSON-serializable — it drops straight into the
// Supabase `runs.run_data` column and localStorage (see persistence.ts).
export type RunState = {
  version: 2;
  seed: string;
  stake: number; // Ink Grade, 1..5
  ante: number; // current chapter (1..FINAL_CHAPTER)
  blind: BlindKind;
  blindIndex: number; // global counter over started blinds, drives RNG streams
  targetScore: number; // what the current round must reach
  score: number; // cumulative score across the run (leaderboard)
  ink: number; // currency
  lives: number;
  muses: OwnedMuse[];
  musePool: MuseId[]; // muses this run can offer (snapshot of unlocks at run start)
  consumables: InkId[]; // held ink vials (max slots in gameEngine)
  bossId: CensorId; // this chapter's censor (revealed at chapter start)
  shielded: boolean; // Blotting Paper — next failed round costs no life
  shop: ShopState | null; // non-null while status === "shop"
  // blind-select = choosing word length / skipping; round-failed = lost the round but
  // still have lives (pause screen, then back to blind-select for the same blind).
  status: "blind-select" | "playing" | "round-failed" | "shop" | "won" | "lost";
  round: RoundState;
  rejectedGuess: string | null; // last guess refused by the dictionary (UI shakes row)
  lastTrace: ScoringEvent[] | null; // scoring playback for the juice layer
  history: { ante: number; blind: BlindKind; score: number; skipped: boolean }[];
};
