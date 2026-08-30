import { useEffect, useState } from "react";
import { useGame } from "./useGame";
import { FINAL_CHAPTER, activeRule } from "./gameEngine";
import { hasRule } from "./censors";
import { getCensor } from "./censors";
import { getMuse, museDescription } from "./muses";
import { saveRun, shareRun } from "../../lib/runs";
import { Tile } from "../../components/Tile";
import { ModifierCard } from "../../components/ModifierCard";
import { BlindSelect } from "./BlindSelect";
import { ShopView } from "./ShopView";
import { ConsumableSlots } from "./ConsumableSlots";
import { ensureMusic, stopMusic, playSfx, playFlipRow } from "../../lib/sound";
import type { LetterResult } from "../../lib/words";

const CELL = 46;

const BLIND_LABEL = { draft: "First Draft", faircopy: "Fair Copy", censor: "Censor" } as const;

function Lives({ count }: { count: number }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, color: "var(--text)" }}>
      <svg
        width="15"
        height="15"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M20.24 12.24a6 6 0 0 0-8.49-8.49L5 10.5V19h8.5z" />
        <line x1="16" y1="8" x2="2" y2="22" />
        <line x1="17.5" y1="15" x2="9" y2="15" />
      </svg>
      {count}
    </span>
  );
}

