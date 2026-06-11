# Implementation Review: Milestone 13 — Runner Prototype Validation

**Reviewer:** Staff Engineer (Implementation Review)
**Milestone under review:** M13 — Runner Prototype Validation (Phases 1–7)
**Source documents:** `plans/ACTIVE.md`, `AGENTS.md`, `docs/ROADMAP.md`, `ARCHITECTURE.md`, `SPEC.md`, `docs/PROJECT_STATE.md`, `package.json`, prior `reviews/IMPLEMENTATION_REVIEW.md` (M12), `plans/PLAN_REVIEW.md`
**Implementation files reviewed (new):** `src/game/runnerCourse.ts`, `src/components/RunnerGame.{tsx,module.css}`, `src/components/RunnerHUD.{tsx,module.css}`, `src/components/RunnerGameOver.{tsx,module.css}`
**Implementation files reviewed (modified):** `src/game/types.ts`, `src/game/constants.ts`, `src/game/state.ts`, `src/game/Engine.ts`, `src/game/food.ts`, `src/hooks/useGame.ts`, `src/types/navigation.ts`, `src/App.tsx`, `src/components/MainMenu.{tsx,module.css}`, `src/components/__tests__/MainMenu.test.tsx`, `src/components/__tests__/Game.test.tsx`, `src/game/__tests__/state.test.ts`, `src/game/__tests__/achievements.test.ts`, `SPEC.md`, `ARCHITECTURE.md`, `docs/ROADMAP.md`, `docs/PROJECT_STATE.md`, `package.json`
**Verification commands run:** `npm test` (415/415 pass, 26 test files, 0 failures on second run; transient 1-test PWA flake on first run), `npm run lint` (clean, 0 errors/warnings), `npm run build` (success, 244.59 kB JS / 74.35 kB gz, 33.14 kB CSS / 5.43 kB gz, PWA precache 8 entries / 283.19 KiB)
**Review date:** 2026-06-10
**Branch under review:** Working tree on `main`, M13 changes uncommitted

---

# Executive Summary

## Overall Assessment

**Reject (block on a single high-severity testing gap; otherwise Approve with Minor Changes).** The M13 implementation is a near-flawless execution of `plans/ACTIVE.md:1-890`. Every new file described in the plan exists, every modified file follows the plan's intent, the architecture decisions (inline keyboard in `RunnerGame`, separate `RunnerGame` component, `isRunner` flag mirroring the `isEndless` pattern, `markGameOver` reuse, Runner Mode button placement) are all implemented exactly as the plan and its `PLAN_REVIEW.md` pre-approval recommended. Build, lint, and the full test suite all pass cleanly.

However, the test suite grew by **exactly 1 test** for the entire milestone, and the runner implementation has **no automated coverage** of any of the behavior the plan promised to verify:

- `src/game/__tests__/state.test.ts` has no tests for `START_RUNNER`, `CHANGE_LANE`, or the runner `MOVE_SNAKE` short-circuit.
- `src/game/__tests__/Engine.test.ts` has no tests for `startRunner()`, `changeLane()`, or the runner speed curve.
- The plan-required test files `runnerCourse.test.ts`, `RunnerHUD.test.tsx`, `RunnerGameOver.test.tsx`, and `RunnerGame.test.tsx` were **never created**.

The plan explicitly listed 4 new test files and per-phase acceptance criteria that depend on those tests (`plans/ACTIVE.md:268-280, 335-338, 410-422, 482-485, 649-653`). The only new test added is a single click handler in `MainMenu.test.tsx:81-87` ("calls onStartRunner when Runner Mode is clicked"). The 415-test count is technically correct, but it is **misleading**: the 1 new test exercises a navigation callback, not any of the runner gameplay, reducer logic, course generation, or component rendering that constitutes the actual M13 deliverable.

This is a high-severity gap because:

1. **The validation question cannot be answered without working code.** The plan's success criterion is "team can evaluate whether the base runner loop is engaging" (`plans/ACTIVE.md:797`). Working code without tests could be broken in subtle ways (e.g., the `MOVE_SNAKE` runner branch never re-spawns food on collision) that the test suite would catch.
2. **The plan's own DoD requires it.** Phase 7 DoD includes "All tests pass (existing 414 + new)" (`plans/ACTIVE.md:790`). The "+new" was meant to be runner-specific test coverage.
3. **`runnerCourse` is non-deterministic** (uses `Math.random()`) but has zero tests. The plan's Phase 3 acceptance criteria are stated as testable properties ("Every row has at least one clear lane", "Food is `'normal'` type", "Pattern count and density increase with distance") that can only be verified by tests.

Beyond the testing gap, the implementation is in good shape. The architectural posture of the project is preserved: no new dependencies, no new platform strategy, no replacement of existing frameworks. The `runner` screen is integrated cleanly into the existing `Screen` union. The `RunnerGame` correctly uses the centralized `useGame` hook with all audio wiring inherited from M12. The plan's pre-approval recommendations from `plans/PLAN_REVIEW.md` (call `markGameOver` from the runner branch, place the Runner Mode button after the divider always-visible, commit to "415 up from 414" test count, etc.) are all honored.

The remaining findings below are advisory: two `RUNNER_*` constants not re-exported from the barrel, a minor visual concern with the runner board not setting the `wrapAround` data attribute, a small dead-code/readability note about the inline keyboard handler's `hasStarted || gameover` predicate, and one stale SPEC section reference. None of these are scope creep; all are minor polish.

## Major Strengths

1. **Plan fidelity is high across all seven phases.** Every file described in `plans/ACTIVE.md:79-116` exists in the working tree. Phase 1 (state types, constants, reducer logic, food forceType), Phase 2 (Engine `startRunner`/`changeLane`/speed curve), Phase 3 (`runnerCourse.ts`), Phase 4 (HUD + GameOver), Phase 5 (`RunnerGame` orchestrator), Phase 6 (MainMenu button + Screen routing), and Phase 7 (docs + version bump) are all present and on-plan. The implementation also honors every pre-approval recommendation in `plans/PLAN_REVIEW.md` (F-3 `markGameOver` reuse, F-4 button placement, F-5 fallback to `lastUnlockedLevel` preservation, F-9 flakiness non-issue, F-12 visual hint, F-15 button styling).

2. **The `isRunner` flag pattern is the right size for two modes.** `src/game/types.ts:43-45` adds `isRunner`, `distance`, `lane` to `GameState`, mirroring the existing `isEndless` pattern from M9. `src/game/state.ts:104-152` adds the runner short-circuit at the top of `MOVE_SNAKE` (returns early before level-based logic), and `src/game/Engine.ts:247-256` adds the runner speed branch at the top of the tick. The same pattern is used in `Engine.dispatch` (`Engine.ts:49`) for the games-played counter. The implementation does not over-generalize: there is no polymorphic dispatch, no per-mode engine class, no plugin system — just a flag and an early-return. This is the smallest possible change and matches the plan's "current pattern is appropriate for M13 but a polymorphic dispatch or per-mode engine would be considered if the mode count exceeds 3" note in `plans/PLAN_REVIEW.md:56`.

