# PROJECT_STATE.md

## Current Version

v0.3.0

---

## Current Status

Public PWA Release

The game is available as a Progressive Web App at `https://adityasingh-x.github.io/snake-run/`. It can be installed on phones and desktops, and played fully offline.

The project is now gathering feedback from family and friends.

---

## Current Milestone

Milestone 4 - Feedback & Iteration

Current Goal:

Validate the game with real players and improve based on feedback.

---

## Current Priorities

1. Gather feedback from family and friends
2. Fix usability issues
3. Improve controls based on feedback
4. Improve onboarding
5. Resolve gameplay frustrations

---

## Next Milestone

Milestone 4 - Feedback & Iteration

Planned Focus:

- Gather feedback
- Fix usability issues
- Improve controls
- Improve onboarding
- Resolve gameplay frustrations

---

## Completed Features

### Core Gameplay

- Snake movement
- Food collection
- Collision detection
- Scoring system
- Game over state
- Level progression
- Obstacle system
- Win condition

### User Experience

- Accessibility support
- Sound effects
- High score persistence

### Visuals

- Directional snake eyes

### Project Foundation

- React + TypeScript + Vite setup
- Project documentation structure
- Architecture documentation
- Specification documentation

### Foundation Refactor (Milestone 1)

- Game engine separated from React (`src/game/`)
- Platform abstraction layer created (`src/platform/`)
- React bridge hook (`useGame.ts`)
- Framework-agnostic Engine class
- 92 unit tests passing

### Mobile Experience (Milestone 2)

- Mobile viewport lock (no scroll, no pull-to-refresh, no double-tap zoom)
- On-screen pause button for touch devices
- Reliable swipe gestures with axis-locked recognizer
- Responsive board layout (CSS-only sizing, aspect-ratio)
- iOS safe-area handling
- D-pad visibility gating (hidden during overlays)
- D-pad sizing for thumb comfort (64px on touch)
- 116 unit tests passing

### PWA Release (Milestone 3)

- PWA manifest with installable standalone mode
- Service worker with full offline caching
- Auto-updating service worker
- GitHub Pages deployment pipeline
- Shareable public URL
- Installable on phones and desktops

### Testing

- Automated testing infrastructure

---

## In Progress

- Feedback gathering

---

## Known Technical Debt

_No known technical debt._

---

## Current Architectural Direction

Frontend:

- React
- TypeScript
- Vite

Testing:

- Vitest

Styling:

- CSS Modules

Audio:

- Web Audio API

Platform Strategy:

- Browser-first development
- PWA as first public release
- Capacitor for future mobile packaging
- Tauri for future desktop packaging

Gameplay Principles:

- Deterministic gameplay
- Offline-first where practical
- No dependency on AI services for gameplay

---

## Success Definition For Current Milestone

Milestone 3 success criteria (completed):

- Shareable URL (`https://adityasingh-x.github.io/snake-run/`)
- Installable on phones (Android "Add to Home Screen", iOS share menu)
- Installable on desktops (Chrome/Edge install icon, standalone window)
- Playable offline (airplane mode test)
- All game features work offline (start, eat, level up, game over, restart, sound toggle, d-pad)
- Sound works in installed PWA
- High score persists across sessions
- `npm run build` completes with no errors
- All 122 tests pass
- No new lint errors
- `dist/` contains `sw.js`, `manifest.webmanifest`, and `registerSW.js`
- `SPEC.md`, `ARCHITECTURE.md`, `PROJECT_STATE.md`, and `ROADMAP.md` updated

Milestone 4 success criteria (in progress):

- Feedback collected from family and friends
- Usability issues identified and prioritized
- Control improvements implemented based on feedback
- Onboarding experience improved
- Gameplay frustrations resolved

---

## Important Notes

The current objective is feedback gathering and iteration.

The PWA is live at `https://adityasingh-x.github.io/snake-run/` and can be installed on phones and desktops.

The first public release target is to gather feedback from family and friends and improve the game based on their experience.

AI-generated gameplay and content systems remain a future consideration and are not part of the current milestone.
