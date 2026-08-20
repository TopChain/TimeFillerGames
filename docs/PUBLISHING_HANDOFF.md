# TimeFillerGames — Release 1 Publishing Handoff

This runbook begins from the current Release 1 code candidate and the live Vercel production origin. It ends only when the exact signed/distributed binaries have passed real-device QA and the Apple App Store / Google Play submission records are complete.

A paid Supabase staging branch is intentionally **not required**. A custom paid domain is optional for Release 1.

## 1. Fixed release identity

- Product: **TimeFillerGames**
- Bundle / application ID: `com.timefillergames.app`
- Release: `1.0.0` / build + versionCode `1`
- Stable web/API origin: `https://time-filler-games.vercel.app`
- Public Release 1 games: Bingo (Standard + People 5×5), Majority Match, Quick Draw & Guess
- Release 1.1 Word/Math remain unavailable on the public shelf.
- Dedicated Kids context, custom participant photos, and public Quick Draw guess streaming remain unavailable in Release 1.

## 2. Current code/build baseline

The Release 1 foundation has already been merged to `main`. Final release corrections use a dedicated finalization branch/PR and must pass the applicable GitHub Actions checks before merge.

Automated release coverage includes:

- production dependency vulnerability audit
- TypeScript
- game/content/localization/policy/PWA tests
- Next.js production build
- bundled Vite/Capacitor mobile build
- Android configuration, permission audit, debug APK and Play-format AAB compilation
- iOS configuration, sensitive-permission audit, privacy manifests, App Store icon checks and unsigned Xcode simulator compilation
- clean Supabase migration replay plus Auth/game/recovery/retention integration scenarios

Do not submit a store build from an arbitrary local commit. Record the exact Git SHA used for the final signed artifacts.

## 3. Production HTTPS deployment — live

Vercel project: `time-filler-games`.

Stable origin: `https://time-filler-games.vercel.app`.

Verified production surfaces:

- `/` responds successfully
- `/api/health` reports public/server Supabase configuration and database reachability
- `/privacy-policy`
- `/terms`
- `/privacy`
- `/support`
- `/accessibility`
- unauthenticated `/api/cron/retention` is rejected
- HSTS, no-sniff, frame denial, strict referrer policy and restrictive permissions policy are present

The Vercel project is connected to `main`. After a finalization merge, wait for the new production deployment to become READY and repeat the smoke checks before using the build for store review.

## 4. Supabase production configuration

Project: TimeFillerGames under **TopChain AI Lab**.

Before store review:

1. Confirm Supabase Authentication Site URL is `https://time-filler-games.vercel.app`.
2. Confirm the exact web callback used by Host magic-link sign-in is allowed.
3. Confirm `timefillergames://auth/callback` is allowed for the native app.
4. Keep anonymous authentication enabled because Release 1 Players intentionally receive invisible authenticated guest identities.
5. Move the production project to an always-on production plan before relying on it for store review/public launch; do not create an optional paid staging branch.
6. On the production plan, enable leaked-password protection before creating the reusable password-based store-review Host identity.
7. Keep the server secret/service-role credential private; never expose it through a `NEXT_PUBLIC_*` or `VITE_*` variable.

Current advisor interpretation:

- anonymous-access WARN entries are expected for policies that intentionally support authenticated anonymous Players;
- server-only tables with RLS and no browser policy are expected;
- performance advisor findings are informational unused-index notices before production traffic;
- leaked-password protection is a production configuration gate for the reusable reviewer password account.

## 5. Release environment preflight

Server production variables include the production Supabase public/server credentials, canonical app URL, strong Cron secret and room/recovery operational values.

Native/mobile release variables must include:

```text
VITE_API_BASE_URL=https://time-filler-games.vercel.app
VITE_APP_URL=https://time-filler-games.vercel.app
VITE_SUPABASE_URL=<production Supabase URL>
VITE_SUPABASE_PUBLISHABLE_KEY=<production publishable key>
VITE_AUTH_REDIRECT_URL=timefillergames://auth/callback
VITE_REVIEW_ACCESS_ENABLED=true
```

Run with real release variables in a secure environment:

