create table if not exists public.privacy_requests (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid not null,
  request_kind text not null check (request_kind in ('erase_account')),
  request_source text not null check (request_source in ('app','web')),
  status text not null default 'pending' check (status in ('pending','processing','completed','cancelled')),
  requested_at timestamptz not null default now(),
  completed_at timestamptz
);

alter table public.privacy_requests enable row level security;

create unique index if not exists privacy_requests_one_open_per_user_idx
  on public.privacy_requests(auth_user_id, request_kind)
  where status in ('pending','processing');

create index if not exists privacy_requests_status_requested_idx
  on public.privacy_requests(status, requested_at);

grant select, insert on public.privacy_requests to authenticated;

create policy "users create own privacy request"
  on public.privacy_requests
  for insert to authenticated
  with check (
    auth_user_id = (select auth.uid())
    and request_kind = 'erase_account'
    and status = 'pending'
  );

create policy "users read own privacy requests"
  on public.privacy_requests
  for select to authenticated
  using (auth_user_id = (select auth.uid()));
