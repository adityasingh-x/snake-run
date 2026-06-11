# Plan — Milestone 13.1: Visual Lane Redesign

**Status:** Approved
**PRD:** `docs/prd/PRD_M13_1.md`
**Depends On:** Milestone 13 (Runner Prototype Validation) ✅
**Blocks:** Milestone 13.5

---

## Executive Summary

Milestone 13.1 solves a single problem: **the player sees a 20x20 grid but is playing a 3-lane runner.** This mismatch creates confusion.

This milestone does NOT add gameplay, progression, or content. It aligns visual communication with gameplay reality by transforming the 20x20 grid into a clear 3-lane presentation. Success is measured by player comprehension, not fun.

**Target:** Within 5 seconds of seeing the game, a first-time player understands there are exactly 3 lanes, how to move between them, what to collect, and what to avoid.

---

## Scope

### In Scope
- Column-level CSS styling that highlights lane columns (x=4, 10, 16) and dims non-lane columns
- Active lane visual indicator (highlight on current lane column)
- Visible lane boundaries (implicit via dimmed gutters + explicit separator lines)
- Fix food spawning bug: runner-mode food respawn uses lane-aware spawning, not generic `spawnFood()`
- Remove the text-only lane indicator ("Lanes: Left | Center | Right")
- Update component props/types to carry runner context to Board/Cell
- Tests for all new behavior

### Non-Goals (from PRD)
- No powerups
- No achievements
- No missions
- No progression
- No unlockables
- No new food types
- No obstacle types
- No rebalancing scoring
- No changing growth mechanics
- No changing speed tuning
- No gameplay changes whatsoever

### Also Out of Scope
- Board scroll/camera effects (deferred to 13.5 or 14)
- RunnerHUD visual redesign (already adequate)
- RunnerGameOver redesign (already adequate)
- Course generation changes
- Any non-runner game mode changes

---

## Critical Requirements

These requirements are non-negotiable. The milestone fails if any are not met, regardless of implementation correctness.

### CR-1: Food must never spawn outside playable lanes

All food consumed in runner mode must respawn exclusively on lane columns (x ∈ {4, 10, 16}). Food spawning outside playable lanes causes unreachable food, ignored food, reduced growth, and invalid gameplay decisions.

**Validation:** Automated tests in `runnerCourse.test.ts` and `state.test.ts` must pass. Gameplay recording must show zero instances of food outside lane columns.

**Failure condition:** Any food visible outside playable lanes during a gameplay recording results in milestone failure.

### CR-2: The board must communicate runner gameplay within 5 seconds

A first-time viewer must identify there are 3 lanes, the current lane, food locations, and danger locations without instruction or explanation.

**Validation:** Evidence-based validation package (screenshots + gameplay recording) reviewed against 5 validation questions (see Phase 5 — Visual Outcome Validation).

**Failure condition:** If any of the 5 validation questions receives a "NO" answer, the milestone fails regardless of implementation correctness.

### CR-3: Classic mode rendering must be completely unchanged

No visual regression in the classic 20×20 Snake board. Every cell, border, food, obstacle, snake segment, and portal must render identically to v0.13.0.

**Validation:** Screenshot comparison between v0.13.0 and M13.1 classic mode. All 426+ existing tests must pass with no regressions.

**Failure condition:** Any visual difference in classic mode rendering results in milestone failure.

---

## Architecture Overview

### Approach: Pure CSS + Props, No Structural DOM Changes

The board keeps its 20×20 cell grid. Runner-aware CSS classes are applied column-by-column:
- **Lane columns (x=4, 10, 16)**: rendered at full visibility with visible borders
- **Non-lane columns**: dimmed to near-transparent, borders removed
- **Active lane column**: subtle background highlight
- **Lane separators**: visible vertical boundary at the start of each lane column

This is the simplest approach that satisfies the PRD. No DOM restructuring, no grid size changes, no new rendering passes. The existing Cell/Board architecture is reused with new optional props.

### Data Flow

```
RunnerGame → Board (isRunner=true, runnerLane=state.lane)
  → computes per-cell: isLaneColumn, isActiveLane
    → Cell (isLaneColumn, isActiveLane)
      → applies CSS classes: .nonLaneColumn / .activeLane
```

---

## Phase 1: Props & Data Flow

**Goal:** Add runner-context props to the Board/Cell type chain and pipe them through.

