create table if not exists public.server_rate_limits (
  bucket_key text primary key,
  window_started_at timestamptz not null default now(),
  request_count integer not null default 0 check (request_count >= 0),
  updated_at timestamptz not null default now()
);

alter table public.server_rate_limits enable row level security;

create or replace function public.consume_server_rate_limit(
  p_bucket_key text,
  p_limit integer,
  p_window_seconds integer
) returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_now timestamptz := clock_timestamp();
  v_row public.server_rate_limits%rowtype;
begin
  if p_bucket_key is null or length(p_bucket_key) < 1 or length(p_bucket_key) > 240 then
    raise exception 'Invalid rate-limit bucket key';
  end if;
  if p_limit < 1 or p_limit > 10000 then
    raise exception 'Invalid rate-limit request limit';
  end if;
  if p_window_seconds < 1 or p_window_seconds > 86400 then
    raise exception 'Invalid rate-limit window';
  end if;

  insert into public.server_rate_limits(bucket_key, window_started_at, request_count, updated_at)
  values (p_bucket_key, v_now, 1, v_now)
  on conflict (bucket_key) do update
  set
    window_started_at = case
      when public.server_rate_limits.window_started_at <= v_now - make_interval(secs => p_window_seconds)
        then v_now
      else public.server_rate_limits.window_started_at
    end,
    request_count = case
      when public.server_rate_limits.window_started_at <= v_now - make_interval(secs => p_window_seconds)
        then 1
      else public.server_rate_limits.request_count + 1
    end,
    updated_at = v_now
  returning * into v_row;

  return v_row.request_count <= p_limit;
end;
$$;

revoke all on function public.consume_server_rate_limit(text, integer, integer) from public;
revoke all on function public.consume_server_rate_limit(text, integer, integer) from anon;
revoke all on function public.consume_server_rate_limit(text, integer, integer) from authenticated;
grant execute on function public.consume_server_rate_limit(text, integer, integer) to service_role;

create index if not exists server_rate_limits_updated_idx
  on public.server_rate_limits(updated_at);

-- Cleanup is operationally safe because expired buckets are recreated on demand.
-- A scheduled cleanup can delete rows older than the longest configured window.
