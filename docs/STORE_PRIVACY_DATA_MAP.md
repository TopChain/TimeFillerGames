# TimeFillerGames Release 1 Store Privacy/Data Map

This inventory is derived from the current application code and live Supabase Release 1 schema. It is an engineering source for Apple App Privacy and Google Play Data Safety answers; final legal text still requires launch-jurisdiction review.

## Identity and account data

- Players normally use an invisible temporary Supabase authenticated identity. The application stores the auth user UUID on the room participant row.
- Hosts use a verified email-based Supabase account. A designated recovery co-host may optionally secure the same temporary user ID by verifying an email before Host recovery is allowed.
- Participant rows store generated/Host-overridden nickname, built-in avatar identifiers, UI language, role, Ready/online state, join/last-seen/disconnect/leave timestamps, and nickname-lock state.
- Release 1 does not require a public profile or visible player account.

## Room/session data

- Room code, Host user UUID, game type, 3/5/8/10-minute duration, room language/context, participant cap, lock/late-join/ranking settings, theme identifier, lifecycle timestamps/status, and Host recovery heartbeat/generation.
- Game-session configuration/state and lifecycle timestamps.

## Gameplay data

- Bingo candidate/selected cards and winner placement data.
- Majority Match submissions and score entries.
- Quick Draw secret-word/round metadata, drawing stroke payloads, guesses, normalized guesses, acceptance/points, and scoring/ranking state.
- Public live Quick Draw guess streaming is disabled for the Release 1 launch; guesses remain server-mediated/private except for accepted/result behavior defined by the game.

## Moderation/security data

- Host moderation events record room, acting Host UUID, affected participant ID when applicable, moderation action, limited action details, and timestamp.
- Server rate-limit buckets store privacy-safe derived bucket keys, request counts, and timing windows; raw room/user identifiers are not used as bucket-key content by the application rate-limit helper.
- Private room authorization is enforced with Supabase RLS and server-mediated authoritative writes.

## Camera / device capabilities

- Camera access is used only when the user actively invokes native QR room scanning. The Release 1 scanner does not upload camera images to TimeFillerGames storage.
- Native Network status is used to show/recover connectivity state.
- Native haptics provide local interaction feedback.
- Native Share opens the operating-system share sheet for a room join URL; TimeFillerGames does not receive the destination selected in the system share sheet.

## Uploaded photos

- Uploaded participant-photo functionality must remain disabled for public Release 1 until retention, moderation, deletion, consent/age, and storage policy are approved and implemented. Built-in avatars are the launch-safe identity path.

## Third-party processing

- Supabase provides authentication, PostgreSQL persistence, and realtime infrastructure for Release 1.
- Production hosting provider for the Next.js authoritative API/web service is not yet selected/configured; store disclosures must be rechecked after that provider is finalized.

## Retention/deletion items still requiring release policy

- Room/game data retention duration and cleanup schedule.
- Moderation-event retention duration and support/escalation access.
- Host account deletion/support workflow.
- Any uploaded-photo lifecycle before that feature can be enabled.
- Legal Privacy Policy/Terms language and jurisdiction-specific child/classroom requirements.

Do not copy this engineering inventory verbatim into store declarations without validating the final production build, enabled feature flags, hosting provider, SDK inventory, and legal policy immediately before submission.