**Note:** Verify line numbers against the current file before editing. The estimates in this plan are accurate as of v0.13.0 but may drift after other changes.

### Files to Change

#### 1a. `src/types/components.ts` — Update CellProps and BoardProps

Add to `CellProps`:
```ts
isLaneColumn?: boolean;
isActiveLane?: boolean;
```

Add to `BoardProps`:
```ts
runnerLane?: 0 | 1 | 2;
```

Keep `isRunner` detection implicit — the Board can tell it's runner mode by whether `runnerLane` is defined. No separate `isRunner` boolean needed.

#### 1b. `src/utils/constants.ts` — Export RUNNER_LANE_X

Add `RUNNER_LANE_X` to the re-export list from `src/game/constants.ts`:
```ts
export {
  GRID_SIZE,
  POINTS_PER_FOOD,
  LEVEL_COUNT,
  INITIAL_SNAKE,
  DIRECTION_OPPOSITE,
  KEY_MAP,
  RUNNER_LANE_X,
} from '../game';
```

#### 1c. `src/components/Board.tsx` — Compute and pass lane context

Changes:
- Import `RUNNER_LANE_X` from `'../utils/constants'`
- Destructure `runnerLane` from props
- In the cell mapping loop, compute per-cell boolean flags:
  ```ts
  const isLaneColumn = runnerLane !== undefined && RUNNER_LANE_X.includes(x);
  const isActiveLane = isLaneColumn && x === RUNNER_LANE_X[runnerLane];
  ```
- Pass `isLaneColumn` and `isActiveLane` to each `<Cell />`

Update the Cell rendering block (line ~56-66) to include the new props.

#### 1d. `src/components/RunnerGame.tsx` — Pass runnerLane to Board

In the Board JSX (line ~93-98), add:
```tsx
runnerLane={state.lane}
```

The `isRunner` check is not needed as a separate prop — the board detects runner mode by `runnerLane !== undefined`.

#### 1e. `src/components/Cell.tsx` — Apply new CSS classes

After the existing `let className = styles.cell;` line and before the entity checks, add:
```tsx
if (isLaneColumn === false) {
  className += ` ${styles.nonLaneColumn}`;
} else if (isActiveLane) {
  className += ` ${styles.activeLane}`;
}
```

Critical: use `=== false` (not `!isLaneColumn`) so that classic mode (where `isLaneColumn` is `undefined`) does NOT get the `.nonLaneColumn` class. This ensures classic mode rendering is completely unchanged. No `.laneColumn` class is needed — lane columns inherit the base `.cell` border styling naturally.

### Verification — Phase 1
- [ ] `npm run lint` passes with no new errors
- [ ] TypeScript compiles (`npx tsc --noEmit`) with no new errors
- [ ] Existing Board.test.tsx (3 tests) still pass (props are optional)
- [ ] Existing Cell.test.tsx (9 tests) still pass (props are optional)
- [ ] All 426 existing tests still pass: `npm test -- --run`

### Risks — Phase 1
- **Low.** Props are optional. Classic mode is completely unaffected. The `=== false` guard on `nonLaneColumn` ensures only runner-mode cells get the dimmed class.

---

## Phase 2: CSS — Lane Visualization Styling

**Goal:** Apply visual styling that makes the 3-lane structure immediately obvious.

### Files to Change

#### 2a. `src/components/Cell.module.css` — Add lane styling classes

**Active Lane Visibility Requirement (outcome-based):** The current lane must be identifiable within one second of viewing the board. Implementation is flexible (background tint, glow, border, lane highlight, or combination). The visual result is mandatory; the exact styling values below are a recommended starting point that may need tuning to satisfy the requirement.

Add after existing `.cell` block:

```css
/* Lane visualization (runner mode) */
.nonLaneColumn {
  border: none;
  background: transparent;
}

.activeLane {
  background: rgba(34, 197, 94, 0.08);
  box-shadow: inset 0 0 8px rgba(34, 197, 94, 0.15);
}
```

Design rationale:
- `.nonLaneColumn`: No border, transparent background — these cells blend into the board background, visually disappearing
- `.activeLane`: Subtle green-tinted background + inner glow — recommended starting point. If the active lane is not identifiable within 1 second, increase opacity, add a stronger border, or layer multiple visual cues until the requirement is met.
- Lane columns (x=4, 10, 16) inherit the base `.cell` border styling naturally — no separate `.laneColumn` class needed

