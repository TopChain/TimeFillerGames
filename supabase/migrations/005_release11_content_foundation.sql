-- Deferred Release 1.1 server-only content/result foundation.
-- These tables existed in the live Supabase project before the tracked Release 1 migration sequence.
-- They are intentionally inaccessible to anon/authenticated clients until Word Challenge / Math Challenge ship.

create table if not exists public.content_packs (
  id uuid primary key default gen_random_uuid(),
  game_id text not null check (game_id in ('word-challenge','math-challenge')),
  version text not null,
  status text not null default 'draft' check (status in ('draft','active','retired')),
  content jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  activated_at timestamptz,
  unique (game_id, version)
);

create unique index if not exists content_packs_one_active_per_game
  on public.content_packs(game_id)
  where status = 'active';

create table if not exists public.player_question_history (
  anonymous_id text not null,
  game_id text not null,
  level text not null,
  question_key text not null,
  content_version text not null,
  seen_at timestamptz not null default now(),
  primary key (anonymous_id, game_id, level, question_key)
);

create index if not exists player_question_history_recent
  on public.player_question_history(anonymous_id, game_id, level, seen_at desc);

create table if not exists public.game_results (
  id bigint generated always as identity primary key,
  session_id text not null,
  anonymous_id text not null,
  game_id text not null,
  level text not null,
  duration_minutes smallint not null check (duration_minutes in (3,5,8,10)),
  score integer not null default 0,
  correct_answers smallint not null default 0,
  answered_questions smallint not null default 0,
  content_version text not null,
  completed_at timestamptz not null default now()
);

create index if not exists game_results_player_recent
  on public.game_results(anonymous_id, game_id, completed_at desc);

alter table public.content_packs enable row level security;
alter table public.player_question_history enable row level security;
alter table public.game_results enable row level security;

revoke all on public.content_packs from anon, authenticated;
revoke all on public.player_question_history from anon, authenticated;
revoke all on public.game_results from anon, authenticated;

grant all on public.content_packs to service_role;
grant all on public.player_question_history to service_role;
grant all on public.game_results to service_role;
