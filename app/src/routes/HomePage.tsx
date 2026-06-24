import { Link } from "react-router-dom";

export default function HomePage() {
  return (
    <main
      style={{
        flex: 1,
        display: "grid",
        placeItems: "center",
        padding: "2rem",
      }}
    >
      <section style={{ width: "100%", maxWidth: 560, textAlign: "center" }}>
        <span
          style={{
            display: "inline-block",
            fontSize: "0.7rem",
            fontWeight: 700,
            letterSpacing: 1,
            color: "var(--accent)",
            border: "1px solid var(--accent-border)",
            borderRadius: 999,
            padding: "3px 10px",
            marginBottom: "1rem",
          }}
        >
          EARLY ACCESS · BETA
        </span>

        <h1 style={{ marginTop: 0, marginBottom: "0.75rem" }}>Word Card</h1>

        <p style={{ marginBottom: "2rem", lineHeight: 1.6 }}>
          A word game that mixes the simplicity of Wordle with the roguelike runs,
          stacking modifiers and escalating tension of Balatro.
        </p>

        <div style={{ display: "flex", justifyContent: "center", gap: "0.75rem", flexWrap: "wrap" }}>
          <Link to="/game">
            <button style={{ background: "var(--accent)", color: "#fff" }}>Play a run</button>
          </Link>
          <Link to="/daily">
            <button>Daily puzzle</button>
          </Link>
        </div>
      </section>
    </main>
  );
}
