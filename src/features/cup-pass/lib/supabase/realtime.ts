/**
 * useRealtimeSubscription — subscribes to Supabase Realtime changes
 * for a game and dispatches state updates to the context.
 *
 * Listens to:
 *   - cup_games changes (status, inning, holder)
 *   - cup_game_events inserts (new events)
 *   - cup_game_players changes (score updates)
 *
 * Designed for player (read-only) devices. The host does not need this
 * because it is the source of truth.
 */
import { useEffect, useRef, useState, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from './client';
import * as repo from './repository';
import type { GameContextState, Player, PlayEvent, HitEvent, RealtimeStatus } from '../../types';
import type { RealtimeChannel } from '@supabase/supabase-js';

interface UseRealtimeOptions {
  /** Supabase game ID to subscribe to */
  gameId: string | undefined;
  /** Callback to hydrate state when an update arrives */
  onStateUpdate: (state: GameContextState) => void;
  /** Whether realtime is enabled (only for player role) */
  enabled: boolean;
}

/**
 * Rebuild the full GameContextState from Supabase.
 * Reuses the same logic as sync.loadGame but is standalone.
 */
async function fetchFullGameState(gameId: string): Promise<GameContextState | null> {
  if (!supabase) return null;

  const { data: gameRow, error: gErr } = await repo.fetchGameById(gameId);
  if (gErr || !gameRow) return null;

  const { data: gpRows, error: gpErr } = await repo.fetchGamePlayers(gameId);
  if (gpErr) return null;

  const { data: events, error: evErr } = await repo.fetchActiveEvents(gameId);
  if (evErr) return null;

  // Fetch player display names
  const playerIds = gpRows.map((gp) => gp.player_id);
  const { data: playerRows } = await supabase
    .from('cup_players')
    .select()
    .in('id', playerIds);

  const nameMap = new Map<string, string>();
  for (const pr of (playerRows ?? []) as Array<{ id: string; display_name: string }>) {
    nameMap.set(pr.id, pr.display_name);
  }

  const players: Player[] = gpRows.map((gp, i) => ({
    id: String(i + 1),
    name: nameMap.get(gp.player_id) ?? 'Unknown',
    seat: '',
    dbId: gp.player_id,
    gamePlayerId: gp.id,
  }));

  // Map dbId -> local id
  const dbToLocal = new Map<string, string>();
  for (const p of players) {
    dbToLocal.set(p.dbId!, p.id);
  }

  // Rebuild scores from events (source of truth)
  const scores: Record<string, number> = {};
  for (const p of players) scores[p.id] = 0;

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

  const isFinished = gameRow.status === 'finished';
  const isPaused = gameRow.status === 'paused';

  return {
    gameName: gameRow.game_name,
    teamName: gameRow.team_name,
    players,
    game: {
      scores,
      currentPlayerIndex: gameRow.current_holder_index,
      inning: gameRow.inning_number,
      history,
      isFinished,
      isPaused,
      rotationDirection: 'left',
      reverseEachInning: true,
    },
    dbGameId: gameRow.id,
    publicCode: gameRow.public_code,
    role: 'player',
  };
}

export function useRealtimeSubscription({ gameId, onStateUpdate, enabled }: UseRealtimeOptions) {
  const [realtimeStatus, setRealtimeStatus] = useState<RealtimeStatus>('disconnected');
  const channelRef = useRef<RealtimeChannel | null>(null);
  const onStateUpdateRef = useRef(onStateUpdate);
  onStateUpdateRef.current = onStateUpdate;

  // Debounce refetch to avoid hammering on rapid updates
  const refetchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const refetchState = useCallback((id: string) => {
    if (refetchTimerRef.current) clearTimeout(refetchTimerRef.current);
    refetchTimerRef.current = setTimeout(async () => {
      const newState = await fetchFullGameState(id);
      if (newState) {
        onStateUpdateRef.current(newState);
      }
    }, 150);
  }, []);

  useEffect(() => {
    if (!enabled || !gameId || !isSupabaseConfigured() || !supabase) {
      setRealtimeStatus('disconnected');
      return;
    }

    setRealtimeStatus('connecting');

    const channel = supabase.channel(`game-${gameId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'cup_games',
          filter: `id=eq.${gameId}`,
        },
        () => refetchState(gameId),
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'cup_game_events',
          filter: `game_id=eq.${gameId}`,
        },
        () => refetchState(gameId),
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'cup_game_events',
          filter: `game_id=eq.${gameId}`,
        },
        () => refetchState(gameId),
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'cup_game_players',
          filter: `game_id=eq.${gameId}`,
        },
        () => refetchState(gameId),
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setRealtimeStatus('connected');
        } else if (status === 'CLOSED') {
          setRealtimeStatus('disconnected');
        } else if (status === 'CHANNEL_ERROR') {
          setRealtimeStatus('error');
        }
      });

    channelRef.current = channel;

    return () => {
      if (refetchTimerRef.current) clearTimeout(refetchTimerRef.current);
      channel.unsubscribe();
      channelRef.current = null;
      setRealtimeStatus('disconnected');
    };
  }, [enabled, gameId, refetchState]);

  return { realtimeStatus };
}
