# Plan Review — Milestone 13.1: Visual Lane Redesign

**Plan under review:** `plans/ACTIVE.md` (Milestone 13.1)
**Reviewer role:** Staff Engineer
**Date:** 2026-06-11
**Baseline:** v0.13.0 (M13 complete), **426 unit tests passing across 26 test files** (verified via `npm test -- --run`)

---

# Overall Assessment

## Strengths

- **Roadmap alignment is direct and correct.** M13.1 is the explicit next item in `docs/ROADMAP.md` §"Current Sequence." The plan is the realization of `docs/prd/PRD_M13_1.md` (v2.0, "Approved For Planning"). The "depends on M13, blocks M13.5" chain is correct. The PRD's product goal ("within 5 seconds, a first-time player must understand there are 3 lanes") is preserved as the success criterion.

- **Architecture alignment is correct.** The plan reuses the existing engine, Board, Cell, and CSS Module structure exactly as `ARCHITECTURE.md` documents them. The runner-context props (`isLaneColumn`, `isActiveLane`, `runnerLane`) follow the same optional-prop pattern as existing runner fields (`wrapAround`, `portals`, `isPortal`). The plan correctly avoids restructuring the DOM or grid size — Phase 0's "Architecture Overview" explicitly commits to "pure CSS + props, no structural DOM changes," which is the simplest approach that satisfies the PRD.

- **Scope discipline is exemplary.** The "Non-Goals" list mirrors the PRD's non-goals one-for-one. The "Also Out of Scope" list correctly defers board scroll/camera effects (M13.5 or M14), RunnerHUD redesign, RunnerGameOver redesign, course generation, and any non-runner mode changes. The single page of in-scope items is appropriately narrow.

- **The `=== false` guard on `isLaneColumn` is correctly emphasized.** Phase 1e explicitly notes: "use `=== false` (not `!isLaneColumn`) so that classic mode (where `isLaneColumn` is `undefined`) does NOT get the `.nonLaneColumn` class." This is the kind of subtle correctness detail that prevents classic-mode regression. The plan also correctly calls this out in Phase 2's Risks section.

- **The data-runner attribute pattern is consistent with existing conventions.** Phase 2c adds `data-runner="true"` to mirror the existing `data-wrap-around` pattern at `Board.tsx:39` and `Board.module.css:12-14`. This is a clean way to scope runner-specific board-level styling without affecting classic mode.

- **The bug fix in Phase 3 is correct in intent.** The PRD §10 ("Food spawn process: Step 1 select lane, Step 2 validate occupancy, Step 3 spawn at lane center") is violated by `state.ts:131`, which uses the generic `spawnFood()`. The course generator uses `spawnRunnerFood()` correctly. The plan correctly identifies this inconsistency and proposes the right fix.

- **Documentation updates are explicit and complete.** Phase 6 lists the specific sections to update in SPEC.md (§20.2, §20.5), ARCHITECTURE.md (component list, BoardProps), PROJECT_STATE.md (version, M13.1 entry), and ROADMAP.md (milestone sequence). The M13 review's "PROJECT_STATE.md drift" finding is implicitly addressed — the plan's Phase 6 will overwrite the v0.13.0 state to v0.13.1 with the new milestone entry.

