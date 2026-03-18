import { createContext, useContext, useReducer, useEffect, useCallback, type ReactNode } from 'react';
import type { GameContextState, HitEvent, Player, BackendStatus, GameRole, RealtimeStatus } from '../types';
import { initGame, logEvent, nextInning, endGame, undoLastEvent } from './gameLogic';
import { saveState, loadState, clearState } from './persistence';
import { useSupabaseSync } from './supabase/sync';
import { isSupabaseConfigured } from './supabase/client';

export type Action =
  | { type: 'SET_GAME_INFO'; gameName: string; teamName: string }
  | { type: 'SET_PLAYERS'; players: Player[] }
  | { type: 'START_GAME' }
  | { type: 'LOG_EVENT'; event: HitEvent }
  | { type: 'NEXT_INNING' }
  | { type: 'END_GAME' }
  | { type: 'UNDO' }
  | { type: 'PAUSE' }
  | { type: 'RESUME' }
  | { type: 'REMATCH' }
  | { type: 'RESET' }
  | { type: 'JOIN_GAME'; state: GameContextState; displayName: string }
  | { type: '_HYDRATE'; state: GameContextState }
  // New actions for Supabase integration
  | { type: '_SET_DB_IDS'; dbGameId: string; publicCode: string }
  | { type: '_SET_PLAYER_DB_IDS'; playerMap: Map<string, { dbId: string; gamePlayerId: string }> }
  | { type: '_SET_EVENT_DB_ID'; eventIndex: number; dbId: string };

const INITIAL_STATE: GameContextState = {
  gameName: '',
  teamName: '',
  players: [],
  game: null,
  role: 'host',
};

function reducer(state: GameContextState, action: Action): GameContextState {
  switch (action.type) {
    case 'SET_GAME_INFO':
      return { ...state, gameName: action.gameName, teamName: action.teamName };
    case 'SET_PLAYERS':
      return { ...state, players: action.players };
    case 'START_GAME':
      return { ...state, game: initGame(state.players) };
    case 'LOG_EVENT':
      if (!state.game || state.game.isPaused) return state;
      return { ...state, game: logEvent(state.game, state.players, action.event) };
    case 'NEXT_INNING':
      if (!state.game) return state;
      return { ...state, game: nextInning(state.game) };
    case 'END_GAME':
      if (!state.game) return state;
      return { ...state, game: endGame(state.game) };
    case 'UNDO':
      if (!state.game || state.game.history.length === 0) return state;
      return { ...state, game: undoLastEvent(state.game) };
    case 'PAUSE':
      if (!state.game) return state;
      return { ...state, game: { ...state.game, isPaused: true } };
    case 'RESUME':
      if (!state.game) return state;
      return { ...state, game: { ...state.game, isPaused: false } };
    case 'REMATCH':
      if (!state.game) return state;
      return { ...state, game: initGame(state.players) };
    case 'RESET':
      clearState();
      return INITIAL_STATE;
    case 'JOIN_GAME':
      return { ...action.state, role: 'player', playerDisplayName: action.displayName };
    case '_HYDRATE':
      return action.state;
    case '_SET_DB_IDS':
      return { ...state, dbGameId: action.dbGameId, publicCode: action.publicCode };
    case '_SET_PLAYER_DB_IDS': {
      const updatedPlayers = state.players.map((p) => {
        const ids = action.playerMap.get(p.id);
        return ids ? { ...p, dbId: ids.dbId, gamePlayerId: ids.gamePlayerId } : p;
      });
      return { ...state, players: updatedPlayers };
    }
    case '_SET_EVENT_DB_ID': {
      if (!state.game) return state;
      const newHistory = [...state.game.history];
      if (newHistory[action.eventIndex]) {
        newHistory[action.eventIndex] = { ...newHistory[action.eventIndex], dbId: action.dbId };
      }
      return { ...state, game: { ...state.game, history: newHistory } };
    }
    default:
      return state;
  }
}

interface GameContextValue {
  state: GameContextState;
  dispatch: React.Dispatch<Action>;
  // Supabase-aware action helpers (fire-and-forget backend sync)
  actions: {
    setGameInfo: (gameName: string, teamName: string) => Promise<void>;
    setPlayers: (players: Player[]) => Promise<void>;
    startGame: () => Promise<void>;
    logEvent: (event: HitEvent) => Promise<void>;
    undo: () => Promise<void>;
    nextInning: () => Promise<void>;
    pause: () => Promise<void>;
    resume: () => Promise<void>;
    endGame: () => Promise<void>;
    rematch: () => Promise<void>;
    reset: () => void;
    loadGameByCode: (code: string) => Promise<boolean>;
    joinGame: (code: string, displayName: string) => Promise<boolean>;
  };
  backendStatus: BackendStatus;
  backendError: string | null;
  clearBackendError: () => void;
  isBackendConnected: boolean;
}

const GameContext = createContext<GameContextValue | null>(null);

