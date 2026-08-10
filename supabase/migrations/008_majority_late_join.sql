alter table public.participants
  add column if not exists pending_majority_activation boolean not null default false;

create index if not exists participants_pending_majority_idx
  on public.participants(room_id, pending_majority_activation)
  where pending_majority_activation = true and left_at is null;

-- A mid-question Majority Match late join is first seated as spectator, then promoted
-- at the next between-question boundary. Host-created spectators remain false and
-- are never auto-promoted by this mechanism.
