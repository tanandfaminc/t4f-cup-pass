export type HitEvent =
  | 'single'
  | 'double'
  | 'triple'
  | 'home_run'
  | 'walk'
  | 'hit_by_pitch'
  | 'out'
  | 'strikeout'
  | 'error'
  | 'sacrifice';

export interface Player {
  id: string;
  name: string;
  seat: string;
}

export interface GameState {
  id: string;
  players: Player[];
  scores: Record<string, number>; // playerId -> score
  currentPlayerIndex: number;
  inning: number;
  isActive: boolean;
}
