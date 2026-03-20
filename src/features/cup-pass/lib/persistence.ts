import type { GameContextState } from '../types';

const STORAGE_KEY = 't4f-cup-pass-state';
const LEFT_GAME_KEY = 't4f-cup-pass-left-game';

export function saveState(state: GameContextState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Storage full or unavailable — silently ignore
  }
}

/**
 * Record the public code of a game the user explicitly left.
 * Prevents RouteGuard / realtime from auto-resuming that game.
 */
export function markGameLeft(publicCode: string): void {
  try {
    localStorage.setItem(LEFT_GAME_KEY, publicCode);
  } catch {
    // ignore
  }
}

/**
 * Returns the public code of the last explicitly-left game, or null.
 */
export function getLeftGameCode(): string | null {
  try {
    return localStorage.getItem(LEFT_GAME_KEY);
  } catch {
    return null;
  }
}

/**
 * Clear the left-game marker (called when user intentionally joins/creates a new game).
 */
export function clearLeftGameCode(): void {
  try {
    localStorage.removeItem(LEFT_GAME_KEY);
  } catch {
    // ignore
  }
}

export function loadState(): GameContextState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as GameContextState;
    // Ensure role defaults for states saved before Milestone 4
    if (!parsed.role) parsed.role = 'host';
    // Ensure rotation defaults for states saved before direction feature
    if (parsed.game && !parsed.game.rotationDirection) {
      parsed.game.rotationDirection = 'left';
      parsed.game.reverseEachInning = true;
    }
    // Ensure inningHalf defaults for states saved before half-inning feature
    if (parsed.game && !parsed.game.inningHalf) {
      parsed.game.inningHalf = 'top';
    }
    if (parsed.game?.history) {
      parsed.game.history = parsed.game.history.map((ev) =>
        ev.inningHalf ? ev : { ...ev, inningHalf: 'top' as const },
      );
    }
    return parsed;
  } catch {
    return null;
  }
}

export function clearState(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}
