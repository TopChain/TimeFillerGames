update public.rooms
set allow_custom_photos = false
where allow_custom_photos = true;

alter table public.rooms
  drop constraint if exists rooms_release1_custom_photos_disabled;

alter table public.rooms
  add constraint rooms_release1_custom_photos_disabled
  check (allow_custom_photos = false);