3. **The `RunnerGame` component is genuinely small and decoupled.** `src/components/RunnerGame.tsx` is 125 lines, including imports, CSS module class strings, and the inline keyboard handler. The handler is a single `useEffect` with a `keydown` listener on `window`, exactly as the plan recommended (inline rather than modifying the shared `platform/keyboard.ts`). `useTouch` is reused with a 2-line filter to LEFT/RIGHT. The `Board` and `useGame` are reused without modification. This is the right size for a prototype orchestrator.

4. **`markGameOver` is correctly reused.** `src/game/state.ts:113` and `:175` both call `markGameOver(state)`, which honors the plan-review recommendation F-5 ("`MOVE_SNAKE` runner branch's inline gameover logic will drift from `markGameOver` over time"). The single source of truth for gameover state is preserved.

5. **The Runner Mode button is placed correctly.** `src/components/MainMenu.tsx:22-28` renders the Runner Mode button after the neon divider, before the Continue/New Game buttons, **always visible regardless of `canContinue`**. This matches the plan-review recommendation F-4 ("runner mode is equally discoverable for new and returning players") and ensures the validation opportunity is not missed for first-time players. The `runnerButton` class in `MainMenu.module.css:64-67` adds an accent border and neon shadow that visually distinguishes it from the standard menu buttons.

6. **Tail lane blocking is implemented correctly.** `src/game/state.ts:93-96` rejects a `CHANGE_LANE` action if the target lane contains a body segment at the head's Y. The head's x is then shifted immediately (zero tick delay) by mutating the snake's first segment to `{ x: RUNNER_LANE_X[newLane], y: head.y }` (`state.ts:100`). This matches the plan's "Lane changes shift the head's x-coordinate immediately (zero tick delay)" requirement (`plans/ACTIVE.md:709`).

7. **The Y-axis wrap-around is implemented with a single-state short-circuit.** `src/game/state.ts:109-110` wraps `newHead.y < 0` to `y = 19`, and `state.ts:135-139` regenerates the course on every wrap. The implementation uses the existing `isCollision` helper with `wrapAround=false` for the runner, which is correct — the runner wraps internally rather than relying on the L5 wrap-around collision bypass.

8. **The speed curve is the right shape.** `src/game/Engine.ts:248-251` implements `Math.max(RUNNER_MIN_SPEED, RUNNER_INITIAL_SPEED - Math.floor(distance / 50) * 2)`. At distance 0: 200ms. At distance 600: 200 - 12*2 = 176ms. At distance 3000: floors at 80ms. This is a gentle ramp that gives the player time to learn before the difficulty spike. The plan called for this curve exactly.

9. **The `RunnerHUD` and `RunnerGameOver` components match the existing visual language.** `RunnerHUD.module.css:9` uses `box-shadow: var(--shadow-neon-green)` (the same token as `ScoreBoard.tsx`). `RunnerGameOver.module.css:7` uses `rgba(15, 23, 42, 0.95)` for the backdrop, identical to `GameOver.module.css`. Both use `var(--font-display)` for the heading and `var(--font-mono)` for numeric values. The `autoFocus` on Play Again (`RunnerGameOver.tsx:38`) and Start (`RunnerGame.tsx:107`) are present. This is faithful to the plan's "match the existing arcade aesthetic" requirement (`plans/ACTIVE.md:492`).

10. **Documentation is updated correctly across all 4 docs.** `SPEC.md:699-782` adds Section 20 (Runner Mode) with 10 subsections covering overview, lane system, movement, scoring, HUD, game over, controls, state machine, course generation, and difficulty scaling. `ARCHITECTURE.md` adds `runnerCourse.ts` to the project structure (line 29), the `'runner'` screen to the navigation pattern (line 161), `isRunner`/`distance`/`lane` to the state shape (lines 311-313), and the runner state machine transitions (lines 287-291). `ROADMAP.md` moves M13 to the Completed section with a 9-bullet feature summary (lines 221-232). `PROJECT_STATE.md` updates version to 0.13.0 (line 5), M13 status to Complete (line 11), and all 7 phases as completed (lines 13-20). The pre-approval "fix the M13 reference" item in `plans/PLAN_REVIEW.md:63` is honored.

## Major Concerns

1. **Zero test coverage for the runner implementation.** See Finding F-1 below. The plan explicitly required 4 new test files and additional test coverage in 2 existing test files. None of them exist. The 415-test count is technically correct, but the runner gameplay, reducer logic, course generation, and component rendering are entirely unverified by automated tests. This is the primary reason the review is `Reject` rather than `Approve with Minor Changes`.

---

# Findings

## F-1 — Zero test coverage for the runner implementation (BLOCKER)

- **Severity:** High
- **Category:** Testing
- **Description:** The plan's Phase 1 testing approach (`plans/ACTIVE.md:259-268`) requires new tests in `src/game/__tests__/state.test.ts` covering: "START_RUNNER initializes correctly (snake at bottom center, lane=1, distance=0, obstacles generated). CHANGE_LANE updates lane and head x; clamped at bounds; no-op outside runner; tail lane blocking (rejects lane change into body-occupied lane at head Y). MOVE_SNAKE in runner: auto-UP movement, Y-wrap, distance increments, score increases with distance and food (with length multiplier), collision calls `markGameOver`." **None of these tests exist.** The only diff to `state.test.ts` is `+3` lines adding the new state field defaults to the `makeState` helper (lines 27-29).

The plan's Phase 2 testing approach (`plans/ACTIVE.md:333-336`) requires: "Add to `src/game/__tests__/Engine.test.ts`: `startRunner()` dispatches START_RUNNER and starts loop; `changeLane()` dispatches CHANGE_LANE; gameover stops loop and saves high score; speed decreases with distance." **None of these tests exist.** `Engine.test.ts` is unchanged.

The plan's Phase 3 acceptance criteria (`plans/ACTIVE.md:423-428`) requires: "`generateRunnerCourse` returns valid obstacle positions within grid. Every row has at least one clear lane. No obstacle on snake body positions. Food is `'normal'` type, not on obstacle or snake. Pattern count and density increase with distance." The test file `src/game/__tests__/runnerCourse.test.ts` was specified as the home for these tests (`plans/ACTIVE.md:412-421`). **The file does not exist.**

The plan's Phase 4 testing approach (`plans/ACTIVE.md:483-485`) requires `RunnerHUD.test.tsx` and `RunnerGameOver.test.tsx`. **Neither file exists.**

The plan's Phase 5 testing approach (`plans/ACTIVE.md:649-653`) requires `RunnerGame.test.tsx`. **The file does not exist.**

The plan's Phase 6 testing approach (`plans/ACTIVE.md:729-730`) requires updating `MainMenu.test.tsx`. **This was done** — one new test at lines 81-87.

Total runner-specific tests added: **1** (a click handler in `MainMenu`).

The 415-test count is technically correct, and the test count promise in `ROADMAP.md:231` ("415 tests passing across 26 test files") is satisfied. The `PROGRESS.md` DoD says "All tests pass (existing 414 + new)" and the runner added 1 new test, so the literal gate passes. However, the **intent** of the plan's testing sections is to provide automated coverage of the runner gameplay, and that intent is unmet.

