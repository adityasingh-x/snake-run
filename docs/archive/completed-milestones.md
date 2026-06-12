# Completed Milestones Archive

This file contains milestones that have been completed and removed from ROADMAP.md.

---

## Milestone 1 - Foundation Refactor

- Game engine separated from React
- Platform adapters created
- Framework-agnostic engine
- Automated testing established

## Milestone 2 - Mobile Experience

- Responsive layout
- Swipe controls
- Touch controls
- Mobile UX improvements

## Milestone 3 - PWA Release

- PWA support
- Offline support
- Service worker
- Public deployment
- Installable application

## Milestone 4 - Level Progression System

- Level metadata system
- Level completion flow
- Level HUD integration
- Level progression support

## Milestone 5 - Obstacle Redesign

- Handcrafted obstacle layouts
- Deterministic obstacle placement
- Layout-based level generation

## Milestone 6 - Progress Persistence & Developer Experience

- Continue support
- New Game support
- Developer level select
- Local persistence

## Milestone 7 - Difficulty Rebalance

- Food objective progression
- Speed curve rebalance
- HUD progress tracking

## Milestone 8 - Visual Identity

- Design token system
- Visual identity pass
- HUD redesign
- Overlay redesign

## Milestone 9 - Replayability Systems

- Endless Mode
- Statistics
- Achievements
- Persistence-backed progression

## Milestone 10 - Gameplay Expansion

- Gold food
- Poison food
- Slow food
- Wrap-around gameplay
- Portal gameplay

## Milestone 11 - Gameplay Validation & Stability

- Reachability validation
- Spawn validation
- Portal validation
- Progression validation
- Gameplay test suite

## Milestone 12 - User Experience & Navigation

- Main menu
- Continue flow
- Statistics screen
- Achievements screen
- Settings screen
- Theme system
- Help screen
- Pause menu improvements

## Milestone 13 - Runner Prototype Validation

- Endless runner mode with auto-advancing snake (UP movement)
- Three-lane system (Left/Center/Right) with lane change controls
- Tail lane blocking prevents lane changes into body-occupied lanes
- Y-axis wrap-around course generation with difficulty-scaling obstacles
- Distance-based scoring (1 point per 10 distance) + food scoring with length multiplier
- RunnerHUD (Distance, Food, Length, High Score) and RunnerGameOver overlay
- Speed curve: 200ms → 80ms (decreases 2ms every 50 distance)
- Runner entry point in MainMenu
- 415 tests passing across 26 test files
- Documentation: SPEC.md §20 Runner Mode, updated ARCHITECTURE.md

---

## Milestone 13 Target Vision — Runner Prototype

### Purpose

This milestone is a gameplay validation milestone.

The objective is NOT to build a production-ready game.

The objective is to determine whether a Snake-based endless runner is more engaging than the current level-based Snake game.

### Core Gameplay Loop

Player starts a run.

The snake automatically moves forward.

The player changes lanes left and right.

The player collects food.

Food increases snake length.

Longer snakes increase score potential but become harder to manage.

The player avoids obstacles.

Eventually the player crashes.

The player immediately starts another run.

Gameplay loop:

Run
→ Collect Food
→ Grow Longer
→ Earn Higher Score
→ Take More Risks
→ Become Harder To Control
→ Crash
→ Play Again

### Player Controls

Desktop:

- Left Arrow = Move Left Lane
- Right Arrow = Move Right Lane
- A = Move Left Lane
- D = Move Right Lane

Mobile:

- Swipe Left = Move Left Lane
- Swipe Right = Move Right Lane

Player does NOT control:

- Up
- Down
- Forward movement

Forward movement is automatic.

### Board Structure

The game uses three fixed lanes.

Lane positions:

- Left Lane
- Center Lane
- Right Lane

The snake always occupies one lane.

Lane changes should feel responsive.

### Camera & Movement

The game should create the feeling that the snake is constantly advancing forward.

Possible implementations:

Option A:

- Snake remains near bottom of screen.
- Obstacles move toward player.

Option B:

- World scrolls downward.
- Snake appears to advance upward.

Either approach is acceptable.

