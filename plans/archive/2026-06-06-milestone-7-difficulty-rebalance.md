# Active Plan: Milestone 7 — Difficulty Rebalance

**Status:** Draft
**Created:** 2026-06-06
**Scope:** Food objective system + speed curve rebalance

---

## Overview

### Goal

Create longer and more meaningful gameplay sessions by replacing score-based level progression with a food-objective system and rebalancing the speed curve.

### Problem Statement

Current levels are too short (5 food per level). Difficulty relies too heavily on aggressive speed increases (150ms → 60ms), making later levels feel unfair rather than challenging.

### Success Criteria

- Levels last longer (10–30 food per level vs current 5)
- Mobile remains playable at all speeds (minimum 100ms, not 60ms)
- Difficulty feels fair — challenge comes from obstacle layouts, not reaction-time limits

---

## Changes Summary

### What Changes

| Area | Current | New |
|------|---------|-----|
| Level progression | Score-based (`score >= targetScore`) | Food-based (`foodEaten >= foodRequired`) |
| Level data field | `targetScore: number` | `foodRequired: number` |
| GameState | No food tracking | `foodEaten: number` (per-level counter) |
| Speed curve | 150ms → 60ms (`150 - (level-1)*10`) | 150ms → 100ms (see table below) |
| ScoreBoard | Level / Score / High Score | + Food progress |

### What Does NOT Change

- Score still accumulates (10 pts per food, used for high score)
- Score still carries over between levels
- Two-step level transition (levelComplete → Continue) remains identical
- Snake resets to 3-segment initial on CONTINUE_GAME and START_AT_LEVEL
- Obstacle layouts, level names, descriptions — all unchanged
- Sound effects and triggers — all unchanged
- All overlay components (GameOver, LevelTransition) — unchanged
- No new packages, abstractions, or architectural patterns

### New Food Requirements per Level

| Level | Food Required |
|-------|--------------|
| 1     | 10           |
| 2     | 12           |
| 3     | 14           |
| 4     | 16           |
| 5     | 18           |
| 6     | 20           |
| 7     | 22           |
| 8     | 24           |
| 9     | 26           |
| 10    | 30           |

### New Speed Values per Level

| Level | Speed (ms) |
|-------|------------|
| 1     | 150        |
| 2     | 140        |
| 3     | 130        |
| 4     | 120        |
| 5     | 115        |
| 6     | 110        |
| 7     | 110        |
| 8     | 105        |
| 9     | 105        |
| 10    | 100        |

---

## Phase 1: Type and Data Changes

**Goal:** Update type definitions and level data to support food-objective progression. This phase breaks the build — Phase 2 restores it.

### Files

- `src/game/types.ts`
- `src/game/levels.ts`

### Steps

#### 1a. Update `Level` interface (`src/game/types.ts:10–17`)

- Rename `targetScore: number` → `foodRequired: number`

#### 1b. Add `foodEaten` to `GameState` (`src/game/types.ts:19–30`)

- Add `foodEaten: number` field

#### 1c. Update all 10 level definitions (`src/game/levels.ts:4–132`)

- Rename `targetScore` → `foodRequired` with new values (table above)
- Update `speed` to new values (table above)

### Verification

- `npm run build` — expected to FAIL with type errors (other files still reference `targetScore`). This confirms Phase 1 changed the data layer correctly.
- Visual review of `levels.ts` — verify all 10 levels have correct `foodRequired` and `speed` values matching the tables above.

---

## Phase 2: State Machine Changes

**Goal:** Update the game reducer to use food-objective progression. Build should pass after this phase.

### Files

- `src/game/state.ts`

### Steps

#### 2a. Initialize `foodEaten` in `getInitialState()` (`src/game/state.ts:9–24`)

Add `foodEaten: 0` to the returned state object.

#### 2b. Update `MOVE_SNAKE` case (`src/game/state.ts:56–104`)

Add after `const newScore = ...` (line 68):
```ts
const newFoodEaten = ateFood ? state.foodEaten + 1 : state.foodEaten;
```

Change `shouldLevelUp` (line 71) from:
```ts
const shouldLevelUp = ateFood && newScore >= currentConfig.targetScore;
```
to:
```ts
const shouldLevelUp = ateFood && newFoodEaten >= currentConfig.foodRequired;
```

Add `foodEaten: newFoodEaten` to all three return objects in the `MOVE_SNAKE` case:
- Won return (lines 75–83)
- LevelComplete return (lines 86–94)
- Normal return (lines 97–103)

#### 2c. Reset `foodEaten` in `CONTINUE_GAME` (`src/game/state.ts:106–125`)

Add `foodEaten: 0` to the return object.

#### 2d. Reset `foodEaten` in `START_AT_LEVEL` (`src/game/state.ts:127–142`)

