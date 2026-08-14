alter table public.participants
  add column if not exists nickname_locked boolean not null default false;

create table if not exists public.moderation_events (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms(id) on delete cascade,
  actor_user_id uuid not null,
  participant_id uuid references public.participants(id) on delete set null,
  action text not null check (action in ('role_changed','participant_removed','nickname_overridden','nickname_unlocked')),
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists moderation_events_room_created_idx
  on public.moderation_events(room_id, created_at desc);

alter table public.moderation_events enable row level security;

-- Moderation events are intentionally server-only. No anon/authenticated direct
-- table policies are granted; Host access is mediated by authorized route handlers.
