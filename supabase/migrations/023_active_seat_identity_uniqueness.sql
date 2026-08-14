-- Backstop read-then-write room-join checks against concurrent requests.
create unique index if not exists participants_one_active_auth_seat_idx
  on public.participants(room_id, auth_user_id)
  where auth_user_id is not null and left_at is null;

create unique index if not exists participants_active_nickname_ci_idx
  on public.participants(room_id, lower(nickname))
  where left_at is null;
