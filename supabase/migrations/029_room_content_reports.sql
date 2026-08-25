-- Release 1 moderation reports remain server-mediated. Participants never write this table directly.
alter table public.moderation_events
  drop constraint if exists moderation_events_action_check;

alter table public.moderation_events
  add constraint moderation_events_action_check
  check (action in (
    'role_changed',
    'participant_removed',
    'nickname_overridden',
    'nickname_unlocked',
    'content_reported'
  ));

create index if not exists moderation_events_report_target_idx
  on public.moderation_events(room_id, participant_id, created_at desc)
  where action = 'content_reported';
