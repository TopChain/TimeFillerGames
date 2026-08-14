alter table public.rooms
  add column if not exists host_last_seen_at timestamptz not null default now();

alter table public.rooms
  add column if not exists host_transfer_generation integer not null default 0
  check (host_transfer_generation >= 0);

create index if not exists rooms_host_last_seen_idx
  on public.rooms(host_last_seen_at)
  where status <> 'closed';