The immediate risk is that the runner is **non-deterministic** (`runnerCourse.ts` uses `Math.random()` for pattern count and lane selection). A property-based test ("run `generateRunnerCourse` 100 times, all results satisfy invariants" — `plans/ACTIVE.md:420-421`) is the only safe way to verify the no-row-fully-blocked invariant. Without it, a future change to `selectBlockedLanes` could break the invariant and the player could face an unwinnable row. The plan recognized this risk ("Random generation can produce unfair patterns" — `plans/ACTIVE.md:406`); the mitigation was the test, which was not delivered.

- **Recommendation:** Create the 4 test files and add the per-phase test cases the plan specified. Minimum viable coverage:

  - `src/game/__tests__/runnerCourse.test.ts` — invariants (no row fully blocked, no obstacle on snake, food is `'normal'` type, food not on obstacle), pattern count scaling with distance, determinism check (run 100 times, all results satisfy invariants).
  - `src/game/__tests__/state.test.ts` — `describe('START_RUNNER')` with at least 3 cases (initializes correctly, snake at lane 1, distance resets to 0); `describe('CHANGE_LANE')` with at least 5 cases (shifts lane and head x, clamps at 0/2, no-op when not playing, no-op when not runner, tail lane blocking); `describe('MOVE_SNAKE in runner')` with at least 5 cases (auto-UP, Y-wrap, distance increment, score from food with length multiplier, score from distance, collision calls markGameOver).
  - `src/game/__tests__/Engine.test.ts` — `describe('startRunner')` (dispatches + starts loop, sets isRunner); `describe('changeLane')` (dispatches CHANGE_LANE); `describe('runner speed curve')` (200ms at distance 0, decreases with distance, floors at 80ms).
  - `src/components/__tests__/RunnerHUD.test.tsx` — renders 4 stats with values, has `aria-live` regions.
  - `src/components/__tests__/RunnerGameOver.test.tsx` — renders stats, Play Again calls onPlayAgain, Menu calls onReturnToMenu, Play Again has autoFocus.
  - `src/components/__tests__/RunnerGame.test.tsx` — renders start overlay, Start button calls startRunner, RunnerHUD receives state values, RunnerGameOver appears at gameover.

  This is a substantial addition (~200-300 LOC of tests) but it is what the plan called for. Once added, the milestone is ready to merge as **Approve**.

## F-2 — `RUNNER_LANE_X` and `RUNNER_DISTANCE_PER_POINT` are not re-exported from `src/game/index.ts`

- **Severity:** Low
- **Category:** Maintainability
- **Description:** `src/game/constants.ts:35-38` declares `RUNNER_LANE_X`, `RUNNER_INITIAL_SPEED`, `RUNNER_MIN_SPEED`, and `RUNNER_DISTANCE_PER_POINT`. `src/game/index.ts:12-19` re-exports `GRID_SIZE`, `POINTS_PER_FOOD`, `LEVEL_COUNT`, `INITIAL_SNAKE`, `DIRECTION_OPPOSITE`, `KEY_MAP` from `./constants` but does **not** include the runner constants. This is an inconsistency with the existing barrel-export pattern. The runner constants are imported directly from `./constants` in `state.ts` and `runnerCourse.ts`, which works, but external consumers (e.g., a future statistics screen that needs to know the lane x-positions, or an ADR-style commentary) would have to know to import from the constants module directly. The other constants are all available from the barrel.
- **Recommendation:** Add `RUNNER_LANE_X`, `RUNNER_INITIAL_SPEED`, `RUNNER_MIN_SPEED`, and `RUNNER_DISTANCE_PER_POINT` to the `./constants` re-export block in `src/game/index.ts:12-19`. One-line change per constant. Pure maintainability polish.

## F-3 — `Board` is not given the `wrapAround` data attribute in runner mode

