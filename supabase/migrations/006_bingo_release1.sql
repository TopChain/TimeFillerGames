create table if not exists public.bingo_cards (
  id uuid primary key default gen_random_uuid(),
  game_session_id uuid not null references public.game_sessions(id) on delete cascade,
  participant_id uuid not null references public.participants(id) on delete cascade,
  candidate_cards jsonb not null,
  selected_candidate integer,
  selected_card jsonb,
  locked_at timestamptz,
  created_at timestamptz not null default now(),
  unique(game_session_id, participant_id),
  check (selected_candidate is null or selected_candidate >= 0)
);

create table if not exists public.bingo_winners (
  id uuid primary key default gen_random_uuid(),
  game_session_id uuid not null references public.game_sessions(id) on delete cascade,
  participant_id uuid not null references public.participants(id) on delete cascade,
  completing_draw_index integer not null check (completing_draw_index >= 0),
  placement integer not null check (placement >= 1),
  created_at timestamptz not null default now(),
  unique(game_session_id, participant_id)
);

create index if not exists bingo_cards_session_idx on public.bingo_cards(game_session_id);
create index if not exists bingo_winners_session_placement_idx on public.bingo_winners(game_session_id, placement);

alter table public.bingo_cards enable row level security;
alter table public.bingo_winners enable row level security;

-- Browser clients do not write Bingo state directly. Server routes use the secret/service key.
-- Candidate cards are private to the owning participant; hosts receive only selection status.
grant select on public.bingo_cards, public.bingo_winners to authenticated;

create policy "participant reads own bingo card"
on public.bingo_cards for select to authenticated
using (
  exists (
    select 1 from public.participants p
    where p.id = bingo_cards.participant_id
      and p.auth_user_id = (select auth.uid())
      and p.left_at is null
  )
);

create policy "room members read bingo winners"
on public.bingo_winners for select to authenticated
using (
  public.is_room_member_by_session(game_session_id, (select auth.uid()))
);