The visual goal is:

"Temple Run / Subway Surfers style forward motion."

### Obstacles

Obstacles continuously appear ahead.

Obstacle placement should force lane decisions.

Examples:

Single obstacle:

Lane 1 blocked

Double obstacle:

Lane 1 and Lane 2 blocked

Gap pattern:

Only one safe lane

Obstacle collision immediately ends the run.

No health system.

No recovery system.

No shields.

### Food

Food appears inside lanes.

Food should encourage risk-taking.

Food collection:

- Increases score
- Increases snake length

Only standard food exists in this milestone.

Do NOT implement:

- Gold food
- Poison food
- Slow food

### Snake Growth

Snake begins small.

Food increases length.

Longer snakes are visually obvious.

The prototype must preserve the feeling that:

"A longer snake is valuable."

Even if the difficulty effects are initially simple.

### Scoring

Primary score:

Distance traveled.

Secondary score:

Food collected.

HUD displays:

- Distance
- Food collected
- Current snake length
- High score

### Difficulty

Difficulty gradually increases during a run.

Examples:

- Faster scrolling
- More obstacles
- Harder obstacle patterns

Implementation may be simple.

Sophisticated balancing is not required.

### Game Over Screen

Display:

- Distance traveled
- Food collected
- Final snake length
- High score

Primary action:

Play Again

The player should be able to restart almost instantly.

### Explicitly Out Of Scope

Do NOT implement:

- Powerups
- Missions
- Unlockables
- Cosmetics
- Skins
- Daily challenges
- Online features
- Progression systems
- Story systems
- Advanced visual effects

### Existing Systems To Reuse

Reuse whenever possible:

- Existing game engine
- Existing collision system
- Existing food system
- Existing touch controls
- Existing persistence system
- Existing statistics system
- Existing audio system

Avoid unnecessary rewrites.

### Success Criteria

The prototype is successful if the answer to the following question is YES:

"Is this more fun and replayable than the current level-based Snake gameplay?"

The prototype does not need to be polished.

It only needs to validate the gameplay concept.

---

## Milestone 13.1 - Visual Lane Redesign

- Lane columns (x=4, 10, 16) visually highlighted with full visibility and visible borders
- Non-lane columns dimmed to near-transparent (no border, transparent background)
- Active lane indicator with subtle green background highlight and inner glow
- Runner mode board border changed to green accent (`data-runner="true"`)
- Board aria-label updated: "Snake Run runner board — 3 lanes"
- Food respawning in runner mode uses `spawnRunnerFood()`, constraining spawns to lane columns
- Removed text "Lanes: Left | Center | Right" and `.laneIndicator` CSS
- New props: `runnerLane` (Board), `isLaneColumn`/`isActiveLane` (Cell)
- `RUNNER_LANE_X` exported through game barrel and utils/constants
- Classic mode rendering completely unchanged
- 434 tests passing across 27 test files

---

## Milestone 13.5 — Controls & UX

- Viewport scrolling: snake fixed at lower third (screen row 13), obstacles scroll downward via `screenRow = (gridY - headY + VIEWPORT_TAIL + GRID_SIZE) % GRID_SIZE`
- Lane change visual feedback: directional slide animation (150ms) with green glow on snake head
- Speed profile multiplier: `RUNNER_SPEED_MULTIPLIER` constant for validation testing across 4 profiles (1.0x, 1.25x, 1.5x, 1.75x)
- Course generation: `MIN_PATTERN_SPACING = 2` prevents obstacles on adjacent rows; bounds check for out-of-grid patterns
- HUD score display: Score section (gold) in RunnerHUD; score comparison with "New Best!" badge in RunnerGameOver
- Board wrapped in `React.memo` for scroll performance; `data-viewport-scrolling` attribute; `isViewportScrolling` prop on Cell
- Validation infrastructure: recording directory with README, .gitignore for recordings
- 447 tests passing across 27 test files
- Documentation: SPEC.md §20.2 / §20.5 / §20.11 / §20.12, ARCHITECTURE.md updated, ROADMAP.md updated

---

## Milestone 14 — Snake Growth Risk System

