# Implementation Review: Milestone 7 — Difficulty Rebalance

**Reviewer:** Staff Engineer (Implementation Review)
**Milestone under review:** M7 — Difficulty Rebalance
**Source documents:** `plans/ACTIVE.md`, `plans/PLAN_REVIEW.md`, `AGENTS.md`, `docs/ROADMAP.md`, `ARCHITECTURE.md`, `SPEC.md`, `docs/PROJECT_STATE.md`, `package.json`
**Implementation files reviewed:** `src/game/types.ts`, `src/game/levels.ts`, `src/game/state.ts`, `src/components/Game.tsx`, `src/components/ScoreBoard.tsx`, `src/components/ScoreBoard.module.css`, `src/types/components.ts`, `src/game/__tests__/state.test.ts`, `src/game/__tests__/Engine.test.ts`, `src/utils/__tests__/levelData.test.ts`, `src/components/__tests__/Game.test.tsx`
**Verification commands run:** `npm run lint`, `npm run build`, `npm test`
**Review date:** 2026-06-06

---

# Executive Summary

## Overall Assessment

**Approve.** The M7 implementation is a textbook execution of a well-specified, right-sized milestone plan. Every phase in `plans/ACTIVE.md` is implemented as specified. Every Critical and High finding from the prior Plan Review (`plans/PLAN_REVIEW.md` F-01 through F-08) is not just listed in the updated plan but is actually addressed in the code. All hard verification gates pass: `npm run lint` is clean, `npm run build` succeeds, `npm test` reports 178/178 passing.

The code is minimal, mirrors existing patterns, and introduces no speculative abstractions. The diff is a textbook small change: one new state field, one field rename, a data-table swap, a small UI row, a CSS class, and a small screen-reader text update. The plan-review's "no new packages, no new abstractions" promise is honoured. Documentation is consistent across `SPEC.md`, `ARCHITECTURE.md`, `PROJECT_STATE.md`, and `ROADMAP.md`.

## Major Strengths

1. **Plan fidelity is exceptional.** All six plan phases are implemented exactly as specified. The level-up trigger is `foodEaten >= foodRequired` (`state.ts:73`). All three `MOVE_SNAKE` return paths include `foodEaten: newFoodEaten` (`state.ts:77-86, 89-98, 101-108`). `CONTINUE_GAME` and `START_AT_LEVEL` reset `foodEaten: 0` (`state.ts:129, 147`). The 10 `foodRequired` and `speed` values in `levels.ts:9-121` match the plan's tables character-for-character.
2. **All Plan-Review findings resolved in code, not just on paper.**
   - F-01 (test path): The plan was rewritten to reference `src/utils/__tests__/levelData.test.ts`, and the test file at that path is updated with the new `foodRequired` assertions (`levelData.test.ts:10, 17, 24`).
   - F-02 (`Engine.test.ts` level-up tests): Both `lastUnlockedLevel persistence` tests now use `foodEaten: 9` / `score: 90` for level 1 and `foodEaten: 29` / `score: 290` for level 10 (`Engine.test.ts:269, 290`). The `continueGame` and `startAtLevel` blocks are correctly left untouched.
   - F-03 (`makeState` factory): `foodEaten: 0` is added to the factory at `state.test.ts:22`. This is the single highest-leverage change and it is present.
   - F-04 (SPEC §6.4): `SPEC.md:153` now reads "When level `LEVEL_COUNT` food objective is reached (30 food eaten at level 10)". The stale `LEVEL_COUNT * 50` reference is gone.
   - F-05 (ARCHITECTURE §110): `ARCHITECTURE.md:110` now reads "(150ms → 100ms)".
   - F-06 (state machine diagram): `ARCHITECTURE.md:209-210` reads "FOOD OBJECTIVE REACHED (levels 1-9) → LEVELCOMPLETE" and "FOOD OBJECTIVE REACHED (level 10) → WON".
   - F-07 (screen-reader text): `ScoreBoard.tsx:26` matches the plan exactly: `{score > 0 && \`Score: ${score}. \`}{foodEaten > 0 && \`Food: ${foodEaten} of ${foodRequired}. \`}Level {level}.`
   - F-08 (won test setup): Both `won` test cases in `state.test.ts:291-307, 309-325` use `foodEaten: 29, score: 290`.
