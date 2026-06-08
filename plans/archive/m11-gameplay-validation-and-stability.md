# Milestone 11 — Gameplay Validation & Stability

**Status:** Plan  
**Milestone:** 11  
**Target:** Guarantee all gameplay systems are correct, stable, completable, and free of progression blockers

---

## Current State

259 unit tests across 17 test files exist. Existing validation covers:

- Obstacle bounds and uniqueness (all 10 levels)
- Snake spawn does not overlap obstacles
- At least 2 of 3 first-tick directions are survivable
- Portal metadata correctness (level 7 only)
- Wrap-around metadata correctness (level 5 only)
- Portal teleport collision behavior

Key gaps remain in systematic completability validation.

---

## Assumptions

1. The existing test infrastructure (Vitest + jsdom) is sufficient for all new validation work.
2. Level layouts defined in `src/game/levels.ts` will not change during this milestone.
3. A BFS-based reachability utility is the simplest correct solution for connectivity analysis on a 20×20 grid.
4. A level is "completable" if there are enough reachable free cells for the snake to grow to the required food count, plus its initial length, without forced self-collision. Exact AI-like path planning is out of scope.
5. `localStorage` mock in Vitest is sufficient for persistence validation.

---

## Phases

### Phase 1 — Portal & Layout Safety Validation

**Goal:** Add missing validation assertions for portal exit safety and food spawn safety against all 10 specific level layouts. No new source modules required.

**Files to change:**

| File | Action | Description |
|------|--------|-------------|
| `src/utils/__tests__/levelData.test.ts` | Modify | Add portal-safety assertions, food-spawn-per-level safety, layout-grid-density sanity checks |

**New assertions to add:**

1. **Portal exit safety** — For level 7, verify:
   - Portal entry tiles do not overlap obstacles (`layout` Set lookup)
   - Portal entry tiles do not overlap `INITIAL_SNAKE` positions
   - Portal exit tiles do not overlap obstacles
   - Portal exit tiles do not overlap `INITIAL_SNAKE` positions
   - Portal entry and exit tiles are distinct (not the same cell)

2. **Food spawn capacity per level** — For each level 1–10:
   - Compute total occupied cells = `layout.length + INITIAL_SNAKE.length + portalPositions.length`
   - Assert `400 - occupied >= 1` (at least one cell available for food)
   - Assert `400 - occupied >= foodRequired` (enough cells exist to place all required food over a level, even if not simultaneously)

3. **No layout tile at grid position (10, 10)** — Already covered by existing snake overlap test, but make explicit (spawn center safety)

4. **Portal tile within grid bounds** — For level 7, assert each portal position is in `[0, GRID_SIZE)` for both x and y

> **Note on Phase 1 / Phase 3 overlap:** Portal-safety assertions appear in both Phase 1 (`levelData.test.ts`) and Phase 3 (`levelValidation.test.ts`). This is intentional — Phase 1 requires zero code dependencies (no reachability module) and provides early validation; Phase 3 re-asserts portal safety within the comprehensive parameterized suite. Both are kept because Phase 1 and Phase 2 can be implemented in parallel.

**Verification:**
- `npm test` — all existing 259 tests pass
- New assertions run on all 10 levels without failure
- No source code changes required (validation-only)

**Estimated test count increase:** ~12 tests

---

### Phase 2 — Reachability Analysis Module

**Goal:** Create a pure BFS-based reachability utility and test it. This is the only new source module in the milestone.

**Files to create:**

| File | Description |
|------|-------------|
| `src/game/reachability.ts` | Exports `getReachableCount(snakeHead, obstacles, portals?, wrapAround?, gridSize?)` and `countFreeCells(obstacles, portals, gridSize)` |

**Exported functions:**

```typescript
// Returns the count of cells reachable from the snake head via BFS,
// considering obstacles as blocked and portals as teleports.
// wrapAround: if true, edges connect (x=-1 ↔ x=GRID_SIZE-1, etc.)
function getReachableCount(
  snakeHead: Position,
  obstacles: Position[],
  portals?: [Position, Position][],
  wrapAround?: boolean,
  gridSize?: number
): number

// Returns total free cells = gridSize^2 - obstacleCount - portalCount
function countFreeCells(
  obstacleCount: number,
  portalCount?: number,
  gridSize?: number
): number
```

**Files to create:**

| File | Description |
|------|-------------|
| `src/game/__tests__/reachability.test.ts` | Unit tests for reachability functions |

