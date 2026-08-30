import { MAX_CONSUMABLES } from "./gameEngine";
import { getInk } from "./inks";
import type { RunState } from "./types";
import "./ConsumableSlots.css";

// The two ink-vial slots. Click a vial to use it (mid-round for round-only vials).
export function ConsumableSlots({ run, onUse }: { run: RunState; onUse: (slot: number) => void }) {
  const slots = Array.from({ length: MAX_CONSUMABLES }, (_, i) => run.consumables[i] ?? null);
  const canUseHere = run.status === "playing" || run.status === "shop";
  return (
    <div className="vials">
      {slots.map((id, i) => {
        if (!id) {
          return <div key={i} className="vial empty" title="Empty vial slot" />;
        }
        const def = getInk(id);
        const usable = canUseHere && (def.usable === "anywhere" || run.status === "playing");
        return (
          <button
            key={i}
            className={`vial ${usable ? "" : "locked"}`}
            title={`${def.name} — ${def.description}${usable ? "" : " (usable during a round)"}`}
            onClick={() => usable && onUse(i)}
          >
            <span className="vial-glyph">⚱</span>
            <span className="vial-name">{def.name}</span>
          </button>
        );
      })}
    </div>
  );
}
