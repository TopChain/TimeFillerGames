# TimeFillerGames — Publishing Handoff

This runbook begins when the Release 1 code candidate is green in GitHub Actions and ends at App Store / Google Play submission. It deliberately excludes the optional paid Supabase branch and does not require a custom paid domain for version 1.0.0.

## 0. Non-negotiable release identity

- Product: **TimeFillerGames**
- Bundle / application ID: `com.timefillergames.app`
- Release: `1.0.0` / build + versionCode `1`
- Public Release 1 games: Bingo (Standard + People 5×5), Majority Match, Quick Draw & Guess
- Release 1.1 Word/Math remain unavailable on the public shelf.
- Dedicated Kids context, custom participant photos, and public Quick Draw guess streaming remain unavailable in Release 1.

## 1. Git / CI release baseline

Before deployment, PR #1 must remain Draft and all automatic checks on the exact head must pass:

- production dependency audit (`npm audit --omit=dev --audit-level=high`)
- TypeScript
- Vitest rules/content/localization/policy/PWA/fairness/canvas tests
- Next.js production build
- Mobile Vite/Capacitor build
- Android native configuration + debug APK + Play-format release AAB
- iOS native configuration + unsigned Xcode simulator build + bundled `PrivacyInfo.xcprivacy`

Do not merge to `main` merely to obtain a preview. Use the release-candidate branch for staging until external QA passes.

## 2. Create the HTTPS hosting project

The connected Vercel deployment connector is currently unusable because its exposed tool accepts no deployment fields while its backend requires `target`, `name`, and `files`. Therefore the account owner must perform the Git import in the Vercel dashboard.

1. In Vercel, choose **Add New → Project**.
2. Import GitHub repository `TopChain/TimeFillerGames`.
3. Framework should resolve as **Next.js**.
4. Use the repository root as Root Directory.
5. Use the Vercel-provided HTTPS project hostname for first release unless a custom domain is deliberately purchased later.
6. Do not expose Supabase server credentials as `NEXT_PUBLIC_*` variables.

A custom domain is optional. The first store release only requires stable, publicly reachable HTTPS URLs for the app, privacy policy, account management, support, and API.

## 3. Vercel production environment

Set these Project Environment Variables for Production (and Preview only when deliberate):

```text
NEXT_PUBLIC_SUPABASE_URL=<TimeFillerGames Supabase project HTTPS URL>
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<Supabase publishable key>
SUPABASE_SECRET_KEY=<current Supabase server secret>
NEXT_PUBLIC_APP_URL=https://<stable-vercel-host>
NEXT_PUBLIC_API_BASE_URL=
NEXT_PUBLIC_AUTH_REDIRECT_URL=https://<stable-vercel-host>
ROOM_CODE_LENGTH=6
ROOM_TTL_MINUTES=120
HEARTBEAT_STALE_SECONDS=35
RECONNECT_GRACE_SECONDS=60
HOST_RECOVERY_GRACE_SECONDS=45
CRON_SECRET=<random >=16-character secret; use a stronger generated value>
```

Legacy `NEXT_PUBLIC_SUPABASE_ANON_KEY` / `SUPABASE_SERVICE_ROLE_KEY` are supported only for migration compatibility; prefer the current publishable/server-secret variables.

Redeploy after any environment-variable change. Confirm Vercel detects the daily Cron entry from `vercel.json`.

## 4. Supabase Auth URL configuration

In Supabase Dashboard → Authentication → URL Configuration:

- **Site URL:** `https://<stable-vercel-host>`
- Add the exact web redirect URL used by the app.
- Add native redirect URL: `timefillergames://auth/callback`
- Keep localhost redirects only for development, not as the production Site URL.
- If Vercel Preview authentication is intentionally tested, add only the required preview pattern; production should use exact redirect URLs.

Send one Host magic link on web and one through an installed native build and verify both return to the expected Host flow.

## 5. Production environment preflight

With the real production variables available locally or in a secure release runner:

```bash
npm ci
npm run release:preflight
```

PASS means:

- no placeholder/local HTTP production origins
- required server and mobile public configuration exists
- TypeScript/tests/Next build pass
- mobile release environment validation passes
- mobile production bundle builds

Never commit the real server secret or `CRON_SECRET`.

