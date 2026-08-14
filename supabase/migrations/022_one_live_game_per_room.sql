-- A room must never have two independently authoritative live game sessions.
-- This closes concurrent/retried game-start races across all Release 1 games.
create unique index if not exists game_sessions_one_live_per_room_idx
  on public.game_sessions(room_id)
  where status in ('active', 'paused');