Add `foodEaten: 0` to the return object.

#### 2e. `START_GAME` / `RESET` already call `getInitialState()` (line 39)

No change needed — `getInitialState()` now returns `foodEaten: 0`.

### Verification

- `npm run build` — must succeed with zero errors.
- `npm run lint` — must pass.
- `npm test` — expect many failures (tests still reference old `targetScore` values). The new reducer logic is correct if:
  - Level-up triggers when `foodEaten >= foodRequired` (not when `score >= targetScore`)
  - `foodEaten` resets on `CONTINUE_GAME` and `START_AT_LEVEL`
  - `foodEaten` increments on food eat

---

## Phase 3: Engine Review

**Goal:** Confirm the Engine requires zero changes.

### Analysis

The Engine (`src/game/Engine.ts`) dynamically reads speed from `getLevelData(state.level).speed` every tick (line 135–136). The new speed values take effect automatically.

The Engine's `dispatch()` checks `score > prevScore` for eat sound and `level > prevLevel` for level-up sound. These conditions remain correct — score still increases on eat, level still increases on continue.

The `lastUnlockedLevel` persistence logic (M6) uses the same `levelComplete`/`gameover`/`won` statuses — unchanged.

### Verification

- Manual play-test: eat sounds, level-up sounds, and collision sounds play correctly.
- `lastUnlockedLevel` is still persisted on levelComplete, gameover, and won transitions.

---

## Phase 4: UI Updates

**Goal:** Display food progress in the ScoreBoard HUD.

### Files

- `src/types/components.ts`
- `src/components/ScoreBoard.tsx`
- `src/components/ScoreBoard.module.css`
- `src/components/Game.tsx`

### Steps

#### 4a. Extend `ScoreBoardProps` (`src/types/components.ts:20–25`)

Add:
```ts
foodEaten: number;
foodRequired: number;
```

#### 4b. Add food progress to ScoreBoard (`src/components/ScoreBoard.tsx`)

Destructure `foodEaten` and `foodRequired` from props. Add a row between Level and Score:
```tsx
<div className={styles.foodProgress}>
  <span className={styles.label}>Food:</span>
  <span className={styles.value}>{foodEaten}/{foodRequired}</span>
</div>
```

Update the screen-reader-only text at `ScoreBoard.tsx:21-24` to include food progress, mirroring the existing `score > 0` guard pattern:
```tsx
{score > 0 && `Score: ${score}. `}{foodEaten > 0 && `Food: ${foodEaten} of ${foodRequired}. `}Level {level}.
```

#### 4c. Add CSS for food progress (`src/components/ScoreBoard.module.css`)

Add a `.foodProgress` style matching the existing `.score` style.

#### 4d. Pass foodEaten/foodRequired from Game.tsx (`src/components/Game.tsx:153`)

Read `foodRequired` from `getLevelData(state.level).foodRequired`. Pass both `foodEaten={state.foodEaten}` and `foodRequired={foodRequired}` to `<ScoreBoard>`.

### Verification

- `npm run build` — must succeed.
- `npm run lint` — must pass.
- Visual check: ScoreBoard shows "Food: 0/10" during gameplay. Count increments on eating. Resets on level transition.

---

## Phase 5: Test Updates

**Goal:** Update all tests to reflect new data and progression logic. All tests must pass.

### Files

- `src/game/__tests__/state.test.ts`
- `src/utils/__tests__/levelData.test.ts`
- `src/game/__tests__/Engine.test.ts`

### Steps

#### 5a. Update `levelData.test.ts`

- Replace all `targetScore` assertions with `foodRequired`
- Update speed value assertions to match new speed table
- Verify that foodRequired and speed values match the tables in this plan for all 10 levels
- Existing layout validity tests should pass unchanged

Note: `src/utils/levelData.ts` is a one-line re-export of `src/game/levels.ts`. The test at `src/utils/__tests__/levelData.test.ts` imports from this re-export, so the Phase 1 data-layer changes propagate transparently. The test assertions in this file must still be updated for the renamed field and new values.

#### 5b. Update `state.test.ts`

Add `foodEaten: 0` to the `makeState` factory at `src/game/__tests__/state.test.ts:6-24`. This is required to satisfy the new `GameState` type and is the single change that makes 24+ existing tests compile.

For each test that triggers a level-up:
- Replace score-based setup (e.g., setting score to `targetScore - 1`) with foodEaten-based setup (e.g., setting `foodEaten` to `foodRequired - 1`)
- Update test assertions: the `shouldLevelUp` condition now checks `foodEaten >= foodRequired`
- Verify that `foodEaten: 0` is present in the state after `START_GAME`, `RESET`, `CONTINUE_GAME`, and `START_AT_LEVEL`
- Add test: `foodEaten` increments by 1 when food is eaten
- Add test: levelComplete fires when `foodEaten` reaches `foodRequired`, not based on score
- Add test: `foodEaten` resets on `CONTINUE_GAME`
- Add test: `foodEaten` resets on `START_AT_LEVEL`

