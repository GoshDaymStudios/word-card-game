import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getSharedRun, type SharedRun } from "../../lib/runs";

// Public, read-only view of a single shared run (no auth needed).
export default function SharePage() {
  const { id } = useParams<{ id: string }>();
  const numId = Number(id);
  const validId = id !== undefined && Number.isFinite(numId);
  const [run, setRun] = useState<SharedRun | null>(null);
  const [message, setMessage] = useState("Loading…");

  useEffect(() => {
    if (!validId) return;
    let active = true;
    getSharedRun(numId).then(({ run, error }) => {
      if (!active) return;
      setRun(run);
      setMessage(error ?? "");
    });
    return () => {
      active = false;
    };
  }, [validId, numId]);

  return (
    <main style={{ padding: "2rem", maxWidth: 520, margin: "0 auto", textAlign: "center" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Link to="/">← Home</Link>
        <h1 style={{ margin: 0 }}>Shared run</h1>
        <span />
      </div>

      {!run ? (
        <p style={{ marginTop: "2rem" }}>{!validId ? "Invalid run id." : message}</p>
      ) : (
        <section style={{ marginTop: "2rem", display: "grid", gap: "0.6rem" }}>
          <p style={{ fontSize: "1.1rem" }}>
            <strong>{run.username ?? "anon"}</strong> played{" "}
            <strong>{run.mode === "daily" ? "Daily" : "a Roguelike run"}</strong>
          </p>
          <p style={{ fontSize: "2rem", margin: 0 }}>🏆 {run.score}</p>
          <p style={{ color: "#888" }}>{new Date(run.created_at).toLocaleString()}</p>
          <div style={{ marginTop: "1rem", display: "flex", gap: "1rem", justifyContent: "center" }}>
            <Link to="/game">
              <button>Try a run</button>
            </Link>
            <Link to="/leaderboard">
              <button>Leaderboard</button>
            </Link>
          </div>
        </section>
      )}
    </main>
  );
}
