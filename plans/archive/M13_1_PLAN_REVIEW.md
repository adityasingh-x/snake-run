# Plan Review — Milestone 13.5: Runner Feel Validation

**Plan under review:** `plans/ACTIVE.md` (Milestone 13.5, "Runner Feel Validation")
**Reviewer role:** Staff Engineer
**Date:** 2026-06-11
**Baseline:** v0.13.1 (M13.1 complete) — 434 tests passing across 27 test files
**PRD:** `docs/prd/PRD_M13_5.md` v2.0 ("Approved For Planning")

---

# Overall Assessment

## Strengths

- **Roadmap alignment is correct.** M13.5 is the explicit next item in `docs/ROADMAP.md` §"Current Sequence" ("Milestone 13.5 → docs/prd/PRD_M13_5.md"). The "depends on M13 / M13.1 complete" chain is correct. The PRD's product question — "Does Snake Run feel like a runner?" — is preserved as the success criterion (PLAN §Executive Summary, §Exit Decision).

- **Scope discipline matches the PRD's "feel only" framing.** The Non-Goals list mirrors PRD §4 one-for-one (no powerups, missions, achievements, cosmetics, unlockables, progression, monetization, new game modes). The "Also Out of Scope" list correctly defers: RunnerHUD/RunnerGameOver full redesign, music/sfx, multi-touch, board size changes, coordinate refactors, food variant support in runner mode. This is the right amount of restraint for a validation milestone.

- **The single most impactful change is correctly identified.** The Executive Summary calls out viewport scrolling as the highest-leverage change for "forward motion perception." This is the architectural decision the PRD §8/§9/§10 hinge on, and the plan devotes Phase 2 to it with the right level of detail (modulo formula, screen-row mapping, React key stability, edge cases).

- **The plan correctly identifies the leverage of pure-rendering changes.** Phase 2 explicitly says "Pure rendering transform in `Board.tsx`. … Game engine unchanged." This is the cheapest possible way to satisfy PRD §8/§9/§10 without changing any game logic or introducing risk to the existing 434 tests. It is also consistent with `ARCHITECTURE.md`'s separation of game engine (`src/game/`) and React UI (`src/components/`).

- **Validation infrastructure is the right shape for a feel milestone.** Phase 6 (recordings + screenshots + 5 owner questions + 5 AI review questions) is a direct, faithful realization of PRD §20-24. The Exit Decision (PRD §28) is preserved as a milestone-level DoD item.

- **The 7-phase structure with explicit dependencies is clean and executable.** Phases 1-5 are feature/code, Phase 6 is validation, Phase 7 is documentation. Each phase has independent verification. The dependency graph (1→2→3,4,5; 6 after all; 7 after all) is correct.

- **Risk register is honest and complete.** The 8-row ahead visibility concern (8 rows × 80ms = 0.64s, vs PRD §16 hard target of 0.5-1.0s) is acknowledged. The wrap-around one-frame glitch is acknowledged. The recording-tooling risk is acknowledged. This is a much better-calibrated risk register than M13.1's.

- **The plan correctly defers the supplement review's previous concerns.** The M13.1 review (in the now-stale `plans/PLAN_REVIEW.md`) recommended visual-outcome validation, evidence-based validation, and outcome-based active-lane language. M13.5 does not need to redo those — they are M13.1's job and M13.1 is complete. M13.5's PRD-driven validation (recordings + screenshots + 5 owner questions) is a different, higher-level validation that supersedes M13.1's per-implementation visual checks.

- **Test plan correctly extends the new `runnerCourse.test.ts`.** Phase 4 adds a new test ("MIN_ROW_STEP prevents adjacent obstacle rows") and a test for "at least one lane always clear." This builds on the `runnerCourse.test.ts` file created during M13.1 (now at 1 test, 12 lines), continuing the test-coverage work the M13.1 review required.

- **Documentation updates are explicit and complete.** Phase 7 lists specific sections to update: SPEC.md (§20.2, §20.5, §20.11, §20.12), ARCHITECTURE.md (lane visualization, component architecture, state shape), PROJECT_STATE.md (version, status, features, test count), ROADMAP.md (milestone progress). This is the right level of detail for a docs phase.

- **The `useEffect` + `setTimeout` pattern for the 200ms lane-change animation is correct in spirit.** The plan correctly identifies that the state must be cleared after the animation duration, and provides a mitigation ("Clear laneChangeDir via a single `useEffect` cleanup function with `setTimeout`"). The pattern is well-understood React.

## Weaknesses

- **Phase 2's `VIEWPORT_TAIL = 11` contradicts PRD §9 "lower third of screen."** PRD §9 says: "Snake should remain near lower third of screen." 11/20 = 55% from top, which is the **middle** of the screen, not the lower third (which would be 13-17/20 = 65-85%). The plan rationalizes this as "lower-middle" but the PRD is explicit. This is a direct, documented PRD deviation that should be resolved before implementation, not validated later.

- **Phase 4's `MIN_PATTERN_SPACING = 2` formula generates out-of-bounds obstacles at max difficulty.** With `numPatterns = 12` and `rowStep = max(2, floor(20/12)) = 2`, the loop `for (let i = 0; i < 12; i++) { const y = i * 2; }` produces y values: 0, 2, 4, 6, 8, 10, 12, 14, 16, 18, **20, 22**. The values 20 and 22 are outside the 20×20 grid. The current `runnerCourse.ts:15-23` loop has no bounds check, so the function pushes obstacles at `{x: lane_x, y: 20}` and `{x: lane_x, y: 22}` which are invisible (Board only renders y < 20) and uncollidable. The actual placed patterns at max difficulty is 10, not 12. This is a silent behavior change the plan does not acknowledge and the test "MIN_ROW_STEP prevents adjacent obstacle rows" will not catch.

- **Phase 4's spacing fix reduces obstacle density at high difficulty, opposite of PRD §19.** The current code places 12 patterns at max difficulty (rowStep=1). The new code with rowStep=2 places 10 patterns (the 11th and 12th are out of bounds). This REDUCES the number of obstacles the player must navigate at high difficulty, which is the opposite of what PRD §19 requires ("120+ seconds: Extreme pressure"). The plan should either (a) cap `numPatterns` at `floor(GRID_SIZE / MIN_PATTERN_SPACING) = 10` to make the new max intentional, or (b) add a bounds check inside the loop.

- **Phase 1d (optional touch swipe feedback indicator) is internally inconsistent with the existing `useTouch` hook.** The platform `src/platform/touch.ts:13-15` exposes an `onProgress` callback on the gesture recognizer, but the React `useTouch` hook (`src/hooks/useTouch.ts:12-13`) does NOT plumb this through. Phase 1d instructs the implementer to "Subscribe to `onSwipeProgress` from `useTouch` hook," which does not exist. To implement 1d, the plan must also modify `useTouch` to accept and forward an `onProgress` callback. This is a non-trivial cross-cutting change that affects all `useTouch` consumers (RunnerGame and Game). The plan should either (a) explicitly add a `useTouch` modification prerequisite, or (b) drop 1d from scope and mark it as a future-touch-UX-plan item.

- **The validation directory name does not match PRD §20-21.** The PRD specifies `docs/Milestone 13_5_validation/` (with a space and title case). The plan uses `docs/m13_5_validation/` (lowercase, with underscore). The plan should either use the PRD's path or document the deviation (and update the PRD to match). The current plan creates a documentation-drift issue by deviating silently from the PRD.

- **The plan does not address binary file storage in git for video recordings.** Phase 6 says "5 gameplay recordings" stored in `docs/m13_5_validation/recordings/`. At ~2-5MB/minute for webm, 5 × 2-minute recordings = 20-50MB minimum. The current `.gitignore` does not appear to exclude this directory. Committing video files to git will bloat the repo. The plan should add `docs/m13_5_validation/recordings/` to `.gitignore` and either store recordings externally (Drive, etc.) or commit only a README listing the filenames and storage location.

