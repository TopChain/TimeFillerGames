# TimeFillerGames Release 1 Store Submission Draft

Engineering draft for App Store Connect and Google Play Console. Final production URLs, legal/account-holder declarations, age/target-audience questionnaires, screenshots, signing and store-console setup remain required before submission.

## Product identity

- App name: **TimeFillerGames**
- Bundle / application ID: `com.timefillergames.app`
- Release: `1.0.0` (build/version code `1`)
- Positioning: **Make every spare moment playable.**
- Tagline: **Short games. Real connections.**
- Release 1 modes: Standard Number Bingo, People Bingo 5×5, Majority Match, Quick Draw & Guess.
- Session presets: 3 / 5 / 8 / 10 minutes.
- Release 1 participant identity: built-in avatars + generated/editable nicknames; custom participant photos are disabled.
- Dedicated child-directed Kids context is not exposed in Release 1 pending a separate children/privacy review.

## Current technical submission baseline — August 2026

- Apple uploads for iOS/iPadOS must be built with the iOS/iPadOS 26 SDK or later. The Release 1 native validation pipeline is based on the Xcode 26 generation.
- Android Release 1 targets API 36, matching Google Play's August 31, 2026 target requirement for new phone/tablet apps and updates.
- Apple requires apps that support account creation—including automatically generated guest accounts—to let users initiate account deletion in-app. TimeFillerGames exposes deletion to permanent Host and temporary Player identities.
- Google Play requires an in-app deletion path and an external web deletion resource for apps that enable account creation. The Release 1 paths are the in-app Privacy control and public `/privacy` page.
- Google Play Data Safety and Apple App Privacy declarations must be completed from the actual production build and third-party SDK behavior.
- If the Google Play developer account is a **personal account created after November 13, 2023**, the app must complete a closed test with at least 12 continuously opted-in testers for 14 days before applying for production access. Do not assume this applies until the account type/creation date is known.

## Apple App Store draft

### Name
TimeFillerGames

### Subtitle
Short games. Real connections.

### Promotional text
Turn spare minutes into a shared game. Host a room, let everyone join from their phone, and play Bingo, Majority Match, or Quick Draw together.

### Description
TimeFillerGames turns short gaps in the day into multiplayer moments your group can share.

Choose how much time you have—3, 5, 8, or 10 minutes—then host a room and launch a game designed to fit. Players join from their own phones with a room code, QR code, or link.

RELEASE 1 GAMES
• Standard Number Bingo — choose a personal card, follow server-drawn numbers, and let automatic marking handle the board.
• People Bingo 5×5 — with a qualifying group, play a participant-based Bingo board using room avatars and display names.
• Majority Match — predict which answer the room will choose most often. No speed bonus; tied majority answers receive equal credit.
• Quick Draw & Guess — take turns drawing a secret word while the room guesses. Drawing, guesses, timing, and scoring are synchronized through the room.

BUILT FOR SHORT GROUP TIME
• 3, 5, 8, or 10-minute session presets
• Host-led room controls
• QR code, link, or room-code joining
• Built-in avatars and generated nicknames
• Player-specific interface language
• Reconnect support when a connection drops
• Pause and resume without silently consuming the round timer
• Private player results plus room-level results according to Host settings

TimeFillerGames is designed for friends, families, classrooms, teams, and mixed groups who want something social to do without setting up a long game.

No advertising or cross-app tracking SDK is included in Release 1.

### Keywords
party,group,bingo,drawing,guessing,classroom,team,icebreaker,multiplayer,quickgames

### Primary category draft
Games

### Secondary category draft
Entertainment

### Support URL
Production HTTPS origin + `/support`.

The page is implemented. Before submission it must show a real support contact owned by the account holder/company.

### Privacy Policy URL
Production HTTPS origin + `/privacy-policy`.

The page is implemented. Final legal/account-holder review remains required before public submission.

### Privacy Choices URL draft
Production HTTPS origin + `/privacy`.

This provides the account/data-management and deletion path. Apple's Privacy Choices URL is optional but useful for the Release 1 product.

### Accessibility URL
Production HTTPS origin + `/accessibility`.

The first-party accessibility page is implemented and linked from the web/native footer. Final real-device validation results must remain consistent with its claims.

## Google Play draft

### App name
TimeFillerGames

### Short description
Fast multiplayer games for spare moments with friends, classes, and teams.

### Full description
Make every spare moment playable with TimeFillerGames, a host-led multiplayer game app built for short group sessions.

Pick 3, 5, 8, or 10 minutes, create a room, and invite everyone with a room code, QR code, or link. Players join from their own phones and move through a simple identity, lobby, game, and result flow.

