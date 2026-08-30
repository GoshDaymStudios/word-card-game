import { useEffect, useState } from "react";
import { ModifierCard } from "../../components/ModifierCard";
import { ALL_MUSE_IDS, MUSES, museDescription } from "../game/muses";
import { ALL_INK_IDS, INKS } from "../game/inks";
import { ALL_CENSOR_IDS, CENSORS } from "../game/censors";
import {
  ACHIEVEMENTS,
  ALL_ACHIEVEMENT_IDS,
  MUSE_UNLOCKS,
  loadProgress,
  syncProgress,
  unlockedMuses,
  type ProgressData,
} from "../../lib/progress";
import "./CollectionPage.css";

const GRADE_NAMES = ["Charcoal", "Sepia", "Crimson", "Violet", "Gold"];

// The Collection: every muse, ink and censor in the game, with locked entries shown
// as silhouettes plus the achievement that opens them. Also lifetime achievements
// and stats. Progress is localStorage-first, merged with Supabase when logged in.
export default function CollectionPage() {
  const [progress, setProgress] = useState<ProgressData>(() => loadProgress());

  useEffect(() => {
    let live = true;
    void syncProgress().then((merged) => {
      if (live) setProgress(merged);
    });
    return () => {
      live = false;
    };
  }, []);

  const unlocked = new Set(unlockedMuses(progress));
  const earned = (id: string) =>
    progress.achievements[id as keyof typeof progress.achievements] !== undefined;

  return (
    <main className="collection">
      <h1>Collection</h1>

      <section>
        <h2>
          Muses{" "}
          <span className="collection-count">
            {unlocked.size}/{ALL_MUSE_IDS.length}
          </span>
        </h2>
        <div className="collection-grid">
          {ALL_MUSE_IDS.map((id) => {
            const def = MUSES[id];
            const open = unlocked.has(id);
            const gate = MUSE_UNLOCKS[id];
            return (
              <div key={id} className={`collection-item ${open ? "" : "locked"}`}>
                <ModifierCard
                  id={open ? id : `locked-${id}`}
                  name={open ? def.name : "???"}
                  description={open ? museDescription(id) : "Locked"}
                  size="md"
                  rarity={open ? def.rarity : undefined}
                  disabled={!open}
                />
                <strong>{open ? def.name : "???"}</strong>
                <span className="collection-desc">
                  {open
                    ? museDescription(id)
                    : gate
                      ? `Locked — ${ACHIEVEMENTS[gate].description}`
                      : "Locked"}
                </span>
              </div>
            );
          })}
        </div>
      </section>

      <section>
        <h2>Inks</h2>
        <div className="collection-grid">
          {ALL_INK_IDS.map((id) => (
            <div key={id} className="collection-item">
              <div className="collection-vial">⚱</div>
              <strong>{INKS[id].name}</strong>
              <span className="collection-desc">{INKS[id].description}</span>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2>Censors</h2>
        <div className="collection-grid">
          {ALL_CENSOR_IDS.map((id) => (
            <div key={id} className="collection-item censor">
              <strong>{CENSORS[id].name}</strong>
              <span className="collection-desc">{CENSORS[id].description}</span>
              {CENSORS[id].flavor && <em className="collection-flavor">“{CENSORS[id].flavor}”</em>}
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2>
          Achievements{" "}
          <span className="collection-count">
            {ALL_ACHIEVEMENT_IDS.filter(earned).length}/{ALL_ACHIEVEMENT_IDS.length}
          </span>
        </h2>
        <ul className="collection-achievements">
          {ALL_ACHIEVEMENT_IDS.map((id) => {
            const a = ACHIEVEMENTS[id];
            const got = earned(id);
            return (
              <li key={id} className={got ? "earned" : ""}>
                <strong>
                  {got ? "🏅" : "🔒"} {a.name}
                </strong>{" "}
                — {a.description}
              </li>
            );
          })}
        </ul>
      </section>

      <section>
        <h2>Stats</h2>
        <p className="collection-stats">
          Manuscripts started: <strong>{progress.stats.runsStarted}</strong> · Published:{" "}
          <strong>{progress.stats.runsWon}</strong> · Best score:{" "}
          <strong>{progress.stats.bestScore}</strong> · Words solved:{" "}
          <strong>{progress.stats.wordsSolved}</strong>
          <br />
          Highest Ink Grade won:{" "}
          <strong>
            {progress.stakeCleared > 0 ? GRADE_NAMES[progress.stakeCleared - 1] : "—"}
          </strong>
        </p>
      </section>
    </main>
  );
}