- **Severity:** Low
- **Category:** UX
- **Description:** `src/components/RunnerGame.tsx:88-95` renders `<Board snake={...} direction={...} food={...} obstacles={...} />` without passing `wrapAround`. `Board.tsx:39` sets `data-wrap-around="true"` only when the prop is truthy, and `Board.module.css` uses this attribute to render a dashed border (the visual hint for Level 5's wrap-around mode). The runner's Y-wrap is a different concept (auto-UP teleport on `y < 0`, not a free-direction wrap), so the visual hint is not strictly applicable. The plan did not require the dashed border for the runner. The finding is that the runner's wrap behavior is invisible to the player — the snake "teleports" without visual warning. This may be intentional (keeps the prototype simple) or an oversight.
- **Recommendation:** No change required for M13. The plan's Prototype Limitations section (`plans/ACTIVE.md:801-812`) explicitly calls out that the Y-wrap "approach is intentional for this prototype." A future M14+ scrolling-world implementation would address this entirely. If a polish pass wants to add a subtle visual cue (e.g., a one-second flash of the snake at the wrap moment), that is a future-milestone decision. Out of scope.

## F-4 — Inline keyboard handler `hasStarted` predicate has minor dead state

- **Severity:** Low
- **Category:** Maintainability
- **Description:** `src/components/RunnerGame.tsx:42` has `if (!hasStarted || state.status === 'gameover')` as the predicate for Space-start. After the first Space press, `hasStarted` is permanently `true` for the lifetime of the `RunnerGame` mount. The OR with `state.status === 'gameover'` is the only way Space triggers a restart. This works, but `hasStarted` is then functionally dead for restart detection — only `state.status` matters. A clearer predicate is `state.status === 'gameover' || state.status === 'idle'`, but the runner never enters `idle` (START_RUNNER sets `status: 'playing'`), so the `!hasStarted` check is the only first-start trigger. The current predicate is correct and matches the plan's intent. The dead-state observation is purely a readability nit.
- **Recommendation:** Optional: refactor to `if (state.status === 'gameover' || !hasStarted)`. Same behavior, slightly clearer. Not blocking.

## F-5 — `RunnerHUD` has a redundant `sr-only` assertive live region

- **Severity:** Low
- **Category:** Accessibility
- **Description:** `src/components/RunnerHUD.tsx:13-37` renders the visible HUD with `aria-live="polite"` and a separate `sr-only` `aria-live="assertive"` region that announces "Distance: X. Food: Y. Length: Z." (lines 34-36). This duplicates the same data twice for screen readers — once as polite (HUD updates) and once as assertive (status announcements). The plan's Phase 4 design rules (`plans/ACTIVE.md:471-477`) require `aria-live` on the HUD; the spec doesn't require the duplicate assertive region. The duplication means every state change fires two announcements to screen readers. This is consistent with the M12 pattern (the M12 `ScoreBoard.tsx` has a similar pattern), so it is a stylistic continuation rather than a bug.
- **Recommendation:** No change required. The pattern is consistent with existing M12 components. If a future accessibility audit (M19) finds double-announcement problematic, simplify to a single `aria-live` region. Out of scope for M13.

## F-6 — `RunnerGame.tsx:74-78` Menu button uses inline class string; runner `RunnerGame.module.css` has no `.menuBtn` class

- **Severity:** Low
- **Category:** Style
- **Description:** `src/components/RunnerGame.tsx:75` uses `className={styles.toolbarBtn}` for the Menu button (correct, defined at `RunnerGame.module.css:20-30`). The sound toggle button at line 71 also uses `styles.toolbarBtn`. This is consistent. The "Lane: Left | Center | Right" indicator at line 98-100 is a small visual addition that wasn't in the plan. It is helpful for first-time players and uses the existing `styles.laneIndicator` class. No action required.
- **Recommendation:** No change required.

## F-7 — `RunnerGame.tsx` does not call `onReturnToMenu` cleanup before navigation

- **Severity:** Low
- **Category:** Maintainability
- **Description:** `src/components/RunnerGame.tsx:47-49` calls `onNavigateToMenu()` from the Escape key handler. The `hasStarted` state is not reset, but the entire `RunnerGame` component unmounts on screen change, so the local state is lost anyway. This is correct behavior; the comment is a stylistic note that the local state is bound to the mount lifecycle. No change required.
- **Recommendation:** No change required.

## F-8 — `runnerCourse.ts` rowStep can produce 0 obstacles for low-difficulty runs

- **Severity:** Low
- **Category:** Edge case
- **Description:** `src/game/runnerCourse.ts:11-14` calculates `numPatterns = 6 + Math.floor(difficulty * 6)`, which is always 6 or more. `rowStep = Math.floor(GRID_SIZE / numPatterns)`, so `rowStep = floor(20/6) = 3` at minimum and `floor(20/12) = 1` at maximum. The pattern loop at lines 16-24 iterates `i = 0..numPatterns-1` and computes `y = i * rowStep`, so obstacles are placed at y = 0, 3, 6, 9, 12, 15 (6 patterns) up to y = 0, 1, 2, ..., 11 (12 patterns). The snake head starts at y = 18, so the `if (Math.abs(y - headY) < 3) continue` filter (line 18) skips the first iteration at y=0 (|0-18|=18, not skipped — actually no, that filter skips y within 3 of head, so y=0 is fine for headY=18). The filter protects the snake from immediate collision on START_RUNNER, but the snake moves UP each tick and could collide within 3 ticks if the y=15 row has 2 blocked lanes. This is by design (the snake must dodge) but is worth a unit test in `runnerCourse.test.ts` ("snake at headY=18 has 0 obstacles in the first 3 rows"). The test would catch a regression where someone changes the filter to `< 5` or removes it entirely.
- **Recommendation:** Include a test in the (currently missing) `runnerCourse.test.ts` verifying that obstacles are never placed within 3 rows of the snake head. The test would have been specified in the plan but was not written. This is a subset of F-1's recommendation.

## F-9 — `Engine.test.ts` `Engine.startRunner` and `Engine.changeLane` have no coverage

- **Severity:** High (subset of F-1)
- **Category:** Testing
- **Description:** `src/game/Engine.ts:198-206` adds `startRunner()` and `changeLane()` methods. The `startRunner` method calls `this.wasPaused = false`, dispatches `START_RUNNER`, and starts the loop. The `changeLane` method dispatches `CHANGE_LANE`. Neither has a unit test. The plan's Phase 2 testing approach (`plans/ACTIVE.md:333-336`) requires: "engine.startRunner() starts the game loop and state is playing; engine.changeLane(-1) moves lane left; engine.changeLane(1) moves lane right; Speed starts at 200ms and decreases as distance grows; Speed floors at 80ms; Game over stops the loop and saves high score via onGameOver callback." None of these are tested. The `Engine.test.ts` file is unchanged in the M13 diff.
- **Recommendation:** Add a `describe('startRunner')` and `describe('changeLane')` block to `Engine.test.ts`. 5-8 tests total. Subset of F-1.

## F-10 — `runnerCourse.test.ts` missing entirely (subset of F-1)

- **Severity:** High (subset of F-1)
- **Category:** Testing
- **Description:** `src/game/runnerCourse.ts` is a non-deterministic course generator that the plan explicitly identified as needing test coverage (`plans/ACTIVE.md:406-407`: "Random generation can produce unfair patterns... Mitigation: `selectBlockedLanes` only returns 1 or 2 lanes, so at least one lane is always clear per row"). The mitigation is structural (the code), but the structural invariant is not enforced by a test. The plan's Phase 3 testing approach (`plans/ACTIVE.md:411-421`) lists 7 specific test cases: "Generated obstacles are within grid bounds; At least one lane is clear at any y row; No obstacle overlaps with snake positions; Food is not on an obstacle; Food type is always `'normal'`; More patterns at higher distance; Determinism check: run `generateRunnerCourse` 100 times with random parameters; verify all 100 results satisfy invariants." None exist.
- **Recommendation:** Create the test file as the plan specified. Subset of F-1.

## F-11 — The 415-test count is technically accurate but misleading

- **Severity:** Low
- **Category:** Documentation
- **Description:** `docs/ROADMAP.md:231` and `docs/PROJECT_STATE.md:72` both claim "415 tests passing across 26 test files." Re-running `npm test -- --run` confirms 26 test files and 415 tests passing. The count is accurate. The slight misleading aspect is that the 415 count is a +1 from 414 (the M12 baseline), and the +1 is a single click handler in `MainMenu.test.tsx`. The plan's Phase 1 baseline promise was "414 tests" (`plans/ACTIVE.md:269`), and the plan's Phase 1 testing approach listed multiple new tests, none of which were written. The 415 count is correct, but the implication of "the runner is well-tested" is false.
- **Recommendation:** No change to the test count claim itself (it is accurate). Once F-1 is resolved, the count will grow to ~430-450, and the per-file breakdown in `SPEC.md:587` style should be updated to reflect the new test files.

## F-12 — PWA test transient flake on first run

- **Severity:** Low
- **Category:** Testing
- **Description:** Running `npm test` immediately after a fresh `git checkout` produces a 1-test failure in `src/__tests__/pwa.test.ts`: "generates a service worker — AssertionError: expected false to be true." The test at `pwa.test.ts:9` checks `existsSync(resolve(distDir, 'sw.js'))` and runs only when `distDir` exists. On the first run after a fresh checkout, `dist/` does not exist (the test framework does not depend on `npm run build` having been run). After running `npm run build` and re-running `npm test`, all 415 tests pass. This is a pre-existing test isolation issue, not introduced by M13 — the `pwa.test.ts` file is unchanged in the M13 diff. The plan's Phase 7 verification step 3 (`plans/ACTIVE.md:750`) is "`npm run build` — clean production build" and the M13 verification step 1 is "`npm test` — all existing 414 tests pass, new runner tests pass" (lines 748-749). The two commands are run sequentially, so the flake resolves by the second test run. This is the same flakiness pattern as the M12 review (transient test ordering issues, not a real bug).
- **Recommendation:** No change required. The flake is pre-existing and the verification protocol (build first, then test) is correct. If a future cleanup pass adds a `pretest` script that runs `npm run build` before `npm test`, the flake would be eliminated, but that is out of scope for M13.

## F-13 — SPEC.md §20 mentions `BEST` and `Run Over!` heading — verified consistent

- **Severity:** Low
- **Category:** Documentation
- **Description:** `SPEC.md:731` lists "High score (Best)" in the HUD. `RunnerHUD.tsx:30` renders `<span className={styles.label}>Best</span>`. `RunnerGameOver.tsx:31` renders `<span className={styles.statLabel}>Best</span>`. Both are consistent. `SPEC.md:737` says "Run Over!" heading — `RunnerGameOver.tsx:16` renders `<h2 className={styles.title}>Run Over!</h2>`. Consistent. No action required.
- **Recommendation:** No change required.

## F-14 — `ARCHITECTURE.md:346` still says "392 unit tests" for the testing section

- **Severity:** Low
- **Category:** Documentation
- **Description:** `ARCHITECTURE.md:362` says "**392 unit tests** across 26 test files" (this is from M12 documentation, now stale). `ARCHITECTURE.md:363` lists the test coverage and "Run: `npm test` or `npm run test:watch`" — accurate. The 392 count was true at the end of M12 but is now 415. `ROADMAP.md:231` and `PROJECT_STATE.md:72` both say 415, so the discrepancy is localized to `ARCHITECTURE.md:362`.
- **Recommendation:** Update `ARCHITECTURE.md:362` from "392 unit tests" to "415 unit tests". One-line documentation polish.

## F-15 — `ARCHITECTURE.md:346` test coverage list does not mention runner test files

- **Severity:** Low
- **Category:** Documentation
- **Description:** `ARCHITECTURE.md:363` lists the components and modules covered by tests, ending with "MainMenu, PauseMenu, ReadyOverlay, SettingsScreen, HelpScreen, StatisticsScreen, AchievementsScreen)". The runner components (`RunnerGame`, `RunnerHUD`, `RunnerGameOver`) and the runner course module (`runnerCourse.ts`) are not in this list. Since none of these have tests (F-1), listing them would be incorrect. Once F-1 is resolved, the test coverage list should be updated to include the new files. This is a follow-up doc polish.
- **Recommendation:** Update `ARCHITECTURE.md:363` to add "RunnerGame, RunnerHUD, RunnerGameOver, runnerCourse" once F-1 is resolved. One-line documentation polish.

## F-16 — `ROADMAP.md:221-232` M13 summary is well-structured and accurate

- **Severity:** Low
- **Category:** Documentation
- **Description:** The M13 summary in `ROADMAP.md:221-232` lists 9 specific deliverables (auto-UP movement, 3-lane system, tail lane blocking, Y-axis wrap-around, distance-based scoring, HUD/GameOver components, speed curve, MainMenu entry point, 415 tests). All 9 are present in the implementation. The summary is well-organized. The "In Progress" section correctly says "None — Milestone 13 complete. Milestone 14 pending." (`ROADMAP.md:237`).
- **Recommendation:** No change required.

## F-17 — `package.json` version bumped to 0.13.0 — verified

- **Severity:** Low
- **Category:** Documentation
- **Description:** `package.json:4` shows `"version": "0.13.0"`. The plan's DoD required "package.json version bumped to 0.13.0" (`plans/ACTIVE.md:795`). Satisfied.
- **Recommendation:** No change required.

## F-18 — M13 plan files have not been archived

- **Severity:** Low
- **Category:** Process
- **Description:** The `plans/ACTIVE.md` is still the M13 plan (890 lines), and `plans/PLAN_REVIEW.md` (677 lines) is the pre-approval review. Per `AGENTS.md:286-311`, the plan lifecycle includes "Approved → Archived → Ready For Merge." The plan has been implemented but not yet approved (this review) or archived. This is correct: ACTIVE.md remains active until approval. Once this review is resolved, the plan should be archived to `plans/archive/`. The M12 plan was archived (`chore(m12): archive milestone 12 UX & navigation plan, prepare for merge` is in the git log at `1e97bdf`).
- **Recommendation:** Archive the M13 plan after the F-1 test gap is resolved and approval is granted. Pure process.

---

# Plan Compliance Review

## Completed as planned

| Plan section | Implementation | Status |
|--------------|----------------|--------|
| Phase 1.1: `isRunner`, `distance`, `lane` in `GameState` | `src/game/types.ts:43-45` | ✅ Exact match |
| Phase 1.2: `START_RUNNER`, `CHANGE_LANE` actions | `src/game/types.ts:58-59` | ✅ Exact match |
| Phase 1.3: `RUNNER_LANE_X`, `RUNNER_INITIAL_SPEED`, `RUNNER_MIN_SPEED`, `RUNNER_DISTANCE_PER_POINT` | `src/game/constants.ts:35-38` | ✅ Exact match |
| Phase 1.4: Runner defaults in `getInitialState()` | `src/game/state.ts:27-29` | ✅ Exact match |
| Phase 1.5: `START_RUNNER` case | `src/game/state.ts:50-70` | ✅ Exact match |
| Phase 1.6: `CHANGE_LANE` case | `src/game/state.ts:88-102` | ✅ Exact match |
| Phase 1.7: Runner short-circuit in `MOVE_SNAKE` | `src/game/state.ts:104-152` | ✅ Exact match (uses `markGameOver(state)` per PLAN_REVIEW F-5) |
| Phase 1.8: `forceType` parameter on `spawnFood` | `src/game/food.ts:17, 40` | ✅ Exact match |
| Phase 2.1: `Engine.startRunner()` | `src/game/Engine.ts:198-202` | ✅ Exact match |
| Phase 2.2: `Engine.changeLane()` | `src/game/Engine.ts:204-206` | ✅ Exact match |
| Phase 2.3: Runner speed branch in `startLoop` | `src/game/Engine.ts:247-256` | ✅ Exact match |
| Phase 2.4: `START_RUNNER` in games-played counter | `src/game/Engine.ts:49` | ✅ Exact match |
| Phase 3.1: `src/game/runnerCourse.ts` | `src/game/runnerCourse.ts:1-38` | ✅ Exact match |
| Phase 3.2: `generateRunnerCourse(headY, snake, distance)` | `src/game/runnerCourse.ts:5-28` | ✅ Exact match |
| Phase 3.3: `selectBlockedLanes(difficulty)` | `src/game/runnerCourse.ts:30-38` | ✅ Exact match |
| Phase 4.1: `src/components/RunnerHUD.tsx` | `src/components/RunnerHUD.tsx:1-39` | ✅ Exact match |
| Phase 4.2: `src/components/RunnerHUD.module.css` | `src/components/RunnerHUD.module.css:1-62` | ✅ Exact match |
| Phase 4.3: `src/components/RunnerGameOver.tsx` | `src/components/RunnerGameOver.tsx:1-58` | ✅ Exact match |
| Phase 4.4: `src/components/RunnerGameOver.module.css` | `src/components/RunnerGameOver.module.css:1-109` | ✅ Exact match |
| Phase 4.5: HUD displays Distance, Food, Length, High Score | `src/components/RunnerHUD.tsx:14-32` | ✅ Exact match |
| Phase 4.6: GameOver shows "Run Over!", stats, Play Again (autoFocus), Menu | `src/components/RunnerGameOver.tsx:14-54` | ✅ Exact match |
| Phase 5.1: `src/components/RunnerGame.tsx` | `src/components/RunnerGame.tsx:1-125` | ✅ Exact match |
| Phase 5.2: `src/components/RunnerGame.module.css` | `src/components/RunnerGame.module.css:1-99` | ✅ Exact match |
| Phase 5.3: Inline keyboard handler (LEFT/RIGHT/Space/Escape) | `src/components/RunnerGame.tsx:31-54` | ✅ Exact match |
| Phase 5.4: useTouch with LEFT/RIGHT filter | `src/components/RunnerGame.tsx:56-63` | ✅ Exact match |
| Phase 5.5: Board, HUD, GameOver rendered | `src/components/RunnerGame.tsx:81-122` | ✅ Exact match |
| Phase 5.6: Sound toggle | `src/components/RunnerGame.tsx:20-23, 71-73` | ✅ Exact match |
| Phase 6.1: `'runner'` in `Screen` union | `src/types/navigation.ts:1` | ✅ Exact match |
| Phase 6.2: `RunnerGame` import in `App.tsx` | `src/App.tsx:6` | ✅ Exact match |
| Phase 6.3: `'runner'` screen case | `src/App.tsx:59-61` | ✅ Exact match |
| Phase 6.4: `handleStartRunner` callback | `src/App.tsx:41-43` | ✅ Exact match |
| Phase 6.5: `onStartRunner` prop on `MainMenu` | `src/components/MainMenu.tsx:10, 13, 23-28` | ✅ Exact match (after divider, always visible per PLAN_REVIEW F-4) |
| Phase 6.6: Runner Mode button with `runnerButton` class | `src/components/MainMenu.module.css:64-67` | ✅ Exact match |
| Phase 7.1: `SPEC.md` §20 Runner Mode added | `SPEC.md:699-782` | ✅ Exact match (10 subsections) |
| Phase 7.2: `ARCHITECTURE.md` updated (state shape, components, runner state machine) | `ARCHITECTURE.md:29, 161, 287-291, 311-313, 327-330` | ✅ Exact match |
| Phase 7.3: `PROJECT_STATE.md` updated to M13 Runner Prototype Validation | `docs/PROJECT_STATE.md:5, 11, 13-20, 26, 32-37, 45-53, 58-72` | ✅ Exact match (M13 reference fix per PLAN_REVIEW F-1 honored) |
| Phase 7.4: `ROADMAP.md` M13 marked complete | `docs/ROADMAP.md:221-232, 237` | ✅ Exact match |
| Phase 7.5: `package.json` bumped to 0.13.0 | `package.json:4` | ✅ Exact match |
| DoD: Runner Mode playable from main menu | `MainMenu.tsx:22-28` → `App.tsx:42-43, 59-61` | ✅ Exact match |
| DoD: Snake auto-advances UP; LEFT/RIGHT change lanes | `state.ts:104-152`, `RunnerGame.tsx:31-39` | ✅ Exact match |
| DoD: Tail lane blocking | `state.ts:93-96` | ✅ Exact match |
| DoD: Three-lane system | `constants.ts:35`, `state.ts:90` | ✅ Exact match |
| DoD: Obstacles continuously appear; collision calls `markGameOver` | `state.ts:112-114` | ✅ Exact match |
| DoD: Food in lanes; collection increases score (with length multiplier) and length | `state.ts:123-126, 132` | ✅ Exact match |
| DoD: Distance-based scoring with HUD display | `state.ts:125-126`, `RunnerHUD.tsx:14-17` | ✅ Exact match |
| DoD: Game over shows run stats; Play Again under 2 seconds | `RunnerGameOver.tsx`, `Engine.ts:200-202` | ✅ Exact match (Play Again dispatches immediately, no reload) |
| DoD: Classic level-based game remains fully functional | All 26 pre-existing test files pass | ✅ Exact match |
| DoD: Lint clean | `npm run lint` → 0 errors | ✅ Exact match |
| DoD: Build clean | `npm run build` → success, PWA precache 8 entries | ✅ Exact match |
| DoD: PWA precache includes all new files | `vite-plugin-pwa` auto-precaches `**/*.{js,css,html,svg,png}`; build output includes `RunnerGame*.js` chunks | ✅ Exact match |
| DoD: All documentation updated and consistent | SPEC.md, ARCHITECTURE.md, ROADMAP.md, PROJECT_STATE.md, package.json | ✅ Exact match |
| DoD: package.json version bumped to 0.13.0 | `package.json:4` | ✅ Exact match |
| DoD: Success Question answerable | Yes — team can play the runner and decide | ✅ Exact match |

## Partially completed

- **DoD: "All tests pass (existing 414 + new)"** — 415/415 pass on a clean re-run, satisfying the literal gate. However, the "+new" portion of the promise is essentially unfulfilled: the runner implementation has zero automated test coverage. See F-1 for details and the recommended remediation.

- **Phase 1 testing approach (`plans/ACTIVE.md:259-268`)** — 0 of the listed test cases were added. Only the `makeState` helper was updated with the new state field defaults.

- **Phase 2 testing approach (`plans/ACTIVE.md:333-336`)** — 0 of the listed test cases were added.

- **Phase 3 testing approach (`plans/ACTIVE.md:411-421`)** — 0 of the listed test cases were added; the test file `runnerCourse.test.ts` was not created.

- **Phase 4 testing approach (`plans/ACTIVE.md:483-485`)** — 0 of the listed test cases were added; the test files `RunnerHUD.test.tsx` and `RunnerGameOver.test.tsx` were not created.

- **Phase 5 testing approach (`plans/ACTIVE.md:649-653`)** — 0 of the listed test cases were added; the test file `RunnerGame.test.tsx` was not created.

- **Phase 6 testing approach (`plans/ACTIVE.md:729-730`)** — Satisfied. `MainMenu.test.tsx` was updated to add the `onStartRunner` prop and a new test for the Runner Mode button click.

- **Phase 7 verification step 1 (`plans/ACTIVE.md:748-749`)** — "`npm test` — all existing 414 tests pass, new runner tests pass." Partially satisfied. All 414 existing tests pass, but there are essentially no new runner tests (1 trivial click handler).

- **Plan DoD verification step 5 ("Manual gameplay test")** — Cannot be executed in CI. The plan correctly defers this to manual playtest. The structured playtest protocol in `plans/ACTIVE.md:830-852` is documented in the plan but has not been performed (this is appropriate for post-merge playtesting).

## Missing implementation

- **4 test files not created** — `runnerCourse.test.ts`, `RunnerHUD.test.tsx`, `RunnerGameOver.test.tsx`, `RunnerGame.test.tsx`. The plan listed all 4 as required test files. None exist in the working tree.

- **Per-phase test additions in `state.test.ts` and `Engine.test.ts`** — The plan listed specific test cases for the runner reducer, runner engine methods, and runner speed curve. None were added.

- **No ADR was created for the M13 runner decision.** The `isRunner` flag pattern (with two modes, the pattern is simple; with 4+ modes, the pattern is awkward per `plans/PLAN_REVIEW.md:56`) is a deliberate architectural decision. `AGENTS.md:135-156` says ADRs are required for "significant technical or product decisions." This may qualify. The plan does not require an ADR, but the project rule does. This is a process observation, not a missing deliverable from the plan. Comparable in severity to F-18 in the M12 review.

---

# Documentation Review

| Document | Status | Notes |
|----------|--------|-------|
| `SPEC.md` | Updated for M13 | Section 20 added with 10 subsections (lines 699-782). Lane system, movement model, scoring, HUD, game over, controls (desktop + mobile), state machine, course generation, difficulty scaling all present. Section 19.4 (M12) unchanged. See F-13 for consistency verification. |
| `ARCHITECTURE.md` | Updated for M13 | `runnerCourse.ts` added to project structure (line 29); `'runner'` screen added to navigation (line 161); runner state machine added (lines 287-291); state shape fields added (lines 311-313); runner constants added (lines 327-330). See F-14 and F-15 for stale test count and test coverage list. |
| `docs/ROADMAP.md` | Updated for M13 | M13 moved to Completed (lines 221-232) with 9-bullet feature summary. In Progress section updated to "None — Milestone 13 complete. Milestone 14 pending" (line 237). Milestone 14 (Snake Growth Risk System) is now the next planned milestone. |
| `docs/PROJECT_STATE.md` | Updated for M13 | Version 0.13.0 (line 5). M13 Complete status (line 11). All 7 phases listed as completed (lines 13-20). M13 reference fix (PLAN_REVIEW F-1) honored: "Milestone 14 - Snake Growth Risk System" replaces the previous incorrect "Milestone 13 - Onboarding & Discoverability" reference (line 26). Priorities updated to runner-mode-specific items (lines 32-37). 415 tests referenced (line 72). |
| `package.json` | Updated to 0.13.0 | Line 4. |
| `plans/ACTIVE.md` | Authoritative | Status is "Active — implementation complete, awaiting review." Implementation matches the plan (see Plan Compliance table above). |
| `plans/PLAN_REVIEW.md` | Pre-approval | 12 pre-approval findings all honored. F-1 (PROJECT_STATE M13 reference), F-2 (test baseline count), F-3 (button placement), F-4 (markGameOver reuse), F-5 (button placement commitment), F-6 (button styling sketch) all reflected in the implementation. |
| `reviews/IMPLEMENTATION_REVIEW.md` (M12) | Replaced by this review | The M12 review is superseded by the M13 review at this file path. The M12 review content is preserved in git history (last commit `643d005`). |

Documentation is mostly consistent. The M13 additions in `SPEC.md` Section 20 are well-organized and follow the same pattern as the M12 Section 19 (Navigation & Screens). The minor stale items (F-14 test count in ARCHITECTURE.md, F-15 test coverage list) are advisory and do not block approval once F-1 is fixed.

---

# Testing Review

## Existing tests

- **415/415 passing** on a clean re-run. 26 test files. The pre-existing intermittent PWA test failure (F-12) resolves after a build precedes the test run; the test was not modified in M13.
- **Test count growth: 414 → 415 (+1).** The +1 is a single click handler in `MainMenu.test.tsx:81-87` ("calls onStartRunner when Runner Mode is clicked"). The remaining 6 changes to existing test files are mechanical (adding `isRunner: false, distance: 0, lane: 1` to `makeState` helpers in 3 files, adding `startRunner` and `changeLane` mocks to the `useGame` mock in `Game.test.tsx`, adding the `onStartRunner` prop to all `MainMenu` test renders).

## New tests added (1 total)

| File | Tests | Covers |
|------|-------|--------|
| `MainMenu.test.tsx` | +1 | Runner Mode button click calls `onStartRunner` |

## Missing tests (high-priority)

1. **`runnerCourse.test.ts` (planned, not created)** — 7 test cases planned: invariants (no row fully blocked, no obstacle on snake, food is `'normal'`, food not on obstacle), pattern count scaling, determinism check. See F-10.
2. **`state.test.ts` runner reducer tests (planned, not added)** — 3 describe blocks planned: `START_RUNNER`, `CHANGE_LANE` (with 5 cases), `MOVE_SNAKE in runner` (with 5 cases). See F-1.
3. **`Engine.test.ts` runner engine tests (planned, not added)** — 2 describe blocks planned: `startRunner` (with 3 cases), `changeLane` (with 2 cases), runner speed curve (with 3 cases). See F-9.
4. **`RunnerHUD.test.tsx` (planned, not created)** — Renders 4 stats with values, has `aria-live` regions. See F-1.
5. **`RunnerGameOver.test.tsx` (planned, not created)** — Renders stats, Play Again calls `onPlayAgain`, Menu calls `onReturnToMenu`, Play Again has `autoFocus`. See F-1.
6. **`RunnerGame.test.tsx` (planned, not created)** — Renders start overlay, Start button calls `startRunner`, RunnerHUD receives state values, RunnerGameOver appears at gameover. See F-1.

## Verification quality

The 1 new test that was added (Runner Mode button click) is high-quality: it uses `userEvent.setup()` for realistic interaction, asserts the callback was called, and fits the existing test pattern. The mechanical diffs to `state.test.ts`, `Game.test.tsx`, `achievements.test.ts`, and `MainMenu.test.tsx` are also high-quality: they keep the existing test files compiling and passing after the type and prop changes. The verification quality of the **missing** tests is unknown — they were never written.

The pre-existing test flakiness in `state.test.ts > MOVE_SNAKE spawns replacement normal food when timer reaches 0` (documented in `PROJECT_STATE.md:296`) is not affected by M13: the runner's `forceType: 'normal'` path (`state.ts:132`) sidesteps the non-deterministic RNG branch in `food.ts`. The plan-review F-9 call-out is honored by the implementation.

---

# Final Decision

**Reject (block on Finding F-1; re-review after fix).**

The implementation is overwhelmingly aligned with `plans/ACTIVE.md`, the architecture, and the project's development philosophy. The blocker is a testing gap: the runner implementation has zero automated test coverage despite the plan explicitly requiring 4 new test files and additional tests in 2 existing test files. The 415-test count is technically correct (414 → 415, +1) but the +1 is a navigation callback, not a runner gameplay test. The plan's success question ("Is endless runner gameplay more engaging?") cannot be answered with confidence until the runner implementation is verified by tests.

### Required before merge

1. **Fix F-1** by creating the 4 test files the plan specified (`runnerCourse.test.ts`, `RunnerHUD.test.tsx`, `RunnerGameOver.test.tsx`, `RunnerGame.test.tsx`) and adding the per-phase test cases the plan listed in `state.test.ts` and `Engine.test.ts`. See F-1 for the specific test count targets and the property-based "run 100 times" determinism check.
2. **Verify F-1 fix** by re-running `npm test -- --run` and confirming the new test count is at least 430 (preferably 450+).

### Optional (advisory, can be deferred)

- F-2: Add `RUNNER_LANE_X`, `RUNNER_INITIAL_SPEED`, `RUNNER_MIN_SPEED`, `RUNNER_DISTANCE_PER_POINT` to the `src/game/index.ts` barrel re-exports.
- F-3: No change required (intentional limitation per the plan's Prototype Limitations section).
- F-4: Optional: refactor the keyboard handler's `hasStarted` predicate for clarity.
- F-5: No change required (consistent with M12 accessibility pattern).
- F-6: No change required.
- F-7: No change required.
- F-8: Subsumed by F-1's recommendation (test the no-obstacles-within-3-rows invariant in `runnerCourse.test.ts`).
- F-9: Subsumed by F-1.
- F-10: Subsumed by F-1.
- F-11: No change required (count is accurate).
- F-12: No change required (pre-existing flake, verification protocol handles it).
- F-13: No change required.
- F-14: Update `ARCHITECTURE.md:362` test count from 392 to 415.
- F-15: Update `ARCHITECTURE.md:363` test coverage list to include runner files (after F-1 is resolved).
- F-16: No change required.
- F-17: No change required.
- F-18: Archive the M13 plan to `plans/archive/` after approval.

### Optional (architectural observation, can be deferred to a future cleanup pass)

- The runner `MOVE_SNAKE` short-circuit adds ~50 lines to an already-large `MOVE_SNAKE` case in `state.ts`. A future refactor could extract the runner logic to a `runnerMoveSnake(state)` helper for symmetry with the existing `markGameOver` pattern. Not blocking, and the plan's "Senior Engineer Test" philosophy (`AGENTS.md:96-98`) does not penalize code for lacking future-milestone abstractions.

### Re-review after F-1 fix

After the F-1 test additions and verification, the implementation is ready to merge as **Approve**. The findings above are advisory and do not affect the milestone's overall scope, architecture, or the success criteria listed in the plan (`plans/ACTIVE.md:780-797`).

---

# Resolution Summary

## F-1 — Zero test coverage for the runner implementation

- **Status:** Open
- **Required Action:** Create 4 test files and add per-phase test cases. Estimated ~200-300 LOC of test code. See F-1 recommendation for the minimum viable coverage.

## F-2 — `RUNNER_LANE_X` and `RUNNER_DISTANCE_PER_POINT` not re-exported from barrel

- **Status:** Open
- **Required Action:** Add 4 lines to `src/game/index.ts:12-19`. Trivial.

## F-3 — `Board` is not given the `wrapAround` data attribute in runner mode

- **Status:** No change required
- **Rationale:** The plan's Prototype Limitations section explicitly accepts the Y-wrap approach for M13. A future M14+ scrolling-world implementation will address this. Out of scope for M13.

## F-4 — Inline keyboard handler `hasStarted` predicate has minor dead state

- **Status:** No change required
- **Rationale:** The current predicate is correct and matches the plan. Pure readability nit.

## F-5 — `RunnerHUD` has redundant `sr-only` assertive live region

- **Status:** No change required
- **Rationale:** Consistent with M12 accessibility pattern. Future M19 accessibility audit can simplify if needed.

## F-6 — Runner `laneIndicator` not in plan

- **Status:** No change required
- **Rationale:** Small UX addition that helps first-time players. Not in plan but harmless.

## F-7 — `RunnerGame` does not reset `hasStarted` before navigation

- **Status:** No change required
- **Rationale:** Component unmount resets local state automatically. Correct behavior.

## F-8 — `runnerCourse.ts` rowStep can produce 0 obstacles at low difficulty

- **Status:** Open
- **Required Action:** Add a test in `runnerCourse.test.ts` (which does not yet exist) verifying that obstacles are never placed within 3 rows of the snake head. Subsumed by F-1.

## F-9 — `Engine.test.ts` `startRunner` and `changeLane` have no coverage

- **Status:** Open
- **Required Action:** Add 5-8 tests to `Engine.test.ts`. Subsumed by F-1.

## F-10 — `runnerCourse.test.ts` missing entirely

- **Status:** Open
- **Required Action:** Create the test file. Subsumed by F-1.

## F-11 — 415-test count is technically accurate but misleading

- **Status:** No change to count claim
- **Rationale:** The count is correct. Once F-1 is resolved, the count will grow and the per-file breakdown should be updated to reflect the new test files (subsumed by F-15).

## F-12 — PWA test transient flake on first run

- **Status:** No change required
- **Rationale:** Pre-existing test isolation issue, not introduced by M13. Verification protocol (build then test) handles it.

## F-13 — SPEC.md §20 mentions `BEST` and `Run Over!` heading — verified consistent

- **Status:** Resolved
- **Rationale:** No action required. Spec and implementation are consistent.

## F-14 — `ARCHITECTURE.md:346` still says "392 unit tests"

- **Status:** Open
- **Required Action:** Update `ARCHITECTURE.md:362` from "392 unit tests" to "415 unit tests". One-line documentation polish.

## F-15 — `ARCHITECTURE.md:363` test coverage list does not mention runner test files

- **Status:** Open
- **Required Action:** Update `ARCHITECTURE.md:363` to add "RunnerGame, RunnerHUD, RunnerGameOver, runnerCourse" once F-1 is resolved. One-line documentation polish.

## F-16 — `ROADMAP.md:221-232` M13 summary is well-structured and accurate

- **Status:** Resolved
- **Rationale:** No action required.

## F-17 — `package.json` version bumped to 0.13.0

- **Status:** Resolved
- **Rationale:** No action required.

## F-18 — M13 plan files have not been archived

- **Status:** Open
- **Required Action:** Archive the M13 plan to `plans/archive/` after F-1 is resolved and approval is granted. Process step.

## Additional: No ADR for the runner flag pattern

- **Status:** Optional
- **Rationale:** The `isRunner` flag pattern is a deliberate architectural decision documented in `plans/PLAN_REVIEW.md:56`. A future ADR could capture the "mode flag + early-return" pattern as the project's standard for ≤3 game modes. Not blocking, and the plan is the authoritative decision record for M13.

## Additional: Pre-existing test flakiness (`state.test.ts` gold food timer)

- **Status:** No change required
- **Rationale:** The M13 runner implementation sidesteps this flakiness via `forceType: 'normal'` (called from `state.ts:132`). The plan-review F-9 call-out is honored by the implementation.

---

# Summary

### Required before merge (1 item)

- **F-1:** Add the 4 missing test files and the per-phase test cases the plan specified. This is the only blocker.

### Required documentation polish (3 items, after F-1 fix)

- **F-2:** Re-export 4 runner constants from `src/game/index.ts`.
- **F-14:** Update `ARCHITECTURE.md:362` test count from 392 to 415.
- **F-15:** Update `ARCHITECTURE.md:363` test coverage list to include runner files.

### Required process step (1 item, after F-1 fix)

- **F-18:** Archive the M13 plan to `plans/archive/` after approval.

### Files reviewed

- **New (4):** `src/game/runnerCourse.ts`, `src/components/RunnerGame.{tsx,module.css}`, `src/components/RunnerHUD.{tsx,module.css}`, `src/components/RunnerGameOver.{tsx,module.css}`
- **Modified (13):** `src/game/types.ts`, `src/game/constants.ts`, `src/game/state.ts`, `src/game/Engine.ts`, `src/game/food.ts`, `src/hooks/useGame.ts`, `src/types/navigation.ts`, `src/App.tsx`, `src/components/MainMenu.{tsx,module.css}`, `src/components/__tests__/MainMenu.test.tsx`, `src/components/__tests__/Game.test.tsx`, `src/game/__tests__/state.test.ts`, `src/game/__tests__/achievements.test.ts`
- **Docs (5):** `SPEC.md`, `ARCHITECTURE.md`, `docs/ROADMAP.md`, `docs/PROJECT_STATE.md`, `package.json`
- **Plan (2):** `plans/ACTIVE.md`, `plans/PLAN_REVIEW.md`

### Verification commands

- `npm test -- --run` — 415/415 passing, 26 test files (transient PWA flake on first run; resolved on second run)
- `npm run lint` — 0 errors, 0 warnings
- `npm run build` — success, 244.59 kB JS / 74.35 kB gz, 33.14 kB CSS / 5.43 kB gz, PWA precache 8 entries / 283.19 KiB
