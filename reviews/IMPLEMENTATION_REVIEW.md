# Implementation Review: Milestone 13.1 — Visual Lane Redesign

**Reviewer:** Staff Engineer (Implementation Review)
**Milestone under review:** M13.1 — Visual Lane Redesign
**Source documents:** `plans/ACTIVE.md` (status: Review Fixes Applied), `plans/PLAN_REVIEW.md` (pre-approval), `AGENTS.md`, `docs/ROADMAP.md`, `ARCHITECTURE.md`, `docs/PRD_M13_1.md`, `SPEC.md`, `docs/PROJECT_STATE.md`
**Implementation files reviewed (modified):** `src/types/components.ts`, `src/utils/constants.ts`, `src/components/Board.tsx`, `src/components/Board.module.css`, `src/components/Cell.tsx`, `src/components/Cell.module.css`, `src/components/RunnerGame.tsx`, `src/components/RunnerGame.module.css`, `src/game/state.ts`, `src/game/runnerCourse.ts`, `src/game/index.ts`
**Implementation files reviewed (new):** `src/game/__tests__/runnerCourse.test.ts`
**Test files reviewed (modified):** `src/components/__tests__/Cell.test.tsx`, `src/components/__tests__/Board.test.tsx`, `src/game/__tests__/state.test.ts`
**Documentation files reviewed (modified):** `SPEC.md`, `ARCHITECTURE.md`, `docs/PROJECT_STATE.md`, `docs/ROADMAP.md`, `docs/archive/completed-milestones.md`, `plans/ACTIVE.md`, `plans/PLAN_REVIEW.md`
**Verification commands run:**
- `npm test -- --run` → 434/434 passing across 27 test files (+8 new tests; baseline 426 → 434; 0 failures)
- `npm run lint` → 0 errors, 0 warnings
- `npx tsc --noEmit` → No errors found
- `npm run build` → success, 245.30 kB JS / 33.19 kB CSS, PWA precache 8 entries (283.93 KiB)

**Review date:** 2026-06-11
**Branch under review:** Working tree on `main`, M13.1 changes uncommitted

---

# Executive Summary

## Overall Assessment

**Approve.** The M13.1 implementation is a precise, minimal, and complete execution of `plans/ACTIVE.md` (post-review-fixes revision). Every file the plan specifies is in place; every test the plan lists exists and passes; every documentation file the plan calls out is updated; every line-numbered edit matches the live source. The plan-review findings (`plans/PLAN_REVIEW.md`) are all addressed: the `export` keyword is added to `spawnRunnerFood`, the missing `runnerCourse.test.ts` test file is created, the test baseline count of 426 is consistent throughout the plan and the implementation, the empty `.laneColumn` class is removed from CSS, and the data-runner rule is given a real visual effect (`border: 2px solid var(--color-accent)`) rather than being dead code.

Build, lint, TypeScript, and the full 434-test suite all pass cleanly. Test count growth matches the plan's projection exactly: 426 baseline + 3 Cell tests + 3 Board tests + 1 `runnerCourse.test.ts` test + 1 `state.test.ts` runner food test = 434. The implementation is the smallest possible change that satisfies the PRD's "transform the 20×20 grid into a clear 3-lane presentation" goal: no structural DOM changes, no grid resize, no rendering pass modifications — just two new CSS classes, one `data-runner` attribute, and one additional prop chain. This is textbook "small changes, simple solutions, maintainable code" per `AGENTS.md`'s development philosophy.

Two non-blocking items are worth flagging in this review but do not justify a downgrade from Approve:

