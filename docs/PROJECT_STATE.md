# PROJECT_STATE.md

## Current Version

v0.14.1

---

## Current Status

Milestone 14.1 — Smooth Runner Motion V2: Implementation Complete, Subjective Goal Not Achieved

The M14.1 CSS animation is mechanically functional (Playwright tests confirm 185 distinct translateY values across 361 frames), but project owner assessment on 2026-06-12 confirmed the implementation did not deliver on the PRD's subjective criteria ("feels more professional" and "appears visually faster" — both answered No). Three of four PRD failure conditions triggered. Code retained per project owner decision; lessons learned documented in `docs/Milestone 14.1-validation/VALIDATION.md`.

---

## Current Milestone

Milestone 14.1 — Smooth Runner Motion V2 (Implementation Complete, Subjective Goal Not Achieved)

Next Goal:

Milestone 15.

---

## Current Priorities

1. Milestone 15 (next milestone)

---

## Next Milestone

To be determined.

---

## Completed Features

### Smooth Runner Motion V2 (Milestone 14.1) — Implementation Only

**Outcome:** Implementation technically complete and stable. Subjective PRD criteria (Q5 "visually faster", Q6 "feels professional") not met. Code retained per project owner decision.

- CSS keyframe animation on Board inner wrapper for continuous viewport motion between ticks (mechanically functional)
- `Engine.getEffectiveSpeed()` (private) extracted from duplicated calculation; `Engine.getTickInterval()` (public) for render layer
- Board split into outer positioning container and inner grid wrapper (`.boardInner`) with `innerRef` prop
- `@keyframes viewportScroll` interpolates `translateY` from -5% to 0 over tick interval via `--viewport-speed` custom property
- `useGame` exposes `getTickInterval()` callback wrapping `Engine.getTickInterval()`
- RunnerGame useEffect restarts CSS animation each tick via class toggle + forced reflow; wrap-around detection (delta > 1) suppresses animation
- `prefers-reduced-motion: reduce` accessibility media query suppresses animation
- Lane change animations (150ms slide) compose independently with viewport animation
- Classic mode unaffected — inner wrapper exists but no animation class applied
- 503 vitest tests + 5 Playwright e2e tests passing

**Why it didn't achieve the goal:** The 5% per-tick translateY (one cell height, ~23px on the rendered board) was below the threshold of perceivable meaningful motion. The tick-boundary snap (matrix going from `translateY(0)` back to `translateY(-5%)` to start the next interpolation) is visible to the eye even when interpolation between ticks is smooth. CSS animation on a wrapper does not address the underlying logical discrete-positioning model. See `docs/Milestone 14.1-validation/VALIDATION.md` for full assessment.

- Tiered length-based multiplier (x1–x5) for food scoring in runner mode
- `maxMultiplier` tracking in GameState (highest tier reached per run)
- Risk-aware food placement by length tier (safe/medium/high rows, lane deviation)
- Multiplier display in RunnerHUD (4-section layout: Score | Multiplier | Length | Distance)
- Max Multiplier and Next Milestone stats in RunnerGameOver
- Milestone celebration: two-tone ascending sound + HUD multiplier pulse animation at length 10/20/30/50
- `onMilestone` callback on Engine for milestone detection in runner mode
- `playMilestone(tier)` on SoundManager for per-tier audio feedback
- 487 tests passing across 30 test files

### Runner Feel Validation (Milestone 13.5)

- Viewport scrolling: snake fixed at lower third, obstacles scroll downward (`RUNNER_VIEWPORT_TAIL = 13`)
- Lane change visual feedback: directional slide animation with green glow on snake head
- Speed profile multiplier for validation testing (`RUNNER_SPEED_MULTIPLIER`)
- Course generation: minimum spacing guard prevents adjacent obstacle rows (`MIN_PATTERN_SPACING = 2`)
- HUD score display: Score section in RunnerHUD, score comparison in RunnerGameOver with "New Best!" badge
- Validation infrastructure: recording directory, instructions, .gitignore rules
- 447 tests passing across 27 test files

### Visual Lane Redesign (Milestone 13.1)

- Lane columns (x=4, 10, 16) visually highlighted with full visibility and visible borders
- Non-lane columns dimmed to near-transparent (no border, transparent background)
- Active lane indicator with subtle green background highlight and inset glow
- Runner mode board border changed to green accent (`data-runner="true"`)
- Food spawning constrained to lane columns in runner mode via `spawnRunnerFood()`
- Removed text "Lanes: Left | Center | Right" lane indicator
- Runner-mode aria-label: "Snake Run runner board — 3 lanes"
- 434 tests passing across 27 test files

### Runner Mode (Milestone 13)

