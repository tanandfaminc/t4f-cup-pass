import type { GameContextState } from '../types';

const STORAGE_KEY = 't4f-cup-pass-state';

export function saveState(state: GameContextState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Storage full or unavailable — silently ignore
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
