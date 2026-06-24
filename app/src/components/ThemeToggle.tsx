import { useEffect, useState } from "react";
import "./ThemeToggle.css";

const THEMES = [
  { id: "twilight", label: "Twilight" },
  { id: "ember", label: "Ember" },
  { id: "deepsea", label: "Deep Sea" },
];

function initialTheme(): string {
  if (typeof localStorage === "undefined") return "twilight";
  return localStorage.getItem("theme") ?? "twilight";
}

// Palette switcher. Sets <html data-theme="..."> (CSS handles the rest) and
// remembers the choice in localStorage.
export function ThemeToggle() {
  const [theme, setTheme] = useState(initialTheme);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem("theme", theme);
  }, [theme]);

  return (
    <select
      className="theme-select"
      value={theme}
      onChange={(e) => setTheme(e.target.value)}
      aria-label="Color theme"
      title="Color theme"
    >
      {THEMES.map((t) => (
        <option key={t.id} value={t.id}>
          🎨 {t.label}
        </option>
      ))}
    </select>
  );
}
