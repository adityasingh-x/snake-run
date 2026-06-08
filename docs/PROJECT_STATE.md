# PROJECT_STATE.md

## Current Version

v0.10.0

---

## Current Status

Milestone 10 (Gameplay Expansion) Complete

All three phases of Milestone 10 are now complete:
- Phase 1: Food Variants — gold, poison, and slow food types with weighted spawning
- Phase 2: Wrap-Around Levels — Level 5 allows edge-to-edge teleportation
- Phase 3: Portal Levels — Level 7 has a paired portal mechanic

---

## Current Milestone

Milestone 11 - Gameplay Validation & Stability

Next Goal:

Guarantee that all gameplay systems are correct, stable, completable, and free of progression blockers.

---

## Current Priorities

1. Gameplay validation (Milestone 11)
2. Automated gameplay validation suite
3. Manual playthrough verification

---

## Next Milestone

Milestone 12 - User Experience & Navigation

Planned Focus:

- Main menu
- Statistics and achievements screens
- Settings and credits screens
- Improved pause and navigation experience

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

### Replayability Systems — Endless Mode (Milestone 9, Phase 1)

- `isEndless` boolean field added to GameState
- `START_ENDLESS_GAME` action added to GameAction union
- Endless mode reducer: sets level to 10, resets snake/food/foodEaten, keeps score, uses level 10 obstacles
- `MOVE_SNAKE` skips level-up checks when `isEndless` is true
- `Engine.startEndless()` method dispatches and starts loop
- `useGame` hook exposes `startEndlessGame` callback
- ScoreBoard shows "Endless" label and hides food meter in endless mode
- GameOver win overlay includes "Endless Mode" button (autoFocus, primary)
- GameOver shows "Endless Score: N" when `isEndless` is true

### Replayability Systems — Statistics (Milestone 9, Phase 2)

- `src/game/statistics.ts`: load/save/increment stats (gamesPlayed, totalFood, bestLevel)
- localStorage keys: `snakeStatsGamesPlayed`, `snakeStatsTotalFood`, `snakeStatsBestLevel`
- Engine integrates stat tracking in dispatch(): increments on game start, accumulates food, updates best level
- Stats flushed to localStorage on gameover/win/pause
- `Statistics.tsx` component: compact arcade-style panel with 4 stat rows
- Stats displayed on idle screen and game over/win screens
- `Engine.getStats()` method merges localStorage stats with current highScore

### Replayability Systems — Achievements (Milestone 9, Phase 3)

- `src/game/achievements.ts`: Achievement type, 3 definitions, detection, persistence
- localStorage key: `snakeAchievements` (JSON array of unlocked IDs)
- Achievement definitions: Snake Master (beat_game), High Scorer (score_500), Marathon Run (no_pause)
- Engine tracks `wasPaused` flag; resets on start/reset/startEndless, sets on pause
- `checkAchievements()` detects unlocks during state transitions
- `onAchievementUnlock` callback fires for each newly unlocked achievement
- `Achievements.tsx` component: locked shown as "???", unlocked shows name, "NEW" badge for recent unlocks
- Screen reader announces new unlocks via existing `aria-live` region
- Achievements displayed on idle screen and game over/win screens

### Gameplay Expansion — Food Variants (Milestone 10, Phase 1)