Key test cases to update (approximate line ranges from the existing 43 tests):
- Tests that check `initial state` shape — add `foodEaten: 0`
- Tests that trigger `levelComplete` by reaching targetScore — change to reaching foodRequired via foodEaten
- Tests that trigger `won` — update the two won test cases at `state.test.ts:245-260` and `:262-277` to set `foodEaten: 29` (one food away from level 10's `foodRequired: 30`) and `score: 290` instead of `score: 490`
- Tests that verify `CONTINUE_GAME` state shape — add `foodEaten: 0`
- Tests that verify `START_AT_LEVEL` state shape — add `foodEaten: 0`
- Tests that verify `lastUnlockedLevel` accumulation — update the multi-step accumulator test at `state.test.ts:461-480` to set `foodEaten: 9` and `score: 90` (instead of `score: 40`) so the first `MOVE_SNAKE` triggers `levelComplete`

#### 5c. Update `Engine.test.ts`

`Engine.test.ts` has the same test-setup pattern as `state.test.ts`. Specific test blocks that need updating:

- **`lastUnlockedLevel persistence` describe block (`Engine.test.ts:243-301`):** Replace score-based setups with foodEaten-based setups. For `levelComplete` at level 1, set `foodEaten: 9` and `score: 90` (one food away from `foodRequired: 10`). For `won` at level 10, set `foodEaten: 29` and `score: 290`. For `gameover`, the existing setup is unaffected because the collision path is independent of `foodEaten`.
- **`continueGame` describe block (`Engine.test.ts:165-207`):** Unaffected — it sets `status: 'levelComplete'` directly via `setState` and bypasses the reducer's level-up trigger. The `setState` calls at `Engine.test.ts:187-191` and `:218-223` use `...getInitialState()` and are automatically covered by the Phase 2a `getInitialState()` change.
- **`startAtLevel` describe block (`Engine.test.ts:209-241`):** Unaffected — does not trigger level-up.
- **`sound callback wiring` describe block (`Engine.test.ts:109-163`):** Unaffected.
- Tests that verify speed behavior may need speed value updates if they assert specific tick timing.

### Verification

- `npm test` — all tests pass. Expected test count: 173+ (same or slightly more due to new foodEaten tests).
- `npm run build` — succeeds.
- `npm run lint` — passes.

---

## Phase 6: Documentation Updates

**Goal:** Keep SPEC.md, ARCHITECTURE.md, PROJECT_STATE.md, and ROADMAP.md consistent.

### Files

- `SPEC.md`
- `ARCHITECTURE.md`
- `docs/PROJECT_STATE.md`
- `docs/ROADMAP.md`
- `package.json`

### Steps

#### 6a. Update `SPEC.md`

- **Section 4 (Game Loop, lines 53–59):** Replace the formula-based speed description with the explicit speed table (from this plan). Remove the `150 - (level-1)*10` formula reference.
- **Section 6.1 (Scoring, lines 87–90):** Keep as-is (score still works the same way).
- **Section 6.2 (Level Progression, lines 92–117):** Replace score-based target with food-objective system:
  - Remove "Target score per level: `level * 50`"
  - Add "Food required per level" table
  - Update level-up trigger: `foodEaten >= foodRequired` instead of `score >= targetScore`
  - Remove "Score carries over" from level-up behavior (still carries over but no longer drives progression)
- **Section 6.3 (Level Metadata, lines 119–136):** Update `Level` interface example: `targetScore` → `foodRequired`
- **Section 6.4 (Win Condition, lines 139–144):** Replace `LEVEL_COUNT * 50` with "When the level 10 food objective is reached (30 food eaten at level 10)". The status-change and high-score-save behavior is unchanged.
- **Section 10.4 (ScoreBoard, lines 278–285):** Add food progress display to the component description.
- **Section 13 (Environment Configuration, lines 348–359):** Note that `VITE_POINTS_PER_FOOD` is now for scoring only, not progression.

#### 6b. Update `ARCHITECTURE.md`

- **State Shape diagram (line 231–243):** Add `foodEaten: number` field.
- **Game Loop Pattern section (line 110):** Replace "150ms → 60ms" with "150ms → 100ms" in the "Dynamic speed based on current level" bullet.
- **Level System description (line 150–155):** Update "Progression: target score = 50 x level number" to "Progression: food-objective system (10–30 food per level)."
- **Speed ramp description (line 154):** Replace "150ms → 60ms (10ms per level)" with "150ms → 100ms (see SPEC.md for full table)."
- **State Machine diagram (lines 209–210):** Replace `SCORE REACHES TARGET (levels 1-9) → LEVELCOMPLETE` with `FOOD OBJECTIVE REACHED (levels 1-9) → LEVELCOMPLETE`. Replace `LEVEL 10 COMPLETE → WON` with `FOOD OBJECTIVE REACHED (level 10) → WON`.
- **Important Constants table (lines 249–256):** Remove `MIN_SPEED: 60ms` (minimum is now 100ms). The speed is now data-driven per level, not formula-driven.
- **Test count (line 251):** Update to reflect the new total after Phase 5.

#### 6c. Update `docs/PROJECT_STATE.md`

- Update version to `v0.7.0`
- Update "Current Status" to reflect M7 completion
- Update "Current Priorities" to next milestone (M8 — Visual Identity)
- Move M7 items from "In Progress" to "Completed Features" with a new "Difficulty Rebalance (Milestone 7)" section

#### 6d. Update `docs/ROADMAP.md`

- Move Milestone 7 from "Not Started" to "Completed" section
- Add completion date (2026-06-06)
- Update Current Progress section

#### 6e. Bump `package.json` version

- Change `"version": "0.6.0"` to `"version": "0.7.0"`

### Verification

- All documentation files are internally consistent
- No contradictory statements between SPEC.md, ARCHITECTURE.md, PROJECT_STATE.md, and ROADMAP.md
- `git diff` review of all documentation changes

---

## Risks and Assumptions

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Level 1 feels too slow (10 food vs 5) | Medium | Low | This is intentional — the roadmap explicitly targets longer sessions. Can be rebalanced later if needed. |
| Players confused why score doesn't trigger level-up | Low | Medium | Food progress display in ScoreBoard makes progression visible. Score remains for high score tracking only. |
| Speed 100ms at Level 10 may still feel too easy | Low | Low | Difficulty should come from layouts, not speed. This is the design intent. Can tune if playtesting reveals issues. |
| Test updates miss edge cases | Medium | Medium | Phase 5 verification: `npm test` must pass with all tests. Manual review of test changes against the food-objective logic. |
| `VITE_POINTS_PER_FOOD` env var meaning changes | Low | Low | Its value (10) is unchanged. It now only affects scoring, not progression. Documented in SPEC.md update. |

### Assumptions

1. Score continues to accumulate across levels (for high score tracking) independently of the per-level `foodEaten` counter.
2. The two-step level transition (levelComplete → Continue) remains the same UX pattern — only the trigger condition changes.
3. Obstacle layouts and level names remain unchanged — they were already finalized in M5.
4. Sound effects (eat, level-up, collision) remain triggered by the same conditions (score increase, level increase, gameover status) — these conditions are unaffected.
5. The `lastUnlockedLevel` persistence from M6 continues to work — it uses the same status transitions that are unchanged.

---

## Out of Scope

The following are explicitly excluded from this milestone:

- **Difficulty selection or settings UI** — levels are sequential only
- **HUD redesign** — belongs in Milestone 8 (Visual Identity)
- **Overlay redesign** — belongs in Milestone 8
- **Endless mode** — belongs in Milestone 9
- **Food variants** (gold, poison, speed food) — belongs in Milestone 10
- **New level mechanics** (wrap-around, portals, moving obstacles) — belongs in Milestone 10
- **Statistics tracking** — belongs in Milestone 9
- **Achievements** — belongs in Milestone 9
- **Playtesting and feedback** — belongs in Milestone 11
- **Obstacle layout changes** — current layouts were finalized in M5
- **Score formula changes** — points per food remains 10
- **Grid size changes** — remains 20x20
- **Mobile app packaging** — belongs in Milestone 13
- **Desktop packaging** — belongs in Milestone 14

---

## Definition of Done

Milestone 7 is complete when:

1. Level progression uses food-objective system (`foodEaten >= foodRequired`) instead of score-based system (`score >= targetScore`)
2. All 10 levels have correct `foodRequired` values (10, 12, 14, 16, 18, 20, 22, 24, 26, 30)
3. All 10 levels have rebalanced `speed` values (150, 140, 130, 120, 115, 110, 110, 105, 105, 100)
4. `foodEaten` field is present in GameState, increments on food eat, resets on CONTINUE_GAME and START_AT_LEVEL
5. ScoreBoard displays food progress (`Food: X/Y`)
6. `npm run lint` passes with zero errors
7. `npm run build` completes with zero TypeScript errors
8. `npm test` passes with all tests (173+ tests)
9. No new architectural abstractions, packages, or framework additions introduced. Existing state machine shape preserved; one new state field (`foodEaten`) added and two data fields renamed (`targetScore` → `foodRequired`).
10. SPEC.md, ARCHITECTURE.md, PROJECT_STATE.md, and ROADMAP.md are updated and consistent with the implementation
11. `package.json` version bumped to `0.7.0`
