create index if not exists game_sessions_room_id_idx on public.game_sessions(room_id);
create index if not exists bingo_cards_participant_idx on public.bingo_cards(participant_id);
create index if not exists bingo_winners_participant_idx on public.bingo_winners(participant_id);
create index if not exists moderation_events_participant_idx on public.moderation_events(participant_id);
create index if not exists participants_auth_user_idx on public.participants(auth_user_id);

create index if not exists quick_draw_guesses_session_idx on public.quick_draw_guesses(game_session_id);
create index if not exists quick_draw_guesses_participant_idx on public.quick_draw_guesses(participant_id);
create index if not exists quick_draw_guesses_round_idx on public.quick_draw_guesses(game_session_id, round_index, created_at);
create index if not exists quick_draw_guesses_rate_idx on public.quick_draw_guesses(participant_id, created_at desc);
create unique index if not exists quick_draw_one_correct_per_round_idx on public.quick_draw_guesses(game_session_id, round_index, participant_id) where accepted = true;
create index if not exists quick_draw_rounds_artist_idx on public.quick_draw_rounds(artist_participant_id);
create index if not exists score_entries_session_idx on public.score_entries(game_session_id);
create index if not exists score_entries_participant_idx on public.score_entries(participant_id);
create index if not exists submissions_participant_idx on public.submissions(participant_id);
create index if not exists server_rate_limits_updated_idx on public.server_rate_limits(updated_at);
