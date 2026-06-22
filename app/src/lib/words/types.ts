// Shared word-engine types. Used by both game modes (daily + roguelike).

// Result for a single letter in a guess, Wordle-style.
//   correct = right letter, right spot   (green)
//   present = right letter, wrong spot   (yellow)
//   absent  = letter not in the answer   (gray)
export type LetterResult = "correct" | "present" | "absent";