- **Phase 3 leaves the speed-profile mechanism ambiguous.** The plan presents two competing implementations: (a) `window.__RUNNER_SPEED_PROFILE__` global with optional URL param, and (b) `RUNNER_SPEED_MULTIPLIER` constant edited by hand and rebuilt. The plan says "Simpler approach: use `.env` or a dev-only constant" and later "For validation, hand-edit this constant and rebuild." A more senior-engineer approach is to commit to one mechanism. Recommendation: use the URL parameter approach (e.g., `?speed=1.25`) so the project owner can record all 4 profiles without 4 rebuilds.

- **Phase 2's `screenRow = (gridY - headY + VIEWPORT_TAIL + GRID_SIZE) % GRID_SIZE` formula is described correctly, but the plan does not test the wrap-around edge case in code.** The plan says "The modulo formula handles this" and gives the worked example "(0-19+11+20)%20 = 12." This is correct math. But the plan does not add a unit test for this. A test like "wrap-around at headY=0/19 keeps snake at screen row 11" would catch a regression where the formula is changed inadvertently.

- **Phase 2 does not include a test for the "classic mode rendering is byte-identical" requirement.** Phase 2's verification checklist says "Visual: Classic mode board renders identically to pre-change behavior" but there is no automated test for this. The test plan in the §"Test Plan" section only adds Board tests for runner mode, not a regression test for classic mode. Given that Phase 2's core change adds a conditional to `Board.tsx` (the `if (viewportHeadY !== undefined)` branch), a classic-mode regression test is essential.

- **Phase 1's `useEffect` + `setTimeout` for clearing `laneChangeDir` has a subtle race condition.** If the player changes lanes twice in rapid succession (e.g., LEFT then RIGHT within 200ms), the first change's timer will fire and clear `laneChangeDir` while the second change's effect is still active. The plan says "Clear laneChangeDir via a single `useEffect` cleanup function with `setTimeout`" but does not show the implementation. The correct pattern uses `useRef` for the timeout id, cleared on each new lane change. This is a minor detail that an AI implementer may get wrong.

- **The plan does not address the existing `useTouch` consumers.** Phase 1d's `onSwipeProgress` modification affects the `useTouch` hook, which is consumed by both RunnerGame and Game. The plan should explicitly state that the `useTouch` change must be backwards-compatible (additive new prop with default behavior unchanged) and add a `useTouch` test for the new behavior.

- **The plan does not address the test baseline count drift.** The baseline is 434 tests. The plan's verification lists "all 434 tests still pass" in some places but the Phase 5 expected text says "All tests pass with no regressions" without a specific number. As the M13.1 review found, vague "all tests pass" is ambiguous if a baseline shifts. Recommend updating to "all 434 existing tests pass" throughout, and instruct the implementer to verify the count with `npm test -- --run` before starting.

- **The previous `plans/PLAN_REVIEW.md` is for M13.1 and will be overwritten by this review.** The M13.1 review contains valuable historical findings (the four "new required changes" 11-14 from the supplement review, the three Critical findings 1-3, the recommended changes 4-10). If this M13.5 review overwrites `plans/PLAN_REVIEW.md`, the M13.1 review is lost. The plan's M13.5 workflow should explicitly include a step to archive the M13.1 review to `plans/archive/M13_1_PLAN_REVIEW.md` before writing the M13.5 review. (This is more of a process gap in the plan; the act of writing this review will follow the prompt's instruction to save to `plans/PLAN_REVIEW.md`.)

- **Phase 5 (HUD & Game Over Polish) is scope creep relative to the PRD's "feel only" framing.** The PRD §4 explicitly excludes "cosmetics, unlockables." Adding a Score section to RunnerHUD and a "New Best!" badge to RunnerGameOver is cosmetic polish that does not directly answer "Does this feel like a runner?" The plan should justify this in the Non-Goals / Also Out of Scope sections (e.g., "RunnerHUD score display is required for the 5 owner validation questions to be answerable, since one question is 'Does gameplay feel better than Milestone 13?' which requires a visible score for comparison"). As written, Phase 5 is a nice-to-have that is weakly tied to the PRD.

- **Phase 5 does not address mobile responsive layout for the new Score section.** The current RunnerHUD has 4 sections (Distance, Food, Length, Best). The plan adds a 5th (Score). The existing CSS has a mobile breakpoint `@media (max-width: 600px)` for the classic ScoreBoard; RunnerHUD may need a similar breakpoint to wrap the 5 sections gracefully on mobile. The plan does not mention this.

- **Phase 7 documentation update for `docs/ROADMAP.md` says "Move M13.5 from 'Next' to 'Completed' sequence" but the current ROADMAP.md does NOT have an explicit "Next" section listing M13.5.** The ROADMAP.md §"Current Sequence" says "Next: Milestone 13.5 → docs/prd/PRD_M13_5.md; Milestone 14 → docs/prd/PRD_M14.md." The "Next" is in a "Next:" list within a "Completed" section. Phase 7 should clarify whether to: (a) move M13.5 to a "Completed" section in the same file, or (b) move it to `docs/archive/completed-milestones.md` per the ROADMAP Governance rules. AGENTS.md §"ROADMAP Maintenance Rules" says: "Move the completed milestone from ROADMAP.md into `docs/archive/completed-milestones.md`." So option (b) is correct, but the plan says "Move M13.5 from 'Next' to 'Completed' sequence" which sounds like option (a). This is ambiguous.

- **The plan's "Architecture Overview" claim "No new React state management" is technically false.** The plan adds `useState` for `laneChangeDir` in `RunnerGame.tsx` (Phase 1a). The spirit of the claim is correct (no new state management library, no Redux, etc.), but the wording is imprecise. Recommend: change to "No new state management library. Minimal new useState for animation triggers."

- **The plan's "Summary" table has a file-count error.** Phase 2 row says "3 (Board.tsx, RunnerGame.tsx, types/components.ts, constants.ts)" — that's 4 files, not 3. The same row also says the files are "Board.tsx, RunnerGame.tsx, types/components.ts, constants.ts" but only one of these (constants.ts) is mentioned in Phase 2's implementation steps. Cosmetic, but indicates the table was not carefully built.

- **The plan does not include line-number guidance with a "verify before editing" caveat.** This was a recommendation from the M13.1 review (Finding 8) that the plan does not adopt. The M13.5 plan has rough estimates like "1b" and "2b" but does not include line numbers. If line numbers are added, include the caveat. If not, this is a non-finding.

- **The plan's risk register has 6 risks; the visibility calculation is correct but the mitigation is "validate in recordings."** This is acceptable for a validation milestone but is a soft mitigation. A more concrete mitigation would be: "If 8-row visibility proves insufficient at 1.75x, Phase 4 may need to either increase VIEWPORT_TAIL (e.g., to 13 or 14) or reduce the highest speed profile (Profile D at 1.75x → 1.5x)." Adding a contingency improves the plan's robustness.

- **The plan does not address the existing pre-existing test flakiness in `state.test.ts`.** PROJECT_STATE.md §"Known Technical Debt" #1 documents a flaky test ("Gold food timer expiry occasionally spawns gold instead of normal food due to non-deterministic RNG in `food.ts`"). The M13.1 review (Finding 7) recommended adding a one-liner to acknowledge this. The M13.5 plan does not. The new tests added in Phase 4 use `generateRunnerCourse` (no gold food), so they are unaffected, but the implementer should be aware.

- **The plan's "Definition of Done" lacks a "lint clean" item in the validation section.** The DoD has "Validation" items (recordings, screenshots, owner questions, AI review) but not "Validation: lint clean" or "Validation: tsc clean" as a precondition. The implementation DoD has these. The two sections should be consistent.

- **The plan does not address what happens if a recording is corrupted or the file format is unsupported.** If the project owner uses Chrome DevTools Recorder and exports a webm, but the file is corrupted or the AI reviewer can't play it, the milestone is blocked. Recommend: add a "Verify playback of test recording" step before committing to the full 5-recording process.

## Major Risks

1. **Phase 2's `VIEWPORT_TAIL = 11` contradicts PRD §9 "lower third of screen."** This is a documented PRD deviation. The plan should either (a) update the value to 13 or 14 to match the PRD, or (b) explicitly justify why 11 was chosen over a true lower-third value and update the PRD to match. As written, the plan's value is the middle of the screen, not the lower third, and the plan does not call out this deviation.

