import { createContext, useContext, useReducer, type ReactNode } from 'react';
import type { GameContextState, HitEvent, Player } from '../types';
import { initGame, logEvent, nextInning, endGame } from './gameLogic';

type Action =
  | { type: 'SET_GAME_INFO'; gameName: string; teamName: string }
  | { type: 'SET_PLAYERS'; players: Player[] }
  | { type: 'START_GAME' }
  | { type: 'LOG_EVENT'; event: HitEvent }
  | { type: 'NEXT_INNING' }
  | { type: 'END_GAME' }
  | { type: 'RESET' };

const INITIAL_STATE: GameContextState = {
  gameName: '',
  teamName: '',
  players: [],
  game: null,
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
      if (!state.game) return state;
      return { ...state, game: logEvent(state.game, state.players, action.event) };
    case 'NEXT_INNING':
      if (!state.game) return state;
      return { ...state, game: nextInning(state.game) };
    case 'END_GAME':
      if (!state.game) return state;
      return { ...state, game: endGame(state.game) };
    case 'RESET':
      return INITIAL_STATE;
    default:
      return state;
  }
}

interface GameContextValue {
  state: GameContextState;
  dispatch: React.Dispatch<Action>;
}

const GameContext = createContext<GameContextValue | null>(null);

export function GameProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, INITIAL_STATE);
  return <GameContext.Provider value={{ state, dispatch }}>{children}</GameContext.Provider>;
}

export function useGame(): GameContextValue {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGame must be used within <GameProvider>');
  return ctx;
}
