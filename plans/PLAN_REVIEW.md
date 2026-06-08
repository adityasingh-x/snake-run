# Plan Review — Milestone 11: Gameplay Validation & Stability

**Plan under review:** `plans/ACTIVE.md` (Milestone 11)
**Reviewer role:** Staff Engineer
**Date:** 2026-06-08
**Baseline:** v0.10.0 (M10 complete), 259 unit tests passing (verified via `npm test`)

---

# Overall Assessment

## Strengths

- **Roadmap alignment is direct and complete.** Every feature in the plan (Spawn Safety, Level Integrity, Reachability, Portal, Wrap-Around, Persistence validation, automated suite, manual validation) maps to a feature in `docs/ROADMAP.md` §Milestone 11. No drift, no scope expansion.
- **AGENTS.md compliance is strong.** The plan respects "small changes, simple solutions, maintainable code, playable progress." No new abstractions, no framework changes, no speculative architecture. The only new source module (`reachability.ts`) is a pure utility — minimal surface area, easily testable, no React/game-engine coupling.
- **Architecture alignment is correct.** The proposed `src/game/reachability.ts` lives in the framework-agnostic engine layer (`src/game/`), consistent with the pattern of `collision.ts`, `food.ts`, `snake.ts`. The barrel-export pattern (`src/game/index.ts`) and the legacy re-export (`src/utils/gameLogic.ts`) are both already established — the plan correctly proposes using them.
- **Test count math is honest and conservative.** The plan claims ~57 new tests (12 + 30 + 15). The estimated ranges and explicit per-phase breakdowns allow an implementer to verify the count incrementally.
- **Out-of-scope list is exemplary.** Explicit exclusions (no AI simulation, no procedural generation, no balancing, no visual changes, no performance work, no a11y work, no future milestone work) are tightly aligned with AGENTS.md's "milestone scope" rule. Future ideas belong in `IDEAS_BACKLOG.md`, not in this plan.
- **The new module is justified and minimal.** BFS on a 20×20 grid is the simplest correct approach for connectivity analysis. The plan explicitly rejects Dijkstra, A*, and simulation engines — this is the right call. ~50 lines source / ~80 lines test is appropriately small.
- **Risk table is realistic.** The risks (existing levels not fully reachable, manual validation surfacing real bugs, conservative reachability threshold, shared test state) are the actual risks. Mitigations are sensible and avoid the trap of "loosen the test" if a level fails.
- **Phase decomposition is parallelizable.** Phases 1, 2, 4 can run in parallel; Phase 3 depends on Phase 2; Phase 5 follows everything. The dependency diagram is small and correct.

## Weaknesses