export default function GamePage() {
  const game = useGame();
  const { run } = game;
  const [input, setInput] = useState("");
  const [message, setMessage] = useState("");
  const [savedId, setSavedId] = useState<number | null>(null);

  // Music while playing; on game over wait for the flip cascade, then the sting.
  useEffect(() => {
    if (run.status === "won" || run.status === "lost") {
      const sting = run.status === "won" ? "win" : "lose";
      const t = window.setTimeout(() => {
        stopMusic();
        playSfx(sting, { volume: 0.7 });
      }, 750);
      return () => clearTimeout(t);
    }
    ensureMusic("roguelike");
  }, [run.status]);
  useEffect(() => () => stopMusic(), []);

  const { round } = run;
  const len = round.wordLength;
  const rule = activeRule(run);
  const censor = getCensor(run.bossId);
  const playing = run.status === "playing";

  function handleSubmit() {
    if (!playing) return;
    if (input.length !== len) {
      setMessage(`Word must be ${len} letters`);
      return;
    }
    if (!game.isGuessValid(input)) {
      setMessage(`“${input.toUpperCase()}” is not in the dictionary`);
      return;
    }
    playGuessWithSound();
  }

  function playGuessWithSound() {
    game.playGuess(input);
    playFlipRow(len);
    setInput("");
    setMessage("");
  }

  function handleNewRun() {
    game.startNewGame();
    setInput("");
    setMessage("");
    setSavedId(null);
  }

  async function handleSaveRun() {
    setMessage("");
    const { id, error } = await saveRun("roguelike", run.score, run);
    if (error) setMessage(error);
    else {
      setSavedId(id);
      setMessage("Run saved!");
    }
  }

  async function handleShareRun() {
    if (savedId === null) return;
    const { error } = await shareRun(savedId);
    if (error) {
      setMessage(error);
      return;
    }
    const link = `${window.location.origin}/share/${savedId}`;
    try {
      await navigator.clipboard.writeText(link);
      setMessage("Share link copied: " + link);
    } catch {
      setMessage("Shareable link: " + link);
    }
  }

  // Censor display rules (display only — truthful results stay in state).
  const maskPresent = playing && hasRule(rule, "mask-present");
  const delayedReveal = playing && hasRule(rule, "delayed-reveal");
  function displayResult(r: LetterResult): LetterResult {
    return maskPresent && r === "present" ? "absent" : r;
  }

  // Build the round grid.
  const rows = [];
  for (let r = 0; r < round.attemptsAllowed; r++) {
    const submitted = round.results[r];
    const isCurrent = !submitted && r === round.guesses.length && playing;
    const hideRow = delayedReveal && r === round.guesses.length - 1;
    const cells = [];
    for (let c = 0; c < len; c++) {
      if (submitted && !hideRow)
        cells.push(
          <Tile key={c} index={c} size={CELL} letter={round.guesses[r][c]} result={displayResult(submitted[c])} />,
        );
      else if (submitted && hideRow)
        cells.push(<Tile key={c} size={CELL} letter={round.guesses[r][c]} />);
      else if (isCurrent) cells.push(<Tile key={c} size={CELL} letter={input[c] ?? ""} />);
      else cells.push(<Tile key={c} size={CELL} letter="" />);
    }
    rows.push(
      <div key={r} style={{ display: "flex", gap: 6 }}>
        {cells}
      </div>,
    );
  }

  const lastCleared = run.history.length > 0 ? run.history[run.history.length - 1] : null;

  return (
    <main style={{ padding: "1.5rem", maxWidth: 560, margin: "0 auto", textAlign: "center" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1 style={{ margin: 0 }}>Manuscript</h1>
        <span style={{ display: "inline-flex", gap: 14, alignItems: "center" }}>
          <span style={{ color: "var(--gold, #c9a227)", fontWeight: 700 }}>{run.ink}⬤</span>
          <Lives count={run.lives} />
        </span>
      </div>

      {/* Stat bar */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-around",
          margin: "1rem 0",
          fontSize: "0.9rem",
          flexWrap: "wrap",
          gap: "0.4rem",
        }}
      >
        <span>
          <strong>Chapter</strong> {run.ante}/{FINAL_CHAPTER}
        </span>
        <span>
          <strong>{BLIND_LABEL[run.blind]}</strong>
        </span>
        <span>
          <strong>Target</strong> {run.targetScore}
        </span>
        <span>
          <strong>Total</strong> {run.score}
        </span>
      </div>

      {/* Muse row + vials */}
      {(run.muses.length > 0 || run.consumables.length > 0) && (
        <div
          style={{
            display: "flex",
            gap: 12,
            flexWrap: "wrap",
            justifyContent: "center",
            alignItems: "center",
            marginBottom: "1rem",
          }}
        >
          {run.muses.map((m, i) => {
            const def = getMuse(m.id);
            return (
              <ModifierCard
                key={`${m.id}-${i}`}
                id={m.id}
                name={def.name + (m.level > 1 ? ` (lv ${m.level})` : "")}
                description={museDescription(m.id, m.level)}
                rarity={def.rarity}
                disabled={playing && round.mutedMuse === m.id}
              />
            );
          })}
          <ConsumableSlots run={run} onUse={game.useInk} />
        </div>
      )}

      {run.status === "blind-select" && (
        <BlindSelect run={run} onPick={(l) => void game.beginBlind(l)} onSkip={game.skip} />
      )}

      {playing && (
        <>
          {rule && (
            <p style={{ margin: "0 0 0.6rem", fontSize: "0.85rem", color: "#c0392b", fontWeight: 600 }}>
              {censor.name}: {censor.description}
              {round.bannedLetter ? ` (struck letter: ${round.bannedLetter.toUpperCase()})` : ""}
            </p>
          )}
          {round.revealedLetters.length > 0 && (
            <p style={{ margin: "0 0 0.4rem", fontSize: "0.85rem" }}>
              Divined:{" "}
              {round.revealedLetters
                .map((rl) => `${rl.letter.toUpperCase()} in position ${rl.position + 1}`)
                .join(", ")}
            </p>
          )}
          {round.ruledOut.length > 0 && (
            <p style={{ margin: "0 0 0.4rem", fontSize: "0.8rem", opacity: 0.75 }}>
              Not in the word: {round.ruledOut.map((c) => c.toUpperCase()).join(" ")}
            </p>
          )}
          <div style={{ display: "grid", gap: 6, justifyContent: "center", margin: "1rem 0" }}>
            {rows}
          </div>
          <p style={{ margin: "0 0 0.6rem", fontSize: "0.85rem", opacity: 0.85 }}>
            Letters so far: <strong>{round.roundScore}</strong> · Target{" "}
            <strong>{run.targetScore}</strong>
          </p>
          <div style={{ display: "grid", gap: "0.75rem", maxWidth: 340, margin: "0 auto" }}>
            <input
              autoFocus
              value={input}
              maxLength={len}
              placeholder={`${len}-letter word`}
              onChange={(e) => setInput(e.target.value.replace(/[^a-zA-Z]/g, "").toLowerCase())}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              style={{ padding: "0.6rem", fontSize: "1.1rem", textAlign: "center", letterSpacing: 4 }}
            />
            <button onClick={handleSubmit}>Guess</button>
          </div>
        </>
      )}

      {run.status === "round-failed" && (
        <div style={{ display: "grid", gap: "0.75rem", maxWidth: 380, margin: "0 auto" }}>
          <h2 style={{ margin: 0, color: "#c0392b" }}>
            {run.shielded ? "Draft rejected" : "Draft rejected — a life lost"}
          </h2>
          <p style={{ margin: 0 }}>
            Scored <strong>{round.roundScore}</strong> / target <strong>{run.targetScore}</strong>.
            {" "}The word was “{round.answer.toUpperCase()}”.
          </p>
          <p style={{ margin: 0, display: "flex", gap: 6, justifyContent: "center" }}>
            <Lives count={run.lives} /> {run.lives === 1 ? "life" : "lives"} left
          </p>
          <button onClick={game.continueRound}>Rewrite it</button>
        </div>
      )}

      {run.status === "shop" && (
        <>
          {lastCleared && (
            <p style={{ margin: "0 0 0.75rem", fontWeight: 600 }}>
              Cleared with <span style={{ color: "var(--gold, #c9a227)" }}>{lastCleared.score}</span> — the
              Scriptorium is open.
            </p>
          )}
          <ShopView
            run={run}
            onBuy={game.buy}
            onSell={game.sell}
            onReroll={game.reroll}
            onLeave={game.leave}
          />
        </>
      )}

      {(run.status === "won" || run.status === "lost") && (
        <div style={{ display: "grid", gap: "0.75rem", maxWidth: 340, margin: "0 auto" }}>
          <h2 style={{ margin: 0 }}>
            {run.status === "won"
              ? "Published! 🏆"
              : `Rejected — the word was “${round.answer.toUpperCase()}”`}
          </h2>
          <p style={{ margin: 0 }}>
            Final score: <strong>{run.score}</strong> · Seed{" "}
            <code style={{ fontSize: "0.85rem" }}>{run.seed}</code>
          </p>
          {savedId === null ? (
            <button onClick={handleSaveRun}>Save run</button>
          ) : (
            <button onClick={handleShareRun}>Share run</button>
          )}
          <button onClick={handleNewRun}>New manuscript</button>
        </div>
      )}

      {run.status !== "won" && run.status !== "lost" && run.status !== "blind-select" && (
        <p style={{ marginTop: "1.25rem" }}>
          <button
            style={{ fontSize: "0.75rem", opacity: 0.6 }}
            onClick={() => {
              if (window.confirm("Abandon this manuscript? The run will be lost.")) handleNewRun();
            }}
          >
            Abandon manuscript
          </button>
        </p>
      )}

      {message && <p style={{ marginTop: "1rem", whiteSpace: "pre-wrap" }}>{message}</p>}
    </main>
  );
}
