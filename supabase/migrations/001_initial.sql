create extension if not exists pgcrypto;

create table if not exists public.rooms (
  id uuid primary key default gen_random_uuid(),
  join_code text not null unique,
  host_user_id uuid,
  status text not null default 'lobby' check (status in ('lobby','playing','paused','results','closed')),
  room_language text not null default 'en',
  context text,
  host_cap integer,
  locked boolean not null default false,
  created_at timestamptz not null default now(),
  expires_at timestamptz
);

create table if not exists public.participants (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms(id) on delete cascade,
  session_token uuid not null default gen_random_uuid(),
  nickname text not null check (char_length(nickname) between 1 and 24),
  avatar_category text,
  avatar_key text,
  role text not null default 'participant' check (role in ('host','participant','spectator','cohost')),
  online boolean not null default true,
  joined_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  unique(room_id, session_token)
);

create table if not exists public.game_sessions (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms(id) on delete cascade,
  game_type text not null check (game_type in ('bingo','majority-match','quick-draw','word-challenge','math-challenge')),
  config jsonb not null default '{}'::jsonb,
  state jsonb not null default '{}'::jsonb,
  status text not null default 'setup' check (status in ('setup','active','paused','ended')),
  started_at timestamptz,
  ended_at timestamptz
);

create table if not exists public.submissions (
  id uuid primary key default gen_random_uuid(),
  game_session_id uuid not null references public.game_sessions(id) on delete cascade,
  participant_id uuid not null references public.participants(id) on delete cascade,
  round_id text not null,
  payload jsonb not null,
  submitted_at timestamptz not null default now(),
  unique(game_session_id, participant_id, round_id)
);

create table if not exists public.score_entries (
  id uuid primary key default gen_random_uuid(),
  game_session_id uuid not null references public.game_sessions(id) on delete cascade,
  participant_id uuid not null references public.participants(id) on delete cascade,
  points integer not null,
  reason text not null,
  created_at timestamptz not null default now()
);

alter table public.rooms enable row level security;
alter table public.participants enable row level security;
alter table public.game_sessions enable row level security;
alter table public.submissions enable row level security;
alter table public.score_entries enable row level security;

-- Production access should be mediated by server actions / route handlers using verified room/session authorization.
-- No broad anonymous write policies are created here intentionally.
create policy "public room lookup by active join code" on public.rooms
for select to anon using (status <> 'closed' and (expires_at is null or expires_at > now()));
