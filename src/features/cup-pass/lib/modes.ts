import type { GameModeId } from '../types';

export interface GameMode {
  id: GameModeId;
  name: string;
  /** Short description shown to host during setup */
  description: string;
  /** Coins / points each player starts with */
  startingScore: number;
  /** Singular unit label, e.g. "coin" or "point" */
  scoreUnit: string;
  /** Plural unit label, e.g. "coins" or "points" */
  scoreUnitPlural: string;
}

export const MODES: Record<GameModeId, GameMode> = {
  cup_pass: {
    id: 'cup_pass',
    name: 'Cup Pass',
    description: 'The classic cup-passing game. Score points based on at-bat outcomes.',
    startingScore: 0,
    scoreUnit: 'point',
    scoreUnitPlural: 'points',
  },
  cup_classic: {
    id: 'cup_classic',
    name: 'Cup Classic',
    description:
      'A virtual coin mode inspired by the original cup game. No cash, just bragging rights.',
    startingScore: 10,
    scoreUnit: 'coin',
    scoreUnitPlural: 'coins',
  },
};

export const DEFAULT_MODE: GameModeId = 'cup_pass';

export function getMode(id: GameModeId | undefined): GameMode {
  return MODES[id ?? DEFAULT_MODE];
}
