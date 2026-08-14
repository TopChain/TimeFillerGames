# TimeFillerGames Release Checkpoint — 2026-08-14

This checkpoint records the Release 1 hardening state after the latest database, privacy, scoring, concurrency, native, security, and packaging work. It is a status snapshot; `docs/RELEASE_CHECKLIST.md` remains the detailed publication gate.

## Completed in the latest hardening pass

- Supabase organization confirmed as **TopChain AI Lab** without changing the project reference/database endpoint.
- Optional paid Supabase staging branch removed from the required publication path.
- Framework/security baseline upgraded to Next.js 16.3.1 + React 19.2 with production `npm audit --omit=dev --audit-level=high` gating.
- Android release AAB and iOS Xcode/native validation pipelines established, including Apple privacy manifest bundling and Android/iOS permission/privacy checks.
- PWA 192×192 and 512×512 raster install icons repaired and structurally regression-tested.
- Account-erasure Edge Function hardened so a privacy request is marked completed only after Auth identity deletion succeeds; live function redeployed with JWT verification.
- Bingo draw history/winner derivation hardened in PostgreSQL against stale/double Host requests; rollback-only live DB tests verified winner and stale-overwrite behavior.
- Quick Draw accepted-guess and artist scoring made transaction-bound and idempotent; duplicate next-round creation is canonicalized to one authoritative round.
- Majority Match reveal scoring made transaction-bound and idempotent, including tied-majority scoring.
- Database now enforces at most one live game session per room.
- Active participant nickname uniqueness is enforced case-insensitively; existing active authenticated-seat uniqueness remains the canonical seat invariant.
- Supabase advisor rerun found no new security warning-level issues; a duplicate seat index introduced during hardening was removed.

## Current publication state

The codebase is a **release candidate**, not yet ready to submit publicly. Core app implementation, security, native packaging, privacy/account deletion architecture, Release 1 game flows, and automated build gates are substantially complete.

## Remaining external / real-world gates

1. Deploy a stable HTTPS web/API origin with production environment secrets. The connected Vercel deploy action is currently unusable because its connector schema omits backend-required deployment fields; this is a tooling/account boundary rather than an application-code failure.
2. Move/confirm the production Supabase project on an always-on plan before public store review if required for reliability; the optional paid staging branch is not required.
3. Run deployed smoke, E2E, load/reconnect, and account-erasure tests against the HTTPS origin.
4. Complete real-device QA: iPhone, Android, laptop/projector, weak Wi-Fi/reconnect, screen reader/keyboard/text scale, Quick Draw network behavior, and People Bingo 25+ readability/fairness.
5. Create/test a dedicated reusable reviewer Host account for Apple/Google review.
6. Provide the real support contact and perform final account-holder/legal review of Privacy Policy and Terms.
7. Complete Apple Developer / App Store Connect signing + TestFlight and Google Play Console / Play App Signing + testing track.
8. Capture final screenshots and complete live age-rating, privacy/data-safety, target-audience, and store-review questionnaires.
9. Run closed beta on the signed store-distributed builds, final production smoke test, and rollback verification.

## Stop condition

Do not call TimeFillerGames 100% publish-ready until all unchecked external and real-device gates in `docs/RELEASE_CHECKLIST.md` are complete. No optional paid Supabase staging branch is required.