import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { GameProvider } from './features/cup-pass/lib/gameContext';
import RouteGuard from './features/cup-pass/lib/RouteGuard';
import BackendStatusBar from './features/cup-pass/lib/BackendStatusBar';
import LandingPage from './features/cup-pass/pages/LandingPage';
import CreateGamePage from './features/cup-pass/pages/CreateGamePage';
import SeatOrderPage from './features/cup-pass/pages/SeatOrderPage';
import StartConfirmPage from './features/cup-pass/pages/StartConfirmPage';
import GamePage from './features/cup-pass/pages/GamePage';
import EndGamePage from './features/cup-pass/pages/EndGamePage';
import JoinPage from './features/cup-pass/pages/JoinPage';
import PlayerGamePage from './features/cup-pass/pages/PlayerGamePage';

export default function App() {
  return (
    <GameProvider>
      <BrowserRouter>
        <BackendStatusBar />
        <RouteGuard>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/create" element={<CreateGamePage />} />
            <Route path="/seat-order" element={<SeatOrderPage />} />
            <Route path="/start" element={<StartConfirmPage />} />
            <Route path="/game" element={<GamePage />} />
            <Route path="/end" element={<EndGamePage />} />
            <Route path="/join" element={<JoinPage />} />
            <Route path="/join/:code" element={<JoinPage />} />
            <Route path="/play/:code" element={<PlayerGamePage />} />
          </Routes>
        </RouteGuard>
      </BrowserRouter>
    </GameProvider>
  );
}
