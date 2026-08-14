-- Treat duplicate creation of the same Quick Draw round as an idempotent Host retry.
-- Session drawing state is canonicalized from the authoritative round record, so a
-- second concurrent request cannot overwrite the accepted round's deadline/artist.

create schema if not exists private;

create or replace function private.dedupe_quick_draw_round_insert()
returns trigger
language plpgsql
set search_path = private, public
as $$
declare
  existing_artist uuid;
begin
  select artist_participant_id
    into existing_artist
  from public.quick_draw_rounds
  where game_session_id = new.game_session_id
    and round_index = new.round_index;

  if existing_artist is null then
    return new;
  end if;

  if existing_artist <> new.artist_participant_id then
    raise exception 'Quick Draw round retry disagrees with the authoritative artist';
  end if;

  -- Same session/index/artist already exists: this is an idempotent retry.
  return null;
end;
$$;

create or replace function private.canonicalize_quick_draw_session_state()
returns trigger
language plpgsql
set search_path = private, public
as $$
declare
  round_index_value integer;
  round_row record;
  artist_name text;
begin
  if new.game_type <> 'quick-draw'
     or coalesce(new.state ->> 'phase', '') <> 'drawing' then
    return new;
  end if;

  round_index_value := nullif(new.state ->> 'roundIndex', '')::integer;
  if round_index_value is null or round_index_value < 0 then
    raise exception 'Quick Draw round index is invalid';
  end if;

  select qdr.artist_participant_id, qdr.deadline
    into round_row
  from public.quick_draw_rounds qdr
  where qdr.game_session_id = new.id
    and qdr.round_index = round_index_value;

  if round_row.artist_participant_id is null then
    raise exception 'Quick Draw authoritative round is missing';
  end if;

  select nickname into artist_name
  from public.participants
  where id = round_row.artist_participant_id;

  new.state := jsonb_set(new.state, '{currentArtistId}', to_jsonb(round_row.artist_participant_id::text), true);
  new.state := jsonb_set(new.state, '{currentArtistNickname}', to_jsonb(coalesce(artist_name, 'Player')), true);
  new.state := jsonb_set(new.state, '{deadline}', to_jsonb(round_row.deadline::text), true);
  return new;
end;
$$;

drop trigger if exists quick_draw_dedupe_round_insert on public.quick_draw_rounds;
create trigger quick_draw_dedupe_round_insert
before insert on public.quick_draw_rounds
for each row
execute function private.dedupe_quick_draw_round_insert();

drop trigger if exists quick_draw_canonicalize_session_state on public.game_sessions;
create trigger quick_draw_canonicalize_session_state
before update of state on public.game_sessions
for each row
when (new.game_type = 'quick-draw')
execute function private.canonicalize_quick_draw_session_state();

revoke all on function private.dedupe_quick_draw_round_insert() from public;
revoke all on function private.canonicalize_quick_draw_session_state() from public;
