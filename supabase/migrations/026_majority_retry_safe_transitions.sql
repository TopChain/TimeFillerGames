-- Make Majority Match Host transition retries idempotent without blocking pause/resume.
-- Same-phase/same-round writes while status is unchanged are stale retries and retain
-- the already committed state. Status-changing pause/resume writes remain allowed.

create schema if not exists private;

create or replace function private.guard_majority_state_transition()
returns trigger
language plpgsql
set search_path = private, public
as $$
declare
  old_phase text := coalesce(old.state ->> 'phase', '');
  new_phase text := coalesce(new.state ->> 'phase', '');
  old_round integer := coalesce(nullif(old.state ->> 'roundIndex', '')::integer, 0);
  new_round integer := coalesce(nullif(new.state ->> 'roundIndex', '')::integer, 0);
begin
  if new.game_type <> 'majority-match' then
    return new;
  end if;

  if old_phase = new_phase and old_round = new_round then
    if old.status = new.status then
      -- Duplicate reveal/advance state write: preserve the first committed version.
      new.state := old.state;
    end if;
    return new;
  end if;

  if new_phase = 'ended' then
    return new;
  end if;

  if old_phase = 'answering' and new_phase = 'revealing' and new_round = old_round then
    return new;
  end if;

  if old_phase = 'revealing' and new_phase = 'answering' and new_round = old_round + 1 then
    return new;
  end if;

  raise exception 'Invalid Majority Match state transition';
end;
$$;

drop trigger if exists majority_guard_state_transition on public.game_sessions;
create trigger majority_guard_state_transition
before update of state on public.game_sessions
for each row
when (new.game_type = 'majority-match')
execute function private.guard_majority_state_transition();

revoke all on function private.guard_majority_state_transition() from public;
