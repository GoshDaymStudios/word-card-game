// Barrel for the shared word engine. Import from here:
//   import { evaluateGuess, isSolved, WORDS, wordAt } from "../../lib/words";
export type { LetterResult } from "./types";
export { evaluateGuess, isSolved } from "./evaluateGuess";
export { WORDS, wordAt } from "./wordList";
