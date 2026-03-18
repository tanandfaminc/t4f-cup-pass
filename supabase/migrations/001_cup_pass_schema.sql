-- Cup Pass schema — Milestone 3
-- All tables prefixed with cup_ to namespace clearly.

-- ============================================================
-- cup_players — global player identities (reusable across games)
-- ============================================================
create table if not exists cup_players (
  id          uuid primary key default gen_random_uuid(),
  display_name text not null,
  created_at  timestamptz not null default now()
);

-- ============================================================
-- cup_games — one row per game session
-- ============================================================
create table if not exists cup_games (
  id                    uuid primary key default gen_random_uuid(),
  public_code           text not null unique,
  status                text not null default 'setup'
                        check (status in ('setup','active','paused','finished')),
  mode                  text not null default 'classic',
  length_type           text not null default 'unlimited',
  current_holder_index  int not null default 0,
  starting_holder_index int not null default 0,
  batter_count          int not null default 0,
  inning_number         int not null default 1,
  event_count           int not null default 0,
  game_name             text not null default '',
  team_name             text not null default '',
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  started_at            timestamptz,
  ended_at              timestamptz
);

-- Index for lookup by public code
create index if not exists idx_cup_games_public_code on cup_games (public_code);

-- ============================================================
-- cup_game_players — players assigned to a specific game
-- ============================================================
create table if not exists cup_game_players (
  id          uuid primary key default gen_random_uuid(),
  game_id     uuid not null references cup_games(id) on delete cascade,
  player_id   uuid not null references cup_players(id) on delete cascade,
  seat_order  int not null,
  current_score int not null default 0,
  created_at  timestamptz not null default now()
);

create index if not exists idx_cup_game_players_game on cup_game_players (game_id);

-- ============================================================
-- cup_game_events — every play recorded (source of truth)
-- ============================================================
create table if not exists cup_game_events (
  id                uuid primary key default gen_random_uuid(),
  game_id           uuid not null references cup_games(id) on delete cascade,
  event_number      int not null,
  holder_player_id  uuid not null references cup_players(id),
  result_type       text not null,
  score_delta       int not null,
  inning_number     int not null,
  batter_number     int not null default 0,
  created_at        timestamptz not null default now(),
  undone_at         timestamptz
);

create index if not exists idx_cup_game_events_game on cup_game_events (game_id);

-- ============================================================
-- cup_game_results — final summary written when game ends
-- ============================================================
create table if not exists cup_game_results (
  id                uuid primary key default gen_random_uuid(),
  game_id           uuid not null references cup_games(id) on delete cascade,
  winner_player_id  uuid references cup_players(id),
  summary_json      jsonb not null default '{}',
  created_at        timestamptz not null default now()
);

create index if not exists idx_cup_game_results_game on cup_game_results (game_id);
