-- Allow anonymous users to create and manage Cup Pass games.
-- Cup Pass is a free-to-play, no-auth game so all writes must be open to the anon role.

-- cup_games: anon can insert new games and update their own games
create policy "Anyone can insert cup games"
  on cup_games for insert
  to anon
  with check (true);

create policy "Anyone can update cup games"
  on cup_games for update
  to anon
  using (true)
  with check (true);

-- cup_players: anon can insert players
create policy "Anyone can insert cup players"
  on cup_players for insert
  to anon
  with check (true);

-- cup_game_players: anon can insert, update (score), delete (for seat reorder)
create policy "Anyone can insert cup game players"
  on cup_game_players for insert
  to anon
  with check (true);

create policy "Anyone can update cup game players"
  on cup_game_players for update
  to anon
  using (true)
  with check (true);

create policy "Anyone can delete cup game players"
  on cup_game_players for delete
  to anon
  using (true);

-- cup_game_events: anon can insert events and mark them undone
create policy "Anyone can insert cup game events"
  on cup_game_events for insert
  to anon
  with check (true);

create policy "Anyone can update cup game events"
  on cup_game_events for update
  to anon
  using (true)
  with check (true);

-- cup_game_results: anon can insert final results
create policy "Anyone can insert cup game results"
  on cup_game_results for insert
  to anon
  with check (true);
