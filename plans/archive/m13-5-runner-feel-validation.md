# Implementation Plan — Milestone 13.5: Runner Feel Validation

**Status:** Complete (Validation waived by owner)
**Started:** 2026-06-11
**Completed (Implementation):** 2026-06-11
**Started:** 2026-06-11
**Completed (Implementation):** 2026-06-11
**Target:** Milestone 13.5 — Controls & UX (per `docs/prd/PRD_M13_5.md`)
**Baseline:** v0.13.1 — 434 tests passing across 27 test files

---

## Executive Summary

Milestone 13.5 exists to answer: **"Does Snake Run feel like a runner?"**

The PRD defines product-level requirements (forward motion, camera, reaction windows, event density). This plan translates those into concrete implementation changes that create runner feel, then validates the result with recordings and owner/AI review.

**Viewport scrolling is the milestone.** The single most impactful change — keeping the snake fixed in the lower third of the board while obstacles scroll downward — creates forward motion perception without changing any game logic. If viewport scrolling fails to create runner feel, the milestone pauses; polish work (lane feedback, HUD, course tuning) is deferred until the core mechanic works. This prevents sunk-cost development on features that depend on a working viewport camera.

The plan is structured viewport-first: implement the critical change, validate it, then conditionally implement polish work. This ensures effort is spent where it matters most.

---

## Architecture Overview

All changes are additive to the existing runner system. No game engine refactors. No new game modes. No new state management library. Minimal new useState for animation triggers (lane change direction).

- **Viewport scrolling:** Pure rendering transform in `Board.tsx`. When `viewportHeadY` is provided, Board iterates screen rows and computes corresponding grid rows via modulo. Game engine unchanged.
- **Lane change feedback:** Transient CSS animation on snake head. Tracked via state in `RunnerGame.tsx`.
- **Speed profiles:** Single dev-only constant `RUNNER_SPEED_MULTIPLIER` in `constants.ts`. Applied to `Engine.ts` tick calculation. Temporary validation infrastructure — removed after validation.
- **Course tuning:** Adjustments to `runnerCourse.ts` constants for event density.
- **Recording validation:** Screenshot/video capture artifacts stored in `docs/Milestone 13_5_validation/`.

---

## Non-Goals (per PRD §4)

- No powerups, missions, achievements, cosmetics, unlockables
- No progression systems or monetization
- No new game modes
- No classic-mode changes
- No leaderboards or online features
- No Capacitor/Tauri packaging

## Also Out of Scope

- RunnerHUD complete redesign (polish only)
- RunnerGameOver complete redesign (polish only)
- Music or new sound effects
- Multi-touch simultaneous input
- Board size changes (grid remains 20×20)
- Coordinate system refactors (modulo wrap stays)
- Food variant support in runner mode
- Touch swipe edge indicator (moved to `docs/IDEAS_BACKLOG.md`)

**Phase C4 (HUD/GameOver polish) justification:** Score display in RunnerHUD is required for owner validation question 5 ("Does gameplay feel better than Milestone 13?") — without a visible score during gameplay, the player cannot compare runs. The polish is minimal (add Score section, show new-best badge) and does not constitute a redesign.

---

## Phase Structure

| Phase | Description | Depends On | Gate |
|-------|-------------|-----------|------|
| A | Viewport Scrolling (Forward Motion) | — | Must pass before any follow-up work |
| B | Minimal Validation (Gate) | Phase A | **If FAIL → pause milestone** |
| C | Conditional Follow-up (Lane Feedback, Speed, Course, HUD) | Phase B PASS | — |
| D | Documentation | Phase C | — |

### Abort Criteria

After Phase A (Viewport Scrolling) and Phase B (Minimal Validation):

If recordings still appear static or puzzle-like (i.e., the player cannot perceive forward motion), the milestone is **paused**, not failed. Polish work (Phase C) is deferred until the camera strategy is reassessed. The reassessment should answer: "Is the rendering transform correct, or does the camera strategy need a different approach (e.g., CSS-based parallax, fixed-camera-with-rotating-background)?" This prevents sunk-cost development on polish work that depends on a working core mechanic.

### Phase Dependency Logic

```
Phase A (Viewport Scrolling)
  → Phase B (Minimal Validation Gate)
    → FAIL → Pause milestone, reassess camera strategy
    → PASS → Phase C (Conditional Follow-up)
      → Phase D (Documentation)
```

Phase C components are independent of each other and can be implemented in any order:
- C1: Lane Change Visual Feedback
- C2: Speed Profile Tuning
- C3: Course Generation — Event Density & Threat Model
- C4: HUD & Game Over Polish

---

## Phase A — Viewport Scrolling (Forward Motion)

### Goal

Create the perception that the world is moving toward the player. The snake stays fixed in the lower third of the board. Obstacles and food scroll downward from the top. This is the single most important change for runner feel — it is the milestone's primary deliverable.

### Current State

