/**
 * useRealtimeSubscription — subscribes to Supabase Realtime changes
 * for a game and dispatches state updates to the context.
 *
 * Listens to:
 *   - cup_games changes (status, inning, holder)
 *   - cup_game_events inserts/updates (new events, undone)
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

// ---------------------------------------------------------------------------
// Debug logger — developer-focused, prefixed for easy filtering
// ---------------------------------------------------------------------------
const DEBUG = true; // flip to false to silence
function dbg(tag: string, ...args: unknown[]) {
  if (DEBUG) console.log(`[rt:${tag}]`, ...args);
}

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

  dbg('fetch', 'fetching full game state for', gameId);

  const { data: gameRow, error: gErr } = await repo.fetchGameById(gameId);
  if (gErr || !gameRow) {
    dbg('fetch', 'game row fetch failed', gErr);
    return null;
  }

  const { data: gpRows, error: gpErr } = await repo.fetchGamePlayers(gameId);
  if (gpErr) {
    dbg('fetch', 'game players fetch failed', gpErr);
    return null;
  }

  const { data: events, error: evErr } = await repo.fetchActiveEvents(gameId);
  if (evErr) {
    dbg('fetch', 'events fetch failed', evErr);
    return null;
  }

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

  dbg('fetch', `done — ${events.length} events, inning=${gameRow.inning_number}, status=${gameRow.status}`);

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

/** Polling interval as a safety net for missed realtime events (ms) */
const POLL_INTERVAL = 10_000;
/** Debounce delay for realtime-triggered refetches (ms) */
const DEBOUNCE_MS = 150;

export function useRealtimeSubscription({ gameId, onStateUpdate, enabled }: UseRealtimeOptions) {
  const [realtimeStatus, setRealtimeStatus] = useState<RealtimeStatus>('disconnected');
  const channelRef = useRef<RealtimeChannel | null>(null);
  const onStateUpdateRef = useRef(onStateUpdate);
  onStateUpdateRef.current = onStateUpdate;

  // Debounce refetch to avoid hammering on rapid updates
  const refetchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Track whether a fetch is in progress to skip overlapping requests
  const fetchingRef = useRef(false);

  const refetchState = useCallback(
    (id: string, source: string) => {
      if (refetchTimerRef.current) clearTimeout(refetchTimerRef.current);
      refetchTimerRef.current = setTimeout(async () => {
        if (fetchingRef.current) {
          dbg('refetch', `skipped (already fetching), source=${source}`);
          return;
        }
        fetchingRef.current = true;
        dbg('refetch', `start, source=${source}`);
        try {
          const newState = await fetchFullGameState(id);
          if (newState) {
            dbg('refetch', `success, source=${source}, events=${newState.game?.history.length}`);
            onStateUpdateRef.current(newState);
          } else {
            dbg('refetch', `returned null, source=${source}`);
          }
        } catch (err) {
          dbg('refetch', `error, source=${source}`, err);
        } finally {
          fetchingRef.current = false;
        }
      }, DEBOUNCE_MS);
    },
    [],
  );

  // Immediate (non-debounced) refetch — used for reconnect and focus recovery
  const refetchImmediate = useCallback(
    async (id: string, source: string) => {
      if (fetchingRef.current) {
        dbg('refetch-immediate', `skipped (already fetching), source=${source}`);
        return;
      }
      fetchingRef.current = true;
      dbg('refetch-immediate', `start, source=${source}`);
      try {
        const newState = await fetchFullGameState(id);
        if (newState) {
          dbg('refetch-immediate', `success, source=${source}`);
          onStateUpdateRef.current(newState);
        }
      } catch (err) {
        dbg('refetch-immediate', `error, source=${source}`, err);
      } finally {
        fetchingRef.current = false;
      }
    },
    [],
  );

  // --- Main subscription effect ---
  useEffect(() => {
    if (!enabled || !gameId || !isSupabaseConfigured() || !supabase) {
      dbg('sub', 'not starting — enabled=%s, gameId=%s, configured=%s', enabled, gameId, isSupabaseConfigured());
      setRealtimeStatus('disconnected');
      return;
    }

    dbg('sub', `subscribing to game ${gameId}`);
    setRealtimeStatus('connecting');

    let prevStatus: string = '';

    const channel = supabase.channel(`game-${gameId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'cup_games',
          filter: `id=eq.${gameId}`,
        },
        (payload) => {
          dbg('event', 'cup_games change', payload.eventType, payload.new);
          refetchState(gameId!, 'cup_games');
        },
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'cup_game_events',
          filter: `game_id=eq.${gameId}`,
        },
        (payload) => {
          dbg('event', 'cup_game_events INSERT', payload.new);
          refetchState(gameId!, 'cup_game_events:INSERT');
        },
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'cup_game_events',
          filter: `game_id=eq.${gameId}`,
        },
        (payload) => {
          dbg('event', 'cup_game_events UPDATE', payload.new);
          refetchState(gameId!, 'cup_game_events:UPDATE');
        },
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'cup_game_players',
          filter: `game_id=eq.${gameId}`,
        },
        (payload) => {
          dbg('event', 'cup_game_players change', payload.eventType, payload.new);
          refetchState(gameId!, 'cup_game_players');
        },
      )
      .subscribe((status, err) => {
        dbg('sub', `status=${status}`, err ? `error=${err}` : '');

        if (status === 'SUBSCRIBED') {
          setRealtimeStatus('connected');
          // If we just recovered from an error/disconnect, do an immediate refetch
          if (prevStatus === 'CHANNEL_ERROR' || prevStatus === 'CLOSED' || prevStatus === 'TIMED_OUT') {
            dbg('sub', 'recovered from', prevStatus, '→ immediate refetch');
            refetchImmediate(gameId!, 'reconnect');
          }
        } else if (status === 'CLOSED') {
          setRealtimeStatus('disconnected');
        } else if (status === 'CHANNEL_ERROR') {
          setRealtimeStatus('error');
        } else if (status === 'TIMED_OUT') {
          setRealtimeStatus('error');
        }
        prevStatus = status;
      });

    channelRef.current = channel;

    // --- Polling fallback: refetch every POLL_INTERVAL as a safety net ---
    const pollTimer = setInterval(() => {
      dbg('poll', 'periodic refetch');
      refetchImmediate(gameId!, 'poll');
    }, POLL_INTERVAL);

    // --- Refetch on window focus (catch up after tab was backgrounded) ---
    function handleVisibility() {
      if (document.visibilityState === 'visible') {
        dbg('focus', 'tab became visible → refetch');
        refetchImmediate(gameId!, 'focus');
      }
    }
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      dbg('sub', 'cleaning up subscription for', gameId);
      if (refetchTimerRef.current) clearTimeout(refetchTimerRef.current);
      clearInterval(pollTimer);
      document.removeEventListener('visibilitychange', handleVisibility);
      channel.unsubscribe();
      channelRef.current = null;
      setRealtimeStatus('disconnected');
    };
  }, [enabled, gameId, refetchState, refetchImmediate]);

  return { realtimeStatus, refetchImmediate };
}
