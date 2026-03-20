import { useState } from "react";
import { createNewRun, submitGuess } from "./gameEngine";

export function useGame() {
  const [run, setRun] = useState(createNewRun());

  function startNewGame() {
    setRun(createNewRun());
  }

  function playGuess(guess: string) {
    setRun((current) => submitGuess(current, guess));
  }

  return {
    run,
    startNewGame,
    playGuess,
  };
}
