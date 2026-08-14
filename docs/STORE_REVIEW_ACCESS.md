# TimeFillerGames — Store Reviewer Access

Apple/Google reviewers must be able to reach Host-only functionality without controlling a magic-link inbox. Release 1 therefore includes a reusable email/password reviewer sign-in that is hidden unless the store-release flags are enabled.

## Release flags

Web/Vercel production build:

```text
NEXT_PUBLIC_REVIEW_ACCESS_ENABLED=true
```

Native Vite store build:

```text
VITE_REVIEW_ACCESS_ENABLED=true
```

`npm run release:preflight` fails if either store-release reviewer flag is not enabled in its corresponding production environment.

## Reviewer account

Before TestFlight / Play review:

1. Create **one dedicated permanent Supabase Auth user** for app review using an email/password identity.
2. Use an account dedicated to review/testing, not the owner’s personal administrator account.
3. Confirm the email identity so the reviewer is not blocked by verification.
4. Use a strong reusable password that is unique to the review account.
5. Do not give the review account Supabase Dashboard, GitHub, Vercel, service-role, or database-admin access. It is only a normal TimeFillerGames Host identity.
6. Test the exact credentials on the signed/TestFlight/Play-distributed binary.
7. Keep the account active and backend reachable throughout the review period.
8. Rotate/delete the review credentials after review if desired, but create working replacement credentials before any future store review/update.

## What reviewers see

When the store-release flag is enabled, the app/web shell displays **Store review access**. The reviewer enters the reusable demo email/password supplied privately in App Store Connect / Play Console. Successful authentication opens the real Host flow (`/?nativeHost=1`).

This is **not** a fake demo mode. Reviewers use the real production-like room/game APIs and can create rooms, join Players, and inspect Host-only features.

## App Store Connect review notes

Provide:

- Reviewer Host email
- Reviewer Host password
- Instruction: “Launch TimeFillerGames → tap **Store review access** → enter the reusable credentials → tap **Enter Host flow**.”
- Explain that normal Hosts use email magic links, but the reusable review account avoids requiring App Review access to an email inbox.
- Explain how a Player joins anonymously by QR/PIN/link if App Review wants to test a second device.
- If a feature needs 25 participants (People Bingo), say that People Bingo 5×5 requires 25 active identities by design and provide the normal Standard Bingo / Majority / Quick Draw path for ordinary small-device review.

## Google Play App Access instructions

Use the same reusable reviewer credentials and interaction steps. Mark the instructions as reusable and sufficient to access Host-restricted functionality; do not provide an OTP, expiring magic-link URL, QR code, or credentials that depend on location/device state.

## Security boundary

- No reviewer credential is committed to Git.
- No reviewer credential is embedded in web/native environment variables.
- The flags reveal only the password-auth form; Supabase still verifies the credentials normally.
- Permanent Host checks remain enforced by server authorization.
- The reviewer account cannot obtain service-role/server credentials.

Do not submit to either store until this flow has been tested on the exact signed binaries that will be reviewed.
