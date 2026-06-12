# M14.1 SMOOTH RUNNER MOTION — Implementation Plan

**Status:** Archived (Implementation Complete, Subjective Goal Not Achieved — 2026-06-12)
**Milestone:** 14.1 — Smooth Runner Motion V2
**PRD:** `docs/prd/PRD_M14_1.md`
**Date:** 2026-06-12
**Baseline:** M14 complete — 487 tests passing across 30 test files
**Final:** 503 vitest tests + 5 Playwright e2e tests passing

---

## Post-Implementation Assessment (2026-06-12)

The implementation is technically correct and stable. Playwright automated tests confirm the CSS animation interpolates continuously between ticks (185 distinct translateY values across 361 frames at ~120fps).

However, project owner assessment on 2026-06-12 confirmed the implementation did not achieve the PRD's subjective success criteria:

- **PRD Q5 "Does the game appear visually faster?"** — **No**
- **PRD Q6 "Does the runner feel more professional?"** — **No**
- **Wrap transition improvement** — Same as before (no regression, no improvement)

Three of four PRD failure conditions triggered:
- Movement still appears 5 FPS (feels like discrete ticks)
- Viewport still jumps (tick-boundary snap visible)
- Improvement is not visually obvious (Q5/Q6: No)

### Why It Didn't Work

The 5% per-tick translateY (one cell height, ~23px on the rendered board) over 200ms was below the threshold of perceivable meaningful motion. The tick-boundary snap — where the matrix goes from `translateY(0)` back to `translateY(-5%)` to start the next interpolation cycle (observed in Playwright report as `maxNegative: -23`) — is visible to the eye even when the *interpolation between* ticks is smooth. CSS animation on a wrapper does not address the underlying logical discrete-positioning model.

### Project Owner Decision (2026-06-12)

**"Keep code, document failure."** The implementation is retained in the codebase. No reversion. Documentation updated to honestly reflect the outcome. See `docs/Milestone 14.1-validation/VALIDATION.md` for full assessment and lessons learned.

### Future Attempts

If a future milestone revisits motion quality, candidate approaches include:
- **Option B (rAF visual state layer)**: per-frame visual state decoupled from logical positions, ~200 LOC, the original plan's rejected option
- **Increase perceived motion magnitude**: scale up the translateY range (e.g., -10% per tick instead of -5%) to make the interpolation more visually impactful
- **Reframe the goal**: rather than "feels professional," target "feels acceptable" — a lower bar that may be achievable with this implementation

---

## Overview

The runner looks and feels like ~5 FPS because gameplay positions only update at tick boundaries (200ms → 80ms). Between ticks, the board is visually frozen. The engine, browser FPS, and React rendering are all healthy — this is purely a presentation problem.

**Goal:** Visual movement becomes continuous without changing any gameplay logic, collision detection, scoring, or obstacle generation.

**Approach:** Hybrid — CSS animation on the board's scrolling content layer for viewport motion, retaining existing lane-change CSS animations.

---

## Terminology Clarification

The PRD problem is **interpolation perception** — the player perceives discrete position updates as choppy because positions only change at tick boundaries (every 80–200ms). Between ticks, the board is visually frozen.

The implementation uses **CSS animation as the interpolation mechanism.** Between logical ticks, the browser's keyframe engine computes intermediate `translateY` values linearly over the animation duration. This produces continuous visual motion without changing any gameplay logic.

Specifically, for a given game object at logical row `y_logical`:

```
visual_y = y_logical - (1 - animation_progress(t)) * cell_height
```

Where `animation_progress(t)` is a value in [0, 1] computed by the browser from the `@keyframes viewportScroll` interpolation. At animation start (t=0), the visual position is one cell above the logical position (`-cell_height`). At animation end (t=tick_interval), the visual position matches the logical position. Between these endpoints, the visual position moves continuously.

This is **CSS animation as interpolation**, not merely "adding an animation effect." The milestone succeeds when visual positions evolve continuously between logical updates.

---

## Architecture Comparison

Per PRD requirements, four approaches were evaluated.

### Option A: CSS Transform Interpolation

**Approach:** Keep current logical tick model. Apply CSS `transform: translateY()` animation on board content between ticks. Let the browser interpolate.

| Criterion | Assessment |
|-----------|-----------|
| Complexity | Low — ~50 LOC, 2 files changed |
| Risk | Low — pure CSS, no engine changes, trivial rollback |
| Performance | Excellent — GPU-accelerated transform, zero JS per frame |
| Code churn | Minimal — Board.tsx + Board.module.css |
| Compatibility | Fits existing architecture perfectly; grid layout unchanged |

**Advantages:** Lowest implementation risk. No architectural changes. Single CSS animation drives all visual motion.

