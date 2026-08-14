-- The authoritative Bingo trigger model supersedes the earlier experimental RPC.
-- Remove the unused public function so launch carries the smallest privileged surface.
drop function if exists public.commit_bingo_draw(uuid, jsonb, jsonb, uuid[], integer, integer);
