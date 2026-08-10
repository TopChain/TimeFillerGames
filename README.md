# TimeFillerGames

**Make every spare moment playable.**

TimeFillerGames is a host-led multiplayer mini-game platform for 3, 5, 8, or 10 minutes of spare group time. This release-candidate branch is being rebuilt directly from the approved Product Plan v1.0 and Brand & Product CI Guidelines v1.0.

## Release strategy

- **Release 1:** Bingo, Majority Match, Quick Draw & Guess
- **Release 1.1:** Word Challenge, Math Challenge
- Participants join without an account through PIN / QR / direct link.
- Host and Player use distinct semantic UI roles while sharing one master brand.

## Current architecture

- Next.js + React + TypeScript
- Web-first / installable PWA direction
- Supabase-ready database + realtime boundary
- Server-authoritative game-state design
- Semantic CI tokens, not per-component raw colors
- Six UI locales: `en`, `zh-Hant`, `zh-Hans`, `es`, `ja`, `ko`

## Local setup

Requirements: Node.js 20+

```bash
cp .env.example .env.local
npm install
npm run dev
```

Open `http://localhost:3000`.

For a production Supabase environment, populate `.env.local`, then apply `supabase/migrations/001_initial.sql` through the Supabase migration workflow.

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
- reduced-motion support

## What still blocks a public production launch

The repository can be made deployment-ready in code, but public launch still requires external production inputs that cannot be invented or self-approved:

1. Supabase project URL/keys and production database deployment.
2. Final domain and hosting account / deployment target.
3. Final master logo/icon asset exports for PWA icons and store/marketing surfaces.
4. Privacy Policy and Terms appropriate to intended classroom/children use, reviewed for the launch jurisdictions.
5. Final moderation/profanity implementation and operational abuse/report process.
6. Curated/QA'd Release 1 content (especially Quick Draw word bank and Majority Match prompts).
7. Real-device usability testing and load testing before advertising room capacity.
8. Closed-beta validation of duration estimates.

Do not describe Word Challenge as an official CEFR test or Math Challenge as a standardized placement assessment.

## Branch

Release-candidate work: `agent/release-candidate-v1`
