import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

type Run = {
  id: number;
  score: number;
  run_data: {
    rounds?: number;
    result?: string;
    test?: boolean;
  };
  is_shared: boolean;
  created_at: string;
};

export default function RunsPage() {
  const [message, setMessage] = useState("");
  const [runs, setRuns] = useState<Run[]>([]);

  async function loadRuns() {
    setMessage("");

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      setMessage("You must be logged in.");
      setRuns([]);
      return;
    }

    const { data, error } = await supabase
      .from("runs")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      setMessage(error.message);
      return;
    }

    setRuns(data || []);
  }

  async function handleSaveTestRun() {
    setMessage("");

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      setMessage("You must be logged in.");
      return;
    }

    const { error } = await supabase.from("runs").insert({
      user_id: user.id,
      score: 123,
      run_data: {
        rounds: 5,
        result: "win",
        test: true,
      },
      is_shared: true, // Set to true for testing purposes
    });

    if (error) {
      setMessage(error.message);
      return;
    }

    setMessage("Test run saved.");
    loadRuns();
  }

  useEffect(() => {
    loadRuns();
  }, []);

  return (
    <main style={{ padding: "2rem", maxWidth: "700px", margin: "0 auto" }}>
      <h1>Runs</h1>

      <button onClick={handleSaveTestRun}>Save test run</button>

      {message && <p>{message}</p>}

      <div style={{ marginTop: "2rem", display: "grid", gap: "1rem" }}>
        {runs.length === 0 ? (
          <p>No runs yet.</p>
        ) : (
          runs.map((run) => (
            <div
              key={run.id}
              style={{
                border: "1px solid #ccc",
                borderRadius: "8px",
                padding: "1rem",
              }}
            >
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
                <strong>Shared:</strong> {run.is_shared ? "Yes" : "No"}
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