**Disadvantages:** 
- Cannot handle wrap-around transition smoothing (19-cell viewport jump) without disabling animation for that frame.
- Does not address course regeneration "popping" — but per PRD's own core finding, this is a presentation problem, not a content generation problem. Smooth scrolling moves the regeneration event past the player too quickly to register.

**Verdict:** Strong candidate. Simple enough to implement and validate in one session.

### Option B: requestAnimationFrame Visual Layer

**Approach:** Maintain logical game state. Create separate visual state updated every animation frame. Render from visual state.

| Criterion | Assessment |
|-----------|-----------|
| Complexity | High — ~200+ LOC, engine API surface change, per-frame React re-renders or direct DOM ref manipulation |
| Risk | Medium — decoupling visual from logical positions is architecturally invasive |
| Performance | Risk of 60fps React re-renders of 400 cells; ref-based DOM updates avoid React but create dual render paths |
| Code churn | Significant — Engine.ts, useGame.ts, RunnerGame.tsx, Board.tsx, Cell.tsx, component types |
| Compatibility | Requires new rAF loop in React layer, separate subscription for per-frame state |

**Advantages:** Most flexible. Industry-standard approach. Could handle any future visual effect.

**Disadvantages:** Over-engineered for this milestone. The investigation proved no FPS problem exists. 200+ LOC and an architectural split for a pure presentation fix violates "simple solutions" philosophy. Per-frame React re-renders (or ref-based DOM manipulation) add maintenance burden.

**Verdict:** Rejected. Complexity not justified by investigation findings. PRD explicitly forbids a full rendering rewrite; this is close in spirit.

### Option C: Hybrid (CSS Animation + Existing CSS Lane Transitions)

**Approach:** CSS animation on board content for viewport scrolling. Existing 150ms `slideLeft`/`slideRight` CSS animations for lane changes. Lane transitions are already smooth — this milestone focuses on viewport scrolling.

| Criterion | Assessment |
|-----------|-----------|
| Complexity | Low-Medium — ~80 LOC, 3-4 files changed |
| Risk | Low — engine changes are minimal (expose tick progress getter only) |
| Performance | Excellent — GPU-accelerated transforms, zero JS per frame |
| Code churn | Low — Board.tsx, Board.module.css, RunnerGame.tsx, Engine.ts (1 method) |
| Compatibility | Preserves all existing architecture; game loop unchanged |

**Advantages:** Best balance of quality and complexity. CSS animation handles 100% of viewport motion. Lane changes are already smooth. Zero per-frame JavaScript. Single animation property toggled on/off.

