# Plan Review — Milestone 14.1: Smooth Runner Motion V2

**Plan under review:** `plans/ACTIVE.md` (Milestone 14.1, "Smooth Runner Motion V2")
**Reviewer role:** Staff Engineer
**Date:** 2026-06-12
**Baseline:** v0.14.0 (M14 complete) — 487 tests passing across 30 test files
**PRD:** `docs/prd/PRD_M14_1.md` v1.0
**Note on review workflow:** The previous `plans/PLAN_REVIEW.md` was the M14 review and has been archived to `plans/archive/M14_PLAN_REVIEW.md` per AGENTS.md §"Plan Lifecycle" and the M13.1 review convention.

---

# Overall Assessment

## Strengths

- **Roadmap alignment is correct.** M14.1 is the explicit next milestone in `docs/ROADMAP.md` §"Current Sequence" ("Next: Milestone 14.1 → `docs/prd/PRD_M14_1.md`") and `docs/PROJECT_STATE.md` §"Current Milestone" ("Next Goal: Milestone 14.1"). The plan is correctly staged after M14's completion.

- **The honest diagnosis is the right diagnosis.** The plan correctly identifies the problem as a presentation-layer issue (positions update only at tick boundaries, ~200ms), not an FPS/CPU/React issue. The PRD §"Core Finding From Investigation" reaches the same conclusion. The plan's Executive Summary echoes the PRD's framing almost verbatim, which is the correct decision — there's no need to invent a new model when the investigation already proved the existing engine is healthy.

- **The architecture comparison is unusually disciplined for a "small change."** Options A/B/C/D are evaluated against the five PRD-mandated criteria (complexity, risk, performance, code churn, compatibility), with concrete line/file counts. The rejection of Option B (rAF visual layer) is well-reasoned: the investigation found no FPS problem, so a 200+ LOC architectural split would violate "simple solutions" and AGENTS.md §"Development Philosophy." The plan is comfortable saying "we don't need that complexity," which is rare and correct.

- **Chosen approach aligns with the codebase's existing patterns.** The codebase already uses CSS animations for visual effects (lane change `slideLeft`/`slideRight` on Cell, `laneChangeDirection` prop threading, `data-viewport-scrolling`/`data-runner`/`data-wrap-around` attribute hooks). Phase 2's inner wrapper with a `@keyframes` animation is an extension of this pattern, not a new one. ARCHITECTURE.md §"Lane Change Visual Feedback" and §"Runner Viewport Scrolling" already document this style of pure-CSS presentation overlay on a logical-state base.

- **The Engine refactor in Phase 1 is correctly scoped.** Extracting the duplicate effective-speed computation in `Engine.startLoop()` to a private `getEffectiveSpeed()` is a small, internal cleanup that mirrors existing private helpers (e.g., `ensureVisibilityListener`, `handleVisibilityChange`). The `accumulator` cap logic (`this.accumulator > effectiveSpeed → this.accumulator = effectiveSpeed`) is preserved.

- **The risk register is mostly well-calibrated.** The plan correctly flags: (a) animation compositing with lane-change transforms (different elements — non-conflict, but worth verifying), (b) class-toggle flicker and the `void el.offsetWidth` reflow trick (with a fallback to rAF double-buffer), (c) wrap-around single-frame snap (acknowledged, accepted as a known limitation), (d) mobile browser CSS animation differences, (e) speed-multiplier validation profiles. These are the real risks for a presentation-layer milestone.

- **The "Out of Scope" list mirrors PRD §"Non Goals" one-for-one.** No obstacle balancing, no food balancing, no growth balancing, no scoring, no HUD redesign, no audio, no new mechanics, no new progression, no WebGL/Canvas, no course generation changes, no per-cell interpolation, no classic mode smoothing. This is the right restraint for a "presentation only" milestone and matches the PRD's intent precisely.

- **The 487-test baseline is acknowledged explicitly.** The plan's §"Milestone-Level Definition of Done" lists "All 487+ existing tests pass with no regressions" as a verification gate. This is the right discipline (the M14 review flagged baseline-count drift in earlier milestones).

- **Documentation update list is complete.** Phase 5e enumerates all four documents that need updates: SPEC.md §20.11, ARCHITECTURE.md (new "Smooth Runner Motion" sub-section), PROJECT_STATE.md, ROADMAP.md. This matches AGENTS.md §"Documentation Rules" for behavior changes.

## Weaknesses

- **Phase 1's `getTickProgress()` is dead code with a real cost.** Phase 1 says: "Expose the engine's internal accumulator state so the render layer can determine the current tick interval duration for the CSS animation." But Phase 3 sets the animation duration via a hardcoded `effectiveSpeed` calculation in `RunnerGame.tsx` (with the comment "mirror Engine.ts logic"), never calling `engine.getTickProgress()`. The 6 Phase 1 unit tests for `getTickProgress` are validating a public method that no production code reads. Options: (a) drop `getTickProgress` entirely (the plan is Option A, not Option B — rAF interpolation is not used), (b) use it in Phase 3 to derive the animation duration (the original Phase 1 justification), or (c) replace it with a simpler `getEffectiveSpeed()` and have RunnerGame read that. The plan must commit to one. As written, the 6 tests, the public method, and the Phase 1 refactor are all justification for a non-existent feature.

- **Phase 3 duplicates the effective-speed calculation that Phase 1 just refactored.** Phase 1 refactors the Engine's internal speed calc into a private `getEffectiveSpeed()`. Phase 3 then has RunnerGame mirror that exact math:
  ```tsx
  let effectiveSpeed = Math.max(80, 200 - Math.floor(state.distance / 50) * 2);
  effectiveSpeed = Math.round(effectiveSpeed / 1.0);
  ```
  This is a maintenance liability — if the speed curve changes (e.g., a future milestone adds a new difficulty profile), the change must be made in two places and kept in sync. The cleanest solution is to make `getEffectiveSpeed()` public (or expose `getTickInterval()` returning a number) and have RunnerGame call it. The plan should not ship code that contradicts its own refactor.

