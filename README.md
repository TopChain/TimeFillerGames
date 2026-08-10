# TimeFillerGames

TimeFillerGames is a fast multiplayer party-game platform designed to turn short periods of waiting time into group play.

## Current milestone: v0.2 realtime prototype

The project now has a real Node.js + Socket.IO multiplayer foundation instead of the original single-browser simulation.

### Implemented

- Host / participant entry flow
- Six-digit room creation and joining
- Multi-device realtime room synchronization
- Host-owned room lifecycle
- Configurable maximum player count
- Synchronized lobby player list
- Game 4: **English Word Guess**
  - Easy / Medium / Hard vocabulary
  - 30 / 45 / 60 second rounds
  - Host-only word display and controls
  - Participant guessing screen
  - Synchronized timer
  - Correct / Skip controls
  - Synchronized score
  - End-of-round results
  - Return-to-lobby flow
- Responsive browser UI
- Health endpoint at `/health`

### Intentionally not invented

The final detailed rules for Games 1–3 are not present in the currently accessible source context. Those game slots remain reserved so this implementation does not silently change the agreed product design.

## Architecture

- `server.js` — Express + Socket.IO realtime room/game server
- `public/index.html` — multiplayer browser UI
- `public/app.js` — client-side socket and interface logic
- `public/style.css` — responsive visual system
- `package.json` — Node runtime and dependencies

Room state is currently kept **in memory**. Restarting the server clears active rooms. This is intentional for the prototype stage; persistent storage can be added after the room/game UX is validated.

## Run locally

Requirements: Node.js 18+

```bash
npm install
npm start
```

Then open:

```text
http://localhost:3000
```

For a multi-device test on the same local network, open the host computer's LAN IP and port `3000` from the other device, subject to local firewall settings.

## Validation

Basic JavaScript syntax checks:

```bash
npm run check
```

## Next implementation steps

1. Restore the exact specifications for Games 1–3 and implement them as independent game modules.
2. Add reconnection/session recovery so temporary network loss does not immediately remove a player.
3. Add persistent room/session infrastructure for production deployment.
4. Add full localization for English, Traditional Chinese, Spanish, Japanese, and Korean.
5. Apply the finalized TimeFillerGames brand/CI system.
6. Add automated integration tests for room creation, joining, host authorization, timers, and scoring.
7. Deploy a public staging environment for real phone-to-phone testing.

## Repository

`TopChain/TimeFillerGames`