The 20×20 grid is rendered statically: y=0 at top, y=19 at bottom. The snake moves upward (decreasing Y). When the snake is at y=5, the player sees 5 empty rows above and 14 rows below. The world is static; the snake navigates it. This communicates "Snake" not "Runner."

### Design

In runner mode, the Board renders cells by mapping screen rows to grid rows:

```
screenRow = (gridY - headY + VIEWPORT_TAIL + GRID_SIZE) % GRID_SIZE
```

Where:
- `VIEWPORT_TAIL = 13` (snake appears at screen row 13, roughly lower third per PRD §9)
- This gives 13 rows visible behind the snake (body trail) and 6 rows visible ahead (upcoming obstacles)

The modulo wrap is correct for the runner's Y-axis wrap-around: when the snake hits y=0 and wraps to y=19, the "ahead" region (lower Y, wrapping) continues to display above the snake on screen.

**Visibility note:** At max speed (80ms/tick), 6 rows ahead = 0.48s. This is just below the PRD §16 "hard" reaction window of 0.5-1.0s. If Phase B validation reveals insufficient ahead visibility, the contingency is to increase `VIEWPORT_TAIL` to 12 (7 rows ahead at 80ms = 0.56s, within target).

### Implementation

#### A1. Add viewport constants

**File:** `src/game/constants.ts`
```ts
export const RUNNER_VIEWPORT_TAIL = 13;
```
(The number of rows visible behind the snake. Snake appears at screen row 13, in the lower third of the board per PRD §9.)

Import `RUNNER_VIEWPORT_TAIL` in Board.tsx (for viewport offset calculation) and in the barrel exports via `src/game/index.ts`.

#### A2. Modify Board to support viewport scrolling

**File:** `src/types/components.ts`
- Add `viewportHeadY?: number` to `BoardProps`

**File:** `src/components/Board.tsx`
- Wrap Board in `React.memo` to prevent unnecessary re-renders during scrolling (use default shallow-equal comparator).
- Accept `viewportHeadY` prop
- When `viewportHeadY !== undefined`:
  - Generate 20 rows in screen order: rows 0..19 map to grid Y positions via `(screenY + headY - VIEWPORT_TAIL + GRID_SIZE) % GRID_SIZE`
  - Each cell's `x` and `y` props remain the **grid** coordinates (for correct object lookup and aria-labels)
  - The cell's `key` uses the screen position (`${screenY}-${x}`) for stable React identity
  - Add `data-viewport-scrolling="true"` attribute to the Board element (mirrors existing `data-runner` pattern)
- When `viewportHeadY === undefined` (classic mode): behave identically to current code

**Implementation sketch for Board.tsx grid generation:**
```tsx
const grid = useMemo(() => {
  const cells: { x: number; y: number; screenY: number }[] = [];
  if (viewportHeadY !== undefined) {
    for (let screenY = 0; screenY < GRID_SIZE; screenY++) {
      const gridY = ((screenY + viewportHeadY - RUNNER_VIEWPORT_TAIL) % GRID_SIZE + GRID_SIZE) % GRID_SIZE;
      for (let x = 0; x < GRID_SIZE; x++) {
        cells.push({ x, y: gridY, screenY });
      }
    }
  } else {
    for (let y = 0; y < GRID_SIZE; y++) {
      for (let x = 0; x < GRID_SIZE; x++) {
        cells.push({ x, y, screenY: y });
      }
    }
  }
  return cells;
}, [viewportHeadY]);
```

Each cell uses `pos = { x: cell.x, y: cell.y }` for object lookup (snake, food, obstacles) — this is the grid position. The `key` uses `${cell.screenY}-${cell.x}` for stable React keys. CSS Grid auto-places cells in DOM order, so screen-ordered cells appear in screen positions.

**Cell key change:** Update key from `` `${x}-${y}` `` to `` `${cell.screenY}-${cell.x}` `` to maintain React key stability across scroll frames.

#### A3. Wire viewportHeadY in RunnerGame

**File:** `src/components/RunnerGame.tsx`
- After the run starts and `state.isRunner && state.status === 'playing'`:
  - Pass `viewportHeadY={state.snake[0].y}` to Board
  - Do NOT pass `viewportHeadY` before game starts (keep static board for start overlay)

#### A4. Visual scroll CSS — add row transitions

**File:** `src/components/Cell.module.css`
- Add brief transition to cell opacity/transform to smooth the visual jump when wrapping:
  ```css
  .cellScrolling {
    transition: border-color 100ms ease;
  }
  ```

**File:** `src/components/Board.module.css`
- No changes needed. The CSS Grid layout handles the reordering automatically.

### Cell props and isLaneColumn interaction

