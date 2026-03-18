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
  /** Supabase cup_players.id — set after persisted */
  dbId?: string;
  /** Supabase cup_game_players.id — set after game player row created */
  gamePlayerId?: string;
}

export interface PlayEvent {
  playerId: string;
  event: HitEvent;
  delta: number;
  inning: number;
  /** Supabase cup_game_events.id — set after persisted */
  dbId?: string;
}

export interface ActiveGame {
  scores: Record<string, number>; // playerId -> score
  currentPlayerIndex: number;
  inning: number;
  history: PlayEvent[];
  isFinished: boolean;
  isPaused: boolean;
}

export interface GameContextState {
  gameName: string;
  teamName: string;
  players: Player[];
  game: ActiveGame | null;
  /** Supabase cup_games.id — set after game is created in DB */
  dbGameId?: string;
  /** Short public code for sharing */
  publicCode?: string;
}

/** Backend sync status exposed to UI */
export type BackendStatus = 'idle' | 'loading' | 'saving' | 'error';