2. **Phase 4's `MIN_PATTERN_SPACING = 2` formula silently breaks at max difficulty.** The 12-pattern case produces 2 out-of-bounds patterns (y=20, y=22). The plan's own description acknowledges 12 patterns at max difficulty but does not account for the bounds issue. This is a real bug that will not be caught by the proposed test "MIN_ROW_STEP prevents adjacent obstacle rows" because the test only checks adjacency, not bounds. The actual max pattern count becomes 10, reducing high-difficulty obstacle density (opposite of PRD §19's "Extreme pressure" goal).

3. **The plan does not address binary file storage for video recordings.** 5 recordings × 2-5MB/min = 20-50MB. Committing video files to git will bloat the repo. The plan should add `.gitignore` entries and a clear policy (commit only README + screenshots; link to external storage for videos).

4. **Phase 1d is blocked by `useTouch` not exposing `onProgress`.** The plan instructs the implementer to "Subscribe to `onSwipeProgress` from `useTouch`" but `useTouch` does not expose this. The plan must either add a `useTouch` modification prerequisite, drop 1d from scope, or mark 1d as a separate "follow-up plan" item. As written, 1d is non-implementable without changes the plan does not describe.

5. **The validation directory name does not match the PRD.** PRD says `docs/Milestone 13_5_validation/`, plan says `docs/m13_5_validation/`. This is a documentation drift issue. The implementer may use the plan's path, but the PRD is the source of truth per AGENTS.md. The plan must reconcile this before implementation.

## Recommended Changes

### Required (must apply)

1. **Resolve the `VIEWPORT_TAIL = 11` vs PRD §9 "lower third" conflict.** Either (a) change to 13 or 14 (e.g., `VIEWPORT_TAIL = 13`, snake at screen row 13 = 65% from top = true lower third) and update the plan's PRD §9 alignment, or (b) add an explicit justification for 11 (e.g., "PRD §9 says 'lower third' but 11/20 = 55% provides better visibility of upcoming obstacles while still being in the lower half") and update PRD §9 to "lower-middle" if approved. Option (a) is the safer default.

2. **Fix the Phase 4 `MIN_PATTERN_SPACING` out-of-bounds bug.** Three options: (a) cap `numPatterns` at `Math.min(12, Math.floor(GRID_SIZE / MIN_PATTERN_SPACING))` = 10, (b) add `if (y >= GRID_SIZE) continue;` inside the loop, or (c) compute the actual number of placements: `const actualPatterns = Math.min(numPatterns, Math.floor(GRID_SIZE / rowStep))`. Option (b) is the smallest change. Also update the plan's claim "12 patterns at max difficulty" to "10 patterns at max difficulty (with 2 iterations skipped due to out-of-bounds)" or, if the implementer prefers to keep 12, restructure the loop to wrap or use a different pattern-generation strategy.

3. **Add a `.gitignore` policy for video recordings.** Add `docs/m13_5_validation/recordings/*.webm` (or equivalent) to `.gitignore`. Document the policy in the validation README: "Recording files are stored externally at [link]. Only README.md, screenshots, and the recordings/ directory structure are committed."

4. **Reconcile the validation directory name with the PRD.** Pick one: `docs/Milestone 13_5_validation/` (PRD §20) or `docs/m13_5_validation/` (plan). If the plan's lowercase path is preferred, add a note to the plan explaining the deviation and propose updating the PRD. The PRD is the source of truth per AGENTS.md, so the plan should use the PRD's path unless there is a strong reason to deviate.

5. **Either implement Phase 1d correctly with a `useTouch` modification prerequisite, or drop 1d from the plan.** If 1d is kept: add a step to Phase 1d that says "First, modify `src/hooks/useTouch.ts` to accept and forward an optional `onProgress` callback to the platform gesture recognizer. Add a `useTouch.test.tsx` test for the new prop." If 1d is dropped: remove from Phase 1 and move to `docs/IDEAS_BACKLOG.md` as a future-touch-UX item.

### Recommended (should apply)

6. **Add a classic-mode regression test for Board.** The Phase 2 implementation adds an `if (viewportHeadY !== undefined)` branch to `Board.tsx`. A test that renders Board with NO `viewportHeadY` prop and verifies the same output as before is essential. Add to `src/components/__tests__/Board.test.tsx`: "renders identically to pre-change behavior when viewportHeadY is undefined."

7. **Add a unit test for the viewport-wrap-around math.** Add to `src/components/__tests__/Board.test.tsx` (or a new helper test): "viewportHeadY=0 and viewportHeadY=19 produce the same screen position for the snake head." This catches a regression where the modulo formula is changed.

8. **Use URL parameter for speed profile selection.** Replace the "hand-edit constant and rebuild" approach with `?speed=1.25` URL parameter that sets `window.__RUNNER_SPEED_PROFILE__`. The project owner can then record all 4 profiles with one build, switching via URL. This is faster and more reliable than 4 rebuilds.

9. **Update the Phase 7 ROADMAP.md step to follow AGENTS.md guidance.** AGENTS.md says: "Move the completed milestone from ROADMAP.md into `docs/archive/completed-milestones.md`." Update Phase 7d to reflect this: "Move M13.5 entry from ROADMAP.md §Current Sequence to `docs/archive/completed-milestones.md`."

10. **Add a one-liner to Phase 5 about pre-existing test flakiness.** "The pre-existing `state.test.ts` gold-food-timer flakiness (PROJECT_STATE.md §Known Technical Debt #1) is unaffected by M13.5 — new tests use `generateRunnerCourse`/`spawnRunnerFood` with normal food, no gold timer."

11. **Resolve the previous PLAN_REVIEW.md staleness.** Before writing the M13.5 review (this document), the M13.1 review should be archived to `plans/archive/M13_1_PLAN_REVIEW.md`. The plan's Phase 7 should include this archival step (or it should be done as part of the plan review handoff, not the plan itself).

12. **Tighten the Phase 5 (HUD/GameOver polish) justification.** Phase 5 is the only phase that does not directly answer the PRD's "Does this feel like a runner?" question. Either (a) explicitly justify in the Non-Goals section that score visibility is required for the M13 vs M13.5 comparison in owner question 5 ("Does gameplay feel better than Milestone 13?"), or (b) defer Phase 5 to a follow-up plan and mark it out of scope.

### Optional (nice to have)

13. **Wrap `Board` in `memo`.** Phase 2 causes Board to re-render every tick as the snake advances. Wrapping Board in `memo` with a custom comparator (or just a shallow-equal one) prevents unnecessary re-renders. Minor perf improvement at high speeds.

14. **Add a `data-viewport-scrolling` attribute to the Board.** Mirrors the existing `data-runner` and `data-wrap-around` patterns. Allows future CSS hooks for viewport-scrolling-specific styling.

15. **Add a "Verify recording tools work" step at the start of Phase 6.** Before committing to 5 recordings, the project owner should produce a 30-second test recording and verify it can be played back. This catches tooling issues early.

16. **Consider adding a `runnerMode: boolean` field to `GameProfile` for future separation of high scores.** This was flagged as a future consideration in the M13.1 review (Finding 7). Out of scope for M13.5, but worth noting in the doc updates.

17. **Add mobile responsive breakpoint guidance to Phase 5.** The new 5-section RunnerHUD may need a `@media (max-width: 600px)` rule to wrap gracefully on mobile, similar to the classic ScoreBoard.

18. **Add an `aria-label` to the Board that reflects viewport scrolling.** e.g., "Snake Run runner board — 3 lanes, snake in lane {lane}." Minor accessibility polish.

---

# Detailed Findings

## Finding 1 — `VIEWPORT_TAIL = 11` contradicts PRD §9 "lower third" (Phase 2a)

- **Severity:** Critical
- **Description:** PRD §9 says: "Snake should remain near lower third of screen." The plan's `RUNNER_VIEWPORT_TAIL = 11` places the snake at screen row 11, which is 55% from the top — the **middle** of the screen, not the lower third (65-85% from top, i.e., screen row 13-17). The plan's own text says "lower-middle" (line 181), which contradicts the PRD. This is a documented deviation that should be resolved before implementation.
- **Recommendation:** Change `RUNNER_VIEWPORT_TAIL` to 13 (snake at 65% from top, true lower third). Update the plan's screen-row math: 13 rows behind, 6 rows ahead. Verify the reduced ahead visibility is still adequate for PRD §16 reaction windows. At max speed (80ms) with 6 rows ahead = 0.48s, which is just below the PRD §16 "hard" target of 0.5-1.0s. Alternative: change to 12 (60% from top) as a compromise. The PRD-aligned value is 13-14.

## Finding 2 — Phase 4's `MIN_PATTERN_SPACING` formula generates out-of-bounds obstacles (Phase 4)

- **Severity:** Critical
- **Description:** With `numPatterns = 12` and `rowStep = Math.max(2, Math.floor(20/12)) = 2`, the loop `for (let i = 0; i < 12; i++) { const y = i * 2; }` produces y values 0, 2, 4, 6, 8, 10, 12, 14, 16, 18, **20, 22**. The values 20 and 22 are outside the 20×20 grid. The current `runnerCourse.ts:15-23` loop has no bounds check. Obstacles at `{x: lane_x, y: 20}` and `{x: lane_x, y: 22}` are pushed to the obstacles array but are not rendered (Board only renders y < 20) and not collidable. Net effect: at max difficulty, only 10 of the 12 intended patterns are placed. The plan's claim of "12 patterns at max difficulty" is false; the actual is 10.
- **Recommendation:** Three options: (a) cap `numPatterns` at `Math.min(12, Math.floor(GRID_SIZE / MIN_PATTERN_SPACING))` = 10 explicitly, (b) add `if (y >= GRID_SIZE) continue;` inside the loop after the headY check, or (c) restructure the loop to compute `const actualPatterns = Math.min(numPatterns, Math.floor(GRID_SIZE / rowStep))` and iterate `actualPatterns` times. Option (b) is the smallest change. Also update the plan's description to reflect the new max pattern count.

## Finding 3 — Phase 4's spacing fix reduces obstacle density at high difficulty (Phase 4)

- **Severity:** High
- **Description:** The current code at max difficulty places 12 patterns (rowStep=1, all rows used). The new code with `MIN_PATTERN_SPACING = 2` places 10 patterns (per Finding 2). This is a 17% reduction in obstacle density at the highest difficulty. PRD §19 requires "120+ seconds: Extreme pressure," implying increasing density over time. The plan's spacing fix REDUCES the ceiling of difficulty, which is the opposite of the PRD's intent.
- **Recommendation:** This is a direct consequence of Finding 2. Once the bounds bug is fixed (option (b) in Finding 2), the actual pattern count is correctly 10. If the team wants to keep "12 patterns" as the difficulty ceiling, the implementation must change strategy (e.g., allow adjacent rows at the highest difficulty, or use a non-uniform distribution). The plan should make the difficulty-vs-spacing tradeoff explicit. If the design intent is "spacing=2 for readability," then the new max of 10 patterns is correct and the PRD's "extreme pressure" can be achieved via speed (Phase 3) rather than density (Phase 4).

## Finding 4 — Phase 1d's `useTouch` dependency is not addressed (Phase 1d)

- **Severity:** High
- **Description:** Phase 1d instructs the implementer to "Subscribe to `onSwipeProgress` from `useTouch` hook" and pass `swipeDirection` and `swipeProgress` to Board. However, the current `src/hooks/useTouch.ts:12-13` only accepts `onSwipe` and does not plumb an `onProgress` callback to the platform gesture recognizer. The platform `src/platform/touch.ts:15` exposes `onProgress` on the recognizer, but the React hook does not forward it. Implementing 1d requires modifying `useTouch` to accept and forward an optional `onProgress` prop, which is a non-trivial cross-cutting change affecting all `useTouch` consumers (RunnerGame and Game).
- **Recommendation:** Either (a) add a `useTouch` modification prerequisite to Phase 1d: "First, modify `src/hooks/useTouch.ts` to accept and forward an optional `onProgress` callback. Update `useTouch.test.tsx` to verify the new prop. Ensure the change is backwards-compatible (default behavior unchanged when `onProgress` is undefined)." or (b) drop 1d from the plan and add to `docs/IDEAS_BACKLOG.md`. Option (a) keeps 1d in scope but adds ~1-2 hours of work that the plan's "4 files" estimate does not account for. Option (b) is cleaner.

## Finding 5 — Validation directory name does not match PRD §20-21 (Phase 6)

- **Severity:** High
- **Description:** PRD §20-21 specifies: "Store in: `docs/Milestone 13_5_validation/`." The plan uses: `docs/m13_5_validation/`. This is a silent deviation from the PRD. AGENTS.md says "PRDs are authoritative" (via ROADMAP.md), so the plan should use the PRD's path or document the deviation. The plan does neither.
- **Recommendation:** Use the PRD's path: `docs/Milestone 13_5_validation/` (with space, title case). Update the plan's Phase 6 directory structure. If the team prefers the lowercase path for consistency with other doc directories (`docs/prd/`, `docs/adr/`, `docs/archive/`), update the PRD to match — but this should be an explicit decision documented in the plan, not a silent change.

## Finding 6 — Binary video files in git will bloat the repo (Phase 6)

- **Severity:** High
- **Description:** Phase 6 says "5 gameplay recordings captured and stored" in `docs/m13_5_validation/recordings/`. At ~2-5MB per minute of webm video, 5 recordings × 2 minutes = 20-50MB minimum. The current `.gitignore` does not appear to exclude this directory. Committing video files to git will bloat the repo and slow clones. The plan does not address this.
- **Recommendation:** Add to `.gitignore`:
```
docs/m13_5_validation/recordings/*.webm
docs/m13_5_validation/recordings/*.mp4
```
Document in the validation README: "Recording files are stored externally (Google Drive, GitHub Releases, etc.) and linked from this README. Only README.md, screenshots, and the recordings/ directory structure are committed to the repo." If the team prefers to commit videos, add a LFS entry instead.

## Finding 7 — Speed profile mechanism is ambiguous (Phase 3)

- **Severity:** Medium
- **Description:** Phase 3 presents two competing implementations: (a) `window.__RUNNER_SPEED_PROFILE__` global with optional URL param, and (b) `RUNNER_SPEED_MULTIPLIER` constant edited by hand and rebuilt. The plan says "Simpler approach: use `.env` or a dev-only constant" and later "For validation, hand-edit this constant and rebuild." An AI implementer may choose either, producing inconsistent results.
- **Recommendation:** Commit to one mechanism. The URL parameter approach (`?speed=1.25`) is better because: (i) no rebuilds needed, (ii) the project owner can record all 4 profiles with one build, (iii) the change is isolated to `main.tsx` (read URL param on load). Recommend updating Phase 3 to: "Read `?speed=N` URL parameter in `src/main.tsx`, set `window.__RUNNER_SPEED_PROFILE__`. Engine reads this global in the runner branch of `startLoop`."

## Finding 8 — No classic-mode regression test for Board (Phase 2)

- **Severity:** Medium
- **Description:** Phase 2 modifies `Board.tsx` to add a conditional `if (viewportHeadY !== undefined)` branch. The verification checklist says "Classic mode board renders identically to pre-change behavior" but there is no automated test for this. The test plan adds Board tests for runner mode (with `viewportHeadY`) but not for classic mode (without `viewportHeadY`).
- **Recommendation:** Add to `src/components/__tests__/Board.test.tsx`: "renders identically when viewportHeadY is undefined." Snapshot or compare the rendered cells' grid coordinates to a known-good baseline. This catches a regression where the `if` branch's `else` is changed.

## Finding 9 — No unit test for the viewport wrap-around math (Phase 2)

- **Severity:** Medium
- **Description:** Phase 2's wrap-around edge case is described as "The modulo formula handles this" with a worked example. The plan does not add a unit test for this. A test like "viewportHeadY=0 and viewportHeadY=19 produce the same screen position for the snake head" would catch a regression where the modulo formula is changed.
- **Recommendation:** Add to `src/components/__tests__/Board.test.tsx` (or extract the viewport math to a helper and test it): "viewportHeadY=0 and viewportHeadY=19 both place snake head at screen row 11."

## Finding 10 — Lane change animation timer race condition (Phase 1a)

- **Severity:** Low
- **Description:** Phase 1a uses `useEffect` + `setTimeout` to clear `laneChangeDir` after ~200ms. If the player changes lanes twice in rapid succession (LEFT then RIGHT within 200ms), the first change's timer will fire and clear `laneChangeDir` while the second change's effect is still active. The plan says "Clear laneChangeDir via a single `useEffect` cleanup function with `setTimeout`" but does not show the implementation. The correct pattern uses `useRef` for the timeout id, cleared on each new lane change.
- **Recommendation:** Add a code snippet to Phase 1a showing the correct pattern:
```ts
const laneChangeTimerRef = useRef<number | null>(null);

const handleLaneChange = (dir: -1 | 1) => {
  changeLane(dir);
  if (laneChangeTimerRef.current) clearTimeout(laneChangeTimerRef.current);
  setLaneChangeDir(dir === -1 ? 'left' : 'right');
  laneChangeTimerRef.current = window.setTimeout(() => {
    setLaneChangeDir(null);
    laneChangeTimerRef.current = null;
  }, 200);
};
```
Update the plan's Phase 1a to include this snippet.

## Finding 11 — Previous PLAN_REVIEW.md is for M13.1 and will be overwritten (process)

- **Severity:** Medium
- **Description:** The current `plans/PLAN_REVIEW.md` is the M13.1 review (32.5KB, with the supplement review). The M13.5 review (this document) will overwrite it. The M13.1 review contains valuable findings that may be referenced in future plans (e.g., the "visual outcome validation" approach in the supplement). The plan does not address archival.
- **Recommendation:** Before writing the M13.5 review, archive the M13.1 review to `plans/archive/M13_1_PLAN_REVIEW.md`. This is a process improvement, not a plan change, but should be done as part of the handoff. The plan's Phase 7 should include a note: "Archive the M13.1 PLAN_REVIEW.md to `plans/archive/` if not already done."

## Finding 12 — Phase 5 is weakly tied to the PRD's "feel only" framing (Phase 5)

- **Severity:** Medium
- **Description:** PRD §4 explicitly excludes "cosmetics, unlockables." Phase 5 adds a Score section to RunnerHUD and a "New Best!" badge to RunnerGameOver. This is cosmetic polish that does not directly answer "Does this feel like a runner?" The plan does not justify why Phase 5 is in scope.
- **Recommendation:** Either (a) explicitly justify in the plan's Non-Goals section: "Score display in RunnerHUD is required for owner validation question 5 ('Does gameplay feel better than Milestone 13?') — without a visible score, the player cannot compare runs." or (b) defer Phase 5 to a follow-up plan and add to `docs/IDEAS_BACKLOG.md`. Option (a) is consistent with the plan's current scope.

## Finding 13 — Phase 5 mobile responsive layout not addressed (Phase 5)

- **Severity:** Low
- **Description:** The current RunnerHUD has 4 sections (Distance, Food, Length, Best). Phase 5 adds a 5th (Score). The existing CSS may not wrap gracefully on mobile. The plan does not mention a mobile breakpoint.
- **Recommendation:** Add to Phase 5a: "Verify the 5-section RunnerHUD wraps gracefully on mobile (`@media (max-width: 600px)`). May need to adjust CSS to wrap or use smaller font for the new Score section."

## Finding 14 — Phase 7 ROADMAP.md step is ambiguous (Phase 7d)

- **Severity:** Low
- **Description:** Phase 7d says "Move M13.5 from 'Next' to 'Completed' sequence." The current ROADMAP.md does not have an explicit "Next" section listing M13.5; it has a "Next: Milestone 13.5 → docs/prd/PRD_M13_5.md" line within the "Current Sequence" section. AGENTS.md says: "Move the completed milestone from ROADMAP.md into `docs/archive/completed-milestones.md`." The plan's instruction is ambiguous about whether to (a) move M13.5 to a "Completed" section in ROADMAP.md or (b) move it to `docs/archive/completed-milestones.md`.
- **Recommendation:** Update Phase 7d to follow AGENTS.md: "Move M13.5 entry from `docs/ROADMAP.md` §Current Sequence to `docs/archive/completed-milestones.md`. Update ROADMAP.md §Current Progress to reflect M13.5 completion and M14 as next."

## Finding 15 — "No new React state management" is technically false (Architecture Overview)

- **Severity:** Low
- **Description:** The Architecture Overview says "No new React state management." Phase 1a adds a `useState` for `laneChangeDir` in `RunnerGame.tsx`. The spirit is correct (no new library, no Redux), but the wording is imprecise.
- **Recommendation:** Change to: "No new state management library. Minimal new useState for animation triggers (lane change direction, swipe progress)."

## Finding 16 — Summary table file-count error (Summary)

- **Severity:** Low
- **Description:** The Summary table's Phase 2 row says "3 (Board.tsx, RunnerGame.tsx, types/components.ts, constants.ts)" — that's 4 files, not 3. The same row's parenthetical lists 4 filenames.
- **Recommendation:** Fix the count to 4. Minor cosmetic.

## Finding 17 — Pre-existing test flakiness not acknowledged (Phase 4)

- **Severity:** Low
- **Description:** PROJECT_STATE.md §"Known Technical Debt" #1 documents a flaky test in `state.test.ts` (gold food timer). The M13.1 review recommended adding a one-liner to acknowledge this. The M13.5 plan does not.
- **Recommendation:** Add to Phase 4: "The pre-existing `state.test.ts` gold-food-timer flakiness (PROJECT_STATE.md §Known Technical Debt #1) is unaffected by M13.5 — new tests use `generateRunnerCourse`/`spawnRunnerFood` with normal food, no gold timer."

## Finding 18 — Validation tool verification not addressed (Phase 6)

- **Severity:** Low
- **Description:** Phase 6 assumes Chrome DevTools Recorder works. The Recorder feature may not be available in all Chrome versions, and the project owner may not be familiar with it. A short test recording at the start of Phase 6 would catch tooling issues before committing to the full 5-recording process.
- **Recommendation:** Add a "Phase 6a: Tool verification" step: "Before recording the 5 required runs, produce a 30-second test recording using the chosen tool. Verify the file plays back correctly. If the tool fails, switch to an alternative (OBS Studio, screen recorder, etc.)."

## Finding 19 — Visibility mitigation is soft (Risk Register)

- **Severity:** Low
- **Description:** The Risk Register says "8-row ahead visibility is insufficient at high speed" with mitigation "PRD hard reaction window is 0.5-1.0s. At 80ms/tick, 8 rows = 0.64s — adequate. Validate in recordings." This is a soft mitigation — if validation fails, what is the contingency?
- **Recommendation:** Add a concrete contingency: "If 8-row visibility proves insufficient at Profile D (1.75x), the contingency is to either (a) increase `VIEWPORT_TAIL` to 12 (60% from top) for a 7-row ahead view at 80ms = 0.56s, or (b) reduce the maximum speed profile to 1.5x. The Phase 6 validation should specifically test Profile D for reaction time."

## Finding 20 — DoD lacks lint/tsc precondition for validation (Definition of Done)

- **Severity:** Low
- **Description:** The Definition of Done has Implementation, Validation, and Documentation sections. The Implementation section has `npm run build`, `npm run lint`, `npx tsc --noEmit` as items. The Validation section does not have these as preconditions. If the implementation introduces a lint or typecheck error, the validation phase may proceed against broken code.
- **Recommendation:** Add to the Validation section: "Preconditions: all of Implementation section's `npm run build`, `npm run lint`, `npx tsc --noEmit`, and `npm test -- --run` pass."

## Finding 21 — No "verify playback" step for recordings (Phase 6)

- **Severity:** Low
- **Description:** If a recording is corrupted or the file format is unsupported, the milestone is blocked because the AI reviewer cannot watch it. The plan does not address this.
- **Recommendation:** Add a "Verify playback" step at the end of each recording: "After recording, play back the file once to verify it is not corrupted and can be opened by the AI review tool."

## Finding 22 — Board is not memoized (Phase 2)

- **Severity:** Low
- **Description:** `Board` is not wrapped in `memo`. With Phase 2's viewport scrolling, Board re-renders every tick as `state.snake[0].y` changes. At high speeds (Profile D at 46ms/tick), this is ~22 re-renders per second. While the internal `useMemo` for `grid` is correctly memoized, the Board component itself re-runs. Wrapping Board in `memo` prevents re-renders when props are shallow-equal.
- **Recommendation:** Add a "Wrap Board in memo" step to Phase 2: "Wrap `Board` in `React.memo` to prevent unnecessary re-renders. Use the default shallow-equal comparator (props change when snake/food/obstacles change, which is the correct behavior)."

## Finding 23 — `data-viewport-scrolling` attribute not added (Phase 2)

- **Severity:** Low
- **Description:** The Board already has `data-runner` and `data-wrap-around` attributes for CSS hooks. Phase 2 could add `data-viewport-scrolling="true"` to mirror this pattern, allowing future CSS hooks for viewport-scrolling-specific styling.
- **Recommendation:** Add a step to Phase 2b: "Add `data-viewport-scrolling` attribute to Board when `viewportHeadY !== undefined`." This is a minor consistency improvement.

## Finding 24 — `aria-label` for viewport-scrolled Board (Phase 2)

- **Severity:** Low
- **Description:** The existing Board has `aria-label={runnerLane !== undefined ? "Snake Run runner board — 3 lanes" : "Snake Run board"}`. With viewport scrolling, the board is scrolled, but the label is the same. A label like "Snake Run runner board — 3 lanes, snake in lane {lane}" would be more informative.
- **Recommendation:** Update the aria-label to include the lane: "Snake Run runner board — 3 lanes, snake in lane {lane}." Minor accessibility polish.

## Finding 25 — `runnerMode` field for high score separation (out of scope but flagged)

- **Severity:** Low
- **Description:** The M13.1 review (Finding 7) flagged the future need for a `runnerMode: boolean` field in `GameProfile` to separate classic and runner high scores. M13.5 may surface this need (e.g., if the owner validation reveals that classic and runner high scores are being conflated).
- **Recommendation:** Add to Phase 7: "Note: If validation reveals that classic and runner high scores should be separated, add a follow-up plan to introduce a `runnerMode` field in `GameProfile`. Out of scope for M13.5."

---

# Supplemental Review — Second LLM Findings

**Reviewer:** External LLM review (received as additional input)
**Date:** 2026-06-11
**Context:** Additional review feedback received after the initial review was applied to `plans/ACTIVE.md`. These findings supplement — not replace — the earlier review. This supplemental section also cross-references findings from the original review where the two perspectives overlap.

---

## Overall Assessment

The second LLM's assessment is broadly aligned with the original review: viewport scrolling is correctly identified as the highest-leverage change, the plan is substantially better than the original M13 plan, and the architecture is sound. The second LLM adds three strong process-focused concerns (reframing the milestone around the primary deliverable, adding abort criteria, and treating validation as the actual decision point rather than the polish work) that the original review did not fully surface. The two reviews together provide a more complete picture: the original review focuses on correctness/risk; the second LLM focuses on milestone scope and execution discipline.

The second LLM's most distinctive contribution is the insight that **viewport scrolling should be the primary deliverable, not Phase 2 of 7**. The original M13.1 plan had this insight ("single most impactful change") but did not restructure the milestone around it. The second LLM correctly identifies that the current 7-phase structure is a feature-completeness structure, not a feel-validation structure. This is a significant restructuring recommendation.

---

## New Required Changes

### Required Change 26 — Reframe the milestone around viewport scrolling (RC1 from second LLM)

- **Severity:** Critical
- **Description:** The current 7-phase structure treats viewport scrolling as one of seven equal-weight phases. The second LLM correctly observes: "If viewport scrolling fails to create runner feel, the milestone fails regardless of animations, HUD improvements, or documentation updates." Implementing Phase 3-5 (speed profiles, course tuning, HUD polish) and Phase 6 (5 recordings) before confirming that viewport scrolling creates runner feel is wasted work. The PRD §28 Exit Decision ("Does Snake Run have the potential to become a compelling runner?") is a binary decision that depends primarily on viewport scrolling, not on the polish work.
- **Recommendation:** Restructure the plan into a viewport-first sequence:
  - **Phase A:** Viewport Scrolling (current Phase 2) — implement the core rendering transform.
  - **Phase B:** Minimal Validation (1-2 recordings) — verify that viewport scrolling actually creates runner feel. This is the validation gate.
  - **Phase C:** Conditional Follow-up (current Phases 1, 3, 4, 5) — **only if Phase B passes**. Lane feedback, speed tuning, course tuning, HUD polish. If Phase B fails (recordings do not communicate runner feel), pause the milestone and reassess the camera strategy per the abort criteria (see Required Change 31).
  - **Phase D:** Documentation (current Phase 7) — moved to after validation is complete.
  
  This restructures the plan from "implement 7 phases, then validate" to "implement the critical change, validate it, then implement conditionally." The plan's Definition of Done should reflect this: "If Phase B fails, the milestone is paused, not failed with incomplete polish."

### Required Change 27 — Replace implementation-specific Board tests with outcome tests (RC2 from second LLM)

- **Severity:** High
- **Description:** The original Test Plan (PLAN §"Test Plan") includes:
  - "renders with viewportHeadY prop in runner mode" (Board should render with correct aria-label)
  - "shifts grid rows based on viewportHeadY" (verify row ordering)
  - "key stability during viewport scrolling" (verify React keys don't change unexpectedly)
  
  The second LLM correctly observes these are implementation-detail tests that will break if the viewport scrolling strategy is refactored. The player outcome (snake in fixed screen position, content scrolling) is what matters.
- **Recommendation:** Replace the three implementation-specific tests with outcome-based tests:
  - "Runner board keeps snake in fixed screen position during gameplay" (verify snake screen position is constant across multiple ticks)
  - "Food becomes visible to the player as it approaches" (verify food at any grid Y eventually appears at a screen row close to the snake)
  - "Obstacles become visible to the player as they approach" (same as food)
  - "Classic mode rendering is byte-identical when viewportHeadY is undefined" (regression test, addressing the original review's Finding 8)
  
  These outcome tests survive refactors of the viewport scrolling implementation (e.g., if the team later switches to a different modulo strategy, CSS transforms, or canvas rendering).

### Required Change 28 — Reduce validation recording requirements to 2 (RC3 from second LLM)

- **Severity:** High
- **Description:** The PRD §20 requires 5 gameplay recordings. The second LLM recommends reducing to 2 ("Recording A: current speed; Recording B: fastest acceptable speed"). This conflicts directly with the PRD. However, the second LLM's reasoning is valid: 5 recordings × 2-5 minutes = 10-25 minutes of playback, plus 4-5MB per minute = 40-125MB of storage, plus the project owner's review time. For a solo developer validating a single design decision, this is excessive.
- **Recommendation:** **Conflict with PRD §20.** The PRD is authoritative per AGENTS.md §"Documentation Rules" (PRDs are referenced as authoritative in ROADMAP.md). The plan cannot deviate from the PRD without an explicit PRD update. Two options:
  - **Option A (preferred):** Keep the PRD's 5 recordings. Document the second LLM's concern in this review and recommend the team consider updating the PRD to require fewer recordings in a future revision. Note that 5 recordings provide value for AI review agents that may not have access to live gameplay.
  - **Option B:** Update the PRD to require 2 recordings, then have the plan align. This requires a PRD revision and may not be in scope for M13.5.
  
  For this review, **Option A is recommended** — keep 5 recordings as the PRD requires, but ensure the plan's recording instructions are efficient (e.g., use the fastest encoding, batch recordings, etc.). The second LLM's core insight (validation should be lean) is valid but should be addressed by PRD revision, not by the plan silently deviating.

### Required Change 29 — Drop Phase 1d (swipe edge indicator) from scope (RC6 from second LLM)

- **Severity:** High
- **Description:** The second LLM correctly observes that the optional swipe edge indicator (Phase 1d) introduces "additional UI complexity, mobile-specific code, additional testing, without solving a major problem. The lane change animation already provides confirmation." This aligns with the original review's Finding 4 (the `useTouch` dependency is not addressed; implementing 1d requires modifying `useTouch`).
- **Recommendation:** **Drop Phase 1d entirely from M13.5.** The original review recommended either implementing 1d with a `useTouch` prerequisite OR dropping it; the second LLM makes a stronger case for dropping it. The lane change animation in 1a-1c already provides drag-end feedback, which is the player-facing concern. Edge-during-drag feedback is a "nice to have" that adds cross-cutting complexity to `useTouch` (a shared hook used by both RunnerGame and Game) without solving a major usability problem. Move the idea to `docs/IDEAS_BACKLOG.md` as a future touch-UX improvement to be addressed if mobile testing later reveals a real usability issue.

### Required Change 30 — Don't hardcode event density conclusions (RC7 from second LLM)

- **Severity:** Medium
- **Description:** The original plan (Phase 4 §"Why no other course changes?") states: "At starting speed (200ms), 3-row step = obstacle every 600ms = 1.7 events/sec. Within 2-5s target." This is an assumption, not a measurement. The second LLM correctly observes: "We currently have no evidence that this creates excitement." Hardcoding density conclusions into the plan creates a false sense of validation; the recordings (Phase 6) are the only valid evidence.
- **Recommendation:** Reframe Phase 4's "Why no other course changes?" section to acknowledge that the density calculations are assumptions, not validated:
  > Event density (PRD §14): The 1.7 events/sec calculation is an estimate based on current course generation parameters. The actual density will be evaluated from gameplay recordings. If recordings show excessive downtime (>8s without decision-making per PRD §15), course generation may be adjusted in a follow-up plan.
  
  This makes the assumption explicit and the contingency clear.

### Required Change 31 — Add explicit abort criteria (RM11 from second LLM)

- **Severity:** High
- **Description:** The original plan's Definition of Done has an exit decision (PRD §28: "Does Snake Run have the potential to become a compelling runner?") but no abort criteria. The second LLM correctly observes: "One thing missing from the plan: What happens if viewport scrolling fails?" Without abort criteria, the team may continue implementing polish work (Phases 3-5) even if viewport scrolling does not create runner feel, leading to sunk-cost development.
- **Recommendation:** Add to the plan's Definition of Done, before the Implementation section:
  > ### Abort Criteria
  > 
  > After Phase A (Viewport Scrolling) and Phase B (Minimal Validation):
  > 
  > If recordings still appear static or puzzle-like (i.e., the player cannot perceive forward motion), the milestone is **paused**, not failed. Polish work (Phases 3-5) is deferred until the camera strategy is reassessed. The reassessment should answer: "Is the rendering transform correct, or does the camera strategy need a different approach (e.g., CSS-based parallax, fixed-camera-with-rotating-background)?" This prevents sunk-cost development on polish work that depends on a working core mechanic.
  
  This aligns with PRD §28's binary exit decision and gives the team a clear pause point.

---

## New Recommended Changes

### Recommended Change 32 — Simplify speed profile to one constant (RC8 from second LLM)

- **Severity:** Medium
- **Description:** The original plan (Phase 3) presents two competing speed profile mechanisms: URL parameter (`?speed=1.25`) and hand-edited constant (`RUNNER_SPEED_MULTIPLIER`). The original review's Finding 7 recommended the URL parameter approach. The second LLM takes the opposite position: "Keep it simple. One developer constant: `RUNNER_SPEED_MULTIPLIER` is sufficient. Avoid URL params, globals, environment plumbing, or permanent profile systems."
- **Recommendation:** This is a tradeoff. The second LLM's position is valid for a one-time validation effort (the milestone is a feel-validation milestone, not a permanent speed-profile system). The URL parameter approach is better long-term but adds complexity that may not be needed. **Recommend the simpler approach: use `RUNNER_SPEED_MULTIPLIER` as a single hand-edited constant.** The project owner rebuilds 4 times for 4 speed profiles, but the implementation is minimal and the infrastructure is throwaway (the constant will be removed after validation, per the original plan's Phase 3 §"This is temporary validation infrastructure, not a permanent feature"). Update the original review's Finding 7 recommendation to align: prefer the simpler approach for this validation milestone.

### Recommended Change 33 — Add motion validation screenshots (RM9 from second LLM)

- **Severity:** Medium
- **Description:** The second LLM correctly observes that screenshots can be more efficient for AI review agents than video. A single high-quality screenshot of "frame during obstacle approach" can answer the question "Does this frame appear to be in motion?" more directly than a 2-minute video.
- **Recommendation:** Add to Phase 6's screenshot checklist (which currently includes start, mid-run, high-pressure, game-over):
  - **Frame during obstacle approach** — capture at the moment a new obstacle row scrolls into the visible-ahead region.
  - **Frame during lane change** — capture at the moment of an active lane change (snake head mid-slide if Phase 1a is implemented, or just after).
  - **High-pressure frame** — capture at max difficulty with multiple obstacles visible.
  
  The AI review agent should answer for each frame: "Does this frame appear to be in motion, or does it appear to be a static puzzle board?" This directly targets the biggest issue (forward motion perception) with a focused artifact.

### Recommended Change 34 — Add runner identity check (RM10 from second LLM)

- **Severity:** Medium
- **Description:** The PRD §7 includes a "Runner Identity Test" (30 seconds of gameplay, "What genre is this?"). The original plan's owner validation questions (PRD §22) are subjective ("Does this feel like a runner?"). The second LLM recommends adding a more rigorous version: "If this frame was shown without context, would a viewer identify the game as: A) Runner, B) Snake, C) Puzzle Game?"
- **Recommendation:** Add to Phase 6's AI Review Questions:
  > **F. Runner Identity Check:** Review a random gameplay frame (not the start screen, not the game-over screen). Answer: "If this frame was shown to a viewer with no context, would they identify the game as: A) Runner, B) Snake, C) Puzzle Game, D) Other?" Desired answer: A) Runner. Acceptable: A) Endless Runner. Failure: B), C), or D).
  
  This is a more objective test of the "runner identity" PRD requirement and complements the existing AI review questions A-E.

