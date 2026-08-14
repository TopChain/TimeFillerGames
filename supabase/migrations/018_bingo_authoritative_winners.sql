-- Make Bingo draw transitions monotonic and derive winners inside the same transaction
-- that commits the draw state. Existing server code may attempt a winner insert before
-- updating state; that direct insert is intentionally suppressed and the authoritative
-- trigger inserts the correct winners only after a valid draw transition commits.

create schema if not exists private;

create or replace function private.bingo_card_has_line(
  p_card jsonb,
  p_drawn jsonb,
  p_size integer
)
returns boolean
language plpgsql
immutable
set search_path = private, public
as $$
declare
  r integer;
  c integer;
  cell jsonb;
  line_complete boolean;
begin
  if p_size < 1
     or jsonb_typeof(p_card) <> 'array'
     or jsonb_typeof(p_drawn) <> 'array'
     or jsonb_array_length(p_card) <> p_size * p_size then
    return false;
  end if;

  for r in 0..p_size - 1 loop
    line_complete := true;
    for c in 0..p_size - 1 loop
      cell := p_card -> (r * p_size + c);
      if not (p_drawn @> jsonb_build_array(cell)) then
        line_complete := false;
        exit;
      end if;
    end loop;
    if line_complete then return true; end if;
  end loop;

  for c in 0..p_size - 1 loop
    line_complete := true;
    for r in 0..p_size - 1 loop
      cell := p_card -> (r * p_size + c);
      if not (p_drawn @> jsonb_build_array(cell)) then
        line_complete := false;
        exit;
      end if;
    end loop;
    if line_complete then return true; end if;
  end loop;

  line_complete := true;
  for r in 0..p_size - 1 loop
    cell := p_card -> (r * p_size + r);
    if not (p_drawn @> jsonb_build_array(cell)) then
      line_complete := false;
      exit;
    end if;
  end loop;
  if line_complete then return true; end if;

  line_complete := true;
  for r in 0..p_size - 1 loop
    cell := p_card -> (r * p_size + (p_size - 1 - r));
    if not (p_drawn @> jsonb_build_array(cell)) then
      line_complete := false;
      exit;
    end if;
  end loop;
  return line_complete;
end;
$$;

create or replace function private.guard_bingo_draw_transition()
returns trigger
language plpgsql
set search_path = private, public
as $$
declare
  old_drawn jsonb := coalesce(old.state -> 'drawn', '[]'::jsonb);
  new_drawn jsonb := coalesce(new.state -> 'drawn', '[]'::jsonb);
  old_count integer;
  new_count integer;
  i integer;
begin
  if old.game_type <> 'bingo' or new.game_type <> 'bingo' then
    return new;
  end if;

  if jsonb_typeof(old_drawn) <> 'array' or jsonb_typeof(new_drawn) <> 'array' then
    raise exception 'Bingo drawn state must be an array';
  end if;

  old_count := jsonb_array_length(old_drawn);
  new_count := jsonb_array_length(new_drawn);

  if new_count < old_count or new_count > old_count + 1 then
    raise exception 'Invalid Bingo draw transition';
  end if;

  if new_count = old_count then
    if new_drawn <> old_drawn then
      raise exception 'Stale Bingo draw state cannot overwrite committed draws';
    end if;
    return new;
  end if;

  if old_count > 0 then
    for i in 0..old_count - 1 loop
      if new_drawn -> i <> old_drawn -> i then
        raise exception 'Bingo draw history is immutable';
      end if;
    end loop;
  end if;

  if coalesce(new.state -> 'latestDraw', 'null'::jsonb) <> new_drawn -> (new_count - 1) then
    raise exception 'Bingo latestDraw must match the appended draw';
  end if;

  return new;
end;
$$;

create or replace function private.allow_only_authoritative_bingo_winner_insert()
returns trigger
language plpgsql
set search_path = private, public
as $$
begin
  if current_setting('timefillergames.bingo_winner_internal', true) = '1' then
    return new;
  end if;

  -- Existing Release 1 service code inserts winner candidates before committing
  -- the draw. Suppress that non-authoritative write; the AFTER UPDATE trigger below
  -- derives the actual winners from the committed state in the same transaction.
  return null;
end;
$$;

create or replace function private.commit_bingo_winners_from_state()
returns trigger
language plpgsql
set search_path = private, public
as $$
declare
  old_drawn jsonb := coalesce(old.state -> 'drawn', '[]'::jsonb);
  new_drawn jsonb := coalesce(new.state -> 'drawn', '[]'::jsonb);
  old_count integer;
  new_count integer;
  board_size integer;
  next_placement integer;
begin
  if old.game_type <> 'bingo' or new.game_type <> 'bingo' then
    return new;
  end if;

  old_count := jsonb_array_length(old_drawn);
  new_count := jsonb_array_length(new_drawn);
  if new_count <> old_count + 1 then
    return new;
  end if;

  board_size := nullif(new.config ->> 'boardSize', '')::integer;
  if board_size is null or board_size < 1 then
    raise exception 'Bingo boardSize is missing';
  end if;

  select count(*) + 1
  into next_placement
  from public.bingo_winners
  where game_session_id = new.id;

  perform set_config('timefillergames.bingo_winner_internal', '1', true);

  insert into public.bingo_winners (
    game_session_id,
    participant_id,
    completing_draw_index,
    placement
  )
  select
    new.id,
    card.participant_id,
    new_count - 1,
    next_placement
  from public.bingo_cards as card
  where card.game_session_id = new.id
    and card.selected_card is not null
    and private.bingo_card_has_line(card.selected_card, new_drawn, board_size)
    and not exists (
      select 1
      from public.bingo_winners existing
      where existing.game_session_id = new.id
        and existing.participant_id = card.participant_id
    )
  on conflict (game_session_id, participant_id) do nothing;

  perform set_config('timefillergames.bingo_winner_internal', '0', true);
  return new;
end;
$$;

drop trigger if exists bingo_guard_draw_transition on public.game_sessions;
create trigger bingo_guard_draw_transition
before update of state on public.game_sessions
for each row
when (old.game_type = 'bingo' and new.game_type = 'bingo')
execute function private.guard_bingo_draw_transition();

drop trigger if exists bingo_block_direct_winner_insert on public.bingo_winners;
create trigger bingo_block_direct_winner_insert
before insert on public.bingo_winners
for each row
execute function private.allow_only_authoritative_bingo_winner_insert();

drop trigger if exists bingo_commit_winners_from_state on public.game_sessions;
create trigger bingo_commit_winners_from_state
after update of state on public.game_sessions
for each row
when (old.game_type = 'bingo' and new.game_type = 'bingo')
execute function private.commit_bingo_winners_from_state();

revoke all on function private.bingo_card_has_line(jsonb, jsonb, integer) from public;
revoke all on function private.guard_bingo_draw_transition() from public;
revoke all on function private.allow_only_authoritative_bingo_winner_insert() from public;
revoke all on function private.commit_bingo_winners_from_state() from public;