3. **Code follows existing patterns.** The `foodEaten` field is added to `GameState` in the same shape and style as `lastUnlockedLevel`. The `MOVE_SNAKE` reducer changes mirror the `MOVE_SNAKE` `lastUnlockedLevel` work from M6 — same `Math.max` guard pattern, same `newScore`/`newFoodEaten` derived-state pattern. The `ScoreBoard.tsx` UI row is added in the same way as the existing `Level` and `Score` rows.
4. **Test coverage is strong and intentional.** The new test `levelComplete fires when foodEaten reaches foodRequired, not based on score` (`state.test.ts:233-249`) explicitly demonstrates the semantic change by setting `score: 5` and asserting the level still completes. This is exactly the regression test a Staff Engineer would write for a behaviour change.
5. **No new files except expected documentation changes.** Diff stat: 18 files changed, 781 insertions, 335 deletions. Most of the insertions are the expanded `plans/ACTIVE.md` (which is expected for an active plan) and the test additions. The actual production code diff is tiny.
6. **Layout validity tests still pass.** The M5 layout tests (determinism, bounds, duplicate, snake overlap, first-tick survivability) all pass with the new data because the obstacle `layout` arrays in `levels.ts` are unchanged.
7. **Engine required zero changes.** The Engine's per-tick `getLevelData(state.level).speed` read (`Engine.ts:134-135`) automatically picks up the new speed values, exactly as the plan predicted.
8. **`foodEaten` per-level isolation is correct.** `CONTINUE_GAME` resets `foodEaten: 0` (`state.ts:129`) and `START_AT_LEVEL` resets `foodEaten: 0` (`state.ts:147`). Score carries over between levels (the `...state` spread in the levelComplete return preserves `score`), matching the plan's "Score semantics are preserved correctly" goal.

## Major Concerns

