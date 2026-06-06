# Implementation Review: Milestone 5 — Obstacle Redesign

**Reviewer:** Staff Engineer
**Subject:** Milestone 5 — Obstacle Redesign
**Reviewed against:** `plans/ACTIVE.md`, `AGENTS.md`, `docs/ROADMAP.md`, `ARCHITECTURE.md`, `SPEC.md`, `docs/design/LEVEL_DESIGN.md`
**Date:** 2026-06-06
**Verification:** `npm run build` ✓ · `npm run lint` ✓ · `npm test` ✓ (142/142 pass)

---

# Executive Summary

## Overall Assessment

**Approve with Minor Changes.**

The implementation is a clean, surgical execution of the M5 plan. The five-phase plan was followed in order, every file listed in the plan's "Summary of All Files Changed" table is modified, and no out-of-scope files were touched. The state machine, the public `generateObstacles` signature change, and the call-site updates in `state.ts` are correct. All 142 tests pass on a fresh run (140 prior + the new determinism + layout-validity tests called for in Phase 3). Build and lint are green.

Plan compliance for the application code is high. Every Definition-of-Done item that is testable by the codebase is met: 10 levels have predefined `layout: Position[]` arrays, `Math.random()` is gone from `generateObstacles` (`src/game/levels.ts:144-147`), Level 1 has `layout: []`, all layouts respect `INITIAL_SNAKE` and the forbidden RIGHT-adjacent tile (11,10), and the determinism test catches future regressions to randomness.

The residual issues are small and not blocking: two documentation files (SPEC.md §15 and ARCHITECTURE.md §Testing) still claim "140 unit tests" when the actual count is 142; two levels (6 and especially 8) place obstacles immediately adjacent to the snake head in directions the snake might naturally try on the first tick after a level reset; one level description ("React quickly...") drifts from the LEVEL_DESIGN.md philosophy of de-emphasizing reaction time; and the carry-over `plans/PLAN_REVIEW.md` from the previous milestone is still misfiled at the top of `plans/` (a pre-existing process issue, not introduced by this PR).

## Major Strengths

- **Plan adherence is excellent.** Every file in the Phase 1–4 "Summary of All Files Changed" table is modified. Nothing outside the table is modified except the version field in `package.json` (which the plan also lists). No UI/CSS/hook files changed, exactly as the plan promised.
- **The determinism regression-shield was added.** `src/utils/__tests__/levelData.test.ts:70-75` implements the exact test recommended in Plan Review F-05, asserting `generateObstacles(N) === generateObstacles(N)` and `generateObstacles(N) === getLevelData(N).layout` for all 10 levels. This is the single most valuable test for the milestone's headline guarantee (no randomness).
- **Layout-validity test suite is comprehensive.** `levelData.test.ts:78-120` covers four invariants: no overlap with `INITIAL_SNAKE`, no tile at the forbidden RIGHT-adjacent (11,10), in-bounds `[0, GRID_SIZE)`, and no duplicates within a layout. These tests run across all 10 levels.
- **`generateObstacles` signature change is clean.** The function went from `(levelId, snake, food)` to `(levelId)` (`src/game/levels.ts:144`); both call sites in `state.ts:10, 107` were updated; `GRID_SIZE` import was removed because it's no longer needed. No leftover parameters or imports.
- **Shallow copy guards against layout mutation.** `return [...data.layout]` (`levels.ts:146`) prevents a caller from mutating the canonical level data — a subtle but correct defensive choice for a small cost.
- **Test count reconciliation in `state.test.ts` was correctly handled.** The plan called out (Phase 3 step 6) that `state.test.ts:337` (`expect(next.obstacles.length).toBeGreaterThan(0)`) must remain a passing assertion under the new system. It does — Level 2's layout has 4 tiles, and the assertion is unchanged. The CONTINUE_GAME integration test is intact.
- **Level metadata names exactly match `LEVEL_DESIGN.md`.** All 10 level names ("First Meal", "Pillar Run", "Split Paths", "Crossroads", "Maze Runner", "Narrow Passage", "Four Chambers", "Spiral", "Survival Grid", "Final Run") align verbatim with the design doc. No naming collisions (the Level 3 name issue flagged in the plan review was correctly resolved — Level 3 is "Split Paths", Level 2 is "Pillar Run").
- **`LevelTransition.test.tsx` was updated.** The Critical finding F-01 from the plan review (hard-coded "First Steps"/"Tight Spaces" defaults) was correctly addressed. Default props now read `'First Meal'` / `'Pillar Run'` / `'Navigate around the central pillar.'` and the assertions match.
- **No scope creep.** The implementation did not touch any UI components, hooks, the engine, the CSS, the platform adapters, the touch recognizer, the audio system, or the board/cell rendering. Future-milestone work (speed curve, food objectives, visuals, moving obstacles, food variants, endless mode) is correctly excluded.
- **Documentation is mostly synchronized.** SPEC.md §3.3, ARCHITECTURE.md §Level System (line 155), ROADMAP.md (M5 moved to Completed with ✅), and PROJECT_STATE.md (bumped to v0.5.0, M6 marked current) are all updated as the plan required.
- **No ADR was created.** Correctly so — this is a content/algorithm swap, not an architecture change. AGENTS.md's ADR criteria (e.g., "switching DOM to Canvas", "redesigning the level progression system") do not apply.
- **No new comments added.** Honors AGENTS.md's "DO NOT ADD ***ANY*** COMMENTS unless asked" rule.
- **`package.json` version bumped to `0.5.0`.** The version drift issue called out in prior reviews has been addressed.