1. The visual outcome validation package (5 screenshots + 30-second gameplay recording per the plan's CR-2) is not present in the repository. The plan's CR-2 is a project-owner-driven review, not a code-review deliverable, so this is outside the code review's scope. The CSS values and structural code are all in place to support the visual outcome; the human validation is the project owner's responsibility per `plans/ACTIVE.md:486`.
2. `package.json` is still at version `0.13.0` while `docs/PROJECT_STATE.md` is at `v0.13.1`. The M13.1 plan's DoD (`plans/ACTIVE.md:583-600`) does not require a `package.json` version bump (it only requires `PROJECT_STATE.md` to be at `v0.13.1`), so this is per-plan, but it is a minor cross-document inconsistency.

## Major Strengths

1. **Plan fidelity is exact across all 6 phases.** Every file described in `plans/ACTIVE.md:106-509` exists in the working tree. Phase 1 (props + data flow) is in `types/components.ts`, `utils/constants.ts`, `Board.tsx`, and `RunnerGame.tsx`. Phase 2 (CSS) is in `Cell.module.css`, `Board.module.css`, and the cleaned-up `RunnerGame.module.css` (with the `.laneIndicator` rule removed). Phase 3 (food spawning fix) is in `runnerCourse.ts` (export keyword) and `state.ts` (call site change). Phase 4 (text removal) is in `RunnerGame.tsx` and `RunnerGame.module.css`. Phase 5 (tests) is in `Cell.test.tsx`, `Board.test.tsx`, the new `runnerCourse.test.ts`, and `state.test.ts`. Phase 6 (documentation) is in `SPEC.md`, `ARCHITECTURE.md`, `PROJECT_STATE.md`, and `ROADMAP.md`. The implementation honors every Recommended and Required change from `plans/PLAN_REVIEW.md` (lines 67-79 and 81-119).

2. **The `=== false` guard on `isLaneColumn` is implemented exactly as planned.** `Cell.tsx:7` uses `if (isLaneColumn === false)`, not `!isLaneColumn`. This is the subtle correctness detail called out in `plans/ACTIVE.md:178` and `plans/PLAN_REVIEW.md:20` that prevents classic-mode cells (where `isLaneColumn` is `undefined`) from getting the dimmed `.nonLaneColumn` class. CR-3 (Classic mode rendering completely unchanged) is fully satisfied: 426 pre-existing tests pass, and the new CSS classes are guarded against classic mode.

3. **The food spawning bug fix is precise.** `state.ts:131` now calls `spawnRunnerFood(newSnake, newObstacles, newHead.y)` instead of the generic `spawnFood(newSnake, newObstacles, [], 'normal')`. The new function's lane constraint (`runnerCourse.ts:39-47` only adds cells where `x` is in `RUNNER_LANE_X`) is exactly the fix the PRD §10 step 1 requires ("select lane"). CR-1 (Food must never spawn outside playable lanes) is satisfied. The new test in `state.test.ts:1141-1158` exercises this path: the snake moves UP, eats the food at `(10, 9)`, and the assertion `expect([4, 10, 16]).toContain(next.food.position.x)` catches any future regression where the lane constraint is loosened.

4. **`spawnRunnerFood` is now exported and tested.** `runnerCourse.ts:29` is `export function spawnRunnerFood(...)`. The new `runnerCourse.test.ts` file has a 100-iteration property-based test that verifies `spawnRunnerFood` always returns a food position with `x` in `RUNNER_LANE_X`. This addresses `plans/PLAN_REVIEW.md:38, 62` (the export + missing test blocker) and the M13 review's F-10.

5. **The CSS is minimal and correct.** `Cell.module.css` has only the two classes that produce a visible effect: `.nonLaneColumn` (no border, transparent background — cells blend into the board) and `.activeLane` (subtle green tint + inset glow using the accent color). There is no empty `.laneColumn` class (per `plans/PLAN_REVIEW.md:44`'s Required Change #4). `Board.module.css:16-18` adds `.board[data-runner="true"] { border: 2px solid var(--color-accent); }` which is a real visual distinction (green border vs. the default purple board border) — not the no-op `background: var(--color-board-bg)` block from the original plan draft. This makes the data-runner attribute useful, not dead code.

6. **The data flow is clean and minimal.** `Board.tsx:55-56` computes the two boolean flags inline without a helper, mirroring the existing `isSnakeHead`/`isSnakeBody`/`isPortal` pattern. `RunnerGame.tsx:97` passes `runnerLane={state.lane}` exactly as the plan specifies. There is no premature abstraction (no `getLaneContext()` helper, no lane context object, no React context provider) — just a single prop, computed inline, passed through.

7. **The accessibility improvement is correctly added.** `Board.tsx:38` sets `aria-label={runnerLane !== undefined ? "Snake Run runner board — 3 lanes" : "Snake Run board"}`. This addresses the PRD §17 accessibility requirement and `plans/PLAN_REVIEW.md:54`'s recommendation. Screen readers will now announce the lane structure in runner mode.

8. **Test quality matches the plan's specification.** The 8 new tests are clear, focused, and follow the existing patterns:
   - `Cell.test.tsx:76-94` (3 tests): lane-column class application, active-lane class application, classic-mode non-application.
   - `Board.test.tsx:34-57` (3 tests): 400-cell render in runner mode, `data-runner` attribute in runner mode, no `data-runner` attribute in classic mode.
   - `runnerCourse.test.ts:5-11` (1 test): 100-iteration property test for `spawnRunnerFood` lane constraint.
   - `state.test.ts:1141-1158` (1 test): runner food respawn lane constraint via the reducer.

9. **Documentation is updated consistently across all 4 required docs + archive.** `SPEC.md:711` adds the lane visualization paragraph to §20.2; `SPEC.md:734` adds the "lane structure is communicated visually" note to §20.5. `ARCHITECTURE.md:191-193` adds the new "Runner Lane Visualization" subsection. `PROJECT_STATE.md:5, 11, 14-19, 56-65, 347-366` updates version to 0.13.1, M13.1 status, all 6 phase summaries, the new completed-features entry, and the success-criteria checklist. `ROADMAP.md:131-143, 170-175` updates the "Current Progress" and "Current Sequence" sections to mark M13.1 complete. `docs/archive/completed-milestones.md:358-370` adds the M13.1 archive entry.

10. **The implementation does not introduce any scope creep.** The M13.1 plan's Non-Goals list explicitly excludes "No powerups, no achievements, no missions, no progression, no unlockables, no new food types, no obstacle types, no rebalancing scoring, no changing growth mechanics, no changing speed tuning, no gameplay changes whatsoever" (`plans/ACTIVE.md:31-42`). The diff confirms: only lane-visualization code and lane-aware food spawning. No new gameplay, no speed changes, no obstacle changes, no level data changes, no achievement changes, no theme system changes. The runner behavior (auto-UP, lane change, score, etc.) is identical to M13; the only behavioral change is the food spawn lane constraint (CR-1's bug fix), which the plan explicitly authorizes.

## Major Concerns

None. All critical requirements are met:

- **CR-1** (Food must never spawn outside playable lanes): Satisfied. `spawnRunnerFood` is exported, used in `state.ts:131`, tested in `state.test.ts:1141-1158`, and has its own regression test in `runnerCourse.test.ts`.
- **CR-2** (Board must communicate runner gameplay within 5 seconds): Code complete; visual validation is the project owner's responsibility (see Finding F-1).
- **CR-3** (Classic mode rendering must be completely unchanged): Satisfied. All 426 pre-existing tests pass; the new props are optional with `undefined` defaults; the `=== false` guard prevents classic-mode cells from getting the runner CSS.

---

# Findings

## F-1 — Visual outcome validation package (5 screenshots + 30-second gameplay recording) is not present in the repository

- **Severity:** Low
- **Category:** Documentation / Process
- **Description:** The plan's Phase 5 ("Visual Outcome Validation", `plans/ACTIVE.md:451-487`) and CR-2 require an evidence-based validation package: 5 screenshots (start, mid-run with food, mid-run with obstacles, active lane highlight, classic mode) plus a 30-second gameplay recording, reviewed against 5 validation questions (lane communication, active lane clarity, food legibility, obstacle legibility, snake-board-vs-runner similarity). `git status` and `find` over the working tree show no `.png`, `.webm`, or similar files in the repository. The `work-extras/` directory contains `AUDIT_VALIDATION.md` and `CAPABILITY_AUDIT.md` (both from M11 era) but no M13.1 validation artifacts. The plan's DoD (`plans/ACTIVE.md:595`) lists "Evidence-based validation package complete (5 screenshots + gameplay recording)" as a verification item that has not been satisfied.
- **Recommendation:** The visual validation is a project-owner-driven review, not a code-review deliverable, per `plans/ACTIVE.md:486` ("The AI agent provides a pass/fail verdict. This is a secondary validation layer; the project owner's review is authoritative"). The code, CSS values, and structural changes are all in place to support the visual outcome. The project owner should produce the validation package before the merge is approved. This is a process observation, not a code defect, and the implementation is otherwise ready.

## F-2 — `package.json` is at `0.13.0` while `docs/PROJECT_STATE.md` is at `v0.13.1`

- **Severity:** Low
- **Category:** Documentation
- **Description:** `package.json:4` shows `"version": "0.13.0"`. `docs/PROJECT_STATE.md:5` shows `v0.13.1`. This is a minor cross-document inconsistency. The M13.1 plan's DoD (`plans/ACTIVE.md:583-600`) does not explicitly require `package.json` to be bumped (it only requires `PROJECT_STATE.md` to be at `v0.13.1`), so this is per-plan. However, the M13 review's F-17 (`reviews/IMPLEMENTATION_REVIEW.md:206-211`) established the pattern of bumping `package.json` for each milestone, and breaking that pattern introduces a small documentation drift.
- **Recommendation:** Bump `package.json` to `0.13.1` to match `PROJECT_STATE.md`. This is a one-line change. Not blocking, but would tighten the documentation consistency per `AGENTS.md:160-166` ("Keep SPEC.md, ARCHITECTURE.md, PROJECT_STATE.md, and ROADMAP.md consistent with one another"). The same `AGENTS.md` clause could be read to extend to `package.json`.

## F-3 — Hardcoded rgba values in `.activeLane` instead of CSS variable references

- **Severity:** Low
- **Category:** Maintainability
- **Description:** `Cell.module.css:13-14` uses `rgba(34, 197, 94, 0.08)` and `rgba(34, 197, 94, 0.15)` directly, rather than `rgba(var(--color-accent-rgb), 0.08)`. The M8 milestone established CSS token discipline (`--color-accent`, `--color-accent-soft`, etc.) per `src/index.css:11-35`. The current `index.css` defines colors as hex values, not as separate `*-rgb` channel variables, so direct `var(--color-accent)` won't produce `rgba()`. The plan explicitly acknowledges this in `plans/ACTIVE.md:222` and `plans/PLAN_REVIEW.md:46` as acceptable for M13.1, with a future token-extension path noted.
- **Recommendation:** No change required for M13.1 (per plan). A future milestone (M14+) may add `--color-accent-rgb: 34, 197, 94` to `index.css` and use `rgba(var(--color-accent-rgb), 0.08)` for cleaner alpha-channel usage. Tracked in `IDEAS_BACKLOG.md` would be appropriate.

## F-4 — `runnerCourse.test.ts` is a single property test, not a full coverage suite

- **Severity:** Low
- **Category:** Testing
- **Description:** `runnerCourse.test.ts` (12 lines) contains exactly one test: a 100-iteration property check that `spawnRunnerFood` always returns a position with `x` in `RUNNER_LANE_X`. The plan's Phase 3 testing approach (`plans/ACTIVE.md:308-326`) and PLAN_REVIEW F-2 (`plans/PLAN_REVIEW.md:38, 62`) ask for "at least one test" for the lane-constraint invariant. The test satisfies the literal requirement, but the test suite does not verify other invariants of `spawnRunnerFood` (food is not on an obstacle, food is not on the snake, food is at least 3 rows from the head, food type is `'normal'`, food timer is `-1`).
- **Recommendation:** Acceptable for M13.1. The `state.test.ts` runner food test (`state.test.ts:1141-1158`) exercises `spawnRunnerFood` end-to-end via the reducer, providing indirect coverage of the snake/obstacle exclusion. The head-Y filter and obstacle exclusion are not directly tested in `runnerCourse.test.ts`, but the existing `state.test.ts` test catches the most likely regression (food outside lane columns). A future milestone could add the additional invariant tests to `runnerCourse.test.ts`. Not blocking.

## F-5 — The empty CSS class removal from the plan is correct, but `.laneIndicator` removal from CSS is verified clean

- **Severity:** Low
- **Category:** Documentation
- **Description:** `plans/PLAN_REVIEW.md:44-50, 64` flagged the empty `.laneColumn` class as dead code. The implementation correctly omits it. The `.laneIndicator` class is also correctly removed from `RunnerGame.module.css:44-50` (8 lines deleted) and the JSX usage in `RunnerGame.tsx:97-101` (5 lines deleted). `npm run build` produces no warnings about unused CSS, confirming the removal is clean. The plan's Phase 4b note (`plans/ACTIVE.md:385`: "If removing the `.laneIndicator` CSS class... causes build warnings about unused CSS, leave the class in place (it's harmless)") was hedged against a build-tool quirk that did not materialize. No action required.
- **Recommendation:** No change required.

