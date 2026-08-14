-- Majority Match scores are derived from the committed answering -> revealing transition.
-- Existing application-side score inserts for Majority reasons are suppressed so reveal state
-- and score rows cannot diverge under retries or partial failures.

create schema if not exists private;

create or replace function private.allow_only_authoritative_majority_score_insert()
returns trigger
language plpgsql
set search_path = private, public
as $$
declare
  session_game_type text;
begin
  if current_setting('timefillergames.majority_score_internal', true) = '1' then
    return new;
  end if;

  select game_type into session_game_type
  from public.game_sessions
  where id = new.game_session_id;

  if session_game_type = 'majority-match' and new.reason like 'round-%' then
    return null;
  end if;

  return new;
end;
$$;

create or replace function private.score_majority_reveal()
returns trigger
language plpgsql
set search_path = private, public
as $$
declare
  round_index_value integer;
  round_id_value text;
  majority_choices jsonb;
begin
  if old.game_type <> 'majority-match' or new.game_type <> 'majority-match' then
    return new;
  end if;

  if coalesce(old.state ->> 'phase', '') <> 'answering'
     or coalesce(new.state ->> 'phase', '') <> 'revealing' then
    return new;
  end if;

  round_index_value := nullif(new.state ->> 'roundIndex', '')::integer;
  if round_index_value is null or round_index_value < 0 then
    raise exception 'Majority Match round index is invalid';
  end if;
  round_id_value := 'round-' || (round_index_value + 1)::text;
  majority_choices := coalesce(new.state #> '{reveal,majorityChoices}', '[]'::jsonb);

  if jsonb_typeof(majority_choices) <> 'array' then
    raise exception 'Majority Match reveal choices are invalid';
  end if;

  perform set_config('timefillergames.majority_score_internal', '1', true);
  insert into public.score_entries (
    game_session_id,
    participant_id,
    points,
    reason
  )
  select
    new.id,
    s.participant_id,
    1000,
    round_id_value
  from public.submissions s
  where s.game_session_id = new.id
    and s.round_id = round_id_value
    and majority_choices @> jsonb_build_array(s.payload -> 'choice')
  on conflict (game_session_id, participant_id, reason) do nothing;
  perform set_config('timefillergames.majority_score_internal', '0', true);

  return new;
end;
$$;

drop trigger if exists majority_block_direct_score_insert on public.score_entries;
create trigger majority_block_direct_score_insert
before insert on public.score_entries
for each row
execute function private.allow_only_authoritative_majority_score_insert();

drop trigger if exists majority_score_reveal on public.game_sessions;
create trigger majority_score_reveal
after update of state on public.game_sessions
for each row
when (old.game_type = 'majority-match' and new.game_type = 'majority-match')
execute function private.score_majority_reveal();

revoke all on function private.allow_only_authoritative_majority_score_insert() from public;
revoke all on function private.score_majority_reveal() from public;