- **CSS token usage is mostly aligned with the M8 token discipline.** The `.activeLane` color values (rgba(34, 197, 94, 0.08) and rgba(34, 197, 94, 0.15)) match the hex value of `--color-accent` (#22c55e) per `index.css`. The plan explicitly notes "These colors use CSS custom properties indirectly via hex values" — a reasonable middle ground that avoids introducing new alpha-channel variables.

- **Phase decomposition is clean.** 6 phases with explicit dependencies: 1 (props), 2 (CSS), 3 (bug fix), 4 (text removal), 5 (tests), 6 (docs). Each phase is independently verifiable. No phase requires code from a future phase.

- **Test plan is concrete and complete.** Phase 5 lists specific test files, test names, and assertions for both Cell (`Cell.test.tsx`) and Board (`Board.test.tsx`) and adds a state.test.ts test for the food-spawning lane constraint.

- **Risk register is honest and complete.** The "Player still doesn't understand lanes after visual redesign" risk is Medium/High and correctly identified as the core validation risk. The mitigation ("PRD's human test protocol — ask 4 questions, need 4/4 correct") is the right answer.

## Weaknesses

- **`spawnRunnerFood` is not exported from `src/game/runnerCourse.ts`.** Phase 3a instructs the implementer to "Import `spawnRunnerFood` from `'../runnerCourse'`... add to existing `import { generateRunnerCourse } from './runnerCourse'` line." However, the current `src/game/runnerCourse.ts:29` declares `spawnRunnerFood` as a local (non-exported) function. The import will fail at compile time. The plan must add a prerequisite step: "Add `export` keyword to `spawnRunnerFood` in `src/game/runnerCourse.ts`."

- **`spawnRunnerFood` has no existing tests.** Phase 3 Risks states: "The fix calls an existing, tested function (`spawnRunnerFood`)." This claim is false. There is no `runnerCourse.test.ts` file (verified by `ls` on `src/game/__tests__/` and `find` for `*.test.*` across `src/`). The only game-tests are: `Engine.test.ts`, `achievements.test.ts`, `levelValidation.test.ts`, `profile.test.ts`, `reachability.test.ts`, `state.test.ts`, `statistics.test.ts`. The fix relies on `spawnRunnerFood` working correctly; if it regresses, the bug fix silently breaks. A new `runnerCourse.test.ts` (or at least a test for `spawnRunnerFood`'s lane-constraint invariant) should be added.

- **Test baseline count is wrong (Phase 5 expected text).** The plan's Phase 5 expected text says: "All tests pass with no regressions. New test count should be 415 + new tests from this milestone." The actual live count is **426** tests across 26 test files (verified by `npm test -- --run`). PROJECT_STATE.md is also stale at 415. Phase 1's verification checklist ("All 426 existing tests still pass") is correct, but the Phase 5 expected text and the DoD's "All tests pass" need a specific number to be unambiguous. Recommend updating to 426 throughout, or removing the count and adding "Verify baseline count via `npm test -- --run` before starting."

- **The `.laneColumn` CSS class is empty.** Phase 2a adds three CSS classes: `.laneColumn`, `.nonLaneColumn`, `.activeLane`. The `.laneColumn` block contains only a comment and no rules. The class is then added to lane-column cells in `Cell.tsx` but produces no visual effect (the visible "lane" appearance comes from inheriting the base `.cell` border, which all cells have). This is dead code. A simpler approach: drop `.laneColumn` entirely, and only apply `.nonLaneColumn` (or `.activeLane` when applicable). The plan should remove the empty class and the corresponding `if (isLaneColumn) className += ` ${styles.laneColumn}`;` line in Cell.tsx, replacing with `if (isActiveLane) className += ` ${styles.activeLane}`;`.

- **Hardcoded rgba values in `.activeLane` instead of CSS variable references.** Phase 2a uses `rgba(34, 197, 94, 0.08)` and `rgba(34, 197, 94, 0.15)`. The M8 milestone established CSS token discipline (`--color-accent`, `--color-accent-soft`, etc.) per `src/index.css`. The current `index.css` defines colors as hex values, not as separate `*-rgb` channel variables, so direct `var(--color-accent)` won't produce `rgba()`. Options: (a) accept the hex values (current plan) with a comment noting the limitation, (b) add `--color-accent-rgb: 34, 197, 94` to `index.css` and use `rgba(var(--color-accent-rgb), 0.08)`, or (c) use a translucent overlay div. Option (a) is acceptable for M13.1; option (b) is cleaner long-term. Recommend keeping (a) for now and noting the token-extension path in Phase 6.

- **The plan does not address a test for the runner `MOVE_SNAKE` food-spawn path in the integrated system.** The Phase 3b test calls `gameReducer` directly with `MOVE_SNAKE`. This is a unit test. An integration test that mounts `RunnerGame` and verifies food respawns on a lane column after eating would catch regressions that the unit test misses (e.g., if `RunnerGame.tsx` is wired to bypass the reducer). For M13.1, the unit test is sufficient. Note this for future milestones.

- **The plan's "data-runner" attribute is added to the Board, but the board-level CSS (`.board[data-runner="true"]`) only sets `background: var(--color-board-bg)` — which is already the default for `.board`.** The block in Phase 2c has no actual visual effect. Either remove the data-runner attribute and the CSS block, or use the data attribute to actually differentiate the runner board (e.g., different border color, different glow). Recommend either removing the dead code or adding an actual visual distinction (e.g., a different border color for runner mode to reinforce the "this is a runner" message).

- **The plan does not address what happens to `state.test.ts`'s pre-existing flakiness.** PROJECT_STATE.md §"Known Technical Debt" item 1 documents a flaky test in `state.test.ts` ("Gold food timer expiry occasionally spawns gold instead of normal food due to non-deterministic RNG in `food.ts`"). The new test added by Phase 3b is unrelated to this flakiness (it uses `'normal'` food type, no timer). However, the implementer should be aware. Recommend adding a one-liner to Phase 5: "The pre-existing `state.test.ts` flakiness is unaffected — the new test uses `'normal'` food with `timer: -1`."

- **The plan does not include an `aria-label` update for the new lane visualization.** The PRD §17 ("Accessibility: Lane separators visible. Food distinguishable. Obstacle distinguishable.") and the existing `aria-label="Snake Run board"` on the Board could be enhanced to mention "Runner mode: 3-lane presentation." The plan does not address this. This is a minor accessibility polish, not a blocker.

- **The plan's Phase 1 line numbers (`~56-66` for Board.tsx, `101-105` for RunnerGame.tsx, `44-49` for RunnerGame.module.css) are rough estimates.** I verified against the live files: Board.tsx cell rendering is at lines 55-67 (close), RunnerGame.tsx text indicator is at lines 101-105 (exact), RunnerGame.module.css `.laneIndicator` is at lines 44-50 (close). The estimates are accurate enough, but the plan should say "verify line numbers against the current file before editing" to prevent stale guidance.

## Major Risks

1. **`spawnRunnerFood` is not exported; the plan's Phase 3a import will fail at compile time.** This is a blocker. The implementer will either discover the missing export and improvise, or get stuck. The plan must add a prerequisite step to Phase 3a: "Step 0: Add `export` keyword to `function spawnRunnerFood` in `src/game/runnerCourse.ts` (line 29)."

2. **`spawnRunnerFood` is not tested.** The plan claims it is tested; it is not. A regression in `spawnRunnerFood` (e.g., a future change that loosens the lane constraint) would silently break the M13.1 food-spawning fix. A new `runnerCourse.test.ts` with at least one test for the lane-constraint invariant (e.g., "spawnRunnerFood always returns a position with x in RUNNER_LANE_X") would prevent this.

3. **The empty `.laneColumn` class and the no-op `.board[data-runner="true"]` block are dead code.** They add complexity without visible effect. The plan should simplify the CSS to only include the actually-visible rules (`.nonLaneColumn`, `.activeLane`). The data-runner attribute can be retained for future styling, but the empty CSS block should be removed or replaced with an actual visual distinction.

## Recommended Changes

### Required (must apply)

1. **Add a prerequisite step to Phase 3a: export `spawnRunnerFood` from `src/game/runnerCourse.ts`.** Change `function spawnRunnerFood(...)` to `export function spawnRunnerFood(...)`. Update Phase 3a description to include this step.
2. **Add a new test file `src/game/__tests__/runnerCourse.test.ts`** with at least one test for `spawnRunnerFood`'s lane-constraint invariant. Example: "spawnRunnerFood always returns a position with x in [4, 10, 16]."
3. **Update test baseline count from 415 to 426 throughout the plan.** Phase 1 verification (already correct), Phase 5 expected text, and DoD. Verify the count with `npm test -- --run` before implementation.
4. **Simplify the CSS by removing the empty `.laneColumn` class and the no-op `.board[data-runner="true"]` block.** Or, if the data-runner attribute is retained for future use, add an actual visual distinction (different border color or glow) so the block is not dead code. The Phase 1e Cell.tsx logic can be simplified to `if (isLaneColumn === false) className += ` ${styles.nonLaneColumn}`; else if (isActiveLane) className += ` ${styles.activeLane}`;`.

### Recommended (should apply)

5. **Add a one-liner to Phase 5 about the pre-existing test flakiness:** "The pre-existing `state.test.ts` gold-food-timer flakiness (PROJECT_STATE.md §Known Technical Debt) is unaffected by M13.1 — the new test uses `'normal'` food with `timer: -1`."
6. **Note the line-number verification step:** Add to Phase 1's "Files to Change" intro: "Verify line numbers against the current file before editing. The estimates in this plan are accurate as of v0.13.0 but may drift."
7. **Consider adding a `runnerMode: boolean` field to `GameProfile` for future separation of high scores.** This is out of scope for M13.1 but flagged as a future consideration in Phase 6's documentation update.

### Optional (nice to have)

8. **Add an `aria-label` to the Board when in runner mode.** e.g., `aria-label={runnerLane !== undefined ? "Snake Run runner board — 3 lanes" : "Snake Run board"}`. Minor accessibility polish.
9. **Add a `data-runner` visual distinction to the board border** (e.g., `border: 2px solid var(--color-accent-soft);` in `.board[data-runner="true"]`). Reinforces the "this is a runner" message at a glance.
10. **Add a determinism check to the new `runnerCourse.test.ts`:** "Run `spawnRunnerFood` 100 times; verify all 100 results have x in RUNNER_LANE_X and y in [0, 19]." Strengthens the test coverage.

---

# Detailed Findings

## Finding 1 — `spawnRunnerFood` is not exported from `src/game/runnerCourse.ts` (Phase 3a)

- **Severity:** Critical
- **Description:** Phase 3a tells the implementer to "Import `spawnRunnerFood` from `'../runnerCourse'`... add to existing `import { generateRunnerCourse } from './runnerCourse'` line." However, the current `src/game/runnerCourse.ts:29` declares `spawnRunnerFood` as a local (non-exported) function. The import will fail at TypeScript compile time. The implementer will either get stuck or improvise by inlining the function, which would duplicate logic and defeat the purpose of the fix.
- **Recommendation:** Add a prerequisite step to Phase 3a: "Step 0: Add `export` keyword to `function spawnRunnerFood` in `src/game/runnerCourse.ts` (line 29). Change to `export function spawnRunnerFood(...)`." Then proceed with the import as written.

## Finding 2 — `spawnRunnerFood` is not tested (Phase 3 Risks)

- **Severity:** Critical
- **Description:** Phase 3 Risks states: "The fix calls an existing, tested function (`spawnRunnerFood`). The new food position is guaranteed to be on a lane column." This claim is false. There is no `runnerCourse.test.ts` file (verified by listing `src/game/__tests__/` and searching for `*runnerCourse*` across `src/`). The only game-test files are: `Engine.test.ts`, `achievements.test.ts`, `levelValidation.test.ts`, `profile.test.ts`, `reachability.test.ts`, `state.test.ts`, `statistics.test.ts`. The fix relies on `spawnRunnerFood` working correctly; if a future change loosens the lane constraint, the M13.1 bug fix silently breaks.
- **Recommendation:** Add a new test file `src/game/__tests__/runnerCourse.test.ts` with at least one test for `spawnRunnerFood`'s lane-constraint invariant. Example:
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
  Update Phase 3 Risks to remove the "existing, tested function" claim and add a Phase 3c step for the new test file.

## Finding 3 — Test baseline count is wrong (Phase 5, DoD)

- **Severity:** High
- **Description:** The plan's Phase 5 expected text says: "All tests pass with no regressions. New test count should be 415 + new tests from this milestone." The actual live count is **426 tests across 26 test files** (verified by `npm test -- --run`). PROJECT_STATE.md is also stale at 415 (the "Milestone 13 — Runner Prototype Validation" entry says "415 tests passing"). Phase 1's verification checklist ("All 426 existing tests still pass") is correct, but the Phase 5 expected text and the DoD's "All tests pass" need a specific number for clarity. Inconsistent references will confuse the implementer.
- **Recommendation:** Update the test count to 426 in Phase 5 expected text and DoD. If the count changes between plan approval and implementation, instruct the implementer to run `npm test -- --run` first and use the live count. Also update PROJECT_STATE.md's M13 entry to reflect the correct count (426, not 415).

## Finding 4 — `.laneColumn` CSS class is empty (Phase 2a)

- **Severity:** High
- **Description:** Phase 2a adds `.laneColumn` as a CSS class with no rules — just a comment. The class is then added to lane-column cells in `Cell.tsx` (Phase 1e). It produces no visual effect because the visible "lane" appearance comes from inheriting the base `.cell` border, which all cells have. This is dead code. The plan's intent is to mark lane columns with a class (e.g., for future styling or tests), but a CSS Module class with no rules is just noise.
- **Recommendation:** Drop `.laneColumn` entirely. Simplify Phase 1e's Cell.tsx logic to:
  ```tsx
  if (isLaneColumn === false) {
    className += ` ${styles.nonLaneColumn}`;
  } else if (isActiveLane) {
    className += ` ${styles.activeLane}`;
  }
  ```
  Remove the empty `.laneColumn` block from Phase 2a. This reduces the diff size and the test surface (no need to test for a no-op class).

## Finding 5 — `.board[data-runner="true"]` CSS block is a no-op (Phase 2c)

- **Severity:** Medium
- **Description:** Phase 2c adds `.board[data-runner="true"] { background: var(--color-board-bg); }`. The base `.board` class already has `background: var(--color-board-bg)`. The data-runner block is a no-op. The plan adds the `data-runner` attribute on the Board (in the same step) but the CSS does nothing with it. This is dead code.
- **Recommendation:** Either (a) remove the data-runner attribute and the empty CSS block, or (b) add an actual visual distinction (e.g., `border: 2px solid var(--color-accent-soft);` to reinforce the "this is a runner" message). Option (b) is the better choice because it gives the data-runner attribute semantic meaning and reinforces the PRD's "player understands there are exactly 3 lanes" goal.

## Finding 6 — Hardcoded rgba values instead of CSS variable channels (Phase 2a)

- **Severity:** Medium
- **Description:** Phase 2a uses `rgba(34, 197, 94, 0.08)` and `rgba(34, 197, 94, 0.15)`. The M8 milestone established CSS token discipline (`--color-accent` = #22c55e, etc.) per `src/index.css`. The current tokens are hex values, not separate channel variables, so `var(--color-accent)` cannot produce `rgba()` without modification. The plan's approach (hardcoded rgba that matches the hex) works but doesn't follow the token discipline for alpha channels.
- **Recommendation:** Acceptable for M13.1 to keep the hardcoded rgba with a comment. For long-term cleanliness, consider adding `--color-accent-rgb: 34, 197, 94` to `index.css` and using `rgba(var(--color-accent-rgb), 0.08)`. This is a M14+ token-system concern, not a blocker for M13.1. Note in Phase 6 that this is a future token-extension candidate.

## Finding 7 — Pre-existing test flakiness is unaddressed (Phase 5)

- **Severity:** Medium
- **Description:** PROJECT_STATE.md §"Known Technical Debt" item 1 documents a flaky test in `state.test.ts` ("Gold food timer expiry occasionally spawns gold instead of normal food due to non-deterministic RNG in `food.ts`"). The new test added by Phase 3b is unrelated (it uses `'normal'` food with `timer: -1`), but the implementer should be aware. The plan does not mention this.
- **Recommendation:** Add a one-liner to Phase 5: "The pre-existing `state.test.ts` gold-food-timer flakiness (PROJECT_STATE.md §Known Technical Debt) is unaffected by M13.1 — the new test uses `'normal'` food with `timer: -1`."

## Finding 8 — Line numbers in the plan are rough estimates (Phase 1, 4)

- **Severity:** Low
- **Description:** Phase 1 says "Update the Cell rendering block (line ~56-66)" for Board.tsx. Phase 4 says "Remove lines 101-105" for RunnerGame.tsx and "Remove the `.laneIndicator` ruleset (lines 44-49)" for RunnerGame.module.css. I verified against the live files: Board.tsx cell rendering is at lines 55-67, RunnerGame.tsx text indicator is at lines 101-105, RunnerGame.module.css `.laneIndicator` is at lines 44-50. The estimates are accurate today but will drift if the files are edited.
- **Recommendation:** Add a "verify line numbers" note to Phase 1's "Files to Change" intro: "Verify line numbers against the current file before editing. The estimates in this plan are accurate as of v0.13.0 but may drift." This is the same recommendation from the M13 review.

## Finding 9 — Accessibility `aria-label` could mention runner mode (Phase 2c)

- **Severity:** Low
- **Description:** The existing Board has `aria-label="Snake Run board"`. When in runner mode, the board is a "3-lane runner" board, but the label is identical. The PRD §17 requires lane separators to be visible to assistive tech, but the current `aria-label` does not distinguish runner mode. The plan does not address this.
- **Recommendation:** Update the Board's `aria-label` based on `runnerLane`:
  ```tsx
  aria-label={runnerLane !== undefined ? "Snake Run runner board — 3 lanes" : "Snake Run board"}
  ```
  This is minor polish, not a blocker.

## Finding 10 — No integration test for the full runner food-spawning path (Phase 3b)

- **Severity:** Low
- **Description:** The Phase 3b test calls `gameReducer` directly with `MOVE_SNAKE`. This is a unit test for the reducer. An integration test that mounts `RunnerGame` and verifies food respawns on a lane column after eating would catch regressions that the unit test misses. For M13.1, the unit test is sufficient because the only code change in the runner food-spawning path is in the reducer.
- **Recommendation:** Note this for future milestones. The current unit test is acceptable for M13.1.

---

# Handoff Assessment

## Phase structure

**Grade: Excellent.** 6 phases with explicit dependencies. Each phase is independently verifiable. The phase ordering is correct: data model (props) → visual styling (CSS) → behavior fix (reducer) → text removal → tests → docs. No phase requires code from a future phase.

## Task decomposition

**Grade: Good, with one Critical fix needed.** Each phase lists:
- Goal (single sentence)
- Files to modify/create
- Code snippets (for non-trivial logic)
- Risks (with mitigations)
- Testing approach
- Acceptance criteria (checkboxes)

The file-level granularity is appropriate for an AI agent to execute. The code snippets are detailed enough to be unambiguous.

**Critical gap:** Phase 3a's import of `spawnRunnerFood` will fail because the function is not exported. This must be fixed before handoff (see Finding 1).

## Verification strategy

**Grade: Good, with one Critical fix and one High fix needed.**

**Per-phase verification:**
- Phase 1: `npm run lint`, `npx tsc --noEmit`, existing test count.
- Phase 2: `npm run build`, visual review.
- Phase 3: `npm test`, lane-constraint test.
- Phase 4: `npm run build`, visual review.
- Phase 5: `npm test`, `npm run build`, `npm run lint`, `npx tsc --noEmit`.
- Phase 6: documentation consistency check.

**Gaps:**
1. **Missing `spawnRunnerFood` export** (Finding 1) — Critical.
2. **Missing `runnerCourse.test.ts`** (Finding 2) — Critical.
3. **Wrong test baseline count in Phase 5** (Finding 3) — High.
4. **No automated visual regression check** for the lane redesign. The plan's "Visual review" is a human task, which is acceptable for M13.1 (no visual regression tooling exists in the project). Future milestones could add screenshot-based tests.
5. **No automated check that the PRD's "5-second comprehension" goal is met.** This is a human-test protocol (per PRD §20), not an automated test.

## Definition of Done

**Grade: Good, with one High fix needed.**

The DoD is a 14-item checklist covering: visual communication, food spawning, text removal, classic mode unchanged, tests, build, lint, typecheck, SPEC.md, ARCHITECTURE.md, PROJECT_STATE.md, ROADMAP.md, no documentation inconsistencies.

**Missing:**
1. **Test count** (Finding 3) — should specify 426 or instruct to use the live count.
2. **No `runnerCourse.test.ts` item** (Finding 2) — the new test file is implicit in Phase 5 but not in DoD.
3. **`spawnRunnerFood` export** (Finding 1) — should be a Phase 3 prerequisite item, not implicit in the import step.

## AI-agent execution readiness

**Grade: Good, with three blockers to resolve before implementation.**

1. **`spawnRunnerFood` export** (Finding 1) — must be added as Phase 3a prerequisite.
2. **Missing `runnerCourse.test.ts`** (Finding 2) — must be added to Phase 5.
3. **Test baseline count** (Finding 3) — must be updated to 426 or made live-count-based.

**Non-blockers but worth fixing:**
4. **Empty `.laneColumn` class** (Finding 4) — should be simplified.
5. **No-op `.board[data-runner="true"]` block** (Finding 5) — should be removed or given real visual effect.
6. **Pre-existing test flakiness note** (Finding 7) — should be added to Phase 5.

Other than these, an AI agent with the plan plus AGENTS.md plus PRD_M13_1.md plus ROADMAP.md plus ARCHITECTURE.md should be able to execute the milestone without further human input. The code snippets are detailed, the file paths are exact, and the acceptance criteria are concrete.

---

# Supplemental Review — Second-Pass Findings

**Reviewer:** External LLM review
**Date:** 2026-06-11
**Context:** Additional review feedback received after the initial review was applied to `plans/ACTIVE.md`. These findings supplement — not replace — the earlier review.

---

## Overall Assessment

The plan is significantly improved compared to previous milestone plans and is detailed enough for autonomous implementation. It demonstrates strong architecture reuse, good test coverage, and a clear understanding of the PRD goals.

The plan correctly identifies the core problem: the player sees a 20x20 Snake board but is actually playing a 3-lane runner. The proposed solution is technically sound and low risk. The food spawning fix is particularly important and addresses one of the most serious gameplay issues discovered during Milestone 13.

**The primary concern is that the implementation may satisfy the technical requirements while still failing to visually communicate a runner track.** The plan validates implementation details (CSS classes exist, props are passed correctly, food spawns correctly) but does not validate the actual visual outcome.

---

## New Required Changes

### Required Change 11 — Add Visual Outcome Validation (Severity: Critical)

**Problem:** The proposed solution keeps the 20x20 board, dims non-lane columns, and highlights lane columns. This may still be perceived by players as "Snake board with styling" instead of "Runner track." The plan's verification steps check for the presence of CSS classes and props but not whether the visual result is recognizable as a runner.

**Recommendation:** Add a new "Visual Outcome Validation" section to the plan. Capture screenshots of: game start, mid-run, food visible, obstacle visible. Review requirement: a screenshot should be recognizable as a 3-lane runner track without requiring explanation. Failure condition: if screenshots still primarily resemble a traditional Snake board, the milestone fails regardless of implementation correctness.

### Required Change 12 — Replace Human Tester Requirements With Evidence-Based Validation (Severity: High)

**Problem:** The plan's verification language still relies on external tester assumptions (tester receives no instructions, ask 4 questions, require 4/4 correct). This workflow does not match project reality, which operates with one human evaluator, AI implementors, AI reviewers, and AI QA agents.

**Recommendation:** Replace the human test protocol with an evidence-based validation package:
- Gameplay recording
- Start-state screenshot
- Mid-run screenshot
- Food-visible screenshot
- Obstacle-visible screenshot

The project owner reviews the evidence and answers five validation questions:
1. Can I immediately identify three lanes?
2. Can I identify the current lane?
3. Can I identify food locations?
4. Can I identify danger locations?
5. Does the board communicate runner gameplay?

All answers must be YES.

### Required Change 13 — Strengthen Active Lane Requirement (Severity: High)

**Problem:** The current CSS proposal (`background: rgba(34, 197, 94, 0.08)`) is implementation-specific and may be too subtle. Many implementation agents will follow the specification exactly, producing a result that is technically correct but visually ineffective.

**Recommendation:** Replace implementation-specific guidance with outcome-based guidance. Active Lane Visibility Requirement: the current lane must be identifiable within one second of viewing the board. Implementation is flexible (background tint, glow, border, lane highlight). The visual result is mandatory; the exact styling is not.

### Required Change 14 — Elevate Food Spawn Fix To Critical Requirement (Severity: Critical)

**Problem:** The plan treats food spawning as one implementation phase. In reality, this is one of the largest gameplay blockers discovered during M13. Food spawning outside playable lanes causes: unreachable food, ignored food, reduced growth, invalid gameplay decisions.

**Recommendation:** Add a "Critical Requirement" section. Food may never spawn outside playable lanes. Validation: automated tests + gameplay recording review. Failure condition: any food visible outside playable lanes results in milestone failure.

---

## New Recommended Changes

### Recommended Change 15 — Screenshot-Based AI Review (Severity: Medium)

The project already uses AI review agents, and many modern low-cost multimodal models can evaluate screenshots successfully. Generate: Screenshot A (start state), Screenshot B (food visible), Screenshot C (obstacle visible), Screenshot D (mid-run), Screenshot E (active lane highlight visible). An AI review agent answers five questions (lane communication, active lane clarity, food legibility, obstacle legibility, snake-board similarity) and provides a pass/fail verdict.

### Recommended Change 16 — Delay Documentation Updates (Severity: Low)

The plan includes documentation updates as part of implementation. Suggested workflow: implement → review → verify screenshots → verify gameplay recordings → update documentation. This reduces documentation drift if implementation requires iteration.

---

## Architecture Assessment

Strong points: no unnecessary rewrites, reuses existing board, reuses existing rendering pipeline, reuses existing lane definitions, minimal risk, minimal code churn. No architectural concerns identified.

## Testing Assessment

Automated test coverage is strong. Particularly valuable: lane-aware food spawning tests, runner board tests, cell styling tests. No major changes required.

---

# Final Recommendation (Updated)

**Approve with Required Changes**

The plan is fundamentally sound: the architecture, scope discipline, phase decomposition, and risk register are all aligned with the PRD and the project's established patterns. The original review's three Critical/High issues and the CSS cleanups have been correctly applied to `plans/ACTIVE.md`.

**However, four new Required Changes must be addressed before implementation:**

1. **(Finding 11, Critical)** Add Visual Outcome Validation with screenshot capture and pass/fail criteria.
2. **(Finding 12, High)** Replace human tester protocol with evidence-based validation package and owner validation questions.
3. **(Finding 13, High)** Strengthen Active Lane Requirement with outcome-based language.
4. **(Finding 14, Critical)** Elevate food spawn fix to Critical Requirement with explicit failure condition.

The two new Recommended Changes (screenshot-based AI review, delayed documentation updates) are process improvements that can be applied during or after implementation.

**Once the four new Required Changes are applied to the plan, it will be ready for implementation by an AI agent or a human engineer.**
