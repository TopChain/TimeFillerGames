# TimeFillerGames Release 1 Store Privacy/Data Map

This inventory is derived from the current application code, live Supabase schema, and documented infrastructure behavior. It is an engineering source for Apple App Privacy and Google Play Data Safety answers; final legal text still requires launch-jurisdiction review and validation against the production build.

## Identity and account data

- Players normally use an invisible temporary Supabase authenticated identity. The application stores the Auth user UUID on the room participant row.
- Hosts use a verified email-based Supabase account. A designated recovery co-host may optionally secure the same temporary user ID by verifying an email before Host recovery is allowed.
- Participant rows store generated/Host-overridden nickname, built-in avatar identifiers, UI language, role, Ready/online state, join/last-seen/disconnect/leave timestamps, and nickname-lock state.
- Release 1 does not require a public profile or visible Player account.
- Release 1 uses built-in avatars only. Custom participant photos are disabled in UI/API and database-enforced off.

## Room/session data

- Room code, Host user UUID, game type, 3/5/8/10-minute duration, room language/context, participant cap, lock/late-join/ranking settings, theme identifier, lifecycle timestamps/status, and Host recovery heartbeat/generation.
- Game-session configuration/state and lifecycle timestamps.
- Rooms default to a 120-minute expiration TTL. The server accepts a deployment override only within 15–1440 minutes.

## Gameplay data

- Bingo candidate/selected cards and winner placement data.
- Majority Match submissions and score entries.
- Quick Draw secret-word/round metadata, drawing stroke payloads, guesses, normalized guesses, acceptance/points, and scoring/ranking state.
- Public live Quick Draw guess streaming is disabled for the Release 1 launch; guesses remain server-mediated/private except for accepted/result behavior defined by the game.

## Deferred Release 1.1 server-only schema

- `content_packs`, `player_question_history`, and `game_results` exist as a dormant Word Challenge / Math Challenge foundation.
- These tables currently contain no rows in the connected project, have RLS enabled, have no anon/authenticated policies, and are restricted to server/service-role access.
- Release 1 does not expose Word Challenge or Math Challenge as playable public games.

## Moderation/security/infrastructure data

- Host moderation events record room, acting Host UUID, affected participant ID when applicable, moderation action, limited action details, and timestamp.
- Server rate-limit buckets store privacy-safe derived bucket keys, request counts, and timing windows; raw room/user identifiers are not used as bucket-key content by the application rate-limit helper.
- Supabase Auth audit logging automatically records authentication events and may include user/account identifier, IP address, user-agent/browser or device information, timestamp, action, and provider metadata. Supabase also uses client IP for authentication rate limiting.
- Hosting/infrastructure request logs may include request path/method/status, user agent, request identifiers, processing region, and client IP depending on provider configuration.
- These network/authentication records are used for app functionality, authentication, fraud/abuse prevention, security, compliance, troubleshooting, and service reliability—not advertising or cross-app tracking.
- Private room authorization is enforced with Supabase RLS and server-mediated authoritative writes.

### Conservative store-category mapping

Apple App Privacy / app-level manifest working mapping:
- Email Address — linked, App Functionality, not tracking.
- User ID — linked, App Functionality, not tracking.
- Gameplay Content — linked, App Functionality, not tracking.
- Product Interaction — linked, App Functionality, not tracking.
- Other Diagnostic Data — linked where authentication/security logs contain user ID + IP/user agent; App Functionality/security, not tracking.

Google Play Data Safety working mapping:
- Personal info: email address for Host authentication/account management.
- Device or other IDs / Diagnostics: authentication/security request identifiers, IP/user-agent/browser/device-related log data, used for App functionality and Fraud prevention/security/compliance.
- App activity / Other user-generated content as applicable to multiplayer gameplay, guesses/drawings and room interaction.
- No ads/tracking purposes.
- Do **not** declare a location feature merely because an IP address exists. If the final hosting/auth provider is configured to infer/store user location from IP, Google requires the corresponding Approximate Location declaration and the form must be updated before submission.

## Camera / device capabilities

- Camera access is used only when the user actively invokes native QR room scanning. The Release 1 scanner does not upload camera images to TimeFillerGames storage.
- Native Network status is used to show/recover connectivity state.
- Native haptics provide local interaction feedback.
- Native Share opens the operating-system share sheet for a room join URL; TimeFillerGames does not receive the destination selected in the system share sheet.
- TimeFillerGames does not request Android/iOS device location permissions for Release 1.

## Retention and cleanup

- Release 1 room data is ephemeral by design. New rooms default to a 120-minute expiration.
- The source-ready Vercel Cron configuration calls the authenticated retention endpoint daily.
- The retention service deletes expired room rows in batches; foreign-key cascades remove associated participants, game sessions, submissions, score entries, Bingo data, Quick Draw data, and room-linked moderation events.
- Rate-limit buckets not updated for 24 hours are deleted by the same cleanup job.
- Supabase authentication/security and hosting infrastructure logs follow the provider/account configuration and provider retention schedule; they are not deleted by the room-retention job.
- The deployment must keep the retention Cron enabled and a strong `CRON_SECRET` configured; `npm run release:preflight` rejects a missing/weak Cron secret.
- Final legal wording may describe shorter/longer practical deletion timing based on the production Cron schedule and operational/provider logs/backups; engineering should not make unsupported backup-retention claims.

## Account deletion

- In-app Privacy controls allow an authenticated Host or temporary Player identity to initiate permanent erasure.
- The deployed JWT-protected Supabase `erase-account` Edge Function v2 closes rooms hosted by the user, removes account-linked moderation events, anonymizes any remaining participant records to `Deleted Player`, marks those seats offline/left, deletes the Supabase Auth identity, and only then marks the privacy request completed. If the erasure operation fails before Auth deletion, the request is returned to pending where possible rather than falsely reporting completion.
- The public `/privacy` page provides the external first-party account/data deletion entry point.
- Infrastructure/security records that a provider retains for fraud prevention, security, legal obligations, or platform operation may follow the applicable provider retention policy rather than the room TTL.
- End-to-end deletion still requires validation against the production-like deployed web/native build before submission.

## Third-party processing

- Supabase provides authentication, PostgreSQL persistence, Edge Function execution, realtime infrastructure, auth audit/security logging, and platform logs for Release 1.
- The intended Next.js hosting target is Vercel, but the connected Vercel team currently has no project and deployment is not yet configured. Store disclosures must be rechecked after the final hosting project/origin and log settings are live.
- Apple lists Capacitor among commonly used SDKs that require their own privacy manifest. Native iOS CI verifies the installed Capacitor dependency contains at least one `PrivacyInfo.xcprivacy`; TimeFillerGames separately bundles its own app-level privacy manifest.
- No advertising SDK or cross-app tracking SDK is implemented in Release 1.

## Remaining legal/account-owner decisions

- Real support contact identity and support escalation workflow.
- Final Privacy Policy and Terms acceptance, governing law, and launch-jurisdiction language.
- App Store / Play age-rating and target-audience declarations based on actual Release 1 behavior.
- Final provider log-retention/configuration review after the production Vercel project is created.
- Any future uploaded-photo lifecycle, consent, moderation, storage and retention rules before that feature can ever be enabled.

Do not copy this engineering inventory verbatim into store declarations without validating the final production build, enabled feature flags, hosting provider/log settings, SDK inventory, legal policy, account-deletion behavior, and production retention job immediately before submission.