## 6. HTTPS deployment smoke test

Configure `STAGING_BASE_URL` to the deployed HTTPS origin and run:

```bash
npm run staging:smoke
```

PASS requires:

- public home page responds
- `/api/health` responds successfully
- `/privacy-policy`, `/terms`, `/privacy`, `/support`, `/accessibility` respond
- unauthenticated retention cleanup request is rejected

Manually verify browser security headers and that all Host/Player API traffic stays HTTPS.

## 7. Authenticated load test

Create one disposable verified Host login against the deployed product, obtain its temporary access token through a secure local testing session, and set:

```text
STAGING_BASE_URL=https://<stable-vercel-host>
STAGING_SUPABASE_URL=<Supabase URL>
STAGING_SUPABASE_PUBLISHABLE_KEY=<publishable key>
LOAD_TEST_HOST_TOKEN=<temporary disposable Host access token>
LOAD_TEST_PLAYERS=30
```

Then run:

```bash
npm run staging:load
```

The harness creates its own temporary room and anonymous Player identities, performs concurrent joins, heartbeats and authenticated snapshots, prints p50/p95/max latency, and closes the room.

Start at 30 Players. If clean, repeat at 50 and then 100 only as engineering validation; do not advertise a capacity number until the observed device/network behavior supports it.

## 8. End-to-end Release 1 QA matrix

Use temporary rooms on the deployed environment. Minimum real-device matrix:

- one current iPhone
- one current Android phone
- one laptop/desktop Host
- one projector/large-screen scenario when available
- multiple simultaneous browser tabs/devices for reconnect/retry behavior

For every test, record PASS/FAIL + device/OS/browser/app version.

### Whole-product path

Host sign-in → choose 3/5/8/10 min → context → game → configuration → create room → QR/direct/PIN joins → six-language Player identity setup → Ready → game → pause/resume → disconnect/reconnect → results → Replay/Change Game → end room.

### Standard Bingo

- 3 candidate cards
- timer auto-assignment/lock
- repeated Host draw clicks do not create divergent draws
- automatic marking/winner detection
- same-draw shared placement
- pause/reconnect

### People Bingo

- exactly 25 active identities required
- 5×5 readability on smallest supported phone
- 25, 30 and preferably 40+ participant sessions
- no duplicate identity in a card
- drawn identities mark all matching cells
- observe >25 subset distribution across repeated games

### Majority Match

- private answers
- tied majority scoring
- late join waits until safe question boundary
- repeated Reveal/Next actions remain idempotent
- pause/resume deadline integrity

### Quick Draw

- finger + stylus/mouse where available
- clear while strokes are still queued
- incremental polling keeps canvas synchronized
- reconnect reconstructs current visible canvas
- guess flood/rate limits behave normally
- accepted guess score and artist score agree with result
- repeated Next round does not create a duplicate round
- weak Wi-Fi / temporary offline / reconnect

### Host recovery

- designate one co-host
- secure co-host identity
- stop Host heartbeat beyond grace period
- only designated verified co-host can claim
- live game pauses during transfer
- recovered Host can inspect state and resume/end

## 9. Account erasure validation

Test both identity classes against the deployed/native product:

1. Disposable anonymous Player → Privacy → Delete account & data → confirm.
2. Disposable email Host → create temporary room → Privacy → Delete account & data → confirm.
3. Verify the Auth identity can no longer authenticate.
4. Verify Host-owned rooms are removed.
5. Verify participant records retained only for another Host’s room are anonymized.
6. Verify request status reaches completed only after Auth deletion.
7. Verify public `/privacy` account-management path is reachable from the web.

Do not use a real production owner account for this test.

## 10. Accessibility release audit

Real-device/browser checks:

- keyboard-only full Host and Player web flows
- visible focus at every interactive control
- VoiceOver on iPhone and TalkBack on Android for join, game controls, result and privacy deletion
- 200% text/browser scaling where applicable
- device text-size increase on iOS/Android
- reduced motion
- dark/light/system
- contrast/forced-colors desktop check
- no state communicated by color alone

Fix release-blocking navigation, label, focus or clipping defects before screenshots.

## 11. Closed beta / pacing

Run real groups through 3, 5, 8 and 10 minute sessions. Capture:

