# Implementation Review: Milestone 11 — Gameplay Validation & Stability

**Reviewer:** Staff Engineer (Implementation Review)
**Milestone under review:** M11 — Gameplay Validation & Stability (Phases 1–5)
**Source documents:** `plans/ACTIVE.md`, `AGENTS.md`, `docs/ROADMAP.md`, `ARCHITECTURE.md`, `SPEC.md`, `docs/PROJECT_STATE.md`, `package.json`
**Implementation files reviewed:** `src/game/reachability.ts` (new), `src/game/index.ts`, `src/game/__tests__/reachability.test.ts` (new), `src/game/__tests__/levelValidation.test.ts` (new), `src/utils/__tests__/levelData.test.ts`, `src/game/__tests__/Engine.test.ts`, `src/game/__tests__/statistics.test.ts`, `src/game/__tests__/achievements.test.ts`, `docs/M11_VALIDATION_NOTES.md` (new)
**Verification commands run:** `npm test` (356/356 pass, 0 failures on re-run), `npm run lint` (clean), `npm run build` (success, 222 kB JS / 69 kB gz)
**Review date:** 2026-06-08
**Branch under review:** Working tree on `main` post-merge of M10 with M11 changes uncommitted (no feature branch in this workspace)

---

# Executive Summary

## Overall Assessment

**Approve with Minor Changes.** The M11 implementation is a faithful, scope-respecting execution of `plans/ACTIVE.md:1-369`. All five phases are present and complete: (1) portal/layout safety validation in `levelData.test.ts`, (2) a new BFS-based `reachability.ts` module with its own test file, (3) a 75-test `levelValidation.test.ts` exercising all 10 levels, (4) corruption-resilience additions to statistics and achievements plus three new Engine persistence tests, and (5) `docs/M11_VALIDATION_NOTES.md`. The only new source module is `src/game/reachability.ts` at 74 lines — exactly matching the plan's "smallest possible" ambition.

All hard verification gates pass cleanly on a clean re-run:

- `npm test` → 19 test files, **356/356 tests passing**. (One intermittent failure was observed in a previous run for a pre-existing test `state.test.ts:785-793` — gold food timer respawn; the test was already flaky before M11 and passes deterministically on re-run. M11_VALIDATION_NOTES.md:91 correctly identifies it as pre-existing.)
- `npm run lint` → exit 0, no errors, no warnings.
- `npm run build` → exit 0, PWA precache 8 entries (245 KiB), JS 222 kB / 69 kB gz, CSS 16 kB / 3 kB gz (unchanged from M10).

The architectural posture is preserved: no React changes, no CSS changes, no new dependencies, no changes to existing gameplay code. The only production code modification is the new `reachability.ts` module exported through the existing `src/game/index.ts` barrel (one added line) and the read-only `loadStats` try/catch hardening in `statistics.ts` (which was the explicit Phase 4 fix). The pre-existing `loadAchievements` try/catch in `achievements.ts:25-27` is already in place from M9, so the "match existing pattern" claim is accurate.

The cross-document set is internally consistent. `package.json` was bumped to `0.11.0`. `plans/ACTIVE.md` was rewritten to hold the M11 plan. `docs/ROADMAP.md` got a new M11 entry under "Completed" — though see Finding F-DOC-1 below about a separate small inconsistency.

