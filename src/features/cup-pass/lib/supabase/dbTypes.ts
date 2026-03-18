/** Typed row shapes matching the cup_ schema. */

export interface DbCupGame {
  id: string;
  public_code: string;
  status: 'setup' | 'active' | 'paused' | 'finished';
  mode: string;
  length_type: string;
  current_holder_index: number;
  starting_holder_index: number;
  batter_count: number;
  inning_number: number;
  event_count: number;
  game_name: string;
  team_name: string;
  created_at: string;
  updated_at: string;
  started_at: string | null;
  ended_at: string | null;
}

export interface DbCupPlayer {
  id: string;
  display_name: string;
  created_at: string;
}

export interface DbCupGamePlayer {
  id: string;
  game_id: string;
  player_id: string;
  seat_order: number;
  current_score: number;
  created_at: string;
}

export interface DbCupGameEvent {
  id: string;
  game_id: string;
  event_number: number;
  holder_player_id: string;
  result_type: string;
  score_delta: number;
  inning_number: number;
  batter_number: number;
  created_at: string;
  undone_at: string | null;
}

export interface DbCupGameResult {
  id: string;
  game_id: string;
  winner_player_id: string | null;
  summary_json: Record<string, unknown>;
  created_at: string;
}
