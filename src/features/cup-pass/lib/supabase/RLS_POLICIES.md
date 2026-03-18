# Supabase RLS Policies — Cup Pass MVP

This document describes the recommended Row Level Security (RLS) policies
for the Cup Pass Supabase tables. These should be applied once the MVP
moves to production with real anonymous users.

## Current state (MVP)

In the current MVP, all tables use the Supabase `anon` key with **no RLS enabled**.
Role enforcement is client-side only (the `role` field in React context).

## Recommended RLS policies for production

### cup_games

```sql
-- Anyone can read games (needed for join flow)
CREATE POLICY "Games are publicly readable"
  ON cup_games FOR SELECT
  USING (true);

-- Only the anon key can create games (no auth required for MVP)
CREATE POLICY "Anyone can create games"
  ON cup_games FOR INSERT
  WITH CHECK (true);

-- Updates limited to non-finished games
-- In a future auth milestone, restrict to game creator
CREATE POLICY "Games can be updated while not finished"
  ON cup_games FOR UPDATE
  USING (status != 'finished')
  WITH CHECK (true);

-- No deletes
CREATE POLICY "Games cannot be deleted"
  ON cup_games FOR DELETE
  USING (false);
```

### cup_players

```sql
-- Public read
CREATE POLICY "Players are publicly readable"
  ON cup_players FOR SELECT USING (true);

-- Anyone can create player records
CREATE POLICY "Anyone can create players"
  ON cup_players FOR INSERT WITH CHECK (true);

-- No updates or deletes to player records
CREATE POLICY "Players cannot be updated"
  ON cup_players FOR UPDATE USING (false);
CREATE POLICY "Players cannot be deleted"
  ON cup_players FOR DELETE USING (false);
```

### cup_game_players

```sql
-- Public read (needed for scoreboard)
CREATE POLICY "Game players are publicly readable"
  ON cup_game_players FOR SELECT USING (true);

-- Insert allowed (linking players to games)
CREATE POLICY "Game players can be created"
  ON cup_game_players FOR INSERT WITH CHECK (true);

-- Score updates allowed only for active games
CREATE POLICY "Scores can be updated for active games"
  ON cup_game_players FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM cup_games
      WHERE cup_games.id = cup_game_players.game_id
      AND cup_games.status IN ('active', 'paused')
    )
  );
```

### cup_game_events

```sql
-- Public read
CREATE POLICY "Events are publicly readable"
  ON cup_game_events FOR SELECT USING (true);

-- Insert only for active games
CREATE POLICY "Events can be added to active games"
  ON cup_game_events FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM cup_games
      WHERE cup_games.id = cup_game_events.game_id
      AND cup_games.status = 'active'
    )
  );

-- Only undone_at can be updated (for undo)
CREATE POLICY "Events can be marked undone"
  ON cup_game_events FOR UPDATE
  USING (undone_at IS NULL)
  WITH CHECK (undone_at IS NOT NULL);
```

### cup_game_results

```sql
-- Public read
CREATE POLICY "Results are publicly readable"
  ON cup_game_results FOR SELECT USING (true);

-- Insert only (no updates/deletes)
CREATE POLICY "Results can be created"
  ON cup_game_results FOR INSERT WITH CHECK (true);
CREATE POLICY "Results cannot be updated"
  ON cup_game_results FOR UPDATE USING (false);
CREATE POLICY "Results cannot be deleted"
  ON cup_game_results FOR DELETE USING (false);
```

## Future auth considerations

When auth is added (Milestone 6+):
1. Add a `creator_id` column to `cup_games` referencing `auth.uid()`
2. Restrict UPDATE on `cup_games` to `creator_id = auth.uid()`
3. Restrict INSERT on `cup_game_events` to game creator
4. Restrict score updates to game creator
5. Players remain read-only viewers with no write access

## Client-side guards (current)

Even without RLS, the following client-side guards exist:
- `requireHost()` check on all mutating actions in `gameContext.tsx`
- RouteGuard redirects players away from host routes
- Rapid submission lock on `logEvent` prevents double-tap issues
- Player devices only receive `_HYDRATE` dispatches via realtime
