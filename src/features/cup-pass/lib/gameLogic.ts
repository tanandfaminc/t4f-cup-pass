import type { ActiveGame, GameContextState, HitEvent, PlayEvent, Player } from '../types';
import { SCORE_MAP } from './scoring';

export function initGame(players: Player[]): ActiveGame {
  const scores: Record<string, number> = {};
  for (const p of players) scores[p.id] = 0;
  return {
    scores,
    currentPlayerIndex: 0,
    inning: 1,
    history: [],
    isFinished: false,
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
  const nextIndex = (game.currentPlayerIndex + 1) % players.length;
  return {
    ...game,
    scores: { ...game.scores, [player.id]: game.scores[player.id] + delta },
    currentPlayerIndex: nextIndex,
    history: [...game.history, entry],
  };
}

export function nextInning(game: ActiveGame): ActiveGame {
  return { ...game, inning: game.inning + 1 };
}

export function endGame(game: ActiveGame): ActiveGame {
  return { ...game, isFinished: true };
}

/** Returns players sorted by score descending. */
export function rankPlayers(state: GameContextState): Array<Player & { score: number }> {
  if (!state.game) return [];
  return [...state.players]
    .map((p) => ({ ...p, score: state.game!.scores[p.id] ?? 0 }))
    .sort((a, b) => b.score - a.score);
}
