# TimeFillerGames Release 1 Store Submission Draft

Engineering draft for App Store Connect and Google Play Console. Final URLs, legal text, age/target-audience questionnaires, screenshots and account-holder declarations must be completed before submission.

## Product identity

- App name: **TimeFillerGames**
- Bundle / application ID: `com.timefillergames.app`
- Release: `1.0.0` (build/version code `1`)
- Positioning: **Make every spare moment playable.**
- Tagline: **Short games. Real connections.**
- Release 1 modes: Standard Number Bingo, People Bingo 5×5, Majority Match, Quick Draw & Guess.
- Session presets: 3 / 5 / 8 / 10 minutes.

## Apple App Store draft

Apple currently limits the app name and subtitle to 30 characters, promotional text to 170 characters, description to 4000 characters, and keywords to 100 bytes.

### Name
TimeFillerGames

### Subtitle
Short games. Real connections.

### Promotional text
Turn spare minutes into a shared game. Host a room, let everyone join from their phone, and play Bingo, Majority Match, or Quick Draw together.

### Description
TimeFillerGames turns short gaps in the day into multiplayer moments your group can share.

Choose how much time you have—3, 5, 8, or 10 minutes—then host a room and launch a game designed to fit. Players join from their own phones with a room code, QR code, or link.

RELEASE 1 GAMES
• Standard Number Bingo — choose a personal card, follow server-drawn numbers, and let automatic marking handle the board.
• People Bingo 5×5 — with a qualifying group, play a participant-based Bingo board using room avatars and display names.
• Majority Match — predict which answer the room will choose most often. No speed bonus; tied majority answers receive equal credit.
• Quick Draw & Guess — take turns drawing a secret word while the room guesses. Drawing, guesses, timing, and scoring are synchronized through the room.

BUILT FOR SHORT GROUP TIME
• 3, 5, 8, or 10-minute session presets
• Host-led room controls
• QR code, link, or room-code joining
• Built-in avatars and generated nicknames
• Player-specific interface language
• Reconnect support when a connection drops
• Pause and resume without silently consuming the round timer
• Private player results plus room-level results according to Host settings

TimeFillerGames is designed for friends, families, classrooms, teams, and mixed groups who want something social to do without setting up a long game.

No advertising or cross-app tracking SDK is included in Release 1.

### Keywords
party,group,bingo,drawing,guessing,classroom,team,icebreaker,multiplayer,quickgames

### Primary category draft
Games

### Secondary category draft
Entertainment

### Support URL
Required before submission. Point to the final TimeFillerGames support page.

### Privacy Policy URL
Required before submission. Point to the reviewed public Privacy Policy.

### Accessibility URL
Recommended once the final accessibility/support page is published.

## Google Play draft

Google Play currently limits the app name to 30 characters, short description to 80 characters, and full description to 4000 characters.

### App name
TimeFillerGames

### Short description
Fast multiplayer games for spare moments with friends, classes, and teams.

### Full description
Make every spare moment playable with TimeFillerGames, a host-led multiplayer game app built for short group sessions.

Pick 3, 5, 8, or 10 minutes, create a room, and invite everyone with a room code, QR code, or link. Players join from their own phones and move through a simple identity, lobby, game, and result flow.

RELEASE 1 INCLUDES
• Standard Number Bingo with personal card choice, server draws, automatic marking, and shared-placement handling.
• People Bingo 5×5 for qualifying groups, using room avatars and display names.
• Majority Match, where everyone predicts the group majority with equal scoring and no speed bonus.
• Quick Draw & Guess with synchronized drawing, private guess handling, Host controls, and server scoring.

DESIGNED FOR REAL GROUPS
• Time-first 3 / 5 / 8 / 10-minute setup
• Host room controls and participant moderation
• QR, link, and room-code entry
• Built-in avatars and generated nicknames
• Multiple player interface languages
• Reconnect support
• Server-authoritative timers and scoring
• Pause/resume with preserved remaining time
• Public and private result options

TimeFillerGames is built for social play in spare moments—not long sessions, gambling, or competitive esports.

Release 1 contains no advertising SDK and no cross-app tracking SDK.

### Category draft
Game / Casual

## Store privacy/data-safety working answers

These answers must remain synchronized with `docs/STORE_PRIVACY_DATA_MAP.md` and the final Privacy Policy.

### Advertising / tracking
- Ads: No in Release 1.
- Cross-app / cross-site tracking: No in Release 1.
- Advertising ID usage: None intentionally implemented.

### Data used for app functionality
- Host email address for Host authentication.
- Temporary authenticated Player identity / user identifier.
- Player nickname, selected built-in avatar, interface language, readiness/presence state.
- Room/game configuration and game submissions required to run multiplayer sessions.
- Scores/rankings/results.
- Quick Draw guesses and drawing strokes for game operation.
- Moderation events for Host actions and abuse/safety operations.
- Hashed/rate-limit operational identifiers for abuse prevention.

### Data sharing draft
No sale of personal data and no advertising-data sharing is implemented. Supabase and the hosting provider process data as service providers/subprocessors to operate authentication, database, realtime, and application infrastructure.

### Encryption
Production network traffic must use HTTPS/TLS. Android release validation must keep cleartext HTTP disabled before signing.

### Account deletion
Hard release gate. Apple requires in-app initiation for accounts created by the app, including automatically generated guest accounts. Google Play requires an in-app account-deletion path and an external web deletion/request path when account creation is supported. Do not submit until both Host and temporary Player identity deletion flows are implemented and tested.

## Screenshot storyboard

Create real-device screenshots only after the staging backend and final visual assets are connected. Suggested sequence:
1. Home — “Make every spare moment playable.”
2. Time-first setup — 3 / 5 / 8 / 10 minutes.
3. Host lobby — room code + QR + readiness.
4. Bingo — live marked board.
5. Majority Match — private prediction / aggregate reveal.
6. Quick Draw — drawing canvas and guess interaction.
7. Results — public podium + private result.
8. Player identity — avatar/language/nickname flow.

Apple accepts 1–10 screenshots per supported device class; prepare the highest required iPhone resolution plus any separate iPad set if iPad distribution remains enabled.

## Submission blockers that metadata cannot solve

- Production/staging HTTPS backend and domain.
- Production environment secrets configured outside Git.
- Final Privacy Policy / Terms / support pages.
- Account-deletion implementation and web path.
- Real-device accessibility and network/reconnect QA.
- Final approved store icon / stopwatch-controller brand asset.
- iOS signing, App Store Connect record, TestFlight validation.
- Android Play Console record, signing key, testing-track requirements.
- Age rating / target audience questionnaires and final legal review.