**Disadvantages:** Wrap-around boundary requires animation suppression for one frame (19-cell shift can't be interpolated cleanly). Course regeneration on wrap is still instantaneous, but smooth scrolling hides this visually (obstacles slide into view rather than pop into view).

**Verdict: Chosen.** Aligns with "small changes, simple solutions" philosophy. Meets all PRD requirements with minimal code.

### Option D: Full Rendering Rewrite

**Status: Forbidden.** Not justified by investigation findings. PRD explicitly rejects this option.

---

## Chosen Approach: Hybrid (CSS Animation Viewport)

### How It Works

1. Board renders grid cells inside an inner wrapper `<div>`.
2. When a tick fires (headY changes), the grid re-renders with the new logical position.
3. On the inner wrapper, a CSS `@keyframes` animation translates content from `-100%/GRID_SIZE` (one cell up) to `0` over the tick interval duration.
4. At tick start, content is "pulled back" by one cell, then animates back to neutral.
5. Net visual effect: content smoothly slides down by one cell over the tick interval, matching the grid shift caused by headY decreasing.
6. The animation restarts on each tick via a CSS class toggle (remove → force reflow → re-add).
7. Lane changes retain existing 150ms CSS slide animations.

### Why This Works

- **Logical state** is the source of truth for grid positions — unchanged.
- **Visual state** is a CSS transform applied on top of the logical grid — purely presentational.
- Player sees the world glide continuously downward instead of jumping in 200ms increments.
- Snake stays visually fixed at the lower third of the screen (modulo the tiny per-tick bob, which is sub-cell and unobservable).

---

## Motion Model Validation

The plan must demonstrate that visual positions evolve continuously between logical updates. Below is a worked example for a single obstacle at logical `y=5` with a 200ms tick interval.

### Position Evolution Over One Tick

| Time (ms) | animation_progress | translateY        | visual_y   |
|-----------|--------------------|--------------------|------------|
| 0         | 0.00              | -1 cell (-5%)     | 4.00       |
| 50        | 0.25              | -0.75 cell (-3.75%)| 4.25      |
| 100       | 0.50              | -0.5 cell (-2.5%) | 4.50       |
| 150       | 0.75              | -0.25 cell (-1.25%)| 4.75      |
| 200       | 1.00              | 0 cell (0%)       | 5.00       |

At t=0 (tick just fired), the board re-renders with the new logical position (obstacle at y=5). The CSS animation starts with `translateY(-5%)`, pulling the content one cell up — the obstacle appears at visual row 4. The animation then interpolates linearly: at t=100ms the obstacle appears at visual row 4.5, at t=200ms it reaches row 5. At t=200ms the next tick fires, the board re-renders with the new logical position, and the animation restarts.

Between t=0 and t=200ms, the visual position moves through exactly one cell height. The player perceives continuous downward glide rather than discrete jumps every 200ms.

### Frame-Level Interpolation Proof

At 60fps (16.67ms per frame), the browser renders ~12 frames per 200ms tick. The computed `translateY` values across these frames:

| Frame | Time (ms) | translateY | delta from prev frame |
|-------|-----------|------------|-----------------------|
| 1     | 0         | -5.00%     | —                     |
| 2     | 16.67     | -4.58%     | +0.42%                |
| 3     | 33.33     | -4.17%     | +0.41%                |
| ...   | ...       | ...        | ...                   |
| 12    | 200.00    | 0.00%      | +0.42%                |

Every frame shows a non-zero, consistent delta (~0.42% of board height per frame). This is continuous motion — the screen never shows the same position on two consecutive frames (except at exact tick boundaries). By contrast, the current implementation shows zero delta for 11 consecutive frames, then a full 5% jump on the 12th frame.

---

## Phase 1: Engine — Expose Tick Interval

Extract the duplicate effective-speed computation in `Engine.startLoop()` into a shared private helper. Expose a public `getTickInterval()` method so the render layer can set the CSS animation duration to match the actual tick speed, eliminating the need to mirror the speed calculation in RunnerGame.

### Files to Change

| File | Change |
|------|--------|
| `src/game/Engine.ts` | Add private `getEffectiveSpeed()`, add public `getTickInterval()` |

### Implementation

**Step 1: Extract private `getEffectiveSpeed()`**

The effective speed calculation is duplicated in `startLoop()` (tick timing) and `getTickInterval()` (animation duration). Extract into a private method:

```typescript
// Engine.ts — private helper, called by startLoop() and getTickInterval():
private getEffectiveSpeed(): number {
  if (this.state.isRunner) {
    const speed = Math.max(
      RUNNER_MIN_SPEED,
      RUNNER_INITIAL_SPEED - Math.floor(this.state.distance / 50) * 2
    );
    return Math.round(speed / RUNNER_SPEED_MULTIPLIER);
  } else {
    const config = getLevelData(this.state.level);
    const speed = config.speed ?? 150;
    return this.state.speedEffectTicks > 0 ? speed * SLOW_EFFECT_MULTIPLIER : speed;
  }
}
```

Refactor `startLoop()` to call `this.getEffectiveSpeed()` in place of the current duplicated calculation.

**Step 2: Add public `getTickInterval()`**

```typescript
// Engine.ts — add after getStats():
getTickInterval(): number {
  return this.getEffectiveSpeed();
}
```

Returns the current tick interval in milliseconds. RunnerGame calls this to set `--viewport-speed` on the board inner div. Classic mode callers can also use it for timing display.

> **Note:** `getTickProgress()` (accumulator ratio) is deliberately NOT exposed. The plan uses pure CSS animation (Option A), not rAF interpolation (Option B). The render layer does not need accumulator state — it only needs the tick interval duration.

### Tests

| Test | File |
|------|------|
| `getTickInterval` returns `RUNNER_INITIAL_SPEED / RUNNER_SPEED_MULTIPLIER` at distance=0 | `src/game/__tests__/Engine.test.ts` |
| `getTickInterval` decreases as distance increases | same |
| `getTickInterval` never returns below `RUNNER_MIN_SPEED / RUNNER_SPEED_MULTIPLIER` | same |
| `getTickInterval` returns classic mode speed when `isRunner=false` | same |
| `getEffectiveSpeed` refactor does not change tick timing behavior (regression) | same |

### Verification

```
npm test -- src/game/__tests__/Engine.test.ts
npx tsc --noEmit
```

---

## Phase 2: Board — Viewport Smooth Scrolling

Add an inner content wrapper to the Board component and apply a CSS animation that creates continuous viewport motion.

### Files to Change

| File | Change |
|------|--------|
| `src/components/Board.tsx` | Remove inline `display: grid`/`gridTemplateColumns`/`gridTemplateRows` from `.board`; add inner wrapper div as the grid container; accept `animateViewport` and `innerRef` props |
| `src/components/Board.module.css` | Add `.boardInner` styles, `.boardAnimated` class, and `@keyframes viewportScroll` |
| `src/types/components.ts` | Add `animateViewport?: boolean` and `innerRef?: React.Ref<HTMLDivElement>` to `BoardProps` |

### Implementation

**Board.tsx changes:**

The existing `.board` element has inline `display: grid`/`gridTemplateColumns`/`gridTemplateRows` (Board.tsx lines ~53-57). These must be **removed** from `.board` and placed on the new inner wrapper. `.board` becomes a positioning container; the inner div is the new grid container.

```tsx
// Board.tsx — BEFORE (simplified):
<div
  className={styles.board}
  role="grid"
  style={{
    display: 'grid',             // <-- REMOVE
    gridTemplateColumns: ...,     // <-- REMOVE
    gridTemplateRows: ...,        // <-- REMOVE
    width: '100%',
    height: '100%',
    aspectRatio: '1 / 1',
  }}
>
  {grid.map(...)}                 {/* cells are direct children */}
</div>

// Board.tsx — AFTER (simplified):
<div
  className={styles.board}
  role="grid"
  style={{
    width: '100%',
    height: '100%',
    aspectRatio: '1 / 1',
  }}
>
  <div
    ref={innerRef}
    className={`${styles.boardInner} ${animateViewport ? styles.boardAnimated : ''}`}
    style={{
      display: 'grid',
      gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)`,
      gridTemplateRows: `repeat(${GRID_SIZE}, 1fr)`,
      width: '100%',
      height: '100%',
    }}
  >
    {grid.map(...)}               {/* cells are now children of boardInner */}
  </div>