RELEASE 1 INCLUDES
• Standard Number Bingo with personal card choice, server draws, automatic marking, and shared-placement handling.
• People Bingo 5×5 for qualifying groups, using room avatars and display names.
• Majority Match, where everyone predicts the group majority with equal scoring and no speed bonus.
• Quick Draw & Guess with synchronized drawing, private guess handling, Host controls, and server scoring.

DESIGNED FOR REAL GROUPS
• Time-first 3 / 5 / 8 / 10-minute setup
• Host room controls and participant moderation
• QR, link, and room-code entry
• Built-in avatars and generated nicknames
• Multiple player interface languages
• Reconnect support
• Server-authoritative timers and scoring
• Pause/resume with preserved remaining time
• Public and private result options

TimeFillerGames is built for social play in spare moments—not long sessions, gambling, or competitive esports.

Release 1 contains no advertising SDK and no cross-app tracking SDK.

### Category draft
Game / Casual

### Privacy Policy URL
Production HTTPS origin + `/privacy-policy`.

### External account deletion URL
Production HTTPS origin + `/privacy`.

## Store privacy/data-safety working answers

These answers must remain synchronized with `docs/STORE_PRIVACY_DATA_MAP.md` and the final Privacy Policy.

### Advertising / tracking
- Ads: No in Release 1.
- Cross-app / cross-site tracking: No in Release 1.
- Advertising ID usage: None intentionally implemented.

### Data used for app functionality
- Host email address for Host authentication.
- Temporary authenticated Player identity / user identifier.
- Player nickname, selected built-in avatar, interface language, readiness/presence state.
- Room/game configuration and game submissions required to run multiplayer sessions.
- Scores/rankings/results.
- Quick Draw guesses and drawing strokes for game operation.
- Moderation events for Host actions and abuse/safety operations.
- Hashed/rate-limit operational identifiers for abuse prevention.

### Data sharing draft
No sale of personal data and no advertising-data sharing is implemented. Supabase and the hosting provider process data as service providers/subprocessors to operate authentication, database, realtime, and application infrastructure.

### Encryption
Production network traffic must use HTTPS/TLS. Android release validation keeps cleartext HTTP disabled before signing.

### Account deletion
Implemented in Release 1 code/live backend:
- in-app Privacy control for permanent Host and temporary Player authenticated identities;
- authenticated Supabase Edge Function v3 that performs account/data erasure and only reports completion after the Auth identity has been deleted;
- external first-party `/privacy` account/data page;
- public Privacy Policy and Support routes.

Remaining gate: validate the full deletion flow against the deployed HTTPS environment and real native devices before submission.

## Screenshot storyboard

Create real-device screenshots only after the production-like HTTPS backend, support contact and final deployment origin are connected. Suggested sequence:
1. Home — “Make every spare moment playable.”
2. Time-first setup — 3 / 5 / 8 / 10 minutes.
3. Host lobby — room code + QR + readiness.
4. Bingo — live marked board.
5. Majority Match — private prediction / aggregate reveal.
6. Quick Draw — drawing canvas and guess interaction.
7. Results — public podium + private result.
8. Player identity — language/avatar/nickname flow.

## Implemented submission assets / surfaces

- First-party master stopwatch/controller SVG.
- 1024px raster app-icon source for store/native packaging.
- Android branded adaptive-vector launcher configuration.
- PWA manifest with tested 192×192 / 512×512 raster icons and scalable maskable SVG.
- `/privacy-policy`.
- `/terms`.
- `/privacy` account/data page.
- `/support`.
- `/accessibility`.
- Native/web legal-support footer linking these first-party pages.
- Strict server/mobile production-environment validators.
- One-command `npm run release:preflight`.
- One-command `npm run staging:smoke` once a real HTTPS deployment exists.
- `npm run staging:load` authenticated temporary-room concurrency harness; no paid Supabase branch is required.
- `docs/PUBLISHING_HANDOFF.md` account-owner runbook.

## Remaining blockers that metadata cannot solve

- Production/staging HTTPS deployment and production environment secrets.
- Supabase production Site URL / web + native Auth redirect configuration.
- Real support email/contact identity on the production Support page and store records.
- Final Privacy Policy / Terms legal/account-holder acceptance.
- End-to-end account-erasure validation on deployed/native builds.
- Real-device accessibility, QR, network/reconnect, People Bingo readability/fairness and Quick Draw synchronization QA.
- iOS signing, Apple Developer/App Store Connect/TestFlight setup.
- Android Play Console record, Play App Signing/keystore and applicable testing track.
- Production screenshots captured from the real staged/native product.
- Age-rating / target-audience questionnaires completed using actual Release 1 behavior.
- Closed beta and final 3 / 5 / 8 / 10-minute pacing validation.

A custom paid domain is optional for Release 1; a stable public HTTPS hosting origin is sufficient. A paid Supabase staging branch is intentionally not required.
