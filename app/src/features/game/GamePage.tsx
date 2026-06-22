import { useState } from "react";
import { Link } from "react-router-dom";
import { useGame } from "./useGame";
import { FINAL_ANTE } from "./gameEngine";
import { getModifier } from "./modifiers";
import { saveRun, shareRun } from "../../lib/runs";
import type { LetterResult } from "../../lib/words";

const COLORS: Record<LetterResult, string> = {
  correct: "#6aaa64",
  present: "#c9b458",
  absent: "#787c7e",
};
const CELL = 46;

function Cell({ letter, result }: { letter: string; result?: LetterResult }) {
  const filled = result !== undefined;
  return (
    <div
      style={{
        width: CELL,
        height: CELL,
        display: "grid",
        placeItems: "center",
        fontSize: "1.4rem",
        fontWeight: 700,
        textTransform: "uppercase",
        color: filled ? "#fff" : "#1a1a1b",
        background: filled ? COLORS[result] : "transparent",
        border: `2px solid ${filled ? COLORS[result] : "#d3d6da"}`,
        borderRadius: 4,
      }}
    >
      {letter}
    </div>
  );
}

export default function GamePage() {
  const { run, startNewGame, playGuess, pickModifier } = useGame();
  const [input, setInput] = useState("");
  const [message, setMessage] = useState("");
  const [savedId, setSavedId] = useState<number | null>(null);

  const { round } = run;
  const len = 5;

  function handleSubmit() {
    if (run.status !== "playing") return;
    if (input.length !== len) {
      setMessage(`Word must be ${len} letters`);
      return;
    }
    playGuess(input);
    setInput("");
    setMessage("");
  }

  function handleNewRun() {
    startNewGame();
    setInput("");
    setMessage("");
    setSavedId(null);
  }

  async function handleSaveRun() {
    setMessage("");
    if (run.status === "playing" || run.status === "choosing") {
      setMessage("Finish the run before saving.");
      return;
    }
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

  // Build the round grid.
  const rows = [];
  for (let r = 0; r < round.attemptsAllowed; r++) {
    const submitted = round.results[r];
    const isCurrent = !submitted && r === round.guesses.length && run.status === "playing";
    const cells = [];
    for (let c = 0; c < len; c++) {
      if (submitted) cells.push(<Cell key={c} letter={round.guesses[r][c]} result={submitted[c]} />);
      else if (isCurrent) cells.push(<Cell key={c} letter={input[c] ?? ""} />);
      else cells.push(<Cell key={c} letter="" />);
    }
    rows.push(
      <div key={r} style={{ display: "flex", gap: 6 }}>
        {cells}
      </div>,
    );
  }

  return (
    <main style={{ padding: "1.5rem", maxWidth: 460, margin: "0 auto", textAlign: "center" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Link to="/">← Home</Link>
        <h1 style={{ margin: 0 }}>Run</h1>
        <span>❤️ {run.lives}</span>
      </div>

      {/* Stat bar */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-around",
          margin: "1rem 0",
          fontSize: "0.95rem",
        }}
      >
        <span>
          <strong>Ante</strong> {run.ante}/{FINAL_ANTE}
        </span>
        <span>
          <strong>Target</strong> {run.targetScore}
        </span>
        <span>
          <strong>Score</strong> {run.score}
        </span>
      </div>

      {/* Held modifiers */}
      {run.modifiers.length > 0 && (
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", justifyContent: "center", marginBottom: "1rem" }}>
          {run.modifiers.map((id) => (
            <span
              key={id}
              title={getModifier(id).description}
              style={{ background: "#eee", borderRadius: 12, padding: "2px 10px", fontSize: "0.8rem" }}
            >
              {getModifier(id).name}
            </span>
          ))}
        </div>
      )}

      <div style={{ display: "grid", gap: 6, justifyContent: "center", margin: "1rem 0" }}>{rows}</div>

      {run.status === "playing" && (
        <div style={{ display: "grid", gap: "0.75rem", maxWidth: 320, margin: "0 auto" }}>
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
      )}

      {run.status === "choosing" && (
        <div style={{ display: "grid", gap: "0.75rem", margin: "0 auto", maxWidth: 360 }}>
          <h2 style={{ margin: 0 }}>Ante cleared! Pick a modifier</h2>
          {run.offered.map((id) => {
            const m = getModifier(id);
            return (
              <button key={id} onClick={() => pickModifier(id)} style={{ padding: "0.6rem", textAlign: "left" }}>
                <strong>{m.name}</strong>
                <br />
                <span style={{ fontSize: "0.85rem" }}>{m.description}</span>
              </button>
            );
          })}
          <button onClick={() => pickModifier(null)} style={{ opacity: 0.7 }}>
            Skip
          </button>
        </div>
      )}

      {(run.status === "won" || run.status === "lost") && (
        <div style={{ display: "grid", gap: "0.75rem", maxWidth: 320, margin: "0 auto" }}>
          <h2 style={{ margin: 0 }}>
            {run.status === "won" ? "You beat the run! 🏆" : `Defeated — the word was “${round.answer.toUpperCase()}”`}
          </h2>
          <p style={{ margin: 0 }}>Final score: <strong>{run.score}</strong></p>
          {savedId === null ? (
            <button onClick={handleSaveRun}>Save run</button>
          ) : (
            <button onClick={handleShareRun}>Share run</button>
          )}
          <button onClick={handleNewRun}>New run</button>
        </div>
      )}

      {message && <p style={{ marginTop: "1rem", whiteSpace: "pre-wrap" }}>{message}</p>}
    </main>
  );
}
