import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getMyRuns, type MyRun } from "../../lib/runs";

export default function RunsPage() {
  const [message, setMessage] = useState("Loading…");
  const [runs, setRuns] = useState<MyRun[]>([]);

  useEffect(() => {
    let active = true;
    (async () => {
      const { rows, error } = await getMyRuns();
      if (!active) return;
      setRuns(rows);
      setMessage(error ?? "");
    })();
    return () => {
      active = false;
    };
  }, []);

  return (
    <main style={{ padding: "2rem", maxWidth: 700, margin: "0 auto" }}>
      <h1 style={{ margin: 0, textAlign: "center" }}>My runs</h1>

      {message && <p style={{ textAlign: "center" }}>{message}</p>}

      {runs.length === 0 && !message ? (
        <p style={{ textAlign: "center" }}>No runs yet — go play one!</p>
      ) : (
        <div style={{ marginTop: "1.5rem", display: "grid", gap: "0.75rem" }}>
          {runs.map((run) => (
            <div
              key={run.id}
              style={{
                border: "1px solid #ddd",
                borderRadius: 8,
                padding: "0.75rem 1rem",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: "1rem",
              }}
            >
              <span style={{ textTransform: "capitalize" }}>{run.mode}</span>
              <strong>{run.score}</strong>
              <span style={{ color: "#888", fontSize: "0.85rem" }}>
                {new Date(run.created_at).toLocaleDateString()}
              </span>
              {run.is_shared ? (
                <Link to={`/share/${run.id}`}>shared ↗</Link>
              ) : (
                <span style={{ color: "#bbb", fontSize: "0.85rem" }}>private</span>
              )}
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