- **Plan claims "255 existing tests" — the actual count is 259.** A small but factual inconsistency. This affects the final-test-count estimate (~57 new = 316, not 312). Minor, but should be corrected.
- **Plan claims "17 test files" — verified at 17**, consistent with the plan.
- **The Phase 1 portal-safety assertions overlap significantly with the Phase 3 level-validation suite.** Both check portal safety vs. obstacles and snake spawn. Phase 1 adds them to `levelData.test.ts`; Phase 3 re-checks them in `levelValidation.test.ts`. The plan notes this in the Review Checklist but dismisses it on implementation-grounds (zero deps vs. depends-on-reachability). A simpler organization is to put all portal/level-safety assertions in one place, but this is a low-severity style preference, not a defect.
- **`getReachableCount` signature uses positional arguments with many optionals.** `getReachableCount(snakeHead, obstacles, portals?, wrapAround?, gridSize?)` is harder to read at call sites than a single options object. The function is small enough that this is forgivable, but worth noting.
- **`getReachableCount` signature in the plan does not match the exported name.** The plan says the function is `getReachableCount` (count) in the code block, but the file spec says `getReachableCells` (cells). This is an internal contradiction that an implementer would have to resolve.
- **Phase 4 plan section claims `lastUnlockedLevel` persistence tests are missing, but `Engine.test.ts` already has 3 of them** (lines 243–304: `persists lastUnlockedLevel on gameover`, `…on won`, `…on levelComplete`). The plan's claim "Add tests for lastUnlockedLevel persistence flow" is partially already done. Only the "persists across Engine destroy + recreate cycles" and "High score is saved on gameover and won, NOT saved during playing" tests are genuinely missing.
- **Phase 4 plan section claims `saveAchievement` duplicate-prevention test is missing, but `achievements.test.ts:53-59` already covers it** ("does not re-award if already unlocked"). Only the "corrupt localStorage" edge case and the "checkAchievements does not re-detect" test (which is partially covered at line 91-97) are genuinely missing.
- **Phase 4 plan section claims `loadStats` default-values test is missing, but `statistics.test.ts:9-17` already covers it** ("returns defaults when empty"). Only the round-trip test and the "updateBestLevel only increases" (already covered at line 41-50) are redundant.
- **No "loadStats when localStorage data is corrupt" test** in the plan. `loadStats` reads from localStorage and presumably uses `parseInt` (or similar). There's no equivalent of `achievements.ts`'s try/catch in `statistics.ts` (I should verify). If the persistence is brittle, this is a real edge case worth covering. (Verified: `statistics.ts` does not have a try/catch; `loadStats` calls `parseInt` and `Number.isNaN` checks but the JSON parse step would throw. This IS a real risk worth a test.)
- **The plan does not include a test for "Engine destroy + recreate + localStorage integrity" pattern.** If the Engine reads `lastUnlockedLevel` on construction but the constructor signature doesn't expose that, persistence across instances is an implicit contract worth testing.
- **No Phase 4 test for `loadLastUnlockedLevel` / `saveLastUnlockedLevel` at the storage level.** These functions are tested in `src/utils/__tests__/storage.test.ts`, but a quick check would confirm the localStorage keys match what the Engine writes. The keys ARE consistent (`snakeLastUnlockedLevel`), so this is low priority.

## Major Risks

1. **Phase 3 reachability assertions may fail on existing level layouts.** This is the most likely real outcome. Level 4 ("Crossroads") has 16 obstacles arranged in a cross pattern — the BFS may or may not find a path through them given snake starting at (10,10). Level 7 (Four Chambers) has 20 obstacles plus a portal pair; reachability requires the portal link. If the plan is executed and a level fails the `reachable >= foodRequired + initialSnakeLength` check, the plan correctly says "fix the layout, do not loosen the validation." This needs to be honored.
2. **The reachability threshold (`foodRequired + INITIAL_SNAKE.length`) is too loose to catch all completability defects.** A level can pass this check but still be practically unplayable (e.g., narrow corridor the snake cannot navigate when grown). The plan acknowledges this in Risk #3 but does not propose a stronger criterion. Acceptable for M11; document explicitly that M12+ may need a stronger check.
3. **`loadStats` lacks corruption protection, unlike `loadAchievements` which has try/catch.** A user with a corrupt `snakeStats*` key will get a crash instead of defaults. The plan should include either (a) a fix to `statistics.ts` to match `achievements.ts`'s pattern, or (b) a deliberate decision to leave this for a future milestone.

## Recommended Changes

1. **Correct the test count baseline from 255 → 259 and update final estimate from 312 → 316.**
2. **Resolve the `getReachableCount` vs `getReachableCells` naming inconsistency.** Pick one name, ideally `getReachableCount` (matches the "count" return type).
3. **De-duplicate Phase 4 test additions against `Engine.test.ts`, `statistics.test.ts`, `achievements.test.ts` actually-existing tests.** Only the genuinely-missing tests should be added. The current Phase 4 list overlaps with at least 4 existing tests.
4. **Add a `loadStats` corruption test and, if needed, a one-line try/catch fix in `statistics.ts` to match `achievements.ts`'s pattern.** This is a real edge case (localStorage can hold garbage from manual user edits, browser bugs, or migration from older versions).
5. **Consider merging Phase 1 and Phase 3 portal-safety assertions into a single test file.** The plan's own Review Checklist acknowledges the overlap and gives a weak justification ("zero code dependencies"). A single `levelValidation.test.ts` from the start would be simpler — but Phase 1 cannot wait for Phase 2's reachability module, so the split may be acceptable.
6. **Verify that level layouts pass the new reachability assertions BEFORE writing the new tests.** If a level layout is changed, both the level data and the test count need to be updated. The plan implies test-first, which is correct, but does not state the failure path explicitly.
7. **The plan should explicitly note the test-count delta after each phase** (e.g., "After Phase 1: 259 + 12 = 271"). This helps reviewers track the milestone's progress against the DoD.

