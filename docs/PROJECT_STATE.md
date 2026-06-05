# PROJECT_STATE.md

## Current Version

v0.4.0

---

## Current Status

Level Progression System Complete

The game now has visible level transitions with a combined overlay showing level completion and next level preview. Players can see when a level ends and what's coming next.

---

## Current Milestone

Milestone 5 - Obstacle Redesign

Current Goal:

Make levels memorable with handcrafted obstacle layouts.

---

## Current Priorities

1. Design handcrafted obstacle layouts for each level
2. Replace random obstacle generation with predefined layouts
3. Make each level feel distinct
4. Ensure obstacles influence player decisions

---

## Next Milestone

Milestone 5 - Obstacle Redesign

Planned Focus:

- Handcrafted obstacle layouts
- Level-specific obstacle configurations
- Make levels feel distinct and memorable

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

### Testing

- Automated testing infrastructure

---

## In Progress

- Handcrafted obstacle layout design (Milestone 5)

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

Milestone 5 success criteria (in progress):

- Handcrafted obstacle layouts for all 10 levels
- Each level feels distinct
- Obstacles influence player decisions
- Levels become memorable

---

## Important Notes

The current objective is Milestone 5 — Obstacle Redesign.

The PWA is live at `https://adityasingh-x.github.io/snake-run/` and can be installed on phones and desktops.

Milestone 4 (Level Progression System) is complete. Level transitions are now visible and intentional with a combined overlay showing level completion and next level preview.

AI-generated gameplay and content systems remain a future consideration and are not part of the current milestone.
