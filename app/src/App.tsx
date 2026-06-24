import { Route, Routes } from "react-router-dom";
import { NavBar } from "./components/NavBar";
import HomePage from "./routes/HomePage";
import AuthPage from "./features/auth/AuthPage";
import GamePage from "./features/game/GamePage";
import DailyPage from "./features/daily/DailyPage";
import LeaderboardPage from "./features/leaderboard/LeaderboardPage";
import RunsPage from "./features/runs/RunsPage";
import SharePage from "./features/runs/SharePage";

function App() {
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
        <Route path="/share/:id" element={<SharePage />} />
      </Routes>
    </>
  );
}

export default App;
