# Release 1 Publication Checklist

Source of truth: Product Plan v1.0 + Brand & Product CI Guidelines v1.0. This file distinguishes completed code/build gates from external deployment, device, legal, account, payment and store-console gates.

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
- [ ] Real iPhone/Android QR scan validation against the deployed HTTPS origin.

## Release 1 games
### Standard Number Bingo
- [x] Three candidate cards, timed choice, server auto-assignment, lock.
- [x] Server draw lifecycle, automatic marking, one-line winner validation, same-draw shared placement.
- [x] Server-authoritative pause/resume preserves exact state/deadlines.
- [x] Database draw-history guard rejects stale/non-monotonic draw state.
- [x] Winner rows are derived transactionally from the committed draw state; direct/retried winner inserts are suppressed.
- [x] Concurrent/stale Host draw API retry returns the authoritative state instead of a misleading failure.
- [x] Rollback-only live DB validation confirms fifth-draw winner detection and stale-overwrite rejection.

### People Bingo 5×5
- [x] Hard minimum: 25 unique active participants.
- [x] Avatar + display-name identity cells; server identity draws and automatic marking.
- [x] No duplicate participant within one card.
- [x] Same database-authoritative draw/winner path as Standard Bingo supports string participant identities.
- [x] Deterministic >25 subset simulation verifies 25 unique identities/card, balanced repeated distribution across 30 eligible players, and eventual inclusion across a 60-player pool.
- [x] Larger boards disabled for Release 1.
- [ ] Real-session >25 participant subset/fairness validation before any public fairness/capacity claim.
- [ ] 5×5 phone readability validation across supported device sizes.

### Majority Match
- [x] Private prediction, no speed bonus, tied-majority full-credit rule.
- [x] Server timer/reveal/ranking privacy and safe late-join boundaries.
- [x] Reveal scoring is derived transactionally from the committed answering → revealing transition; application-side score retries are suppressed.
- [x] Duplicate reveal/next writes become idempotent no-ops while status-changing pause/resume remains valid.
- [x] Rollback-only live DB validation confirms tied top choices both receive 1000 points and stale next/reveal state cannot replace the first committed state.
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
- [x] Accepted-guess and artist scoring are transaction-bound to accepted-guess / round-reveal DB events and unique by score reason.
- [x] Concurrent next-round retries serialize with a transaction-scoped advisory lock; session state canonicalizes from the authoritative round row.
- [x] High-frequency GET polling uses session/round/sequence stroke cursors instead of sending the full round history on every refresh.
- [x] Cold/reconnect canvas reconstruction starts at the most recent clear instead of re-downloading obsolete pre-clear strokes.
- [x] Client canvas history compacts at the most recent clear; regression tests cover no-clear and repeated-clear histories.
- [x] Rollback-only live DB tests confirm direct score attempts are suppressed, accepted guess scoring, artist fraction scoring, and duplicate-round canonicalization.
- [ ] Real-network drawing/clear/guess-flood validation; replace polling transport only if deployed/device evidence still shows it is required after incremental polling.
- [ ] Fuzzy spelling tolerance remains deferred unless usability/content evidence supports broadening acceptance.

