-- Backstop read-then-write room-join checks against concurrent requests.
-- The canonical active-identity index already existed in the live project; use the
-- same name here so clean environments reproduce the live schema without duplicates.
create unique index if not exists participants_one_active_identity_per_room_idx
  on public.participants(room_id, auth_user_id)
  where auth_user_id is not null and left_at is null;

create unique index if not exists participants_active_nickname_ci_idx
  on public.participants(room_id, lower(nickname))
  where left_at is null;