```bash
npm ci
npm run release:preflight
```

Never commit the production server secret, reviewer password, or Cron secret.

## 6. Production smoke and deployed API validation

After the final production deployment:

```bash
STAGING_BASE_URL=https://time-filler-games.vercel.app npm run staging:smoke
```

Then use a disposable verified Host access token in a secure test environment to run:

```bash
npm run staging:load
npm run staging:e2e
```

Start load validation at 30 Players. Increase only when the previous level is clean. Load-test results are engineering evidence, not permission to advertise an arbitrary public capacity number.

The deployed E2E harness should exercise disposable rooms and identities and verify Standard Bingo concurrency, Majority Match scoring/reveal behavior, Quick Draw guess/scoring/round integrity, reconnect-sensitive paths and cleanup.

## 7. Account-erasure validation

The JWT-protected `erase-account` Edge Function is part of the production backend. Completion must only be reported after the Auth identity is actually deleted.

Before submission, validate both identity classes against the deployed and distributed products:

1. Disposable anonymous Player → Privacy → Delete account & data.
2. Confirm the Player Auth identity can no longer authenticate.
3. Disposable email Host → create a temporary room → Delete account & data.
4. Confirm the Host Auth identity can no longer authenticate.
5. Confirm Host-owned rooms are removed.
6. Confirm records that must remain in another Host's room are anonymized rather than retaining the deleted identity.
7. Confirm the public `/privacy` verification/deletion path works.
8. Confirm the completed privacy-request record reflects the correct app/web source.

Never use the production owner account for this test.

## 8. Real-device Release 1 QA

Automated CI cannot replace this gate. Record device/OS/browser/app build and PASS/FAIL for each test.

Minimum matrix:

- current iPhone on the TestFlight build
- current Android phone on the Play testing-track build
- laptop/desktop Host browser
- projector/large-screen Host scenario where practical
- multiple devices/tabs for reconnect and retry behavior

Whole-product path:

Host sign-in → choose 3/5/8/10 min → context → game → configuration → create room → QR/direct/PIN joins → Player language/avatar/nickname → Ready → play → pause/resume → disconnect/reconnect → results → Replay/Change Game → end room.

Standard Bingo:

- three candidates and timed auto-lock
- repeated draw requests cannot diverge state
- automatic marking/winner detection
- same-draw shared placement
- pause/reconnect

People Bingo:

- exactly 25 active identities required for 5×5
- smallest-phone readability
- real sessions at 25 and above 25 participants
- no duplicate identity inside one card
- drawn identities mark every matching cell
- observe subset distribution when more than 25 participants are eligible

Majority Match:

- private answer submission
- tied-majority scoring
- late join activates only at safe question boundary
- repeated Reveal/Next behavior is safe
- pause/resume deadline integrity

Quick Draw:

- finger and stylus/mouse where available
- clear while strokes are queued
- canvas reconstruction after reconnect
- accepted guess and artist scoring
- rate-limit behavior
- repeated Next does not duplicate rounds
- weak Wi-Fi / temporary offline / reconnect

Host recovery:

- designate the co-host
- interrupt Host heartbeat beyond the grace period
- only the designated verified co-host can claim
- live game pauses during transfer
- recovered Host can inspect state and resume/end

## 9. Accessibility release audit

Before screenshots and submission, test the final distributed builds for:

- keyboard-only Host/Player web flow
- visible focus
- VoiceOver on iPhone
- TalkBack on Android
- enlarged browser/device text
- reduced motion
- Light/Dark/System appearance
- contrast and forced-colors desktop behavior
- no important state communicated by color alone
- no clipped essential controls at supported text/device sizes

Any material navigation, labeling, focus, reading-order or clipping defect is a release blocker.

## 10. Closed beta and pacing

Run real groups through 3, 5, 8 and 10 minute sessions. Capture join time, Ready delays, actual game duration, reconnect incidence, confusing steps and device-specific failures.

People Bingo and Quick Draw require real-group/network evidence before public fairness/capacity/synchronization claims are made.

## 11. Store reviewer access

The production UI contains a dedicated **Store review access** path that uses reusable email/password credentials to enter the real Host flow.

