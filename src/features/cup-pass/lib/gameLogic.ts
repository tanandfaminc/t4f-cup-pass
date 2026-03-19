import type { ActiveGame, GameContextState, HitEvent, PlayEvent, Player, RotationDirection } from '../types';
import { SCORE_MAP } from './scoring';

/** Flip rotation direction */
export function flipDirection(dir: RotationDirection): RotationDirection {
  return dir === 'left' ? 'right' : 'left';
}

/** Get the step (+1 or -1) for a given direction */
function dirStep(dir: RotationDirection): 1 | -1 {
  return dir === 'left' ? 1 : -1;
}

export function initGame(players: Player[], startingScore = 0): ActiveGame {
  const scores: Record<string, number> = {};
  for (const p of players) scores[p.id] = startingScore;
  return {
    scores,
    currentPlayerIndex: 0,
    inning: 1,
    inningHalf: 'top',
    history: [],
    isFinished: false,
    isPaused: false,
    rotationDirection: 'left',
    reverseEachInning: true,
  };
}

/**
 * Returns true if the event counts as an out for half-inning advancement.
 * Centralised so adding new out types only requires changing this one function.
 */
export function isOut(event: HitEvent): boolean {
  return event === 'out' || event === 'strikeout' || event === 'sacrifice';
}

/**
 * Count outs recorded in the current half-inning.
 * Derived from history — no separate out counter is needed.
 */
export function outsInCurrentHalf(game: ActiveGame): number {
  return game.history.filter(
    (e) => e.inning === game.inning && e.inningHalf === game.inningHalf && isOut(e.event),
  ).length;
}

export function logEvent(
  game: ActiveGame,
  players: Player[],
  event: HitEvent,
): ActiveGame {
  const player = players[game.currentPlayerIndex];
  const delta = SCORE_MAP[event];
  const entry: PlayEvent = {
    playerId: player.id,
    event,
    delta,
    inning: game.inning,
    inningHalf: game.inningHalf,
  };
  const step = dirStep(game.rotationDirection);
  const nextIndex = (game.currentPlayerIndex + step + players.length) % players.length;
  const updated: ActiveGame = {
    ...game,
    scores: { ...game.scores, [player.id]: game.scores[player.id] + delta },
    currentPlayerIndex: nextIndex,
    history: [...game.history, entry],
  };
  // Auto-advance to the next half-inning when the 3rd out is reached.
  // The play event is recorded with the current inning/half before the advance,
  // so undo (which restores inning from the last event) works correctly for free.
  if (isOut(event) && outsInCurrentHalf(updated) >= 3) {
    return nextInning(updated);
  }
  return updated;
}

/**
 * Derive the rotation direction for a given inning number.
 * Direction starts 'left' at inning 1 and flips each time the inning increments.
 */
export function deriveRotationDirection(inning: number, reverseEachInning: boolean): RotationDirection {
  if (!reverseEachInning) return 'left';
  return (inning - 1) % 2 === 0 ? 'left' : 'right';
}

export function undoLastEvent(game: ActiveGame): ActiveGame {
  if (game.history.length === 0) return game;
  const last = game.history[game.history.length - 1];
  const newHistory = game.history.slice(0, -1);
  // Reverse the step that was taken when the event was logged
  const step = dirStep(game.rotationDirection);
  const playerCount = Object.keys(game.scores).length;
  const prevIndex = (game.currentPlayerIndex - step + playerCount) % playerCount;

  // Restore inning/half from the last remaining event, or default to Top 1
  const prevEvent = newHistory.length > 0 ? newHistory[newHistory.length - 1] : null;
  const restoredInning = prevEvent ? prevEvent.inning : 1;
  const restoredHalf = prevEvent ? prevEvent.inningHalf : 'top';
  const restoredDirection = deriveRotationDirection(restoredInning, game.reverseEachInning);

  return {
    ...game,
    scores: { ...game.scores, [last.playerId]: game.scores[last.playerId] - last.delta },
    currentPlayerIndex: prevIndex,
    history: newHistory,
    inning: restoredInning,
    inningHalf: restoredHalf,
    rotationDirection: restoredDirection,
  };
}

/**
 * Advance to the next half-inning.
 * Top N → Bottom N (same inning number, direction unchanged).
 * Bottom N → Top N+1 (inning increments, direction flips if reverseEachInning).
 */
export function nextInning(game: ActiveGame): ActiveGame {
  if (game.inningHalf === 'top') {
    return { ...game, inningHalf: 'bottom' };
  }
  const newInning = game.inning + 1;
  const newDirection = game.reverseEachInning
    ? flipDirection(game.rotationDirection)
    : game.rotationDirection;
  return { ...game, inning: newInning, inningHalf: 'top', rotationDirection: newDirection };
}

/**
 * Revert to the previous half-inning (inverse of nextInning).
 * Bottom N → Top N (same inning number, direction unchanged).
 * Top N → Bottom N-1 (inning decrements, direction flips if reverseEachInning).
 * Returns the game unchanged if already at Top 1 (nowhere to go back).
 */
export function prevInning(game: ActiveGame): ActiveGame {
  if (game.inningHalf === 'bottom') {
    return { ...game, inningHalf: 'top' };
  }
  if (game.inning <= 1) return game; // Already at Top 1
  const newInning = game.inning - 1;
  const newDirection = game.reverseEachInning
    ? flipDirection(game.rotationDirection)
    : game.rotationDirection;
  return { ...game, inning: newInning, inningHalf: 'bottom', rotationDirection: newDirection };
}

/**
 * Count the plays recorded in the current half-inning.
 * Used to determine whether it is safe to revert inning advancement.
 */
export function playsInCurrentHalf(game: ActiveGame): number {
  return game.history.filter(
    (e) => e.inning === game.inning && e.inningHalf === game.inningHalf,
  ).length;
}

export function endGame(game: ActiveGame): ActiveGame {
  return { ...game, isFinished: true, isPaused: false };
}

/** Returns players sorted by score descending. */
export function rankPlayers(state: GameContextState): Array<Player & { score: number }> {
  if (!state.game) return [];
  return [...state.players]
    .map((p) => ({ ...p, score: state.game!.scores[p.id] ?? 0 }))
    .sort((a, b) => b.score - a.score);
}
