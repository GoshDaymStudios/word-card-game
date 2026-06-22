import { useState } from "react";
import { createRun, submitGuess, chooseModifier } from "./gameEngine";
import type { ModifierId } from "./modifiers";

export function useGame() {
  const [run, setRun] = useState(createRun);

  function startNewGame() {
    setRun(createRun());
  }

  function playGuess(guess: string) {
    setRun((current) => submitGuess(current, guess));
  }

  function pickModifier(id: ModifierId | null) {
    setRun((current) => chooseModifier(current, id));
  }

  return {
    run,
    startNewGame,
    playGuess,
    pickModifier,
  };
}