Before submission:

1. Use a dedicated non-owner reviewer email identity.
2. Create a strong reusable password only after production leaked-password protection is enabled.
3. Verify the account is a non-anonymous Host identity.
4. Test the credentials on the exact TestFlight and Play testing-track builds.
5. Put the credentials only in the private Apple/Google review notes—not in source, screenshots, public support pages, or store descriptions.
6. Keep the backend online throughout review.

Normal Hosts may continue to use the product's verified email magic-link flow; the password path exists only to make review deterministic.

## 12. Apple App Store / TestFlight

Current Apple upload baseline: Xcode 26 or later using the iOS 26 SDK or later.

Account-owner actions:

1. Maintain an active Apple Developer membership.
2. Register/confirm App ID `com.timefillergames.app`.
3. Create the App Store Connect app record.
4. Configure the signing team/certificates/profile.
5. Archive the exact Release build with the required Xcode/iOS SDK generation.
6. Validate and upload the archive.
7. Test the uploaded binary through internal TestFlight first.
8. Run the full real-device/account-deletion/QR/reviewer-access checks on that TestFlight binary.
9. Add final screenshots and metadata.
10. Complete App Privacy and the current age-rating questionnaire accurately.
11. Add the working Support and Privacy URLs.
12. Supply reviewer credentials/notes and submit only after all release gates are green.

Apple expects login-gated apps to provide working review access, working backend services and final non-placeholder URLs/content.

## 13. Google Play

Release 1 targets Android API 36, meeting the August 31, 2026 phone/tablet submission requirement.

Account-owner actions:

1. Maintain/verify a Google Play developer account.
2. Create the app record for `com.timefillergames.app`.
3. Enable Play App Signing.
4. Upload a signed AAB derived from the validated release configuration.
5. Start Internal Testing, then the applicable Closed Testing track.
6. Test the Play-distributed binary, not only a sideloaded build.
7. Complete Data Safety from the actual binary/provider behavior.
8. Enter `https://time-filler-games.vercel.app/privacy-policy` as the Privacy Policy URL.
9. Enter `https://time-filler-games.vercel.app/privacy` as the external account-deletion URL.
10. Complete content rating and target-audience forms accurately; do not select child target groups merely for discoverability.
11. Supply reviewer credentials/notes where required.

If the developer account is a personal account created after November 13, 2023, Google currently requires a closed test with at least 12 opted-in testers continuously for 14 days before applying for production access.

## 14. Support and legal gate

Before either store submission:

- add a real, monitored public support contact to `/support` and the store records;
- obtain account-holder/legal acceptance of the Privacy Policy and Terms;
- remove all visible pre-release/draft wording from the public legal pages only after that approval;
- set an effective date and any required business/jurisdiction/consumer-rights terms based on actual legal/account-holder decisions, not engineering guesses.

## 15. Screenshots

Capture screenshots from the final distributed candidate after QA. Do not use engineering mocks as final store screenshots.

Storyboard:

1. Home / time-first setup
2. QR/PIN lobby
3. Standard Bingo
4. People Bingo
5. Majority Match
6. Quick Draw
7. results/podium
8. multilingual identity/join experience where useful

Do not expose real email addresses, tokens, room participants or admin diagnostics.

## 16. Final publication gate

TimeFillerGames is **ready to publish** only when all are true:

- exact release commit CI/integration/native builds green
- final production Vercel deployment READY
- release preflight and HTTPS smoke green
- deployed API E2E and launch-level load test green
- Supabase production reliability/security configuration complete
- account deletion verified end to end
- real-device QR/game/reconnect/Host-recovery matrix green
- People Bingo >25/readability evidence acceptable
- Quick Draw weak-network evidence acceptable
- accessibility audit complete
- closed beta pacing acceptable
- real support contact live
- Privacy Policy/Terms approved and no longer drafts
- dedicated reviewer credentials tested
- TestFlight binary tested
- Google testing-track binary tested
- final screenshots captured
- App Privacy / Data Safety / age-rating / target-audience forms completed accurately
- signing/contracts/account verification complete
- rollback path known

Only then should the project be described as **ready to publish to Apple and Google**.