---

## Cross-Reference: Findings That Align With the Original Review

| Second LLM Finding | Original Review Finding | Status |
|--------------------|------------------------|--------|
| RC6 — Drop Phase 1d (swipe indicator) | Finding 4 — useTouch dependency unaddressed | Both recommend dropping 1d. Second LLM's case is stronger. |
| RC8 — Simplify speed profile | Finding 7 — Speed profile mechanism ambiguous | **Conflict.** Original review prefers URL parameter; second LLM prefers single constant. Recommendation updated (see Recommended Change 32) — prefer simpler approach. |
| RM11 — Abort criteria | (Not in original review) | New. Strong recommendation. |
| (Implicit) Outcome tests over implementation tests | Finding 8 — Classic-mode regression test missing | Original review asked for ONE regression test; second LLM asks for full replacement of implementation tests with outcome tests. Second LLM's approach is more comprehensive. |
| (Implicit) Validate, then polish | (Not in original review) | New. The original review focused on correctness/risk; second LLM focuses on execution discipline. |

---

## Conflicts With PRD

| Second LLM Finding | PRD Reference | Conflict? | Resolution |
|--------------------|---------------|-----------|------------|
| RC3 — Reduce recordings from 5 to 2 | PRD §20 (5 recordings required) | **Yes** | Keep PRD's 5 recordings. Document the concern; address via future PRD revision. |
| RC1 — Reframe milestone around viewport scrolling | PRD §28 (Exit Decision) | Partial alignment | Reframing aligns with the Exit Decision's binary check; restructure is valid but should preserve PRD's content requirements (5 recordings, 4 screenshots, 5 owner questions, 5 AI review questions). |

