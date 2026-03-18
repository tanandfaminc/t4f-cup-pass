/**
 * useSupabaseSync — adapter between the React context state and Supabase.
 *
 * Exposes action-level helpers that:
 *   1. Perform the Supabase write
 *   2. Return the DB-generated IDs so the reducer can store them
 *
 * All helpers are safe to call when Supabase is unconfigured — they
 * simply resolve with `{ skipped: true }`.
 */
import { useCallback, useRef, useState } from 'react';
import { supabase, isSupabaseConfigured } from './client';
import * as repo from './repository';
import type { GameContextState, Player, PlayEvent, BackendStatus, HitEvent } from '../../types';
import { SCORE_MAP } from '../scoring';

export interface SyncResult {
  skipped?: boolean;
  error?: string;
}

export function useSupabaseSync() {
  const [backendStatus, setBackendStatus] = useState<BackendStatus>('idle');
  const [backendError, setBackendError] = useState<string | null>(null);
  // Track the Supabase game ID within the hook for convenience
  const gameIdRef = useRef<string | null>(null);

  const clearError = useCallback(() => {
    setBackendError(null);
    setBackendStatus('idle');
  }, []);

  /**
   * Create game in Supabase. Returns { dbGameId, publicCode } on success.
   */
  const syncCreateGame = useCallback(
    async (
      gameName: string,
      teamName: string,
    ): Promise<{ dbGameId?: string; publicCode?: string } & SyncResult> => {
      if (!isSupabaseConfigured()) return { skipped: true };
      setBackendStatus('saving');
      setBackendError(null);
      const { data, error } = await repo.createGame({
        game_name: gameName,
        team_name: teamName,
      });
      if (error || !data) {
        setBackendStatus('error');
        setBackendError(error ?? 'Unknown error creating game');
        return { error: error ?? 'Unknown error' };
      }
      gameIdRef.current = data.id;
      setBackendStatus('idle');
      return { dbGameId: data.id, publicCode: data.public_code };
    },
    [],
  );

  /**
   * Persist players and link them to the game.
   * Returns the mapping of local player id -> DB player info.
   */
  const syncSetPlayers = useCallback(
    async (
      players: Player[],
    ): Promise<{ playerMap?: Map<string, { dbId: string; gamePlayerId: string }> } & SyncResult> => {
      const gameId = gameIdRef.current;
      if (!isSupabaseConfigured() || !gameId) return { skipped: true };
      setBackendStatus('saving');
      setBackendError(null);

      // 1. Create player rows
      const { data: dbPlayers, error: pErr } = await repo.upsertPlayers(
        players.map((p) => p.name),
      );
      if (pErr) {
        setBackendStatus('error');
        setBackendError(pErr);
        return { error: pErr };
      }

      // 2. Link to game with seat order
      const gamePlayers = dbPlayers.map((dp, i) => ({
        player_id: dp.id,
        seat_order: i,
      }));
      const { error: gpErr } = await repo.setGamePlayers(gameId, gamePlayers);
      if (gpErr) {
        setBackendStatus('error');
        setBackendError(gpErr);
        return { error: gpErr };
      }

      // 3. Fetch the game_player rows to get their IDs
      const { data: gpRows, error: fetchErr } = await repo.fetchGamePlayers(gameId);
      if (fetchErr) {
        setBackendStatus('error');
        setBackendError(fetchErr);
        return { error: fetchErr };
      }

      // Build map: local id -> { dbId, gamePlayerId }
      const playerMap = new Map<string, { dbId: string; gamePlayerId: string }>();
      players.forEach((p, i) => {
        const dbPlayer = dbPlayers[i];
        const gpRow = gpRows.find((gp) => gp.player_id === dbPlayer.id);
        if (dbPlayer && gpRow) {
          playerMap.set(p.id, { dbId: dbPlayer.id, gamePlayerId: gpRow.id });
        }
      });

      setBackendStatus('idle');
      return { playerMap };
    },
    [],
  );

  /**
   * Mark game as active (started).
   */
  const syncStartGame = useCallback(async (): Promise<SyncResult> => {
    const gameId = gameIdRef.current;
    if (!isSupabaseConfigured() || !gameId) return { skipped: true };
    setBackendStatus('saving');
    setBackendError(null);
    const { error } = await repo.updateGame(gameId, {
      status: 'active',
      started_at: new Date().toISOString(),
    });
    if (error) {
      setBackendStatus('error');
      setBackendError(error);
      return { error };
    }
    setBackendStatus('idle');
    return {};
  }, []);

  /**
   * Persist a logged event.
   */
  const syncLogEvent = useCallback(
    async (
      state: GameContextState,
      hitEvent: HitEvent,
    ): Promise<{ eventDbId?: string } & SyncResult> => {
      const gameId = gameIdRef.current;
      if (!isSupabaseConfigured() || !gameId || !state.game) return { skipped: true };

      const game = state.game;
      const player = state.players[game.currentPlayerIndex];
      const holderDbId = player.dbId;
      if (!holderDbId) return { skipped: true };

      const delta = SCORE_MAP[hitEvent];
      const eventNumber = game.history.length + 1;

      // Insert event
      const { data: evData, error: evErr } = await repo.insertEvent({
        game_id: gameId,
        event_number: eventNumber,
        holder_player_id: holderDbId,
        result_type: hitEvent,
        score_delta: delta,
        inning_number: game.inning,
        batter_number: game.history.length + 1,
      });
      if (evErr) {
        setBackendError(evErr);
        return { error: evErr };
      }

      // Update game counters
      const nextIndex = (game.currentPlayerIndex + 1) % state.players.length;
      await repo.updateGame(gameId, {
        current_holder_index: nextIndex,
        event_count: eventNumber,
        batter_count: game.history.length + 1,
      });

      // Update player score
      const newScore = game.scores[player.id] + delta;
      if (player.gamePlayerId) {
        await repo.updatePlayerScore(player.gamePlayerId, newScore);
      }

      return { eventDbId: evData?.id };
    },
    [],
  );

  /**
   * Undo last event: mark it as undone in DB.
   */
  const syncUndo = useCallback(
    async (state: GameContextState): Promise<SyncResult> => {
      const gameId = gameIdRef.current;
      if (!isSupabaseConfigured() || !gameId || !state.game) return { skipped: true };

      const history = state.game.history;
      if (history.length === 0) return { skipped: true };

      const lastEvent = history[history.length - 1];
      if (lastEvent.dbId) {
        await repo.markEventUndone(lastEvent.dbId);
      }

      // Revert game counters
      const playerCount = state.players.length;
      const prevIndex = (state.game.currentPlayerIndex - 1 + playerCount) % playerCount;
      await repo.updateGame(gameId, {
        current_holder_index: prevIndex,
        event_count: history.length - 1,
        batter_count: Math.max(0, state.game.history.length - 1),
      });

      // Revert player score
      const player = state.players.find((p) => p.id === lastEvent.playerId);
      if (player?.gamePlayerId) {
        const revertedScore = state.game.scores[lastEvent.playerId] - lastEvent.delta;
        await repo.updatePlayerScore(player.gamePlayerId, revertedScore);
      }

      return {};
    },
    [],
  );

  /**
   * Update inning in DB.
   */
  const syncNextInning = useCallback(
    async (currentInning: number): Promise<SyncResult> => {
      const gameId = gameIdRef.current;
      if (!isSupabaseConfigured() || !gameId) return { skipped: true };
      await repo.updateGame(gameId, { inning_number: currentInning + 1 });
      return {};
    },
    [],
  );

  /**
   * Pause game.
   */
  const syncPause = useCallback(async (): Promise<SyncResult> => {
    const gameId = gameIdRef.current;
    if (!isSupabaseConfigured() || !gameId) return { skipped: true };
    await repo.updateGame(gameId, { status: 'paused' });
    return {};
  }, []);

  /**
   * Resume game.
   */
  const syncResume = useCallback(async (): Promise<SyncResult> => {
    const gameId = gameIdRef.current;
    if (!isSupabaseConfigured() || !gameId) return { skipped: true };
    await repo.updateGame(gameId, { status: 'active' });
    return {};
  }, []);

  /**
   * End game: mark finished, save results.
   */
  const syncEndGame = useCallback(
    async (state: GameContextState): Promise<SyncResult> => {
      const gameId = gameIdRef.current;
      if (!isSupabaseConfigured() || !gameId || !state.game) return { skipped: true };
      setBackendStatus('saving');
      setBackendError(null);

      // Mark game as finished
      const { error: gErr } = await repo.updateGame(gameId, {
        status: 'finished',
        ended_at: new Date().toISOString(),
      });
      if (gErr) {
        setBackendStatus('error');
        setBackendError(gErr);
        return { error: gErr };
      }

      // Determine winner
      const scores = state.game.scores;
      let winnerId: string | null = null;
      let maxScore = -Infinity;
      for (const p of state.players) {
        if (scores[p.id] > maxScore) {
          maxScore = scores[p.id];
          winnerId = p.dbId ?? null;
        }
      }

      // Build summary
      const summary = {
        totalEvents: state.game.history.length,
        innings: state.game.inning,
        scores: state.players.map((p) => ({
          name: p.name,
          score: scores[p.id] ?? 0,
        })),
      };

      await repo.saveGameResult({
        game_id: gameId,
        winner_player_id: winnerId,
        summary_json: summary,
      });

      setBackendStatus('idle');
      return {};
    },
    [],
  );

  /**
   * Load a game from Supabase by ID or public code.
   * Returns the full state needed to hydrate the context.
   */
  const loadGame = useCallback(
    async (
      identifier: string,
    ): Promise<{ state?: GameContextState; dbGameId?: string; publicCode?: string } & SyncResult> => {
      if (!isSupabaseConfigured()) return { skipped: true };
      setBackendStatus('loading');
      setBackendError(null);

      // Try by public code first (6 chars), else by UUID
      const isCode = identifier.length <= 8;
      const { data: gameRow, error: gErr } = isCode
        ? await repo.fetchGameByCode(identifier)
        : await repo.fetchGameById(identifier);

      if (gErr || !gameRow) {
        setBackendStatus('error');
        setBackendError(gErr ?? 'Game not found');
        return { error: gErr ?? 'Game not found' };
      }

      gameIdRef.current = gameRow.id;

      // Fetch players
      const { data: gpRows, error: gpErr } = await repo.fetchGamePlayers(gameRow.id);
      if (gpErr) {
        setBackendStatus('error');
        setBackendError(gpErr);
        return { error: gpErr };
      }

      // Fetch events
      const { data: events, error: evErr } = await repo.fetchActiveEvents(gameRow.id);
      if (evErr) {
        setBackendStatus('error');
        setBackendError(evErr);
        return { error: evErr };
      }

      // Build Player array (seat_order sorted already)
      const players: Player[] = gpRows.map((gp, i) => ({
        id: String(i + 1), // local sequential id for backward compat
        name: '', // will be filled below
        seat: '',
        dbId: gp.player_id,
        gamePlayerId: gp.id,
      }));

      // We need display names — fetch from cup_players
      // For now, build a lookup via the events' holder_player_id
      // Fetch display names from cup_players
      const playerIds = gpRows.map((gp) => gp.player_id);
      const { data: playerRows } = await supabase!
        .from('cup_players')
        .select()
        .in('id', playerIds);

      const nameMap = new Map<string, string>();
      for (const pr of (playerRows ?? []) as Array<{ id: string; display_name: string }>) {
        nameMap.set(pr.id, pr.display_name);
      }

      // Fill names
      for (const p of players) {
        p.name = nameMap.get(p.dbId!) ?? 'Unknown';
      }

      // Rebuild scores from events
      const scores: Record<string, number> = {};
      for (const p of players) scores[p.id] = 0;

      // Map dbId -> local id
      const dbToLocal = new Map<string, string>();
      for (const p of players) {
        dbToLocal.set(p.dbId!, p.id);
      }

      const history: PlayEvent[] = events.map((ev) => {
        const localId = dbToLocal.get(ev.holder_player_id) ?? '';
        scores[localId] = (scores[localId] ?? 0) + ev.score_delta;
        return {
          playerId: localId,
          event: ev.result_type as HitEvent,
          delta: ev.score_delta,
          inning: ev.inning_number,
          dbId: ev.id,
        };
      });

      // Update gpRows scores
      for (const gp of gpRows) {
        const localId = dbToLocal.get(gp.player_id);
        if (localId) {
          const p = players.find((pl) => pl.id === localId);
          if (p) {
            // Update score in the gp row -> player lookup
            scores[p.id] = gp.current_score;
          }
        }
      }

      // Actually use event-derived scores (source of truth)
      const eventScores: Record<string, number> = {};
      for (const p of players) eventScores[p.id] = 0;
      for (const ev of history) {
        eventScores[ev.playerId] = (eventScores[ev.playerId] ?? 0) + ev.delta;
      }

      const isFinished = gameRow.status === 'finished';
      const isPaused = gameRow.status === 'paused';

      const restoredState: GameContextState = {
        gameName: gameRow.game_name,
        teamName: gameRow.team_name,
        players,
        game: {
          scores: eventScores,
          currentPlayerIndex: gameRow.current_holder_index,
          inning: gameRow.inning_number,
          history,
          isFinished,
          isPaused,
        },
        dbGameId: gameRow.id,
        publicCode: gameRow.public_code,
      };

      setBackendStatus('idle');
      return { state: restoredState, dbGameId: gameRow.id, publicCode: gameRow.public_code };
    },
    [],
  );

  /**
   * Set the game ID ref (used when restoring from localStorage with a dbGameId).
   */
  const setGameId = useCallback((id: string | null) => {
    gameIdRef.current = id;
  }, []);

  return {
    backendStatus,
    backendError,
    clearError,
    syncCreateGame,
    syncSetPlayers,
    syncStartGame,
    syncLogEvent,
    syncUndo,
    syncNextInning,
    syncPause,
    syncResume,
    syncEndGame,
    loadGame,
    setGameId,
  };
}