**Completed:** 2026-06-12

### Summary

Transformed food from automatic collection into a meaningful risk/reward decision via five mechanisms:

- **Multiplier Engine (Phase A):** Tiered length-based multiplier replacing continuous formula. `getMultiplier(length)` returns x1 (3–9), x2 (10–19), x3 (20–29), x4 (30–49), x5 (50+). Computed post-eat. `maxMultiplier` field in `GameState` tracks highest tier reached during a run.
- **Risk-Aware Food Placement (Phase D):** `spawnRunnerFood()` categorizes grid rows by obstacle count (safe/medium/high) and selects target row and lane based on snake length tier. Tier 1 places food in safe rows in current lane. Tier 2 may require lane change. Tier 3 requires different lane with obstacles. Tier 4 requires significant deviation. Tier 5 forces thread-through on high-obstacle rows. Fallback chain ensures food is always reachable.
- **HUD Expansion (Phase B):** RunnerHUD shows multiplier section (accent color + glow) in 4-section layout (Score | Multiplier | Length | Distance). RunnerGameOver shows Max Multiplier and Next Milestone stats. Best stat wraps to second row on mobile.
- **Milestone Celebration (Phase C):** `playMilestone(tier)` on SoundManager plays two-tone ascending sine (base freq = 400 + tier × 100 Hz). HUD multiplier section pulses on tier crossing. `onMilestone` callback on Engine fires in `dispatch()` when `foodEaten` increases and snake length crosses a tier boundary.

### Key Files Changed/Created

| File | Change |
|------|--------|
| `src/game/snake.ts` | Added `getMultiplier()`, `MILESTONES` |
| `src/game/types.ts` | Added `maxMultiplier` to `GameState` |
| `src/game/state.ts` | Tiered multiplier in runner `MOVE_SNAKE`; `maxMultiplier` tracking; `START_RUNNER`/`START_AT_LEVEL` reset |
| `src/game/runnerCourse.ts` | Risk-aware food placement by tier; fallback chain; `currentLane` param added |
| `src/game/Engine.ts` | `onMilestone` callback; milestone detection in `dispatch()` |
| `src/game/index.ts` | Re-export `getMultiplier`, `MILESTONES` |
| `src/platform/sound.ts` | `playMilestone(tier)` two-tone sine oscillator |
| `src/hooks/useGame.ts` | Wire `onMilestone` to sound manager |
| `src/components/RunnerHUD.tsx` | Multiplier section, `celebrating` prop |
| `src/components/RunnerHUD.module.css` | Multiplier styles, celebration animation |
| `src/components/RunnerGameOver.tsx` | Max Multiplier + Next Milestone stats |
| `src/components/RunnerGame.tsx` | Multiplier computation, celebration animation detection |
| `src/game/__tests__/snake.test.ts` | 7 tests for `getMultiplier` + `MILESTONES` |
| `src/game/__tests__/state.test.ts` | 10 multiplier scoring + maxMultiplier tests |
| `src/game/__tests__/runnerCourse.test.ts` | 7 risk-aware placement tests |
| `src/game/__tests__/Engine.test.ts` | 6 milestone callback tests |
| `src/components/__tests__/RunnerHUD.test.tsx` | 5 component tests |
| `src/components/__tests__/RunnerGameOver.test.tsx` | 5 component tests |

### Verification

- 487 tests passing across 30 test files
- `npx tsc --noEmit` passes with no errors
- `npm run build` completes cleanly
- `npm run lint` passes with no new warnings

### Documentation

- SPEC.md: §20.4 (tiered multiplier), §20.5 (HUD 4-section layout), §20.6 (Max Multiplier/Next Milestone), §20.9 (risk-aware food placement), §20.13 (milestone celebration)
- ARCHITECTURE.md: "Growth Risk System" sub-section documenting all components
- PROJECT_STATE.md: v0.14.0, status, completed features
- ROADMAP.md: M14 moved to archive

---

## Milestone 14.1 — Smooth Runner Motion V2

**Status:** Implementation complete, subjective goal not achieved. Code retained per project owner decision (2026-06-12).

