/**
 * Supabase data access for Cup Pass.
 *
 * All functions return `{ data, error }` to let callers decide
 * how to handle failures (show toast, fall back to local, etc.).
 */
import { supabase } from './client';
import { generateGameCode } from './gameCode';
import type {
  DbCupGame,
  DbCupPlayer,
  DbCupGamePlayer,
  DbCupGameEvent,
  DbCupGameResult,
} from './dbTypes';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function sb() {
  if (!supabase) throw new Error('Supabase is not configured');
  return supabase;
}

// ---------------------------------------------------------------------------
// cup_games
// ---------------------------------------------------------------------------

export async function createGame(fields: {
  game_name: string;
  team_name: string;
}): Promise<{ data: DbCupGame | null; error: string | null }> {
  let publicCode = generateGameCode();
  for (let attempt = 0; attempt < 5; attempt++) {
    const { data, error } = await sb()
      .from('cup_games')
      .insert({
        public_code: publicCode,
        game_name: fields.game_name,
        team_name: fields.team_name,
        status: 'setup',
      })
      .select()
      .single();

    if (!error) return { data: data as DbCupGame, error: null };
    if (error.code === '23505' && error.message.includes('public_code')) {
      publicCode = generateGameCode();
      continue;
    }
    return { data: null, error: error.message };
  }
  return { data: null, error: 'Failed to generate unique game code' };
}

export async function fetchGameById(
  gameId: string,
): Promise<{ data: DbCupGame | null; error: string | null }> {
  const { data, error } = await sb()
    .from('cup_games')
    .select()
    .eq('id', gameId)
    .single();
  return { data: (data as DbCupGame) ?? null, error: error?.message ?? null };
}

export async function fetchGameByCode(
  code: string,
): Promise<{ data: DbCupGame | null; error: string | null }> {
  const { data, error } = await sb()
    .from('cup_games')
    .select()
    .eq('public_code', code.toUpperCase())
    .single();
  return { data: (data as DbCupGame) ?? null, error: error?.message ?? null };
}

export async function updateGame(
  gameId: string,
  fields: Partial<
    Pick<
      DbCupGame,
      | 'status'
      | 'current_holder_index'
      | 'inning_number'
      | 'event_count'
      | 'batter_count'
      | 'game_name'
      | 'team_name'
      | 'started_at'
      | 'ended_at'
    >
  >,
): Promise<{ data: DbCupGame | null; error: string | null }> {
  const { data, error } = await sb()
    .from('cup_games')
    .update({ ...fields, updated_at: new Date().toISOString() })
    .eq('id', gameId)
    .select()
    .single();
  return { data: (data as DbCupGame) ?? null, error: error?.message ?? null };
}

// ---------------------------------------------------------------------------
// cup_players
// ---------------------------------------------------------------------------

export async function upsertPlayers(
  displayNames: string[],
): Promise<{ data: DbCupPlayer[]; error: string | null }> {
  const rows = displayNames.map((name) => ({ display_name: name }));
  const { data, error } = await sb()
    .from('cup_players')
    .insert(rows)
    .select();
  if (error) return { data: [], error: error.message };
  return { data: (data as DbCupPlayer[]) ?? [], error: null };
}

// ---------------------------------------------------------------------------
// cup_game_players
// ---------------------------------------------------------------------------

export async function setGamePlayers(
  gameId: string,
  players: Array<{ player_id: string; seat_order: number }>,
): Promise<{ error: string | null }> {
  await sb().from('cup_game_players').delete().eq('game_id', gameId);
  const rows = players.map((p) => ({
    game_id: gameId,
    player_id: p.player_id,
    seat_order: p.seat_order,
    current_score: 0,
  }));
  const { error } = await sb().from('cup_game_players').insert(rows);
  return { error: error?.message ?? null };
}

export async function fetchGamePlayers(
  gameId: string,
): Promise<{ data: DbCupGamePlayer[]; error: string | null }> {
  const { data, error } = await sb()
    .from('cup_game_players')
    .select()
    .eq('game_id', gameId)
    .order('seat_order', { ascending: true });
  return { data: (data as DbCupGamePlayer[]) ?? [], error: error?.message ?? null };
}

export async function updatePlayerScore(
  gamePlayerId: string,
  newScore: number,
): Promise<{ error: string | null }> {
  const { error } = await sb()
    .from('cup_game_players')
    .update({ current_score: newScore })
    .eq('id', gamePlayerId);
  return { error: error?.message ?? null };
}

// ---------------------------------------------------------------------------
// cup_game_events
// ---------------------------------------------------------------------------

export async function insertEvent(
  event: Pick<
    DbCupGameEvent,
    'game_id' | 'event_number' | 'holder_player_id' | 'result_type' | 'score_delta' | 'inning_number' | 'batter_number'
  >,
): Promise<{ data: DbCupGameEvent | null; error: string | null }> {
  const { data, error } = await sb()
    .from('cup_game_events')
    .insert(event)
    .select()
    .single();
  return { data: (data as DbCupGameEvent) ?? null, error: error?.message ?? null };
}

export async function markEventUndone(
  eventId: string,
): Promise<{ error: string | null }> {
  const { error } = await sb()
    .from('cup_game_events')
    .update({ undone_at: new Date().toISOString() })
    .eq('id', eventId);
  return { error: error?.message ?? null };
}

export async function fetchActiveEvents(
  gameId: string,
): Promise<{ data: DbCupGameEvent[]; error: string | null }> {
  const { data, error } = await sb()
    .from('cup_game_events')
    .select()
    .eq('game_id', gameId)
    .is('undone_at', null)
    .order('event_number', { ascending: true });
  return { data: (data as DbCupGameEvent[]) ?? [], error: error?.message ?? null };
}

// ---------------------------------------------------------------------------
// cup_game_results
// ---------------------------------------------------------------------------

export async function saveGameResult(
  result: Pick<DbCupGameResult, 'game_id' | 'winner_player_id' | 'summary_json'>,
): Promise<{ data: DbCupGameResult | null; error: string | null }> {
  const { data, error } = await sb()
    .from('cup_game_results')
    .insert(result)
    .select()
    .single();
  return { data: (data as DbCupGameResult) ?? null, error: error?.message ?? null };
}

export async function fetchGameResult(
  gameId: string,
): Promise<{ data: DbCupGameResult | null; error: string | null }> {
  const { data, error } = await sb()
    .from('cup_game_results')
    .select()
    .eq('game_id', gameId)
    .single();
  return { data: (data as DbCupGameResult) ?? null, error: error?.message ?? null };
}