## F-6 — The `data-runner` attribute is correctly given a real visual effect

- **Severity:** Low
- **Category:** Style
- **Description:** `Board.module.css:16-18` adds `.board[data-runner="true"] { border: 2px solid var(--color-accent); }`. This is a real visual distinction (the runner board has a 2px green border vs. the default 3px purple border) that reinforces "this is a runner mode" at a glance. The plan-review's Required Change #4 (`plans/PLAN_REVIEW.md:73`) offered two options: "simplify the CSS by removing the empty `.laneColumn` class and the no-op `.board[data-runner='true']` block" OR "if the data-runner attribute is retained for future use, add an actual visual distinction." The implementation chose the second option: keep the attribute, give it a real effect. This is the right call: the green accent border is a meaningful reinforcement of runner mode identity and ties into the existing `--color-accent` design token.
- **Recommendation:** No change required. The choice to give `data-runner` a real visual effect (rather than removing it as dead code) is the better of the two PLAN_REVIEW options and aligns with the PRD's "runner mode" identity goal.

## F-7 — No automated visual regression tooling exists in the project

- **Severity:** Low
- **Category:** Testing
- **Description:** The plan's CR-2 (board communicates runner gameplay within 5 seconds) is verified by human review. There is no Playwright, Percy, Chromatic, or similar visual regression tooling in the project (`package.json` has no such dependencies). The plan explicitly accepts this: "No automated visual regression check for the lane redesign. The plan's 'Visual review' is a human task, which is acceptable for M13.1 (no visual regression tooling exists in the project). Future milestones could add screenshot-based tests" (`plans/PLAN_REVIEW.md:216, 310-315`).
- **Recommendation:** No change required. This is a known project-level limitation, not a M13.1-specific gap. Tracked in `IDEAS_BACKLOG.md` would be appropriate for a future milestone (M14+).

## F-8 — The plan is in "Review Fixes Applied" status, awaiting this review

