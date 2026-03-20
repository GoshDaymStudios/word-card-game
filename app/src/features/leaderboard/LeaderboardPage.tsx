import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

type Run = {
  id: number;
  user_id: string;
  score: number;
  run_data: {
    rounds?: number;
    result?: string;
  };
  created_at: string;
};

export default function LeaderboardPage() {
  const [runs, setRuns] = useState<Run[]>([]);
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function loadLeaderboard() {
      const { data, error } = await supabase
        .from("runs")
        .select("*")
        .order("score", { ascending: false })
        .limit(10);

      if (error) {
        setMessage(error.message);
        return;
      }

      setRuns(data || []);
    }

    loadLeaderboard();
  }, []);

  return (
    <main style={{ padding: "2rem", maxWidth: "700px", margin: "0 auto" }}>
      <h1>Leaderboard</h1>

      {message && <p>{message}</p>}

      <div style={{ marginTop: "2rem", display: "grid", gap: "1rem" }}>
        {runs.length === 0 ? (
          <p>No runs yet.</p>
        ) : (
          runs.map((run, index) => (
            <div
              key={run.id}
              style={{
                border: "1px solid #ccc",
                borderRadius: "8px",
                padding: "1rem",
              }}
            >
              <p>
                <strong>Rank:</strong> {index + 1}
              </p>
              <p>
                <strong>Score:</strong> {run.score}
              </p>
              <p>
                <strong>Result:</strong> {run.run_data?.result ?? "unknown"}
              </p>
              <p>
                <strong>Rounds:</strong> {run.run_data?.rounds ?? "unknown"}
              </p>
              <p>
                <strong>Created:</strong>{" "}
                {new Date(run.created_at).toLocaleString()}
              </p>
            </div>
          ))
        )}
      </div>
    </main>
  );
}
