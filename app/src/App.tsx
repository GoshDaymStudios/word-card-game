import { useEffect } from "react";
import { Route, Routes } from "react-router-dom";
import { NavBar } from "./components/NavBar";
import { playSfx } from "./lib/sound";
import HomePage from "./routes/HomePage";
import AuthPage from "./features/auth/AuthPage";
import GamePage from "./features/game/GamePage";
import DailyPage from "./features/daily/DailyPage";
import LeaderboardPage from "./features/leaderboard/LeaderboardPage";
import RunsPage from "./features/runs/RunsPage";
import SharePage from "./features/runs/SharePage";
import CollectionPage from "./features/collection/CollectionPage";

function App() {
  // A click sound on any button press (synth fallback if no click.mp3 is added).
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if ((e.target as HTMLElement).closest("button")) playSfx("click");
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  return (
    <>
      <NavBar />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/daily" element={<DailyPage />} />
        <Route path="/game" element={<GamePage />} />
        <Route path="/leaderboard" element={<LeaderboardPage />} />
        <Route path="/runs" element={<RunsPage />} />
        <Route path="/collection" element={<CollectionPage />} />
        <Route path="/share/:id" element={<SharePage />} />
      </Routes>
    </>
  );
}

export default App;
