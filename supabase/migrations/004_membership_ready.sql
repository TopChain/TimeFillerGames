alter table public.participants
  add column if not exists ready boolean not null default false;

-- Security-definer helpers keep membership checks out of recursive RLS paths.
create or replace function public.is_room_host(target_room_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1 from public.rooms r
    where r.id = target_room_id
      and r.host_user_id = auth.uid()
      and r.status <> 'closed'
  );
$$;

create or replace function public.is_room_member(target_room_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select public.is_room_host(target_room_id)
    or exists (
      select 1 from public.participants p
      where p.room_id = target_room_id
        and p.auth_user_id = auth.uid()
        and p.left_at is null
    );
$$;

create or replace function public.can_access_room_topic(target_topic text, host_only boolean default false)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.rooms r
    where ('room:' || r.join_code) = target_topic
      and r.status <> 'closed'
      and (
        (host_only and r.host_user_id = auth.uid())
        or (
          not host_only
          and (
            r.host_user_id = auth.uid()
            or exists (
              select 1 from public.participants p
              where p.room_id = r.id
                and p.auth_user_id = auth.uid()
                and p.left_at is null
            )
          )
        )
      )
  );
$$;

revoke all on function public.is_room_host(uuid) from public;
revoke all on function public.is_room_member(uuid) from public;
revoke all on function public.can_access_room_topic(text, boolean) from public;
grant execute on function public.is_room_host(uuid) to authenticated;
grant execute on function public.is_room_member(uuid) to authenticated;
grant execute on function public.can_access_room_topic(text, boolean) to authenticated;

-- Replace the first-pass policies with non-recursive, least-privilege policies.
drop policy if exists "room members can read room" on public.rooms;
drop policy if exists "room members can read participant roster" on public.participants;
drop policy if exists "room members can read game sessions" on public.game_sessions;
drop policy if exists "participant can read own submissions" on public.submissions;
drop policy if exists "participant can read own scores" on public.score_entries;
drop policy if exists "room members can receive realtime" on realtime.messages;
drop policy if exists "room members can publish presence" on realtime.messages;
drop policy if exists "host can publish room broadcast" on realtime.messages;

create policy "members read room"
on public.rooms for select to authenticated
using (public.is_room_member(id));

-- Hosts can see the full roster. Players/spectators can read only their own row.
create policy "host full roster or own participant row"
on public.participants for select to authenticated
using (
  auth_user_id = auth.uid()
  or public.is_room_host(room_id)
);

create policy "members read game sessions"
on public.game_sessions for select to authenticated
using (public.is_room_member(room_id));

create policy "own submissions or host"
on public.submissions for select to authenticated
using (
  exists (
    select 1 from public.participants p
    where p.id = submissions.participant_id
      and p.auth_user_id = auth.uid()
      and p.left_at is null
  )
  or exists (
    select 1 from public.game_sessions gs
    where gs.id = submissions.game_session_id
      and public.is_room_host(gs.room_id)
  )
);

create policy "own scores or host"
on public.score_entries for select to authenticated
using (
  exists (
    select 1 from public.participants p
    where p.id = score_entries.participant_id
      and p.auth_user_id = auth.uid()
      and p.left_at is null
  )
  or exists (
    select 1 from public.game_sessions gs
    where gs.id = score_entries.game_session_id
      and public.is_room_host(gs.room_id)
  )
);

create policy "members receive private room realtime"
on realtime.messages for select to authenticated
using (
  realtime.messages.extension in ('broadcast','presence')
  and public.can_access_room_topic((select realtime.topic()), false)
);

create policy "members publish presence"
on realtime.messages for insert to authenticated
with check (
  realtime.messages.extension = 'presence'
  and public.can_access_room_topic((select realtime.topic()), false)
);

create policy "host publishes room broadcast"
on realtime.messages for insert to authenticated
with check (
  realtime.messages.extension = 'broadcast'
  and public.can_access_room_topic((select realtime.topic()), true)
);