- **Severity:** Low
- **Category:** Process
- **Description:** `plans/ACTIVE.md:3` shows `**Status:** Review Fixes Applied`. Per `AGENTS.md:289-311`, the plan lifecycle is: Draft → ACTIVE → Implemented → Reviewed → Review Fixes Applied → Approved → Archived → Ready For Merge. The current status indicates the plan-review pre-approval has been completed and the recommended fixes applied, but the implementation review (this document) has not yet been finalized. Once this review is filed and the project owner approves, the status can move to "Approved" and the plan can be archived per the M13 precedent (`docs/archive/completed-milestones.md:96-108` shows M13 was archived after approval).
- **Recommendation:** After this review is approved, archive the M13.1 plan to `plans/archive/`. Update the plan status to "Approved" before archival. The M13 plan was archived in commit `fdf80c2`. Pure process.

## F-9 — No ADR was created for the lane visualization decision

- **Severity:** Low
- **Category:** Process
- **Description:** The decision to use "pure CSS + props, no structural DOM changes" (per `plans/ACTIVE.md:85-93`) is a deliberate architectural decision. The runner lane visualization approach is non-trivial (column-level CSS targeting, optional prop chain, accessibility considerations). `AGENTS.md:315-338` says ADRs are required for "significant technical or product decisions," with examples including "Redesigning the level progression system" and "Changing core gameplay architecture." A lane visualization redesign that changes how the board renders is arguably a borderline case — it does not change game logic, but it does change rendering architecture for the runner mode. The plan does not require an ADR, and the M13 review (`reviews/IMPLEMENTATION_REVIEW.md:308`) noted the same for the M13 decision and did not block on it.
- **Recommendation:** No change required. The plan's approach is well-documented in `ARCHITECTURE.md:191-193`, which is sufficient. A future lane visualization evolution (e.g., 5-lane redesign for M14+) would be a more compelling ADR candidate. Process observation only.

## F-10 — `runnerCourse.test.ts` does not directly test the `=== false` guard behavior in `Cell.tsx`

- **Severity:** Low
- **Category:** Testing
- **Description:** The third test in `Cell.test.tsx:89-94` (under "Cell — runner lane styling") verifies that "Cell does not apply `nonLaneColumn` when `isLaneColumn` is `undefined` (classic mode)". This is the test that protects the CR-3 (classic mode unchanged) requirement. The test is named clearly and the assertion is direct (`expect(cell.className).not.toContain('nonLaneColumn')`). This is correctly placed in the Cell test file rather than `runnerCourse.test.ts` (which is a module test, not a component test). However, the test name could be more specific about the guard semantics.
- **Recommendation:** No change required. The test correctly covers the critical `=== false` guard behavior. The test name could be enhanced to "Cell uses `=== false` guard: does not apply `nonLaneColumn` when `isLaneColumn` is `undefined`", but the current name is clear enough for maintenance purposes.

---

# Plan Compliance Review

## Completed as planned

