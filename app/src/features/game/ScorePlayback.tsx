import { useEffect, useMemo, useRef, useState } from "react";
import { Tile } from "../../components/Tile";
import { ModifierCard } from "../../components/ModifierCard";
import { getMuse, museDescription, type MuseId } from "./muses";
import { playSfx } from "../../lib/sound";
import type { ScoringEvent } from "./scoring";
import type { RunState } from "./types";
import "./ScorePlayback.css";

const CELL = 46;
const GAP = 6;

// Plays the scoring trace as a paced cascade — the Balatro trick: the engine already
// computed everything synchronously; this just replays the trace with tile pops,
// floating "+N" chips, rolling counters, muse card pops and pitch-stepped blips.
// Click anywhere (or reduced-motion preference) to fast-forward to the summary.
export function ScorePlayback({
  run,
  trace,
  onDone,
}: {
  run: RunState;
  trace: ScoringEvent[];
  onDone: () => void;
}) {
  const reduced = useMemo(
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    [],
  );
  const [step, setStep] = useState(() => (reduced ? trace.length : 0));
  const doneRef = useRef(false);

  // Aggregate state up to the current step.
  const state = useMemo(() => {
    let chips = 0;
    let mult = 1;
    let times = 1;
    let total: number | null = null;
    const floats: { key: number; x: number; y: number; text: string; cls: string }[] = [];
    const musePops = new Map<MuseId, string>();
    for (let i = 0; i < Math.min(step, trace.length); i++) {
      const e = trace[i];
      if (e.kind === "tile") {
        chips += e.chips;
        if (e.chips > 0) {
          floats.push({
            key: i,
            x: e.position * (CELL + GAP) + CELL / 2,
            y: e.guessIndex * (CELL + GAP),
            text: `+${e.chips}`,
            cls: e.result === "correct" ? "float-green" : "float-yellow",
          });
        }
      } else if (e.kind === "muse") {
        chips += e.effect.addChips ?? 0;
        mult += e.effect.addMult ?? 0;
        times *= e.effect.timesMult ?? 1;
        const label =
          e.effect.message ??
          (e.effect.addChips
            ? `+${e.effect.addChips} Letters`
            : e.effect.addMult
              ? `+${e.effect.addMult} Flourish`
              : e.effect.timesMult
                ? `×${e.effect.timesMult}`
                : e.effect.ink
                  ? `+${e.effect.ink}⬤`
                  : "");
        if (label) musePops.set(e.museId, label);
      } else if (e.kind === "solve-bonus") {
        chips += e.chips;
        mult += e.mult;
      } else if (e.kind === "final") {
        total = e.total;
      }
    }
    // Only the most recent few floats stay visible.
    return { chips, mult, times, total, floats: floats.slice(-6), musePops };
  }, [step, trace]);

  // Advance the cascade (a timeout per step; each fired step also plays its sound).
  useEffect(() => {
    if (reduced || step >= trace.length) return;
    const e = trace[step];
    const delay = e.kind === "tile" ? 90 : e.kind === "muse" ? 320 : e.kind === "final" ? 420 : 260;
    const t = window.setTimeout(() => {
      if (e.kind === "tile" && e.chips > 0) {
        playSfx("flip", { volume: 0.25, rate: 1 + (e.position + e.guessIndex) * 0.06 });
      } else if (e.kind === "muse") {
        playSfx("click", { volume: 0.4, rate: 1.3 });
      }
      setStep((s) => s + 1);
    }, delay);
    return () => clearTimeout(t);
  }, [step, trace, reduced]);

  // Shake retriggers on muse hits and the final tally, derived from the last event.
  const lastEvent = step > 0 && step <= trace.length ? trace[step - 1] : null;
  const shakeClass =
    !reduced && lastEvent && (lastEvent.kind === "muse" || lastEvent.kind === "final")
      ? step % 2 === 0
        ? "shake-a"
        : "shake-b"
      : "";

  const finished = step >= trace.length;
  const cleared = (state.total ?? 0) >= run.targetScore;

  // Auto-close a moment after finishing.
  useEffect(() => {
    if (!finished || doneRef.current) return;
    const t = window.setTimeout(() => {
      doneRef.current = true;
      onDone();
    }, reduced ? 400 : 1400);
    return () => clearTimeout(t);
  }, [finished, onDone, reduced]);

  const { round } = run;
  const gridWidth = round.wordLength * CELL + (round.wordLength - 1) * GAP;

  return (
    <div
      className={`playback ${shakeClass}`}
      onClick={() => {
        if (!finished) setStep(trace.length);
        else if (!doneRef.current) {
          doneRef.current = true;
          onDone();
        }
      }}
    >
      <div className="playback-grid" style={{ width: gridWidth, margin: "0 auto", position: "relative" }}>
        {round.guesses.map((guess, gi) => (
          <div key={gi} style={{ display: "flex", gap: GAP, marginBottom: GAP }}>
            {[...guess].map((letter, c) => {
              const popped = trace.some(
                (e, i) => i < step && e.kind === "tile" && e.guessIndex === gi && e.position === c && e.chips > 0,
              );
              return (
                <div key={c} className={popped ? "tile-pop" : undefined}>
                  <Tile letter={letter} result={round.results[gi][c]} size={CELL} />
                </div>
              );
            })}
          </div>
        ))}
        {state.floats.map((f) => (
          <span key={f.key} className={`float ${f.cls}`} style={{ left: f.x, top: f.y }}>
            {f.text}
          </span>
        ))}
      </div>

      {run.muses.length > 0 && (
        <div className="playback-muses">
          {run.muses.map((m) => {
            const def = getMuse(m.id);
            const pop = state.musePops.get(m.id);
            return (
              <div key={m.id} className={`playback-muse ${pop ? "muse-hit" : ""}`}>
                <ModifierCard
                  id={m.id}
                  name={def.name}
                  description={museDescription(m.id, m.level)}
                  rarity={def.rarity}
                  disabled={round.mutedMuse === m.id}
                />
                {pop && <span className="muse-float">{pop}</span>}
              </div>
            );
          })}
        </div>
      )}

      <div className="playback-tally">
        <span className="tally-chips">{state.chips}</span>
        <span className="tally-x">×</span>
        <span className="tally-mult">
          {Math.round(state.mult * state.times * 100) / 100}
        </span>
        {state.total !== null && (
          <span className={`tally-total ${cleared ? "cleared" : "missed"}`}>
            = {state.total}
          </span>
        )}
      </div>
      <p className="playback-target">
        Target {run.targetScore}
        {state.total !== null && (cleared ? " — cleared!" : " — missed")}
      </p>
      <p className="playback-hint">{finished ? "Click to continue" : "Click to skip"}</p>
    </div>
  );
}