## CI / framework / native / accessibility
- [x] Approved semantic brand tokens and Host Indigo / Player Teal defaults.
- [x] Light / Dark / System preference using semantic tokens.
- [x] Reduced motion, focus-visible, increased-contrast, forced-colors, text-size resilience baseline.
- [x] 44px primary interaction minimum and non-color-only Bingo marking.
- [x] Deterministic `package-lock.json` and `npm ci` across web/mobile/native CI.
- [x] Framework upgraded to Next.js 16.3.1 + React 19.2 + TypeScript 5.9; Node engine requires 20.9+ and CI uses Node 24.
- [x] Production dependency security gate: `npm audit --omit=dev --audit-level=high` passes; the earlier vulnerable Next 15 PostCSS/Sharp chain was upgraded instead of suppressed.
- [x] Web/server CI: dependency audit + release-script syntax + TypeScript + rule/content/localization/policy/PWA/fairness/canvas tests + production Next.js build.
- [x] Mobile CI: bundled Vite/Capacitor client build with reusable reviewer-access path enabled and presence-checked.
- [x] Clean Supabase integration CI replays all 28 migrations and verifies Auth/account erasure, Capacitor CORS, room privacy, Standard and 26-player People Bingo, Majority Match, Quick Draw, Host recovery/automatic pause/former-Host denial, and retention cleanup end to end.
- [x] GitHub Actions upgraded to the Node 24 generation: `checkout@v6`, `setup-node@v6`, `setup-java@v5`, `upload-artifact@v7`.
- [x] Bounded Dependabot maintenance for npm weekly and GitHub Actions monthly; no auto-merge.
- [x] Android native CI verifies min SDK 26 / compile+target API 36, deep link, HTTPS-only transport, Release 1 version and branded vector launcher.
- [x] Android native CI audits the merged manifest: INTERNET + CAMERA are required; location, microphone, contacts/calendar, phone/SMS, broad storage/media and unrelated sensors are rejected.
- [x] Android native CI verifies AGP ≥8.5.1 plus 16-KB ZIP alignment and 64-bit ELF LOAD alignment for Android 15+ Play compatibility.
- [x] Android debug APK and Google Play release AAB compile; AAB artifact retained by GitHub Actions.
- [x] iOS native validation runs automatically on relevant PR changes; generated project, camera permission, deep link, Release 1 version and unsigned Xcode simulator build pass on macOS.
- [x] App-level `PrivacyInfo.xcprivacy` is valid, attached to the generated iOS Xcode App resource phase, and proven by CI to be bundled at the root of the compiled `.app`.
- [x] Native iOS CI verifies the installed Capacitor SDK dependency also supplies a required privacy manifest.
- [x] Native iOS CI rejects unnecessary microphone/location/photos/contacts/calendar/Bluetooth/speech/health/motion usage descriptions and insecure App Transport Security overrides.
- [x] Native iOS icon pipeline uses CoreGraphics/ImageIO to flatten marketing icons over Brand Indigo; CI verifies generated App Store icons are exactly 1024×1024 and `hasAlpha: no`.
- [x] Master Release 1 stopwatch/controller SVG and PWA/native branded assets replace generic Capacitor branding.
- [x] PWA manifest includes explicit 192×192 and 512×512 PNG install icons plus scalable maskable SVG; tests verify signature, dimensions and complete IEND termination.
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
- [x] Repository migrations are versioned through `028_service_role_table_privileges.sql`, reproducing Release 1 security, RLS, recovery, privacy, concurrency, transactional scoring, uniqueness hardening, and least-privilege service-role access on a clean current Supabase stack.
- [x] Dormant Release 1.1 server-only Word/Math tables are reproducible via restored migration 005 rather than hidden manual state.
- [x] At most one active/paused game session per room is database-enforced.
- [x] One active authenticated seat and one case-insensitive active nickname per room are database-enforced.
- [x] Host magic-link auth and invisible anonymous Player auth.
- [x] Native Host magic-link deep-link callback and single shared native Supabase session/client.
- [x] Release-flagged reusable reviewer email/password access uses normal Supabase Auth + the real Host flow; no reviewer credentials are embedded in source or environment variables.
- [x] Store release preflight requires reviewer-access flags on web and native builds.
- [x] Database-backed rate limits for high-impact room/join/control/moderation operations plus Quick Draw event flood limits.
- [x] Authenticated account-erasure Edge Function **v3** is live/JWT-protected; erasure completes only after Auth deletion and audit source distinguishes `app` vs external `web` flow.
- [x] In-app Privacy control initiates permanent account/data deletion for permanent Host and temporary Player identities.
- [x] Public `/privacy` can send Host verification link and complete external web deletion path after authentication.
- [x] Public `/privacy`, `/privacy-policy`, `/terms`, `/support`, and `/accessibility` routes exist; legal/account/accessibility/support links are exposed in web and native shells.
- [x] Privacy Policy/data map disclose Supabase/hosting authentication-security logs including IP/user-agent/request metadata for functionality/security, not advertising/tracking.
- [x] iOS app privacy working declaration covers Email Address, User ID, Gameplay Content, Product Interaction and Other Diagnostic Data; tracking is false.
- [x] Google Data Safety working map avoids claiming a persistent Device/Other ID or location feature unless the final provider/binary actually introduces one.
- [x] Expired-room retention service + authenticated daily Vercel Cron route/config are source-ready.
- [x] Strict server release environment validator requires real HTTPS app/Supabase origins, publishable/server credentials, strong Cron secret and reviewer access.
- [x] Strict mobile release environment validator rejects localhost/example/non-HTTPS/missing public Supabase settings and requires native reviewer access.
- [x] `npm run release:preflight` combines production env validation, TypeScript/tests/build and release mobile bundle build.
- [x] `npm run staging:smoke` verifies health/legal/support/accessibility/account surfaces after HTTPS deployment.
- [x] `npm run staging:load` creates temporary room + independent anonymous identities, exercises concurrent join/heartbeat/snapshot traffic, reports p50/p95/max and closes the room.
- [x] `npm run staging:e2e` drives deployed Standard Bingo, Majority Match and Quick Draw Host/Player APIs and cleans disposable rooms/identities.
- [x] Source-control scan found no committed live Supabase service-role secret or JWT-like credential pattern.
- [ ] End-to-end account-erasure validation against deployed/native app.
- [ ] Execute staging load/E2E/reconnect/stale-seat tests under realistic concurrency.