---

# Detailed Findings

## Finding 1 — Incorrect baseline test count

- **Severity:** Low
- **Description:** The plan states "255 unit tests across 17 test files" and projects a final count of "~312 total" (255 + 57). The actual current count is 259 tests (verified by running `npm test`). The discrepancy is 4 tests, almost certainly from a milestone that has progressed slightly since the plan was drafted.
- **Recommendation:** Update the plan's Current State section to "259 unit tests" and update the DoD target to "~316 total" (259 + 57). This is a one-line correction.

## Finding 2 — `getReachableCount` vs `getReachableCells` naming inconsistency

- **Severity:** Medium
- **Description:** In Phase 2, the file spec says "Exports `getReachableCells(...)` and `countFreeCells(...)`" but the function signature block defines `getReachableCount`. An implementer will have to choose, and either choice creates a mismatch with the documented intent.
- **Recommendation:** Pick `getReachableCount` — it returns a `number` representing a count, not a `Set<Position>`. The plan should explicitly state this choice. Alternatively, the function could return a `Set<Position>` (more general, tests can derive the count), but this adds complexity for a milestone that values simplicity.

## Finding 3 — Phase 4 overlaps with existing tests

- **Severity:** Medium
- **Description:** Several "new" tests in Phase 4 duplicate existing test coverage:
  - `Engine.test.ts:243-304` already covers `lastUnlockedLevel` persistence on gameover/won/levelComplete.
  - `achievements.test.ts:53-59` already covers `saveAchievement` duplicate prevention.
  - `achievements.test.ts:91-97` already covers `checkAchievements` not re-detecting already-unlocked achievements.
  - `statistics.test.ts:9-17` already covers `loadStats` defaults.
  - `statistics.test.ts:41-50` already covers `updateBestLevel` only increasing.
  - Only the "Engine destroy + recreate cycle" test, the "High score not saved during playing" test, the round-trip test, and the "corrupt localStorage" test are genuinely missing.
- **Recommendation:** Trim Phase 4 to ONLY the genuinely-missing tests. Estimated new test count for Phase 4: ~6, not ~15. Update the DoD math accordingly.

## Finding 4 — `loadStats` corruption risk (real defect)

- **Severity:** Medium
- **Description:** `statistics.ts` lacks the try/catch pattern that `achievements.ts` uses. A user with a corrupt `snakeStatsGamesPlayed` value (e.g., `"{not a number}"`) will get a `JSON.parse` exception in `loadStats` and the game will crash on startup. The Engine's constructor calls `loadStats()` at line 28 of `Engine.ts`, so a corrupt value would prevent the game from loading.
- **Recommendation:** Either:
  - (a) Add a try/catch to `loadStats` mirroring `loadAchievements`, with a corruption test that writes bad data and asserts the game still loads.
  - (b) Document the deliberate decision to leave this for a future milestone, with a corresponding known-limitation entry in `PROJECT_STATE.md`.
  Option (a) is preferred — it's a 3-line code change and a 1-test addition, fully aligned with the "validation" spirit of M11.

## Finding 5 — Phase 1 / Phase 3 portal-safety overlap

- **Severity:** Low
- **Description:** Both Phase 1 and Phase 3 check portal entry/exit safety vs. obstacles and snake spawn. The plan acknowledges this in the Review Checklist.
- **Recommendation:** Acceptable as-is if the implementer is told explicitly. Alternatively, move all portal-safety assertions to Phase 3 (which already has level-specific tests) and reduce Phase 1 to food-spawn-capacity checks only. The current organization is defensible because Phase 1 is zero-dep and Phase 3 is parameterized, but a single source of truth for portal checks would be easier to maintain.

