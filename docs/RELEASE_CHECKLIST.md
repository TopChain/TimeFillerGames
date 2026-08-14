# Release 1 Publication Checklist

Source of truth: Product Plan v1.0 + Brand & Product CI Guidelines v1.0. This file distinguishes completed code/build gates from external deployment, device, legal and store-account gates.

## Product / UX
- [x] Time-first 3 / 5 / 8 / 10 model encoded.
- [x] Release 1 public shelf exposes Bingo, Majority Match, and Quick Draw & Guess only; Word/Math remain Release 1.1.
- [x] Host/Player semantic role system encoded.
- [x] Six launch UI locale identifiers: en / zh-Hant / zh-Hans / es / ja / ko.
- [x] Landing shell, Host setup/lobby/results, Host game-control panels, Player join/identity/lobby, and Player Release 1 game/status/results use six-language dictionaries.
- [x] Personal UI language is separate from Host-selected room/game content language.
- [x] Interactive Host flow: time/context → game → configuration → room → lobby → play → results.
- [x] Participant identity flow: join → locale → 60-avatar catalog → generated nickname → lobby → play → result.
- [x] PIN + direct-link + local QR join flow.
- [x] Keep-room Replay / Change Game flow.
- [x] Reconnect grace, heartbeat, anonymous seat identity, and seat recovery foundation.
- [x] Spectator role foundation and game-aware audience behavior.
- [x] Explicit single co-host recovery: Host heartbeat, grace period, verified recovery identity, race-safe ownership transfer, automatic pause, recovered Host console.
- [x] Co-host remains an active player across all Release 1 games, including Ready-state control.
- [x] Host moderation: participant ↔ spectator, removal confirmation, nickname override/lock, duplicate-name disambiguation, moderation audit feed.
- [x] Dedicated child-directed `Kids` context removed from Release 1 UI and rejected server-side pending separate children/privacy review.
- [x] Uploaded participant photos removed from Release 1 UI/API and database-enforced off; built-in avatars remain the launch identity path.
- [x] Automated Release 1 policy guards prevent accidental reintroduction of Kids mode, custom photos, Release 1.1 public games, or public Quick Draw guess streaming.
- [ ] Real iPhone/Android QR scan validation against the staging/production HTTPS origin.

## Release 1 games
### Standard Number Bingo
- [x] Three candidate cards, timed choice, server auto-assignment, lock.
- [x] Server draw lifecycle, automatic marking, one-line winner validation, same-draw shared placement.
- [x] Server-authoritative pause/resume preserves exact state/deadlines.

### People Bingo 5×5
- [x] Hard minimum: 25 unique active participants.
- [x] Avatar + display-name identity cells; server identity draws and automatic marking.
- [x] No duplicate participant within one card.
- [x] Larger boards disabled for Release 1.
- [ ] Real-session >25 participant subset/fairness validation before any public fairness/capacity claim.
- [ ] 5×5 phone readability validation across supported device sizes.

### Majority Match
- [x] Private prediction, no speed bonus, tied-majority full-credit rule.
- [x] Server timer/reveal/scoring/ranking privacy and safe late-join boundaries.
- [x] Curated Release 1 bank: 50 neutral prompts, 10 each across Classroom/Friends/Family/Workplace/General.
- [x] Automated content integrity/coverage tests.

### Quick Draw & Guess
- [x] Fixed artist rotation; random / join-order selection.
- [x] Server-only secret words, category/difficulty configuration.
- [x] Curated Release 1 bank: 144 words with at least 12 in every category × difficulty bucket.
- [x] Touch/mouse/stylus canvas, normalized/batched ordered strokes and synchronized clear.
- [x] Guess/stroke flood controls and conservative normalized acceptance.
- [x] Optional audience guessing and server scoring.
- [x] Public/moderated guess stream is blocked server-side for Release 1 and removed from the production Host UI; guesses remain private until accepted.
- [x] Server-authoritative pause/resume preserves drawing deadlines.
- [ ] Real-network drawing/clear/guess-flood validation; replace polling transport only if evidence shows it is required.
- [ ] Fuzzy spelling tolerance remains deferred unless usability/content evidence supports broadening acceptance.

## CI / framework / native / accessibility
- [x] Approved semantic brand tokens and Host Indigo / Player Teal defaults.
- [x] Light / Dark / System preference using semantic tokens.
- [x] Reduced motion, focus-visible, increased-contrast, forced-colors, text-size resilience baseline.
- [x] 44px primary interaction minimum and non-color-only Bingo marking.
- [x] Deterministic `package-lock.json` and `npm ci` across web/mobile/native CI.
- [x] Framework upgraded to Next.js 16.3.1 + React 19.2 + TypeScript 5.9; Node engine requires 20.9+ and CI uses Node 24.
- [x] Production dependency security gate: `npm audit --omit=dev --audit-level=high` passes; the earlier vulnerable Next 15 PostCSS/Sharp chain was upgraded instead of suppressed.
- [x] Web/server CI: dependency audit + TypeScript + rule/content/localization/policy/PWA tests + production Next.js build.
- [x] Mobile CI: bundled Vite/Capacitor client build.
- [x] GitHub Actions upgraded to the Node 24 generation: `checkout@v6`, `setup-node@v6`, `setup-java@v5`, `upload-artifact@v7`.
- [x] Bounded Dependabot maintenance for npm weekly and GitHub Actions monthly; no auto-merge.
- [x] Android native CI verifies min SDK 26 / compile+target API 36, deep link, HTTPS-only transport, Release 1 version and branded vector launcher; debug APK and Google Play release AAB both compile successfully.
- [x] Android Play-format AAB artifact retained by GitHub Actions after successful native run.
- [x] iOS native validation runs automatically on relevant PR changes; generated project, camera permission, deep link, Release 1 version and unsigned Xcode simulator build all pass on macOS.
- [x] App-level `PrivacyInfo.xcprivacy` is valid, attached to the generated iOS Xcode App resource phase, and proven by CI to be bundled at the root of the compiled `.app`.
- [x] Master Release 1 stopwatch/controller SVG and 1024px raster app-icon source derived from approved v1 identity rules; PWA/native packaging no longer uses generic Capacitor branding.
- [x] PWA manifest includes explicit 192×192 and 512×512 PNG install icons plus the scalable maskable SVG; tests verify manifest entries and PNG signatures.
- [x] First-party `/accessibility` page implemented and linked from web/native footer.
- [x] Six named optional branded themes are explicitly deferred from first store build because v1.0 provides names but not exact palette definitions. Release 1 ships approved Light/Dark/System semantic CI rather than inventing colors.
- [ ] Full real keyboard/screen-reader/text-scale/contrast audit on supported browsers/devices.