- time from opening app to first game action
- join/Ready delays
- game completion vs selected duration
- reconnect incidence
- confusing Host/Player steps
- device-specific issues

Do not alter approved core rules solely to make a single beta session fit; use repeated evidence.

## 12. Apple Developer / TestFlight

Account-owner action is required for membership, contracts, certificates, signing and App Store Connect.

Technical baseline already encoded:

- `com.timefillergames.app`
- 1.0.0 (1)
- iOS 26 SDK / Xcode 26 generation requirement
- app-level `PrivacyInfo.xcprivacy`
- camera-purpose description
- `timefillergames://auth/callback`

After Apple Developer enrollment:

1. Register App ID `com.timefillergames.app` if not automatically created through Xcode/App Store Connect.
2. Create the App Store Connect app record.
3. Configure signing team/certificates/profile in Xcode.
4. Archive the Release build with the iOS 26 SDK or later.
5. Validate archive.
6. Upload to App Store Connect.
7. Add internal TestFlight testers first.
8. Complete external beta review if external TestFlight testers are used.
9. Run the full device/account-deletion/QR checks on the TestFlight binary.

## 13. App Store Connect content

Use the versioned store draft rather than re-writing metadata from scratch:

- app name/subtitle/description/keywords
- category
- Privacy Policy URL: `https://<stable-vercel-host>/privacy-policy`
- optional Privacy Choices URL: `https://<stable-vercel-host>/privacy`
- Support URL: `https://<stable-vercel-host>/support`
- Accessibility URL: `https://<stable-vercel-host>/accessibility`
- screenshots from the actual release build
- App Privacy answers based on `docs/STORE_PRIVACY_DATA_MAP.md`
- age rating questionnaire based on actual Release 1 behavior

Apple requires a Privacy Policy URL and App Privacy declarations. Because TimeFillerGames creates permanent Host and automatic guest/Player identities, keep the in-app deletion control available to both identity types.

## 14. Google Play Console

Account-owner action is required for registration, identity verification, Play App Signing and release tracks.

1. Create app with package `com.timefillergames.app`.
2. Complete store listing using `docs/STORE_SUBMISSION_DRAFT.md`.
3. Enter privacy policy: `https://<stable-vercel-host>/privacy-policy`.
4. Enter external account deletion URL: `https://<stable-vercel-host>/privacy`.
5. Complete Data Safety from `docs/STORE_PRIVACY_DATA_MAP.md` and the actual release binary/SDK behavior.
6. Complete target audience/content rating/app access declarations.
7. Enable Play App Signing.
8. Produce/upload the signed Play release AAB based on the already-green unsigned `bundleRelease` pipeline.
9. Start Internal Testing, then Closed Testing as appropriate.
10. If the developer account is a **personal account created after November 13, 2023**, Google requires at least 12 opted-in closed testers continuously for 14 days before applying for production access. Do not assume this condition until the account type/creation date is known.
11. Test the Play-distributed build, not only an Android Studio sideload.

Android Release 1 already targets API 36, satisfying the August 31, 2026 new-app/update target requirement.

## 15. Screenshots

Capture screenshots only after the staged/native release candidate passes QA so screenshots match the submitted binary.

Recommended storyboard:

1. Host time-first setup
2. QR/PIN join lobby
3. Standard Bingo
4. People Bingo
5. Majority Match
6. Quick Draw
7. results/podium
8. multilingual UI / group connection story where useful

Do not show email addresses, access tokens, real room participants, or test/admin diagnostics.

## 16. Final release gate

Before changing PR #1 from Draft / merging / submitting production builds, all must be true:

- exact release commit: web/server, mobile, Android, iOS CI green
- `npm run release:preflight` green with real production env
- HTTPS smoke green
- staging load green at the chosen launch test level
- account deletion verified end to end
- real-device QR/game/reconnect matrix green
- People Bingo phone/readability and >25 session evidence acceptable
- Quick Draw weak-network evidence acceptable
- accessibility audit complete
- closed beta pacing acceptable
- real support identity present
- Privacy Policy/Terms accepted by account owner/legal reviewer
- TestFlight release build tested
- Google testing-track build tested
- screenshots from final build
- App Privacy / Data Safety / age-rating / target-audience forms completed accurately
- rollback path known

Only after every item above is satisfied should the project be described as **ready to publish**.
