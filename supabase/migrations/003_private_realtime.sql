alter table public.participants
  add column if not exists auth_user_id uuid references auth.users(id) on delete set null,
  add column if not exists left_at timestamptz;

create index if not exists participants_room_auth_user_idx on public.participants(room_id, auth_user_id);
create unique index if not exists participants_one_active_identity_per_room_idx
  on public.participants(room_id, auth_user_id)
  where auth_user_id is not null and left_at is null;

-- All production room reads are member-scoped. Remove the earlier prototype policy
-- that allowed unauthenticated users to query active room rows directly.
drop policy if exists "public room lookup by active join code" on public.rooms;

grant select on public.rooms, public.participants, public.game_sessions, public.submissions, public.score_entries to authenticated;

create policy "room members can read room"
on public.rooms for select to authenticated
using (
  host_user_id = (select auth.uid())
  or exists (
    select 1 from public.participants p
    where p.room_id = rooms.id
      and p.auth_user_id = (select auth.uid())
      and p.left_at is null
  )
);

create policy "room members can read participant roster"
on public.participants for select to authenticated
using (
  auth_user_id = (select auth.uid())
  or exists (
    select 1 from public.rooms r
    where r.id = participants.room_id
      and (
        r.host_user_id = (select auth.uid())
        or exists (
          select 1 from public.participants me
          where me.room_id = r.id
            and me.auth_user_id = (select auth.uid())
            and me.left_at is null
        )
      )
  )
);

create policy "room members can read game sessions"
on public.game_sessions for select to authenticated
using (
  exists (
    select 1 from public.rooms r
    where r.id = game_sessions.room_id
      and (
        r.host_user_id = (select auth.uid())
        or exists (
          select 1 from public.participants p
          where p.room_id = r.id
            and p.auth_user_id = (select auth.uid())
            and p.left_at is null
        )
      )
  )
);

create policy "participant can read own submissions"
on public.submissions for select to authenticated
using (
  exists (
    select 1 from public.participants p
    where p.id = submissions.participant_id
      and p.auth_user_id = (select auth.uid())
      and p.left_at is null
  )
  or exists (
    select 1
    from public.game_sessions gs
    join public.rooms r on r.id = gs.room_id
    where gs.id = submissions.game_session_id
      and r.host_user_id = (select auth.uid())
  )
);

create policy "participant can read own scores"
on public.score_entries for select to authenticated
using (
  exists (
    select 1 from public.participants p
    where p.id = score_entries.participant_id
      and p.auth_user_id = (select auth.uid())
      and p.left_at is null
  )
  or exists (
    select 1
    from public.game_sessions gs
    join public.rooms r on r.id = gs.room_id
    where gs.id = score_entries.game_session_id
      and r.host_user_id = (select auth.uid())
  )
);

-- Realtime Authorization: use private topics named room:<JOIN_CODE>.
-- Players can receive room broadcasts and publish/listen to Presence.
create policy "room members can receive realtime"
on realtime.messages for select to authenticated
using (
  realtime.messages.extension in ('broadcast','presence')
  and exists (
    select 1 from public.rooms r
    where ('room:' || r.join_code) = (select realtime.topic())
      and r.status <> 'closed'
      and (
        r.host_user_id = (select auth.uid())
        or exists (
          select 1 from public.participants p
          where p.room_id = r.id
            and p.auth_user_id = (select auth.uid())
            and p.left_at is null
        )
      )
  )
);

create policy "room members can publish presence"
on realtime.messages for insert to authenticated
with check (
  realtime.messages.extension = 'presence'
  and exists (
    select 1 from public.rooms r
    where ('room:' || r.join_code) = (select realtime.topic())
      and r.status <> 'closed'
      and (
        r.host_user_id = (select auth.uid())
        or exists (
          select 1 from public.participants p
          where p.room_id = r.id
            and p.auth_user_id = (select auth.uid())
            and p.left_at is null
        )
      )
  )
);

-- Browser clients never author authoritative game events. A signed-in Host may
-- broadcast non-authoritative UI notices; authoritative game transitions remain
-- server/database controlled.
create policy "host can publish room broadcast"
on realtime.messages for insert to authenticated
with check (
  realtime.messages.extension = 'broadcast'
  and exists (
    select 1 from public.rooms r
    where ('room:' || r.join_code) = (select realtime.topic())
      and r.host_user_id = (select auth.uid())
      and r.status <> 'closed'
  )
);
