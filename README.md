# TimeFillerGames

**Make every spare moment playable.**

TimeFillerGames is a host-led multiplayer mini-game platform for 3, 5, 8, or 10 minutes of spare group time. The Release 1 candidate is implemented from the approved Product Plan v1.0 and Brand & Product CI Guidelines v1.0.

## Release scope

- **Release 1 public games:** Standard Number Bingo, People Bingo 5×5, Majority Match, Quick Draw & Guess.
- **Release 1.1 deferred games:** Word Challenge, Math Challenge.
- Participants join without a visible account through room code / QR / direct link.
- Host and Player use distinct semantic UI roles while sharing one master brand.
- Release 1 uses built-in avatars only. Custom participant photos are disabled.
- A dedicated child-directed Kids context is not exposed in Release 1 pending separate children/privacy review.

## Architecture

- Next.js 15 + React 19 + TypeScript.
- Installable web/PWA plus Capacitor 8 bundled iOS/Android clients.
- Supabase Auth, PostgreSQL, Realtime and Edge Functions.
- Server-authoritative Release 1 room/game state.
- Private room authorization with restrictive RLS and server-mediated writes.
- Six UI locales: `en`, `zh-Hant`, `zh-Hans`, `es`, `ja`, `ko`.
- Personal interface language is separate from Host-selected shared room/game content language.
- Persisted Light / Dark / System appearance preference.
- Release 1 bundle/application ID: `com.timefillergames.app`.

## Release 1 games

### Standard Number Bingo
- 3 personal candidate cards with timed choice.
- Server auto-assignment and card lock.
- Server random draws and automatic marking.
- One-line winner validation with same-draw shared placement.
- Server-authoritative pause/resume.

### People Bingo 5×5
- Hard minimum of 25 unique active participants.
- Avatar + display-name identity cells.
- No repeated participant within one card.
- Server identity draws + automatic marking.
- Larger boards disabled pending real-session fairness/readability validation.

### Majority Match
- Private predictions and no speed bonus.
- Tied top answers all receive full credit.
- Server question timers, aggregate reveal and ranking privacy.
- Safe late-join activation boundaries.
- Curated Release 1 bank: 50 neutral prompts, 10 in each supported category.

### Quick Draw & Guess
- Fixed artist rotation with random or join-order selection.
- Server-only secret words.
- Touch / mouse / stylus drawing canvas.
- Ordered stroke batching and synchronized canvas clear.
- Guess/stroke flood controls.
- Conservative normalized answer matching.
- Optional audience guessing.
- Public/moderated live guess streaming is disabled for Release 1; guesses stay private until accepted.
- Curated Release 1 bank: 144 words with category × difficulty coverage checks.
- Server-authoritative pause/resume preserving the active drawing deadline.

## Room / recovery / moderation

- Host magic-link authentication.
- Invisible anonymous Player authentication.
- PIN/direct-link/QR joining.
- Ready state, spectator foundation, heartbeat/reconnect and seat recovery.
- Explicit single co-host Host-recovery path with verified recovery identity, race-safe ownership transfer and automatic pause.
- Co-host remains an active player.
- Replay / Change Game while keeping the room.
- Participant ↔ spectator changes, participant removal, nickname override/lock and duplicate-name disambiguation.
- Moderation audit events.
- Ranking visibility/privacy controls.
- Database-backed request throttling and Quick Draw event flood limits.

## Privacy / retention

- Public routes: `/privacy-policy`, `/terms`, `/privacy`, `/support`, `/accessibility`.
- In-app account/data deletion control for permanent Host and temporary Player authenticated identities.
- JWT-protected Supabase `erase-account` Edge Function is deployed and source-versioned.
- Rooms default to a 120-minute TTL.
- Source-ready Vercel Cron configuration calls the authenticated retention endpoint daily.
- Expired rooms cascade-delete Release 1 gameplay/room-linked moderation data; stale rate-limit buckets older than 24 hours are cleaned up.
- Dormant Release 1.1 tables (`content_packs`, `player_question_history`, `game_results`) are server-only, RLS-protected and currently unused by the public Release 1 product.