- `Food` type with `position`, `type` ('normal' | 'gold' | 'poison' | 'slow'), and `timer` fields
- `GameState.food` changed from `Position` to `Food`; `speedEffectTicks` added to GameState
- `src/game/food.ts`: weighted random type selection (80/10/5/5), timer constants, portal exclusion
- `src/game/state.ts`: type-specific effects (gold +30pts, poison shrink, slow 1.3x speed for 10 ticks)
- `src/game/Engine.ts`: `SLOW_EFFECT_MULTIPLIER = 1.3` applied when `speedEffectTicks > 0`
- `src/components/Cell.tsx`: type-specific rendering (circle/diamond/square/triangle shapes, colors, animations)
- `src/components/ScoreBoard.tsx`: SLOW indicator badge when `speedEffectTicks > 0`
- 3 new CSS tokens: `--color-food-poison` (#d946ef), `--color-food-slow` (#22d3ee)

### Gameplay Expansion — Wrap-Around Levels (Milestone 10, Phase 2)

- `Level.wrapAround?: boolean` field in level metadata
- Level 5 (Maze Runner) has `wrapAround: true`
- `src/game/collision.ts`: `isWallCollision` accepts `wrapAround` parameter; returns false when true
- `src/game/state.ts`: coordinates normalized modulo grid size before collision check when wrapAround is active
- `src/components/Board.tsx`: `data-wrap-around="true"` attribute; dashed border visual indicator

### Gameplay Expansion — Portal Levels (Milestone 10, Phase 3)

- `Level.portals?: [Position, Position][]` field in level metadata
- Level 7 (Four Chambers) has one portal pair: `[[{x:2,y:4}, {x:16,y:15}]]`
- `src/game/state.ts`: teleport head to paired position on portal landing; collision checked at destination
- `src/game/food.ts`: portal positions excluded from food spawn candidates
- `src/components/Cell.tsx`: portal rendering with rotating ring pseudo-elements
- New CSS token: `--color-portal` (#a855f7)
- `@keyframes spin` and `spinReverse` animations for portal visual

### Testing

- Automated testing infrastructure

---

## In Progress

None — validating future milestone scope.

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

### Milestone 11 — Gameplay Validation & Stability

Target:

- No broken levels
- No impossible starts
- No progression blockers
- No known gameplay defects
- All validation tests passing

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

Milestone 9 Phase 1 (Endless Mode) success criteria (completed):

- Complete level 10 → win overlay shows "Endless Mode" button ✅
- Click "Endless Mode" → game plays indefinitely, no level-ups ✅
- Speed stays at 100ms, obstacles are level 10 layout ✅
- ScoreBoard shows "Endless" and score only (no food meter) ✅
- Game over in endless mode → shows "Endless Score" in overlay ✅
- `npm run build` succeeds ✅
- `npm test` all pass (194 tests) ✅
- `npm run lint` passes ✅
- SPEC.md, ARCHITECTURE.md, ROADMAP.md, PROJECT_STATE.md updated ✅

Milestone 9 Phase 2 (Statistics) success criteria (completed):

- Start a game, eat food, game over → games played +1, total food updated ✅
- Complete multiple runs → games played accumulates correctly ✅
- Reach level 5, then die → best level recorded as 5 ✅
- Idle screen shows statistics panel ✅
- Game over screen shows statistics summary ✅
- `npm run build` succeeds ✅
- `npm test` all pass ✅
- `npm run lint` passes ✅

Milestone 9 Phase 3 (Achievements) success criteria (completed):

- Win the game → "Snake Master" achievement unlocks and persists ✅
- Score 500 → "High Scorer" unlocks during gameplay ✅
- Win without pausing → "Marathon Run" unlocks ✅
- Achievements persist across page reloads ✅
- Idle screen shows unlock status ✅
- Game over/win screens show newly unlocked achievements ✅
- Screen reader announces unlock ✅
- `npm run build` succeeds ✅
- `npm test` all pass ✅
- `npm run lint` passes ✅

Milestone 9 (Replayability Systems) overall success criteria (completed):

- Endless Mode playable from win screen with indefinite play, no level-ups ✅
- Statistics tracking (games played, total food, best level) persisted and displayed ✅
- All 3 achievements detectable, persistable, and displayed ✅
- Idle screen shows statistics and achievements ✅
- Game Over / Win screens show statistics and newly unlocked achievements ✅
- Screen reader announces achievement unlocks ✅
- All existing tests still pass ✅
- New tests added for all new modules and components ✅
- `npm run build` completes with no errors ✅
- `npm run lint` passes with no new warnings ✅
- SPEC.md, ARCHITECTURE.md, ROADMAP.md, PROJECT_STATE.md updated ✅
- `package.json` version bumped to `0.9.0` ✅

Milestone 10 (Gameplay Expansion) success criteria (completed):

- All three food variants spawn, render, and apply effects correctly ✅
- Food timers work correctly (gold: 10 ticks; slow: 8 ticks; normal/poison: persist) ✅
- Slow effect visibly slows the game and expires after 10 ticks ✅
- Level 5 (Maze Runner) allows wrap-around; snake exits and re-enters ✅
- Non-wrap levels still trigger wall collision as game over ✅
- Level 5 has a visible dashed border indicator ✅
- Level 7 (Four Chambers) has one working portal pair ✅
- Teleport into wall/obstacle/body triggers game over ✅
- Food does not spawn on portal tiles ✅
- 3 new CSS tokens added to `src/index.css` ✅
- Poison food is visibly magenta; slow food is visibly cyan; portal tiles are visibly purple ✅
- Portal tiles have a slow rotation animation ✅
- All existing tests pass (212 baseline) ✅
- New tests added for all new mechanics ✅
- `npm run build` completes with no errors ✅
- `npm run lint` passes with no new warnings ✅
- SPEC.md, ARCHITECTURE.md, ROADMAP.md, PROJECT_STATE.md updated ✅
- `package.json` version bumped to `0.10.0` ✅

---

## Important Notes

Milestone 10 (Gameplay Expansion) is complete. All three phases — Food Variants, Wrap-Around Levels, and Portal Levels — are fully implemented and tested.

The next milestone is Milestone 11 (Gameplay Validation & Stability), which will focus on validating all gameplay systems.

Large gameplay feature additions are intentionally paused until validation is complete.

The PWA is live at `https://adityasingh-x.github.io/snake-run/` and can be installed on phones and desktops.
