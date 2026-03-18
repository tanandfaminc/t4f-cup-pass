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

export interface PlayEvent {
  playerId: string;
  event: HitEvent;
  delta: number;
  inning: number;
}

export interface ActiveGame {
  scores: Record<string, number>; // playerId -> score
  currentPlayerIndex: number;
  inning: number;
  history: PlayEvent[];
  isFinished: boolean;
}

export interface GameContextState {
  gameName: string;
  teamName: string;
  players: Player[];
  game: ActiveGame | null;
}
