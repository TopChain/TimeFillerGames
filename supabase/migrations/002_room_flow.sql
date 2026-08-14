alter table public.rooms
  add column if not exists game_type text check (game_type in ('bingo','majority-match','quick-draw','word-challenge','math-challenge')),
  add column if not exists duration_minutes integer check (duration_minutes in (3,5,8,10)),
  add column if not exists allow_custom_photos boolean not null default false,
  add column if not exists allow_late_join boolean not null default true,
  add column if not exists ranking_visibility text not null default 'podium' check (ranking_visibility in ('podium','top10','public','private')),
  add column if not exists room_theme text not null default 'time-indigo';

alter table public.participants
  add column if not exists ui_language text not null default 'en',
  add column if not exists disconnected_at timestamptz;

create index if not exists rooms_join_code_status_idx on public.rooms(join_code, status);
create index if not exists participants_room_online_idx on public.participants(room_id, online);
create index if not exists participants_session_token_idx on public.participants(session_token);

-- The final room-code length, expiry duration, and published capacity remain configuration/load-test decisions.
-- Guest writes continue to be mediated by server route handlers using the service role; no broad anon write policy is added.
