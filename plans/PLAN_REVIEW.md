# Plan Review: Milestone 7 — Difficulty Rebalance

**Reviewer:** Staff Engineer (Plan Review)
**Plan under review:** `plans/ACTIVE.md` (Milestone 7 — Difficulty Rebalance, Draft, 2026-06-06)
**Source documents:** `ROADMAP.md`, `AGENTS.md`, `ARCHITECTURE.md`, `SPEC.md`, `docs/PROJECT_STATE.md`, `package.json`, `src/game/state.ts`, `src/game/types.ts`, `src/game/levels.ts`, `src/game/Engine.ts`, `src/game/__tests__/state.test.ts`, `src/game/__tests__/Engine.test.ts`, `src/utils/__tests__/levelData.test.ts`, `src/components/Game.tsx`, `src/components/ScoreBoard.tsx`, `src/components/ScoreBoard.module.css`, `src/types/components.ts`
**Review date:** 2026-06-06

---

# Overall Assessment

## Strengths

1. **Right-sized for the milestone.** Two features (Food Objective System, Speed Curve Rebalance) map 1:1 to ROADMAP M7. No new abstractions, no new packages, no new files. Honours `AGENTS.md`'s "prefer simple solutions" and "avoid premature abstractions" rules.
2. **Minimal blast radius.** The change is one new state field (`foodEaten`), one data field rename (`targetScore` → `foodRequired`), and a data-table swap in `levels.ts`. The reducer change is one condition swap. No new statuses, no new actions, no new reducer cases.
3. **Engine and persistence are correctly identified as zero-change.** Phase 3 analysis is accurate: `Engine.ts:134-135` reads `getLevelData(state.level).speed` per tick, so the new speed table is picked up automatically. `Engine.dispatch()` sound and persistence wiring is driven by `score`/`level` deltas and status transitions, which are unaffected. `lastUnlockedLevel` from M6 continues to work because it is updated on the same status transitions that the new system preserves.
4. **Honest bottom-up phasing.** Six phases (types → reducer → engine review → UI → tests → docs) with explicit per-phase verification. Every intermediate commit is compilable (or breaks the build by design in Phase 1, which is the right test of the type change).
5. **Strong out-of-scope table.** HUD redesign, overlay redesign, endless mode, food variants, difficulty selection, statistics, achievements, playtesting, obstacle layout changes, score formula, grid size, mobile/desktop packaging are all explicitly fenced. Future-milestone leakage is zero.
6. **Concrete data tables with exact values.** New `foodRequired` and `speed` values are tabulated for all 10 levels, matching `ROADMAP.md:382-416` character-for-character. The implementer cannot drift from the spec.
7. **Score semantics are preserved correctly.** The plan keeps score accumulation per food, score carry-over between levels (via `CONTINUE_GAME`'s `...state` spread), and high-score tracking. `foodEaten` is per-level only. This is the cleanest possible factoring.
8. **Line-numbered steps.** Phase steps reference specific line numbers in the source (`state.ts:56-104`, `types.ts:10-17`, etc.). This is a Staff-level pattern: an AI agent can verify each step before claiming completion. I verified all references against the current source — every line range is accurate.
9. **Test count awareness.** Plan states the baseline is 173 and targets 173+. `npm test` confirms 173 passing, 13 test files, distributed as documented in `SPEC.md:386-399`.
10. **No ADR needed.** This is a behavior change (progression condition), not an architecture redesign. Skipping an ADR is correct.

## Weaknesses

1. **Phase 5 path error.** Phase 5 lists `src/game/__tests__/levelData.test.ts` as a target file. The actual file is at `src/utils/__tests__/levelData.test.ts` (verified via `find`). The test imports from `../levelData`, which is a one-line re-export at `src/utils/levelData.ts:1` (`export { LEVELS as default, getLevelData, generateObstacles } from '../game';`). The data lives in `src/game/levels.ts`, so the rename in `src/game/levels.ts` will still propagate via the re-export — but the test file the implementer must edit is in `src/utils/`. An AI agent following the plan literally will either (a) edit the wrong file (with no effect on tests) or (b) create a new file at the wrong path and orphan the real one.
2. **Phase 5c is wrong about `Engine.test.ts`.** The plan says: "No structural changes expected — the engine's behavior is driven by the reducer." This is incorrect. `Engine.test.ts:179-206` (`continueGame` describe block) sets state via `engine.setState({ ...getInitialState(), status: 'levelComplete', level: 1, score: 50 })` and asserts the transition. That test will still pass (it bypasses the reducer's level-up trigger by setting `status: 'levelComplete'` directly). But the `lastUnlockedLevel` persistence tests at `Engine.test.ts:248-301` use a different pattern: they set `status: 'playing'` with a `score` and `food` setup that triggers a level-up via `testDispatch({ type: 'MOVE_SNAKE' })`. After the change, `score: 40` and one food eaten at level 1 will not reach `foodRequired: 10`, so `levelComplete` will not fire and the test will fail. The plan's blanket "no structural changes expected" is misleading; the level-up and won tests in `Engine.test.ts` need the same kind of setup updates the plan prescribes for `state.test.ts`.
3. **`state.test.ts` `makeState` helper is not called out.** `state.test.ts:6-24` builds a default `GameState` with explicit fields. After `GameState` gains `foodEaten: number`, `makeState` will fail TypeScript compilation (missing required field). The plan implies this via "Tests that check `initial state` shape — add `foodEaten: 0`" but does not explicitly say to add `foodEaten: 0` to the `makeState` helper. This is the most common omission a hurried AI agent will make — fix the explicit field assertions and forget the factory.
4. **Documentation drift in SPEC.md §6.4 (Win Condition).** The plan updates §6.2 (level progression) and §6.3 (level metadata) but does not call out §6.4, which currently reads: "When level `LEVEL_COUNT` target score is reached (`LEVEL_COUNT * 50` points)" (`SPEC.md:140`). This sentence becomes factually wrong after the change. The win condition is now `level === LEVEL_COUNT && foodEaten >= foodRequired`.
5. **Documentation drift in ARCHITECTURE.md line 110.** The plan updates the speed-ramp line at `ARCHITECTURE.md:154` but misses the parallel reference at `ARCHITECTURE.md:110`: "**Dynamic speed** based on current level (150ms → 60ms)". This will go stale.
6. **Documentation drift in ARCHITECTURE.md state machine diagram.** The plan updates the Level System description and Important Constants table, but not the state machine diagram at `ARCHITECTURE.md:199-224`. Two lines are now wrong: "SCORE REACHES TARGET (levels 1-9) → LEVELCOMPLETE" (line 209) and "LEVEL 10 COMPLETE → WON" (line 210) implicitly reference the score-based trigger. They should read "FOOD OBJECTIVE REACHED" and "FOOD OBJECTIVE REACHED (level 10)".
7. **Phase 4b screen-reader text format is unspecified.** The plan says: "Update the screen-reader-only text to include food progress." The current `aria-live="assertive"` block (`ScoreBoard.tsx:21-24`) reads `{score > 0 && \`Score: ${score}. \`}Level {level}.`. The plan does not specify where the food progress announcement goes, what it says, or whether the `score > 0` guard should be mirrored as `foodEaten > 0`. Minor ambiguity.
8. **Plan does not address the "won" test setup explicitly.** `state.test.ts:245-260` triggers win at level 10 by setting `score: 490` and moving the snake to eat food (which pushes `score` to 500). After the change, this requires `foodEaten: 29` and the resulting `score: 290`. The plan's Phase 5b guidance is generic ("Tests that trigger `won` similarly") but does not enumerate the two test cases (the `won` status test and the `high score on win` test) that need this specific update.

## Major Risks

1. **Wrong-file edit (F-01).** The path error in Phase 5 will result in either (a) the real test file remaining unedited (test failures not fixed, plan appears to complete but tests fail) or (b) a new file created at the wrong path (orphan test that does not run). Severity: Critical because it is a silent failure mode. An AI agent following the plan step-by-step will not notice the discrepancy unless it grep-checks the file path first.
2. **Test setup incompatibilities (F-02, F-03, F-08).** The `state.test.ts` `makeState` factory, the level-up tests in `state.test.ts` (lines 210-294), the won tests in `state.test.ts` (lines 245-277), the lastUnlockedLevel tests in `state.test.ts` (lines 406-481), the lastUnlockedLevel persistence tests in `Engine.test.ts` (lines 248-301), and the `Engine.test.ts:179-206` `continueGame` test all reference score-based setups or assume the absence of `foodEaten`. None of them will pass with the new system unless updated. The plan's generic guidance covers most of this, but the `Engine.test.ts` guidance is wrong ("no structural changes expected"), and the `makeState` factory update is implicit. Severity: High because the test suite is one of the Definition-of-Done gates, and silent failures during Phase 5 will cascade into Phase 6 (docs claim 173+ tests passing; in reality the suite is broken).
3. **Documentation drift across three files (F-04, F-05, F-06).** The plan updates SPEC.md §4, §6.2, §6.3, §10.4, §13 and ARCHITECTURE.md §150-155, §154, §249-256. It misses SPEC.md §6.4, ARCHITECTURE.md §110, and ARCHITECTURE.md §199-224 (state machine diagram). `AGENTS.md`'s "Documentation Consistency" rule ("Keep SPEC.md, ARCHITECTURE.md, PROJECT_STATE.md, and ROADMAP.md consistent with one another") is partially violated. Severity: Medium because the drift is cosmetic and recoverable, but it is exactly the kind of inconsistency `AGENTS.md` warns against.

## Recommended Changes

1. **Fix the path error in Phase 5 (F-01).** Change `src/game/__tests__/levelData.test.ts` to `src/utils/__tests__/levelData.test.ts` in the Phase 5 file list and in any step that references the file. The data lives in `src/game/levels.ts`; the test consumes it via the `src/utils/levelData.ts` re-export.
2. **Add an explicit `makeState` factory update step in Phase 5b (F-03).** Add a step before the test-case updates: "Add `foodEaten: 0` to the `makeState` factory at `src/game/__tests__/state.test.ts:6-24`. This is required to satisfy the new `GameState` type."
3. **Replace Phase 5c's "no structural changes expected" with the correct guidance (F-02).** Rewrite Phase 5c to: "`Engine.test.ts` has the same test-setup pattern as `state.test.ts`. The `lastUnlockedLevel persistence` describe block (`Engine.test.ts:243-301`) sets `score: 40` and `score: 490` to trigger `levelComplete` and `won` respectively. After the change, these setups must use `foodEaten: 9` (for level 1) and `foodEaten: 29` (for level 10), with corresponding `score: 90` and `score: 290`. The `continueGame` describe block (`Engine.test.ts:165-207`) uses `setState` to set `status: 'levelComplete'` directly and is unaffected."
4. **Add SPEC.md §6.4 to the Phase 6a update list (F-04).** Replace `LEVEL_COUNT * 50` with "when the level 10 food objective is reached". This is a one-line change in the same file as the §6.2 update.
5. **Add ARCHITECTURE.md §110 to the Phase 6b update list (F-05).** Replace "150ms → 60ms" with "150ms → 100ms" in the "Dynamic speed based on current level" bullet. The plan already updates line 154 (speed ramp); line 110 is the parallel reference in the Game Loop Pattern section.
6. **Add the state machine diagram update to Phase 6b (F-06).** Update `ARCHITECTURE.md:209-210` to use the food-objective terminology: "FOOD OBJECTIVE REACHED (levels 1-9) → LEVELCOMPLETE" and "LEVEL 10 FOOD OBJECTIVE REACHED → WON". The state machine diagram is referenced by new contributors; keeping it accurate matters more than any other doc section.
7. **Specify the screen-reader announcement format in Phase 4b (F-07).** Add a sentence: "Update the screen-reader block to read: `{score > 0 && \`Score: ${score}. \`}{foodEaten > 0 && \`Food: ${foodEaten} of ${foodRequired}. \`}Level {level}.`" Mirrors the existing `score > 0` guard pattern.
8. **Tighten Phase 5b's "won" guidance (F-08).** Add a step: "Update the two `won` test cases at `state.test.ts:245-260` and `state.test.ts:262-277` to set `foodEaten: 29` (one food away from level 10's `foodRequired: 30`) and `score: 290` instead of `score: 490`."

---

# Detailed Findings

## Critical

### F-01. Wrong test file path in Phase 5

- **Severity:** Critical
- **Description:** Phase 5 (`/Users/adityasingh/Documents/snake-run/plans/ACTIVE.md:239-287`) lists `src/game/__tests__/levelData.test.ts` in the Phase 5 file list (line 247) and in the Phase 5a sub-step (line 251). The actual test file is at `src/utils/__tests__/levelData.test.ts`. Verified via `find` and `Read`. The data source (`src/game/levels.ts`) is correctly identified, and the re-export (`src/utils/levelData.ts:1`) will propagate the rename transparently — but the test assertions live in the `src/utils/` file. An AI agent following the plan literally will:
  - (a) Try to edit `src/game/__tests__/levelData.test.ts` (does not exist) — TypeScript/build errors or silent no-op.
  - (b) Or use Glob/LS to discover the right file — possible, but not guaranteed.
  - The plan's other file references in Phase 5 (`state.test.ts`, `Engine.test.ts`) are correct. Only `levelData.test.ts` has the wrong path.
- **Recommendation:** Change the Phase 5 file list entry to `src/utils/__tests__/levelData.test.ts`. Change any sub-step that references the file. Add a one-line note in Phase 5 explaining that `src/utils/levelData.ts` is a re-export of `src/game/levels.ts`, so the test updates are independent of the data-layer change in Phase 1.

## High

### F-02. `Engine.test.ts` level-up tests use score-based setup that will silently fail

- **Severity:** High
- **Description:** `Engine.test.ts:248-301` (the `lastUnlockedLevel persistence` describe block) uses `engine.setState({ ...getInitialState(), status: 'playing', level: 1, score: 40, ... })` followed by `engine.testDispatch({ type: 'MOVE_SNAKE' })` to trigger `levelComplete` and assert persistence. After the change, `score: 40` is irrelevant to the level-up condition; the trigger is now `foodEaten >= foodRequired`. The test sets `foodEaten: 0` (from `getInitialState()`), and one food eaten yields `foodEaten: 1` — nowhere near level 1's `foodRequired: 10`. `MOVE_SNAKE` will not transition to `levelComplete`; the assertion will fail.
  - Similarly, `Engine.test.ts:263-281` (won persistence) sets `score: 490` and `level: 10`. After the change, `foodEaten: 0` and one food eaten = `foodEaten: 1`, not the 30 required for level 10 win. Test will fail.
  - The plan's Phase 5c says "Tests that verify level-up callbacks remain valid (conditions unchanged)" and "No structural changes expected — the engine's behavior is driven by the reducer." Both statements are wrong. The engine test setup *is* the issue: it does not go through the reducer to reach the level-up state; it relies on the `MOVE_SNAKE` reducer call to trigger the transition, and that reducer call now has a different condition.
- **Recommendation:** Rewrite Phase 5c to: "Update the `lastUnlockedLevel persistence` describe block in `src/game/__tests__/Engine.test.ts:243-301`. Replace the score-based setups with foodEaten-based setups. For `levelComplete` at level 1, set `foodEaten: 9` and `score: 90` (one food away from `foodRequired: 10`). For `won` at level 10, set `foodEaten: 29` and `score: 290`. For `gameover`, the existing setup (`Engine.test.ts:248-261`) is unaffected because the collision path is independent of `foodEaten`. The `continueGame` describe block (`Engine.test.ts:165-207`) sets `status: 'levelComplete'` directly via `setState` and is unaffected. The `startAtLevel` describe block (`Engine.test.ts:209-241`) does not trigger level-up and is unaffected. The `sound callback wiring` describe block (`Engine.test.ts:109-163`) is unaffected."

### F-03. `state.test.ts` `makeState` factory needs explicit `foodEaten: 0`

- **Severity:** High
- **Description:** `state.test.ts:6-24` defines a `makeState` helper that returns a partial `GameState`. The returned object explicitly enumerates every field except `foodEaten`. After `GameState` gains `foodEaten: number` as a required field (`types.ts:19-30` will be updated in Phase 1), the `makeState` factory will fail TypeScript compilation with "Property 'foodEaten' is missing in type '{...}'". The plan's Phase 5b says: "Tests that check `initial state` shape — add `foodEaten: 0`". This is generic and could be interpreted as "update the explicit field assertions in each `it()` block" without touching the factory. The factory is the higher-leverage fix because every test that uses `makeState()` flows through it.
- **Recommendation:** Add a new step at the start of Phase 5b: "Add `foodEaten: 0` to the `makeState` factory at `src/game/__tests__/state.test.ts:6-24`. This is required to satisfy the new `GameState` type and is the single change that makes 24+ existing tests compile." Then the existing per-test guidance applies on top.

### F-04. SPEC.md §6.4 (Win Condition) is not in the Phase 6a update list

- **Severity:** Medium
- **Description:** `SPEC.md:140` reads: "When level `LEVEL_COUNT` target score is reached (`LEVEL_COUNT * 50` points)". After the change, the win condition is no longer score-based. This sentence is factually wrong. The plan's Phase 6a updates §6.2, §6.3, §10.4, §13 but does not list §6.4.
- **Recommendation:** Add a step to Phase 6a: "**Section 6.4 (Win Condition, lines 139-144):** Replace `LEVEL_COUNT * 50` with a food-objective-based description: 'When the level 10 food objective is reached (30 food eaten at level 10)'. Keep the status-change and high-score-save behavior unchanged."

## Medium

### F-05. ARCHITECTURE.md line 110 ("Dynamic speed") is not in the Phase 6b update list

- **Severity:** Medium
- **Description:** `ARCHITECTURE.md:110` reads: "**Dynamic speed** based on current level (150ms → 60ms)". After the change, the upper bound is 100ms, not 60ms. The plan updates `ARCHITECTURE.md:154` (speed ramp) but misses line 110. Two parallel references to the speed range will diverge.
- **Recommendation:** Add a step to Phase 6b: "**Game Loop Pattern section (line 110):** Replace `150ms → 60ms` with `150ms → 100ms`. Mirrors the update to the speed ramp line at 154."

### F-06. ARCHITECTURE.md state machine diagram is not in the Phase 6b update list

- **Severity:** Medium
- **Description:** `ARCHITECTURE.md:199-224` contains a state machine diagram. Line 209 reads: "SCORE REACHES TARGET (levels 1-9) → LEVELCOMPLETE". Line 210 reads: "LEVEL 10 COMPLETE → WON". After the change, the trigger is food-based, not score-based. The diagram is the most-referenced artifact in ARCHITECTURE.md for new contributors; keeping it accurate matters.
- **Recommendation:** Add a step to Phase 6b: "**State Machine diagram (lines 209-210):** Replace `SCORE REACHES TARGET (levels 1-9) → LEVELCOMPLETE` with `FOOD OBJECTIVE REACHED (levels 1-9) → LEVELCOMPLETE`. Replace `LEVEL 10 COMPLETE → WON` with `FOOD OBJECTIVE REACHED (level 10) → WON`."

### F-07. Phase 4b screen-reader text format is unspecified

- **Severity:** Low
- **Description:** The plan says: "Update the screen-reader-only text to include food progress." The current `aria-live="assertive"` block (`ScoreBoard.tsx:21-24`) reads `{score > 0 && \`Score: ${score}. \`}Level {level}.`. The plan does not specify the new format, the placement of the food progress sentence, or whether the existing `score > 0` guard should be mirrored as `foodEaten > 0`. An implementer has to invent the format.
- **Recommendation:** Tighten the Phase 4b step to: "Update the screen-reader block at `src/components/ScoreBoard.tsx:21-24` to read: `{score > 0 && \`Score: ${score}. \`}{foodEaten > 0 && \`Food: ${foodEaten} of ${foodRequired}. \`}Level {level}.` Mirrors the existing `score > 0` guard pattern so the announcement is silent on initial render."

### F-08. Phase 5b "won" test updates are generic

- **Severity:** Low
- **Description:** The plan's Phase 5b guidance is correct in principle ("Tests that trigger `won` similarly") but does not enumerate the two specific test cases in `state.test.ts` that trigger won (lines 245-260 and 262-277). Both set `score: 490` and `level: 10` and move the snake to eat food at (10,10) to push score to 500. After the change, they need `foodEaten: 29` and `score: 290` (so eating the 30th food triggers win). A hurried implementer may miss the second test.
- **Recommendation:** Add a step to Phase 5b: "Update the two `won` test cases at `src/game/__tests__/state.test.ts:245-260` and `:262-277` to set `foodEaten: 29` (one food away from level 10's `foodRequired: 30`) and `score: 290` instead of `score: 490`. The `MOVE_SNAKE` dispatch will increment both fields and trigger the level-10 win path."

## Low

### F-09. Plan does not mention the `lastUnlockedLevel` accumulator test

- **Severity:** Low
- **Description:** `state.test.ts:461-480` is a multi-step test that triggers two `MOVE_SNAKE` and one `CONTINUE_GAME` to verify `lastUnlockedLevel` accumulates correctly across multiple level completions. After the change, the first `MOVE_SNAKE` will not trigger levelComplete (because `foodEaten: 0` and one food eaten = `foodEaten: 1`, not 10). The test will fail. The plan's generic guidance covers it, but it is worth calling out specifically because the test is the only one in the file that exercises the multi-step accumulator behavior.
- **Recommendation:** Add a step to Phase 5b: "Update the accumulator test at `src/game/__tests__/state.test.ts:461-480` to set `foodEaten: 9` and `score: 90` (instead of `score: 40`) so the first `MOVE_SNAKE` triggers `levelComplete` and `lastUnlockedLevel` increments from 1 to 2."

### F-10. Plan does not mention updating `Engine.test.ts:187-191` `setState` call

- **Severity:** Low
- **Description:** `Engine.test.ts:187-191` uses `engine.setState({ ...getInitialState(), status: 'levelComplete', level: 1, score: 50 })`. After the change, `getInitialState()` will include `foodEaten: 0` (from the Phase 2a update), so the `...getInitialState()` spread will include it. The setState call does not need updating. The plan correctly does not call this out, but a thorough implementation review would verify this. Verified manually: no update needed.
- **Recommendation:** None (already correct). Add a note to Phase 5c verifying that `Engine.test.ts:187-191` and `Engine.test.ts:218-223` use `...getInitialState()` and are automatically covered by the Phase 2a `getInitialState()` change.

---

# Handoff Assessment

## Phase Structure

**Rating: Good.**

Six phases, logical bottom-up order. The "break the build by design" pattern in Phase 1 (type changes with no consumer update) is a deliberate TDD-style red step that verifies the type change is real. Phase 2 restores the build by updating the consumer. This is a Senior-level pattern and is correctly described.

The `Phase 3: Engine Review` step is unusual but valuable — it explicitly confirms zero changes are needed in `Engine.ts` and documents the reasoning. This pre-empts an over-zealous implementer who might add unnecessary code to the engine.

The `Phase 6: Documentation Updates` step is appropriately placed at the end. Documentation updates are an integration step that benefits from a working code state.

## Task Decomposition

**Rating: Mostly Good.**

Each step is small, verifiable, and references a specific line range. The line numbers I verified against the current source are accurate (`state.ts:9-24`, `state.ts:56-104`, `state.ts:106-125`, `state.ts:127-142`, `types.ts:10-17`, `types.ts:19-30`, `Game.tsx:153`, `components.ts:20-25`). The `levelData.test.ts` path is the one error (F-01).

Phase 5 (tests) is the weakest decomposition. The `state.test.ts` update guidance is generic; specific test cases that need updating are not enumerated. Phase 5c is factually wrong about `Engine.test.ts` (F-02).

## Verification Strategy

**Rating: Good.**

Each phase ends with explicit verification:
- Phase 1: `npm run build` (expected to fail).
- Phase 2: `npm run build`, `npm run lint`.
- Phase 3: Manual play-test.
- Phase 4: `npm run build`, `npm run lint`, visual check.
- Phase 5: `npm test`, `npm run build`, `npm run lint`.
- Phase 6: `git diff` review.

The `npm test` gate in Phase 5 is the most important verification — it catches all the test setup incompatibilities (F-02, F-03, F-08, F-09). The plan correctly states "Expected test count: 173+ (same or slightly more due to new foodEaten tests)". I verified the baseline of 173 via `npm test`.

## Definition of Done

**Rating: Good, with one reword needed.**

11 explicit bullets, mostly concrete. DoD bullet 9 is good: "No new architectural abstractions, packages, or framework additions introduced. Existing state machine shape preserved; one new state field (`foodEaten`) added and two data fields renamed (`targetScore` → `foodRequired`)." This is accurate and a model for future milestone plans.

DoD bullet 11 ("`package.json` version bumped to `0.7.0`") is good. Verified `package.json:4` is currently `0.6.0`.

DoD bullets 6-8 (lint, build, test gates) are the right gates. The plan does not state a specific test count target beyond "173+"; a tighter statement would be "All existing 173 tests pass + 3+ new `foodEaten` tests added (counter increment, level-up trigger, reset behavior)."

## AI-Agent Execution Readiness

**Rating: At risk.**

The plan is detailed enough that an AI agent could execute it end-to-end, *if* the implementer double-checks the test file path (F-01) and understands that the Engine.test.ts and state.test.ts updates are non-trivial (F-02, F-03, F-08, F-09). The current text of Phase 5 is generic enough to allow an implementer to "complete" Phase 5 without actually fixing the test setups, because:

- Phase 5b says "Replace score-based setup" generically.
- Phase 5c says "no structural changes expected" (wrong).
- The factory update for `makeState` is implicit.

The `npm test` gate will catch the failures, but only if the implementer runs `npm test` and reads the failure output carefully. A more defensive plan would include a Phase 5 verification sub-step: "Run `npm test` and confirm that the test names that previously asserted `score >= targetScore` (specifically: 'transitions to levelComplete when score reaches target', 'sets won status when level 10 is completed', 'preserves high score on levelComplete', 'sets lastUnlockedLevel = level + 1 on levelComplete', 'accumulates correctly across multiple level completions', plus the three `Engine.test.ts` lastUnlockedLevel persistence tests) now pass with the foodEaten-based setup."

---

# Final Recommendation

**Approve with Minor Changes.**

The plan is well-conceived, tightly scoped, and aligned with the project's principles (small changes, simple solutions, maintainable code, playable progress). The implementation strategy is sound. The new data tables are correct. The phase ordering is right. The Definition of Done is appropriate.

The blocking issues are:

1. **F-01** (Critical): Wrong test file path in Phase 5. A one-line fix.
2. **F-02** (High): Phase 5c is factually wrong about `Engine.test.ts`. Needs a rewrite of one paragraph.
3. **F-03** (High): `state.test.ts` `makeState` factory update is implicit. Needs a one-line addition.
4. **F-04, F-05, F-06** (Medium): Three documentation sections are missed. Each is a one-line addition to Phase 6a/6b.
5. **F-07, F-08, F-09, F-10** (Low): Minor clarifications.

None of these require redesign. All are small, localized corrections. After these are applied, the plan is ready to execute with high confidence that the next AI agent will:
- Edit the correct test files.
- Update the correct test setups.
- Produce a passing test suite of 173+ tests.
- Update the correct documentation sections.
- Bump the package.json version.
- Produce a consistent documentation set across SPEC.md, ARCHITECTURE.md, PROJECT_STATE.md, and ROADMAP.md.

The plan honors AGENTS.md's "small changes, simple solutions, maintainable code, playable progress" principles. It does not introduce new abstractions, packages, or framework changes. It is a model for future behavior-change milestones.