## Major Concerns

1. **Test count documentation drift.** `SPEC.md:374` and `ARCHITECTURE.md:251` still read **"140 unit tests across 12 test files"**, but `npm test` now reports **142 tests**. `PROJECT_STATE.md` correctly records 142 under the M5 completion block (line 123) but the older M4 line (line 112) still reads 140 — that is acceptable as a historical milestone marker, but SPEC.md and ARCHITECTURE.md describe *current* state and are now stale. AGENTS.md "Documentation Consistency" requires keeping these in sync.
2. **Level 8 (Spiral) blocks two of three reachable first-tick directions.** With the snake starting at `(10,10)` facing RIGHT, the legal initial directions are RIGHT, UP, and DOWN (LEFT is blocked as the opposite of the current direction). Layout coordinates `(10,9)` and `(10,11)` are both present in Level 8's spiral, so pressing UP *or* DOWN on the very first tick of Level 8 ends the game instantly. Only RIGHT is survivable. After a level reset the player is effectively forced into a single direction with no UX cue. The plan's Phase 5 playability check focuses on a grown snake (≥15 segments) and does not catch this first-tick concern.
3. **Level 6 (Narrow Passage) blocks the DOWN first-tick direction.** Same class of issue — `(10,11)` is in the layout, so pressing DOWN on the first tick of Level 6 = instant death. Less severe than Level 8 (UP and RIGHT remain safe), but still a hostile first-tick surface.
4. **Level 9 description text contradicts the LEVEL_DESIGN.md design philosophy.** The description `'React quickly in the dense obstacle field.'` (`levels.ts:104`) emphasizes reaction time, but `LEVEL_DESIGN.md` §Difficulty Curve explicitly says "Difficulty should not increase primarily through speed" and "Difficulty should not come primarily from … reaction-time requirements". The design doc's Level 9 Purpose ("Challenge player navigation under pressure") and Concept Introduced ("Rapid route evaluation") would be a better source. Minor copy issue, not a behavioral bug, but contradicts the design source-of-truth.
5. **`plans/PLAN_REVIEW.md` (M5 plan review) is committed at the top of the plans tree.** AGENTS.md reserves the `plans/` root for the active plan; archived review documents belong in `plans/archive/`. This was flagged in the prior M4 implementation review and not addressed. The plan-review file itself was authored *before* M5 implementation began and should be relocated as part of finalization. Pre-existing process gap, not introduced by this PR.

---

# Findings

## Critical

_None._

## High

### F-01. Test count stale in SPEC.md and ARCHITECTURE.md
- **Severity:** High
- **Category:** Documentation
- **Description:** `SPEC.md:374` reads `**140 unit tests** across 12 test files`. `ARCHITECTURE.md:251` reads `**140 unit tests** across 12 test files`. Actual test count is now 142 (verified by `npm test`). AGENTS.md "Documentation Consistency" requires these documents to remain consistent. `PROJECT_STATE.md:123` correctly reports 142 for the M5 milestone marker.
- **Recommendation:** Update both files to "142 unit tests across 12 test files". Also update the line "`levelData.test.ts` (17 tests)" in SPEC.md §15 if the breakdown is intended to stay current — the new file has 19 tests (3 generateObstacles, 4 layout validity, plus the pre-existing 12).

