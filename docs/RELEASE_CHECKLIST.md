# TimeFillerGames — Release 1 Publication Checklist

Source of truth: Product Plan v1.0 + Brand & Product CI Guidelines v1.0. A checked item is backed by code/build/deployment evidence. Unchecked items are real publication gates; do not silently treat them as complete.

A paid Supabase staging branch is intentionally **not** required.

## Product and UX

- [x] Time presets are exactly 3 / 5 / 8 / 10 minutes.
- [x] Public Release 1 shelf exposes Bingo, Majority Match and Quick Draw & Guess; Word/Math remain Release 1.1.
- [x] Host flow: time → context → game → settings → room → lobby → play → results.
- [x] Player flow: PIN/QR/link → language → built-in avatar → nickname → lobby → play → results.
- [x] Six interface locales: English, Traditional Chinese, Simplified Chinese, Spanish, Japanese, Korean.
- [x] Player UI language is separate from Host-selected room/game content language.
- [x] 60 built-in avatars; uploaded participant photos are disabled in Release 1.
- [x] Kids context is excluded/rejected in Release 1 pending dedicated children/privacy review.
- [x] QR/direct-link/PIN joining, Ready, lock, spectator, moderation, reconnect and room reuse foundations are implemented.
- [x] Explicit co-host recovery/Host transfer with automatic pause is implemented.
- [x] Release policy tests prevent Kids mode, custom photos, Release 1.1 public games, public Quick Draw guess streaming and unsupported 100+/200+ public capacity claims.
- [ ] Real iPhone + Android QR scan validation on the final distributed builds.

## Standard Number Bingo

- [x] Hard minimum 2; no invented game-rule maximum.
- [x] Three server-generated candidate cards and 10/15/20/30/60 second choice timer.
- [x] Server auto-lock/assignment after the selection deadline.
- [x] Server random unused draw and automatic marking.
- [x] One horizontal/vertical/diagonal line wins.
- [x] Same-draw simultaneous winners share placement.
- [x] Pause/resume preserves authoritative state/deadline.
- [x] Database draw-history guard rejects stale/non-monotonic state.
- [x] Winner rows derive from committed draw state; duplicate/retried winner inserts are suppressed.
- [x] Live rollback validation covered winner detection and stale overwrite rejection.

## People Bingo 5×5

- [x] Exactly 25 unique active participants required before 5×5 start.
- [x] Three cards; each card contains 25 unique room identities.
- [x] Avatar + display name cells.
- [x] Server draws identities and automatically marks every matching cell.
- [x] Same authoritative draw/winner protections as Standard Bingo.
- [x] Larger board sizes unavailable in Release 1.
- [x] Deterministic simulation validates uniqueness and distribution mechanics above 25 participants.
- [ ] Real 25+ participant session validates readability and practical subset fairness.
- [ ] No public large-group/fairness capacity claim until real evidence supports it.

## Majority Match

- [x] Hard minimum 3; approved recommendation is 5+; no game-rule maximum.
- [x] Private prediction; speed bonus disabled.
- [x] Tied top choices all receive full credit.
- [x] Safe late-join activation between questions.
- [x] Server-authoritative timer/reveal/ranking privacy.
- [x] Reveal scoring derives transactionally from the committed answering → revealing transition.
- [x] Duplicate reveal/next writes are idempotent while pause/resume remains valid.
- [x] Curated Release 1 bank: 50 neutral prompts, 10 per category.
- [x] Content/scoring tests cover tie behavior and bank integrity.

## Quick Draw & Guess

- [x] Hard minimum 3; approved recommended active group 4–20.
- [x] Fixed artist sequence with random or join-order selection.
- [x] Secret words remain server-only during drawing.
- [x] Curated Release 1 bank: 144 words with category/difficulty coverage.
- [x] Touch/mouse/stylus normalized drawing input and synchronized clear.
- [x] Ordered stroke persistence, flood limits and incremental polling.
- [x] Cold/reconnect reconstruction starts at the latest clear.
- [x] Guess handling remains private until accepted; public live guess stream disabled for Release 1.
- [x] Audience guessing optional; server scoring implemented.
- [x] Accepted-guess and artist scoring transaction-bound to authoritative DB events.
- [x] Next-round retry handling prevents duplicate authoritative rounds.
- [x] Pause/resume preserves drawing deadline.
- [ ] Real weak-network drawing/clear/guess-flood validation on distributed phones.
- [ ] Fuzzy spelling remains intentionally deferred unless evidence supports broader acceptance.

## Database, security and privacy

- [x] Supabase TimeFillerGames project is ACTIVE_HEALTHY under **TopChain AI Lab**.
- [x] Repository migrations through 028 reproduce the current Release 1 schema/security/recovery/concurrency/least-privilege state on a clean current Supabase stack.
- [x] RLS/private realtime boundaries implemented.
- [x] One live active/paused game session per room is database-enforced.
- [x] Active authenticated seat and active case-insensitive nickname uniqueness are database-enforced.
- [x] High-impact room/control/moderation operations use database-backed rate limits; Quick Draw has event flood limits.
- [x] Host uses verified email auth; Players use intentional invisible Supabase anonymous authenticated identities.
- [x] JWT-protected `erase-account` Edge Function v4 is live and reports completion only after Auth identity deletion.
- [x] In-app deletion exists for Host and temporary Player identities.
- [x] Public `/privacy` provides external account/data management path.
- [x] Expired-room cleanup and 24-hour rate-limit cleanup are implemented behind authenticated daily retention cron.
- [x] Current performance advisor has only informational unused-index notices.
- [x] Security advisor server-only/RLS notices are understood; anonymous-policy warnings are expected because anonymous authenticated Players are an intentional product requirement.
- [ ] Move production Supabase to an always-on production plan before store review/public release.
- [ ] Enable Supabase leaked-password protection on that plan before creating a reusable password reviewer account.
- [ ] End-to-end deletion validation on deployed and distributed native builds.

