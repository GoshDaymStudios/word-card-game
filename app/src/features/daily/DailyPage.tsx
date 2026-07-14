import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useDaily } from "./useDaily";
import { saveRun } from "../../lib/runs";
import { Tile } from "../../components/Tile";
import { playFlipRow, playSfx } from "../../lib/sound";

// Daily streak — a stroke flame in the muted text color, matching the quill "lives" icon
// (gray/boring on Classic, light on dark skins).
function Streak({ count }: { count: number }) {
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
        <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
      </svg>
      {count}
    </span>
  );
}

export default function DailyPage() {
  const { state, streak, guess, reveal, shareText, score, dateKey } = useDaily();
  const [input, setInput] = useState("");
  const [toast, setToast] = useState("");
  const [saved, setSaved] = useState(false);

  const len = state.answer.length;
  const done = state.status !== "playing";

  // Win / lose sting, after the flip cascade of the final guess.
  useEffect(() => {
    if (state.status === "won" || state.status === "lost") {
      const sting = state.status === "won" ? "win" : "lose";
      const t = window.setTimeout(() => playSfx(sting, { volume: 0.7 }), 750);
      return () => clearTimeout(t);
    }
  }, [state.status]);

  function handleSubmit() {
    if (done) return;
    if (input.length !== len) {
      setToast(`Word must be ${len} letters`);
      return;
    }
    guess(input);
    playFlipRow(len);
    setInput("");
    setToast("");
  }

  async function handleShare() {
    try {
      await navigator.clipboard.writeText(shareText());
      setToast("Result copied to clipboard!");
    } catch {
      setToast("Could not copy — here it is:\n" + shareText());
    }
  }

  async function handleSave() {
    const { error } = await saveRun("daily", score, {
      date: dateKey,
      guesses: state.guesses,
      status: state.status,
    });
    if (error) setToast(error);
    else {
      setSaved(true);
      setToast("Saved to leaderboard!");
    }
  }

  // Build the grid: submitted rows, then the in-progress row, then empties.
  const rows = [];
  for (let r = 0; r < state.maxAttempts; r++) {
    const submitted = state.results[r];
    const isCurrent = !submitted && r === state.guesses.length && !done;
    const cells = [];
    for (let c = 0; c < len; c++) {
      if (submitted) {
        cells.push(<Tile key={c} index={c} letter={state.guesses[r][c]} result={submitted[c]} />);
      } else if (isCurrent) {
        cells.push(<Tile key={c} letter={input[c] ?? ""} />);
      } else {
        cells.push(<Tile key={c} letter="" />);
      }
    }
    rows.push(
      <div key={r} style={{ display: "flex", gap: 6 }}>
        {cells}
      </div>,
    );
  }

  return (
    <main style={{ padding: "2rem", maxWidth: 460, margin: "0 auto", textAlign: "center" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1 style={{ margin: 0 }}>Daily</h1>
        <Streak count={streak.streak} />
      </div>

      <div style={{ display: "grid", gap: 6, justifyContent: "center", margin: "1.5rem 0" }}>
        {rows}
      </div>

      {state.revealedIndex !== null && (
        <p style={{ color: "#6aaa64", fontWeight: 600 }}>
          Hint: letter {state.revealedIndex + 1} is “{state.answer[state.revealedIndex].toUpperCase()}”
        </p>
      )}

      {!done ? (
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
          <div style={{ display: "flex", gap: "0.5rem", justifyContent: "center" }}>
            <button onClick={handleSubmit}>Guess</button>
            <button onClick={reveal} disabled={state.powerUpUsed}>
              {state.powerUpUsed ? "Power-up used" : "Reveal a letter"}
            </button>
          </div>
        </div>
      ) : (
        <div style={{ display: "grid", gap: "0.75rem", maxWidth: 320, margin: "0 auto" }}>
          <h2 style={{ margin: 0 }}>
            {state.status === "won" ? "Solved! 🎉" : `The word was “${state.answer.toUpperCase()}”`}
          </h2>
          <button onClick={handleShare}>Share result</button>
          {state.status === "won" && (
            <button onClick={handleSave} disabled={saved}>
              {saved ? "Saved ✓" : `Save to leaderboard (${score})`}
            </button>
          )}
          <Link to="/leaderboard">View leaderboard →</Link>
        </div>
      )}

      {toast && <p style={{ whiteSpace: "pre-wrap", marginTop: "1rem" }}>{toast}</p>}
    </main>
  );
}