---

# Handoff Assessment

## Phase structure

**Grade: Excellent.** 7 phases with explicit dependencies. Phase ordering is correct: code (1-5) → validation (6) → documentation (7). No phase requires code from a future phase. Phase 2 (viewport scrolling) is correctly identified as the dependency for Phases 3, 4, 5 (all visual changes should follow the new camera model).

## Task decomposition

**Grade: Good, with four Critical/High blockers.** Each phase lists:
- Goal
- Files to modify/create
- Code snippets (for non-trivial logic)
- Risks (with mitigations)
- Testing approach
- Acceptance criteria

The file-level granularity is appropriate for an AI agent. The code snippets for Phase 2 (viewport formula) and Phase 1a (lane change animation) are detailed enough to be unambiguous.

**Critical/High gaps to resolve before handoff:**
1. `VIEWPORT_TAIL` value (Finding 1) — must align with PRD §9.
2. `MIN_PATTERN_SPACING` bounds bug (Finding 2) — must fix out-of-bounds obstacle generation.
3. `useTouch` modification (Finding 4) — must add prerequisite or drop 1d.
4. Validation directory name (Finding 5) — must reconcile with PRD.
5. Binary file storage (Finding 6) — must add `.gitignore` policy.

## Verification strategy

**Grade: Good, with two gaps.**