**Tests:**

1. Empty grid → all 400 cells reachable
2. Obstacles blocking half-grid → correct reachable count
3. Enclosed cell (surrounded by obstacles) → unreachable, BFS excludes it
4. Portal teleport → BFS enters portal entry, explores from exit, counts correctly
5. Wrap-around grid → BFS wraps edges, cells on opposite side are reachable
6. Complex layout (level 7 obstacles + portals) → reachable count matches manual calculation
7. `countFreeCells` with 25 obstacles, 2 portals → returns `400 - 25 - 2 = 373`

**Files to change (ancillary):**

| File | Action | Description |
|------|--------|-------------|
| `src/game/index.ts` | Modify | Add `reachability.ts` exports to barrel |
| `src/utils/gameLogic.ts` | Modify | Optionally re-export from `src/utils/` for test access (follow existing re-export pattern) |

**Verification:**
- `npm test` — all tests pass
- New `reachability` module has 100% test coverage for its small surface area
- No impact on existing gameplay code

**Estimated new module size:** ~50 lines source, ~80 lines test

---

### Phase 3 — Systematic Level-by-Level Validation Suite

**Goal:** Create a dedicated test file that validates every level against all criteria in one place. This consolidates and extends existing per-level checks.

**File to create:**

| File | Description |
|------|-------------|
| `src/game/__tests__/levelValidation.test.ts` | Comprehensive level validation using reachability module |

**Tests for every level (parametrized across levels 1–10):**

1. **`LEVELS[N] spawn is safe`** — Snake `[{10,10}, {9,10}, {8,10}]` does not overlap obstacles, portals, or board bounds
2. **`LEVELS[N] obstacles are within bounds [0, 20)`** — Every obstacle x,y in range
3. **`LEVELS[N] no duplicate obstacle coordinates`** — Set uniqueness check
4. **`LEVELS[N] first-tick has at least 2 survivable directions`** — UP/DOWN/RIGHT neighbors not all blocked (already in levelData.test.ts)
5. **`LEVELS[N] has enough free cells for food`** — `countFreeCells >= 1` and `freeCells >= foodRequired`
6. **`LEVELS[N] reachable cells >= required`** — BFS reachable count >= `foodRequired + INITIAL_SNAKE.length` (snake + all food eaten during the level must have room)
7. **`LEVELS[N] snake head (10,10) is reachable from itself`** — Sanity check that BFS doesn't exclude the starting cell

**Level 5 wrap-around specific tests:**

8. **`Level 5 wrap-around: BFS with wrapAround reaches entire board`** — With no obstacles blocking, wrap path doubles reachable area
9. **`Level 5 wrap-around: wall collision returns false for edge positions`** — Verify `isWallCollision` with `wrapAround: true` (already tested in gameLogic.test.ts)

**Level 7 portal-specific tests:**

10. **`Level 7 portal entries and exits are safe`** — Neither entry nor exit positions overlap obstacles or snake spawn
11. **`Level 7 portal entries are distinct from exits`** — `{x:2,y:4}` != `{x:16,y:15}`
12. **`Level 7 BFS with portals reaches both chambers`** — Portal entry and exit both in reachable set
13. **`Level 7 BFS without portals would separate chambers`** — Validates portal is necessary for full connectivity (optional nice-to-have)

**Layout failure resolution path:** If any level fails a reachability assertion (e.g., `reachableCells < foodRequired + INITIAL_SNAKE.length`), fix the layout in `src/game/levels.ts`, re-run tests, and document the layout change in the PR description. Do NOT loosen the validation threshold.

**Verification:**
- `npm test` — all tests pass
- Level validation test file exercises all 10 levels
- Any level layout defect is caught here

**Estimated test count increase:** ~30 tests

---

### Phase 4 — Persistence & Integration Validation

**Goal:** Fill remaining gaps in storage, statistics, and engine integration tests. Only genuinely-missing tests are added; existing coverage is not duplicated.

**Existing coverage already present (do NOT re-implement):**
- `Engine.test.ts:243-304` — `lastUnlockedLevel` persistence on gameover/won/levelComplete
- `achievements.test.ts:53-59` — `saveAchievement` duplicate prevention
- `achievements.test.ts:91-97` — `checkAchievements` re-detection prevention
- `statistics.test.ts:9-17` — `loadStats` returns defaults when empty
- `statistics.test.ts:41-50` — `updateBestLevel` only increases

**Files to change:**

