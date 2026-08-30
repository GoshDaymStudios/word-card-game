// Barrel for the shared word engine. Import from here:
//   import { evaluateGuess, isSolved, WORDS, wordAt } from "../../lib/words";
export type { LetterResult } from "./types";
export type { WordLength } from "./dictionaries";
export { evaluateGuess, isSolved } from "./evaluateGuess";
export { WORDS, wordAt } from "./wordList";
export { loadDictionary, loadAnswers, isValidWord } from "./dictionaries";
