export type RunStatus = "playing" | "won" | "lost";

export type RunState = {
  round: number;
  score: number;
  status: RunStatus;
  guesses: string[];
};
