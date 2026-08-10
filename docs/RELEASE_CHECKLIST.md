# Release 1 Publication Checklist

Source of truth: Product Plan v1.0 + Brand & Product CI Guidelines v1.0.

## Product / UX
- [x] Time-first 3 / 5 / 8 / 10 model encoded.
- [x] Five-game portfolio and R1/R1.1 scope encoded.
- [x] Host/Player semantic role system encoded.
- [x] Six locale identifiers and baseline strings encoded.
- [x] Universal player-readiness logic and ranking ties tested.
- [x] Interactive Host flow: time/context → library → configuration → room → lobby → play → results.
- [x] Participant identity flow: join → locale → 60-avatar catalog → generated nickname → lobby → play → result.
- [x] PIN + direct-link join flow.
- [x] Host lobby generates the direct join QR locally and provides copy-link fallback.
- [ ] Test QR camera scanning on the supported iPhone/Android device matrix and production/staging origin.
- [x] Keep-room Replay / Change Game flow after results.
- [x] Reconnect grace period, heartbeat, anonymous session identity and seat-token recovery foundation.
- [x] Spectator role foundation and game-aware audience behavior.
- [ ] Co-host transfer / Host disconnect recovery.
- [x] Basic Host seat moderation: move participant ↔ spectator in lobby and remove a participant with confirmation.
- [x] Host nickname override/lock with Classroom-safe structural validation, duplicate-name disambiguation and unlock control.
- [x] Host moderation drawer includes a recent server-side audit feed for implemented role/removal/nickname actions.
- [ ] Mute/report/profanity semantics, moderation-retention policy and abuse-operational workflow.

## Release 1 games
### Bingo
- [x] Standard Number Bingo candidate selection: 3 cards, Host timer, server auto-assignment and board lock.
- [x] Standard Number Bingo server draw lifecycle, automatic marking, one-line winner validation and same-draw shared placement.
- [x] People Bingo 5×5 hard minimum of 25 unique active participants.
- [x] People Bingo identity cells: avatar + display name, server identity draws and automatic marking.
- [x] People Bingo cards prevent duplicate participant identities within one 5×5 card.
- [x] Larger People Bingo boards disabled from Release 1 UI.
- [ ] People Bingo >25 participant subset/draw-pool fairness study with real sessions before public fairness claims.
- [ ] People Bingo 5×5 phone readability validation across the supported device matrix.

### Majority Match
- [x] Minimum-player rule, private prediction, no speed bonus and tied-majority full-credit rule.
- [x] Server question timer, aggregate reveal, optional percentages, scoring and ranking privacy.
- [x] Host category/question-count configuration and starter engineering question bank.
- [ ] Curated launch question bank + content QA for Classroom/Friends/Family/Workplace/General.
- [x] Default late-join boundary: mid-question joins queue safely as spectators, activate between questions when capacity permits, and last-question joins carry to the next lobby instead of entering final rankings.

### Quick Draw & Guess
- [x] Artist rotation fixed at game start; random / join-order selection.
- [x] Server-only secret word, category/difficulty settings and starter engineering word bank.
- [x] Touch/mouse/stylus drawing canvas with normalized strokes, batching and synchronized clear ordering.
- [x] Guess submission, normalized conservative acceptance, per-player guess rate limiting and stroke flood limiting.
- [x] Optional audience guessing and Host-only moderation queue mode.
- [x] Guesser time-component scoring option and artist success-based scoring foundation.
- [x] Late joiners can remain out of the current artist sequence while audience/spectator guessing follows room settings.
- [ ] Replace polling-based drawing updates with the final low-latency transport if device/weak-Wi-Fi testing shows it is required.
- [ ] Decide fuzzy spelling tolerance from usability/content testing; do not broaden acceptance without evidence.
- [x] Server-authoritative pause/resume freezes game writes and restores card/answer/drawing deadlines by the exact paused duration; pause timing rules are covered by CI tests.
- [ ] Full moderation/profanity controls before any public guess stream is enabled.

## CI / accessibility
- [x] Approved semantic color tokens.
- [x] Host Indigo / Player Teal defaults.
- [x] Reduced-motion CSS baseline.
- [x] 44px primary control minimum.
- [x] People Bingo marked cells include a check indicator instead of color-only state.
- [x] Automated CI: TypeScript, Release 1 rule tests and Next.js production build.
- [x] Global keyboard focus-visible, increased-contrast, forced-colors and text-size resilience CSS hardening.
- [x] Persisted Light / Dark / System appearance control using semantic tokens.
- [ ] Six approved branded color themes; exact approved theme definitions are not yet encoded in the repository and must not be invented.
- [ ] Final stopwatch/controller SVG and PWA icons supplied from approved brand asset.
- [ ] Full keyboard and screen-reader audit on real browsers/assistive technology.
- [ ] Text-scaling and contrast audit on all completed screens.
- [ ] Complete all six launch-language interface strings; several Release 1 game surfaces are still English-only.

## Platform / security
- [x] Next.js + TypeScript web-first PWA release-candidate architecture.
- [x] Supabase room/participant/game persistence model with restrictive RLS baseline.
- [x] Signed-in Host magic-link flow and invisible anonymous Player auth foundation.
- [x] Room-specific authorization for room/game write APIs added to current Release 1 routes.
- [x] Private room Realtime authorization boundary and heartbeat/reconnect foundation.
- [x] Host-only seat/nickname moderation APIs.
- [x] Atomic database-backed rate-limit buckets added for high-impact room creation, join, Host room-control and Host moderation writes; Quick Draw retains specialized event flood limits.
- [ ] Expand throttling/abuse policy if staging/load testing identifies additional write endpoints or different thresholds.
- [ ] Production/staging Supabase project and secrets configured outside local placeholders.
- [ ] Host disconnect transfer/co-host recovery and forced-close behavior.
- [ ] Presence/reconnect load tests and stale-seat cleanup under realistic concurrency.
- [x] Moderation-event storage foundation for implemented Host role/removal/nickname actions.
- [ ] Transactional audit guarantees, retention rules and any additional event classes required by final moderation policy.

## Content / policy / legal
- [ ] Curated Release 1 Majority Match content QA.
- [ ] Curated Release 1 Quick Draw word bank + context/difficulty QA.
- [ ] Profanity/harassment filter and moderation operations.
- [ ] Privacy Policy and Terms reviewed for launch jurisdictions and intended classroom/children use.
- [ ] Uploaded-photo retention/moderation policy before enabling that feature in production.
- [ ] Accessibility statement / support contact.

## Deployment / QA
- [ ] Production/staging domain and hosting target configured.
- [ ] Preview deployment for every PR.
- [ ] Apply all Supabase migrations to staging and run end-to-end multi-browser room tests.
- [ ] iPhone + Android + laptop/projector device matrix completed.
- [ ] Weak-Wi-Fi / reconnect tests completed.
- [ ] Quick Draw stroke synchronization / clear / guess-flood tests completed on real networks.
- [ ] Load test target completed before public capacity claims.
- [ ] Closed beta validates actual vs estimated duration for 3 / 5 / 8 / 10-minute sessions.
- [ ] Final production smoke test and rollback plan.

## Publication gate
Do **not** call the product production-ready until every unchecked item required for Release 1 is either completed or explicitly deferred with an approved release decision. Word Challenge and Math Challenge are Release 1.1 and are not required to prove Release 1.