export function GameProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, INITIAL_STATE, () => {
    return loadState() ?? INITIAL_STATE;
  });

  const sync = useSupabaseSync();

  // If we restored a state with a dbGameId, tell the sync hook
  useEffect(() => {
    if (state.dbGameId) {
      sync.setGameId(state.dbGameId);
    }
    // Only run once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist state to localStorage on every change
  useEffect(() => {
    saveState(state);
  }, [state]);

  // --- Action helpers that dispatch locally AND sync to Supabase ---

  const setGameInfo = useCallback(
    async (gameName: string, teamName: string) => {
      dispatch({ type: 'SET_GAME_INFO', gameName, teamName });
      const result = await sync.syncCreateGame(gameName, teamName);
      if (result.dbGameId && result.publicCode) {
        dispatch({ type: '_SET_DB_IDS', dbGameId: result.dbGameId, publicCode: result.publicCode });
      }
    },
    [sync],
  );

  const setPlayers = useCallback(
    async (players: Player[]) => {
      dispatch({ type: 'SET_PLAYERS', players });
      const result = await sync.syncSetPlayers(players);
      if (result.playerMap) {
        dispatch({ type: '_SET_PLAYER_DB_IDS', playerMap: result.playerMap });
      }
    },
    [sync],
  );

  const startGame = useCallback(async () => {
    dispatch({ type: 'START_GAME' });
    await sync.syncStartGame();
  }, [sync]);

  const logEventAction = useCallback(
    async (event: HitEvent) => {
      // Capture the current state before dispatch for the sync call
      const preState = state;
      dispatch({ type: 'LOG_EVENT', event });
      const result = await sync.syncLogEvent(preState, event);
      if (result.eventDbId) {
        // The event was appended at the end of history
        const eventIndex = preState.game ? preState.game.history.length : 0;
        dispatch({ type: '_SET_EVENT_DB_ID', eventIndex, dbId: result.eventDbId });
      }
    },
    [sync, state],
  );

  const undo = useCallback(async () => {
    await sync.syncUndo(state);
    dispatch({ type: 'UNDO' });
  }, [sync, state]);

  const nextInningAction = useCallback(async () => {
    if (state.game) {
      await sync.syncNextInning(state.game.inning);
    }
    dispatch({ type: 'NEXT_INNING' });
  }, [sync, state]);

  const pause = useCallback(async () => {
    dispatch({ type: 'PAUSE' });
    await sync.syncPause();
  }, [sync]);

  const resume = useCallback(async () => {
    dispatch({ type: 'RESUME' });
    await sync.syncResume();
  }, [sync]);

  const endGameAction = useCallback(async () => {
    dispatch({ type: 'END_GAME' });
    // Need to use current state (pre-dispatch is fine since endGame just sets isFinished)
    await sync.syncEndGame(state);
  }, [sync, state]);

  const rematch = useCallback(async () => {
    dispatch({ type: 'REMATCH' });
    // For rematch, create a new game in Supabase
    const result = await sync.syncCreateGame(state.gameName, state.teamName);
    if (result.dbGameId && result.publicCode) {
      dispatch({ type: '_SET_DB_IDS', dbGameId: result.dbGameId, publicCode: result.publicCode });
      // Re-link players to new game
      const pResult = await sync.syncSetPlayers(state.players);
      if (pResult.playerMap) {
        dispatch({ type: '_SET_PLAYER_DB_IDS', playerMap: pResult.playerMap });
      }
      await sync.syncStartGame();
    }
  }, [sync, state.gameName, state.teamName, state.players]);

  const reset = useCallback(() => {
    dispatch({ type: 'RESET' });
  }, []);

  const loadGameByCode = useCallback(
    async (code: string): Promise<boolean> => {
      const result = await sync.loadGame(code);
      if (result.state) {
        dispatch({ type: '_HYDRATE', state: result.state });
        return true;
      }
      return false;
    },
    [sync],
  );

  const joinGame = useCallback(
    async (code: string, displayName: string): Promise<boolean> => {
      const result = await sync.loadGame(code);
      if (result.state) {
        dispatch({ type: 'JOIN_GAME', state: result.state, displayName });
        return true;
      }
      return false;
    },
    [sync],
  );

  const actions = {
    setGameInfo,
    setPlayers,
    startGame,
    logEvent: logEventAction,
    undo,
    nextInning: nextInningAction,
    pause,
    resume,
    endGame: endGameAction,
    rematch,
    reset,
    loadGameByCode,
    joinGame,
  };

  return (
    <GameContext.Provider
      value={{
        state,
        dispatch,
        actions,
        backendStatus: sync.backendStatus,
        backendError: sync.backendError,
        clearBackendError: sync.clearError,
        isBackendConnected: isSupabaseConfigured(),
      }}
    >
      {children}
    </GameContext.Provider>
  );
}

export function useGame(): GameContextValue {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGame must be used within <GameProvider>');
  return ctx;
}