## Web/hosting

- [x] Stable production origin: `https://time-filler-games.vercel.app`.
- [x] Vercel project `time-filler-games` exists and is connected to `main`.
- [x] Production deployment is READY.
- [x] `/api/health` confirms public/server Supabase configuration and database reachability.
- [x] Home, Privacy Policy, Terms, Account & Data, Support and Accessibility routes respond over HTTPS.
- [x] HSTS, no-sniff, frame denial, strict referrer policy and restrictive permissions policy verified on production.
- [x] Unauthenticated retention endpoint returns 401.
- [x] No current Vercel runtime error cluster detected; no warning/error/fatal log found in recent retained window.
- [x] Custom paid domain is optional, not a Release 1 publication requirement.
- [ ] Repeat smoke/E2E/load validation after the finalization PR is merged and its production deployment is READY.

## CI / framework / packaging

- [x] Next.js 16.3.1 + React 19.2 + TypeScript 5.9; Node 24 CI.
- [x] Production dependency audit blocks high-severity vulnerabilities.
- [x] Web CI: audit, TypeScript, tests, production build.
- [x] Mobile CI: bundled Vite/Capacitor build and reviewer-access presence.
- [x] Supabase Integration CI: clean 28-migration replay plus Auth/account-erasure/CORS/room/game/recovery/retention integration scenarios.
- [x] Android min SDK 26, compile/target API 36.
- [x] Android permission audit rejects unnecessary sensitive permissions.
- [x] Android debug APK and Play-format AAB compile in CI.
- [x] Android 16-KB alignment compatibility gate implemented.
- [x] iOS automatic macOS/Xcode validation compiles unsigned simulator build.
- [x] Apple app-level privacy manifest is bundled in the built `.app` and Capacitor privacy manifest presence is verified.
- [x] iOS permission audit rejects unnecessary usage descriptions/insecure transport overrides.
- [x] App Store marketing icon is verified 1024×1024 with no alpha.
- [x] Branded native/PWA icons and 192×192 / 512×512 PWA assets validated.
- [x] Light / Dark / System, reduced-motion, focus, contrast/forced-colors and 44px target foundations implemented.
- [ ] Full real-device accessibility audit: VoiceOver, TalkBack, keyboard, text scale, contrast, focus/read order.

## Store submission surfaces

- [x] Bundle/application ID `com.timefillergames.app`.
- [x] Version baseline `1.0.0`, build/versionCode `1`.
- [x] Android target API 36 meets the August 31, 2026 Google Play phone/tablet requirement.
- [x] iOS release process targets Xcode 26 / iOS 26 SDK generation required for current App Store uploads.
- [x] Production Privacy Policy URL exists.
- [x] Production external deletion/Privacy Choices URL exists.
- [x] Production Support URL exists.
- [x] Production Accessibility URL exists.
- [x] Store metadata, privacy/data-safety map, age-rating draft and reviewer-access runbook are versioned.
- [x] Reviewer access UI uses reusable email/password credentials to enter the real Host flow; no credentials embedded in code.
- [x] Public capacity copy no longer advertises unvalidated Bingo 100+ / Majority 200+ claims.
- [ ] Create dedicated non-owner reviewer Host identity after production password security is configured.
- [ ] Test reviewer credentials on exact TestFlight + Play testing-track binaries.
- [ ] Add a real monitored public support email/contact to `/support` and store records.
- [ ] Final legal/account-holder approval of Privacy Policy and Terms; remove draft wording only after approval.
- [ ] Apple Developer/App Store Connect account, agreements and signing configuration complete.
- [ ] Google Play Console app, Play App Signing and release signing complete.
- [ ] Final App Privacy / Data Safety forms completed from exact binary/provider behavior.
- [ ] Final Apple age-rating and Google content-rating/target-audience forms completed accurately.
- [ ] Final store screenshots captured from distributed release candidate.

## Real-world QA

- [ ] Final deployed `staging:smoke` green after last merge.
- [ ] Final deployed `staging:e2e` green with disposable authenticated identities.
- [ ] Launch-level `staging:load` evidence captured; do not convert it into unsupported marketing capacity claims.
- [ ] iPhone TestFlight build passes full room/game/reconnect/deletion/reviewer-access flow.
- [ ] Android Play testing-track build passes full room/game/reconnect/deletion/reviewer-access flow.
- [ ] Laptop/desktop Host browser matrix passes.
- [ ] Weak Wi-Fi/offline/reconnect and Host recovery scenarios pass.
- [ ] People Bingo real 25+ readability/fairness session passes.
- [ ] Quick Draw real-network synchronization passes.
- [ ] Closed beta validates actual 3 / 5 / 8 / 10 minute pacing.
- [ ] Rollback procedure verified.

## Google testing eligibility

- [ ] Determine Google Play developer account type and creation date.
- [ ] If it is a personal account created after November 13, 2023, complete the currently required closed test with at least 12 continuously opted-in testers for 14 days, then apply for production access.

## Publication gate

Do **not** call TimeFillerGames ready to publish until every unchecked item that applies to the chosen Apple/Google accounts is complete. Code/CI/hosting are now in release-finalization territory; the remaining blockers are primarily production-plan security, real-device/group QA, reviewer identity, support identity, legal acceptance, signing/store accounts, distributed beta/testing, screenshots and store questionnaires.
