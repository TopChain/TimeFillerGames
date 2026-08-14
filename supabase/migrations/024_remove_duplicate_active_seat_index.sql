-- Compatibility cleanup for live environments that briefly received the redundant
-- participants_one_active_auth_seat_idx alias before the canonical migration name was restored.
drop index if exists public.participants_one_active_auth_seat_idx;
