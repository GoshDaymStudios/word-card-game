import { useState } from "react";
import { useGame } from "./useGame";
import { supabase } from "../../lib/supabase";

export default function GamePage() {
  const { run, startNewGame, playGuess } = useGame();
  const [guess, setGuess] = useState("");
  const [message, setMessage] = useState("");

  function handleSubmit() {
    if (!guess.trim() || run.status !== "playing") {
      return;
    }

    playGuess(guess.trim());
    setGuess("");
  }

  async function handleSaveRun() {
    setMessage("");

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      setMessage("You must be logged in.");
      return;
    }

    if (run.status === "playing") {
      setMessage("Finish the run before saving.");
      return;
    }

    const { error } = await supabase.from("runs").insert({
      user_id: user.id,
      score: run.score,
      run_data: {
        round: run.round,
        guesses: run.guesses,
        status: run.status,
      },
      is_shared: false,
    });

    if (error) {
      setMessage(error.message);
      return;
    }

    setMessage("Run saved.");
  }

  return (
    <main style={{ padding: "2rem", maxWidth: "700px", margin: "0 auto" }}>
      <h1>Game</h1>

      <div style={{ display: "grid", gap: "0.75rem", marginBottom: "1.5rem" }}>
        <p>
          <strong>Round:</strong> {run.round}
        </p>
        <p>
          <strong>Score:</strong> {run.score}
        </p>
        <p>
          <strong>Status:</strong> {run.status}
        </p>
      </div>

      <div
        style={{
          display: "flex",
          gap: "0.75rem",
          marginBottom: "1.5rem",
          flexWrap: "wrap",
        }}
      >
        <input
          type="text"
          placeholder="Enter guess"
          value={guess}
          onChange={(e) => setGuess(e.target.value)}
        />
        <button onClick={handleSubmit}>Submit guess</button>
        <button onClick={startNewGame}>New game</button>
        <button onClick={handleSaveRun}>Save run</button>
      </div>

      {message && <p>{message}</p>}

      <section>
        <h2>Guesses</h2>
        {run.guesses.length === 0 ? (
          <p>No guesses yet.</p>
        ) : (
          <ul>
            {run.guesses.map((item, index) => (
              <li key={`${item}-${index}`}>{item}</li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