## Brand / accessibility

- Brand Indigo `#5B5DEE`.
- Play Teal `#22D3C5`.
- Action Coral `#FF647C`.
- Reward Gold `#FFC857`.
- Game Navy `#111827`.
- Cloud White `#F8FAFC`.
- Host primary `#5B5DEE`; Player primary `#0F7A86`.
- Master stopwatch/controller SVG and 1024px raster app-icon source.
- Android branded vector adaptive launcher.
- 20px cards, 12–16px controls, 44px minimum primary interaction target.
- Reduced-motion, visible focus, increased-contrast and forced-colors foundations.
- First-party Accessibility page.

The six named optional branded color themes are intentionally deferred from the first store build because the approved v1.0 guide names them but does not provide exact palette values. Release 1 ships the approved Light / Dark / System semantic CI rather than inventing unapproved colors.

## Local setup

Requirements: Node.js 20+ (CI currently uses Node 24).

```bash
cp .env.example .env.local
npm ci
npm run dev
```

Open `http://localhost:3000`.

Apply every SQL file in `supabase/migrations/` in filename order to a clean Supabase environment. Migration `005_release11_content_foundation.sql` reproduces the dormant server-only Word/Math foundation that already exists in the connected live project.

## Verification commands

Normal deterministic verification:

```bash
npm run typecheck
npm run test
npm run build
npm run check
```

Production release preflight requires real non-placeholder server + mobile environment variables and then runs server env validation, TypeScript/tests/Next build, mobile env validation and mobile bundle build:

```bash
npm run release:preflight
```

After a real HTTPS staging deployment exists:

```bash
npm run staging:smoke
```

The staging smoke check verifies the public app, `/api/health`, Privacy Policy, Terms, Account/Data, Support, Accessibility, and that the retention endpoint rejects unauthenticated requests.

## Native validation

GitHub Actions automatically validates:

- Web/server TypeScript + tests + Next production build.
- Mobile Vite/Capacitor bundle.
- Android: generated native project, min SDK 26, compile/target API 36, HTTPS-only transport, deep link, version 1.0.0 (1), branded vector launcher, debug APK, and Play-format release AAB.
- iOS: generated native project, camera purpose string, deep-link scheme, version 1.0.0 (1), and unsigned Xcode simulator build.

The current release branch has passed all four automated build pipelines. Signing and store-account distribution still require the account owner’s Apple/Google credentials.

## Current external publication blockers

Code/build work is not the main blocker now. Public release still requires:

1. A real HTTPS deployment/domain and production environment secrets. The connected Vercel team currently has no project, and the available deployment connector is internally malformed.
2. A real support email/contact identity on the production Support page and store listings.
3. Final account-holder/legal acceptance of Privacy Policy and Terms, including governing-law/age wording.
4. Apple Developer/App Store Connect certificates, signing and TestFlight.
5. Google Play Console, Play App Signing/keystore, testing track and signed AAB upload.
6. Real iPhone + Android + laptop/projector QR/device testing.
7. Screen-reader, keyboard, text-scale and contrast validation on real supported devices/browsers.
8. Weak-Wi-Fi/reconnect/Host-recovery and Quick Draw real-network tests.
9. People Bingo 5×5 phone readability and >25-player fairness sessions.
10. Load testing before public capacity claims.
11. Closed beta validating actual 3 / 5 / 8 / 10-minute pacing.
12. Production screenshots, store age/target-audience questionnaires, final smoke test and rollback readiness.

A clean Supabase development branch would help with staging migration/end-to-end tests. The connected TopChain AI Lab organization currently has no branch; creating one costs $0.01344/hour and requires explicit approval before creation.

See `docs/RELEASE_CHECKLIST.md` for the exact publication ledger and `docs/STORE_SUBMISSION_DRAFT.md` / `docs/STORE_PRIVACY_DATA_MAP.md` for store preparation.

## Branch

Release-candidate work: `agent/release-candidate-v1`