**Per-phase verification:**
- Phase 1: `npm run lint`, `npx tsc --noEmit`, existing test count.
- Phase 2: `npm run build`, visual review, classic-mode regression test.
- Phase 3: `npm test -- --run`, behavioral test of multiplier.
- Phase 4: `npm test -- --run`, MIN_ROW_STEP test, lane-always-clear test.
- Phase 5: `npm run build`, visual review.
- Phase 6: 5 recordings, 4 screenshots, owner questions, AI review.
- Phase 7: documentation consistency check.

**Gaps:**
1. **No classic-mode regression test for Board** (Finding 8) — Phase 2's conditional branch is not tested.
2. **No viewport wrap-around unit test** (Finding 9) — Phase 2's math is not directly tested.

**Non-blockers:**
3. No automated visual regression check (acceptable — no visual regression tooling exists in the project).
4. No automated check that the PRD's 5 owner questions are answered YES (acceptable — this is a human task).

## Definition of Done

**Grade: Good, with two minor improvements.**

The DoD is a 3-section checklist (Implementation, Validation, Documentation) covering: lane animations, viewport scrolling, speed profiles, course tuning, HUD polish, classic mode unchanged, tests, build, lint, typecheck, recordings, screenshots, owner questions, AI review, all 4 docs files, no inconsistencies.