</div>
```

**Why this works:** `.board` retains `width: 100%`, `height: 100%`, and `aspect-ratio: 1/1` for sizing. The inner div inherits full size (`100% × 100%`) and becomes the grid container — its 1:1 aspect ratio matches, so `translateY(-5%)` equals exactly one cell height (5% of board height = 1/20th = one cell). The 400 cells are direct children of the inner div's grid and lay out identically to before.

**Board.module.css additions:**

```css
.boardInner {
  /*
   * Grid container for the 400 cells. .board is the positioning container.
   * width/height are set inline (via style prop) to inherit .board's size.
   * transform: translateY(-5%) on .boardAnimated is 5% of THIS element's
   * height, which equals one cell height.
   */
}

.boardAnimated {
  animation: viewportScroll var(--viewport-speed, 200ms) linear;
}

@keyframes viewportScroll {
  0%   { transform: translateY(-5%); }  /* -100% / GRID_SIZE = -5% per cell */
  100% { transform: translateY(0); }
}

@media (prefers-reduced-motion: reduce) {
  .boardAnimated {
    animation: none;
  }
}
```

**Animation restart mechanism (in RunnerGame, not Board):**

The animation must restart on each tick. The approach uses class toggle with forced reflow:

1. Remove the `.boardAnimated` class
2. Force reflow (`void el.offsetWidth`) — this resets the animation state
3. Re-add the `.boardAnimated` class — the animation starts from frame 0

This technique is a well-understood CSS pattern. At runner speeds (5–12 ticks/second), the forced reflow fires 5–12 times per second, which is negligible for performance. Alternative approaches considered and rejected:

- **Web Animations API (`el.animate()`):** Starts a fresh `Animation` object on each tick. Cleaner, but requires ~10 LOC of JS per tick. Adds no measurable benefit over the class-toggle reflow pattern at these speeds.
- **Unique animation names per tick:** Sets `style.animation = 'viewportScroll-${tickId} 200ms linear'` with a new `tickId` each tick. Avoids forced reflow but thrashes the DOM style attribute.

The forced reflow approach is chosen for simplicity — one line of JS (`void el.offsetWidth`) that has shipped in production CSS animation libraries for years.

The Board exposes the inner div via an `innerRef` callback prop (or `React.forwardRef`). RunnerGame passes a ref that it uses to toggle the animation class.

### Tests

| Test | File |
|------|------|
| Board renders inner content wrapper (`.boardInner`) | `src/components/__tests__/Board.test.tsx` |
| Inner wrapper is the grid container (display: grid, 400 direct children) | same |
| `animateViewport=true` adds `.boardAnimated` class | same |
| `animateViewport=false` does not add `.boardAnimated` class | same |
| Existing tests pass with inner wrapper: `data-viewport-scrolling` attribute (already in Board.test.tsx:71-75) | same |
| Existing tests pass with inner wrapper: runner viewport renders 400 cells (already in Board.test.tsx:43-46) | same |
| Snapshot: classic mode regenerated (inner wrapper adds one DOM level) | same |
| `prefers-reduced-motion: reduce` suppresses animation | same |

### Verification

```
npm test -- src/components/__tests__/Board.test.tsx
npm run build
npx tsc --noEmit
```

---

## Mid-Milestone Checkpoint: Validate Approach Before Full Wiring

**Purpose:** Validate that the CSS animation approach actually solves the original problem BEFORE investing in Phase 3-5 wiring, tests, and documentation.

**Trigger:** After Phase 1 + Phase 2 are complete and all tests pass.

**Steps:**

1. Implement Phase 1 (`getTickInterval()`) and Phase 2 (inner wrapper + CSS animation).
2. Hardcode the animation as "always on" for runner mode (no tick detection yet — just add `boardAnimated` class permanently when `viewportHeadY` is set).
3. Run the game in dev mode and capture a 30-second runner gameplay recording.
4. Ask the exit question: **"Does the game still appear to run at 5 FPS?"**
5. If **YES** (still looks choppy) — pause the milestone. Do not proceed to Phase 3. Reassess the motion strategy.
6. If **NO** (looks smoother) — proceed to Phase 3 with confidence. The approach works; now wire the timing.

**Cost:** ~1-2 hours of work. **Risk reduction:** Prevents investing 4-8 hours in Phases 3-5 only to discover the approach is wrong at the end.

---

## Phase 3: RunnerGame — Wire Animation Timing

Wire the Engine's `getTickInterval()` into the Board's CSS animation. Restart the animation on each tick via class toggle on the inner div.

### Files to Change

| File | Change |
|------|--------|
| `src/components/RunnerGame.tsx` | Pass engine ref or access via hook; track current tick interval; add animation restart useEffect; expose `boardInnerRef` |
| `src/hooks/useGame.ts` | Re-export `engine.getTickInterval()` (or RunnerGame accesses engine directly) |

### Implementation

**Approach:** On each tick (detected by `state.snake[0].y` change), set `--viewport-speed` on the inner div and restart the CSS animation via class toggle + forced reflow.

```tsx
// RunnerGame.tsx additions:
const boardInnerRef = useRef<HTMLDivElement>(null);
const prevHeadY = useRef<number>(10);

