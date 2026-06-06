# PROJECT_STATE.md

## Current Version

v0.5.0

---

## Current Status

Obstacle Redesign Complete

All 10 levels now have handcrafted obstacle layouts that create distinct, memorable gameplay experiences. Level 1 is obstacle-free, and each subsequent level introduces a unique obstacle pattern.

---

## Current Milestone

Milestone 6 - Difficulty Rebalance

Current Goal:

Create longer and more meaningful gameplay sessions.

---

## Current Priorities

1. Replace score-based progression with food-objective system
2. Rebalance speed curve for fairer mobile play
3. Extend level duration so difficulty comes from layouts, not just speed

---

## Next Milestone

Milestone 6 - Difficulty Rebalance

Planned Focus:

- Food-objective progression (10, 12, 14, ... 30 food per level)
- Speed curve rebalance (150ms → 100ms, less aggressive)
- Longer, more meaningful gameplay sessions

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

### Level Progression System (Milestone 4)

- Level metadata (names, descriptions)
- Level complete overlay with next level preview
- Level name displayed in ScoreBoard HUD
- Two-step level transition (freeze → continue)
- Keyboard and button support for advancing between levels
- 140 unit tests passing

### Obstacle Redesign (Milestone 5)

- Handcrafted obstacle layouts for all 10 levels
- Level data includes `layout: Position[]` field
- `generateObstacles` returns predefined layouts (no randomness)
- Level names and descriptions updated per LEVEL_DESIGN.md
- Level 1 has zero obstacles
- Layout validation tests (bounds, duplicates, snake overlap)
- Determinism tests for all 10 levels
- 142 unit tests passing

### Testing

- Automated testing infrastructure

---

## In Progress

- Difficulty rebalance (Milestone 6)

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

Milestone 4 success criteria (completed):

- Levels have names and descriptions ✅
- Level transitions are visible and intentional ✅
- Level complete overlay shows completed and next level info ✅
- Level name displayed in HUD ✅
- Snake does not reset abruptly on level-up ✅
- Continue button and Space key advance to next level ✅
- `npm run build` completes with no errors ✅
- All 140 tests pass ✅
- SPEC.md, ROADMAP.md, PROJECT_STATE.md, and ARCHITECTURE.md updated ✅

Milestone 5 success criteria (completed):

- Handcrafted obstacle layouts for all 10 levels ✅
- Each level feels distinct ✅
- Obstacles influence player decisions ✅
- Levels become memorable ✅

Milestone 6 success criteria (in progress):

- Levels last longer
- Mobile remains playable
- Difficulty feels fair

---

## Important Notes

The current objective is Milestone 6 — Difficulty Rebalance.

The PWA is live at `https://adityasingh-x.github.io/snake-run/` and can be installed on phones and desktops.

Milestone 5 (Obstacle Redesign) is complete. All 10 levels now have handcrafted obstacle layouts with deterministic placement.

AI-generated gameplay and content systems remain a future consideration and are not part of the current milestone.
