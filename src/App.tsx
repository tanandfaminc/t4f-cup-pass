import { BrowserRouter, Routes, Route } from 'react-router-dom';
import LandingPage from './features/cup-pass/pages/LandingPage';
import CreateGamePage from './features/cup-pass/pages/CreateGamePage';
import SeatOrderPage from './features/cup-pass/pages/SeatOrderPage';
import StartConfirmPage from './features/cup-pass/pages/StartConfirmPage';
import GamePage from './features/cup-pass/pages/GamePage';
import EndGamePage from './features/cup-pass/pages/EndGamePage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/create" element={<CreateGamePage />} />
        <Route path="/seat-order" element={<SeatOrderPage />} />
        <Route path="/start" element={<StartConfirmPage />} />
        <Route path="/game" element={<GamePage />} />
        <Route path="/end" element={<EndGamePage />} />
      </Routes>
    </BrowserRouter>
  );
}