- Endless runner variant with auto-advancing snake (UP movement)
- Three-lane system (Left/Center/Right at x=4/10/16)
- Lane change controls (Arrow Left/Right, A/D keys, swipe gestures)
- Tail lane blocking (prevents lane change into body-occupied lane at head Y)
- Y-axis wrap-around course generation (obstacles + food regenerated per lap)
- Difficulty-scaling obstacles (single/double blockers, 6→12 patterns per lap)
- Distance-based scoring (10 distance = 1 point) + food scoring with length multiplier
- RunnerHUD (Distance, Food Eaten, Snake Length, High Score)
- RunnerGameOver overlay (stats, Play Again, Menu)
- Runner entry point in MainMenu (always visible, accent-bordered button)
- Speed curve: 200ms → 80ms (decreases 2ms every 50 distance)
- Sound toggle and responsive touch controls
- 415 tests passing across 26 test files

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
- Main menu with Continue, New Game, Statistics, Achievements, Settings, Help
- Screen-based navigation (no router)
- Ready overlay with level metadata
- Pause menu with Resume, Restart Level, Return to Menu
- Settings screen with sound toggle, theme selection, reset options
- Confirmation dialogs for destructive actions
- Help / How To Play screen

### Visuals

- Directional snake eyes
- CSS variable token system (18 color tokens, font tokens, spacing, shadows, radius, transitions)
- 4-theme system (Neon Arcade, Classic Snake, Terminal, High Contrast)
- Self-hosted "Press Start 2P" display font
- Arcade-style ScoreBoard HUD with food progress meter
- Redesigned overlays with neon aesthetic
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

### Gameplay Validation & Stability (Milestone 11)

- `src/game/reachability.ts`: BFS-based reachability analysis with portal teleport and wrap-around support
- `src/game/__tests__/reachability.test.ts`: 9 tests for reachability module
- `src/game/__tests__/levelValidation.test.ts`: 75 tests validating all 10 levels (spawn safety, bounds, uniqueness, first-tick survivability, free-cell capacity, reachability)
- `src/utils/__tests__/levelData.test.ts`: 8 new tests for portal safety, food spawn capacity, spawn center safety
- `src/game/statistics.ts`: `loadStats` corruption resilience via try/catch (matches `loadAchievements` pattern)
- `src/game/__tests__/Engine.test.ts`: 3 new tests (destroy+recreate persistence, high score not saved during playing, stats saved on pause)
- `src/game/__tests__/statistics.test.ts`: 2 new tests (round-trip, corruption resilience)
- `src/game/__tests__/achievements.test.ts`: 1 new test (corruption resilience)
- `docs/M11_VALIDATION_NOTES.md`: manual validation notes with structural validation results
- 356 tests passing across 19 test files
- All 10 levels validated: no broken levels, no impossible starts, no progression blockers

### User Experience & Navigation (Milestone 12)

- Main menu with Continue, New Game, Statistics, Achievements, Settings, Help
- Continue shows last unlocked level and high score
- Statistics and Achievements dedicated full-screen screens
- Help / How To Play screen with controls, food types, mechanics, progression, achievements
- Settings screen with sound toggle, theme selector, and reset confirmations
- 4-theme system: Neon Arcade (default), Classic Snake, Terminal, High Contrast
- ReadyOverlay showing level name, description, and objective before gameplay
- Improved PauseMenu with Resume, Restart Level, Return to Menu
- Centralized persistence service (`src/game/profile.ts` with `loadGameProfile()`)
- State-based screen navigation in `App.tsx` (no routing library)
- 392 tests passing across 26 test files
- `npm run build` completes with no errors
- `npm run lint` passes with no new warnings

---

## In Progress

Milestone 15 (next milestone).

---

## Known Technical Debt

1. **Pre-existing test flakiness:** `state.test.ts > MOVE_SNAKE spawns replacement normal food when timer reaches 0` — Gold food timer expiry occasionally spawns gold instead of normal food due to non-deterministic RNG in `food.ts`. Intermittent failure, not introduced by M11. Deferred to future milestone for investigation (seed RNG or mock `Math.random` in test).

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

### Milestone 14.1 — Smooth Runner Motion V2 (Implementation Complete, Subjective Goal Not Achieved)

**Outcome:** Implementation technically complete and stable. Subjective PRD criteria (Q5 "visually faster", Q6 "feels professional") not met per project owner assessment (2026-06-12). Code retained per project owner decision. See `docs/Milestone 14.1-validation/VALIDATION.md` for full assessment.

Implementation phase complete:

- [x] Phase 1: Engine `getEffectiveSpeed()` + `getTickInterval()` implemented, tested, `startLoop()` refactored
- [x] Phase 2: Board inner wrapper + CSS viewport animation implemented and tested
- [x] Phase 3: RunnerGame animation wiring implemented (useEffect restart, `--viewport-speed`, wrap detection)
- [x] Phase 4: Edge cases handled (pause, gameover, classic mode, lane changes)
- [x] 503 vitest tests + 5 Playwright e2e tests passing (vitest baseline: 487)
- [x] `npm run build` completes with no errors
- [x] `npx tsc --noEmit` passes with no errors
- [x] `npm run lint` passes with no warnings
- [x] Documentation updated (SPEC.md §20.14, ARCHITECTURE.md, ROADMAP.md)
- [x] `package.json` version bumped to 0.14.1

Subjective validation:

- [ ] "Does the game appear visually faster?" (PRD Q5) — **No** (project owner, 2026-06-12)
- [ ] "Does the runner feel more professional?" (PRD Q6) — **No** (project owner, 2026-06-12)
- [ ] Wrap transition improvement — **None** (same as before, no regression)

