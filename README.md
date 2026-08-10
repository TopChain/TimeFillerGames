# TimeFillerGames

**Make every spare moment playable.**

TimeFillerGames is a host-led multiplayer mini-game platform for 3, 5, 8, or 10 minutes of spare group time. This release-candidate branch is being rebuilt directly from the approved Product Plan v1.0 and Brand & Product CI Guidelines v1.0.

## Release strategy

- **Release 1:** Bingo, Majority Match, Quick Draw & Guess
- **Release 1.1:** Word Challenge, Math Challenge
- Participants join without a visible account through PIN / QR / direct link.
- Host and Player use distinct semantic UI roles while sharing one master brand.

## Current architecture

- Next.js + React + TypeScript
- Web-first / installable PWA direction
- Supabase-backed room/game persistence + private realtime boundary
- Server-authoritative Release 1 game state
- Semantic CI tokens, not per-component raw colors
- Six UI locale identifiers: `en`, `zh-Hant`, `zh-Hans`, `es`, `ja`, `ko`
- Persisted Light / Dark / System appearance preference

## Release 1 implementation status

### Standard Number Bingo
- 3 personal candidate cards with timed choice
- server auto-assignment and card lock
- server random draws and automatic marking
- one-line winner validation with same-draw shared placement
- server-authoritative pause/resume

### People Bingo 5×5
- hard minimum of 25 unique active participants
- avatar + display-name identity cells
- no repeated participant within a card
- server identity draws + automatic marking
- larger boards disabled pending fairness/readability validation

### Majority Match
- private predictions and no speed bonus
- tied top answers all receive full credit
- server question timers, aggregate reveal and ranking privacy
- late joins queue safely during a question and activate at a between-question boundary when capacity permits
- last-question late joins wait for the next lobby rather than entering final rankings

### Quick Draw & Guess
- fixed artist rotation with random or join-order selection
- server-only secret words
- touch / mouse / stylus drawing canvas
- ordered stroke batching and canvas clear
- guess and stroke flood controls
- conservative normalized answer matching
- optional audience guessing and Host-only guess moderation queue
- server-authoritative pause/resume preserving the active drawing deadline

## Room / safety flow already implemented

- Host magic-link authentication
- invisible anonymous Player authentication
- PIN, direct-link and locally generated QR join
- Ready state, spectator foundation, heartbeat/reconnect and seat recovery
- Replay / Change Game while keeping the room
- basic Host seat moderation: participant ↔ spectator in lobby and participant removal with confirmation
- ranking visibility/privacy controls

## Local setup

Requirements: Node.js 20+

```bash
cp .env.example .env.local
npm install
npm run dev
```

Open `http://localhost:3000`.

For a production Supabase environment, populate `.env.local`, then apply every migration in `supabase/migrations/` in order through the Supabase migration workflow.

## Quality commands

```bash
npm run typecheck
npm run test
npm run build
```

`npm run check` runs the release verification sequence.

## Product rules already encoded

- Time-first presets: 3 / 5 / 8 / 10 minutes
- Exact five-game portfolio and release assignment
- Hard-minimum readiness logic
- “No game-rule maximum” terminology
- Competition-style shared-rank tie handling
- Bingo normal board mapping: 5×5 / 6×6 / 7×7 / 8×8 for 3 / 5 / 8 / 10-minute planning presets
- Word defaults: 5 / 10 / 15 / 20 questions
- Math defaults: 6 / 10 / 16 / 20 questions
- 60 built-in-avatar category model
- Six-locale foundation

## Brand / accessibility system encoded

- Brand Indigo `#5B5DEE`
- Play Teal `#22D3C5`
- Action Coral `#FF647C`
- Reward Gold `#FFC857`
- Game Navy `#111827`
- Cloud White `#F8FAFC`
- Host primary `#5B5DEE`
- Player primary `#0F7A86`
- 20px cards, 12–16px controls, 44px minimum primary interaction height
- reduced-motion support
- keyboard focus-visible treatment
- increased-contrast and forced-colors hardening
- Light / Dark / System preference using semantic tokens

The approved six branded color themes are **not** invented in code because their exact definitions are not currently encoded in this repository.

## What still blocks a public production launch

The repository is a strong **draft release candidate**, not a production-ready release. Public launch still requires external production inputs and validation that cannot be self-approved:

1. Production/staging Supabase project, secrets, migrations and end-to-end multi-browser validation.
2. Final domain and hosting / preview-deployment target.
3. Final master logo/icon exports for PWA/store/marketing surfaces.
4. Privacy Policy and Terms appropriate to intended classroom/children use, reviewed for launch jurisdictions.
5. Full profanity/harassment policy, advanced moderation operations and required moderation/audit storage.
6. Curated/QA'd Release 1 content, especially Majority Match prompts and the Quick Draw word bank.
7. Complete six-language Release 1 interface copy and separation of interface language from game-content language.
8. Real keyboard/screen-reader, text-scaling, contrast and supported-device accessibility audits.
9. iPhone/Android QR scanning, weak-Wi-Fi/reconnect and Quick Draw real-network tests.
10. People Bingo readability/fairness sessions and general load testing before public capacity claims.
11. Host disconnect/co-host recovery policy and implementation.
12. Closed-beta validation of actual 3 / 5 / 8 / 10-minute duration estimates.

Do not describe Word Challenge as an official CEFR test or Math Challenge as a standardized placement assessment.

## Branch

Release-candidate work: `agent/release-candidate-v1`
