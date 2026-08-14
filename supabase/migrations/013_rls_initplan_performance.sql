drop policy if exists "host full roster or own participant row" on public.participants;
create policy "host full roster or own participant row" on public.participants for select to authenticated
using (auth_user_id = (select auth.uid()) or private.is_room_host(room_id));

drop policy if exists "own submissions or host" on public.submissions;
create policy "own submissions or host" on public.submissions for select to authenticated
using (
  exists (
    select 1 from public.participants p
    where p.id = submissions.participant_id
      and p.auth_user_id = (select auth.uid())
      and p.left_at is null
  )
  or exists (
    select 1 from public.game_sessions gs
    where gs.id = submissions.game_session_id
      and private.is_room_host(gs.room_id)
  )
);

drop policy if exists "own scores or host" on public.score_entries;
create policy "own scores or host" on public.score_entries for select to authenticated
using (
  exists (
    select 1 from public.participants p
    where p.id = score_entries.participant_id
      and p.auth_user_id = (select auth.uid())
      and p.left_at is null
  )
  or exists (
    select 1 from public.game_sessions gs
    where gs.id = score_entries.game_session_id
      and private.is_room_host(gs.room_id)
  )
);

drop policy if exists "participant reads own bingo card" on public.bingo_cards;
create policy "participant reads own bingo card" on public.bingo_cards for select to authenticated
using (
  exists (
    select 1 from public.participants p
    where p.id = bingo_cards.participant_id
      and p.auth_user_id = (select auth.uid())
      and p.left_at is null
  )
);
