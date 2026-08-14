-- Server routes and trusted Edge Functions use service_role for application
-- persistence. RLS bypass does not replace PostgreSQL object privileges, so
-- reproduce only the privileges Release 1 needs instead of granting access to
-- every current or future object in these schemas.
grant usage on schema public, private to service_role;

grant select, insert, update, delete on table
  public.rooms,
  public.participants,
  public.game_sessions,
  public.submissions,
  public.score_entries,
  public.content_packs,
  public.player_question_history,
  public.game_results,
  public.bingo_cards,
  public.bingo_winners,
  public.quick_draw_rounds,
  public.quick_draw_strokes,
  public.quick_draw_guesses,
  public.moderation_events,
  public.server_rate_limits,
  public.privacy_requests
to service_role;

grant execute on function
  private.bingo_card_has_line(jsonb, jsonb, integer),
  private.guard_bingo_draw_transition(),
  private.allow_only_authoritative_bingo_winner_insert(),
  private.commit_bingo_winners_from_state(),
  private.allow_only_authoritative_quick_draw_score_insert(),
  private.score_accepted_quick_draw_guess(),
  private.score_revealed_quick_draw_artist(),
  private.allow_only_authoritative_majority_score_insert(),
  private.score_majority_reveal(),
  private.dedupe_quick_draw_round_insert(),
  private.canonicalize_quick_draw_session_state(),
  private.guard_majority_state_transition()
to service_role;
