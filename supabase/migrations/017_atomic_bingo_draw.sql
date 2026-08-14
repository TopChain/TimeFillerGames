-- Commit one Bingo draw and any same-draw winners in a single PostgreSQL transaction.
-- The expected-state compare-and-swap makes retries/double-clicks fail closed instead of
-- overwriting a newer draw. This RPC is server-only.
create or replace function public.commit_bingo_draw(
  p_session_id uuid,
  p_expected_state jsonb,
  p_next_state jsonb,
  p_winner_ids uuid[],
  p_placement integer,
  p_completing_draw_index integer
)
returns boolean
language plpgsql
set search_path = public
as $$
declare
  updated_rows integer;
begin
  if p_placement < 1 or p_completing_draw_index < 0 then
    raise exception 'Invalid Bingo draw placement/index';
  end if;

  update public.game_sessions
  set state = p_next_state
  where id = p_session_id
    and game_type = 'bingo'
    and status = 'active'
    and state = p_expected_state;

  get diagnostics updated_rows = row_count;
  if updated_rows <> 1 then
    return false;
  end if;

  if coalesce(array_length(p_winner_ids, 1), 0) > 0 then
    insert into public.bingo_winners (
      game_session_id,
      participant_id,
      completing_draw_index,
      placement
    )
    select
      p_session_id,
      winner_id,
      p_completing_draw_index,
      p_placement
    from unnest(p_winner_ids) as winner_id
    on conflict (game_session_id, participant_id) do nothing;
  end if;

  return true;
end;
$$;

revoke all on function public.commit_bingo_draw(uuid, jsonb, jsonb, uuid[], integer, integer) from public;
revoke all on function public.commit_bingo_draw(uuid, jsonb, jsonb, uuid[], integer, integer) from anon;
revoke all on function public.commit_bingo_draw(uuid, jsonb, jsonb, uuid[], integer, integer) from authenticated;
grant execute on function public.commit_bingo_draw(uuid, jsonb, jsonb, uuid[], integer, integer) to service_role;
