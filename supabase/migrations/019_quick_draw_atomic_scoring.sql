-- Enforce one score reason per participant/session and derive Quick Draw scores
-- atomically from accepted guesses / round reveal transitions.

create unique index if not exists score_entries_unique_reason_idx
  on public.score_entries(game_session_id, participant_id, reason);

create schema if not exists private;

create or replace function private.allow_only_authoritative_quick_draw_score_insert()
returns trigger
language plpgsql
set search_path = private, public
as $$
declare
  session_game_type text;
begin
  if current_setting('timefillergames.quick_draw_score_internal', true) = '1' then
    return new;
  end if;

  select game_type into session_game_type
  from public.game_sessions
  where id = new.game_session_id;

  if session_game_type = 'quick-draw'
     and (new.reason like 'quick-draw-round-%-guess' or new.reason like 'quick-draw-round-%-artist') then
    -- Existing Release 1 service code performs these writes after/before the authoritative
    -- game event. Suppress them; the event triggers below create the score atomically.
    return null;
  end if;

  return new;
end;
$$;

create or replace function private.score_accepted_quick_draw_guess()
returns trigger
language plpgsql
set search_path = private, public
as $$
begin
  if not new.accepted or new.points_awarded <= 0 then
    return new;
  end if;

  perform set_config('timefillergames.quick_draw_score_internal', '1', true);
  insert into public.score_entries (
    game_session_id,
    participant_id,
    points,
    reason
  ) values (
    new.game_session_id,
    new.participant_id,
    new.points_awarded,
    'quick-draw-round-' || (new.round_index + 1)::text || '-guess'
  )
  on conflict (game_session_id, participant_id, reason) do nothing;
  perform set_config('timefillergames.quick_draw_score_internal', '0', true);
  return new;
end;
$$;

create or replace function private.score_revealed_quick_draw_artist()
returns trigger
language plpgsql
set search_path = private, public
as $$
declare
  room_id_value uuid;
  audience_guessing boolean;
  eligible_count integer;
  correct_count integer;
  artist_points integer;
begin
  if old.status <> 'drawing' or new.status <> 'revealed' then
    return new;
  end if;

  select gs.room_id,
         coalesce((gs.config ->> 'audienceGuessing')::boolean, true)
    into room_id_value, audience_guessing
  from public.game_sessions gs
  where gs.id = new.game_session_id;

  if room_id_value is null then
    raise exception 'Quick Draw session is unavailable';
  end if;

  select count(*)
    into eligible_count
  from public.participants p
  where p.room_id = room_id_value
    and p.left_at is null
    and p.id <> new.artist_participant_id
    and (p.role <> 'spectator' or audience_guessing);

  if eligible_count <= 0 then
    return new;
  end if;

  select count(distinct g.participant_id)
    into correct_count
  from public.quick_draw_guesses g
  join public.participants p on p.id = g.participant_id
  where g.game_session_id = new.game_session_id
    and g.round_index = new.round_index
    and g.accepted = true
    and p.room_id = room_id_value
    and p.left_at is null
    and p.id <> new.artist_participant_id
    and (p.role <> 'spectator' or audience_guessing);

  artist_points := round(1000.0 * least(1.0, correct_count::numeric / eligible_count::numeric));
  if artist_points <= 0 then
    return new;
  end if;

  perform set_config('timefillergames.quick_draw_score_internal', '1', true);
  insert into public.score_entries (
    game_session_id,
    participant_id,
    points,
    reason
  ) values (
    new.game_session_id,
    new.artist_participant_id,
    artist_points,
    'quick-draw-round-' || (new.round_index + 1)::text || '-artist'
  )
  on conflict (game_session_id, participant_id, reason) do nothing;
  perform set_config('timefillergames.quick_draw_score_internal', '0', true);
  return new;
end;
$$;

drop trigger if exists quick_draw_block_direct_score_insert on public.score_entries;
create trigger quick_draw_block_direct_score_insert
before insert on public.score_entries
for each row
execute function private.allow_only_authoritative_quick_draw_score_insert();

drop trigger if exists quick_draw_score_accepted_guess on public.quick_draw_guesses;
create trigger quick_draw_score_accepted_guess
after insert on public.quick_draw_guesses
for each row
when (new.accepted = true and new.points_awarded > 0)
execute function private.score_accepted_quick_draw_guess();

drop trigger if exists quick_draw_score_revealed_artist on public.quick_draw_rounds;
create trigger quick_draw_score_revealed_artist
after update of status on public.quick_draw_rounds
for each row
when (old.status = 'drawing' and new.status = 'revealed')
execute function private.score_revealed_quick_draw_artist();

revoke all on function private.allow_only_authoritative_quick_draw_score_insert() from public;
revoke all on function private.score_accepted_quick_draw_guess() from public;
revoke all on function private.score_revealed_quick_draw_artist() from public;