- **Phase 2's CSS-vs-JSX `display` contradiction will not compile to a working layout.** The CSS example in the plan is:
  ```css
  .boardInner { display: contents; ... }
  ```
  The JSX example in the plan is:
  ```tsx
  <div style={{ display: 'grid', gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)`, ... }}>
  ```
  These are mutually exclusive. `display: contents` makes the element transparent to the parent's grid; `display: grid` makes the element a new grid container. The plan also fails to address the **existing** inline `display: grid` on `.board` (Board.tsx:53-57), which still applies after the change. The cells are no longer direct children of `.board` (they're children of the new inner div), so the existing grid on `.board` will lay out exactly one child (the inner div) — not 400 cells. This is a layout-breaking bug that will be visible on the first `npm run dev`.

- **The wrap transition conflicts with the PRD's "continuous" requirement.** PRD §"Wrap Transition Requirements" says: "Wrap transitions should appear continuous. Forbidden: visible mutation, visible replacement, visible popping." The plan §"Wrap-around detection" acknowledges: "the 19-cell viewport shift can't be interpolated. The content snaps — acceptable per PRD's 'appear continuous' threshold." The PRD does not say "appear continuous" — it says "continuous" and "should not pop." The plan's risk table further documents the snap as a "single frame event" at the screen edge. The PRD's §"Failure Conditions" lists "viewport still jumps" as automatic failure. A single-frame snap at the wrap boundary IS a jump, even if localized. Either the implementation must be extended to handle the wrap (e.g., a one-time 19-cell "punch-through" animation, or a different course-generation strategy that does not require a wrap snap), or the PRD must be updated to allow the snap with explicit product-owner sign-off. As written, the plan and PRD are inconsistent.

- **The animation restart technique (`void el.offsetWidth` force-reflow) is fragile and not tested.** The plan describes removing the class, forcing reflow, re-adding the class to restart a CSS animation. This is a known-but-code-smelly pattern. The plan's risk table offers rAF double-buffer as a fallback but does not commit to either, and the Phase 3 test list does not include a test that verifies the restart actually produces a new animation (jsdom cannot replay CSS animation timing). The plan should pick one mechanism and document the choice with a comment in the code.

- **No test infrastructure exists for the new `RunnerGame.test.tsx`.** The file `src/components/__tests__/RunnerGame.test.tsx` does not currently exist (`ls` confirms). The plan adds it as a new file in Phase 3. The plan does not mention what mocks are needed (e.g., `useGame` must be mocked to return a deterministic `state`, `useTouch` must be mocked to avoid gesture detection setup, `sharedSoundManager` must be mocked or its subscription cleaned up). A staff-engineer-grade plan should reference the existing `useGame.test.tsx` or `useTouch.test.tsx` for mocking patterns, or include a "test scaffolding" sub-step.

- **React 19 StrictMode will cause the animation-restart useEffect to fire twice on mount.** `src/main.tsx:21` wraps the app in `<StrictMode>`, which in dev mode double-invokes effects on mount/unmount. Phase 3's animation useEffect will therefore run twice on first mount, potentially leaving the animation in an inconsistent state (class removed, reflow forced, class added — then immediately: class removed, reflow forced, class added again). This may or may not be visible depending on browser, but it is unverified behavior. The plan should add a guard or a note.

- **The test list duplicates an existing test.** Phase 2 lists "`data-viewport-scrolling` attribute set correctly" as a new test, but this test already exists in `src/components/__tests__/Board.test.tsx:71-75` (the M13.5 plan added it). Similarly, "Runner mode viewport still renders 400 cells" is already covered by `Board.test.tsx:43-46`. The plan should re-cite existing tests rather than list them as new work, and the implementer should verify the existing tests still pass with the new inner wrapper (the "inner wrapper renders 400 cells" test is a meaningful regression test against a layout-breaking wrapper change).

- **Phase 5e specifies a section number that may not exist.** The plan says "Update SPEC.md §20.11 to document smooth viewport scrolling via CSS animation." §20.11 is currently "Viewport Scrolling" — a different topic (the screen-row mapping in Board.tsx). The smoothing content is a new topic and probably belongs in a new sub-section, e.g., §20.14 (after §20.13 Milestone Celebration) or a new "Smooth Viewport" section. Using §20.11 will overwrite the existing viewport description with the smoothing content, losing the existing §20.11's documentation. ARCHITECTURE.md's plan to add a "Smooth Runner Motion" sub-section after "Runner Viewport Scrolling" is a better pattern — keep the new content in its own section.

- **The validation directory deviates from the established pattern.** The plan says: "Store recordings in `docs/recordings/` (add `.gitignore` rules for video files)." The established patterns are milestone-specific: M13.5 uses `docs/Milestone 13_5_validation/recordings/`, M14 uses `docs/Milestone 14-validation/recordings/`. Both are already in `.gitignore` (lines 32-39). The plan's `docs/recordings/` is a new, generic, non-milestone-scoped directory that does not match either prior path. The plan should use `docs/Milestone 14.1-validation/recordings/` (or `docs/Milestone 14_1-validation/` to match the PRD's underscore convention) and add the corresponding `.gitignore` entry.

- **The plan does not bump the package version.** `PROJECT_STATE.md:5` declares the current version as `v0.14.0`. `package.json:4` is stale at `0.13.1` (M13.1's bump was never applied at the package level — this is a pre-existing PROJECT_STATE vs package.json drift, not a new issue). The plan should at minimum specify the target version (presumably `0.14.1` for a "V2" patch to M14, or `0.15.0` if the milestone is considered feature-significant). The plan's Definition of Done lists documentation updates but not a version bump.

- **The plan's "Phase 4d: Classic Mode Unchanged" is partially incorrect.** It says: "Board in classic mode (no `viewportHeadY` set) is completely unaffected. The animation class is only added when `viewportHeadY !== undefined` and runner mode is active. Classic mode Board has no inner wrapper change (the inner div can always be present but the animation class is conditional)." The inner wrapper IS added unconditionally in Phase 2 (it's part of the JSX structure, not a CSS class toggle). The only thing conditional is the animation class. Classic mode will gain an extra DOM element. This is fine functionally, but the plan's claim that classic mode is "completely unaffected" at the DOM level is false. The "Snapshot: classic mode rendering unchanged" test would fail against a pre-change snapshot — the snapshot must be regenerated.

- **Phase 3's two-`useEffect` structure is awkward.** The plan shows one useEffect for animation restart (with the `state.snake[0]?.y` dep) and another for tracking `prevHeadY` via a `useRef`. These can be combined into a single useEffect that tracks `prevHeadY.current` inline before the early-return for wrap detection. Two useEffects with overlapping concerns is harder to reason about (e.g., what if they run in an unexpected order under React 18's automatic batching?).

- **The plan does not specify how `--viewport-speed` interacts with the existing `slideLeft`/`slideRight` lane-change durations.** Phase 4a correctly notes that the lane-change animation (150ms, on `.laneSlidingLeft`/`.laneSlidingRight` cell classes) and the viewport animation (200ms-ish, on the inner div) are on different elements and compose. But both use `transform` — the browser compositor handles them independently, but if a lane change happens at t=150ms during a viewport tick, the visual result depends on the order and timing of the two animations. The plan should at minimum include a manual visual check (which it does in Phase 5d #6) but should also consider: should the lane-change animation pause the viewport animation, or should they overlap? This is a small product detail but worth being explicit about.

- **The "Test Plan" lacks a "Verify animation visually" step in the test sequence.** The plan's Phase 5d manual tests #1-6 are correct. But the test plan's automated tests (Phase 1, 2, 3) cannot verify the actual visual outcome (smoothness, glides, no popping) — those are visual judgments. The plan should be explicit that **automated tests verify state, not motion**, and the visual judgment is the PRD's §"AI Review Questions" (5b) which require manual recording review.

## Major Risks

1. **Phase 2's layout bug will break the board on first run.** The `display: contents` vs `display: grid` contradiction, combined with the existing inline `display: grid` on `.board` (Board.tsx:53-57), will produce a broken layout where the inner div is the only grid child of `.board`. The 400 cells become grandchildren of `.board` and grandchildren cannot participate in `.board`'s grid. The board will render as a single empty cell with a 400-cell grid floating in the corner. This is a Critical implementation bug that must be resolved before the plan can be handed off.

2. **The wrap transition implementation contradicts the PRD's "continuous" requirement.** The PRD's "Wrap Transition Requirements" section is unambiguous: "Wrap transitions should appear continuous. Forbidden: visible mutation, visible replacement, visible popping." The plan's implementation produces a single-frame snap at the Y-boundary wrap. This is a documented PRD deviation. The plan's risk table and Option A "Disadvantages" both acknowledge the snap but rationalize it as "acceptable per PRD's 'appear continuous' threshold" — the PRD does not say "appear continuous." This is a Critical product-vs-implementation conflict.

3. **The plan includes 6 unit tests for a public method (`getTickProgress`) that no production code calls.** Phase 1's `getTickProgress` is exposed but Phase 3 doesn't use it. The 6 tests in `Engine.test.ts` and the public method on the class are dead code that the test suite will exercise but no consumer reads. This is a maintenance hazard (future maintainers will assume `getTickProgress` is load-bearing and design around it) and a 6-test false-positive surface (any test failure requires investigation but indicates nothing about real behavior).

4. **The phase structure silently relies on three undocumented changes to the existing codebase.** (a) The plan does not say to remove the existing inline `display: grid`/`gridTemplateColumns`/`gridTemplateRows` from `.board` (Board.tsx:53-57). (b) The plan does not say how the new inner div inherits the aspect-ratio sizing. (c) The plan does not say how the new inner div sets its height (it must be `100%` of `.board` to make `translateY(-5%)` equal one cell). Each of these is implied but not specified, and a missing one breaks the layout. The plan should be explicit.

## Recommended Changes

### Required (must apply before approval)

1. **Resolve the Phase 2 layout bug.** The plan must commit to one layout approach. Recommended: remove the inline `display: grid`/`gridTemplateColumns`/`gridTemplateRows` from `.board` (Board.tsx:53-57), and put them on the new inner div (which is a regular block, NOT `display: contents`). Update `.board` CSS to be a positioning container (already has `width: 100%; height: 100%; aspect-ratio: 1/1`). Update the inner div CSS to be the grid container with `height: 100%; width: 100%; display: grid; gridTemplateColumns: repeat(20, 1fr); grid-template-rows: repeat(20, 1fr);`. The animation transforms the inner div; the cells are its direct grid children.

2. **Either implement `getTickProgress` properly, or remove it.** Recommended: drop `getTickProgress` entirely. The plan is Option A (CSS-only animation), not Option B (rAF interpolation). The render layer does not need to know accumulator state — it just needs to set the animation duration. Replace the 6 Phase 1 tests with a smaller set: 1-2 tests for the `getEffectiveSpeed()` extraction (verifying the refactor doesn't change behavior). Add a public `getTickInterval()` method that returns the current effective speed in ms (a number, not the accumulator ratio), and have RunnerGame call it. This eliminates the duplication in Phase 3.

3. **Resolve the wrap transition vs PRD conflict.** Two options: (a) extend the implementation to handle wrap smoothly. The "19-cell shift" can be animated as a one-time 200ms punch-through (the player briefly sees two laps superimposed) — not ideal but PRD-compliant. Or, generate the course in a way that does not require a hard reset on wrap (e.g., pre-generate 2 laps and continuously stream). (b) Update PRD §"Wrap Transition Requirements" to explicitly accept a single-frame snap at the wrap boundary, with rationale ("snake is at the very bottom row during wrap; the snap occurs at the screen edge and is sub-perceptual"). Option (b) is faster but requires product-owner sign-off — flag this as a required clarification, not an implementer decision.

4. **Fix the validation directory name and `.gitignore`.** Use `docs/Milestone 14.1-validation/recordings/` (matching PRD §"Validation Requirements" pattern) and add to `.gitignore`:
   ```
   docs/Milestone 14.1-validation/recordings/*.webm
   docs/Milestone 14.1-validation/recordings/*.mp4
   docs/Milestone 14.1-validation/recordings/*.mov
   ```
   Document in the validation README that recordings are stored externally.

5. **Use SPEC.md §20.14 (or similar) for the new "Smooth Viewport" content, not §20.11.** §20.11 currently documents the viewport transform; the smoothing content is a separate concern. Adding it as a new sub-section preserves the existing content and keeps the spec diffable.

6. **Remove duplicate tests from the Phase 2 test list.** "`data-viewport-scrolling` attribute set correctly" is already in `Board.test.tsx:71-75`. "Runner mode viewport still renders 400 cells" is already in `Board.test.tsx:43-46`. Replace with a regression test specifically for the new inner wrapper: "inner wrapper contains all 400 cells" (asserts the new wrapper is the grid container, not `.board`).

### Recommended (should apply)

7. **Combine the two useEffects in Phase 3 into one.** Track `prevHeadY.current` inline before the wrap-detection early-return. The two-effect structure is harder to reason about and React 19's StrictMode may surface inconsistencies in the two-effect ordering.

8. **Add a test-scaffolding sub-step to Phase 3.** "Create `src/components/__tests__/RunnerGame.test.tsx` with mocks for `useGame`, `useTouch`, and `sharedSoundManager`. Reuse the mocking patterns from `useGame.test.tsx` and `useTouch.test.tsx`." This makes the test file's setup explicit.

9. **Add a StrictMode behavior note to Phase 3.** Document that the animation useEffect will fire twice on mount in dev, and confirm this is acceptable (or add a `useRef` "isMounted" guard if it causes flicker).

10. **Bump package.json version as part of the Definition of Done.** Specify `0.14.1` (or `0.15.0`) in Phase 5e. The PROJECT_STATE.md and package.json versions should match — the current drift (`0.14.0` vs `0.13.1`) should be resolved in the same PR.

11. **Update Phase 4d's "Classic Mode Unchanged" claim.** The new inner wrapper is added unconditionally, not conditionally. Classic mode DOM differs from pre-change. The snapshot test (Phase 2 test list) must regenerate its baseline. Document this explicitly.

12. **Pick one animation restart mechanism and commit.** Either (a) `void el.offsetWidth` reflow (simple, code-smelly) or (b) rAF double-buffer (cleaner, slightly more code). The plan's risk table offers both but doesn't choose. Pick one and add a one-line code comment explaining the choice.

13. **Add a "Verify animation composes with lane change" automated test.** After Phase 3, assert that triggering a lane change during a tick does not remove the viewport animation class. This is a regression test for the "different elements, browser compositor handles" claim in Phase 4a.

### Optional (nice to have)

14. **Add a `data-viewport-animating="true"` attribute to the inner div when the animation is running.** Mirrors the existing `data-viewport-scrolling`/`data-runner`/`data-wrap-around` pattern. Allows future CSS hooks and testing-library queries.

15. **Document the `viewport-speed` as `var(--viewport-speed, 200ms)` with a comment explaining why the default matches `RUNNER_INITIAL_SPEED`.** Self-documenting CSS.

16. **Consider adding a `prefers-reduced-motion` media query to disable the animation for users with motion sensitivity.** Standard a11y practice. The plan's mobile-degradation concern is similar; a `prefers-reduced-motion` check is a one-line addition to the keyframes.

---

# Detailed Findings

## Finding 1 — Phase 2 layout bug: `display: contents` vs `display: grid` contradiction (Phase 2)

- **Severity:** Critical
- **Description:** The plan shows two contradictory layout approaches for the new inner wrapper. The CSS example uses `display: contents`, the JSX example uses `style={{ display: 'grid', ... }}`. Neither account for the **existing** inline `display: grid` on `.board` (Board.tsx:53-57, `style={{ display: 'grid', gridTemplateColumns: ..., gridTemplateRows: ... }}`). After Phase 2, the cells are no longer direct children of `.board`; they are children of the new inner div. `.board`'s grid will lay out exactly one child (the inner div), and the 400 cells will be grandchildren — invisible to the grid. The board will render as a single empty cell. The plan does not mention removing the existing inline styles from `.board`.
- **Recommendation:** Pick one approach and be explicit. Recommended: remove the inline `display: grid`/`gridTemplateColumns`/`gridTemplateRows` from `.board` and put them on the new inner div as a regular block grid container. `.board` remains the positioning/border container (with `width: 100%; height: 100%; aspect-ratio: 1/1`). The inner div is the grid container with the same template columns/rows. The animation transform applies to the inner div.

## Finding 2 — `getTickProgress()` is dead code (Phase 1)

- **Severity:** Critical
- **Description:** Phase 1 adds a public `getTickProgress(): number` method to `Engine` (lines 120-137 of the plan) and 6 unit tests for it. Phase 3, however, sets the CSS animation duration via a hardcoded calculation in `RunnerGame.tsx` ("mirror Engine.ts logic"), never calling `getTickProgress()`. The 6 tests exercise a public method that no production code reads. The "shared private `getEffectiveSpeed()`" refactor in Phase 1 is also unused — the refactor extracts a private helper that Phase 1's own caller doesn't need and Phase 3 doesn't see.
- **Recommendation:** Drop `getTickProgress()`. The plan is Option A (CSS-only animation), not Option B (rAF interpolation), and does not need accumulator state. Replace the 6 tests with 1-2 tests for the internal `getEffectiveSpeed()` refactor (verifying the refactor preserves behavior). Expose a public `getTickInterval(): number` (returns the current effective speed in ms, a number) and have RunnerGame call it instead of mirroring the math. This eliminates the duplication in Phase 3 and makes Phase 1's refactor load-bearing.

## Finding 3 — Wrap transition contradicts PRD §"Wrap Transition Requirements" (Phase 3)

- **Severity:** Critical
- **Description:** PRD §"Wrap Transition Requirements" says: "Wrap transitions should appear continuous. Forbidden: visible mutation, visible replacement, visible popping." The plan §"Wrap-around detection" acknowledges: "the 19-cell viewport shift can't be interpolated. The content snaps — acceptable per PRD's 'appear continuous' threshold." The PRD does not contain the phrase "appear continuous" — it says "continuous" and "should not pop." The PRD's §"Failure Conditions" lists "viewport still jumps" as automatic failure. A single-frame snap at the Y-boundary wrap IS a jump, even if localized to the screen edge. The plan's risk table further documents the snap as a "single frame event," which is the exact "popping" the PRD forbids.
- **Recommendation:** Two options: (a) extend the implementation to handle wrap. A 200ms punch-through animation that briefly shows two laps superimposed would be PRD-compliant (the player sees the new course "arrive" instead of "snap"). (b) Update the PRD to explicitly accept the snap with rationale. Option (b) is faster but requires product-owner sign-off — flag this as a clarification, not an implementer decision. As written, the plan and PRD are inconsistent; implementation would either fail the PRD's acceptance criteria or require a mid-implementation PRD change.

## Finding 4 — Phase 3 duplicates the effective-speed calculation (Phase 3)

- **Severity:** High
- **Description:** Phase 1 refactors the Engine's internal speed calc into a private `getEffectiveSpeed()`. Phase 3 then has RunnerGame mirror that math:
  ```tsx
  let effectiveSpeed = Math.max(80, 200 - Math.floor(state.distance / 50) * 2);
  effectiveSpeed = Math.round(effectiveSpeed / 1.0);
  ```
  This violates DRY and is a maintenance liability (a future speed-curve change must be made in two places). The plan's own Option A "Verdict" says "Strong candidate. Simple enough to implement and validate in one session" — the duplication adds complexity that "simple" does not justify.
- **Recommendation:** Expose `getEffectiveSpeed()` (or a public `getTickInterval()` returning the ms value) and have RunnerGame call it. The cost is one extra public method on Engine and the loss of the "private" encapsulation — acceptable for a 1-method, 5-line utility. Alternatively, snapshot the value into `GameState` on each tick (the reducer adds `currentTickInterval: number` to the state), but this is more invasive.

## Finding 5 — Phase 3 `useEffect` lacks test infrastructure and StrictMode note (Phase 3)

- **Severity:** High
- **Description:** Phase 3 creates a new test file `src/components/__tests__/RunnerGame.test.tsx` and 4 tests for animation behavior. The file does not exist today. The plan does not mention: (a) what mocks are needed (useGame, useTouch, sharedSoundManager — none of these are imported by the existing component test files, so there's no direct template), (b) how to assert animation restart in jsdom (jsdom does not replay CSS animation timing), (c) React 19 StrictMode (`src/main.tsx:21`) will double-invoke effects in dev, potentially affecting the animation restart on first mount.
- **Recommendation:** Add a "test scaffolding" sub-step to Phase 3: "Mock useGame to return a deterministic state object; mock useTouch to no-op; mock sharedSoundManager to silence audio. Use `data-testid` attributes on the inner div for queryability." Add a "StrictMode" note documenting that the animation useEffect fires twice on mount in dev (acceptable behavior, no flicker observed). For animation-restart testing, the most useful assertion is "the animation class is added to the inner div when state.snake[0].y changes" — not "the animation plays from frame 0 to frame N."

## Finding 6 — Validation directory name and `.gitignore` deviate from established pattern (Phase 5a)

- **Severity:** High
- **Description:** The plan says: "Store recordings in `docs/recordings/` (add `.gitignore` rules for video files)." The established pattern is milestone-specific: M13.5 uses `docs/Milestone 13_5_validation/recordings/`, M14 uses `docs/Milestone 14-validation/recordings/`. Both are already in `.gitignore` (lines 32-39). The plan's `docs/recordings/` is a new, generic, non-milestone-scoped directory. The plan also does not show the exact `.gitignore` entries to add.
- **Recommendation:** Use `docs/Milestone 14.1-validation/recordings/` (matching the PRD's underscore convention; PRD §"Validation Requirements" uses this form). Add to `.gitignore`:
  ```
  docs/Milestone 14.1-validation/recordings/*.webm
  docs/Milestone 14.1-validation/recordings/*.mp4
  docs/Milestone 14.1-validation/recordings/*.mov
  ```
  Document in a README.md inside the directory that recordings are stored externally (Google Drive, GitHub Releases, etc.) and only the directory structure and notes are committed.

## Finding 7 — Phase 2 test list duplicates existing tests (Phase 2)

- **Severity:** Medium
- **Description:** Phase 2's test list includes "`data-viewport-scrolling` attribute set correctly" and "Runner mode viewport still renders 400 cells" as new tests. Both are already in `src/components/__tests__/Board.test.tsx` (lines 71-75 and 43-46 respectively). The plan should re-cite existing tests rather than list them as new work.
- **Recommendation:** Replace the duplicate entries with a regression test specifically for the new inner wrapper: "inner wrapper contains all 400 cells as direct children" (asserts the new wrapper is the grid container). This is the test that catches Finding 1's layout bug.

## Finding 8 — Phase 2 layout doesn't address the height inheritance (Phase 2)

- **Severity:** Medium
- **Description:** The CSS example shows `.boardInner { width: 100%; height: 100%; }`. The plan does not address: (a) the inner div must be a block element (not `display: contents` if the goal is to apply a transform), (b) the inner div must have a definite height for `translateY(-5%)` to equal one cell height. `height: 100%` works only if the parent has a definite height, which `.board` does (via `aspect-ratio: 1/1` and `height: 100%`). This is correct as written, but the plan should be explicit.
- **Recommendation:** Add a comment in `Board.module.css`:
  ```css
  .boardInner {
    display: grid;  /* grid container for 400 cells; .board is positioning container */
    width: 100%;
    height: 100%;
    /* transform: translateY(-5%) on .boardAnimated is 5% of THIS element's height = 1 cell */
  }
  ```

## Finding 9 — Phase 2 snapshot test will fail against pre-change baseline (Phase 2)

- **Severity:** Medium
- **Description:** The plan's test list includes "Snapshot: classic mode rendering unchanged." A snapshot test compares against a stored baseline. The baseline must be regenerated after Phase 2 (the new inner wrapper adds an extra DOM element). The plan does not mention regenerating the snapshot. If the implementer runs the test against a pre-change baseline, it will fail; if they regenerate without verifying the only change is the wrapper, they may accept an unintended change.
- **Recommendation:** Either: (a) regenerate the snapshot as part of Phase 2 and add a "diff must be limited to the new wrapper" review step, or (b) replace the snapshot with a structural assertion: "classic mode renders one board > one inner wrapper > 400 cells, with no other DOM changes compared to the pre-change structure." Option (b) is more rigorous.

## Finding 10 — SPEC.md section number for the new content is incorrect (Phase 5e)

- **Severity:** Medium
- **Description:** The plan says "Update SPEC.md §20.11 to document smooth viewport scrolling via CSS animation." §20.11 is currently "Viewport Scrolling" — a different topic (the screen-row mapping in Board.tsx). Adding the smoothing content to §20.11 will overwrite the existing viewport description. The smoothing content is a new topic and belongs in a new sub-section.
- **Recommendation:** Add the new content as a new sub-section, e.g., §20.14 "Smooth Viewport Scrolling" (after §20.13 "Milestone Celebration") or renumber §20.11 to keep the viewport transform and add a new "20.11.1 Smooth Motion" sub-section. ARCHITECTURE.md's plan to add "Smooth Runner Motion" as a new sub-section (not modifying "Runner Viewport Scrolling") is the correct pattern.

## Finding 11 — Phase 3's animation restart technique is undocumented and not committed (Phase 3)

- **Severity:** Medium
- **Description:** Phase 3's animation restart uses the `void el.offsetWidth` reflow trick. The plan's risk table mentions this and offers rAF double-buffer as a fallback if flicker is observed, but does not commit to either or include a test for the chosen mechanism. jsdom cannot replay CSS animation timing, so the "restart" behavior must be tested via DOM observation (class added, then removed, then added again) rather than visual outcome.
- **Recommendation:** Pick one mechanism in the plan. Recommend `void el.offsetWidth` for simplicity (it's a one-line, well-understood trick). Add a one-line code comment explaining the choice. Add a test asserting "on tick, the animation class is removed and re-added to the inner div" — this is the closest jsdom-friendly approximation of "the animation restarts."

## Finding 12 — Phase 3's two-`useEffect` structure is awkward (Phase 3)

- **Severity:** Medium
- **Description:** Phase 3 shows one useEffect for animation restart (deps: `[state.snake[0]?.y, state.distance, state.isRunner, state.status]`) and a separate useEffect for tracking `prevHeadY` via a `useRef`. The two effects overlap in their concern (both watch `state.snake[0]?.y`) and are split for unclear reasons. Two effects on the same dep array are harder to reason about and may fire in unexpected orders under React 18+'s automatic batching.
- **Recommendation:** Combine into a single useEffect. Track `prevHeadY.current` inline before the wrap-detection early-return:
  ```tsx
  useEffect(() => {
    if (!state.isRunner || state.status !== 'playing') return;
    const currentY = state.snake[0]?.y ?? 10;
    const delta = Math.abs(currentY - prevHeadY.current);
    prevHeadY.current = currentY;
    if (delta > 1) return; // wrap: skip animation
    // ... rest of animation restart logic
  }, [state.snake[0]?.y, state.isRunner, state.status]);
  ```
  This is more readable and harder to get wrong.

## Finding 13 — Phase 4d's "Classic Mode Unchanged" claim is partially incorrect (Phase 4d)

- **Severity:** Low
- **Description:** Phase 4d says: "Classic mode Board has no inner wrapper change (the inner div can always be present but the animation class is conditional)." The inner wrapper is added unconditionally in Phase 2's JSX. Classic mode gains an extra DOM element. The plan should be honest about this.
- **Recommendation:** Update the text: "Classic mode Board has a new inner wrapper div (one extra DOM level), but the animation class is not added. Visual layout is byte-identical to pre-change behavior; the new wrapper has no visible effect." Regenerate the Phase 2 snapshot accordingly.

## Finding 14 — Plan does not bump the package.json version (Phase 5e)

- **Severity:** Low
- **Description:** `docs/PROJECT_STATE.md:5` declares the current version as `v0.14.0`. `package.json:4` is stale at `0.13.1` (pre-existing drift from M13.1's bump being applied only to PROJECT_STATE). The plan's Definition of Done lists documentation updates but not a version bump.
- **Recommendation:** Specify a version bump in Phase 5e. For a "V2" patch, `0.14.1` is appropriate. For a feature-significant milestone, `0.15.0` is appropriate. The plan should commit to one. Resolve the pre-existing PROJECT_STATE vs package.json drift in the same change.

## Finding 15 — Plan does not address `--viewport-speed` interaction with lane-change animations (Phase 4a)

- **Severity:** Low
- **Description:** Phase 4a correctly notes that the lane-change animation (150ms, on `.laneSlidingLeft`/`.laneSlidingRight` cell classes) and the viewport animation (200ms-ish, on the inner div) are on different elements and should compose via the browser compositor. But the plan does not address what happens if a lane change occurs at t=150ms during a viewport tick. The two `transform`s are on different elements, so they compose without conflict, but the visual result depends on timing. This is a small product detail worth being explicit about.
- **Recommendation:** Add a manual test to Phase 5d: "Change lane at t=100ms during a viewport tick — both animations play concurrently; cell slides while viewport scrolls. No visual conflict." This is what Phase 5d #6 already tests, but the plan should call out the expected concurrent animation as the product intent.

## Finding 16 — No `prefers-reduced-motion` accessibility consideration (Phase 4b)

- **Severity:** Low
- **Description:** The plan's mobile-degradation concern (Phase 4b implicitly, Risk table) is "if issues, fallback to no animation on mobile." A more standard a11y practice is to respect `prefers-reduced-motion: reduce` and disable the animation for users who set this preference. This is a one-line addition to the keyframes.
- **Recommendation:** Add to `Board.module.css`:
  ```css
  @media (prefers-reduced-motion: reduce) {
    .boardAnimated { animation: none; }
  }
  ```
  Document in the plan as an a11y consideration, not just a mobile fallback.

## Finding 17 — Plan lacks a "Verify animation visually" step in the test sequence (Phase 5d)

- **Severity:** Low
- **Description:** The plan's automated tests (Phase 1, 2, 3) verify state, not motion. The visual judgment (smoothness, glides, no popping) is the PRD's §"AI Review Questions" (5b) and requires manual recording review. The plan should be explicit that automated tests are state verification, and the visual judgment is the recording review.
- **Recommendation:** Add a one-line note in the Definition of Done: "Automated tests verify state transitions; visual smoothness is verified by Phase 5a/b recording review (PRD §'AI Review Questions')."

## Finding 18 — Plan's "Estimated total LOC" is optimistic (Phase 5 summary)

- **Severity:** Low
- **Description:** The plan's §"File Change Summary" says "Estimated total LOC: ~150 added (80 code + 70 tests)." This is the implementation estimate and does not include: (a) the test scaffolding for the new `RunnerGame.test.tsx` file (mocks for useGame, useTouch, sharedSoundManager — estimate 30-50 lines), (b) the documentation updates (4 documents, 1-2 paragraphs each — estimate 50-100 lines of markdown), (c) the recording capture and review (not LOC, but a non-trivial time investment). A more honest estimate is ~200-250 LOC plus 30-60 minutes of validation work.
- **Recommendation:** Update the estimate or note that "80 code + 70 tests" is implementation-only and does not include docs/validation.

---

# Handoff Assessment

## Phase structure

**Verdict:** Mostly sound, with one Critical layout issue and one Critical PRD conflict.

The 5-phase structure (Engine → Board → RunnerGame → Refinement → Validation) is logical and dependency-ordered. Each phase has independent verification. The dependency graph (1 → 2 → 3, 4; 5 after all) is correct. The major structural issues are not in the phase ordering but in the implementation details of Phases 1, 2, and 3 (see Findings 1-4).

The plan correctly defers optional polish (sub-pixel rendering, per-cell interpolation, canvas) to the "Out of Scope" section. The "Definition of Done" at the milestone level is comprehensive and matches the M14 plan's structure (which the M14 review praised).

## Task decomposition

**Verdict:** Good at the phase level, weak at the per-task level.

Each phase has 3-5 sub-tasks with file-level specificity, which is the right granularity. The issues are within the sub-tasks:
- Phase 1's "Add `getTickProgress()`" sub-task is unnecessary (Finding 2).
- Phase 2's "Add inner wrapper div" sub-task is under-specified (Finding 1).
- Phase 3's "Wire animation timing" sub-task is over-complex (Finding 12) and duplicates Engine logic (Finding 4).

A senior-engineer-grade plan should be implementable by another AI agent with minimal re-derivation. The current plan requires the implementer to: (a) resolve the layout contradiction, (b) decide what to do with `getTickProgress`, (c) decide how to handle the wrap transition, (d) figure out the test mocking patterns. These are exactly the decisions a plan should make.

## Verification strategy

**Verdict:** Adequate for state verification, weak for visual verification.

The verification commands (`npm test -- <file>`, `npx tsc --noEmit`, `npm run lint`, `npm run build`) are correct and match the project's existing scripts (`package.json:7-12`). The Phase 5d manual tests (play, pause, resume, die, classic mode, lane change) are the right shape for a presentation milestone.

The weak spot is the gap between "all tests pass" and "the game no longer appears to run at 5 FPS." The PRD's §"AI Review Questions" (5b) is the right bridge (manual review of recordings), but the plan should be explicit that the automated tests are necessary-but-not-sufficient. The Definition of Done should distinguish "all automated tests pass" from "the visual review passes" — the former is a precondition for the latter, not a substitute.

## Definition of Done

**Verdict:** Comprehensive but with two gaps.

The DoD covers: 5 phase-level items, 4 test/build items, 4 documentation items, AI review questions, and the exit question. This is the right level of rigor for a milestone.

Gaps:
1. **No version bump.** The DoD lists documentation updates but not a package.json version bump. See Finding 14.
2. **No `prefers-reduced-motion` or other a11y verification.** The plan does not check accessibility. See Finding 16.

The DoD is otherwise complete. The acceptance criteria mirror the PRD's "Acceptance Criteria" section, which is correct.

## AI-agent execution readiness

**Verdict:** Not yet ready for handoff.

An AI implementer following this plan would:
- Implement Phase 1's `getTickProgress` and 6 tests, but Phase 3 wouldn't use it (inconsistency).
- Implement Phase 2's inner wrapper, but the layout would be broken (`display: contents` vs `display: grid` contradiction).
- Implement Phase 3's animation restart, but the speed calculation would be duplicated.
- Create `src/components/__tests__/RunnerGame.test.tsx` from scratch, with no mocking template to follow.
- Document the wrap snap in Phase 5e, but the PRD would still say "continuous."

Each of these is a blocker for clean handoff. The plan needs the Required Changes (1-6) applied before it can be handed off to another AI agent with confidence.

**Recommendation:** Apply Required Changes 1-6 and re-review. The Recommended Changes (7-13) are non-blocking but should be applied for quality. The Optional Changes (14-18) are nice-to-have.

---

# Cross-Validation Notes (Second Reviewer)

A parallel review was conducted by another AI reviewer (referred to as "DeepSeek" in their output). The reviewer reached the same overall verdict — **APPROVE WITH REQUIRED CHANGES** — but raised several concerns that are orthogonal or supplementary to the Staff Engineer review above. This section integrates the second reviewer's findings, mapping them to existing Findings where they overlap and adding net-new findings where they do not.

## Overlap with Existing Findings

| Second Reviewer Concern | Mapped To | Notes |
|---|---|---|
| Required Change 2: `getTickProgress()` contradiction | Finding 2 (Critical) | Direct duplicate. Same recommendation: drop the method or use it. |
| Required Change 4: Wrap-around validation missing | Finding 3 (Critical) | Same root cause (plan accepts a snap; PRD requires continuous). The second reviewer emphasizes that wrap is one of the areas the investigation flagged as visually inconsistent. |
| Required Change 6: Motion quality validation missing | Finding 17 (Low) | Second reviewer is more specific: frame-by-frame inspection of three consecutive frames. |

## Net-New Concerns From The Second Reviewer

The second reviewer surfaces several concerns that the Staff Engineer review either missed or under-emphasized. They are restated here as Findings 19-25.

### Finding 19 — Plan does not explicitly prove continuous position evolution (Required Change 1)

- **Severity:** High
- **Description:** The plan describes a CSS animation that restarts on each tick, but does not walk through the position math. The implementation description is, in sequence: "tick occurs → Board re-renders → animation starts → tick occurs → Board re-renders → animation starts." This is animation *restart*, not interpolation *proof*. The PRD's problem is that obstacle positions update discretely every 200ms. The plan must demonstrate that the implementation produces continuous visual positions between logical updates — e.g., for a single obstacle at logical y=5 with a 200ms tick, what is the visual position at t=0, t=50ms, t=100ms, t=150ms, t=200ms? The current plan's text does not show this calculation.
- **Recommendation:** Add a new "Motion Model Validation" sub-section to the plan that explicitly shows:
  - logical position (y values from state.snake[0].y / state.obstacles[i].y)
  - visual position (computed as `logical - (1 - animation_progress) * cell_height`, or equivalent)
  - interpolated position (the browser-computed transform at sample time points)

  for a sample obstacle over a complete tick interval. The math should make it clear that the visual position evolves continuously between -5% (one cell up) and 0% (at logical position) over the tick duration. Without this, the plan's claim that the result "appears continuous" is asserted but not demonstrated.

  *Reviewer note: The CSS animation is in fact the interpolation mechanism — the browser's keyframe engine interpolates `transform: translateY(-5%)` to `transform: translateY(0)` linearly over the duration, producing intermediate values like -4.3%, -3.1%, -1.8%, -0.5%. The plan should make this connection explicit so a future reader does not assume the implementation is "just restarting a visual effect."*

### Finding 20 — Forced reflow (`void el.offsetWidth`) technique deserves a deeper evaluation (Required Change 3)

- **Severity:** Medium
- **Description:** The plan restarts CSS animations using `element.classList.remove(...) ; void element.offsetWidth ; element.classList.add(...)`. This forces a synchronous browser layout calculation. At runner speeds (5-12 ticks/second), this occurs 5-12 times per second, which is unlikely to cause measurable performance issues, but it is browser-dependent behavior with known quirks (e.g., forced reflow during a paint cycle can cause warnings in some browsers, behavior differs between Chrome/Firefox/Safari). The plan's risk table mentions rAF double-buffer as a fallback but does not investigate other approaches.
- **Recommendation:** Investigate two alternative approaches before committing to forced reflow:
  1. **`animation-iteration-count: 1` + key update via inline `style.animation`:** Set the animation via the `style` attribute using a unique animation name per tick (e.g., `animation: viewportScroll-${tickId} 200ms linear`). Each new tickId triggers a fresh animation without forcing reflow. Tradeoff: more DOM thrash, but no reflow.
  2. **`Element.animate()` Web Animations API:** Use the JavaScript Web Animations API to start a new `Animation` object on each tick. The API is designed for this use case and does not require reflow. Tradeoff: requires more JS code (~5-10 LOC) but cleaner.

  If neither alternative is suitable, document the rejection with a one-paragraph rationale in the plan. The current plan's "or use rAF double-buffer" mention is hand-wavy.

### Finding 21 — Wrap-around visual continuity must be empirically validated, not just acknowledged (Required Change 4)

- **Severity:** High
- **Description:** The plan accepts the wrap-around snap as a known limitation and notes that it occurs at the screen edge. The PRD §"Wrap Transition Requirements" forbids "visible mutation, visible replacement, visible popping" — a single-frame snap is exactly that. The plan's risk table further characterizes it as a "single frame event" without quantifying it. The investigation identified wrap behavior as a contributor to perceived visual inconsistency, which is exactly what this milestone is supposed to fix. The plan should not accept the snap on the basis that it "occurs at the screen edge" without empirical validation.
- **Recommendation:** Add a dedicated validation step to Phase 5:
  - Capture a 60-second recording that includes at least 2-3 wrap transitions.
  - Frame-by-frame review of the wrap frame and the 2 frames before/after.
  - Review question: "Does the wrap transition appear visually continuous to a casual observer?"
  - If the answer is NO, the milestone is incomplete regardless of whether the implementation matches the spec.

  This converts the plan's "acceptable per PRD's 'appear continuous' threshold" rationalization into a testable claim. If the empirical result is acceptable, the plan is correct; if not, the wrap handling needs implementation work or PRD sign-off.

### Finding 22 — Add a mid-milestone checkpoint to validate the approach (Required Change 5)

- **Severity:** High
- **Description:** The plan proceeds through all five implementation phases (Engine → Board → RunnerGame → Refinement → Validation) before evaluating whether the chosen approach actually solves the original problem. If the CSS animation approach turns out to be insufficient — e.g., the visual result is still choppy, the wrap snap is unacceptable, the browser compositor behaves unexpectedly — the entire milestone must be backed out and re-planned. This is high-risk because the validation (Phase 5) is at the end.
- **Recommendation:** Add a checkpoint after Phase 2 (Board viewport animation) and before Phase 3 (RunnerGame wiring). The checkpoint should:
  1. Implement Phase 1 + Phase 2 only (engine getter + board inner wrapper with hardcoded animation).
  2. Wire just enough of Phase 3 to verify the animation runs (e.g., always-on animation, no tick detection).
  3. Capture a 30-second gameplay recording.
  4. Ask the project owner the exit question: "Does the game still appear to run at 5 FPS?"
  5. If YES, pause the milestone, do not proceed to Phase 3, reassess the motion strategy.
  6. If NO (game looks smoother), proceed to Phase 3 with confidence.

  This adds ~1-2 hours of work but materially de-risks the milestone. Without it, the team invests 4-8 hours in Phases 3-5 only to discover the approach is wrong at the very end.

### Finding 23 — Add frame-by-frame motion quality validation as an acceptance gate (Required Change 6)

- **Severity:** High
- **Description:** The plan validates implementation details (tests pass, lint clean, tsc clean) but does not directly validate the symptom the milestone exists to fix: "the game looks like it is running at 5 FPS." The PRD's §"AI Review Questions" (5b) asks 7 questions about smoothness, but they are subjective (yes/no per question). The plan should validate the symptom with a concrete, frame-by-frame inspection.
- **Recommendation:** Add to Phase 5:
  - Capture a 30-second recording at a stable point in the run (e.g., 50-100 ticks in, no food eaten to avoid state churn).
  - Extract 3 consecutive frames at 16ms intervals (a typical browser frame).
  - For each consecutive pair, measure: "What is the screen-space delta of a reference obstacle?"
  - If the deltas are non-zero and consistent, motion is continuous. If the deltas are mostly zero with occasional jumps, motion is still discrete.

  This is implementable in a few minutes with standard video tools (ffmpeg, OBS) and gives an objective answer to "does the symptom persist?" The PRD's exit question ("Does the game still appear to run at 5 FPS?") becomes answerable with evidence.

### Finding 24 — Plan conflates "animation" with "interpolation" (Required Change 7)

- **Severity:** Medium
- **Description:** The plan uses the terms "animation" and "interpolation" near-interchangeably. They are not the same:
  - **Animation:** a visual effect, typically time-based, that may or may not reflect underlying state.
  - **Interpolation:** the calculation of intermediate values between two known states.

  The milestone exists to solve interpolation perception — the player perceives discrete position updates as choppy. The plan's implementation uses CSS animation as the interpolation mechanism, but the plan's text does not make this connection explicit. A future reader might think the milestone is "adding an animation effect" rather than "interpolating positions between logical updates."
- **Recommendation:** Add a "Terminology Clarification" sub-section to the plan that explicitly states:
  - The PRD problem is interpolation perception.
  - The implementation uses CSS animation as the interpolation mechanism.
  - Visual position at any time `t` is: `visual_y = logical_y - (1 - animation_progress(t)) * cell_height`, where `animation_progress(t)` is a value in [0, 1] computed by the browser from the keyframe interpolation.
  - The milestone succeeds when the visual position evolves continuously (linearly, in the keyframe's case) between logical updates.

  This costs 2-3 paragraphs and ensures the plan's intent is unambiguous.

### Finding 25 — "Strong Parts of the Plan" (second reviewer) — additional agreement

- **Severity:** N/A (positive finding)
- **Description:** The second reviewer's "Strong Parts" section calls out three areas where the plan is correct: (a) the architecture comparison, (b) scope control (no gameplay changes), (c) investigation alignment (presentation, not performance), (d) avoiding engine rewrites. These are the same strengths the Staff Engineer review identified in the "Strengths" section. The convergence of two independent reviews on the same strengths increases confidence in the plan's overall direction.
- **Recommendation:** No action. This is positive cross-validation.

## Cross-Validation Questions For The Revised Plan

The second reviewer also surfaced six questions that the revised plan should answer before implementation begins:

1. **Is CSS animation replay actually interpolation?** Yes, when the animation is the interpolation mechanism (the browser computes intermediate keyframe values). The plan should make this connection explicit (see Finding 24).

2. **Why is `getTickProgress()` required?** It is not. The plan should drop it or use it (see Finding 2).

3. **Can animation restart occur without forced reflow?** Possibly, via Web Animations API or unique animation names per tick. The plan should investigate (see Finding 20).

4. **How will wrap-around transitions be validated?** Through a dedicated recording review step (see Finding 21).

5. **How does obstacle position evolve between logical ticks?** Through the CSS animation's linear interpolation of `transform: translateY()`. The plan should demonstrate this with a worked example (see Finding 19).

6. **What evidence proves that movement no longer appears to run at 5 FPS?** Frame-by-frame delta measurement of a 30-second recording (see Finding 23).

## Revised Final Recommendation

**Approve with Major Changes** (unchanged from the Staff Engineer review, with the second reviewer's findings integrated).

The plan's overall approach — a CSS animation on a board-internal wrapper — is correct, well-justified, and aligned with the codebase's existing patterns. The architecture comparison is unusually honest. The risk register is mostly well-calibrated. The PRD alignment is good in spirit. The second reviewer's parallel assessment reached the same conclusion.

The plan is not yet ready for handoff because:

**Critical blockers (must resolve):**
1. **Phase 2's layout bug** (Finding 1) — `display: contents` vs `display: grid` contradiction + existing inline grid on `.board` will break the board on first run.
2. **`getTickProgress` is dead code** (Finding 2 / second reviewer Required Change 2) — 6 tests and a public method for a feature that no production code reads.
3. **The wrap transition contradicts the PRD** (Finding 3 / second reviewer Required Change 4) — the plan's "snap" implementation does not satisfy the PRD's "continuous" requirement, and the snap has not been empirically validated.
4. **Phase 3 duplicates the speed calculation** (Finding 4) that Phase 1 just refactored.
5. **The plan does not explicitly prove continuous position evolution** (Finding 19 / second reviewer Required Change 1) — the implementation description shows animation restart, not position math.
6. **The plan lacks a mid-milestone checkpoint** (Finding 22 / second reviewer Required Change 5) — the team invests 4-8 hours before discovering if the approach actually works.

**High-priority gaps (should resolve):**
7. **Test plan has structural gaps** (Finding 5): no mocking template, no StrictMode note, no animation-restart test strategy for jsdom.
8. **Forced reflow technique not evaluated** (Finding 20 / second reviewer Required Change 3) — `void el.offsetWidth` works but alternatives exist; the plan should investigate or document the rejection.
9. **Frame-by-frame motion quality validation missing** (Finding 23 / second reviewer Required Change 6) — the PRD's exit question is subjective; a concrete measurement method is needed.
10. **Wrap-around snap lacks empirical validation** (Finding 21 / second reviewer Required Change 4) — the plan accepts the snap on theoretical grounds; a recording review is needed.
11. **Documentation paths and SPEC.md sections** (Findings 6, 10) deviate from established patterns.

**Medium / Low items (improve quality):**
12. Plan conflates "animation" with "interpolation" (Finding 24 / second reviewer Required Change 7) — terminology clarification needed.
13. Snapshot test will fail against pre-change baseline (Finding 9).
14. SPEC.md section number for the new content is incorrect (Finding 10).
15. Phase 4d's "Classic Mode Unchanged" claim is partially incorrect (Finding 13).
16. No version bump in Definition of Done (Finding 14).
17. `prefers-reduced-motion` accessibility consideration missing (Finding 16).
18. Phase 3's two-`useEffect` structure is awkward (Finding 12).
19. Phase 2 test list duplicates existing tests (Finding 7).
20. Plan's "Estimated total LOC" is optimistic (Finding 18).

These are real blockers, not polish. The plan's approach is sound, but the implementation details, the validation strategy, and the empirical evidence for "motion is continuous" all need resolution before another agent can pick it up.

**Suggested next steps:**

1. Apply the Critical blockers (1-6) to `plans/ACTIVE.md` as targeted edits, not a full rewrite.
2. Resolve the PRD wrap conflict (option a: implement punch-through; option b: PRD update with product-owner sign-off + empirical recording review).
3. Add a "Motion Model Validation" sub-section with explicit position math (Finding 19).
4. Add a mid-milestone checkpoint after Phase 2 (Finding 22).
5. Add frame-by-frame motion quality validation to Phase 5 (Finding 23).
6. Re-review the updated plan against this review's Findings 7-25.
7. Once the Critical blockers and High-priority gaps are applied, the plan can be handed off with confidence. The Medium / Low items can be applied during implementation or in a follow-up review.

**Favor simplicity:** The plan is mostly simple (CSS animation, ~80 LOC implementation). The Critical blockers preserve this simplicity. The High-priority gaps (checkpoint, motion math, frame validation) add documentation and process work but do not bloat the implementation. The Medium / Low items (terminology, snapshot, version bump) are pure quality improvements.

**Repository alignment:** The plan aligns with AGENTS.md §"Development Philosophy" (small changes, simple solutions, maintainable code, playable progress), §"Technology Direction" (React + TypeScript + Vite, CSS Modules, no new frameworks), and §"Documentation Rules" (SPEC.md for behavior, ARCHITECTURE.md for code structure, PROJECT_STATE.md for status, ROADMAP.md for direction). The gaps are in the per-phase implementation details, the validation strategy, and the empirical evidence for the milestone's success criteria.

**Reviewer convergence:** Two independent reviewers (Staff Engineer + second AI reviewer) reached the same verdict: **Approve with Major Changes.** The two reviews overlap on the critical blockers (layout bug, dead `getTickProgress`, PRD wrap conflict, speed calc duplication) and complement each other on the validation strategy (motion math, mid-milestone checkpoint, frame-by-frame measurement). The convergence increases confidence in the verdict.
