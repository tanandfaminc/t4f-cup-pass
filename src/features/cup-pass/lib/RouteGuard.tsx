import { Navigate, useLocation } from 'react-router-dom';
import { useGame } from './gameContext';
import type { ReactNode } from 'react';

/**
 * Route guard that ensures users cannot access screens out of order.
 * Also handles recovery: redirects to /game or /end when state exists.
 */
export default function RouteGuard({ children }: { children: ReactNode }) {
  const { state } = useGame();
  const { pathname } = useLocation();

  const hasPlayers = state.players.length >= 2;
  const hasActiveGame = state.game !== null && !state.game.isFinished;
  const hasFinishedGame = state.game !== null && state.game.isFinished;

  // Recovery: if an active game exists, redirect setup screens to /game
  if (hasActiveGame && ['/', '/create', '/seat-order', '/start'].includes(pathname)) {
    return <Navigate to="/game" replace />;
  }

  // Recovery: if a finished game exists and we're on a setup screen, go to /end
  if (hasFinishedGame && ['/', '/create', '/seat-order', '/start'].includes(pathname)) {
    return <Navigate to="/end" replace />;
  }

  // Guard: /seat-order requires game info to have been set (or at least visited /create)
  // Since game info is optional, we allow access if we've been through the flow.
  // We check that user came from /create by checking if gameName/teamName is set or
  // that they've dispatched SET_GAME_INFO (even with empty strings).
  // For simplicity: /seat-order is always accessible from /create flow.

  // Guard: /start requires players
  if (pathname === '/start' && !hasPlayers) {
    return <Navigate to="/seat-order" replace />;
  }

  // Guard: /game requires an active (non-finished) game
  if (pathname === '/game' && !hasActiveGame) {
    if (hasFinishedGame) return <Navigate to="/end" replace />;
    return <Navigate to="/" replace />;
  }

  // Guard: /end requires a finished game
  if (pathname === '/end' && !hasFinishedGame) {
    if (hasActiveGame) return <Navigate to="/game" replace />;
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
