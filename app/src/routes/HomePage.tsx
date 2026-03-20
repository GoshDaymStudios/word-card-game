import { Link } from "react-router-dom";

export default function HomePage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        padding: "2rem",
      }}
    >
      <section
        style={{
          width: "100%",
          maxWidth: "600px",
          textAlign: "center",
        }}
      >
        <h1 style={{ marginBottom: "1rem" }}>Word Card Game</h1>

        <p style={{ marginBottom: "2rem", lineHeight: "1.6" }}>
          A web-based word game with card-based modifiers and roguelike
          progression.
        </p>

        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: "1rem",
            flexWrap: "wrap",
          }}
        >
          <Link to="/game">
            <button>Start Game</button>
          </Link>

          <Link to="/auth">
            <button>Login</button>
          </Link>
        </div>
      </section>
    </main>
  );
}
