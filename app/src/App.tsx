import { Route, Routes } from "react-router-dom";
import HomePage from "./routes/HomePage";
import AuthPage from "./features/auth/AuthPage";
import GamePage from "./features/game/GamePage";
import LeaderboardPage from "./features/leaderboard/LeaderboardPage";
import RunsPage from "./features/runs/RunsPage";

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/auth" element={<AuthPage />} />
      <Route path="/game" element={<GamePage />} />
      <Route path="/leaderboard" element={<LeaderboardPage />} />
      <Route path="/runs" element={<RunsPage />} />
    </Routes>
  );
}

export default App;