**Goal:** Eliminate the ~5 FPS visual perception of runner mode by adding continuous viewport motion between logical tick updates, without changing any gameplay logic.

**Approach:** Hybrid — CSS keyframe animation on Board's inner content wrapper for viewport scrolling. The browser interpolates `translateY` from one cell above to neutral over each tick interval, creating continuous visual downward glide.

**Outcome:** Implementation is mechanically functional and stable. Playwright automated tests confirm the CSS animation interpolates continuously between ticks. However, project owner assessment on 2026-06-12 confirmed the implementation did not achieve the PRD's subjective success criteria (Q5 "visually faster": No, Q6 "feels professional": No). Three of four PRD failure conditions triggered. The code is retained in the codebase per project owner direction; the milestone is archived with full assessment in `docs/Milestone 14.1-validation/VALIDATION.md`.

### Why It Didn't Work

The 5% per-tick translateY (one cell height, ~23px on the rendered board) was below the threshold of perceivable meaningful motion. The tick-boundary snap (matrix going from `translateY(0)` back to `translateY(-5%)` to start the next interpolation) is visible to the eye even when interpolation between ticks is smooth. CSS animation on a wrapper does not address the underlying logical discrete-positioning model.

### Architecture

- `Engine.getEffectiveSpeed()` (private) — extracted from duplicated calculation in `startLoop()`; returns current tick interval
- `Engine.getTickInterval()` (public) — returns `getEffectiveSpeed()`; consumed by render layer
- `Board` — split into outer positioning `.board` container and inner grid `.boardInner` wrapper; accepts `innerRef` prop (`animateViewport` removed in post-review remediation)
- `Board.module.css` — `.boardAnimated` triggers `@keyframes viewportScroll` (translateY -5%→0); `prefers-reduced-motion: reduce` suppresses
- `useGame` — exposes `getTickInterval()` callback
- `RunnerGame` — useEffect watches `headY` changes; restarts CSS animation via class toggle + forced reflow; sets `--viewport-speed` from engine

### Key Design Decisions

1. CSS animation over rAF interpolation — lowest complexity (~80 LOC), GPU-accelerated, zero JS per frame
2. Class toggle with forced reflow for animation restart — well-understood pattern, negligible perf at 5-12 ticks/s
3. Wrap-around suppression (delta > 1) — single-frame snap at screen edge; imperceptible
4. Lane change animations compose independently — on different DOM elements

### Key Files Changed/Created

| File | Change |
|------|--------|
| `src/game/Engine.ts` | Added private `getEffectiveSpeed()`, public `getTickInterval()`; refactored `startLoop()` |
| `src/components/Board.tsx` | Inner wrapper div, removed inline grid from `.board`, added `innerRef` prop (`animateViewport` removed in remediation) |
| `src/components/Board.module.css` | `.boardInner`, `.boardAnimated`, `@keyframes viewportScroll`, `prefers-reduced-motion` |
| `src/types/components.ts` | Added `innerRef` to `BoardProps` (`animateViewport` removed in remediation) |
| `src/hooks/useGame.ts` | Added `getTickInterval` callback |
| `src/components/RunnerGame.tsx` | Animation wiring useEffect, `boardInnerRef`, wrap detection |
| `src/game/__tests__/Engine.test.ts` | 6 tests for `getTickInterval` and refactor regression |
| `src/components/__tests__/Board.test.tsx` | 10 tests for inner wrapper, animation props, backward compat |
| `SPEC.md` | Added §20.14 "Smooth Viewport Scrolling" |
| `ARCHITECTURE.md` | Added "Smooth Runner Motion" sub-section |
| `docs/PROJECT_STATE.md` | v0.14.1, M14.1 complete |
| `docs/ROADMAP.md` | M14.1 to completed |
| `package.json` | Version 0.13.1 → 0.14.1 |
| `.gitignore` | Validation recordings entries |
| `docs/Milestone 14.1-validation/` | New directory + README.md |

### Verification

- 503 tests passing across 30 test files (baseline: 487)
- `npx tsc --noEmit` passes with no errors
- `npm run build` completes cleanly
- `npm run lint` passes with no warnings