## Platform / security / privacy
- [x] Next.js + TypeScript web/PWA + Capacitor native architecture.
- [x] Hosted API boundary for native clients; remaining relative API calls are bridged to configured HTTPS backend.
- [x] Conservative production browser headers: no MIME sniffing, frame denial, strict referrer policy, permissions policy, HSTS baseline.
- [x] Supabase room/participant/game persistence with restrictive RLS and private realtime boundary.
- [x] Supabase project remains ACTIVE_HEALTHY under organization **TopChain AI Lab** with the same project reference and database endpoint.
- [x] Live Supabase schema security/performance advisors have no warning-level findings; only expected informational server-only/unused-index notices remain before traffic.
- [x] Repository migrations 001–016 reproduce the live Release 1 security/recovery/privacy state, including restored `005_release11_content_foundation.sql` for the dormant server-only Word/Math tables that existed outside tracked migration history.
- [x] Host magic-link auth and invisible anonymous Player auth.
- [x] Native Host magic-link deep-link callback and single shared native Supabase session/client.
- [x] Database-backed rate limits for high-impact room/join/control/moderation operations plus Quick Draw event flood limits.
- [x] Authenticated account-erasure Edge Function is live and source-versioned; it closes hosted rooms, anonymizes remaining participant records, clears account-linked moderation data, and deletes the Auth identity.
- [x] In-app Privacy control initiates permanent account/data deletion for both permanent and temporary authenticated identities.
- [x] Public `/privacy`, `/privacy-policy`, `/terms`, `/support`, and `/accessibility` routes exist; legal/account/accessibility/support links are exposed in web and native shells.
- [x] Expired-room retention service + authenticated daily Vercel Cron route/config are source-ready.
- [x] Strict server release environment validator requires real HTTPS app/Supabase origins, publishable/server credentials, and a strong Cron secret.
- [x] Strict mobile release environment validator rejects localhost/example/non-HTTPS/missing public Supabase settings.
- [x] One-command `npm run release:preflight` combines production env validation, TypeScript/tests/build, and release mobile bundle build.
- [x] One-command `npm run staging:smoke` verifies health/legal/support/accessibility/account surfaces after an HTTPS deployment exists.
- [x] Source-control scan found no committed live Supabase project reference, service-role secret, or JWT-like credential pattern.
- [ ] End-to-end account-erasure validation against staging/native device.
- [ ] Load/reconnect/stale-seat tests under realistic concurrency.

## Store packaging / submission preparation
- [x] Stable bundle/application ID: `com.timefillergames.app`.
- [x] Release version baseline: 1.0.0 (build/versionCode 1).
- [x] Android target API 36 release configuration.
- [x] Store metadata/privacy/data-safety working drafts versioned and refreshed in `docs/`.
- [x] Privacy/account-deletion paths implemented for Apple/Google review requirements.
- [x] First-party Support, Privacy Policy, Terms, Account/Data and Accessibility URL paths are implemented.
- [x] Apple app privacy manifest source is versioned and native CI verifies it is in the built app bundle.
- [ ] Production HTTPS domain/hosting deployment and environment secrets. Connected Vercel team currently has no project; the connector's deployment action remains internally invalid because its visible schema omits required `target`, `name`, and `files` fields.
- [ ] Domain purchase if desired. `timefillergames.com` was available when checked; purchase requires explicit account-owner payment approval.
- [ ] Real support email/contact identity for store listing/support page. Do not invent a personal/company contact.
- [ ] Final legal/account-holder review of Privacy Policy and Terms; governing law/age terms must not be invented by engineering.
- [ ] Apple Developer account, certificates/signing, App Store Connect/TestFlight setup.
- [ ] Google Play Console app, Play App Signing/keystore, testing track and signed AAB upload.
- [ ] Production screenshots captured from the real staged/native product at required store sizes.
- [ ] App Store / Play age-rating and target-audience questionnaires completed by the account owner using actual product behavior; Release 1 does not market itself as child-directed.

## Real-world QA before public release
- [ ] Staging deployment smoke test + `/api/health` verification.
- [ ] Apply migrations to a clean staging database and run end-to-end multi-browser rooms.
- [ ] iPhone + Android + laptop/projector device matrix.
- [ ] Weak-Wi-Fi / reconnect / Host recovery tests.
- [ ] People Bingo readability/fairness sessions.
- [ ] Quick Draw real-network synchronization tests.
- [ ] Load test before public capacity claims.
- [ ] Closed beta validates actual 3 / 5 / 8 / 10-minute pacing.
- [ ] Final production smoke test and rollback plan.

## Publication gate
Do not call TimeFillerGames production-ready until the remaining unchecked external deployment, real-device QA, legal/account, signing, beta, screenshot, and store-console items are completed. Code-only Release 1 blockers should be fixed on this branch rather than deferred silently.
