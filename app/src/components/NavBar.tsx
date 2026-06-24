import { Link, NavLink } from "react-router-dom";
import "./NavBar.css";

const LINKS = [
  { to: "/daily", label: "Daily" },
  { to: "/game", label: "Play" },
  { to: "/leaderboard", label: "Leaderboard" },
  { to: "/auth", label: "Account" },
];

// Slim global navigation, shown on every page.
export function NavBar() {
  return (
    <header className="nav">
      <Link to="/" className="nav-brand">
        Word Card <span className="nav-beta">BETA</span>
      </Link>
      <nav className="nav-links">
        {LINKS.map((l) => (
          <NavLink
            key={l.to}
            to={l.to}
            className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}
          >
            {l.label}
          </NavLink>
        ))}
      </nav>
    </header>
  );
}
