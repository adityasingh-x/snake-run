# PROJECT_STATE.md

## Current Version

v0.2.0

---

## Current Status

Mobile-Ready Prototype

The game is fully playable on desktop and mobile browsers with responsive layout, reliable touch controls, and iOS safe-area support.

The project has not yet been publicly released.

---

## Current Milestone

Milestone 3 - PWA Release

Current Goal:

Get the game into players' hands quickly with PWA support, offline capabilities, and public hosting.

---

## Current Priorities

1. PWA support and offline capabilities
2. App manifest and icons for installability
3. Deployment pipeline
4. Public hosting

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

### Testing

- Automated testing infrastructure

---

## In Progress

- PWA release preparation

---

## Known Technical Debt

### Release

- No PWA support
- No deployment pipeline
- No installable build

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
