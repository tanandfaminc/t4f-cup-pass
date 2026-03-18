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

/** Direction the cup passes */
export type RotationDirection = 'left' | 'right';

export interface ActiveGame {
  scores: Record<string, number>; // playerId -> score
  currentPlayerIndex: number;
  inning: number;
  history: PlayEvent[];
  isFinished: boolean;
  isPaused: boolean;
  /** Current passing direction */
  rotationDirection: RotationDirection;
  /** Whether direction flips each inning (default true) */
  reverseEachInning: boolean;
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
  /** Role of this device — 'host' (default) or 'player' (read-only viewer) */
  role: GameRole;
  /** Display name of a joined player (only set when role='player') */
  playerDisplayName?: string;
}

/** Role of this device in the game */
export type GameRole = 'host' | 'player';

/** Backend sync status exposed to UI */
export type BackendStatus = 'idle' | 'loading' | 'saving' | 'error';

/** Realtime connection status */
export type RealtimeStatus = 'disconnected' | 'connecting' | 'connected' | 'error';
