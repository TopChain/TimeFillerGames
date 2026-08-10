# TimeFillerGames

**Make every spare moment playable.**

TimeFillerGames is a host-led multiplayer mini-game platform for 3, 5, 8, or 10 minutes of spare group time. The release-candidate branch is implemented from the approved Product Plan v1.0 and Brand & Product CI Guidelines v1.0.

## Release strategy

- **Release 1:** Bingo (Standard Number + People Bingo 5×5), Majority Match, Quick Draw & Guess
- **Release 1.1:** Word Challenge, Math Challenge
- Players join by PIN / QR / direct link without creating a visible account.
- Host and Player use distinct semantic UI roles while sharing one master brand.

## Current Release 1 implementation

### Multiplayer room foundation
- Host magic-link authentication boundary
- invisible anonymous Player authentication
- server-mediated room create/join/update
- PIN/direct-link join
- 60 built-in avatar identities + generated nicknames
- server-backed Ready state
- private room authorization / Realtime boundary
- heartbeat, reconnect grace and saved-seat recovery foundation
- spectator role foundation
- Replay / Change Game while keeping the room

### Standard Number Bingo
- 3 candidate cards per active player
- Host card-choice timer + server automatic assignment
- locked personal cards
- server random unused-number draws
- automatic marking
- horizontal / vertical / diagonal one-line validation
- same-server-draw shared placement
- server-backed results

### People Bingo 5×5
- Release 1 limited to 5×5
- hard minimum: 25 unique active participants
- each cell: room participant avatar + display name
- no repeated participant inside one card
- 3 candidate identity cards + server automatic assignment
- server participant-identity draws + automatic marking
- same-draw shared placement
- larger People Bingo boards intentionally disabled pending fairness/readability testing

### Majority Match
- minimum 3 active players
- private prediction per question
- no speed bonus
- tied highest-vote answers all receive full credit
- server timers / aggregate reveal / optional percentages
- ranking privacy controls
- starter engineering content bank; launch content still requires QA

### Quick Draw & Guess
- server-fixed artist rotation: random or join order
- late joiners do not enter the current artist rotation
- server-only secret word
- touch/mouse/stylus SVG drawing canvas
- stroke batching, input validation, flood limiting and ordered Clear
- normalized conservative guess acceptance
- guess rate limiting
- optional audience/spectator guessing
- Host-only moderation queue option
- optional decreasing time component for guessers + artist success-based scoring foundation
- starter engineering word bank; launch content/fuzzy spelling policy still require QA

## Current architecture

- Next.js + React + TypeScript
- web-first / installable PWA direction
- Supabase database + private room authorization boundary
- server-authoritative game outcomes
- semantic CI tokens, not per-component raw colors
- six UI locale identifiers: `en`, `zh-Hant`, `zh-Hans`, `es`, `ja`, `ko`
- GitHub Actions: TypeScript + automated rule tests + production build

## Local setup

```bash
cp .env.example .env.local
npm install
npm run dev
```

Open `http://localhost:3000`.

The static/visual shell can run locally without production credentials, but real Host/Player rooms require a Supabase staging project and the environment values documented in `.env.example`.

Apply all files in `supabase/migrations/` in numeric order to the staging database before end-to-end multiplayer testing.

## Quality commands

```bash
npm run typecheck
npm run test
npm run build
```

`npm run check` runs the release verification sequence.

## Product rules encoded

- time-first presets: 3 / 5 / 8 / 10 minutes
- exact five-game portfolio and Release 1 / 1.1 assignment
- hard-minimum readiness logic
- “No game-rule maximum” terminology
- competition-style shared-rank tie handling
- Standard Bingo planning mapping: 5×5 / 6×6 / 7×7 / 8×8 for 3 / 5 / 8 / 10-minute presets
- People Bingo 5×5 = 25 unique active-player hard minimum
- Word planning defaults: 5 / 10 / 15 / 20 questions
- Math planning defaults: 6 / 10 / 16 / 20 questions
- 60 built-in-avatar category model
- six-locale foundation

## Brand system encoded

- Brand Indigo `#5B5DEE`
- Play Teal `#22D3C5`
- Action Coral `#FF647C`
- Reward Gold `#FFC857`
- Game Navy `#111827`
- Cloud White `#F8FAFC`
- Host primary `#5B5DEE`
- Player primary `#0F7A86`
- 20px cards, 12–16px controls, 44px minimum primary interaction height
- reduced-motion baseline

## What still blocks a public production launch

Passing CI is necessary but not sufficient. Release 1 still requires:

1. A real Supabase **staging** project, credentials, and all migrations applied.
2. Staging hosting/domain plus production QR-code generation and phone-camera testing.
3. End-to-end multi-browser and multi-device testing on iPhone, Android, laptop/projector and weak Wi-Fi.
4. Load/reconnect testing before publishing room-capacity claims.
5. Host disconnect/co-host recovery and production-grade moderation/removal controls.
6. Server-authoritative pause/resume for timed game deadlines, especially Quick Draw.
7. People Bingo >25 fairness testing and 5×5 phone-readability testing.
8. Curated/QA'd Majority Match prompts and Quick Draw word banks; fuzzy spelling policy based on testing.
9. Complete six-language copy across all Release 1 game screens.
10. Final Light/Dark/System + approved themes, keyboard/screen-reader/text-scaling audit.
11. Final master logo/PWA icon exports.
12. Privacy Policy, Terms, uploaded-photo policy, support/accessibility contacts and classroom/children legal review.
13. Closed beta validating actual 3 / 5 / 8 / 10-minute session pacing.
14. Final production smoke test and rollback plan.

See `docs/RELEASE_CHECKLIST.md` for the tracked publication gate.

Do not describe Word Challenge as an official CEFR test or Math Challenge as a standardized placement assessment.

## Branch

Release-candidate work: `agent/release-candidate-v1`
