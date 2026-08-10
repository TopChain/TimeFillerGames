# TimeFillerGames

A browser-based prototype for a fast multiplayer party-game platform designed to turn short periods of waiting time into group play.

## Prototype status

This is the initial `v0.1` prototype rebuilt from the available TimeFillerGames project context.

### Implemented

- Host / participant entry flow
- Six-digit room code generation
- Local lobby simulation
- Session duration and player-count controls
- Four-game selection structure
- Game 4: **English Word Guess**
  - Easy / Medium / Hard vocabulary
  - 30 / 45 / 60 second rounds
  - Correct / Skip controls
  - Score tracking and round results
- Responsive browser UI
- Language selector placeholder for English, Traditional Chinese, Spanish, Japanese, and Korean

### Intentionally not invented

The detailed rules for Games 1–3 are not present in the currently accessible project context, so those slots are kept as placeholders rather than silently changing the product specification.

## Run locally

Open `index.html` in any modern browser. No build step or dependencies are required.

## Next implementation steps

1. Restore the final rules/specifications for Games 1–3.
2. Add real room synchronization with a backend or realtime service.
3. Separate Host and Player views for multi-device play.
4. Add persistent localization strings for all supported languages.
5. Apply the finalized TimeFillerGames brand/CI system.
6. Add automated tests and deployment.