| File | Action | Description |
|------|--------|-------------|
| `src/game/statistics.ts` | Modify | Add try/catch to `loadStats` (match `loadAchievements` pattern) |
| `src/game/__tests__/Engine.test.ts` | Modify | Add tests for destroy+recreate cycle, high score not saved during playing, stats saved on pause |
| `src/game/__tests__/statistics.test.ts` | Modify | Add round-trip test, corruption-resilience test |
| `src/game/__tests__/achievements.test.ts` | Modify | Add corrupt localStorage recovery test |

**New specific tests:**

**statistics.ts code fix (1-line change):**
- Wrap `loadStats`'s `localStorage.getItem` + `JSON.parse` + `parseInt` calls in try/catch, returning defaults on any exception. This mirrors the `loadAchievements` pattern and prevents game crashes from corrupted localStorage values (e.g., manual user edits, browser bugs, prior-version migration artifacts).

**Engine.test.ts genuinely-new additions:**
1. `lastUnlockedLevel` persists across Engine destroy + recreate cycles (constructor reads persisted value)
2. High score is NOT saved to localStorage during `playing` state (only on `gameover` and `won`)
3. Stats are saved to localStorage on `paused` state (document existing behavior at `Engine.ts:72-75`)

**statistics.test.ts genuinely-new additions:**
1. `saveStats` + `loadStats` round-trips correctly (write then read matches)
2. `loadStats` returns defaults `(0, 0, 1, 0)` when localStorage contains corrupt/garbage data (tests the new try/catch)

**achievements.test.ts genuinely-new additions:**
1. `loadAchievements` returns `[]` when localStorage data is corrupt/not valid JSON

**Verification:**
- `npm test` — all tests pass
- `loadStats` corruption no longer crashes the game
- No regressions in game behavior

**Estimated test count increase:** ~8 tests

---

### Phase 5 — Manual Validation & Documentation

**Goals:** Document manual playthrough procedures and findings.

**No code changes.**

**Deliverable:** Create `docs/M11_VALIDATION_NOTES.md` with each manual check marked PASS/FAIL/NOTE. Key findings are summarized in `docs/PROJECT_STATE.md`'s validation results section.

**Defect cap:** Manual validation may identify up to 3 minor defects. Any defect that requires more than 1 hour of investigation, introduces significant new game mechanics, or fundamentally changes level design is filed as a separate issue and deferred to a future milestone. The milestone is considered complete once all CRITICAL defects (progression blockers, crashes) are resolved; minor non-blocking defects may be documented as known limitations.

**Manual playthrough checklist (documented in SPEC.md or a one-time note):**

1. **Full Level 1–10 run** — Complete all levels in sequence; verify:
   - Each level transition triggers correctly
   - Food objectives are reachable
   - No level feels impossible or unfair
   - Win screen appears after level 10
   - ScoreBoard HUD displays correct level name and food progress

2. **Endless Mode run** — From win screen → Start Endless; verify:
   - ScoreBoard shows "Endless" label
   - No level-ups occur
   - Game over screen shows "Endless Score"
   - Game over → Continue works from previous level

3. **Keyboard-only run** — Verify:
   - All actions accessible via keyboard: Start (Space), Pause (Space), Resume (Space), Level Complete Continue (Space), New Game (Space), Continue (click)
   - Arrow keys and WASD both work
   - Opposite direction is blocked

4. **Mobile run** — Verify:
   - Swipe gestures register correctly
   - D-pad buttons work
   - Pause/Resume via toolbar and space
   - Responsive layout on small screen
   - Sound toggle works

5. **Achievement validation** — Verify:
   - "Snake Master" unlocks on win
   - "High Scorer" unlocks on score ≥ 500
   - "Marathon Run" unlocks on win without pausing
   - Achievements persist across page reload

6. **Statistics validation** — Verify:
   - Games Played increments each game start
   - Total Food accumulates across runs
   - Best Level updates correctly
   - Stats persist across page reload

**Verification:**
- All manual checks produce no failures
- Any bugs found are filed as issues and fixed before milestone is complete
- Findings documented in PR description

---

## Cumulative Test Count

| After Phase | Test Count |
|-------------|-----------|
| Baseline (M10 complete) | 259 |
| Phase 1 — Portal & Layout Safety | 271 (259 + 12) |
| Phase 2 — Reachability Module | 278 (271 + 7) |
| Phase 3 — Level Validation Suite | 308 (278 + 30) |
| Phase 4 — Persistence & Integration | 316 (308 + 8) |
| **Target DoD** | **~316 tests passing** |