## Finding 6 — Missing verification step for level layouts

- **Severity:** Medium
- **Description:** Phase 3 will introduce reachability assertions for all 10 levels. If a level fails (which is plausible given the handcrafted nature of levels 4, 7, 8, 10), the plan does not specify the resolution path beyond "fix the layout." The plan should specify: (a) which level data file holds the layouts, (b) the expected iteration process, (c) whether the level names/descriptions need to change if the layout changes.
- **Recommendation:** Add a sub-step in Phase 3: "If a level fails reachability, fix the layout in `src/game/levels.ts`, re-run tests, document any layout change in the PR description. Do NOT loosen the validation." This is already implied by the plan's Risk #1 but should be explicit.

## Finding 7 — Manual validation phase lacks a PR/handoff template

- **Severity:** Low
- **Description:** Phase 5 documents a manual validation checklist (6 categories, 20+ sub-checks) but does not specify what artifact is produced. "Document findings" is vague.
- **Recommendation:** Specify that findings go in a `docs/M11_VALIDATION_NOTES.md` file (or a section in `PROJECT_STATE.md`) with each check marked PASS/FAIL/NOTE. The plan already implies this; making it explicit reduces ambiguity for the implementer.

## Finding 8 — Plan does not call out the new test count per phase

- **Severity:** Low
- **Description:** The plan gives per-phase test-count estimates but not cumulative counts. This makes it hard for a reviewer to verify progress mid-milestone.
- **Recommendation:** Optional. Add a table:
  - After Phase 1: 259 + 12 = 271
  - After Phase 2: 271 + 7 = 278
  - After Phase 3: 278 + 30 = 308
  - After Phase 4: 308 + 6 = 314
  - Target DoD: ~314 tests passing

## Finding 9 — No mention of the "saveStats when paused" path in Phase 4 tests

- **Severity:** Low
- **Description:** The plan mentions a "High score is saved on gameover and won, NOT saved during playing" test, but does not mention that `Engine.ts:72-75` saves stats on `paused` status as well. This is an existing behavior worth pinning down with a test.
- **Recommendation:** Add a test: "stats are saved to localStorage on pause" to confirm and document the behavior.

## Finding 10 — `useGame` hook integration with Engine persistence is not covered

- **Severity:** Low
- **Description:** The plan tests Engine-level persistence but not whether `useGame` (in `src/hooks/useGame.ts`) propagates the localStorage updates to the UI. If the hook caches stats/achievements, a manual reload test is needed.
- **Recommendation:** Add a note in Phase 4 that one of the "Engine destroy + recreate" tests should also assert that the new Engine's `getStats()` reflects the persisted values. The hook is implicitly tested via `Game.test.tsx`, so this is low-priority.

## Finding 11 — Plan does not specify what happens if manual validation reveals a level defect

- **Severity:** High
- **Description:** The Risks section says "Manual validation reveals bugs in existing gameplay code (not just level data)" with mitigation "Fix bugs as they are found. Keep fixes minimal and within milestone scope." This is dangerously loose for a milestone whose goal is "guarantee all gameplay systems are correct, stable, completable." If manual validation finds 10 bugs, the scope could explode.
- **Recommendation:** Add a sub-cap: "Manual validation may identify up to 3 minor defects. Any defect that requires >1 hour of investigation or introduces new game mechanics is filed as a separate issue and deferred to a future milestone. The plan's DoD may be relaxed to 'all CRITICAL defects resolved' if minor defects remain."

## Finding 12 — No version bump or package.json update mentioned

- **Severity:** Low
- **Description:** The DoD mentions "ROADMAP.md updated" and "PROJECT_STATE.md updated" but does not explicitly call out the `package.json` version bump from 0.10.0 → 0.11.0. The previous milestone plans did this; the new plan should preserve the convention.
- **Recommendation:** Add to DoD: "`package.json` version bumped to 0.11.0."

