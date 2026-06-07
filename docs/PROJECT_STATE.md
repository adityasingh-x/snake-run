# PROJECT_STATE.md

## Current Version

v0.8.0

---

## Current Status

Visual Identity Complete

Milestone 8 (Visual Identity) is complete. The game now features a Retro Arcade Neon visual style with CSS variable tokens, a self-hosted display font, arcade-style HUD, and polished overlays.

---

## Current Milestone

Milestone 8 - Visual Identity

Current Goal:

Establish a recognizable visual style.

---

## Current Priorities

1. Replayability systems (Milestone 9)
2. Endless mode, statistics, and achievements
3. Gameplay expansion planning (Milestone 10)

---

## Next Milestone

Milestone 9 - Replayability Systems

Planned Focus:

- Endless mode (continue after level 10)
- Statistics tracking (games played, food eaten, highest score, best level)
- Achievements system

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
- CSS variable token system (18 color tokens, font tokens, spacing, shadows, radius, transitions)
- Self-hosted "Press Start 2P" display font
- Arcade-style ScoreBoard HUD with food progress meter
- Redesigned overlays (idle, pause, game over, win, level transition) with neon aesthetic
- Polished board border with glow, refined cell styling
- D-pad and toolbar buttons with arcade styling

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

### Progress Persistence & Developer Experience (Milestone 6)

- `lastUnlockedLevel` persisted to localStorage (`snakeLastUnlockedLevel` key)
- GameOver/Win screens show "Continue from Level N" button when `lastUnlockedLevel > 1`
- "New Game" button starts from Level 1
- Dev level select (dropdown + Go button) gated by `import.meta.env.DEV`, absent from production builds
- `START_AT_LEVEL` action in state machine for jumping to any level
- 173 unit tests passing

### Difficulty Rebalance (Milestone 7)

- Score-based progression replaced with food-objective system (`foodEaten >= foodRequired`)
- `foodEaten` field added to GameState (per-level counter, resets on continue/start-at-level)
- Level data field renamed: `targetScore` → `foodRequired`
- Food requirements: 10, 12, 14, 16, 18, 20, 22, 24, 26, 30 (levels 1–10)
- Speed curve rebalanced: 150ms → 100ms (less aggressive ramp, mobile-playable)
- ScoreBoard HUD displays food progress ("Food: X/Y")
- 178 unit tests passing

### Visual Identity (Milestone 8)

- CSS variable token system centralized in `src/index.css`
- Self-hosted "Press Start 2P" font with `font-display: swap`
- Arcade-style ScoreBoard HUD with food progress meter bar
- Redesigned overlays (idle, pause, gameover, win, levelTransition) with consistent neon aesthetic
- Board border with glow, refined cell styling
- D-pad and toolbar buttons with arcade styling
- PWA manifest and theme-color updated to match tokens
- Version bumped to 0.8.0
- 178 unit tests passing

### Testing

- Automated testing infrastructure

---

## In Progress

- Replayability Systems (Milestone 9)

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
- CSS Custom Properties (token system)

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

Milestone 6 success criteria (completed):

- Players can quickly resume progress after failure ✅
- Players can choose to restart from Level 1 ✅
- Developers can instantly test any level ✅
- Testing and balancing workflows become faster ✅

Milestone 7 success criteria (completed):

- Levels last longer (10–30 food per level vs previous 5) ✅
- Mobile remains playable at all speeds (minimum 100ms, not 60ms) ✅
- Difficulty feels fair — challenge from obstacle layouts, not reaction-time limits ✅
- `npm run build` completes with no errors ✅
- All 178 tests pass ✅
- SPEC.md, ROADMAP.md, PROJECT_STATE.md, and ARCHITECTURE.md updated ✅

Milestone 8 success criteria (completed):

- Screenshots appear distinctive ✅
- Visual style feels intentional ✅
- UI no longer resembles a starter template ✅
- `npm run build` completes with no errors ✅
- All 178 tests pass ✅
- `npm run lint` passes ✅
- CSS variables defined and used consistently ✅
- Self-hosted "Press Start 2P" font loads via `@font-face` ✅
- ScoreBoard reads as cohesive arcade-style HUD panel ✅
- All overlays share consistent visual language ✅
- Board has polished border and background treatment ✅
- Responsive layout verified on mobile and desktop ✅
- No hardcoded color values remain in component CSS ✅
- Keyboard and touch controls function identically ✅
- Accessibility preserved ✅
- PWA manifest colors match tokens ✅
- `package.json` version bumped to 0.8.0 ✅
- ARCHITECTURE.md Styling Conventions updated ✅
- SPEC.md Section 14 revised ✅
- ROADMAP.md updated — M8 marked complete ✅
- PROJECT_STATE.md updated ✅

---

## Important Notes

The current objective is Milestone 9 — Replayability Systems.

The PWA is live at `https://adityasingh-x.github.io/snake-run/` and can be installed on phones and desktops.

Milestone 8 (Visual Identity) is complete. The game now features a Retro Arcade Neon visual style with CSS variable tokens, self-hosted "Press Start 2P" display font, arcade-style ScoreBoard HUD, and polished overlays.

Milestone 7 (Difficulty Rebalance) is complete. Level progression now uses a food-objective system (10–30 food per level) instead of score-based targets, and the speed curve has been rebalanced from 150ms→100ms for better mobile playability.

Milestone 6 (Progress Persistence & Developer Experience) is complete. Players can continue from their last unlocked level, and developers have a level select for faster iteration.

Milestone 5 (Obstacle Redesign) is complete. All 10 levels now have handcrafted obstacle layouts with deterministic placement.

AI-generated gameplay and content systems remain a future consideration and are not part of the current milestone.
