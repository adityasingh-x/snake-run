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

Milestone 2 success criteria (completed):

- Page cannot be scrolled, pinched, or double-tap zoomed during play
- Vertical swipe-down does NOT trigger pull-to-refresh
- An on-screen pause button is visible on touch devices while playing
- Swipes are reliable and axis-locked (no accidental swipes)
- Board fits the viewport at any phone size, portrait or landscape
- D-pad is comfortably reachable with thumbs and hidden during overlays
- Safe-area insets are respected on notched devices
- All existing tests pass; new tests cover gesture, pause, and board sizing
- No new TypeScript or lint errors
- SPEC.md, ARCHITECTURE.md, PROJECT_STATE.md, and ROADMAP.md are updated

---

## Important Notes

The current objective is PWA release preparation.

The current objective is to strengthen the foundation required for:

- Public sharing with family and friends
- Offline capability
- Installable on home screens

The first public release target is a PWA that can be shared with family and friends for feedback.

AI-generated gameplay and content systems remain a future consideration and are not part of the current milestone.