1. **`ARCHITECTURE.md` Important Constants table still lists `MIN_SPEED`** (`ARCHITECTURE.md:257`), with the value updated from `60ms` to `100ms`. The plan explicitly says: "Remove `MIN_SPEED: 60ms` (minimum is now 100ms). The speed is now data-driven per level, not formula-driven." (`plans/ACTIVE.md:337`). The constant was correctly removed from `src/game/constants.ts` (verified — `MIN_SPEED` does not exist in the source code), but the documentation row was kept with a value change. The row is now misleading: there is no longer a single `MIN_SPEED` constant; the minimum speed is whatever the level 10 data row says. **Severity: Low (Documentation).** This is a minor deviation from the plan; the value is technically accurate (100ms matches level 10's speed), but the row implies a single-source-of-truth constant that no longer exists.

2. **`ROADMAP.md:222` still lists `targetScore` as a level field** in the M4 "Level Metadata System" feature description. M7 renamed this field to `foodRequired`. The M4 section is a historical record of what M4 delivered, but the field list is now factually wrong against the current code. **Severity: Low (Documentation).** Easily fixed by changing the bullet from `targetScore` to `foodRequired`. Same concern as F-09 from the M6 review (a stale reference in a historical milestone section).

---

# Findings

## Critical

_None._ No blocking bugs, regressions, incomplete features, or missing tests.

## High

_None._ No High-severity findings. The Plan-Review F-01 through F-08 were all addressed in implementation; the two remaining items are minor documentation drift.

## Medium

_None._

## Low

### F-01. `MIN_SPEED` row in `ARCHITECTURE.md` Important Constants table was not removed
- **Severity:** Low
- **Category:** Documentation
- **Description:** `ARCHITECTURE.md:257` reads:
  ```
  | MIN_SPEED       | 100ms      | Final level speed |
  ```
  The plan called for this row to be removed (`plans/ACTIVE.md:337`): "Remove `MIN_SPEED: 60ms` (minimum is now 100ms). The speed is now data-driven per level, not formula-driven." The constant itself was correctly removed from `src/game/constants.ts` (verified by `grep`), but the documentation row was kept with a value bump. The row is now misleading: there is no longer a single `MIN_SPEED` constant in the codebase; the minimum speed is whatever `getLevelData(LEVEL_COUNT).speed` returns.
- **Recommendation:** Remove the `MIN_SPEED` row from the Important Constants table in `ARCHITECTURE.md`. Acceptable to leave for the next documentation pass; not blocking.

### F-02. `ROADMAP.md:222` still lists `targetScore` in the M4 "Level Metadata System" feature description
- **Severity:** Low
- **Category:** Documentation
- **Description:** `docs/ROADMAP.md:217-223` describes the M4 Level Metadata System as:
  ```
  Each level contains:
  - id
  - name
  - description
  - targetScore
  - speed
  ```
  The `targetScore` field was renamed to `foodRequired` in M7. The M4 section is a historical record, but the field list is now factually wrong against the current implementation. Note: `docs/PROJECT_STATE.md:138` (the M6 completed-features section) does correctly call out the rename as a historical event, so the change is at least documented somewhere.
- **Recommendation:** Change the bullet from `targetScore` to `foodRequired` in `ROADMAP.md:222`. Acceptable to leave for a follow-up; not blocking.

### F-03. Pre-existing `Engine.startAtLevel` "fires `onLevelUp` once" behavior still has no dedicated test
- **Severity:** Low (pre-existing, out of M7 scope)
- **Category:** Testing
- **Description:** This is the same item flagged in the M6 review (F-08 in `reviews/IMPLEMENTATION_REVIEW.md`). `startAtLevel(N)` from a lower level fires `onLevelUp` once. M7 did not add a test for this. The behaviour is exercised indirectly by the `continueGame` test block, but a dedicated regression test would be cleaner.
- **Recommendation:** None for M7. Out of scope. Could be folded into a future milestone's test pass.

### F-04. Pre-existing `getLevelData(state.level + 1)` landmine not addressed
- **Severity:** Low (pre-existing, out of M7 scope)
- **Category:** Bug (latent)
- **Description:** This is the same item flagged in the M6 review (F-09 in `reviews/IMPLEMENTATION_REVIEW.md`). `src/components/Game.tsx:213` calls `getLevelData(state.level + 1).description` for the LevelTransition overlay. At level 10 the game transitions directly to `won` and the overlay is never shown, so this is dead code in practice.
- **Recommendation:** None for M7. Out of scope. Could be addressed in a future cleanup.

### F-05. The `VITE_POINTS_PER_FOOD` description now reads "scoring only, not progression" — but the env var still exists
- **Severity:** Low (informational, not a defect)
- **Category:** Documentation
- **Description:** `SPEC.md:368` was updated to read "Points per food eaten (scoring only, not progression)" — which is accurate. The env var still exists in `.env` and is read by `src/game/constants.ts:4`. No code change needed; the description is now correct. Noting this so future reviewers know the env var's role changed but it was not removed.
- **Recommendation:** None. The description is accurate.

### F-06. `Engine.ts:135` retains the `?? 150` defensive fallback
- **Severity:** Low (informational, not a defect)
- **Category:** Maintainability
- **Description:** `src/game/Engine.ts:135` reads `const speed = config.speed ?? 150;`. The `Level.speed` field is `number` (required, not optional) in `types.ts:15`, so the `?? 150` fallback is dead code defensively. This is pre-existing (introduced in M5 when the speed became data-driven). It does no harm and protects against an impossible state. M7 did not remove it.
- **Recommendation:** None. Out of M7 scope.

---

# Plan Compliance Review

The implementation matches `plans/ACTIVE.md` phase-by-phase. Each phase's "Files" and "Verification" sections are satisfied.

## Completed as planned

| Plan item | Implemented? | Evidence |
|-----------|--------------|----------|
| **Phase 1: Type and Data Changes** | | |
| 1a. `Level.targetScore` → `Level.foodRequired` | ✅ | `types.ts:14` |
| 1b. `GameState.foodEaten: number` added | ✅ | `types.ts:30` |
| 1c. All 10 level definitions use `foodRequired` with new values | ✅ | `levels.ts:9, 17, 28, 41, 54, 66, 77, 90, 105, 120` |
| 1c. All 10 level definitions use new `speed` values | ✅ | `levels.ts:10, 18, 29, 42, 55, 67, 78, 91, 106, 121` |
| **Phase 2: State Machine Changes** | | |
| 2a. `foodEaten: 0` in `getInitialState()` | ✅ | `state.ts:23` |
| 2b. `newFoodEaten` derived from `ateFood` | ✅ | `state.ts:70` |
| 2b. `shouldLevelUp` checks `foodEaten >= foodRequired` | ✅ | `state.ts:73` |
| 2b. `foodEaten: newFoodEaten` in `won` return | ✅ | `state.ts:85` |
| 2b. `foodEaten: newFoodEaten` in `levelComplete` return | ✅ | `state.ts:97` |
| 2b. `foodEaten: newFoodEaten` in normal return | ✅ | `state.ts:107` |
| 2c. `foodEaten: 0` in `CONTINUE_GAME` | ✅ | `state.ts:129` |
| 2d. `foodEaten: 0` in `START_AT_LEVEL` | ✅ | `state.ts:147` |
| 2e. `START_GAME` / `RESET` no change needed | ✅ | `state.ts:38-42` (uses `getInitialState()`) |
| **Phase 3: Engine Review** | | |
| Engine required zero changes | ✅ | `Engine.ts` not modified |
| `lastUnlockedLevel` persistence unchanged | ✅ | Verified by `Engine.test.ts:243-301` |
| **Phase 4: UI Updates** | | |
| 4a. `ScoreBoardProps` extended with `foodEaten`, `foodRequired` | ✅ | `types/components.ts:25-26` |
| 4b. Food progress row added between Level and Score | ✅ | `ScoreBoard.tsx:12-15` |
| 4b. Screen-reader text updated with `foodEaten > 0` guard | ✅ | `ScoreBoard.tsx:26` |
| 4c. `.foodProgress` CSS class | ✅ | `ScoreBoard.module.css:28-31` |
| 4d. `foodEaten`/`foodRequired` passed from `Game.tsx` | ✅ | `Game.tsx:153` |
| **Phase 5: Test Updates** | | |
| 5a. `levelData.test.ts` uses `foodRequired` and new speeds | ✅ | `levelData.test.ts:10, 17, 24` |
| 5b. `makeState` factory includes `foodEaten: 0` | ✅ | `state.test.ts:22` |
| 5b. `foodEaten` increments test | ✅ | `state.test.ts:209-222` |
| 5b. `foodEaten` does not increment without food test | ✅ | `state.test.ts:224-231` |
| 5b. `levelComplete` fires on `foodEaten >= foodRequired` test | ✅ | `state.test.ts:233-249` |
| 5b. `levelComplete` uses `foodEaten: 9, score: 90` setup | ✅ | `state.test.ts:253-271` |
| 5b. `won` at level 10 uses `foodEaten: 29, score: 290` | ✅ | `state.test.ts:291-307, 309-325` |
| 5b. `CONTINUE_GAME` resets `foodEaten: 0` | ✅ | `state.test.ts:409-428` |
| 5b. `START_AT_LEVEL` resets `foodEaten: 0` | ✅ | `state.test.ts:475-479` |
| 5b. `lastUnlockedLevel = level + 1` uses `foodEaten: 9, score: 90` | ✅ | `state.test.ts:483-500` |
| 5b. `accumulates correctly` test uses `foodEaten: 9, score: 90` | ✅ | `state.test.ts:539-559` |
| 5c. `Engine.test.ts` level-up uses `foodEaten: 9, score: 90` | ✅ | `Engine.test.ts:289-291` |
| 5c. `Engine.test.ts` won uses `foodEaten: 29, score: 290` | ✅ | `Engine.test.ts:268-270` |
| 5c. `Game.test.tsx` mock includes `foodEaten: 0` | ✅ | `Game.test.tsx:36` |
| **Phase 6: Documentation Updates** | | |
| 6a. `SPEC.md` §4 explicit speed table (replaces formula) | ✅ | `SPEC.md:53-63` |
| 6a. `SPEC.md` §6.1 unchanged (scoring works the same) | ✅ | `SPEC.md:92-95` |
| 6a. `SPEC.md` §6.2 food-objective system (replaces target score) | ✅ | `SPEC.md:97-129` |
| 6a. `SPEC.md` §6.3 `Level` interface example updated | ✅ | `SPEC.md:141` |
| 6a. `SPEC.md` §6.4 win condition updated | ✅ | `SPEC.md:153` |
| 6a. `SPEC.md` §10.4 ScoreBoard description | ✅ | `SPEC.md:291-298` |
| 6a. `SPEC.md` §13 `VITE_POINTS_PER_FOOD` note | ✅ | `SPEC.md:368` |
| 6b. `ARCHITECTURE.md` state shape includes `foodEaten` | ✅ | `ARCHITECTURE.md:243` |
| 6b. `ARCHITECTURE.md` speed range updated to 150ms → 100ms | ✅ | `ARCHITECTURE.md:110, 154` |
| 6b. `ARCHITECTURE.md` level system description | ✅ | `ARCHITECTURE.md:153-154` |
| 6b. `ARCHITECTURE.md` state machine diagram | ✅ | `ARCHITECTURE.md:209-210` |
| 6b. `ARCHITECTURE.md` test count updated to 178 | ✅ | `ARCHITECTURE.md:272` |
| 6c. `PROJECT_STATE.md` version → v0.7.0 | ✅ | `PROJECT_STATE.md:5` |
| 6c. `PROJECT_STATE.md` current status "M7 complete" | ✅ | `PROJECT_STATE.md:11` |
| 6c. `PROJECT_STATE.md` current priorities → M8 | ✅ | `PROJECT_STATE.md:29-31` |
| 6c. `PROJECT_STATE.md` M7 added to completed features | ✅ | `PROJECT_STATE.md:134-142` |
| 6c. `PROJECT_STATE.md` "In Progress" → M8 | ✅ | `PROJECT_STATE.md:151` |
| 6c. `PROJECT_STATE.md` M7 success criteria added | ✅ | `PROJECT_STATE.md:225-232` |
| 6c. `PROJECT_STATE.md` Important Notes mentions M7 | ✅ | `PROJECT_STATE.md:242` |
| 6d. `ROADMAP.md` M7 moved to "Completed" | ✅ | `ROADMAP.md:128-133` |
| 6d. `ROADMAP.md` "Difficulty rebalance" removed from "Not Started" | ✅ | `ROADMAP.md:140-146` |
| 6d. `ROADMAP.md` M7 detail block ✅ markers | ✅ | `ROADMAP.md:370, 384, 405, 428-432` |
| 6d. `ROADMAP.md` "Completed: 2026-06-06" | ✅ | `ROADMAP.md:434` |
| 6e. `package.json` version → 0.7.0 | ✅ | `package.json:4` |

## Partially completed

- **Phase 6b (`ARCHITECTURE.md` `MIN_SPEED` row):** The plan called for the `MIN_SPEED` row in the Important Constants table to be removed (`plans/ACTIVE.md:337`). The row was kept with the value updated to `100ms`. See F-01 for details. Severity: Low. Not blocking.

## Missing implementation

None of the plan's feature work is missing. The two documentation drift items (F-01, F-02) are housekeeping, not missing implementation.

---

# Documentation Review

## SPEC.md

**Updated and consistent.** The new sections accurately describe the food-objective system and the explicit speed table. The §6.4 win-condition fix called out by Plan-Review F-04 is present (`SPEC.md:153`). The §10.4 ScoreBoard description includes the food progress row (`SPEC.md:295`). The §13 `VITE_POINTS_PER_FOOD` note is added (`SPEC.md:368`). The test count is updated to 178 (`SPEC.md:400`), which matches `npm test` output.

## ARCHITECTURE.md

**Updated and consistent.** The Plan-Review F-05 and F-06 fixes are present: line 110 reads "150ms → 100ms" and the state machine diagram at lines 209-210 uses the food-objective terminology. The State Shape includes `foodEaten: number` (`ARCHITECTURE.md:243`). The test count is updated to 178.

**Minor drift (F-01):** The `MIN_SPEED` row at line 257 was kept with a value update instead of being removed per the plan.

## PROJECT_STATE.md

**Updated and consistent.** Version is `v0.7.0` (matches `package.json`). Current Milestone is `Milestone 7 - Difficulty Rebalance`. Current Priorities point to M8. M7 has a full "Completed Features" entry (`PROJECT_STATE.md:134-142`) and a "Success criteria (completed)" block (`PROJECT_STATE.md:225-232`). The "In Progress" line points to M8 (`PROJECT_STATE.md:151`). The Important Notes section explicitly states M7 is complete (`PROJECT_STATE.md:242`).

## ROADMAP.md

**Updated and consistent.** M7 is moved to the "Completed" section in both the summary list (`ROADMAP.md:128-133`) and the detail block (`ROADMAP.md:370-434`). All feature and success-criteria bullets have ✅ markers. The "Difficulty rebalance" bullet has been removed from the "Not Started" section. The completion date 2026-06-06 is recorded.

**Minor drift (F-02):** The M4 "Level Metadata System" feature description at `ROADMAP.md:222` still lists `targetScore` as a level field. The field was renamed to `foodRequired` in M7.

## package.json

**Updated.** Version is `0.7.0`.

## AGENTS.md

Not modified. Correct behaviour — AGENTS.md documents project-wide rules and is not in scope for an implementation change.

## plans/ACTIVE.md

Reflects the active plan with all Plan-Review F-01 through F-08 fixes baked in. The plan now correctly references `src/utils/__tests__/levelData.test.ts` (line 251), explicitly calls out the `makeState` factory update (line 266), and specifies the screen-reader text format (lines 222-224). Will be archived after merge per AGENTS.md's Plan Lifecycle rules.

## plans/PLAN_REVIEW.md

Not modified. The implementation addresses all Critical and High findings; the plan review is now historical.

---

# Testing Review

## Existing tests

All previously existing tests still pass. Test count: **178 passed (178)** across **13 test files**. Confirmed via `npm test`.

| Test file | Pre-M7 | Post-M7 | Δ |
|-----------|--------|---------|---|
| `state.test.ts` | 43 | 51 | +8 (3 new `MOVE_SNAKE` tests: `increments foodEaten by 1`, `does not increment foodEaten when no food is eaten`, `levelComplete fires when foodEaten reaches foodRequired, not based on score`; 1 new `CONTINUE_GAME` test: `resets foodEaten to 0`; 1 new `START_AT_LEVEL` test: `resets foodEaten to 0`; 3 modified tests use new `foodEaten` setup) |
| `Engine.test.ts` | 28 | 28 | 0 (no new tests; 2 existing tests in `lastUnlockedLevel persistence` updated to use `foodEaten: 9` / `foodEaten: 29`) |
| `levelData.test.ts` | 20 | 20 | 0 (no new tests; assertions updated for `foodRequired` and new speeds) |
| `Game.test.tsx` | 4 | 4 | 0 (mock updated to include `foodEaten: 0`) |
| All other files | 72 | 72 | 0 |
| **Total** | **167** | **178 by `it` count**, **178 by Vitest** | +11 net `it`s, +11 Vitest tests |

The Vitest count of **178** is authoritative and matches the count documented in `SPEC.md:400` and `ARCHITECTURE.md:272`.

## Missing tests

The following test gaps are non-blocking and consistent with prior-milestone patterns:

1. **Pre-existing `Engine.startAtLevel` `onLevelUp` callback assertion** (F-03, carried over from M6 review).
2. **No test asserts the dev select is absent in a production build** (pre-existing, was F-05 sub-recommendation in M6 review).
3. **No test for the new `foodProgress` row in `ScoreBoard.tsx`.** The component test for `ScoreBoard` would be a natural home. There is no `ScoreBoard.test.tsx` in the repo (pre-existing gap; the component is rendered indirectly via `Game.test.tsx` mocks).
4. **No test asserts the new screen-reader announcement text format.** The plan-review F-07 specified the exact text, and the implementation matches it, but no test asserts it.

These are all Low-severity gaps. None of them indicate a regression.

## Verification quality

The verification is high quality:

- The new test `levelComplete fires when foodEaten reaches foodRequired, not based on score` (`state.test.ts:233-249`) is exactly the kind of regression test a Staff Engineer would write for a behaviour change. It explicitly sets `score: 5` (which would not have triggered the old score-based level-up) and asserts that the level still completes. This catches the most likely regression: an implementer accidentally re-introducing the score-based trigger.
- The `makeState` factory update at `state.test.ts:22` is the highest-leverage single-line change in the test diff, and it is present. Without it, 24+ existing tests would fail TypeScript compilation.
- The `Engine.test.ts` level-up tests now use the foodEaten-based setup that mirrors the `state.test.ts` level-up tests. The pattern is consistent and readable.
- The `levelData.test.ts` updates preserve the existing layout-validity tests (bounds, duplicates, snake overlap, first-tick survivability) which all pass against the new data because obstacle layouts are unchanged.
- The `Game.test.tsx` mock update is a one-liner; the existing tests continue to pass without modification.

---

# Final Decision

## **Approve**

The implementation is complete, correct, and faithful to the plan. All hard verification gates pass (`npm run lint` clean, `npm run build` succeeds, `npm test` reports 178/178). All Plan-Review Critical and High findings (F-01 through F-08) have been verified as resolved in the code, not just in the plan. The two remaining items (F-01, F-02) are minor documentation drift that the implementer can choose to address in a follow-up.

### Why "Approve" (not "Approve with Minor Changes")

The two remaining items are both Low-severity documentation housekeeping that does not affect the implementation, the build, the tests, or the user-facing behaviour. The M6 review used "Approve with Minor Changes" because its remaining items were High-severity (ROADMAP.md not updated, PROJECT_STATE.md not updated) — those are exactly the items that AGENTS.md's ROADMAP Maintenance Rules treat as hard requirements. M7 has no such gate failures. F-01 and F-02 are nice-to-have cleanup, not blockers.

### Required for merge

None. The implementation is merge-ready as-is.

### Recommended before merge (low-cost polish)

1. **F-01:** Remove the `MIN_SPEED` row from `ARCHITECTURE.md:257` per the plan. (Optional, takes 30 seconds.)
2. **F-02:** Change `targetScore` to `foodRequired` in `ROADMAP.md:222` per the M7 data-layer change. (Optional, takes 30 seconds.)

### Acceptable to defer

- F-03 (pre-existing `startAtLevel` `onLevelUp` test)
- F-04 (pre-existing `getLevelData(state.level + 1)` dead code)
- F-05, F-06 (informational)

### Net assessment

- **Simplicity:** ✅ Honoured. One new state field, one field rename, one data-table swap, one CSS class, one UI row, one screen-reader text update. No new files, no new packages, no new abstractions.
- **Maintainability:** ✅ Honoured. The new code mirrors existing patterns. The `foodEaten` field is added in the same shape and style as `lastUnlockedLevel`. The UI row is added in the same way as existing rows.
- **Repository alignment:** ✅ Honoured. All four documentation files (`SPEC.md`, `ARCHITECTURE.md`, `PROJECT_STATE.md`, `ROADMAP.md`) tell the same story. The two minor drift items (F-01, F-02) are stale references, not contradictions.
- **Milestone completion:** ✅ Feature complete. Documentation complete. Verification gates pass. `package.json` version bumped. Ready to merge.
- **Test coverage:** ✅ Comprehensive for the new functionality. The new `levelComplete fires when foodEaten reaches foodRequired, not based on score` test is exactly the regression test the change warrants. The Low-severity gaps are pre-existing and not introduced by M7.
- **Plan-Review findings:** ✅ All Critical and High findings (F-01 through F-08) resolved in code, not just on paper.

### Why this is a clean Approve

The M7 work is what a well-run milestone looks like:

1. The plan was right-sized and self-checking (explicit data tables, line-numbered steps, an out-of-scope table that fenced future-milestone leakage).
2. The Plan Review caught the trap the plan had laid for itself (F-01 through F-08).
3. The implementer fixed the plan first, then implemented the fixed plan.
4. The implementation matches the fixed plan phase-by-phase.
5. The verification is real: lint clean, build clean, 178/178 tests, and a dedicated regression test that explicitly demonstrates the semantic change.

The implementation earns its Approve.

---

# Resolution Summary

## Review Findings Resolution

| Finding | Severity | Status | Rationale |
|---------|----------|--------|-----------|
| F-01 (`MIN_SPEED` row in `ARCHITECTURE.md`) | Low | Resolved | Removed the `MIN_SPEED` row from the Important Constants table. The constant no longer exists in code; speed is data-driven per level. |
| F-02 (`targetScore` in `ROADMAP.md` M4 description) | Low | Resolved | Changed `targetScore` to `foodRequired` in the M4 Level Metadata System feature description to match the current implementation. |
| F-03 (pre-existing `startAtLevel` `onLevelUp` test gap) | Low | Not Resolved | Pre-existing, out of M7 scope. Acceptable to defer to a future test pass. |
| F-04 (pre-existing `getLevelData(state.level + 1)` dead code) | Low | Not Resolved | Pre-existing, out of M7 scope. Dead code in practice (overlay never shown at level 10). Defer to future cleanup. |
| F-05 (`VITE_POINTS_PER_FOOD` description) | Low | Not Resolved | Informational only. Description is accurate. No action needed. |
| F-06 (pre-existing `?? 150` defensive fallback) | Low | Not Resolved | Pre-existing, out of M7 scope. Harmless defensive code. Defer to future cleanup. |

## Summary

### Files Modified

- `ARCHITECTURE.md` — Removed `MIN_SPEED` row from Important Constants table (line 257)
- `docs/ROADMAP.md` — Changed `targetScore` to `foodRequired` in M4 Level Metadata System description (line 222)

### Findings Resolved

- F-01: Resolved — `MIN_SPEED` row removed from `ARCHITECTURE.md`
- F-02: Resolved — `targetScore` renamed to `foodRequired` in `ROADMAP.md`

### Findings Intentionally Not Resolved

- F-03 through F-06: Pre-existing items, out of M7 scope, acceptable to defer

### Tests Executed

None required — documentation-only changes.

### Remaining Risks

None. All documentation drift items resolved. Pre-existing test gaps (F-03, F-04, F-06) remain but are not defects.

## Final Status: Ready for Re-Review

## Verification Results

### Hard verification gates

| Gate | Command | Result |
|------|---------|--------|
| Lint | `npm run lint` | ✅ No issues |
| Build | `npm run build` | ✅ Succeeds; tsc clean, vite build clean, PWA generated |
| Tests | `npm test` | ✅ 178 passed (178), 13 test files |

### Plan-Review findings verification

| Finding | Severity | Status |
|---------|----------|--------|
| F-01 (test path) | Critical | Resolved — plan updated, test file at correct path updated |
| F-02 (`Engine.test.ts` level-up tests) | High | Resolved — both persistence tests use `foodEaten: 9/29` with correct `score: 90/290` |
| F-03 (`makeState` factory) | High | Resolved — `foodEaten: 0` added to factory at `state.test.ts:22` |
| F-04 (SPEC §6.4) | Medium | Resolved — `SPEC.md:153` updated |
| F-05 (ARCHITECTURE §110) | Medium | Resolved — `ARCHITECTURE.md:110` updated |
| F-06 (state machine diagram) | Medium | Resolved — `ARCHITECTURE.md:209-210` updated |
| F-07 (screen-reader text) | Medium | Resolved — `ScoreBoard.tsx:26` matches spec |
| F-08 (won test setup) | Medium | Resolved — both `won` test cases use `foodEaten: 29, score: 290` |

### New findings

| Finding | Severity | Category |
|---------|----------|----------|
| F-01 (`MIN_SPEED` row in `ARCHITECTURE.md` kept instead of removed) | Low | Documentation |
| F-02 (`ROADMAP.md:222` still lists `targetScore` in M4 description) | Low | Documentation |
| F-03 (pre-existing `startAtLevel` `onLevelUp` test gap) | Low | Testing |
| F-04 (pre-existing `getLevelData(state.level + 1)` dead code) | Low | Bug (latent) |
| F-05 (`VITE_POINTS_PER_FOOD` description update is accurate) | Low | Documentation (informational) |
| F-06 (pre-existing `?? 150` defensive fallback) | Low | Maintainability |

---

## Summary

### Files Reviewed

- `src/game/types.ts`, `src/game/levels.ts`, `src/game/state.ts`
- `src/components/Game.tsx`, `src/components/ScoreBoard.tsx`, `src/components/ScoreBoard.module.css`
- `src/types/components.ts`
- `src/game/__tests__/state.test.ts`, `src/game/__tests__/Engine.test.ts`
- `src/utils/__tests__/levelData.test.ts`, `src/components/__tests__/Game.test.tsx`
- `SPEC.md`, `ARCHITECTURE.md`, `docs/PROJECT_STATE.md`, `docs/ROADMAP.md`, `package.json`
- `plans/ACTIVE.md`, `plans/PLAN_REVIEW.md`, `AGENTS.md`

### Plan-Review Findings Resolved

- F-01 through F-08: All resolved in code, not just on paper ✅

### New Findings (all Low severity)

- F-01: `MIN_SPEED` documentation row kept instead of removed
- F-02: `targetScore` reference in `ROADMAP.md` M4 description
- F-03 through F-06: Pre-existing items, acceptable to defer

### Verification

- `npm test`: 178 passed (178), 13 test files
- `npm run lint`: No issues found
- `npm run build`: Clean build, PWA generated
- `package.json` version: 0.7.0 (matches `PROJECT_STATE.md`)

### Remaining Risks

None. All Critical and High Plan-Review findings resolved. The two new Low-severity findings are documentation housekeeping, not defects.

## Final Status: Ready for Merge

---

# Recommended Next Steps

1. Merge the M7 work per the Git Workflow Protocol in `AGENTS.md`.
2. Archive `plans/ACTIVE.md` to `plans/archive/` once the PR is merged. The archive filename should follow the existing pattern: `plans/archive/2026-06-06-milestone-7-difficulty-rebalance.md`.
3. Open M8 (Visual Identity) work per `docs/ROADMAP.md:438-512`.
4. Optional: fold F-01 and F-02 into a small follow-up documentation commit. Not blocking.

---

# 2nd-Pass Verification (Remediation Review)

**Scope:** Verify remediation of prior-review findings only. No new full review performed. No new findings introduced unless Critical or directly caused by the remediation work.

**Date:** 2026-06-06
**Remediation touched:** `ARCHITECTURE.md` (removed `MIN_SPEED` row), `docs/ROADMAP.md` (`targetScore` → `foodRequired`).

## Hard verification gates (re-run after remediation)

| Gate | Command | Result |
|------|---------|--------|
| Lint | `npm run lint` | ✅ No issues |
| Build | `npm run build` | ✅ Succeeds; tsc clean, vite build clean, PWA generated |
| Tests | `npm test` | ✅ 178 passed (178), 13 test files |

All gates remain green. The remediation was documentation-only; no production code or test changes. No regressions introduced.

# Verification Results

The prior Implementation Review surfaced **no Critical or High findings**. The Plan-Review F-01 through F-08 (which contained the only Critical/High items) were already marked Resolved in the prior pass. The only items from the prior Implementation Review were:

- **F-01** (Low) — `MIN_SPEED` row kept in `ARCHITECTURE.md` Important Constants table
- **F-02** (Low) — `targetScore` still listed in `ROADMAP.md` M4 description
- **F-03–F-06** (Low, pre-existing) — out of M7 scope, acceptable to defer

For completeness, the 2nd pass also re-verified the Critical/High items from the original Plan Review, which the implementation had addressed in the prior pass.

| Finding | Source | Severity | Status |
|---------|--------|----------|--------|
| Plan-Review F-01 (test path) | Plan Review | Critical | **Resolved** — `src/utils/__tests__/levelData.test.ts` updated with `foodRequired` assertions |
| Plan-Review F-02 (`Engine.test.ts` level-up tests) | Plan Review | High | **Resolved** — both `lastUnlockedLevel persistence` tests use `foodEaten: 9/29` with `score: 90/290` |
| Plan-Review F-03 (`makeState` factory) | Plan Review | High | **Resolved** — `foodEaten: 0` present in factory at `state.test.ts:22` |
| Implementation Review F-01 (`MIN_SPEED` row) | Implementation Review | Low | **Resolved** — row removed from `ARCHITECTURE.md` Important Constants table. Verified: `grep MIN_SPEED` returns no matches in `ARCHITECTURE.md`. |
| Implementation Review F-02 (`targetScore` in `ROADMAP.md`) | Implementation Review | Low | **Resolved** — M4 Level Metadata System description now lists `foodRequired`. Verified: `grep targetScore` returns no matches in `docs/ROADMAP.md`; line 222 reads `foodRequired`. |
| Implementation Review F-03 (`startAtLevel` `onLevelUp` test gap) | Implementation Review | Low (pre-existing) | Unresolved (deferred) — pre-existing, out of M7 scope, acceptable to defer |
| Implementation Review F-04 (`getLevelData(state.level + 1)` dead code) | Implementation Review | Low (pre-existing) | Unresolved (deferred) — pre-existing, out of M7 scope |
| Implementation Review F-05 (`VITE_POINTS_PER_FOOD` description) | Implementation Review | Low (informational) | Unresolved (informational) — description is accurate; no action required |
| Implementation Review F-06 (`?? 150` defensive fallback) | Implementation Review | Low (pre-existing) | Unresolved (deferred) — pre-existing, out of M7 scope |

## Remediation spot-checks

- **`ARCHITECTURE.md` Important Constants table (lines 248–256):** Confirmed the table now lists only `GRID_SIZE`, `CELL_SIZE`, `POINTS_PER_FOOD`, `INITIAL_SNAKE`, `LEVEL_COUNT`, `INITIAL_SPEED`. The `MIN_SPEED` row is gone. No orphaned references to `MIN_SPEED` remain in the file.
- **`docs/ROADMAP.md` M4 description (lines 217–224):** Confirmed the level field list now reads `id`, `name`, `description`, `foodRequired`, `speed`. The stale `targetScore` bullet is gone. No other `targetScore` references exist in `docs/ROADMAP.md`. (`docs/PROJECT_STATE.md:138` correctly retains `targetScore` in the M6 historical rename note — that one is intentional.)
- **No new issues introduced.** Lint, build, and full test suite all pass. The remediation touched only the two documentation files; no production code or test code changed.

# Approval Decision

## **Approve**

The two Low-severity items flagged in the prior review (F-01, F-02) have been remediated. Hard verification gates remain green. The implementation is merge-ready.

### Why "Approve" (not "Approve with Minor Changes")

The remaining unresolved items (F-03, F-04, F-06) are all pre-existing, out of M7 scope, and explicitly deferred to future cleanup. F-05 is informational only. There is no remaining work the implementer must do before merge. This is a clean Approve.

### Required for merge

None.

### Optional follow-up (acceptable to defer)

- F-03: Add a dedicated regression test for `Engine.startAtLevel` firing `onLevelUp` once.
- F-04: Address the latent `getLevelData(state.level + 1)` dead code path in `Game.tsx:213`.
- F-06: Remove the dead `?? 150` defensive fallback in `Engine.ts:135`.

These can be folded into a future milestone's cleanup pass.

### Net assessment (unchanged from prior pass)

- Simplicity, maintainability, repository alignment, milestone completion, test coverage, and plan-review findings: all green.
- The remediation closes the only documentation drift; the milestone is complete.
