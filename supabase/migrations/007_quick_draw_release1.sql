create table if not exists public.quick_draw_rounds (
  id uuid primary key default gen_random_uuid(),
  game_session_id uuid not null references public.game_sessions(id) on delete cascade,
  round_index integer not null check (round_index >= 0),
  artist_participant_id uuid not null references public.participants(id) on delete cascade,
  secret_word text not null,
  word_category text not null,
  word_difficulty text not null,
  started_at timestamptz not null default now(),
  deadline timestamptz not null,
  ended_at timestamptz,
  status text not null default 'drawing' check (status in ('drawing','revealed','ended')),
  unique(game_session_id, round_index)
);

create table if not exists public.quick_draw_strokes (
  id bigint generated always as identity primary key,
  game_session_id uuid not null references public.game_sessions(id) on delete cascade,
  round_index integer not null check (round_index >= 0),
  participant_id uuid not null references public.participants(id) on delete cascade,
  sequence integer not null check (sequence >= 0),
  payload jsonb not null,
  created_at timestamptz not null default now(),
  unique(game_session_id, round_index, sequence)
);

create table if not exists public.quick_draw_guesses (
  id uuid primary key default gen_random_uuid(),
  game_session_id uuid not null references public.game_sessions(id) on delete cascade,
  round_index integer not null check (round_index >= 0),
  participant_id uuid not null references public.participants(id) on delete cascade,
  guess text not null check (char_length(guess) between 1 and 80),
  normalized_guess text not null,
  accepted boolean not null default false,
  points_awarded integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists quick_draw_rounds_session_idx on public.quick_draw_rounds(game_session_id, round_index);
create index if not exists quick_draw_strokes_round_idx on public.quick_draw_strokes(game_session_id, round_index, sequence);
create index if not exists quick_draw_strokes_rate_idx on public.quick_draw_strokes(participant_id, created_at desc);
create index if not exists quick_draw_guesses_round_idx on public.quick_draw_guesses(game_session_id, round_index, created_at);
create index if not exists quick_draw_guesses_rate_idx on public.quick_draw_guesses(participant_id, created_at desc);
create unique index if not exists quick_draw_one_correct_per_round_idx
  on public.quick_draw_guesses(game_session_id, round_index, participant_id)
  where accepted = true;

alter table public.quick_draw_rounds enable row level security;
alter table public.quick_draw_strokes enable row level security;
alter table public.quick_draw_guesses enable row level security;

-- Quick Draw writes and secret-word reads are mediated by server routes with the secret/service key.
-- Browser clients receive role-filtered state through APIs, preventing the secret word from leaking to guessers.