**Missing:**
1. **Lint/tsc precondition for Validation section** (Finding 20).
2. **Test count should be 434 (specific number, not "all tests pass")** in the Implementation section. The plan's verification lists "all 434 tests still pass" in some places but the Phase 5 expected text is vague.

## AI-agent execution readiness

**Grade: Good, with five blockers to resolve before implementation.**

1. **`VIEWPORT_TAIL` value** (Finding 1) — must align with PRD §9.
2. **Phase 4 bounds bug** (Finding 2) — must fix before tests pass.
3. **`useTouch` modification** (Finding 4) — must add prerequisite or drop 1d.
4. **Validation directory name** (Finding 5) — must reconcile with PRD.
5. **Binary file storage** (Finding 6) — must add `.gitignore` policy.

**Non-blockers but worth fixing:**
6. Speed profile mechanism should be URL parameter, not constant edit (Finding 7).
7. Classic-mode regression test should be added (Finding 8).
8. Viewport wrap-around test should be added (Finding 9).
9. Lane change timer race condition should be addressed (Finding 10).
10. Phase 5 mobile responsive layout should be addressed (Finding 13).
11. Phase 7 ROADMAP.md step should follow AGENTS.md guidance (Finding 14).
12. Previous PLAN_REVIEW.md should be archived (Finding 11).