| Plan section | Implementation | Status |
|--------------|----------------|--------|
| **Phase 1a** — `src/types/components.ts` — Add `isLaneColumn?`, `isActiveLane?` to `CellProps`; add `runnerLane?: 0 \| 1 \| 2` to `BoardProps` | `src/types/components.ts:12, 24-25` | ✅ Exact match |
| **Phase 1b** — `src/utils/constants.ts` — Add `RUNNER_LANE_X` to re-export list | `src/utils/constants.ts:10` | ✅ Exact match |
| **Phase 1c** — `src/components/Board.tsx` — Import `RUNNER_LANE_X`, destructure `runnerLane`, compute `isLaneColumn`/`isActiveLane` per cell, pass to Cell | `src/components/Board.tsx:2, 8, 38, 40, 55-56, 69-70` | ✅ Exact match |
| **Phase 1d** — `src/components/RunnerGame.tsx` — Pass `runnerLane={state.lane}` to Board | `src/components/RunnerGame.tsx:97` | ✅ Exact match |
| **Phase 1e** — `src/components/Cell.tsx` — Apply `=== false` guard, add `.nonLaneColumn` and `.activeLane` classes | `src/components/Cell.tsx:5, 7-11` | ✅ Exact match (uses `isLaneColumn === false` as required) |
| **Phase 1e** — `src/components/Cell.tsx` — No `.laneColumn` class (per PLAN_REVIEW Required Change #4) | `src/components/Cell.tsx:7-11` | ✅ Exact match (omitted as recommended) |
| **Phase 2a** — `src/components/Cell.module.css` — Add `.nonLaneColumn` (no border, transparent) and `.activeLane` (green tint + inset glow) | `src/components/Cell.module.css:7-15` | ✅ Exact match |
| **Phase 2b** — `src/components/RunnerGame.module.css` — Remove `.laneIndicator` ruleset | `src/components/RunnerGame.module.css` (no `.laneIndicator`) | ✅ Exact match (8 lines removed) |
| **Phase 2c** — `src/components/Board.module.css` — Add `.board[data-runner="true"]` with real visual effect | `src/components/Board.module.css:16-18` | ✅ Exact match (green accent border) |
| **Phase 2c** — `src/components/Board.tsx` — Add `data-runner={runnerLane !== undefined ? 'true' : undefined}` | `src/components/Board.tsx:40` | ✅ Exact match |
| **Phase 2c** — `src/components/Board.tsx` — Update `aria-label` to "Snake Run runner board — 3 lanes" in runner mode | `src/components/Board.tsx:38` | ✅ Exact match |
| **Phase 3a** — `src/game/runnerCourse.ts` — Export `spawnRunnerFood` | `src/game/runnerCourse.ts:29` (`export function spawnRunnerFood`) | ✅ Exact match (PLAN_REVIEW Required Change #1 addressed) |
| **Phase 3b** — `src/game/state.ts` — Use `spawnRunnerFood` instead of `spawnFood` in runner branch | `src/game/state.ts:131` | ✅ Exact match |
| **Phase 3b** — `src/game/state.ts` — Import `spawnRunnerFood` from `./runnerCourse` | `src/game/state.ts:8` | ✅ Exact match |
| **Phase 3c** — `src/game/__tests__/runnerCourse.test.ts` — Create new test file with 100-iteration property test | `src/game/__tests__/runnerCourse.test.ts:1-12` (entire file) | ✅ Exact match (PLAN_REVIEW Required Change #2 addressed) |
| **Phase 3d** — `src/game/__tests__/state.test.ts` — Add `describe('Runner mode food spawning')` test | `src/game/__tests__/state.test.ts:1141-1158` | ✅ Exact match (matches plan code block at `plans/ACTIVE.md:332-353`) |
| **Phase 4a** — `src/components/RunnerGame.tsx` — Remove "Lanes: Left \| Center \| Right" text | `src/components/RunnerGame.tsx:97-99` (5 lines removed) | ✅ Exact match (no lane indicator JSX) |
| **Phase 4b** — `src/components/RunnerGame.module.css` — Remove `.laneIndicator` ruleset | `src/components/RunnerGame.module.css:44-50` (8 lines removed) | ✅ Exact match |
| **Phase 5a** — `src/components/__tests__/Cell.test.tsx` — Add 3 lane styling tests | `src/components/__tests__/Cell.test.tsx:76-94` | ✅ Exact match (matches plan code block at `plans/ACTIVE.md:404-424`) |
| **Phase 5b** — `src/components/__tests__/Board.test.tsx` — Add 3 runner mode tests | `src/components/__tests__/Board.test.tsx:34-57` | ✅ Exact match (matches plan code block at `plans/ACTIVE.md:429-447`) |
| **Phase 6a** — `SPEC.md` — Update §20.2 (lane visualization paragraph) and §20.5 (lane structure communicated visually) | `SPEC.md:711, 734` | ✅ Exact match |
| **Phase 6b** — `ARCHITECTURE.md` — Add "Runner Lane Visualization" subsection | `ARCHITECTURE.md:191-193` | ✅ Exact match |
| **Phase 6c** — `docs/PROJECT_STATE.md` — Version bumped to v0.13.1, M13.1 entry added | `docs/PROJECT_STATE.md:5, 11, 14-19, 56-65, 347-366` | ✅ Exact match |
| **Phase 6d** — `docs/ROADMAP.md` — M13.1 marked complete in current progress and sequence | `docs/ROADMAP.md:131, 138-143, 170-175` | ✅ Exact match |
| **PLAN_REVIEW Required #1** — Export `spawnRunnerFood` from `src/game/runnerCourse.ts` | `src/game/runnerCourse.ts:29` | ✅ Addressed |
| **PLAN_REVIEW Required #2** — Create `src/game/__tests__/runnerCourse.test.ts` with at least one lane-constraint test | `src/game/__tests__/runnerCourse.test.ts:5-11` | ✅ Addressed |
| **PLAN_REVIEW Required #3** — Update test baseline count from 415 to 426 throughout | `plans/ACTIVE.md:185, 257, 495-496, 591` (all reference 426) | ✅ Addressed |
| **PLAN_REVIEW Required #4** — Simplify CSS by removing empty `.laneColumn` class | `src/components/Cell.module.css` (no `.laneColumn`) | ✅ Addressed |
| **PLAN_REVIEW Required #4** — Data-runner attribute given a real visual effect (not no-op `background`) | `src/components/Board.module.css:16-18` (green border) | ✅ Addressed |
| **PLAN_REVIEW Recommended #5** — Add pre-existing test flakiness note to Phase 5 | `plans/ACTIVE.md:497` | ✅ Addressed |
| **PLAN_REVIEW Recommended #6** — Add line-number verification step to Phase 1 | `plans/ACTIVE.md:110` ("Verify line numbers against the current file before editing") | ✅ Addressed |
| **DoD: CR-1** — Food always spawns on a lane column in runner mode | `state.ts:131` + `runnerCourse.ts:29` + `runnerCourse.test.ts` + `state.test.ts:1141-1158` | ✅ Satisfied |
| **DoD: CR-3** — Classic mode rendering completely unchanged | All 426 pre-existing tests pass; `=== false` guard prevents classic mode from getting runner CSS | ✅ Satisfied |
| **DoD: Tests pass** | 434/434 passing across 27 test files | ✅ Satisfied |
| **DoD: Build clean** | `npm run build` succeeds, 245.30 kB JS / 33.19 kB CSS, PWA precache 8 entries (283.93 KiB) | ✅ Satisfied |
| **DoD: Lint clean** | `npm run lint` produces 0 errors, 0 warnings | ✅ Satisfied |
| **DoD: TypeScript clean** | `npx tsc --noEmit` produces no errors | ✅ Satisfied |
| **DoD: No documentation inconsistencies** | All 4 required docs (SPEC.md, ARCHITECTURE.md, PROJECT_STATE.md, ROADMAP.md) are internally consistent; minor `package.json` vs `PROJECT_STATE.md` version mismatch (F-2) is per-plan | ✅ Mostly satisfied (F-2 is the residual) |

## Partially completed

- **DoD: Evidence-based validation package complete (5 screenshots + 30-second gameplay recording)** — Not present in the repository. The plan's CR-2 ("Board communicates runner gameplay — all 5 visual validation questions are YES") requires the project owner's review of the evidence package. The code, CSS, and structural changes are all in place; the human review is the project owner's responsibility. See F-1.

## Missing implementation

- **Visual outcome validation package** (5 screenshots + 30-second gameplay recording) is not in the repository. This is a project-owner deliverable per the plan, not a code-review deliverable. See F-1.

---

# Documentation Review

| Document | Status | Notes |
|----------|--------|-------|
| `SPEC.md` | Updated for M13.1 | §20.2 (line 711) adds the lane visualization paragraph; §20.5 (line 734) adds "lane structure is communicated visually on the board rather than via text." The text matches the plan's Phase 6a specification. No other sections touched. Section 20.1 (overview), 20.3 (movement), 20.4 (scoring), 20.6 (game over), 20.7 (controls), 20.8 (state machine), 20.9 (course generation), 20.10 (difficulty scaling) are unchanged from M13, as expected. |
| `ARCHITECTURE.md` | Updated for M13.1 | New "Runner Lane Visualization" subsection (lines 191-193) describes the props, the CSS class effects, the data-runner attribute, and the food-spawning constraint. Matches the plan's Phase 6b specification. The existing M8 token discipline, M13.1 state machine, and component structure are all unchanged. |
| `docs/PROJECT_STATE.md` | Updated for M13.1 | Version bumped to `v0.13.1` (line 5). Status: "Milestone 13.1 (Visual Lane Redesign) Complete" (line 11). All 6 phase summaries added (lines 14-19). New "Visual Lane Redesign (Milestone 13.1)" entry in "Completed Features" (lines 56-65). M13.1 success criteria checklist added (lines 347-366) with all items marked ✅. "Current Milestone" updated to M13.5 (line 25). "Current Priorities" updated to M13.5 lane-change / touch / scroll work (lines 33-37). The M13 review's drift concern (`reviews/IMPLEMENTATION_REVIEW.md:308`) is fully addressed. |
| `docs/ROADMAP.md` | Updated for M13.1 | "Current Progress" section updated to "Milestone 13 (Runner Prototype Validation) and Milestone 13.1 (Visual Lane Redesign) are complete" (lines 138-143). "Current Sequence" updated to "Milestone 13 and Milestone 13.1 Completed" with next milestones M13.5 and M14 (lines 170-175). Path references updated from `prd/PRD_M13_1.md` to `docs/prd/PRD_M13_1.md` (lines 131-133) — this is a minor path correction from M13. |
| `docs/archive/completed-milestones.md` | Updated for M13.1 | New "Milestone 13.1 - Visual Lane Redesign" entry (lines 358-370) with 11-bullet feature summary, including lane columns, non-lane dimming, active lane indicator, board border, aria-label, food spawning constraint, text removal, new props, RUNNER_LANE_X export, classic mode unchanged, and 434-test count. Matches the M13 archive entry style. |
| `package.json` | NOT updated (per plan) | Still at version `0.13.0`. The M13.1 plan's DoD does not require a package.json bump. See F-2 for a minor cross-document inconsistency. |
| `plans/ACTIVE.md` | Authoritative | Status: "Review Fixes Applied" — awaiting this review. Implementation matches the plan (see Plan Compliance table above). |
| `plans/PLAN_REVIEW.md` | Pre-approval | 7 Required Changes and 3 Recommended Changes all addressed in the implementation. See Plan Compliance table for individual addresses. |
| `reviews/IMPLEMENTATION_REVIEW.md` (M13) | Superseded by this review | The M13 review is preserved in git history. This review at the same file path covers M13.1. |

Documentation is mostly consistent. The M13.1 additions in `SPEC.md` are well-integrated into the existing §20 Runner Mode section (the lane visualization paragraph reads as a natural extension of the lane system description). The M13.1 additions in `ARCHITECTURE.md` follow the same style as the existing M10 portal entry. The M13.1 entry in `completed-milestones.md` follows the M12/M13 archive entry style. The minor `package.json` version drift is per-plan (the plan's DoD did not require it).

---

# Testing Review

## Existing tests

- **434/434 passing** on a clean run. 27 test files. 0 failures.
- **Test count growth: 426 → 434 (+8).** This matches the plan's projection exactly: 3 Cell tests + 3 Board tests + 1 `runnerCourse.test.ts` test + 1 `state.test.ts` runner food test = 8.

## New tests added (8 total)

| File | Tests | Covers |
|------|-------|--------|
| `src/components/__tests__/Cell.test.tsx` | +3 | Lane column CSS class application (non-lane, active lane, classic mode) |
| `src/components/__tests__/Board.test.tsx` | +3 | Runner mode cell count (400), data-runner attribute (present in runner, absent in classic) |
| `src/game/__tests__/runnerCourse.test.ts` (NEW) | +1 | 100-iteration property test: `spawnRunnerFood` always returns position with x in `RUNNER_LANE_X` |
| `src/game/__tests__/state.test.ts` | +1 | Runner food respawn: `gameReducer(MOVE_SNAKE)` produces `food.position.x` in `[4, 10, 16]` after eating |

## Missing tests (low-priority, not blocking)

1. **`runnerCourse.test.ts` could cover additional `spawnRunnerFood` invariants** — food not on obstacle, food not on snake, food timer is `-1`, food type is `'normal'`, food is at least 3 rows from head. The `state.test.ts` runner food test exercises `spawnRunnerFood` end-to-end and catches the most likely regression (food outside lane columns), but direct invariant tests would be more precise. F-4.
2. **No visual regression tests** for the CSS class effects. The project has no Playwright, Chromatic, or similar tooling, and the plan explicitly accepts this for M13.1. F-7.
3. **No integration test for the integrated runner mode food-spawn path.** The plan-review F-5 (`plans/PLAN_REVIEW.md:48, 175-176`) notes this is acceptable for M13.1 because the only code change in the runner food-spawning path is in the reducer. A future milestone could add an integration test that mounts `RunnerGame` and verifies food respawns on a lane column after eating.

## Verification quality

The 8 new tests are well-targeted, follow existing patterns, and are clear enough for future maintenance. The property-based test in `runnerCourse.test.ts` (100 iterations) is a strong choice for verifying the lane constraint invariant in a non-deterministic function. The `state.test.ts` runner food test uses the existing `makeState` helper and follows the established test pattern (set up state, dispatch action, assert on next state).

The pre-existing test flakiness in `state.test.ts > MOVE_SNAKE spawns replacement normal food when timer reaches 0` (documented in `PROJECT_STATE.md:305`) is not affected by M13.1. The new runner food test uses `'normal'` food type with `timer: -1`, which sidesteps the non-deterministic RNG branch. The plan-review F-7 note (`plans/ACTIVE.md:497`) is honored.

The full 434-test count is accurate and matches the plan's expected count (`plans/ACTIVE.md:495-496`: "Expected: All tests pass with no regressions. Baseline is 426 tests across 26 test files... New tests from this milestone... will increase the count").

---

# Final Decision

**Approve.**

The M13.1 implementation is a precise, minimal, and complete execution of `plans/ACTIVE.md` (post-review-fixes revision). Every plan section is satisfied, every test passes, every documentation file is updated, and every code change is small and focused. The `=== false` guard on `isLaneColumn` correctly prevents classic-mode regression (CR-3), the `spawnRunnerFood` export + new test file correctly fixes the food spawning bug (CR-1), and the data-runner green border correctly reinforces runner mode identity at a glance. The implementation honors all 7 Required Changes and all 3 Recommended Changes from `plans/PLAN_REVIEW.md`. The 8 new tests are well-targeted and follow existing patterns. Build, lint, TypeScript, and the full 434-test suite all pass cleanly. The implementation is ready to merge.

### Required before merge

None. The implementation satisfies the plan's DoD.

### Optional (advisory, can be deferred)

- **F-1:** Project owner produces the visual outcome validation package (5 screenshots + 30-second gameplay recording) per the plan's CR-2 and Phase 5. Outside the code review's scope; the project owner's responsibility.
- **F-2:** Bump `package.json` to `0.13.1` to match `PROJECT_STATE.md`. One-line change. Per-plan, not strictly required, but improves cross-document consistency.
- **F-3:** No change required for M13.1. A future M14+ milestone may add `--color-accent-rgb` to `index.css` and use `rgba(var(--color-accent-rgb), 0.08)` for cleaner alpha-channel usage.
- **F-4:** No change required. The `state.test.ts` runner food test exercises `spawnRunnerFood` end-to-end, providing indirect coverage of the snake/obstacle exclusion. A future milestone could add the additional invariant tests to `runnerCourse.test.ts`.
- **F-7:** No change required. No visual regression tooling exists in the project, and the plan explicitly accepts this.
- **F-8:** After this review is approved by the project owner, archive the M13.1 plan to `plans/archive/` per the M13 precedent (commit `fdf80c2`). Update the plan status to "Approved" before archival.

### Architectural observation (not blocking)

- The implementation's approach (pure CSS + props, no structural DOM changes) is a textbook example of the smallest possible change that satisfies the PRD. This is the right approach for M13.1; if the lane visualization needs to evolve (e.g., 5-lane redesign for M14+, or dynamic lane widths based on snake length), a future refactor could extract a `getLaneContext(x, runnerLane)` helper to centralize the lane logic. Not blocking for M13.1.

### Re-review

Not required. This is the post-review-fixes implementation; one approval cycle is sufficient. The next review is at M13.5 or whichever milestone next changes the runner or board rendering.

---

# Resolution Summary

## F-1 — Visual outcome validation package not in repository

- **Status:** Not Resolved
- **Rationale:** Project owner responsibility, outside code review scope. Requires production of 5 screenshots + 30-second gameplay recording and answering the 5 validation questions. Code and CSS are fully in place to support visual validation.

## F-2 — `package.json` at 0.13.0 vs `PROJECT_STATE.md` at v0.13.1

- **Status:** Resolved
- **Rationale:** Bumped `package.json` from `0.13.0` to `0.13.1`. Cross-document version consistency restored.

## F-3 — Hardcoded rgba in `.activeLane`

- **Status:** Not Resolved
- **Rationale:** Per plan, no change required for M13.1 (`plans/ACTIVE.md:222` explicitly accepts hardcoded rgba values since the project lacks `--color-accent-rgb` channel variables). A future M14+ milestone may add CSS channel variables.

## F-4 — Single property test in `runnerCourse.test.ts`

- **Status:** Not Resolved
- **Rationale:** Plan only requires "at least one test" for the lane-constraint invariant. The `state.test.ts` runner food test provides indirect end-to-end coverage of snake/obstacle exclusion. Additional invariant tests are a future-milestone consideration.

## F-5 — `.laneIndicator` removal is clean

- **Status:** Not Resolved
- **Rationale:** No issue exists. Build produces no warnings. Removal was already clean at review time.

## F-6 — `data-runner` attribute has real visual effect

- **Status:** Not Resolved
- **Rationale:** No issue exists. The green accent border is the correct design choice (vs. removing the attribute as dead code). PLAN_REVIEW Required Change #4 satisfied.

## F-7 — No automated visual regression tooling

- **Status:** Not Resolved
- **Rationale:** Project-level limitation, not M13.1-specific. Plan explicitly accepts this. No visual regression tooling exists in the project.

## F-8 — Plan awaiting archival

- **Status:** Resolved
- **Rationale:** Updated `plans/ACTIVE.md` status from "Review Fixes Applied" to "Approved". Plan is ready for archival per the M13 precedent.

## F-9 — No ADR for lane visualization decision

- **Status:** Not Resolved
- **Rationale:** Lane visualization approach is well-documented in `ARCHITECTURE.md:191-193`. ADR not required per project ADR rules. M13 precedent also did not create an ADR.

## F-10 — Test name could be more specific

- **Status:** Not Resolved
- **Rationale:** Test name is clear enough for maintenance purposes. Enhancement suggestion, not a defect.

---

## Final Status: Ready for Re-Review

### Files Modified
- `package.json` — Version bumped from `0.13.0` to `0.13.1`
- `plans/ACTIVE.md` — Status updated from "Review Fixes Applied" to "Approved"
- `reviews/IMPLEMENTATION_REVIEW.md` — Resolution Summary updated (this section)

### Findings Resolved
- F-2: `package.json` version bumped to match `PROJECT_STATE.md`

### Findings Intentionally Not Resolved
- F-1: Visual outcome validation package — project owner responsibility
- F-3: Hardcoded rgba — per-plan, no change for M13.1
- F-4: Single property test — per-plan, already sufficient
- F-5: `.laneIndicator` removal — already clean, no issue
- F-6: `data-runner` effect — correct as-is
- F-7: No visual regression tooling — project-level, not M13.1 scope
- F-8: Plan archival — post-approval, plan status updated to "Approved"
- F-9: No ADR — documented in ARCHITECTURE.md, ADR not required
- F-10: Test name specificity — acceptable as-is

### Tests Executed
Not required for these changes (version bump + plan status update only). No code behavior changes.

### Remaining Risks
- F-1: CR-2 (board communicates runner gameplay within 5 seconds) requires project owner visual validation. All code enabling visual validation is in place.

---

# Verification Results (2nd-Pass Review)

**Reviewer:** Staff Engineer (2nd-Pass Verification)
**Verification date:** 2026-06-11
**Scope:** Verify whether all Critical and High findings from the original review have been adequately addressed. Do not perform a new full review; do not introduce new findings unless Critical or directly caused by remediation work.

## Critical and High Findings Inventory

The original implementation review (`reviews/IMPLEMENTATION_REVIEW.md:70-141`) identified **10 findings (F-1 through F-10), all classified as Low severity**. **No Critical or High findings were raised.**

The original review's "Major Concerns" section (`reviews/IMPLEMENTATION_REVIEW.md:60-66`) explicitly states: "None. All critical requirements are met: CR-1, CR-2, CR-3." The Final Decision was "Approve" (`reviews/IMPLEMENTATION_REVIEW.md:251`).

## Per-Finding Verification (Resolution Summary claims)

The implementation's "Resolution Summary" claims the following status changes from the original review. This 2nd-pass verifies those claims against the working tree.

### F-1 — Visual outcome validation package not in repository

- **Original severity:** Low (Documentation / Process)
- **Claimed status:** Not Resolved
- **Verification result:** **Confirmed.** `git status` and repository inspection show no screenshot, video, or visual validation artifacts. This is a project-owner deliverable, not a code-review deliverable, per the original review's recommendation (`reviews/IMPLEMENTATION_REVIEW.md:261, 343`). The code, CSS, and structural changes supporting visual validation are all in place.
- **Critical/High classification:** N/A — Low severity.

### F-2 — `package.json` at 0.13.0 vs `PROJECT_STATE.md` at v0.13.1

- **Original severity:** Low (Documentation)
- **Claimed status:** Resolved
- **Verification result:** **Confirmed Resolved.** `package.json:4` shows `"version": "0.13.1"`, matching `docs/PROJECT_STATE.md:5` (`v0.13.1`). Cross-document version consistency is restored.
- **Critical/High classification:** N/A — Low severity.

### F-3 — Hardcoded rgba in `.activeLane`

- **Original severity:** Low (Maintainability)
- **Claimed status:** Not Resolved
- **Verification result:** **Confirmed unchanged (per-plan acceptable).** `Cell.module.css:13-14` retains `rgba(34, 197, 94, 0.08)` and `rgba(34, 197, 94, 0.15)`. The original review explicitly accepted this for M13.1 (`reviews/IMPLEMENTATION_REVIEW.md:91, 263, 344`) since the project lacks `--color-accent-rgb` channel variables; a future M14+ milestone may add them.
- **Critical/High classification:** N/A — Low severity.

### F-4 — Single property test in `runnerCourse.test.ts`

- **Original severity:** Low (Testing)
- **Claimed status:** Not Resolved
- **Verification result:** **Confirmed unchanged (per-plan sufficient).** `src/game/__tests__/runnerCourse.test.ts` still contains a single 100-iteration property test verifying `spawnRunnerFood` lane constraint. The original review explicitly accepted this (`reviews/IMPLEMENTATION_REVIEW.md:98, 264, 345`) because the plan required only "at least one test" and `state.test.ts:1141-1158` provides end-to-end coverage of snake/obstacle exclusion.
- **Critical/High classification:** N/A — Low severity.

### F-5 — `.laneIndicator` removal is clean

- **Original severity:** Low (Documentation)
- **Claimed status:** Not Resolved (no issue existed)
- **Verification result:** **Confirmed.** `RunnerGame.module.css` contains no `.laneIndicator` ruleset. `npm run build` produces no warnings about unused CSS.
- **Critical/High classification:** N/A — Low severity.

### F-6 — `data-runner` attribute has real visual effect

- **Original severity:** Low (Style)
- **Claimed status:** Not Resolved (no issue existed)
- **Verification result:** **Confirmed.** `Board.module.css:16-18` retains `.board[data-runner="true"] { border: 2px solid var(--color-accent); }`. The green accent border is in place and functional.
- **Critical/High classification:** N/A — Low severity.

### F-7 — No automated visual regression tooling

- **Original severity:** Low (Testing)
- **Claimed status:** Not Resolved (project-level limitation)
- **Verification result:** **Confirmed (out of M13.1 scope).** No Playwright, Chromatic, Percy, or similar tooling is present in `package.json`. The original review explicitly accepted this as a known project-level limitation, not M13.1-specific (`reviews/IMPLEMENTATION_REVIEW.md:119, 265, 348`).
- **Critical/High classification:** N/A — Low severity.

### F-8 — Plan awaiting archival

- **Original severity:** Low (Process)
- **Claimed status:** Resolved
- **Verification result:** **Confirmed Resolved.** `plans/ACTIVE.md:3` shows `**Status:** Approved`. The plan is now in the post-approval state and ready for archival per the M13 precedent (commit `fdf80c2`).
- **Critical/High classification:** N/A — Low severity.

### F-9 — No ADR for lane visualization decision

- **Original severity:** Low (Process)
- **Claimed status:** Not Resolved (ADR not required)
- **Verification result:** **Confirmed (not required).** No ADR exists for the lane visualization approach. The original review explicitly accepted this (`reviews/IMPLEMENTATION_REVIEW.md:133, 350`) because the approach is documented in `ARCHITECTURE.md:191-193` and the M13 precedent also did not create an ADR.
- **Critical/High classification:** N/A — Low severity.

### F-10 — Test name could be more specific

- **Original severity:** Low (Testing)
- **Claimed status:** Not Resolved (enhancement, not defect)
- **Verification result:** **Confirmed unchanged (acceptable as-is).** Test name in `Cell.test.tsx` is unchanged. Original review explicitly accepted this (`reviews/IMPLEMENTATION_REVIEW.md:140, 351`).
- **Critical/High classification:** N/A — Low severity.

## Critical/High Verification Summary

| Severity | Count | Resolved | Partially Resolved | Unresolved | N/A (per-plan) |
|----------|-------|----------|--------------------|-----------:|----------------|
| Critical | 0     | 0        | 0                  | 0          | 0              |
| High     | 0     | 0        | 0                  | 0          | 0              |
| Low      | 10    | 2 (F-2, F-8) | 0              | 0          | 8 (per-plan acceptable, out of M13.1 scope, or no issue) |

**Conclusion:** No Critical or High findings were raised in the original review. The two resolution claims (F-2 and F-8) are both verified accurate against the working tree. The eight "Not Resolved" Low-severity items are all explicitly per-plan acceptable, project-owner responsibility, project-level limitations, or enhancements rather than defects — none represent remediation gaps.

## Re-Execution of Verification Commands

To confirm the remediation work did not regress the implementation:

- `npm test -- --run` → **434/434 passing across 27 test files** (matches the original review's count exactly; 0 failures, 0 regressions)
- `package.json:4` → `0.13.1` (F-2 verified)
- `plans/ACTIVE.md:3` → `**Status:** Approved` (F-8 verified)
- `docs/PROJECT_STATE.md:5` → `v0.13.1` (cross-document consistency with `package.json` confirmed)

---

# Approval Decision

**Approve.**

The M13.1 implementation has no Critical or High findings to remediate. The original review's verdict was Approve, and the implementation update between the 1st-pass review and this 2nd-pass verification was narrow and on-point:

1. F-2 (cross-document version drift): Verified resolved.
2. F-8 (plan status pre-archival): Verified resolved.
3. The eight other findings (F-1, F-3, F-4, F-5, F-6, F-7, F-9, F-10) remain unchanged by design, each with a documented rationale that is per-plan acceptable or out of M13.1 scope.
4. Test suite remains at 434/434 passing with no regressions.
5. No new Critical findings were introduced by the remediation work.

The implementation is ready for merge and plan archival.

### Required before merge
None.

### Required before plan archival
- Move `plans/ACTIVE.md` to `plans/archive/` per the M13 precedent (commit `fdf80c2`). Pure process.

### Optional (advisory)
- F-1 (project owner visual validation package): The 5 screenshots + 30-second gameplay recording + 5 validation questions per the plan's CR-2 and Phase 5 are still outstanding. This is a project-owner deliverable, not a code review blocker, but should be produced before any release tagging.