---

## Milestone Definition of Done

A validated and documented state where:

- [ ] All 4 implementation phases complete with tests passing
- [ ] Manual validation completes with no CRITICAL defects remaining
- [ ] No broken levels, impossible starts, or progression blockers
- [ ] All validation tests passing (current 259 + ~57 new = ~316 total)
- [ ] `npm run build` completes with no errors
- [ ] `npm run lint` passes with no new warnings
- [ ] `npm test` passes with zero failures
- [ ] `package.json` version bumped to `0.11.0`
- [ ] ROADMAP.md updated — Milestone 11 moved from "Not Started" to "Completed"
- [ ] PROJECT_STATE.md updated — version bumped to 0.11.0, milestone status updated
- [ ] SPEC.md updated if any behavior changes were discovered and fixed
- [ ] Any bugs found during manual validation are fixed or documented as known limitations

---

## Risks

| Risk | Likelihood | Mitigation |
|------|-----------|------------|
| BFS reachability reveals an existing level that is not fully reachable | Medium | If a level has unreachable sections, this is a genuine defect. Fix the layout in `src/game/levels.ts`, do not loosen the validation. |
| Manual validation reveals bugs in existing gameplay code (not just level data) | Medium | Fix bugs as they are found. Capped at 3 minor defects; anything larger is deferred to a future milestone (see Phase 5 defect cap). |
| Corrupt localStorage data causes `loadStats` to throw, crashing the game | Medium | Phase 4 adds try/catch to `loadStats`, matching the `loadAchievements` resilience pattern. |
| Reachability threshold (reachable cells >= foodRequired + initialSnakeLength) is too conservative for levels where the snake grows and eventually self-occupies | Low | The threshold is deliberately conservative. A more sophisticated simulation would be speculative. If a level passes reachability but is still hard, that's a design question, not a defect. |
| New tests accidentally depend on each other via shared state | Low | Follow existing test isolation patterns. Each test creates its own state. |

---

## Out of Scope

The following are explicitly NOT part of this milestone:

- **AI-based level validation** — No machine learning or automated playthrough simulation. Validation is structural (reachability, bounds, overlap), not behavioral.
- **Procedural level generation** — Levels remain handcrafted.
- **New gameplay mechanics** — No new food types, obstacles, portals, or game modes.
- **Balancing / difficulty tuning** — If a level is "too hard" but passes all validation, file as a future issue but do not fix in this milestone. Only fix actual defects (impossible/unreachable).
- **Visual changes** — No CSS or rendering changes.
- **Performance optimization** — BFS on a 20×20 grid is trivial (400 cells).
- **New documentation files** — Only documentation that already exists (SPEC.md, ROADMAP.md, PROJECT_STATE.md, ARCHITECTURE.md) may be updated.
- **Future milestones** — No work on Milestones 12–17. Specifically do not add Main Menu, Settings, Themes, Onboarding, Polish effects, or packaging.
- **Sound system changes** — No new sounds or audio architecture.
- **Accessibility changes** — Existing accessibility is preserved; no new a11y work.

---

## Implementation Order & Dependencies

```
Phase 1 ──┐
          ├──> Phase 3 (depends on reachability functions from Phase 2)
Phase 2 ──┘
Phase 4 (independent — can run in parallel with Phases 1-3)
Phase 5 (last — after all code changes complete)
```

- Phases 1 and 2 have no mutual dependencies and can be implemented in parallel.
- Phase 3 depends on the `reachability.ts` module from Phase 2.
- Phase 4 is fully independent and can be done at any time.
- Phase 5 is manual and must follow all code changes.

---

## Review Checklist

Before finalizing the plan, the following have been verified:

- [x] **No unnecessary complexity** — BFS on a 400-cell grid is the simplest correct approach for connectivity. No Dijkstra, no A*, no simulation engine.
- [x] **No future-milestone leakage** — No Main Menu, Settings, Themes, Onboarding, or Polish work included.
- [x] **Violations of AGENTS.md** — No violations identified. Plan follows existing code patterns and testing conventions.
- [x] **Opportunities to simplify** — Phase 1 (addition to existing test file) and Phase 3 (new test file) could be merged. They are separated because Phase 1 has zero code dependencies and Phase 3 requires Phase 2's module. Separating keeps Phases 1 and 2 independently implementable.
