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
    history: [],
    isFinished: false,
    isPaused: false,
    rotationDirection: 'left',
    reverseEachInning: true,
  };
}

export function logEvent(
  game: ActiveGame,
  players: Player[],
  event: HitEvent,
): ActiveGame {
  const player = players[game.currentPlayerIndex];
  const delta = SCORE_MAP[event];
  const entry: PlayEvent = { playerId: player.id, event, delta, inning: game.inning };
  const step = dirStep(game.rotationDirection);
  const nextIndex = (game.currentPlayerIndex + step + players.length) % players.length;
  return {
    ...game,
    scores: { ...game.scores, [player.id]: game.scores[player.id] + delta },
    currentPlayerIndex: nextIndex,
    history: [...game.history, entry],
  };
}

export function undoLastEvent(game: ActiveGame): ActiveGame {
  if (game.history.length === 0) return game;
  const last = game.history[game.history.length - 1];
  const newHistory = game.history.slice(0, -1);
  // Reverse the step that was taken when the event was logged
  const step = dirStep(game.rotationDirection);
  const playerCount = Object.keys(game.scores).length;
  const prevIndex = (game.currentPlayerIndex - step + playerCount) % playerCount;
  return {
    ...game,
    scores: { ...game.scores, [last.playerId]: game.scores[last.playerId] - last.delta },
    currentPlayerIndex: prevIndex,
    history: newHistory,
  };
}

export function nextInning(game: ActiveGame): ActiveGame {
  const newDirection = game.reverseEachInning
    ? flipDirection(game.rotationDirection)
    : game.rotationDirection;
  return { ...game, inning: game.inning + 1, rotationDirection: newDirection };
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