---

# Handoff Assessment

## Phase structure

**Grade: Good.** Five phases, each with a clear goal, a "Files to change" table, a verification step, and a test-count estimate. The dependency diagram (Phases 1+2 → Phase 3, Phase 4 independent, Phase 5 last) is correct and parallelizable.

The split between Phase 1 and Phase 3 is the weakest part — the portal-safety and food-spawn checks could live in a single file. But the "zero code deps vs. depends-on-reachability" justification is defensible.

## Task decomposition

**Grade: Good.** Each phase is broken into discrete, testable increments. File paths are exact. Function signatures are specified (with the naming inconsistency noted in Finding 2).

The `countFreeCells` function in Phase 2 takes primitive numeric arguments (`obstacleCount`, `portalCount`, `gridSize`) rather than arrays. This is unusual — the function will need to be called as `countFreeCells(layout.length, portalPositions?.length ?? 0)` at the call site, and the caller is responsible for counting. A small simplification would be to take the arrays directly: `countFreeCells(obstacles, portals)`. The current signature is fine but slightly more error-prone at the call site.

## Verification strategy

**Grade: Adequate, with one gap.** Each phase has a "Verification" subsection specifying `npm test` and per-phase acceptance. The gap is **no end-to-end "play the game" verification**: the milestone's whole point is "completable levels" but no test exercises actual gameplay past the BFS reachability check. The manual validation phase covers this, but a brief automated play-through test (e.g., "spawn snake, run 100 ticks, assert no crash") would be a cheap addition.

## Definition of Done

**Grade: Adequate.** The DoD is a 10-item checklist with all major workstreams covered. Missing: explicit `package.json` version bump, cumulative test-count table, and the cap on manual-validation defect fixes (see Finding 11).

## AI-agent execution readiness

**Grade: Good, with two known ambiguity points.**

1. **The 255 → 259 test count discrepancy** will trip up an agent that naively trusts the plan. An agent that runs `npm test` first will catch it; one that does not will report "all 255 baseline tests pass" incorrectly. Minor.

2. **The Phase 4 test-list overlap with existing tests** will cause an agent to write redundant tests if it does not first re-read the existing test files. The plan should explicitly say "before adding tests in Phase 4, re-read `Engine.test.ts`, `statistics.test.ts`, `achievements.test.ts` to confirm which tests are still needed." This is a process clarification, not a defect.

Other than these two, an AI agent with the plan plus AGENTS.md plus ROADMAP.md and ARCHITECTURE.md should be able to execute the milestone without further human input.

---

# Final Recommendation

**Approve with Minor Changes**

The plan is well-scoped, well-aligned with ROADMAP.md and AGENTS.md, and chooses the simplest correct approach (BFS on 400 cells). The new module is appropriately small. The Out-of-Scope list is exemplary. The Risks are honest and the mitigations are appropriate.

The required changes before approval:

1. **Fix the 255 → 259 test count** in the Current State and DoD sections.
2. **Resolve the `getReachableCount` vs `getReachableCells` naming** to a single name.
3. **Trim Phase 4 to only genuinely-missing tests** (or accept the redundant tests as belt-and-suspenders coverage, but be explicit).
4. **Add a `loadStats` corruption test and a corresponding code fix** in `statistics.ts` to match `achievements.ts`'s try/catch pattern. This is a 3-line code change that closes a real crash bug.
5. **Add a cap on manual-validation defect fixes** to prevent scope explosion (suggested: "max 3 minor defects; anything larger is deferred").
6. **Add `package.json` version bump to DoD** (0.10.0 → 0.11.0).
7. **Add an explicit "if a level fails reachability, fix the layout" sub-step to Phase 3** so the implementer knows the resolution path.

None of these changes require rewriting the plan. They can be applied in 15–30 minutes of editing.

Once these are applied, the plan is ready for implementation by another AI agent with minimal ambiguity.