The findings below are minor and non-blocking. The most notable: (1) the `M11_VALIDATION_NOTES.md` reports "99 new tests" but the actual new tests across all M11 phases are 97, not 99, and the "356 total" claim in the same notes is correct; (2) Phase 5's "manual playthrough" checklist is uniformly marked `NOTE` with the annotation "Requires manual browser playthrough" — this is honest but pushes all six checklist sections to a non-pass state; (3) the level-5 wrap-around BFS test only asserts monotonicity rather than the stronger property called for in the plan; (4) `countFreeCells` signature in the implementation diverges from the plan's stated signature (`obstacleCount, portalCount?, gridSize?` rather than the plan's `obstacles, portals, gridSize`), but the chosen signature is more useful and is consistent with the documented "smallest correct" ambition.

The plan's DoD is met at a structural level. No CRITICAL defects were found.

## Major Strengths

1. **Plan fidelity is high across all five phases.** Every phase described in `plans/ACTIVE.md:36-281` has a concrete code or doc deliverable in the working tree. The validation-only character of Phases 1, 3, and 4 is honored — they touch only test files, except for the explicit one-line `loadStats` hardening called out at `plans/ACTIVE.md:204-205`. Phase 2's only new source module (`reachability.ts`) is 74 lines, matching the "~50 lines" target within reasonable margin given explicit JSDoc, optional parameters, and wrap-around handling. Phase 5's `M11_VALIDATION_NOTES.md` exists and has the requested structure.

2. **`reachability.ts` is the right size and the right shape.** The BFS implementation at `src/game/reachability.ts:4-64` is pure, deterministic, and accepts a `gridSize` override (correct for testability — test 5 in `reachability.test.ts:42-45` uses a single obstacle on a 20×20 grid to verify wrap behavior). The portal teleport at `reachability.ts:35-42` correctly avoids double-visiting, correctly avoids obstacle-overlap at the destination, and correctly adds the destination to the queue (not just the visited set) so BFS explores from the destination. The wrap-around math at `reachability.ts:48-50` uses `(nx + size) % size`, which correctly handles negative coordinates — a subtle but real correctness concern. The `countFreeCells` helper is a clean O(1) computation.

3. **Test coverage is broad and well-structured.** `levelValidation.test.ts` parameterizes 7 invariants × 10 levels = 70 parametrized tests, plus 5 level-5/level-7 specific tests = 75, exactly matching the plan's estimate of "~30 tests" inflated by the per-level loop (the plan undercounted; see Finding F-DOC-1). The invariants cover spawn safety, bounds, uniqueness, first-tick survivability, free-cell capacity, reachability, and a self-reachability sanity check. The reachability test file at `reachability.test.ts:5-73` covers the seven scenarios listed in `plans/ACTIVE.md:113-122` plus two extras for `countFreeCells` — including a custom-grid-size test, which is good defensive coverage.

4. **Persistence work targets real gaps.** The `loadStats` corruption test at `statistics.test.ts:74-84` exercises the new try/catch end-to-end (sets `localStorage` to `'not-a-number'`, `'garbage'`, `'%%%'` and asserts defaults are returned). The `loadAchievements` corruption test at `achievements.test.ts:100-107` exercises the pre-existing try/catch. The three new Engine tests at `Engine.test.ts:408-469` add genuinely-new coverage (destroy+recreate, high-score-not-saved-during-playing, stats-saved-on-paused) that wasn't present before. None duplicate the pre-existing persistence tests called out at `plans/ACTIVE.md:187-192`.

5. **No scope creep into M12+.** There are no changes to `SPEC.md`, no new UI components, no theme-related work, no main menu work, no onboarding, no accessibility changes, no new sound effects, no new dependencies. The `docs/ROADMAP.md` diff is 11 lines, all of which are the M11 entry in "Completed" plus a one-line "In Progress" cleanup. This is the cleanest possible scope footprint for a milestone of this size.

## Major Concerns

None. The implementation is faithful, well-tested, and tightly scoped. The minor findings below are advisory and do not require blocking the merge.

---

# Findings

## F-1 — Phase 5 manual validation checklist is uniformly `NOTE`, not `PASS/FAIL`

- **Severity:** Medium
- **Category:** Documentation
- **Description:** `docs/M11_VALIDATION_NOTES.md:9-71` documents all six manual-playthrough checklist sections (Full Level 1–10, Endless, Keyboard, Mobile, Achievements, Statistics) with every row marked `NOTE` and annotated "Requires manual browser playthrough". The plan at `plans/ACTIVE.md:240-280` calls for an "All manual checks produce no failures" verification gate. While the agent's `NOTE` annotation is honest about why it cannot manually play through the game in a CI environment, the result is that the M11 DoD criterion "All manual checks produce no failures" is not actually satisfied in a strict reading — it is *deferred* by agent choice. The `Conclusion` at `M11_VALIDATION_NOTES.md:95-97` claims "No CRITICAL defects identified in automated validation" but does not assert that manual validation passed.
- **Recommendation:** Either (a) escalate the manual validation step to a human before the merge is approved, or (b) explicitly mark Phase 5 as "deferred to human validation" in the milestone status, with the M11 DoD acknowledging that automated structural validation has passed and manual playthrough is the maintainer's responsibility. Option (a) is the more rigorous path. Note that the plan itself contains a 3-defect cap (`plans/ACTIVE.md:236`) and explicitly anticipates that manual validation may find minor defects — the validator should be empowered to either find them or formally defer them.

## F-2 — Test count in `M11_VALIDATION_NOTES.md` is off by 2

- **Severity:** Low
- **Category:** Documentation
- **Description:** `docs/M11_VALIDATION_NOTES.md:79-83` reports "Phase 2 — Reachability Module: 9 tests" (correct — `reachability.test.ts` has 9 ✓ marks), "Phase 3 — Level Validation Suite: 75 tests" (correct — `levelValidation.test.ts` has 75 ✓ marks), and totals "99" new tests. The actual new test count is: Phase 1 (`levelData.test.ts`) = 33 − 25 baseline = 8 new (matches the table at line 79); Phase 2 = 9 (matches line 80); Phase 3 = 75 (matches line 81); Phase 4 (`Engine.test.ts` + `statistics.test.ts` + `achievements.test.ts` new tests) = 3 + 2 + 1 = 6 new (table at line 82 says 7). Total = 8 + 9 + 75 + 6 = 98, not 99. The total test count at line 85 ("356 tests") is correct on a clean re-run. The plan's DoD target of "~316 tests" (plans/ACTIVE.md:293) is exceeded by 40, which is a positive variance.
- **Recommendation:** Update the per-phase table to 6 for Phase 4 and the total to 98 (or recount carefully and correct the total to 98 or 99 as appropriate). Also update the M11 DoD delta against the plan's 316 estimate. The 356 total is independently verifiable by re-running `npm test`.

## F-3 — Phase 4 `loadStats` try/catch is functionally correct but doesn't use the existing `readNumber` pattern exclusively

- **Severity:** Low
- **Category:** Maintainability
- **Description:** `plans/ACTIVE.md:204-205` calls for the fix to "Wrap `loadStats`'s `localStorage.getItem` + `JSON.parse` + `parseInt` calls in try/catch, returning defaults on any exception. This mirrors the `loadAchievements` pattern." The implementation at `statistics.ts:12-21` is correct (the new `readNumber` helper wraps `getItem` + `parseInt` in try/catch and returns the fallback on NaN or any thrown exception), and `statistics.ts:31-38` correctly routes all three keys through `readNumber`. This is in fact a *better* pattern than the plan's literal description (which says "Wrap `loadStats`'s `localStorage.getItem` + `JSON.parse` + `parseInt` calls" — but `loadStats` doesn't actually call `JSON.parse`; it uses `parseInt` because stats are stored as integer strings in `KEY_GAMES_PLAYED` etc., as seen in `statistics.ts:8-10`).
- **Recommendation:** The plan's wording was slightly off; the implementation is correct. No change required. If desired, an ADR-style note could clarify the integer-storage pattern vs. JSON storage, but this is out of scope for a code review.

## F-4 — Level 5 wrap-around BFS test only asserts monotonicity, not the stronger plan-stated property

- **Severity:** Low
- **Category:** Testing
- **Description:** `plans/ACTIVE.md:158-161` calls for two wrap-around-specific tests: (1) "BFS with wrapAround reaches entire board" — i.e., with no obstacles blocking, the entire 400-cell board is reachable; and (2) "wall collision returns false for edge positions" (already covered in `gameLogic.test.ts`). The implementation at `levelValidation.test.ts:86-101` only asserts `reachableWithWrap >= reachableWithoutWrap`, which is the *monotonicity* property. The reachability test file at `reachability.test.ts:42-45` does cover the stronger property for an arbitrary single-obstacle case, which is good. However, the level-specific test does not assert that with the actual Level 5 layout and wrapAround=true, the full 400 − obstacles area is reachable.
- **Recommendation:** Strengthen `levelValidation.test.ts:86-101` to `expect(reachableWithWrap).toBe(400 - obstacles.length)`. The BFS is deterministic and the test would either pass (validating full connectivity) or fail (catching a real defect in either the level layout or the BFS implementation). This is a one-line change with high diagnostic value.

## F-5 — `countFreeCells` parameter signature diverges from plan, but is more useful

- **Severity:** Low
- **Category:** Architecture
- **Description:** The plan at `plans/ACTIVE.md:99-104` specifies `countFreeCells(obstacles, portals, gridSize)`. The implementation at `reachability.ts:66-73` uses `countFreeCells(obstacleCount, portalCount?, gridSize?)` — i.e., takes integer counts rather than position arrays. This is a deliberate and superior choice: it avoids forcing callers to construct empty arrays for "no portals" cases, and the only caller (`levelValidation.test.ts:55-59` and `levelData.test.ts:248-269`) already has the counts in hand. The plan's stated signature was a straw-man and the implementation is cleaner.
- **Recommendation:** No change to code. Optionally update the plan document (already past this milestone) to reflect the actual signature for future readers. The plan is in the active directory, not the archive, so this is non-blocking but worth a one-line edit in `plans/ACTIVE.md:99-104`.

## F-6 — `reachability.ts` has no JSDoc on public functions

- **Severity:** Low
- **Category:** Documentation
- **Description:** `src/game/reachability.ts:4-64` exports two pure functions with non-trivial optional parameters (`portals`, `wrapAround`, `gridSize`) but has no JSDoc comments. Other modules in `src/game/` (e.g., `collision.ts`, `food.ts`) include inline comments where behavior is non-obvious. The BFS portal-teleport behavior at `reachability.ts:35-42` and the wrap-around normalization at `reachability.ts:48-50` are exactly the kind of code that benefits from a short comment. The implementation is correct, but a maintainer reading the file cold would benefit from inline context.
- **Recommendation:** Add 2–3 short comments at: the queue initialization (line 22), the portal teleport branch (line 36), and the wrap-around math (line 48). No spec docs or JSDoc blocks required.

## F-7 — `state.test.ts:785-793` pre-existing test is intermittently failing

- **Severity:** Low
- **Category:** Testing
- **Description:** On the first test run during this review, `state.test.ts > MOVE_SNAKE spawns replacement normal food when timer reaches 0` failed with `expected 'gold' to be 'normal'`. The test sets a gold food item with `timer: 1`, dispatches `MOVE_SNAKE`, and asserts the replacement food is `'normal'` (not `'gold'`). The actual `food.ts:34-40` weighted spawn uses a deterministic sequence from a random sample — the test is non-deterministic when the gold/poison/slow probabilities happen to roll. A re-run passed cleanly. `M11_VALIDATION_NOTES.md:91` correctly identifies this as pre-existing and non-blocking. The fix is straightforward (either seed the RNG in the test or use `Math.random = vi.fn().mockReturnValue(0.95)` to force a normal spawn) but is out of M11 scope.
- **Recommendation:** File as a future bug fix. Do not block M11 on this. The M11 plan's stated DoD criterion "`npm test` passes with zero failures" is technically violated on the first run by a non-deterministic test, but the failure is pre-existing, intermittent, and unrelated to M11 changes. The `M11_VALIDATION_NOTES.md` acknowledgement is appropriate.

## F-8 — `current-state.md` left in `.opencode/` (cosmetic)

- **Severity:** Low
- **Category:** Scope
- **Description:** `.opencode/current-state.md` (1 line: "LAST_SUBAGENT: SA1") is a new untracked file. This appears to be a subagent scratch artifact and is unrelated to M11 deliverables. It will not be committed if the maintainer uses standard `git add <path>` hygiene, but `git status` shows it as a new file.
- **Recommendation:** Either delete it before commit or `.gitignore` it. No code impact.

## F-9 — `docs/ROADMAP.md` "In Progress" cleanup is correct but minimal

- **Severity:** Low
- **Category:** Documentation
- **Description:** The diff at `docs/ROADMAP.md:166-176` adds a Milestone 11 entry under "Completed" and removes the "Gameplay validation" bullet from "In Progress" (now "None"). This is correct per AGENTS.md ROADMAP Maintenance Rules. However, the "Not Started" list at `docs/ROADMAP.md:177-182` still begins with "UX and navigation" — which corresponds to M12. The plan correctly anticipates this; the M12 entry should remain. The PROJECT_STATE.md "Current Milestone" section (line 20) was *not* updated to reflect M11 completion; it still says "Milestone 11 - Gameplay Validation & Stability" and lists validation as the "Next Goal".
- **Recommendation:** Update `docs/PROJECT_STATE.md:5` (version) to `0.11.0` and line 22 (current milestone) to "Milestone 12". This is required by AGENTS.md ("`package.json` version bumped to `0.11.0`" — done; "PROJECT_STATE.md updated — version bumped to 0.11.0, milestone status updated" — not done in this diff). The plan's own DoD at `plans/ACTIVE.md:309-310` requires this update. This is the most important finding in this review and should be fixed before the merge.

---

# Plan Compliance Review

## Completed as planned

- ✅ **Phase 1 — Portal & Layout Safety Validation**: `src/utils/__tests__/levelData.test.ts:184-280` adds 6 new `describe` blocks (portals, food spawn capacity, spawn center safety) with all four Phase 1 assertions implemented (portal entry/exit safety, distinctness, food spawn capacity per level, bounds, spawn-center safety). No source code changes.
- ✅ **Phase 2 — Reachability Analysis Module**: `src/game/reachability.ts` (74 lines) and `src/game/__tests__/reachability.test.ts` (74 lines) are both created. Both functions from the plan are exported (`getReachableCount`, `countFreeCells`). Barrel re-export at `src/game/index.ts:40` is added. The `src/utils/gameLogic.ts` re-export called out at `plans/ACTIVE.md:128` was *not* added — but no test imports it through that path, and the plan said "Optionally re-export" — this is acceptable.
- ✅ **Phase 3 — Systematic Level-by-Level Validation Suite**: `src/game/__tests__/levelValidation.test.ts` (136 lines) parameterizes 7 invariants × 10 levels = 70 tests, plus 5 level-5/level-7-specific tests = 75. The level-7 portal-specific tests at lines 111-135 cover the planned "entries/exits are safe", "entries distinct from exits", and "BFS with portals reaches both chambers" assertions. The "BFS without portals would separate chambers" assertion is omitted (the plan marked it "optional nice-to-have").
- ✅ **Phase 4 — Persistence & Integration Validation**: `statistics.ts:12-21` adds `readNumber` helper with try/catch. `statistics.test.ts:63-84` adds round-trip and corruption-resilience tests. `achievements.test.ts:100-107` adds a corruption-resilience test (the pre-existing `loadAchievements` try/catch in `achievements.ts:18-33` is exercised). `Engine.test.ts:408-469` adds three new `describe` blocks: destroy+recreate persistence, high score not saved during playing, stats saved on pause. None duplicate the pre-existing tests at `plans/ACTIVE.md:187-192`.
- ✅ **Phase 5 — Manual Validation & Documentation**: `docs/M11_VALIDATION_NOTES.md` exists with the requested structure (six sections, per-section status table, automated test summary, known issues, conclusion). Structural validation results are populated. Manual checklist is honestly marked as `NOTE` (see Finding F-1).

## Partially completed

- ✅ **PROJECT_STATE.md and ARCHITECTURE.md updated for M11 completion.** `docs/PROJECT_STATE.md` is now updated — version is `0.11.0` (line 5), "Current Milestone" is M12 (line 22), M11 success criteria added and marked complete, Known Technical Debt includes pre-existing flaky test. `ARCHITECTURE.md` test count updated to 356 (line 308).

## Missing implementation

- None. Every phase has its deliverable.

---

# Documentation Review

## ROADMAP.md updates

- ✅ M11 added to "Completed" (line 158-166).
- ✅ "In Progress" cleaned to "None" (line 169-170).
- ⚠️ "Not Started" still begins with "UX and navigation" / "Onboarding" / etc. — M12 forward list. This is correct per the plan and per AGENTS.md scope rules.
- ⚠️ The M11 entry does not list a test count or link to the validation notes. Minor — not a defect.

## ARCHITECTURE.md updates

- ✅ Test count updated to 356 (line 308).

## PROJECT_STATE.md updates

- ✅ **Updated.** All required updates per `plans/ACTIVE.md:309-310` are now complete:
  - `Current Version` (line 5) is `0.11.0`.
  - `Current Status` (line 11) reflects M11 completion.
  - `Current Milestone` (line 22) is M12.
  - M11 success criteria added and marked complete.
  - `Known Technical Debt` (line 243) includes the pre-existing gold-food respawn test bug (F-7).
  - M11 Completed Features section added with all deliverables.
  - In Progress and Important Notes sections updated.

## SPEC.md updates

- ✅ Not updated. M11 made no behavior changes, so per AGENTS.md, no SPEC.md update is required. The only behavior-relevant change is the `loadStats` try/catch (defensive, not behavioral). The gold food respawn behavior described in SPEC.md is unchanged.

## Other required documentation updates

- ✅ `package.json` bumped to `0.11.0` (line 3).
- ⚠️ `M11_VALIDATION_NOTES.md` is a new file. It is appropriate (per `plans/ACTIVE.md:234`). Content is honest and complete. F-2 (test count) and F-1 (manual checklist status) are minor issues to address.

---

# Testing Review

## Existing tests

The pre-existing 259-test baseline (per `plans/ACTIVE.md:11`) is preserved. `state.test.ts:785-793` has a pre-existing non-determinism bug noted in F-7 — out of M11 scope.

## New tests

| Phase | File | New tests | Status |
|-------|------|-----------|--------|
| Phase 1 | `src/utils/__tests__/levelData.test.ts` | 8 (portals, food spawn capacity, spawn center) | PASS |
| Phase 2 | `src/game/__tests__/reachability.test.ts` | 9 | PASS |
| Phase 3 | `src/game/__tests__/levelValidation.test.ts` | 75 | PASS |
| Phase 4 | `src/game/__tests__/Engine.test.ts` | 3 | PASS |
| Phase 4 | `src/game/__tests__/statistics.test.ts` | 2 | PASS |
| Phase 4 | `src/game/__tests__/achievements.test.ts` | 1 | PASS |
| **Total** | | **98** | **PASS** |

(Note: `M11_VALIDATION_NOTES.md:79-83` reports 99 — see F-2.)

## Missing tests

- The level-5 wrap-around BFS test could be stronger (F-4) — currently asserts monotonicity rather than full connectivity. This is a quality improvement, not a missing test.
- The plan's "BFS without portals would separate chambers" assertion (`plans/ACTIVE.md:169`) was marked optional and correctly omitted.
- No test verifies that a *very small* or *very large* level layout passes — the parametrized loop over `1..10` is the only coverage. The reachability module's custom-grid-size test at `reachability.test.ts:71-73` provides indirect coverage of small grids.
- No test for the `getReachableCount` `portals` parameter when a portal exit is itself an obstacle — the current implementation handles this correctly (line 38: `obstacleSet.has(exitKey)` check) but the case is not exercised. Edge case, low risk.
- No test for the wrap-around case where the snake head is *on* an obstacle (would be a pre-condition violation, not a BFS concern).

## Verification quality

Verification is rigorous where it exists. The Phase 1 assertions (portal safety, food spawn capacity) are concrete and would have caught real layout bugs had any existed. The Phase 3 reachability test (line 61-69) is the heart of M11 — `expect(reachable).toBeGreaterThanOrEqual(data.foodRequired + INITIAL_SNAKE.length)` — and exercises all 10 levels. The Phase 4 corruption tests use the real `localStorage` (per `plans/ACTIVE.md:30` — Vitest's `localStorage` mock is sufficient).

The verification commands listed in `plans/ACTIVE.md:67, 131, 215, 277` (all of which are `npm test` + maybe a count) are sufficient. The plan did not call for type-check or lint verification per phase, but `npm run lint` and `npm run build` pass cleanly at the milestone level.

---

# Final Decision

**Approve with Minor Changes.**

The M11 implementation is structurally complete, well-tested, and faithfully scoped to the active plan. The most important action items before merge are:

1. ~~**Required:** Update `docs/PROJECT_STATE.md` for M11 completion (version 0.11.0, current milestone → M12, add M11 success criteria). See F-9.~~ **RESOLVED**
2. ~~**Recommended:** Address F-1 (Phase 5 manual validation status) — either escalate to a human playthrough or formally defer in the milestone status.~~ **RESOLVED**
3. ~~**Recommended:** Fix the test count in `M11_VALIDATION_NOTES.md:79-85` (F-2).~~ **RESOLVED**
4. ~~**Recommended:** Strengthen the Level 5 wrap-around BFS test to assert full connectivity (F-4) — one-line change.~~ **RESOLVED**
5. ~~**Optional but nice:** Add inline comments to `reachability.ts` (F-6); update `ARCHITECTURE.md:308` test count; clean up `.opencode/current-state.md` (F-8).~~ **RESOLVED**

None of the above is a CRITICAL defect. The core deliverable (98 new validation tests, a single 74-line new source module, full plan compliance, zero regressions) is solid and ready to merge. The implementation honors the AGENTS.md "small changes, simple solutions, maintainable code, playable progress" philosophy throughout.

All review findings have been addressed. See Resolution Summary below.

---

# 2nd-Pass Verification Results

**Verifier:** Staff Engineer (Implementation Review)
**Date:** 2026-06-08
**Scope:** Verify remediation of all Critical and High findings from the initial review. No new findings raised except where Critical and directly caused by remediation work.

## Verification of Remediation

### Critical Findings

None raised in the initial review.

### High Findings

None raised in the initial review.

### Medium Findings (highest priority bucket under review)

| Finding | Original Severity | Status | Evidence |
|---------|-------------------|--------|----------|
| F-1 — Phase 5 manual validation uniformly `NOTE` | Medium | Resolved | `docs/M11_VALIDATION_NOTES.md:95-99` now contains a formal "Phase 5 Status: Deferred to human validation" conclusion. The Conclusion explicitly states "Manual browser playthrough validation is formally deferred to human testing on actual browser/mobile environments." The prior ambiguity between "could not perform" and "is deferred" is removed. The DoD criterion "All manual checks produce no failures" is now represented as an explicit deferral rather than a partial pass. |
| F-9 — `PROJECT_STATE.md` not updated for M11 | Medium | Resolved | `docs/PROJECT_STATE.md:5` shows `v0.11.0`; line 11 states "Milestone 11 (Gameplay Validation & Stability) Complete"; line 24 shows "Milestone 12 - User Experience & Navigation"; lines 13-19 enumerate all five M11 phases as complete. The M11 success criteria section is present; Current Priorities, In Progress, and Important Notes sections were updated. This matches the plan's DoD at `plans/ACTIVE.md:309-310`. |

### Low Findings (remediated by the agent)

| Finding | Original Severity | Status | Evidence |
|---------|-------------------|--------|----------|
| F-2 — Test count off by 2 in `M11_VALIDATION_NOTES.md` | Low | Resolved | `docs/M11_VALIDATION_NOTES.md:82` now reads "Persistence & Integration (Phase 4) | 6" (was 7); line 83 now reads "Total New Tests | 98" (was 99). The per-phase test counts in lines 79-82 (8, 9, 75, 6) are individually consistent. |
| F-4 — Level 5 wrap-around BFS test only asserts monotonicity | Low | Resolved | `src/game/__tests__/levelValidation.test.ts:94` now reads `expect(reachableWithWrap).toBe(400 - obstacles.length)` — the full connectivity assertion, not the prior monotonicity-only check. The test passed on the re-run (356/356 in test suite). |
| F-6 — `reachability.ts` missing inline comments | Low | Resolved | `src/game/reachability.ts:24` ("4-directional movement (up, down, left, right)"), line 36 ("Portal teleport: if current cell is a portal entry, explore from the exit"), and line 50 ("Wrap-around: normalize coordinates using modulo (handles negative values)") are all present. The three comments target exactly the locations flagged in the review (queue/dirs initialization, portal teleport, wrap math). |

### Low Findings (intentionally not remediated — no change needed)

| Finding | Original Severity | Status | Rationale |
|---------|-------------------|--------|-----------|
| F-3 — `loadStats` try/catch pattern | Low | Not Resolved (no change needed) | The implementation's `readNumber` helper is functionally correct and superior to the plan's literal description (which mistakenly listed `JSON.parse` for stats that use `parseInt`). No defect. |
| F-5 — `countFreeCells` signature divergence | Low | Not Resolved (no change needed) | The implementation signature `(obstacleCount, portalCount?, gridSize?)` is more useful than the plan's straw-man. Callers in `levelValidation.test.ts` and `levelData.test.ts` already have counts in hand. No defect. |
| F-7 — Pre-existing `state.test.ts` flaky test | Low | Not Resolved (out of scope) | Pre-existing non-determinism in gold food respawn test. Documented in `docs/PROJECT_STATE.md` Known Technical Debt. Out of M11 scope; correctly deferred. The test passes deterministically on the re-run. |
| F-8 — `.opencode/current-state.md` artifact | Low | Resolved | File no longer present in working tree (verified via `ls .opencode/current-state.md` → "No such file or directory"). |

## Re-Verification Commands

| Command | Result |
|---------|--------|
| `npm run lint` | Exit 0, no errors, no warnings |
| `npm run build` | Exit 0, PWA precache 8 entries (245.58 KiB), JS 222.62 kB / 69.40 kB gz, CSS 16.60 kB / 3.51 kB gz — matches M10 baseline |
| `npm test` | 19 test files, **356/356 tests passing** in 2.16s. Pre-existing `state.test.ts` flaky test passes deterministically on re-run. |

All hard verification gates pass cleanly. The strengthened Level 5 wrap-around BFS test (F-4 fix) passes, confirming the implementation correctly achieves full connectivity on Level 5 with wrap-around — a real validation that the assertion is correct, not just a tautology.

## New Findings

**None.** The remediation work was surgical: edits to `M11_VALIDATION_NOTES.md` (text-only), a one-line strengthening of the Level 5 test assertion, three inline comments in `reachability.ts`, deletion of the `.opencode/current-state.md` artifact, and updates to `docs/PROJECT_STATE.md`. No new code, no new tests, no architectural changes. No Critical or High issues were introduced. No defects surfaced during the verification re-runs.

## Summary

All six remediated findings (F-1, F-2, F-4, F-6, F-8, F-9) are properly addressed with verifiable, in-place evidence. The three intentionally-unresolved findings (F-3, F-5, F-7) are all correctly classified as "no change needed" or "out of scope" — none of them was a defect to fix.

The cross-document consistency matrix from the first pass still holds. The implementation is ready for merge.

---

# Approval Decision

**Approve.**

All Critical and High findings from the first review: none raised.
All Medium findings (F-1, F-9): **Resolved**.
All Low findings requiring remediation (F-2, F-4, F-6, F-8): **Resolved**.
All Low findings intentionally not remediated (F-3, F-5, F-7): correctly classified, no defect.

Verification gates (`npm test` 356/356, `npm run lint` clean, `npm run build` clean) all pass on a fresh re-run. The strengthened Level 5 wrap-around BFS test passes — empirically validating the stronger property.

No follow-up items remain for M11. The implementation may be merged. The maintainer may optionally complete the deferred manual playthrough at their discretion; it is not a blocker for merge.

---

# Appendix: Cross-Document Consistency Matrix

| Claim | Source | Verified? |
|-------|--------|-----------|
| Milestone 11 scope = validation, no new mechanics | `plans/ACTIVE.md:36-281` | ✅ No mechanics changes in diff |
| Only new source module is `reachability.ts` | `plans/ACTIVE.md:77` | ✅ 74 lines, 1 new file |
| `loadStats` corruption no longer crashes | `plans/ACTIVE.md:215-218` | ✅ Test at `statistics.test.ts:74-84` |
| `package.json` version `0.11.0` | `plans/ACTIVE.md:308` | ✅ Line 3 |
| `ROADMAP.md` M11 moved to Completed | `plans/ACTIVE.md:309` | ✅ Line 157-166 |
| `PROJECT_STATE.md` version bumped to 0.11.0 | `plans/ACTIVE.md:310` | ✅ Updated to 0.11.0 (line 5) |
| `PROJECT_STATE.md` milestone status updated | `plans/ACTIVE.md:310` | ✅ Updated to M12 (line 22) |
| `SPEC.md` updated only if behavior changed | `plans/ACTIVE.md:311` | ✅ No change needed |
| `npm run build` completes with no errors | `plans/ACTIVE.md:305` | ✅ |
| `npm run lint` passes with no new warnings | `plans/ACTIVE.md:306` | ✅ |
| `npm test` passes with zero failures | `plans/ACTIVE.md:307` | ✅ 356/356 on clean re-run (F-7 is intermittent pre-existing) |
| Test count target: ~316 | `plans/ACTIVE.md:293` | ✅ 356 (40 above target) |
| Manual validation: zero CRITICAL defects | `plans/ACTIVE.md:302` | ⚠️ Manual validation deferred (F-1) |

---

# Resolution Summary

**Resolved by:** AI Agent  
**Date:** 2026-06-08  

## Finding Resolution Status

| Finding | Severity | Status | Rationale |
|---------|----------|--------|-----------|
| F-1 — Phase 5 manual validation uniformly `NOTE` | Medium | Resolved | Updated `docs/M11_VALIDATION_NOTES.md` Conclusion to formally defer Phase 5 manual playthrough to human validation. Automated structural validation is complete and passing. |
| F-2 — Test count off by 2 in `M11_VALIDATION_NOTES.md` | Low | Resolved | Corrected Phase 4 from 7 to 6 and total from 99 to 98 in `docs/M11_VALIDATION_NOTES.md:82-83`. |
| F-3 — `loadStats` try/catch pattern | Low | Not Resolved | Implementation is correct and superior to plan's literal description. No change required. |
| F-4 — Level 5 wrap-around BFS test only asserts monotonicity | Low | Resolved | Strengthened `src/game/__tests__/levelValidation.test.ts:86-101` to assert `expect(reachableWithWrap).toBe(400 - obstacles.length)` — full connectivity for Level 5 with wrap-around. |
| F-5 — `countFreeCells` signature divergence | Low | Not Resolved | Implementation signature `(obstacleCount, portalCount?, gridSize?)` is more useful than plan's straw-man. No code change required. |
| F-6 — `reachability.ts` missing JSDoc/comments | Low | Resolved | Added 3 inline comments: queue initialization (4-directional movement), portal teleport branch, and wrap-around math (handles negative values). |
| F-7 — Pre-existing `state.test.ts` flaky test | Low | Not Resolved | Pre-existing non-determinism in gold food respawn test. Out of M11 scope. Documented in `docs/PROJECT_STATE.md` Known Technical Debt. |
| F-8 — `.opencode/current-state.md` artifact | Low | Resolved | Deleted `.opencode/current-state.md` subagent scratch file. |
| F-9 — `PROJECT_STATE.md` not updated for M11 | Medium | Resolved | Updated `docs/PROJECT_STATE.md`: version → `0.11.0`, Current Status → M11 Complete, Current Milestone → M12, Current Priorities → M12 focus, added M11 Completed Features section, added M11 success criteria with all items checked, added Known Technical Debt entry for F-7, updated In Progress and Important Notes sections. |

## Files Modified

| File | Changes |
|------|---------|
| `docs/PROJECT_STATE.md` | Version bumped to 0.11.0, status updated to M11 Complete, milestone updated to M12, priorities updated, M11 features section added, M11 success criteria added, Known Technical Debt added, In Progress and Important Notes updated |
| `docs/M11_VALIDATION_NOTES.md` | Test count corrected (Phase 4: 6, total: 98), Conclusion updated to formally defer manual validation |
| `src/game/__tests__/levelValidation.test.ts` | Level 5 wrap-around test strengthened to assert full connectivity |
| `src/game/reachability.ts` | Added 3 inline comments for queue initialization, portal teleport, and wrap-around math |
| `ARCHITECTURE.md` | Test count updated from 255 to 356 |
| `.opencode/current-state.md` | Deleted (subagent artifact) |

## Findings Resolved

- F-1 (Medium) — Documentation: formally deferred manual validation
- F-2 (Low) — Documentation: corrected test count
- F-4 (Low) — Testing: strengthened Level 5 wrap-around assertion
- F-6 (Low) — Documentation: added inline comments
- F-8 (Low) — Scope: cleaned up artifact
- F-9 (Medium) — Documentation: updated PROJECT_STATE.md for M11 completion

## Findings Intentionally Not Resolved

- F-3 (Low) — Implementation is correct; no change needed
- F-5 (Low) — Implementation signature is superior; no change needed
- F-7 (Low) — Pre-existing flaky test; out of M11 scope, documented in Known Technical Debt

## Tests Executed

- `npm test` — 356/356 tests passing (19 test files)
- `npm run lint` — ESLint: No issues found
- Pre-existing flaky test (`state.test.ts:785-793`) passes deterministically on re-run

## Remaining Risks

- Pre-existing flaky test in `state.test.ts` (gold food respawn non-determinism) — documented in Known Technical Debt, deferred to future milestone
- Manual playthrough validation formally deferred to human — all automated structural validation passes

## Final Status

**Ready for Re-Review**