These colors use numeric rgba values that match the existing `--color-accent` hex (#22c55e) from `index.css`. The project does not currently have `-rgb` channel variables; this is acceptable for M13.1. Future token work (M14+) may add `--color-accent-rgb` for cleaner alpha-channel usage.

#### 2b. `src/components/RunnerGame.module.css` — Remove text lane indicator, add lane separator hint

Replace the existing `.laneIndicator` class:
```css
/* REMOVE the entire .laneIndicator ruleset */
```

Remove the JSX text "Lanes: Left | Center | Right" from `RunnerGame.tsx` (see Phase 4).

#### 2c. `src/components/Board.module.css` — Add data-runner attribute styling

Add after the `.board[data-wrap-around="true"]` rule:
```css
.board[data-runner="true"] {
  /* Distinct border to reinforce "this is a runner" at a glance */
  border: 2px solid var(--color-accent);
}
```

In `Board.tsx`, add `data-runner={runnerLane !== undefined ? 'true' : undefined}` to the board div's attributes.

In the same file, update the board's `aria-label` to distinguish runner mode:
```tsx
aria-label={runnerLane !== undefined ? "Snake Run runner board — 3 lanes" : "Snake Run board"}
```

This addresses the PRD §17 accessibility requirement that lane structure be communicated to assistive technology.

### Verification — Phase 2
- [ ] Build completes: `npm run build`
- [ ] Visual review: Classic mode board looks identical to before
- [ ] Visual review: Runner mode shows 3 visible lane columns, dimmed non-lane columns, and accent-colored board border
- [ ] Visual review: Current lane shows subtle green highlight
- [ ] Existing tests pass: `npm test -- --run`

### Risks — Phase 2
- **Low.** CSS-only change. If the dimming is too aggressive (player can't see the board edges), the `.nonLaneColumn` opacity can be adjusted by tuning the `border` and `background` values.
- Classic mode is unaffected because the CSS classes are only applied when `isLaneColumn` is `true` or `false` (not `undefined`).

---

## Phase 3: Fix Food Spawning Bug

**Goal:** Food eaten during runner mode respawns exclusively on lane columns (x=4, 10, 16).

### Problem

In `src/game/state.ts`, the runner branch of `MOVE_SNAKE` (line 131) calls `spawnFood(newSnake, newObstacles, [], 'normal')` when food is eaten. The generic `spawnFood()` places food anywhere on the 20×20 grid, which violates the PRD rule: "All entities must belong to one lane."

The course generator (`generateRunnerCourse`) correctly uses `spawnRunnerFood()` which only selects lane positions. But mid-game food respawn (after eating) uses the generic spawner.

### Files to Change

#### 3a. `src/game/runnerCourse.ts` — Export `spawnRunnerFood`

**Prerequisite:** `spawnRunnerFood` is currently a private function (line 29). It must be exported before `state.ts` can import it.

Change:
```ts
function spawnRunnerFood(
```
to:
```ts
export function spawnRunnerFood(
```

#### 3b. `src/game/state.ts` — Use lane-aware food spawning in runner mode

In the runner branch of `MOVE_SNAKE`, line 131:
```ts
// Current (buggy):
newFood = spawnFood(newSnake, newObstacles, [], 'normal');

// Fix:
newFood = spawnRunnerFood(newSnake, newObstacles, newHead.y);
```

Import `spawnRunnerFood` from `'../runnerCourse'` (add to existing `import { generateRunnerCourse } from './runnerCourse'` line).

This ensures respawned food:
- Is always on a lane column (x ∈ {4, 10, 16})
- Is not placed on an obstacle or snake body
- Is at least 3 rows away from the head

#### 3c. `src/game/__tests__/runnerCourse.test.ts` — Add lane-constraint test for spawnRunnerFood (NEW FILE)

Create this file with at least one test for `spawnRunnerFood`'s core invariant:

```ts
import { describe, it, expect } from 'vitest';
import { spawnRunnerFood } from '../runnerCourse';
import { RUNNER_LANE_X } from '../constants';

describe('spawnRunnerFood', () => {
  it('always spawns food on a lane column (x in RUNNER_LANE_X)', () => {
    for (let i = 0; i < 100; i++) {
      const food = spawnRunnerFood([], [], 10);
      expect(RUNNER_LANE_X).toContain(food.position.x);
    }
  });
});
```

#### 3d. `src/game/__tests__/state.test.ts` — Add food spawning lane constraint test

Add a test that verifies runner-mode food respawn always lands on a lane column:

```ts
describe('Runner mode food spawning', () => {
  it('spawns food only on lane columns when food is eaten', () => {
    const state = gameReducer(makeState({
      isRunner: true,
      status: 'playing',
      snake: [
        { x: 10, y: 10 },
        { x: 10, y: 11 },
        { x: 10, y: 12 },
      ],
      food: { position: { x: 10, y: 9 }, type: 'normal', timer: -1 },
      obstacles: [],
      lane: 1,
      direction: 'UP',
      nextDirection: 'UP',
    }), { type: 'MOVE_SNAKE' });

    // Food position must be on a lane column
    expect([4, 10, 16]).toContain(state.food.position.x);
  });
});
```

### Verification — Phase 3
- [ ] New tests pass: `npm test -- --run`
- [ ] All existing tests pass
- [ ] `npm run lint` clean

### Risks — Phase 3
- **Low.** The fix calls `spawnRunnerFood`, which now has its own regression test (`runnerCourse.test.ts`). The new food position is guaranteed to be on a lane column. Edge case: if `spawnRunnerFood` returns the fallback `{ x: RUNNER_LANE_X[1], y: 10 }`, the food may overlap the snake if head is near y=10 — but that's already handled by the `positionsEqual` check in `spawnRunnerFood`.

---

## Phase 4: Remove Text Lane Indicator

**Goal:** The "Lanes: Left | Center | Right" text under the board is no longer needed since the board itself now communicates lanes.

### Files to Change

#### 4a. `src/components/RunnerGame.tsx`

Remove lines 101-105:
```tsx
{/* REMOVE THIS BLOCK */}
{isPlaying && (
  <div className={styles.laneIndicator}>
    Lanes: Left | Center | Right
  </div>
)}
```

#### 4b. `src/components/RunnerGame.module.css`

Remove the `.laneIndicator` ruleset (lines 44-49) since it's no longer used. Or keep it (harmless) but clean up unused CSS.

### Verification — Phase 4
- [ ] Runner mode no longer shows text lane indicator below board
- [ ] `npm run build` completes without CSS warnings
- [ ] `npm run lint` clean

---

## Phase 5: Testing & Validation

**Goal:** Verify all changes work end-to-end and no regressions exist.

### Automated Tests

#### 5a. `src/components/__tests__/Cell.test.tsx` — Add runner lane tests

Add tests:
```ts
describe('Cell — runner lane styling', () => {
  it('applies nonLaneColumn class for non-lane columns', () => {
    render(<Cell x={0} y={0} isSnakeHead={false} isSnakeBody={false}
      foodType={undefined} isObstacle={false} isLaneColumn={false} />);
    expect(screen.getByRole('gridcell').className).toContain('nonLaneColumn');
  });

  it('applies activeLane class when isActiveLane is true', () => {
    render(<Cell x={10} y={0} isSnakeHead={false} isSnakeBody={false}
      foodType={undefined} isObstacle={false} isLaneColumn={true} isActiveLane={true} />);
    expect(screen.getByRole('gridcell').className).toContain('activeLane');
  });

  it('does not apply nonLaneColumn when isLaneColumn is undefined (classic mode)', () => {
    render(<Cell x={0} y={0} isSnakeHead={false} isSnakeBody={false}
      foodType={undefined} isObstacle={false} />);
    const cell = screen.getByRole('gridcell');
    expect(cell.className).not.toContain('nonLaneColumn');
  });
});
```

#### 5b. `src/components/__tests__/Board.test.tsx` — Add runner board tests

Add tests:
```ts
describe('Board — runner mode', () => {
  it('renders 400 cells in runner mode', () => {
    render(<Board {...defaultProps} runnerLane={1} />);
    expect(screen.getAllByRole('gridcell').length).toBe(400);
  });

  it('sets data-runner attribute in runner mode', () => {
    render(<Board {...defaultProps} runnerLane={1} />);
    const board = screen.getByRole('grid');
    expect(board.getAttribute('data-runner')).toBe('true');
  });

  it('does not set data-runner attribute in classic mode', () => {
    render(<Board {...defaultProps} />);
    const board = screen.getByRole('grid');
    expect(board.hasAttribute('data-runner')).toBe(false);
  });
});
```

### Visual Outcome Validation

The automated tests validate implementation correctness (CSS classes, props, food positions). However, the primary success criterion for M13.1 is visual: the board must communicate runner gameplay. Validation that only checks code correctness is insufficient.

**Evidence-based validation package:**

Collect the following evidence after implementation:

1. **Screenshot A** — Game start (active lane visible, 3 lanes visible, board at rest)
2. **Screenshot B** — Mid-run with food visible on lane columns
3. **Screenshot C** — Mid-run with obstacles visible
4. **Screenshot D** — Active lane highlight clearly visible
5. **Screenshot E** — Classic mode board (must be identical to v0.13.0)
6. **Gameplay recording** — 30-second clip showing food collection, lane switching, and obstacle avoidance

**5 validation questions (project owner review):**

1. Can I immediately identify three lanes?
2. Can I identify the current lane?
3. Can I identify food locations?
4. Can I identify danger locations?
5. Does the board communicate runner gameplay (not "Snake board with styling")?

All 5 answers must be YES. If any answer is NO, the milestone fails regardless of implementation correctness — iterate on CSS until the visual outcome meets the requirement.

**Screenshot-based AI review (recommended):**

An AI review agent evaluates screenshots A–E and answers:

1. Are three distinct lanes clearly communicated?
2. Is the active lane clearly distinguishable from other lanes?
3. Are food items visually legible against the board background?
4. Are obstacle positions visually legible?
5. Does the board more closely resemble a Snake board than a runner track?

The AI agent provides a pass/fail verdict. This is a secondary validation layer; the project owner's review is authoritative.

**Failure condition:** If screenshots still primarily resemble a traditional Snake board rather than a runner track, the milestone fails regardless of automated test results.

### Full Test Suite

```bash
npm test -- --run
```

Expected: All tests pass with no regressions. Baseline is 426 tests across 26 test files (verified via `npm test -- --run`). New tests from this milestone (runnerCourse.test.ts, Cell lane tests, Board runner tests, state lane test) will increase the count.

**Note:** The pre-existing `state.test.ts` gold-food-timer flakiness (PROJECT_STATE.md §Known Technical Debt) is unaffected by M13.1 — the new test uses `'normal'` food with `timer: -1`.

### Build Check

```bash
npm run build
```

Expected: Build completes with no errors.

### Lint Check

```bash
npm run lint
```

Expected: No new warnings or errors.

### Verification — Phase 5
- [ ] `npm test -- --run` passes all tests
- [ ] `npm run build` completes clean
- [ ] `npm run lint` passes clean
- [ ] `npx tsc --noEmit` passes clean

---

## Phase 6: Documentation Update

**Goal:** Update all relevant documentation to reflect the M13.1 changes.

**Sequencing note:** Documentation updates should follow validation (Phase 5). Implement → review → verify screenshots → verify gameplay recordings → update documentation. This reduces documentation drift if implementation requires iteration.

### Files to Change

#### 6a. `SPEC.md` — Update §20.2 Lane System and §20.5 HUD

Add to §20.2 (Lane System):
> **Lane visualization:** In runner mode, the 20×20 grid is visually transformed into a 3-lane presentation. Lane columns (x=4, 10, 16) are rendered at full visibility. Non-lane columns are dimmed to near-transparent. The active lane shows a subtle green background highlight. This replaces the previous text-only "Lanes: Left | Center | Right" indicator.

Update §20.5 (HUD):
> The `RunnerHUD` component displays: Distance, Food eaten, Snake length, High score (Best). Lane structure is communicated visually on the board rather than via text.

#### 6b. `ARCHITECTURE.md` — Update component list

Under "Key Features" or the runner section, add:
> **Runner lane visualization:** The Board and Cell components accept optional `runnerLane`, `isLaneColumn`, and `isActiveLane` props. When these are provided, CSS classes transform the grid into a 3-lane visual presentation without changing the underlying 20×20 grid structure.

Update `BoardProps` — add `runnerLane?: number` to the prop list.

#### 6c. `docs/PROJECT_STATE.md` — Add M13.1 to completed features

Update:
- Version to `v0.13.1`
- Add entry under "In Progress" or "Completed Features" depending on timing:
> **Milestone 13.1 — Visual Lane Redesign (complete/current)**
> - Lane columns (x=4, 10, 16) visually highlighted; non-lane columns dimmed
> - Active lane indicator with subtle green background
> - Food spawning constrained to lane columns in runner mode
> - Removed text lane indicator in favor of visual lane presentation
> - N tests passing

#### 6d. `docs/ROADMAP.md` — Update milestone sequence

Mark 13.1 as complete in the sequence, update Current Progress section.

### Verification — Phase 6
- [ ] SPEC.md updated with lane visualization details
- [ ] ARCHITECTURE.md updated with new props and lane visualization feature
- [ ] PROJECT_STATE.md version bumped to 0.13.1
- [ ] ROADMAP.md M13.1 marked as complete
- [ ] No contradictions between documentation files

---

## Risk Register

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Non-lane dimming too aggressive — board looks broken | Low | Medium | CSS values are conservative (`transparent` background, border removal). Can be tuned post-implementation. |
| Classic mode rendering affected by new CSS | Low | High | `isLaneColumn` defaults to `undefined`. Only `true`/`false` triggers runner CSS. Classic mode is completely bypassed. |
| 400-cell grid performance regression | Low | Low | CSS-only change, no new DOM nodes. No measurable performance impact. |
| `spawnRunnerFood` not exported — import fails at compile time | Low | High | Addressed by Phase 3a prerequisite: export the function before importing it. |
| Player still doesn't understand lanes after visual redesign | Medium | High | This is the core validation risk of the milestone. Mitigated by the evidence-based validation package (Phase 5 — Visual Outcome Validation: 5 screenshots + gameplay recording, 5 validation questions, all must be YES). If validation fails, iterate on CSS until visual comprehension is achieved. |

---

## Definition of Done

- [ ] **CR-1:** Food always spawns on a lane column in runner mode (`spawnRunnerFood` exported, `runnerCourse.test.ts` passes, gameplay recording shows zero out-of-lane food)
- [ ] **CR-2:** Board communicates runner gameplay — all 5 visual validation questions are YES (Phase 5 — Visual Outcome Validation)
- [ ] **CR-3:** Classic level-based game rendering is completely unchanged (screenshot comparison clean, all 426+ tests pass)
- [ ] Runner mode board visually communicates 3 lanes (lane columns visible, non-lane dimmed)
- [ ] Active lane is identifiable within 1 second of viewing the board
- [ ] Text "Lanes: Left | Center | Right" removed
- [ ] All tests pass (`npm test -- --run`) — verify baseline count before starting
- [ ] Build clean (`npm run build`)
- [ ] Lint clean (`npm run lint`)
- [ ] TypeScript clean (`npx tsc --noEmit`)
- [ ] Evidence-based validation package complete (5 screenshots + gameplay recording)
- [ ] SPEC.md updated with lane visualization details
- [ ] ARCHITECTURE.md updated with new props
- [ ] PROJECT_STATE.md updated (version 0.13.1, M13.1 entry)
- [ ] ROADMAP.md updated (M13.1 marked complete)
- [ ] No documentation inconsistencies

---

## Handoff Notes

### For the implementer:

1. **Current test count**: Run `npm test -- --run` before starting to verify the baseline (426 as of v0.13.0). Update the DoD test count accordingly if it has changed.

2. **RUNNER_LANE_X import**: The `Board.tsx` currently imports from `utils/constants`. Add `RUNNER_LANE_X` to the re-export list in `utils/constants.ts` (Phase 1b), then import it in `Board.tsx`.

3. **The `=== false` guard**: In `Cell.tsx`, the `nonLaneColumn` check MUST use `isLaneColumn === false`, not `!isLaneColumn`. This prevents classic mode cells (where `isLaneColumn` is `undefined`) from getting the dimmed styling. Lane columns inherit the base `.cell` border styling naturally — no `.laneColumn` class is needed.

4. **CSS values can be tuned**: The `.nonLaneColumn` and `.activeLane` hex/rgba values in Phase 2 are starting points. If visual review shows the lanes aren't distinct enough, increase the active lane opacity or add a stronger border to lane columns.

5. **No `.laneIndicator` cleanup**: If removing the `.laneIndicator` CSS class from RunnerGame.module.css causes build warnings about unused CSS, leave the class in place (it's harmless).

6. **Pre-existing test flakiness**: The known `state.test.ts` gold-food-timer flakiness (PROJECT_STATE.md §Known Technical Debt) is unaffected by these changes. The runner only uses `'normal'` food type.

7. **spawnRunnerFood import**: In `state.ts`, add `spawnRunnerFood` to the existing import from `'./runnerCourse'` (alongside `generateRunnerCourse`). The function must be exported first (Phase 3a prerequisite).