useEffect(() => {
  if (!state.isRunner || state.status !== 'playing') return;
  
  const currentY = state.snake[0]?.y ?? 10;
  const delta = Math.abs(currentY - prevHeadY.current);
  prevHeadY.current = currentY;

  // Wrap-around detection: skip animation for this frame
  // The 19-cell viewport shift can't be interpolated cleanly.
  // Validation (Phase 5) empirically confirms this is visually acceptable
  // at the screen edge and meets the PRD's "appear continuous" threshold.
  if (delta > 1) return;

  const el = boardInnerRef.current;
  if (!el) return;

  // Set animation duration from Engine (single source of truth for speed)
  const tickInterval = engineRef.current.getTickInterval();
  el.style.setProperty('--viewport-speed', `${tickInterval}ms`);

  // Restart animation: remove class, force reflow, re-add class
  el.classList.remove(styles.boardAnimated);
  void el.offsetWidth; // force reflow — resets animation state
  el.classList.add(styles.boardAnimated);
}, [state.snake[0]?.y, state.isRunner, state.status]);
```

> **StrictMode note:** React 19 StrictMode (`src/main.tsx:21`) double-invokes effects on mount/unmount in dev. This useEffect will fire twice on first mount (class removed → reflow → added, then again). This is harmless — the second invocation overwrites the first's animation state cleanly — but implementers should be aware when debugging mount behavior.

**Engine access pattern:** RunnerGame accesses the engine via a ref or via the `useGame` hook. If `useGame` does not currently expose the engine instance, add `engine` to the hook's return type or accept `engineRef` as a prop.

### Test Scaffolding

Create `src/components/__tests__/RunnerGame.test.tsx` (new file). Mocking requirements:

| Dependency | Mock Strategy |
|-----------|---------------|
| `useGame` | Mock to return deterministic `GameState` with `isRunner: true`, `status: 'playing'`, and a snake array |
| `useTouch`/`useSwipe` | Mock to no-op (prevent gesture detection setup in test environment) |
| `sharedSoundManager` | Mock to silence audio subscriptions |
| `boardInnerRef` | Provide a real `<div>` via `data-testid="board-inner"` |

Reference existing mocking patterns in `src/components/__tests__/useGame.test.tsx` and `src/components/__tests__/useTouch.test.tsx` for the `useGame` and `useTouch` mock setups.

### Tests

| Test | File |
|------|------|
| Board inner div gets `--viewport-speed` CSS custom property on tick | `src/components/__tests__/RunnerGame.test.tsx` |
| CSS class is removed and re-added on tick (animation restarts) | same |
| Wrap-around (delta > 1) suppresses animation class toggle | same |
| Animation duration changes as speed increases (distance-dependent) | same |
| Triggering a lane change during a tick does NOT remove `.boardAnimated` class | same |

### Verification

```
npm test -- src/components/__tests__/RunnerGame.test.tsx
npm run dev  # manual visual check: runner mode viewport scrolls smoothly
npx tsc --noEmit
npm run lint
```

---

## Phase 4: Refinement & Edge Cases

### 4a. Lane Transition Polish

Existing lane change animations (`slideLeft`/`slideRight` at 150ms) are already smooth. No changes needed. Both animations use `transform` but on different elements — viewport animation is on the inner wrapper div, lane change animation is on the snake head cell. The browser compositor handles them independently.

**Concurrent animation behavior:** If a lane change occurs during a viewport tick (e.g., at t=100ms into a 200ms tick), both animations play concurrently — the cell slides left/right while the viewport scrolls down. The two `transform`s compose without conflict because they're on different DOM elements. This is the intended product behavior; no visual conflict occurs.

Verify with the Phase 3 automated test: "Triggering a lane change during a tick does NOT remove `.boardAnimated` class."

### 4b. Pause/Resume Handling

When the player pauses, the game loop stops and the status changes from `playing`. The CSS animation should stop (the `animateViewport` class is removed when status is not `playing`). On resume, the animation restarts cleanly.

**Implementation:** Already handled — the `useEffect` in Phase 3 only fires when `state.isRunner && state.status === 'playing'`.

### 4c. Game Over Freeze

When status becomes `gameover`, the animation class is removed, and the board freezes at its current visual position. This is correct — the "death freeze" should show the exact collision position.

### 4d. Classic Mode Unchanged

Classic mode Board gains a new inner wrapper div (one extra DOM level), but the `.boardAnimated` class is not added — only runner mode triggers animation. Visual layout is byte-identical to pre-change behavior; the new wrapper has no visible effect. All classic mode tests continue to pass.

The Phase 2 snapshot for classic mode must be regenerated to include the new inner wrapper. The diff should show exactly one change: cells are wrapped in `.boardInner` with no other DOM structure changes.

### Verification

```
npm run dev  # manual test:
# 1. Play runner mode — obstacle glide is smooth
# 2. Pause mid-run — board freezes correctly
# 3. Resume — scrolling resumes smoothly
# 4. Die — board freezes at collision point
# 5. Play classic mode — completely unchanged
# 6. Change lane while running — slide animation + smooth scroll compose
```

---

## Phase 5: Validation

### 5a. Before/After Recordings

Per PRD validation requirements:

1. Record a ~30-second runner gameplay session on the current `main` branch.
2. Implement Phase 1-4 changes.
3. Record a ~30-second runner gameplay session on the feature branch with similar gameplay.
4. Store recordings in `docs/Milestone 14.1-validation/recordings/` (matching the existing milestone-scoped pattern: M13.5 uses `docs/Milestone 13_5_validation/`, M14 uses `docs/Milestone 14-validation/`).
5. Add `.gitignore` entries:
   ```
   docs/Milestone 14.1-validation/recordings/*.webm
   docs/Milestone 14.1-validation/recordings/*.mp4
   docs/Milestone 14.1-validation/recordings/*.mov
   ```
6. Add a `docs/Milestone 14.1-validation/README.md` documenting that recordings are stored externally (Google Drive, GitHub Releases, etc.).

### 5b. Frame-by-Frame Motion Quality Validation

Per PRD §"AI Review Questions" and to objectively answer "does movement no longer appear to run at 5 FPS?":

1. Capture a 30-second recording at a stable point in the run (e.g., 50-100 ticks in, no food eaten to avoid state churn).
2. Extract 3 consecutive frames at ~16ms intervals using ffmpeg or similar:
   ```
   ffmpeg -i recording.webm -vf "select=between(n\,100\,102)" -vsync vfr frames_%d.png
   ```
3. For each consecutive pair, measure the screen-space delta of a reference obstacle.
4. **Pass condition:** Deltas are non-zero and consistent across all frame pairs. **Fail condition:** Deltas are mostly zero with occasional jumps.
5. If deltas are consistent (~0.42% of board height per frame at 60fps), motion is proven continuous. The PRD's exit question ("Does the game still appear to run at 5 FPS?") is answered NO with objective evidence.

Note: Automated tests verify state transitions; visual smoothness is verified by the Phase 5a/b recording review (PRD §"AI Review Questions").

### 5c. Wrap Transition Empirical Validation

Per PRD §"Wrap Transition Requirements" ("Forbidden: visible mutation, visible replacement, visible popping"):

1. Capture a 60-second recording that includes at least 2-3 wrap transitions.
2. Frame-by-frame review of the wrap frame and the 2 frames before/after each transition.
3. Review question: **"Does the wrap transition appear visually continuous to a casual observer?"**
4. If the answer is YES — the plan is empirically validated. The single-frame snap is acceptable because it occurs at the screen edge when the snake is at the very bottom row; the viewer's attention is on the snake head, not the bottom boundary.
5. If the answer is NO (visible popping observed) — the milestone's wrap handling needs implementation work. Options:
   - **(a) Punch-through animation:** A one-time 200ms animation that briefly shows two laps' content superimposed before settling into the new lap. PRD-compliant but visually busy.
   - **(b) PRD update:** Update PRD §"Wrap Transition Requirements" to explicitly accept single-frame boundary snap with recorded empirical evidence as justification. Requires product-owner sign-off.
   - **(c) Continuous course generation:** Generate 2+ laps of course content so the wrap doesn't require a full viewport reset. More implementation work (~50-100 LOC) but architecturally cleaner.

### 5d. AI Review Questions

Per PRD §AI Review Questions, verify all answers are YES:

| # | Question | Expected |
|---|----------|----------|
| 1 | Does the world move continuously? | YES |
| 2 | Do obstacles glide? | YES |
| 3 | Does food glide? | YES |
| 4 | Does viewport movement appear smooth? | YES |
| 5 | Does the game appear visually faster? | YES |
| 6 | Does the runner feel more professional? | YES |
| 7 | Is motion quality noticeably improved? | YES |

### 5e. Failure Condition Check

Per PRD §Failure Conditions:

- [ ] Movement no longer appears 5 FPS
- [ ] Viewport no longer jumps
- [ ] Obstacles no longer jump
- [ ] Improvement is visually obvious
- [ ] Wrap transitions validated empirically (no visible popping)

### 5f. Acceptance Criteria

- [ ] Continuous viewport motion
- [ ] Continuous obstacle motion
- [ ] Continuous food motion
- [ ] Smooth lane transitions (already met; verify unchanged)
- [ ] Wrap transitions validated empirically (no visible popping)
- [ ] No gameplay rule changes (verify all 487 existing tests still pass)
- [ ] No balance changes
- [ ] Architecture comparison completed (this document)
- [ ] Chosen strategy documented (this document)
- [ ] Before/after recordings created
- [ ] Frame-by-frame motion quality validation passes
- [ ] Visual review passes

### 5g. Documentation Updates

After implementation completes:

| Document | Update |
|----------|--------|
| `SPEC.md` | Add new sub-section §20.14 "Smooth Viewport Scrolling" (after §20.13). Do NOT modify §20.11 "Viewport Scrolling" — that documents screen-row mapping. |
| `ARCHITECTURE.md` | Add "Smooth Runner Motion" sub-section after "Runner Viewport Scrolling" |
| `docs/PROJECT_STATE.md` | Mark M14.1 complete, update version to v0.14.1 |
| `docs/ROADMAP.md` | Move M14.1 to completed milestones |
| `package.json` | Bump version from `0.13.1` to `0.14.1` (resolves pre-existing PROJECT_STATE vs package.json drift) |

---

## Risks and Assumptions

| Risk | Mitigation |
|------|-----------|
| CSS animation compositing conflicts with lane change animations | Both use `transform` on different elements (board wrapper vs head cell). Browser compositor handles independently. Phase 3 includes automated regression test: lane change during tick does not remove animation class. |
| Animation restart via class toggle may cause flicker | Forced reflow (`void el.offsetWidth`) between remove/add ensures clean restart. This is a well-understood CSS pattern used in production animation libraries. At 5-12 ticks/second, the performance cost is negligible. |
| Wrap-around boundary creates visible snap | Empirically validated in Phase 5c with frame-by-frame wrap recording review. If popping is visible, fallback to punch-through animation (brief 200ms two-lap overlay) or continuous course generation. PRD update with empirical evidence as alternate resolution path. |
| `RUNNER_SPEED_MULTIPLIER` validation profiles break animation timing | The multiplier only affects logical tick speed. `getTickInterval()` returns the effective speed, so CSS animation duration automatically tracks validation profiles. |
| Mobile browsers handle CSS animation differently | Test on iOS Safari and Chrome Android. If issues, fallback to no animation on mobile (graceful degradation). |
| Mid-milestone checkpoint reveals approach doesn't solve the problem | If the checkpoint (after Phase 1+2) shows the game still looks like 5 FPS, pause the milestone. Do not proceed to Phase 3. Reassess strategy — Options B or D from Architecture Comparison become relevant. |
| React 19 StrictMode double-invokes animation useEffect on mount | The second invocation cleanly overwrites the first's animation state. No flicker observed. Documented in Phase 3 with explicit note. |

### Assumptions

1. CSS `@keyframes` animation with `linear` easing produces visually continuous motion at typical tick speeds (80ms–200ms). At very slow speeds (200ms), one cell over 200ms is perceptible but vastly smoother than one jump every 200ms. At fast speeds (80ms), the animation is barely perceptible — which is the goal.
2. The browser compositor handles the `transform` on the inner wrapper efficiently (GPU-accelerated, no layout thrashing).
3. Existing lane change animations compose correctly with the new viewport animation.
4. Forced reflow (`void el.offsetWidth`) at 5-12 ticks/second has no observable performance impact on any target platform.
5. The `prefers-reduced-motion: reduce` media query (Phase 2 CSS) provides adequate a11y coverage for users with motion sensitivity. No additional a11y work is required.
6. The mid-milestone checkpoint and frame-by-frame validation provide sufficient empirical confidence that the approach works before full implementation investment.

---

## Out of Scope

- Obstacle rebalancing
- Food rebalancing
- Growth rebalancing
- Scoring changes
- HUD redesign
- Audio redesign
- New mechanics
- New progression systems
- WebGL or Canvas rendering
- Course generation changes (unless wrap empirical validation shows popping — then continuous course generation becomes in-scope as fallback)
- Per-cell interpolation
- Sub-pixel obstacle/food rendering
- Classic mode smoothing (classic Snake doesn't need it — zoomed view, slower pace)

---

## Milestone-Level Definition of Done

- [ ] Phase 1: Engine `getTickInterval()` implemented and tested; `getEffectiveSpeed()` refactored
- [ ] Phase 2: Board inner wrapper + CSS animation implemented and tested; Board.tsx inline grid moved to inner div
- [ ] Mid-Milestone Checkpoint: Hardcoded animation validated — game no longer appears to run at 5 FPS
- [ ] Phase 3: RunnerGame animation wiring implemented and tested (single useEffect, forced reflow restart)
- [ ] Phase 4: Edge cases handled (pause, gameover, classic mode, lane changes)
- [ ] Phase 5: Before/after recordings created and reviewed
- [ ] Phase 5: Frame-by-frame motion quality validation passes (continuous deltas)
- [ ] Phase 5: Wrap transition empirical validation passes (no visible popping)
- [ ] All 487+ existing tests pass with no regressions
- [ ] `npm run build` completes with no errors
- [ ] `npx tsc --noEmit` passes with no errors
- [ ] `npm run lint` passes with no new warnings
- [ ] Documentation updated (SPEC.md §20.14, ARCHITECTURE.md, PROJECT_STATE.md, ROADMAP.md)
- [ ] `package.json` version bumped to `0.14.1`
- [ ] AI review questions all answered YES
- [ ] Exit question ("Does the game still appear to run at 5 FPS?") answered NO

---

## File Change Summary

| File | Phase | Type |
|------|-------|------|
| `src/game/Engine.ts` | 1 | Add private `getEffectiveSpeed()`, public `getTickInterval()`; refactor `startLoop()` |
| `src/components/Board.tsx` | 2 | Remove inline grid from `.board`; add inner wrapper div as grid container; accept `animateViewport` and `innerRef` props |
| `src/components/Board.module.css` | 2 | Add `.boardInner`, `.boardAnimated`, `@keyframes viewportScroll`, `prefers-reduced-motion` media query |
| `src/types/components.ts` | 2 | Add `animateViewport?: boolean`, `innerRef?: React.Ref<HTMLDivElement>` to `BoardProps` |
| `src/components/RunnerGame.tsx` | 3 | Wire animation restart on tick (single useEffect), wrap detection, `--viewport-speed` from `getTickInterval()` |
| `src/hooks/useGame.ts` | 3 | Expose engine ref or `getTickInterval` to RunnerGame |
| `src/game/__tests__/Engine.test.ts` | 1 | 4-5 tests for `getTickInterval` and `getEffectiveSpeed` refactor regression |
| `src/components/__tests__/Board.test.tsx` | 2 | 4-5 tests for animation props, inner wrapper grid, snapshot regeneration |
| `src/components/__tests__/RunnerGame.test.tsx` | 3 | New test file (~5 tests) for animation wiring with mocked useGame/useTouch |
| `SPEC.md` | 5 | Add §20.14 "Smooth Viewport Scrolling" |
| `ARCHITECTURE.md` | 5 | New sub-section "Smooth Runner Motion" |
| `docs/PROJECT_STATE.md` | 5 | Mark M14.1 complete, version → 0.14.1 |
| `docs/ROADMAP.md` | 5 | Move M14.1 to completed |
| `package.json` | 5 | Bump version 0.13.1 → 0.14.1 |
| `.gitignore` | 5 | Add `docs/Milestone 14.1-validation/recordings/` entries |
| `docs/Milestone 14.1-validation/` | 5 | New directory + README.md for recordings |

**Estimated total LOC:** ~200-250 (100 code + 80 tests + 50-70 docs/config). This includes test scaffolding (mocks for useGame, useTouch, sharedSoundManager — ~30-50 LOC) and documentation updates (4 documents, 1-2 paragraphs each — ~50-100 LOC of markdown).