The `isLaneColumn` prop is computed from `x` (grid coordinate). With viewport scrolling, `x` is still the grid X — lane column detection works identically. The visual lane columns scroll with the content, which is correct (they're part of the "track").

### Edge Cases

1. **Start state (idle):** `viewportHeadY` is not passed → board renders statically → start overlay visible. Correct.
2. **Wrap-around (y=0 → y=19):** The modulo formula handles this. When headY=19, gridY=0 maps to screenY = (0-19+13+20)%20 = 14 (one row above snake at screenY=13). Content from the new lap appears above. Smooth.
3. **Classic mode:** `viewportHeadY` is undefined → board renders identically to current behavior. Zero impact.
4. **Snake body trail:** Body segments behind the snake (larger Y, or wrapped smaller Y) appear at screen positions below the snake. This creates the visual runner "trail" effect.

### Risks

- **Low:** Pure rendering transform. If `viewportHeadY` is wrong, the board looks offset but game logic is unaffected.
- **Medium:** React key stability. If keys change unexpectedly, cells may flash/re-render. **Mitigation:** Use screenY in keys, not gridY.
- **Medium:** At VIEWPORT_TAIL=13, only 6 rows visible ahead. At max speed (80ms), that's 0.48s of visibility — just below PRD §16 "hard" reaction window of 0.5-1.0s. **Mitigation:** If Phase B validation shows insufficient visibility, contingency is to increase VIEWPORT_TAIL to 12 (7 rows = 0.56s, within target).

### Verification
- [ ] Visual: Snake appears in lower third of board and stays there throughout the run (screen row 13)
- [ ] Visual: Obstacles scroll downward from the top toward the snake
- [ ] Visual: Snake body trail extends below the snake
- [ ] Visual: Lane columns (green highlight) scroll with the viewport
- [ ] Visual: Start overlay renders correctly with static board
- [ ] Visual: Classic mode board renders identically to pre-change
- [ ] `npm run build` — no errors
- [ ] `npm run lint` — no new warnings
- [ ] `npx tsc --noEmit` — no errors
- [ ] `npm test -- --run` — all existing tests pass

### Acceptance Criteria
- [ ] Forward motion perception exists when viewing the game (can see world scrolling toward snake)
- [ ] Snake stays in fixed screen position at lower third of board during gameplay
- [ ] Classic mode rendering is byte-identical to pre-change behavior
- [ ] No jitter, flicker, or visual artifacts during scrolling or wrap-around

---

## Phase B — Minimal Validation Gate

### Goal

Verify that viewport scrolling actually creates runner feel BEFORE implementing any polish work. This is the validation gate: if viewport scrolling fails, the milestone pauses. No polish work is wasted.

### Implementation

#### B1. Create validation directory

```
docs/Milestone 13_5_validation/
├── README.md              # Instructions and record of validation
├── screenshots/
│   ├── start.png          # Runner ready/start screen
│   ├── mid-run.png        # Mid-run with obstacles and food visible
│   ├── obstacle-approach.png  # Frame during obstacle row scrolling into view
│   ├── lane-change.png    # Frame during lane change (if Phase C1 implemented, or just after)
│   ├── high-pressure.png  # High-speed moment with multiple threats
│   └── game-over.png      # Game over screen
└── recordings/            # 5 gameplay recordings (see README for instructions)
```

#### B2. Recording instructions (for README.md)

```markdown
# Milestone 13.5 — Validation Evidence

## Recording Process

1. Build the game: `npm run build && npm run preview`
2. Open `http://localhost:4173` in Chrome
3. Open Chrome DevTools → More tools → Recorder
4. Start a new recording
5. Play Runner Mode for at least 2 minutes (or until death)
6. Export recording as WebM/MP4

## Tool Verification (do this first)

Before recording all 5 required runs, produce a 30-second test recording and verify it plays back correctly. If Chrome DevTools Recorder fails, switch to an alternative (OBS Studio, built-in screen recorder, etc.).

## Required Recordings

- Recording 1: Speed Profile A (normal) — minimum 2 min or until death
- Recording 2: Speed Profile A (normal) — second run for consistency
- Recording 3: Speed Profile B (1.25x) — compare feel
- Recording 4: Speed Profile C (1.5x) — pressure test
- Recording 5: Speed Profile D (1.75x) — limit test

## Screenshot Checklist

- [ ] Start state (ready overlay visible, static board)
- [ ] Mid-run state (snake + visible obstacles ahead + food visible)
- [ ] Obstacle approach frame (new obstacle row scrolling into visible-ahead region)
- [ ] Lane change frame (active lane change in progress or just after)
- [ ] High-pressure state (multiple obstacles, snake in lane-change moment)
- [ ] Game over state (stats overlay)

## Recording Storage Policy

Recording files (.webm, .mp4) are stored externally (Google Drive, GitHub Releases, etc.) and linked from this README. Only README.md, screenshots, and the recordings/ directory structure are committed to git. Recordings are excluded via .gitignore.

## Validation Questions (Project Owner)

After reviewing recordings:
1. Does this feel like a runner?
2. Does the game create urgency?
3. Do obstacles create pressure?
4. Do I want another run?
5. Does gameplay feel better than Milestone 13?

All five must be YES to pass.

## AI Review Questions

A. Does gameplay communicate motion?
B. Does gameplay create urgency?
C. Does gameplay create reaction pressure?
D. Is the runner identity obvious?
E. Is pacing appropriate?
F. Runner Identity Check: Review a random gameplay frame (not start screen, not game-over screen). Answer: "If this frame was shown to a viewer with no context, would they identify this game as: A) Runner, B) Snake, C) Puzzle Game, D) Other?" Desired: A) Runner. Acceptable: A) Endless Runner. Failure: B), C), or D).
```

#### B3. Add .gitignore entries

Add to `.gitignore`:
```
docs/Milestone 13_5_validation/recordings/*.webm
docs/Milestone 13_5_validation/recordings/*.mp4
```

#### B4. Gate decision

After producing 1-2 recordings of viewport-scrolling gameplay (before any Phase C polish):

- **PASS:** Recordings communicate "the world is rushing toward the snake" rather than "the snake is navigating a static board." → Proceed to Phase C.
- **FAIL:** Recordings still appear static or puzzle-like (forward motion is not perceivable). → **Pause milestone.** Do not implement Phase C. Reassess camera strategy per Abort Criteria above.

This gate uses recordings at the current speed (Profile A, `RUNNER_SPEED_MULTIPLIER = 1.0`). Full 5-recording validation (all speed profiles) happens after Phase C is complete.

### Risks
- **Medium:** The project owner must perform the actual recording and review. No automation substitute.
- **Low:** If recordings cannot be captured (technical issues), screenshots alone are insufficient evidence per PRD §20.
- **Low:** If a recording is corrupted or unplayable, the milestone is blocked. **Mitigation:** Verify playback of each recording immediately after capture.

### Acceptance Criteria
- [ ] `docs/Milestone 13_5_validation/` directory created with README.md
- [ ] `.gitignore` updated with recording exclusions
- [ ] 1-2 gate recordings confirm forward motion perception is perceivable
- [ ] Gate decision recorded in validation README

---

## Phase C — Conditional Follow-up

**Prerequisite:** Phase B gate MUST pass before implementing Phase C. If the gate fails, the milestone is paused per Abort Criteria.

Phase C components are independent of each other and can be implemented in any order. All are additive polish that refine the runner feel established by viewport scrolling.

---

### Phase C1 — Lane Change Visual Feedback

#### Goal

When the player changes lanes, show an immediate, visible response. This makes the game feel responsive and reinforces the connection between input and action.

#### Current State

Lane changes are instantaneous: the snake head shifts X position. There is no visual indicator beyond the head moving. On mobile (no keyboard), the player gets zero visual feedback that a lane change was registered.

#### Implementation

##### C1a. Track lane change direction in RunnerGame

**File:** `src/components/RunnerGame.tsx`
- Add state: `const [laneChangeDir, setLaneChangeDir] = useState<'left' | 'right' | null>(null);`
- Add ref: `const laneChangeTimerRef = useRef<number | null>(null);`
- When calling `changeLane(dir)`, use this pattern to prevent race conditions:
```ts
const handleLaneChange = (dir: -1 | 1) => {
  changeLane(dir);
  if (laneChangeTimerRef.current) clearTimeout(laneChangeTimerRef.current);
  setLaneChangeDir(dir === -1 ? 'left' : 'right');
  laneChangeTimerRef.current = window.setTimeout(() => {
    setLaneChangeDir(null);
    laneChangeTimerRef.current = null;
  }, 200);
};
```
- Pass `laneChangeDirection={laneChangeDir}` to Board

##### C1b. Thread lane change direction through Board → Cell

**File:** `src/types/components.ts`
- Add `laneChangeDirection?: 'left' | 'right' | null` to `BoardProps` and `CellProps`

**File:** `src/components/Board.tsx`
- Accept and forward `laneChangeDirection` to Cell (only for the snake head cell)

##### C1c. Lane change animation in Cell

**File:** `src/components/Cell.tsx`
- Add CSS class when `isSnakeHead && laneChangeDirection`:
  - `laneChangeDirection === 'left'` → add `styles.laneSlidingLeft`
  - `laneChangeDirection === 'right'` → add `styles.laneSlidingRight`

**File:** `src/components/Cell.module.css`
- Add `.laneSlidingLeft` and `.laneSlidingRight` classes:
  - Brief horizontal slide animation (50% of cell width toward target direction)
  - Green glow pulse (shadow expansion)
  - Duration: 150ms, ease-out
  - Example:
    ```css
    .laneSlidingLeft {
      animation: slideLeft 150ms ease-out;
    }
    .laneSlidingRight {
      animation: slideRight 150ms ease-out;
    }
    @keyframes slideLeft {
      0% { transform: translateX(-30%); box-shadow: 0 0 16px var(--color-accent); }
      100% { transform: translateX(0); box-shadow: var(--shadow-neon-green-strong); }
    }
    @keyframes slideRight {
      0% { transform: translateX(30%); box-shadow: 0 0 16px var(--color-accent); }
      100% { transform: translateX(0); box-shadow: var(--shadow-neon-green-strong); }
    }
    ```

#### Risks
- **Low:** Pure visual addition. Cannot affect game logic.
- **Low:** The `useRef` + `clearTimeout` pattern prevents race conditions from rapid successive lane changes (e.g., LEFT then RIGHT within 200ms).

#### Verification
- [ ] Visual: Lane change left → snake head slides left with green glow
- [ ] Visual: Lane change right → snake head slides right with green glow
- [ ] Visual: Animation completes within 200ms, does not persist
- [ ] Visual: Rapid successive lane changes do not cause visual glitches
- [ ] `npm run lint` — no new warnings
- [ ] `npx tsc --noEmit` — no errors
- [ ] `npm test -- --run` — all existing tests still pass (baseline: 434)

#### Acceptance Criteria
- [ ] Lane changes produce visible directional animation on snake head
- [ ] Animation does not affect subsequent lane changes (no visual stacking)
- [ ] Classic mode rendering unchanged

### Phase C2 — Speed Profile Tuning

#### Goal

Per PRD §11-12, implement speed profile control for validation testing. The PRD requires testing at current speed, +25%, +50%, +75%. The goal is to determine which profile creates the best tension, readability, and urgency.

#### Implementation

##### C2a. Add speed multiplier constant

**File:** `src/game/constants.ts`
```ts
export const RUNNER_SPEED_MULTIPLIER = 1.0;
```
- This is temporary validation infrastructure. The constant will be removed after validation is complete.
- For validation, hand-edit this constant and rebuild for each profile.

**File:** `src/game/Engine.ts`
- In the runner branch of the tick calculation, apply the multiplier:
```ts
effectiveSpeed = Math.round(effectiveSpeed / RUNNER_SPEED_MULTIPLIER);
```
- Speed multiplier > 1 = faster game (lower tick interval).

##### C2b. Speed profile values

| Profile | Multiplier | Initial Speed | Min Speed | Purpose |
|---------|-----------|---------------|-----------|---------|
| A (baseline) | 1.00 | 200ms | 80ms | Current |
| B (+25%) | 1.25 | 160ms | 64ms | Feel check |
| C (+50%) | 1.50 | 133ms | 53ms | Pressure test |
| D (+75%) | 1.75 | 114ms | 46ms | Limit test |

#### Risks
- **Low:** The multiplier is a constant, not user-exposed. Changed only for validation.
- **Low:** Extreme speeds (Profile D) may be unplayable. That's expected — the point is finding the limit.

#### Verification
- [ ] Changing `RUNNER_SPEED_MULTIPLIER` to 1.25 produces visibly faster gameplay
- [ ] Changing `RUNNER_SPEED_MULTIPLIER` to 1.0 restores normal speed
- [ ] `npm test -- --run` — all tests pass (baseline: 434)
- [ ] `npm run build` — no errors

#### Acceptance Criteria
- [ ] Speed multiplier can be changed via a single constant
- [ ] All four profiles produce distinguishable gameplay speeds
- [ ] No tests rely on hardcoded speed values for runner mode

---

### Phase C3 — Course Generation: Minimum Spacing Guard

#### Goal

Add a minimum spacing guard between obstacle pattern rows to prevent unreadable obstacle clusters at high difficulty. The PRD's event density, threat model, and food decision requirements are primarily validated through recording review (Phase B and final validation), not code changes. The existing single/double blocker model with random lane blocking already creates reactive gameplay. The only code fix needed is preventing obstacles from spawning on adjacent rows.

#### Implementation

**File:** `src/game/runnerCourse.ts`

Add a minimum row step and a bounds check so obstacles never cluster too tightly or go out of bounds:
```ts
const MIN_PATTERN_SPACING = 2;
const rowStep = Math.max(MIN_PATTERN_SPACING, Math.floor(GRID_SIZE / numPatterns));
```

Inside the pattern generation loop, add a bounds check after computing y:
```ts
const y = i * rowStep;
if (y >= GRID_SIZE) continue; // skip out-of-bounds rows (only relevant at max difficulty with 12 patterns)
```

At max difficulty (12 patterns), `rowStep = max(2, floor(20/12)) = max(2, 1) = 2`. The loop `for (i=0; i<12; i++)` produces y values: 0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20*, 22*. The bounds check skips y=20 and y=22, resulting in 10 placed patterns at max difficulty. At min difficulty (6 patterns), `rowStep = max(2, floor(20/6)) = max(2, 3) = 3`, all 6 patterns fit within bounds. This ensures obstacles are never on adjacent rows and at least 1 clear row separates every obstacle pattern.

**Note on density:** The `MIN_PATTERN_SPACING = 2` guard reduces the maximum number of placed patterns from 12 to 10. This trades raw density for readability. If the PRD's "Extreme pressure" (§19) requires recovering density at high difficulty, the contingency is to increase speed (Phase C2, Profile D at 1.75x) rather than packing more obstacles. Validate via recordings.

#### Why no other course changes?
- **Food decisions (PRD §17):** Already creates risk/reward — food is placed randomly on any lane, and double-blocker patterns force lane changes. Validated via recording.
- **Near misses (PRD §18):** Double-blocker patterns at high difficulty already create "one clear lane" moments. Validated via recording.
- **Event density (PRD §14):** The ~1.7 events/sec calculation is an estimate based on current course generation parameters. The actual density will be evaluated from gameplay recordings. If recordings show excessive downtime (>8s without decision-making per PRD §15), course generation may be adjusted in a follow-up plan.
- **Always-one-clear-lane (PRD §16):** Already enforced by `selectBlockedLanes` (max 2 blocked, min 1 clear). No change needed.

#### Risks
- **Low:** Single constant addition plus bounds check. Cannot break existing behavior — it only prevents patterns from spawning too close or out of bounds.
- **Low:** At 10 patterns with spacing=2, max occupied rows = 10 out of 20. Sufficient free rows for food and clear paths.

#### Verification
- [ ] `npm run lint` — no new warnings
- [ ] `npx tsc --noEmit` — no errors
- [ ] `npm test -- --run` — all tests pass (baseline: 434)
- [ ] New test: verify no two obstacle pattern rows are adjacent in generated course
- [ ] New test: verify no obstacles are placed out of bounds (y >= GRID_SIZE)

#### Acceptance Criteria
- [ ] Obstacles never spawn on adjacent rows (minimum 1-row gap between patterns)
- [ ] No obstacles placed out of grid bounds
- [ ] At least one free lane exists through every obstacle row (already true, verified)
- [ ] New tests for `MIN_PATTERN_SPACING` in runnerCourse.test.ts

**Note:** The pre-existing `state.test.ts` gold-food-timer flakiness (PROJECT_STATE.md §Known Technical Debt #1) is unaffected by M13.5 — new tests use `generateRunnerCourse`/`spawnRunnerFood` with normal food, no gold timer.

---

### Phase C4 — HUD & Game Over Polish

#### Goal

Improve the RunnerHUD and RunnerGameOver overlays to match the arcade-quality presentation of the classic mode's ScoreBoard and overlays. Score visibility during gameplay is required for owner validation question 5 ("Does gameplay feel better than Milestone 13?") — without a visible score, the player cannot compare runs. This is minimal polish, not a redesign.

#### Implementation

##### C4a. RunnerHUD — add score display and visual polish

**File:** `src/components/RunnerHUD.tsx`
- Add Score section to HUD (currently shows Distance, Food, Length, Best — but not the actual score)
- Score is the most important runner metric (combines distance + food). Display it prominently.
- New section order: Score | Distance | Food | Length | Best

**File:** `src/components/RunnerHUD.module.css`
- Match ScoreBoard visual style: horizontal panel with separators, arcade-style fonts
- Score section uses `--color-warning` (gold) to match "Best" styling
- Slightly increase padding/margins for breathing room
- Verify the 5-section HUD wraps gracefully on mobile. Add `@media (max-width: 600px)` breakpoint if needed, similar to the classic ScoreBoard.

##### C4b. RunnerGameOver — show score comparison

**File:** `src/components/RunnerGameOver.tsx`
- Accept `score` prop in addition to existing stats
- Show "Score: {score}" prominently above the stat rows
- If score > highScore, show "New Best!" badge
- If score <= highScore, show "Best: {highScore}" for comparison

**File:** `src/components/RunnerGameOver.module.css`
- Score display uses `--color-warning` and display font
- "New Best!" badge with gold glow animation

##### C4c. Wire score in RunnerGame

**File:** `src/components/RunnerGame.tsx`
- Pass `state.score` to both RunnerHUD and RunnerGameOver

#### Risks
- **Low:** Pure visual changes. No game logic affected.

#### Verification
- [ ] Visual: Score appears in RunnerHUD between Distance and Food
- [ ] Visual: 5-section HUD wraps gracefully on mobile viewport
- [ ] Visual: RunnerGameOver shows score and high score comparison
- [ ] `npm run build` — no errors
- [ ] `npm run lint` — no new warnings
- [ ] `npm test -- --run` — all tests pass (baseline: 434)

#### Acceptance Criteria
- [ ] Score is visible during gameplay (not just at game over)
- [ ] Game over screen shows score comparison (new best vs. previous best)
- [ ] Styling is consistent with existing arcade theme
- [ ] HUD layout works on mobile without overflow

---

## Phase D — Documentation

### Goal

Update project documentation to reflect completed implementation and validation results.

#### D1. SPEC.md

**File:** `SPEC.md`
- Update §20.2 (Lane System): mention lane change visual feedback animation
- Update §20.5 (HUD): add score display and game over score comparison
- Add §20.11 (Viewport Scrolling): document the viewport scroll rendering transform
- Add §20.12 (Speed Profiles): document the validation speed multiplier

#### D2. ARCHITECTURE.md

**File:** `ARCHITECTURE.md`
- Update Runner Lane Visualization section to mention viewport scrolling
- Update Component Architecture to note `viewportHeadY` prop on Board
- Update State Shape to note `laneChangeDirection` prop threading

#### D3. PROJECT_STATE.md

**File:** `docs/PROJECT_STATE.md`
- Update version to v0.13.5
- Update "Current Status" to "Milestone 13.5 — Runner Feel Validation Complete"
- Add M13.5 completed features entry
- Update "Success Definition For Current Milestone" with M13.5 results
- Update test count (expected: 434 + ~4-6 new tests)
- Update "In Progress" to next milestone

#### D4. ROADMAP.md

**File:** `docs/ROADMAP.md`
- Per AGENTS.md ROADMAP Governance: move the completed M13.5 entry from ROADMAP.md to `docs/archive/completed-milestones.md`
- Update ROADMAP.md §Current Progress to reflect M13.5 completion and M14 as next
- Archive the M13.1 `plans/PLAN_REVIEW.md` to `plans/archive/M13_1_PLAN_REVIEW.md` if not already done

### Verification
- [ ] SPEC.md changes are internally consistent
- [ ] ARCHITECTURE.md references match actual component signatures
- [ ] PROJECT_STATE.md test count matches `npm test -- --run`
- [ ] ROADMAP.md milestone sequence is unbroken
- [ ] No contradictory statements across documents

### Acceptance Criteria
- [ ] All four documentation files updated
- [ ] Documentation is consistent with implementation
- [ ] ROADMAP.md points to next milestone
- [ ] M13.1 PLAN_REVIEW.md archived to `plans/archive/`

---

## Definition of Done (Milestone-Level)

### Abort Check
- [ ] Phase B gate passed: viewport scrolling recordings confirm forward motion is perceivable
- [ ] If FAIL → milestone paused per Abort Criteria; no further work done

### Implementation (all phases)
- [ ] Viewport scrolling creates forward motion perception (Phase A)
- [ ] Lane change animations visible (Phase C1)
- [ ] Speed profile multiplier functional (Phase C2)
- [ ] Course generation tuned for event density (Phase C3)
- [ ] HUD displays score; game over shows score comparison (Phase C4)
- [ ] Classic mode rendering is completely unchanged
- [ ] All 434 existing tests pass
- [ ] New tests pass for changed modules (Board outcome tests, runnerCourse.test.ts additions)
- [ ] `npm run build` completes with no errors
- [ ] `npm run lint` passes with no new warnings
- [ ] `npx tsc --noEmit` passes with no errors

### Validation
- [ ] Preconditions: Implementation section's build, lint, typecheck, and tests all pass
- [ ] 5 gameplay recordings captured across 4 speed profiles
- [ ] 6 screenshots captured (start, mid-run, obstacle-approach, lane-change, high-pressure, game over)
- [ ] Project owner answers YES to all 5 validation questions
- [ ] AI review answers affirmatively on all 5 review questions (A-E)
- [ ] AI review answers "Runner" to Runner Identity Check (F)
- [ ] Runner identity is obvious from recordings and screenshots
- [ ] All recordings verified playable (no corrupted files)

### Documentation
- [ ] SPEC.md updated (§20.2, §20.5, §20.11, §20.12)
- [ ] ARCHITECTURE.md updated (viewport scrolling, component props)
- [ ] PROJECT_STATE.md updated (version, status, features, test count)
- [ ] ROADMAP.md updated (milestone entry moved to `docs/archive/completed-milestones.md`)
- [ ] M13.1 PLAN_REVIEW.md archived to `plans/archive/`
- [ ] No inconsistencies across documents

### Exit Decision (per PRD §28)
- [ ] "Does Snake Run have the potential to become a compelling runner?" answered
- [ ] YES → proceed to Milestone 14
- [ ] NO → rework runner concept before continuing

---

## Risk Register

| Risk | Severity | Mitigation |
|------|----------|------------|
| Viewport scrolling causes visual flicker/jitter | Medium | Use React.memo and stable keys (screen coordinates). Test at all speed profiles. |
| 6-row ahead visibility is insufficient at max speed | Medium | At 80ms/tick, 6 rows = 0.48s, just below PRD §16 hard target of 0.5s. Contingency: increase VIEWPORT_TAIL to 12 (7 rows = 0.56s, within target). Validate in Phase B gate recordings. |
| Wrap-around causes one-frame row order glitch (gridY=0 appears below snake at headY=19) | Low | Modulo arithmetic can't know the wrap direction. Only affects the frame immediately after wrap; course is regenerated on wrap so the visual content is new anyway. Acceptable. |
| Speed profiles produce unplayable gameplay | Low | Profile D at 1.75x is a limit test by design. Recording validates the ceiling. |
| Project owner cannot capture recordings | Medium | Document recording process clearly. Include "verify playback" step. Alternative: screenshot sequence instead of video. |
| Recording file corruption or unsupported format | Medium | Verify playback of each recording immediately after capture. Switch tools if first attempt fails. |
| Lane change animation conflicts with viewport scrolling | Low | Animation is on Cell, scrolling is on Board row mapping. Independent systems. |
| Phase B gate fails (viewport scrolling does not create forward motion perception) | High | Milestone pauses per Abort Criteria. Reassess camera strategy. No sunk cost on Phase C polish. |

---

## Test Plan

### New Tests (Outcome-Based)

**File:** `src/components/__tests__/Board.test.tsx` (additions)
- **"snake stays in fixed screen position during viewport scrolling"** — verify snake screen position is constant across multiple ticks regardless of headY value
- **"food becomes visible to the player as it approaches"** — verify food at any grid Y eventually appears at a screen row close to the snake
- **"obstacles become visible to the player as they approach"** — verify obstacles scroll into the visible-ahead region as the snake advances
- **"classic mode rendering is identical when viewportHeadY is undefined"** — regression test ensuring the `if (viewportHeadY !== undefined)` branch does not affect classic mode
- **"viewportHeadY=0 and viewportHeadY=19 produce same screen position for snake head"** — wrap-around math regression test

**File:** `src/game/__tests__/runnerCourse.test.ts` (additions)
- **"MIN_PATTERN_SPACING prevents adjacent obstacle rows"** — verify spacing between patterns
- **"no obstacles placed out of grid bounds"** — verify all placed obstacles have y < GRID_SIZE
- **"at least one lane always clear per obstacle row"** — verify no row blocks all 3 lanes

### Existing Tests at Risk
- `Board.test.tsx`: Current tests don't pass `viewportHeadY` → should pass unchanged. Verify.
- `Cell.test.tsx`: May need assertions for new lane change animation classes. Add test for `laneChangeDirection` prop.
- `state.test.ts`: Unaffected (no game logic changes). Pre-existing gold-food-timer flakiness (PROJECT_STATE.md §Known Technical Debt #1) is unaffected by M13.5.
- `Engine.test.ts`: May be affected by speed multiplier constant. Tests that hardcode speed should stub or use default multiplier (1.0).

---

## Summary

| Phase | Files Changed | New Files | Risk |
|-------|--------------|-----------|------|
| A — Viewport Scroll | 4 (Board.tsx, RunnerGame.tsx, types/components.ts, constants.ts) | 0 | Medium |
| B — Validation Gate | 0 | 1 dir + README + .gitignore | High (gate risk) |
| C1 — Lane Feedback | 3 (RunnerGame.tsx, Board.tsx, Cell.tsx) + CSS | 0 | Low |
| C2 — Speed Profiles | 2 (constants.ts, Engine.ts) | 0 | Low |
| C3 — Course Tuning | 1 (runnerCourse.ts) | 0 | Low |
| C4 — HUD/GameOver | 2 (RunnerHUD.tsx, RunnerGameOver.tsx) + CSS | 0 | Low |
| D — Documentation | 4 (SPEC.md, ARCHITECTURE.md, PROJECT_STATE.md, ROADMAP.md) | 1 (plans/archive/) | Low |

Total: ~16 existing files modified, 1 new directory with README, 1 archive entry.
No new components. No new game modules. No engine refactors.

### Files Summary

| File | Phase | Changes |
|------|-------|---------|
| `src/game/constants.ts` | A, C2 | Add `RUNNER_VIEWPORT_TAIL`, `RUNNER_SPEED_MULTIPLIER` |
| `src/game/Engine.ts` | C2 | Apply speed multiplier in runner tick calc |
| `src/game/runnerCourse.ts` | C3 | Add `MIN_PATTERN_SPACING`, bounds check |
| `src/components/Board.tsx` | A, C1 | Viewport scrolling, `React.memo`, `data-viewport-scrolling`, forward `laneChangeDirection` |
| `src/components/Cell.tsx` | C1 | Lane change animation CSS classes |
| `src/components/Cell.module.css` | A, C1 | Scrolling transition, lane change keyframes |
| `src/components/RunnerGame.tsx` | A, C1, C4 | Wire `viewportHeadY`, `laneChangeDir` state, pass `score` |
| `src/components/RunnerHUD.tsx` | C4 | Score section |
| `src/components/RunnerHUD.module.css` | C4 | Score styling, mobile breakpoint |
| `src/components/RunnerGameOver.tsx` | C4 | Score comparison, "New Best!" badge |
| `src/components/RunnerGameOver.module.css` | C4 | Score styling |
| `src/types/components.ts` | A, C1 | `viewportHeadY`, `laneChangeDirection` props |
| `src/components/__tests__/Board.test.tsx` | A | Outcome-based viewport + classic regression tests |
| `src/game/__tests__/runnerCourse.test.ts` | C3 | Spacing and bounds tests |
| `SPEC.md` | D | §20.2, §20.5, §20.11, §20.12 |
| `ARCHITECTURE.md` | D | Viewport scrolling, component props |
| `docs/PROJECT_STATE.md` | D | Version, status, features, test count |
| `docs/ROADMAP.md` | D | Milestone completion → archive |
| `docs/Milestone 13_5_validation/README.md` | B | Validation instructions |
| `plans/archive/M13_1_PLAN_REVIEW.md` | D | Archive prior review |
