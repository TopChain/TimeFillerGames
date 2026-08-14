-- Compatibility migration for environments that applied the first retry-safe round
-- trigger before its transaction-scoped advisory lock was added.
create or replace function private.dedupe_quick_draw_round_insert()
returns trigger
language plpgsql
set search_path = private, public
as $$
declare
  existing_artist uuid;
begin
  perform pg_advisory_xact_lock(
    hashtextextended(new.game_session_id::text || ':' || new.round_index::text, 0)
  );

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

  return null;
end;
$$;
