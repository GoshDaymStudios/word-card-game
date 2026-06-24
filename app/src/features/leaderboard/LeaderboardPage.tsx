import { useEffect, useState } from "react";
import { getLeaderboard, type GameMode, type LeaderboardRow } from "../../lib/runs";

export default function LeaderboardPage() {
  const [mode, setMode] = useState<GameMode>("roguelike");
  const [rows, setRows] = useState<LeaderboardRow[]>([]);
  const [message, setMessage] = useState("Loading…");

  useEffect(() => {
    let active = true;
    getLeaderboard(mode).then(({ rows, error }) => {
      if (!active) return;
      setMessage(error ?? "");
      setRows(rows);
    });
    return () => {
      active = false;
    };
  }, [mode]);

  const tab = (m: GameMode, label: string) => (
    <button
      onClick={() => setMode(m)}
      style={{
        fontWeight: mode === m ? 700 : 400,
        textDecoration: mode === m ? "underline" : "none",
      }}
    >
      {label}
    </button>
  );

  return (
    <main style={{ padding: "2rem", maxWidth: 700, margin: "0 auto" }}>
      <h1 style={{ margin: 0, textAlign: "center" }}>Leaderboard</h1>

      <div style={{ display: "flex", gap: "1rem", justifyContent: "center", margin: "1rem 0" }}>
        {tab("roguelike", "Roguelike")}
        {tab("daily", "Daily")}
      </div>

      {message && <p style={{ textAlign: "center" }}>{message}</p>}

      {rows.length === 0 && !message ? (
        <p style={{ textAlign: "center" }}>No runs yet — be the first!</p>
      ) : (
        <ol style={{ display: "grid", gap: "0.5rem", paddingLeft: "1.5rem" }}>
          {rows.map((r) => (
            <li key={r.id}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  borderBottom: "1px solid #eee",
                  padding: "0.4rem 0",
                }}
              >
                <span>{r.username ?? "anon"}</span>
                <strong>{r.score}</strong>
                <span style={{ color: "#888", fontSize: "0.85rem" }}>
                  {new Date(r.created_at).toLocaleDateString()}
                </span>
              </div>
            </li>
          ))}
        </ol>
      )}
    </main>
  );
}