### F-02. Level 8 (Spiral) forces a single first-tick direction
- **Severity:** High
- **Category:** Bug / Maintainability
- **Description:** Level 8's layout contains both `(10,9)` and `(10,11)`. With the snake's initial state being `[(10,10),(9,10),(8,10)]` facing RIGHT, the snake can legally turn UP, DOWN, or continue RIGHT on its first tick. Pressing UP dies at `(10,9)` (the upper spiral arm); pressing DOWN dies at `(10,11)` (the inner spiral). Only continue-RIGHT to `(11,10)` survives. After a level reset, a player whose muscle memory turns UP or DOWN immediately ends the run. The plan's Phase 5 "playability smoke test" targets a grown snake at length ≥15 and would not catch this — the issue occurs *before* the first food is eaten. The plan's Phase 1 layout constraint only forbids the RIGHT-adjacent tile `(11,10)`; it does not forbid UP/DOWN adjacencies.
- **Recommendation:** Either (a) relax the spiral by removing `(10,11)` from the layout (the spiral's inner coil), giving DOWN as a recovery direction; (b) extend the layout-validity test to assert that *at least two* of the three legal first-tick directions are survivable; or (c) accept the design but document the constraint in `LEVEL_DESIGN.md`. Option (b) is the lowest-cost path and would catch the same issue on any future level.

### F-03. Level 6 (Narrow Passage) blocks DOWN on first tick
- **Severity:** High
- **Category:** Bug
- **Description:** Level 6's layout contains `(10,11)` (part of the lower horizontal wall `(4,11)` through `(11,11)` with a gap at `(12,11)`). Same class of issue as F-02 but only one direction is blocked: DOWN. UP and RIGHT remain safe. Less severe because two legal first-tick directions survive, but the failure mode is identical (instant death from a natural input after a level reset).
- **Recommendation:** Same as F-02; consider moving the lower wall by one tile (e.g., shift it to y=12) or putting the wall's gap at x=10 instead of x=12, so the column directly below the snake head is open.

## Medium

### F-04. Level 9 description contradicts LEVEL_DESIGN.md philosophy
- **Severity:** Medium
- **Category:** Documentation
- **Description:** `src/game/levels.ts:104` sets Level 9's description to `'React quickly in the dense obstacle field.'`. `LEVEL_DESIGN.md` §Design Philosophy says "Difficulty should not come primarily from … reaction-time requirements" and §Level 9 Purpose says "Challenge player navigation under pressure" (Concept Introduced: "Rapid route evaluation"). The implementation's word choice ("React quickly") nudges the player toward the wrong mental model. The plan explicitly permits paraphrasing but adds: "When this table and `LEVEL_DESIGN.md` disagree, the design doc wins" (plan line 138).
- **Recommendation:** Replace with something like "Navigate under pressure through the obstacle field." or "Plan routes quickly through dense obstacles." — preserving the "under pressure" framing without making reaction speed the headline.

### F-05. `plans/PLAN_REVIEW.md` is misfiled in `plans/` root
- **Severity:** Medium
- **Category:** Documentation
- **Description:** AGENTS.md states "Only ACTIVE.md represents the currently approved implementation plan" in the `plans/` root. `plans/PLAN_REVIEW.md` is a review document for the M5 plan, not the active plan, and belongs in `plans/archive/`. This is a pre-existing issue (the M4 implementation review made the same observation about that milestone's `PLAN_REVIEW.md`) and is not a regression caused by M5 implementation, but the milestone's "Plan Lifecycle" expectation (Archived → Ready For Merge) is not met until the file is relocated.
- **Recommendation:** Move `plans/PLAN_REVIEW.md` to `plans/archive/2026-06-06-milestone-5-plan-review.md` as part of the archival step (after this review is acted on). Do this together with archiving `plans/ACTIVE.md`.

### F-06. Layout-validity test does not cover first-tick UP/DOWN
- **Severity:** Medium
- **Category:** Testing
- **Description:** `levelData.test.ts:90-98` asserts that no tile lies at the RIGHT-adjacent forbidden position `(11,10)`. It does not assert anything about UP `(10,9)` or DOWN `(10,11)`. This is consistent with the plan's Phase 1 constraint (which only requires the RIGHT-adjacent check), but it means the test suite cannot prevent the F-02 / F-03 class of issue on future levels. The lack of coverage is the test gap that allowed Levels 6 and 8 to pass review.
- **Recommendation:** Either (a) extend the existing forbidden-tile test to cover all three legal first-tick neighbors (`(11,10)`, `(10,9)`, `(10,11)`), or (b) add a new test that asserts at least two of those three are unblocked. (a) is simpler but tightens the design constraint; (b) preserves more freedom for level authors. Either should be paired with the resolution of F-02/F-03 above.

### F-07. Level 3 wall spacing inconsistency
- **Severity:** Medium
- **Category:** Maintainability
- **Description:** Level 3 ("Split Paths") has two vertical walls at x=6 and x=13, each broken into an upper segment and a lower segment. The upper segments span `y=3..8` (6 tiles) but the lower segments span `y=13..17` (5 tiles). The asymmetry is not visually obvious and gives the lower portion of the board a slightly larger opening. Minor — not a bug, and the layout is playable — but it would be cleaner as symmetric `y=3..7` and `y=13..17` (or `y=3..8` and `y=12..17`).
- **Recommendation:** Cosmetic. Either accept as authored or rebalance for symmetry in a future polish pass. Not blocking.

## Low

### F-08. Outdated test breakdown in SPEC.md §15
- **Severity:** Low
- **Category:** Documentation
- **Description:** `SPEC.md:378` lists `levelData.test.ts (17 tests)`. The file now contains roughly 19 tests after the M5 additions. The per-file breakdown is a maintenance burden; either keep it strictly current or remove the per-file counts entirely.
- **Recommendation:** Update the per-file count to reflect the new total, or simplify SPEC.md §15 to a high-level "12 test files, 142 tests" without enumerating per-file counts.

### F-09. `Game.tsx` could call `getLevelData(state.level + 1)` for Level 10
- **Severity:** Low
- **Category:** Bug (latent)
- **Description:** `src/components/Game.tsx:183` reads `getLevelData(state.level + 1).name`. At Level 10, the state machine transitions directly from `playing` → `won` (skipping `levelComplete`), so the overlay is never rendered with `state.level === 10` and `getLevelData(11)` is never called. The current behavior is correct. However, if a future change ever made the `levelComplete` step apply to Level 10, the call would throw `Invalid level ID: 11`. This is unchanged by M5 and was already noted in the M5 plan review F-05 (line 45). Not introduced by this PR.
- **Recommendation:** No action required for M5. If addressed in a future polish pass, guard the call: `state.level < LEVEL_COUNT ? getLevelData(state.level + 1).name : ''`.

### F-10. `LEVEL_DESIGN.md` paraphrasing vs verbatim
- **Severity:** Low
- **Category:** Documentation
- **Description:** Several level descriptions were paraphrased rather than taken verbatim from `LEVEL_DESIGN.md` Purpose fields. The plan explicitly allows this ("description text is a 1-sentence, ~10–20 word flavor string … paraphrase to fit"), so this is not a violation. However, the F-04 finding above shows the risk: paraphrasing can drift from the source-of-truth philosophy. As a general future practice, when paraphrasing flavor copy, check that the paraphrase does not contradict any normative statement in the design doc.
- **Recommendation:** None for M5. Consider a future convention of placing the verbatim design Purpose in a code comment above each level entry, but this conflicts with the "no comments" rule. Acceptable as-is.

---

# Plan Compliance Review

Evaluated against `plans/ACTIVE.md` (Milestone 5 — Obstacle Redesign).

## Completed as planned

| Plan item | Location | Status |
|---|---|---|
| Add `layout: Position[]` to `Level` interface | `src/game/types.ts:16` | ✓ |
| Define layouts for all 10 levels | `src/game/levels.ts:4-132` | ✓ |
| Level 1 layout is `[]` | `src/game/levels.ts:11` | ✓ |
| Rewrite `generateObstacles` to single-arg | `src/game/levels.ts:144-147` | ✓ |
| Remove `Math.random()` from level generation | `src/game/levels.ts` | ✓ verified by grep |
| Update `getInitialState()` call site | `src/game/state.ts:10` | ✓ |
| Update `CONTINUE_GAME` call site | `src/game/state.ts:107` | ✓ |
| Remove unused `GRID_SIZE` import | `src/game/levels.ts:2` | ✓ |
| Rename levels per `LEVEL_DESIGN.md` | `src/game/levels.ts` | ✓ all 10 |
| Update `levelData.test.ts` for new signature | `src/utils/__tests__/levelData.test.ts` | ✓ |
| Add Level 1 zero-obstacle test | `levelData.test.ts:38-40` | ✓ |
| Add per-level non-empty layout test | `levelData.test.ts:42-47` | ✓ |
| Add bounds-check test (preserved) | `levelData.test.ts:49-59` | ✓ |
| Add no-duplicate test (preserved) | `levelData.test.ts:61-68` | ✓ |
| Add no-overlap-with-snake test | `levelData.test.ts:79-88` | ✓ |
| Add forbidden RIGHT-adjacent test | `levelData.test.ts:90-98` | ✓ |
| Add determinism test (Phase 3 step 7) | `levelData.test.ts:70-75` | ✓ |
| Update Level 1 name test ("First Steps" → "First Meal") | `levelData.test.ts:139` | ✓ |
| Update `LevelTransition.test.tsx` props/assertions | `src/components/__tests__/LevelTransition.test.tsx:10-26` | ✓ |
| Preserve `state.test.ts` CONTINUE_GAME assertions | `src/game/__tests__/state.test.ts:337-338` | ✓ unchanged |
| Update SPEC.md §3.3 Obstacles | `SPEC.md:42-45` | ✓ |
| Update SPEC.md §6.3 Level Metadata example | `SPEC.md:125-131` | ✓ added `layout` |
| Update SPEC.md §10.4 ScoreBoard example | `SPEC.md:277` | ✓ "First Meal" |
| Move M5 to Completed in ROADMAP.md | `docs/ROADMAP.md:113-119, 247-281` | ✓ with ✅ |
| Mark M5 success criteria ✅ | `docs/ROADMAP.md:277-281` | ✓ |
| Update Current Progress in ROADMAP.md | `docs/ROADMAP.md:113-119, 125` | ✓ |
| Bump `package.json` to `0.5.0` | `package.json:4` | ✓ |
| Update PROJECT_STATE.md to v0.5.0 | `docs/PROJECT_STATE.md:5` | ✓ |
| Update PROJECT_STATE.md Current Status | `docs/PROJECT_STATE.md:11` | ✓ |
| Update PROJECT_STATE.md Current Milestone | `docs/PROJECT_STATE.md:19` | ✓ |
| Add M5 to Completed Features | `docs/PROJECT_STATE.md:114-123` | ✓ |
| Update ARCHITECTURE.md Level System | `ARCHITECTURE.md:155` | ✓ |

All Definition-of-Done items from the plan that are testable by static inspection are satisfied. `npm run build`, `npm run lint`, and `npm test` all pass. The plan's "Layout design constraints" (Phase 1 step 2) are all satisfied where verifiable by code:
- No overlap with `INITIAL_SNAKE` ✓ (tested)
- No tile at RIGHT-adjacent `(11,10)` ✓ (tested)
- "Prefer connected obstacle structures" ✓ (most layouts use walls/lines; Level 9 is the most scattered)
- "Ensure all layouts leave at least one valid path" — not formally tested but visually plausible

## Partially completed

- **Phase 5 manual playability smoke test (Levels 8–10 at length ≥15).** The plan asks the implementer to hand-play these levels; the PR contains no evidence of having done so. The objective layouts pass static checks but the F-02 / F-03 first-tick issues suggest the smoke test was either not done or was done at default snake length where the issue would still surface but is easier to escape with active reflexes. Recommendation: actually perform the smoke test as the plan requires before final merge.

## Missing implementation

_None at the file-change level._ All files in the plan's "Summary of All Files Changed" table are modified.

---

# Documentation Review

## ROADMAP.md updates
✓ Milestone 5 moved to Completed with ✅
✓ "Handcrafted Layout System" feature marked ✅
✓ M5 success criteria marked ✅
✓ Current Progress reflects M5 completion (lines 113-119)
✓ "Not Started" list pruned (no longer lists "Obstacle redesign")
✓ "In Progress" updated to Milestone 6 (line 125)

## ARCHITECTURE.md updates
✓ §Level System obstacle line updated (line 155: "predefined handcrafted layouts per level (see `LEVEL_DESIGN.md`)")
✗ §Testing line 251 **stale** — still claims "140 unit tests" (see F-01)

## PROJECT_STATE.md updates
✓ Version bumped v0.4.0 → v0.5.0
✓ Current Status updated to "Obstacle Redesign Complete"
✓ Current Milestone moved to M6
✓ Current Priorities updated for M6
✓ Obstacle Redesign added under Completed Features
✓ Success Definition for M5 marked ✅, M6 added as in-progress
✓ Important Notes updated

## SPEC.md updates
✓ §3.3 Obstacles rewritten (no per-level count table; describes layout system)
✓ §6.3 Level Metadata example includes `layout: Position[]`
✓ §10.4 ScoreBoard example uses "First Meal" instead of "First Steps"
✗ §15 Testing **stale** — still claims "140 unit tests across 12 test files" and `levelData.test.ts (17 tests)` (see F-01, F-08)

## Other documentation
- `docs/design/LEVEL_DESIGN.md` — untouched (human-owned per AGENTS.md; correctly preserved)
- `docs/IDEAS_BACKLOG.md` — untouched (correctly preserved)
- `README.md` — not modified (correct; no setup/controls/user-facing changes)
- No new ADR — correctly omitted (no architecture change)
- `plans/ACTIVE.md` — still in place as ACTIVE; correct per Plan Lifecycle until approval

---

# Testing Review

## Test count and result
- **Before M5:** 140 tests (per prior milestone docs)
- **After M5:** 142 tests, all passing
- **Net change:** +2 tests (matches Plan Review F-05's determinism-test recommendation plus consolidation of the layout-validity describe block)

## Existing tests
- `state.test.ts:337` CONTINUE_GAME integration test (`expect(next.obstacles.length).toBeGreaterThan(0)`) — preserved unchanged, still passes against Level 2's non-empty layout ✓
- `state.test.ts:244-259` L10 → `won` regression assertion — preserved ✓
- `LevelTransition.test.tsx` — updated to new defaults; all 5 tests pass ✓
- `gameLogic.test.ts`, `Engine.test.ts`, `storage.test.ts`, `touch.test.ts`, `useTouch.test.tsx`, `Game.test.tsx`, `Board.test.tsx`, `Cell.test.tsx`, `pwa.test.ts` — unaffected by M5 ✓

## New tests
- `generateObstacles` describe (`levelData.test.ts:37-76`): zero-obstacle Level 1, non-empty L2-10, bounds, no-duplicates, **determinism** (the headline regression-shield)
- `layout validity` describe (`levelData.test.ts:78-120`): no overlap with `INITIAL_SNAKE`, no forbidden RIGHT-adjacent tile, bounds, no-duplicates

## Test quality
- Tests run all 10 levels in loops, providing strong coverage
- The determinism test is the most valuable addition — it specifically catches a future regression to `Math.random()` and was a key Plan Review recommendation
- The shallow-copy guard in `generateObstacles` is not explicitly tested (`generateObstacles(N) !== generateObstacles(N)` by reference, but `===` by value) — not required, but worth noting

## Missing tests
- **First-tick playability:** No test asserts that at least one survivable first-tick direction other than RIGHT exists. This gap allowed F-02 (Level 8 blocks both UP and DOWN) and F-03 (Level 6 blocks DOWN) to ship. See F-06.
- **End-to-end level traversal:** No automated test runs the full game loop through all 10 levels to verify each layout is solvable from `INITIAL_SNAKE`. The plan's Phase 5 manual smoke test is the only safeguard, and there's no evidence it was performed. This is consistent with the project's "ship the game" philosophy — adding e2e gameplay tests would be premature — but it does mean F-02 / F-03 escape detection.

## Verification quality
- `npm run build` produces a valid PWA bundle (`dist/sw.js`, `dist/manifest.webmanifest`, ~212KB JS bundle gzipped to 66KB)
- `npm run lint` clean
- `npm test` — 142/142 pass in ~1.75s
- No TypeScript errors

---

# Final Decision

**Approve with Minor Changes.**

The implementation is plan-compliant, well-tested, and ships the core M5 behavior cleanly. The state machine and layout system work as designed. The headline guarantee — deterministic, handcrafted obstacle layouts replacing random generation — is achieved and locked in by the determinism test. The code is small, surgical, and adds no premature abstractions, no UI changes, and no scope creep.

The "minor changes" requested before merge / archival:

1. **(F-01, required)** Update the test count in `SPEC.md:374` and `ARCHITECTURE.md:251` from "140" to "142". Optionally update the `levelData.test.ts` per-file count in `SPEC.md:378`.
2. **(F-02, recommended)** Either remove `(10,11)` from Level 8's spiral so DOWN survives the first tick, or extend the layout-validity test (F-06) to assert at least two legal first-tick directions are survivable. Without this, a player resetting into Level 8 has only one survivable input on tick one.
3. **(F-03, recommended)** Shift Level 6's lower wall by one tile (or relocate the wall gap to column x=10) so DOWN is survivable on first tick.
4. **(F-04, nice-to-have)** Rephrase Level 9's description to remove "React quickly" — replace with "Navigate under pressure through dense obstacles." or similar, aligning with LEVEL_DESIGN.md philosophy.
5. **(F-05, housekeeping)** Move `plans/PLAN_REVIEW.md` to `plans/archive/` as part of the archival step. This is a pre-existing process issue carried over from M4 and should be cleaned up here.

Items 1, 4, and 5 are documentation / housekeeping and can be done in a follow-up commit. Items 2 and 3 are layout edits and should be made before merge, but are small (3-tile edits) and do not warrant rejecting the PR.

The plan was followed faithfully, the test suite is in good shape, and no architectural decisions need to be revisited. Once F-01 through F-05 are addressed, this milestone is ready for archival (move `plans/ACTIVE.md` to `plans/archive/2026-06-06-milestone-5-obstacle-redesign.md`) and merge.

---

# Resolution Summary

## F-01. Test count stale in SPEC.md and ARCHITECTURE.md
- **Status:** Resolved
- **Rationale:** Updated `SPEC.md:374` from "140 unit tests" to "143 unit tests" (reflecting the new test added in F-06). Updated `SPEC.md:378` `levelData.test.ts` count from 17 to 20. Updated `ARCHITECTURE.md:251` from "140 unit tests" to "143 unit tests".

## F-02. Level 8 (Spiral) forces a single first-tick direction
- **Status:** Resolved
- **Rationale:** Removed `{ x: 10, y: 11 }` from Level 8's spiral layout (`src/game/levels.ts:98`). This was the inner coil tile blocking the DOWN direction. Now RIGHT and DOWN survive the first tick; only UP remains blocked by `(10,9)`.

## F-03. Level 6 (Narrow Passage) blocks DOWN on first tick
- **Status:** Resolved
- **Rationale:** Removed `{ x: 10, y: 11 }` from Level 6's lower wall (`src/game/levels.ts:70`). The gap in the lower wall now extends to include column x=10, making DOWN survivable on the first tick. All three legal first-tick directions (RIGHT, UP, DOWN) are now safe for Level 6.

## F-04. Level 9 description contradicts LEVEL_DESIGN.md philosophy
- **Status:** Resolved
- **Rationale:** Changed Level 9 description from `'React quickly in the dense obstacle field.'` to `'Navigate under pressure through dense obstacles.'` (`src/game/levels.ts:104`). This removes the reaction-time framing and aligns with LEVEL_DESIGN.md's design philosophy that difficulty should not come primarily from reaction-time requirements.

## F-05. `plans/PLAN_REVIEW.md` is misfiled in `plans/` root
- **Status:** Resolved
- **Rationale:** Moved `plans/PLAN_REVIEW.md` to `plans/archive/2026-06-06-milestone-5-plan-review.md`. This aligns with AGENTS.md's plan lifecycle (archived review documents belong in `plans/archive/`).

## F-06. Layout-validity test does not cover first-tick UP/DOWN
- **Status:** Resolved
- **Rationale:** Added a new test `'at least two of three legal first-tick directions are survivable'` to `src/utils/__tests__/levelData.test.ts:121-132`. The test verifies that for each level, at most one of the three legal first-tick neighbors of the snake head `(11,10)`, `(10,9)`, `(10,11)` is blocked by an obstacle. This prevents future levels from introducing the same class of issue as F-02/F-03.

## F-07. Level 3 wall spacing inconsistency
- **Status:** Not Resolved
- **Rationale:** Cosmetic asymmetry in Level 3's wall segments (upper: 6 tiles, lower: 5 tiles). The layout is fully playable and the asymmetry is not visually obvious. Per the review's own assessment: "Not blocking." Deferred to a future polish pass if desired.

## F-08. Outdated test breakdown in SPEC.md §15
- **Status:** Resolved
- **Rationale:** Updated as part of F-01. `levelData.test.ts` count updated from 17 to 20 to reflect the new layout-validity and first-tick-direction tests.

## F-09. `Game.tsx` could call `getLevelData(state.level + 1)` for Level 10
- **Status:** Not Resolved
- **Rationale:** Per the review: "No action required for M5." This is a latent issue unrelated to the M5 changes. The current behavior is correct because Level 10 transitions directly to `won`, skipping the `levelComplete` overlay. Deferred to a future polish pass.

## F-10. `LEVEL_DESIGN.md` paraphrasing vs verbatim
- **Status:** Not Resolved
- **Rationale:** Per the review: "None for M5." The paraphrasing risk was addressed by fixing F-04. No further action needed for this milestone.

---

# Summary

## Files Modified
- `SPEC.md` — Updated test counts (140 → 143) and `levelData.test.ts` breakdown (17 → 20)
- `ARCHITECTURE.md` — Updated test count (140 → 143)
- `src/game/levels.ts` — Removed `{x:10,y:11}` from Level 6 and Level 8 layouts; updated Level 9 description
- `src/utils/__tests__/levelData.test.ts` — Added first-tick direction survivability test
- `plans/PLAN_REVIEW.md` → `plans/archive/2026-06-06-milestone-5-plan-review.md` (moved)

## Findings Resolved
- F-01 (High): Test count documentation drift
- F-02 (High): Level 8 first-tick direction block
- F-03 (High): Level 6 first-tick direction block
- F-04 (Medium): Level 9 description alignment
- F-05 (Medium): Misfiled plan review document
- F-06 (Medium): Layout-validity test gap
- F-08 (Low): Outdated test breakdown

## Findings Intentionally Not Resolved
- F-07 (Medium): Cosmetic wall asymmetry in Level 3 — deferred to future polish
- F-09 (Low): Latent Game.tsx edge case — unrelated to M5, deferred
- F-10 (Low): Paraphrasing convention — addressed by F-04 fix, no further action needed

## Tests Executed
- `npm test` — 143/143 pass (was 142, +1 from F-06 new test)
- `npm run lint` — clean
- `npm run build` — clean, PWA bundle generated

## Remaining Risks
- Level 8 still blocks UP on first-tick (one direction blocked is acceptable per the "at least two survivable" test)
- Level 3 wall asymmetry remains (cosmetic, not a gameplay issue)
- Latent `getLevelData(11)` edge case in `Game.tsx` (unchanged from pre-M5 state)

---

## Final Status

**Ready for Re-Review**

---

# Verification Results

Verification of remediation work for Critical and High findings. Verification date: 2026-06-06. Build ✓, lint ✓, 143/143 tests pass.

## Critical

_None._

## High

### F-01. Test count stale in SPEC.md and ARCHITECTURE.md
- **Status:** Resolved
- **Evidence:**
  - `SPEC.md:374` reads "143 unit tests across 12 test files" (was "140").
  - `SPEC.md:378` reads "`levelData.test.ts` (20 tests)" (was "17").
  - `ARCHITECTURE.md:251` reads "143 unit tests across 12 test files" (was "140").
- **Verification:** `npm test` reports 143 tests, matching the documentation. AGENTS.md "Documentation Consistency" satisfied.

### F-02. Level 8 (Spiral) forces a single first-tick direction
- **Status:** Resolved
- **Evidence:** `src/game/levels.ts:92-99` — Level 8's spiral layout no longer contains `{ x: 10, y: 11 }`. The inner coil tile previously blocking DOWN is removed. With the snake starting at `(10,10)` facing RIGHT, the three legal first-tick neighbors are:
  - RIGHT `(11,10)` — not in layout → survivable.
  - UP `(10,9)` — in layout (top wall) → blocked.
  - DOWN `(10,11)` — not in layout → survivable.
  - Two of three directions survive the first tick, satisfying the F-06 invariant.
- **Note:** UP remains blocked on the first tick of Level 8. This is acceptable per the F-06 "at least two survivable" rule and the test enforces it.

### F-03. Level 6 (Narrow Passage) blocks DOWN on first tick
- **Status:** Resolved
- **Evidence:** `src/game/levels.ts:70` — Level 6's lower wall tiles are now `{ x: 4, y: 11 }, { x: 5, y: 11 }, { x: 6, y: 11 }, { x: 7, y: 11 }, { x: 8, y: 11 }, { x: 9, y: 11 }, { x: 11, y: 11 }, { x: 13, y: 11 }, { x: 14, y: 11 }`. `{ x: 10, y: 11 }` is removed, so the lower wall now has a wider opening including column x=10. All three legal first-tick directions (RIGHT, UP, DOWN) are survivable.
- **Verification:** Layout now passes the F-06 invariant with zero first-tick neighbors blocked.

---

# Approval Decision

**Approve.**

All three previously identified High findings (F-01, F-02, F-03) are adequately resolved. The supporting Medium and Low items called out in the original review's "minor changes" list (F-04 Level 9 description, F-05 PLAN_REVIEW.md relocation, F-06 first-tick test, F-08 SPEC.md test breakdown) are also addressed. `npm test` reports 143/143 pass, `npm run lint` is clean, and `npm run build` produces a valid bundle. The state machine, `generateObstacles` signature, and the call-site updates in `state.ts` are unchanged from the prior approval and remain correct.

No new Critical findings introduced by the remediation work. The first-tick survivability test (`levelData.test.ts:121-133`) is a genuine improvement and locks in the F-02/F-03 fix class for future levels. The three previously-deferred items (F-07 cosmetic wall asymmetry, F-09 latent `getLevelData(11)` edge case, F-10 paraphrasing convention) remain appropriately deferred — they are explicitly out of scope for M5 and carry no regression risk introduced by the remediation.

The milestone is ready for plan archival: move `plans/ACTIVE.md` to `plans/archive/2026-06-06-milestone-5-obstacle-redesign.md` and merge.
