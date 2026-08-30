import type { WordLength } from "../../lib/words";
import { allowedLengths, targetFor } from "./gameEngine";
import { getCensor } from "./censors";
import type { BlindKind, RunState } from "./types";
import "./BlindSelect.css";

const BLIND_NAME: Record<BlindKind, string> = {
  draft: "First Draft",
  faircopy: "Fair Copy",
  censor: "The Censor",
};
const BLIND_PAYOUT_LABEL: Record<BlindKind, string> = { draft: "3⬤", faircopy: "4⬤", censor: "5⬤" };

// Commission screen: shown before each blind. The player picks a word length (our
// "hand type" choice — longer words hold more chips but are harder), or skips the
// First Draft. The chapter's censor is always visible so purchases can be planned.
export function BlindSelect({
  run,
  onPick,
  onSkip,
}: {
  run: RunState;
  onPick: (len: WordLength) => void;
  onSkip: () => void;
}) {
  const censor = getCensor(run.bossId);
  const lengths = allowedLengths(run);
  const isCensor = run.blind === "censor";

  return (
    <div className="blind-select">
      <div className="blind-track">
        {(["draft", "faircopy", "censor"] as const).map((b) => {
          const done = run.history.some(
            (h) => h.ante === run.ante && h.blind === b && (h.skipped || h.score > 0),
          );
          const current = b === run.blind;
          return (
            <span
              key={b}
              className={`blind-step ${current ? "current" : ""} ${done ? "done" : ""}`}
            >
              {b === "censor" ? censor.name : BLIND_NAME[b]}
            </span>
          );
        })}
      </div>

      <div className={`blind-card ${isCensor ? "censor" : ""}`}>
        <h2 className="blind-title">{isCensor ? censor.name : BLIND_NAME[run.blind]}</h2>
        {isCensor && (
          <>
            <p className="blind-rule">{censor.description}</p>
            {censor.flavor && <p className="blind-flavor">“{censor.flavor}”</p>}
          </>
        )}
        <p className="blind-stats">
          Target <strong>{targetFor(run, run.blind)}</strong> · Reward{" "}
          <strong>{BLIND_PAYOUT_LABEL[run.blind]}</strong>
        </p>

        <div className="blind-lengths">
          {lengths.map((len) => (
            <button key={len} onClick={() => onPick(len)}>
              Write a {len}-letter word
            </button>
          ))}
        </div>
        {run.blind === "draft" && (
          <button className="blind-skip" onClick={onSkip}>
            Skip the draft (+1⬤)
          </button>
        )}
      </div>

      {!isCensor && (
        <p className="blind-upcoming">
          Awaiting you this chapter: <strong>{censor.name}</strong> — {censor.description}
        </p>
      )}
    </div>
  );
}