## Store packaging / submission preparation
- [x] Stable bundle/application ID: `com.timefillergames.app`.
- [x] Release version baseline: 1.0.0 (build/versionCode 1).
- [x] Android target API 36 release configuration.
- [x] Android 16-KB page-size compatibility gate encoded in native CI.
- [x] Store metadata/privacy/data-safety working drafts versioned and refreshed in `docs/`.
- [x] Apple/Google reusable reviewer-access architecture + instructions versioned in `docs/STORE_REVIEW_ACCESS.md`.
- [x] Apple/Google age/content-rating engineering basis versioned in `docs/AGE_RATING_DRAFT.md`.
- [x] Current Apple working rating answer is **Frequent Contests** because normal sessions compete for rankings/podiums; expected iOS 26-era global rating is **13+**. This is not a Kids/Made for Kids designation.
- [x] Privacy/account-deletion paths implemented for Apple/Google review requirements.
- [x] First-party Support, Privacy Policy, Terms, Account/Data and Accessibility URL paths are implemented.
- [x] Apple app privacy manifest source is versioned and native CI verifies it in the built app bundle.
- [ ] Production/staging HTTPS hosting deployment and environment secrets. Connected Vercel team currently has no project; the connector deployment action remains internally invalid because its visible schema omits backend-required fields.
- [ ] With explicit account-holder approval, apply migration 028 to the live Supabase project and redeploy the current JWT-protected `erase-account` source; the live function remains v3 and the safety gate correctly prevented an unapproved production permission change.
- [x] A custom paid domain is not required for first publication; a stable HTTPS hosting origin can be used. A custom domain may be purchased later only if desired.
- [ ] **Always-on production Supabase plan before store review/public release.** Official Supabase production guidance says Free projects may be auto-paused for low activity; paid-plan projects are not paused. This is a production reliability/payment gate, not the optional staging branch.
- [ ] Create one dedicated normal Supabase email/password reviewer Host account and test those reusable credentials on the exact signed store binaries; never use an owner/admin/service account.
- [ ] Real support email/contact identity for store listing/support page. Do not invent a personal/company contact.
- [ ] Final legal/account-holder review of Privacy Policy and Terms; governing-law/minimum-age terms must not be invented by engineering.
- [ ] Apple Developer account, certificates/signing, App Store Connect/TestFlight setup.
- [ ] Google Play Console app, Play App Signing/keystore, testing track and signed AAB upload.
- [ ] Production screenshots captured from the real deployed/native product at required store sizes.
- [ ] App Store / Play live age-rating and target-audience questionnaires completed accurately; Release 1 is not marketed as child-directed.

## Real-world QA before public release
- [ ] HTTPS deployment smoke test + `/api/health` using existing Supabase project; paid staging branch is not required.
- [ ] `npm run staging:e2e` green against the deployed environment.
- [ ] End-to-end multi-browser/device room tests using isolated temporary test rooms/data.
- [ ] iPhone + Android + laptop/projector device matrix.
- [ ] Weak-Wi-Fi / reconnect / Host recovery tests.
- [ ] People Bingo readability/fairness sessions with real 25+ groups.
- [ ] Quick Draw real-network synchronization tests with incremental polling enabled.
- [ ] `npm run staging:load` before any public capacity claim.
- [ ] Account deletion verified on disposable Host + anonymous Player from app and external web path.
- [ ] Closed beta validates actual 3 / 5 / 8 / 10-minute pacing.
- [ ] TestFlight-distributed iOS build passes the same QA matrix.
- [ ] Google Play testing-track build passes the same QA matrix.
- [ ] Final production smoke test and rollback plan.

## Publication gate
Do not call TimeFillerGames production-ready until the remaining unchecked deployment, always-on backend, real-device QA, legal/account, signing, beta, screenshot, reviewer-account and store-console items are completed. A paid Supabase staging branch and custom paid domain are intentionally **not** publication requirements. Code-only Release 1 blockers should be fixed on this branch rather than deferred silently.
