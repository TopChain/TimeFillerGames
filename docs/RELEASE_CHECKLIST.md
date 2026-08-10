# Release 1 Publication Checklist

Source of truth: Product Plan v1.0 + Brand & Product CI Guidelines v1.0.

## Product / UX
- [x] Time-first 3 / 5 / 8 / 10 model encoded.
- [x] Five-game portfolio and R1/R1.1 scope encoded.
- [x] Host/Player semantic role system encoded.
- [x] Six locale identifiers and baseline strings encoded.
- [x] Universal player-readiness logic and ranking ties tested.
- [ ] Complete interactive Host flow: context → library → detail → config → room → lobby → results.
- [ ] Complete participant identity flow: locale → 60-avatar catalog → generated nickname → lobby.
- [ ] PIN + QR + direct-link production join flow.
- [ ] Keep-room game switching after results.
- [ ] Reconnect grace period and session-token identity recovery.
- [ ] Spectator/co-host permission states.

## Release 1 games
- [x] Core Bingo draw/winner rules implemented and tested.
- [x] Majority Match tied-majority rule implemented and tested.
- [x] Quick Draw normalization and score primitives implemented and tested.
- [ ] Bingo candidate-selection UI, auto-assignment timeout and board lock.
- [ ] Bingo server draw lifecycle + auto-mark UI + simultaneous podium handling.
- [ ] People Bingo 5×5 unique-participant readiness and fairness validation.
- [ ] Majority Match question bank, timers, percentages and late-join boundary.
- [ ] Quick Draw canvas synchronization, stroke batching, flood/rate limits and moderation.

## CI / accessibility
- [x] Approved semantic color tokens.
- [x] Host Indigo / Player Teal defaults.
- [x] Reduced-motion CSS baseline.
- [x] 44px primary control minimum.
- [ ] Final stopwatch/controller SVG and PWA icons supplied from approved brand asset.
- [ ] Full keyboard and screen-reader audit.
- [ ] Text-scaling and contrast audit on all completed screens.
- [ ] Six approved themes + Light/Dark/System.

## Platform / security
- [x] Next.js + TypeScript release-candidate scaffold.
- [x] Supabase data model and restrictive RLS baseline.
- [x] CI workflow for typecheck/test/build.
- [ ] Production Supabase project and secrets configured.
- [ ] Server actions/route handlers enforce room-specific authorization for every write.
- [ ] Rate limiting and abuse controls.
- [ ] Host account/authentication production flow or explicit Quick Host beta policy.
- [ ] Presence/reconnect implementation and load tests.
- [ ] Audit logs / moderation events as required.

## Content / policy / legal
- [ ] Curated Release 1 Majority Match content QA.
- [ ] Curated Release 1 Quick Draw word bank + context tags.
- [ ] Profanity/harassment filter and moderation operations.
- [ ] Privacy Policy and Terms reviewed for launch jurisdictions and intended classroom/children use.
- [ ] Uploaded-photo retention/moderation policy before enabling that feature.
- [ ] Accessibility statement / support contact.

## Deployment / QA
- [ ] Production domain and hosting target configured.
- [ ] Preview deployment for every PR.
- [ ] iPhone + Android + laptop/projector device matrix completed.
- [ ] Weak-Wi-Fi / reconnect tests completed.
- [ ] Load test target (planning baseline: classroom/event scale) completed before public capacity claims.
- [ ] Closed beta validates actual vs estimated duration.
- [ ] Final production smoke test and rollback plan.

## Publication gate
Do **not** call the product production-ready until every unchecked item required for Release 1 is either completed or explicitly deferred with an approved release decision. Word Challenge and Math Challenge are R1.1 and are not required to prove Release 1.