Other than these, an AI agent with the plan plus AGENTS.md plus PRD_M13_5.md plus ROADMAP.md plus ARCHITECTURE.md should be able to execute the milestone without further human input. The code snippets are detailed, the file paths are exact, and the acceptance criteria are concrete.

---

# Final Recommendation

**Approve with Major Changes (Combined Original + Second LLM Reviews)**

The plan is fundamentally sound: the architecture, scope discipline, phase decomposition, risk register, and validation approach are all aligned with the PRD and the project's established patterns. The plan correctly identifies viewport scrolling as the highest-leverage change for runner feel, correctly defers most "feel-related" decisions to validation (recordings + owner questions), and correctly limits scope to the PRD's "feel only" framing.

**However, ten Critical/High issues must be resolved before implementation:**

1. **(Finding 1, Critical)** `VIEWPORT_TAIL = 11` contradicts PRD §9 "lower third." Must align value with PRD or update PRD with explicit justification.
2. **(Finding 2, Critical)** Phase 4's `MIN_PATTERN_SPACING = 2` formula generates out-of-bounds obstacles at max difficulty. Must fix bounds check or cap pattern count.
3. **(Finding 26, Critical — from second LLM RC1)** Reframe the milestone around viewport scrolling. Viewport scrolling is the milestone; everything else is conditional. Implement viewport scrolling first, validate it works, then implement the polish work. This prevents sunk-cost development.
4. **(Finding 4, High)** Phase 1d's `useTouch` dependency is unaddressed. **Drop Phase 1d entirely** (per second LLM RC6 and original Finding 4). Move to `docs/IDEAS_BACKLOG.md`.
5. **(Finding 5, High)** Validation directory name (`docs/m13_5_validation/`) does not match PRD (`docs/Milestone 13_5_validation/`). Must reconcile.
6. **(Finding 6, High)** Phase 6's 5 video recordings will bloat the git repo. Must add `.gitignore` policy or external storage.
7. **(Finding 27, High — from second LLM RC2)** Replace implementation-specific Board tests with outcome-based tests. Outcome tests survive refactors.
8. **(Finding 29, High — from second LLM RC6)** Drop Phase 1d (swipe edge indicator). The lane change animation already provides feedback. (Same as #4, listed separately for emphasis.)
9. **(Finding 31, High — from second LLM RM11)** Add explicit abort criteria. If viewport scrolling validation fails, pause the milestone; do not continue implementing polish work.
10. **(Finding 28, High — from second LLM RC3)** Reduce validation recording requirements. **Conflict with PRD §20:** keep PRD's 5 recordings but document the concern; address via future PRD revision.

**The seven additional Recommended Changes (11-17) should also be addressed for a clean handoff:**

11. **(Finding 30, Medium — from second LLM RC7)** Don't hardcode event density conclusions. Reframe as assumptions, validated by recordings.
12. **(Finding 32, Medium — from second LLM RC8)** Simplify speed profile to one constant. Prefer the simpler approach for this validation milestone (in conflict with original Finding 7's URL parameter preference; updated to align with second LLM).
13. **(Finding 33, Medium — from second LLM RM9)** Add motion validation screenshots to Phase 6's checklist. AI reviewers can evaluate single frames more efficiently than videos.
14. **(Finding 34, Medium — from second LLM RM10)** Add runner identity check to AI review questions. More objective than the subjective "Does this feel like a runner?"
15. **(Finding 7, Medium)** Speed profile mechanism — see #12 above; update recommendation.
16. **(Finding 8, Medium)** Classic-mode regression test for Board.
17. **(Finding 14, Low)** Phase 7 ROADMAP.md step should follow AGENTS.md archival guidance (move to `docs/archive/completed-milestones.md`, not "Completed sequence").

**Conflict resolution summary:**

- **Speed profile mechanism:** Original review recommended URL parameter; second LLM recommended single constant. **Resolution: prefer the simpler approach (single constant) for this validation milestone.** The constant is throwaway infrastructure that will be removed after validation per the original plan.
- **Recording count:** Second LLM recommended 2 recordings; PRD requires 5. **Resolution: keep PRD's 5 recordings; address the concern via future PRD revision.** The plan should not silently deviate from the PRD.

**Once these items are resolved, the plan will be ready for implementation by an AI agent or a human engineer. The plan's strengths — particularly the single most-impactful change (viewport scrolling), the validation-driven approach, and the lean scope — make M13.5 a high-quality validation milestone that correctly answers the PRD's product question: "Does Snake Run feel like a runner?"**

**Confidence:** High
**Risk:** Medium
**Primary Success Metric (from second LLM):** After implementation, a gameplay recording should communicate: "The world is rushing toward the snake." rather than: "The snake is navigating a static board."
