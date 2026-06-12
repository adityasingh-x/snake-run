# Plan Review — Milestone 14: Snake Growth Risk System

**Plan under review:** `plans/ACTIVE.md` (Milestone 14, "Snake Growth Risk System")
**Reviewer role:** Staff Engineer
**Date:** 2026-06-12
**Baseline:** v0.13.5 (M13.5 complete) — 447 tests passing across 27 test files
**PRD:** `docs/prd/PRD_M14.md` v2.0 ("Approved For Planning")

---

# Overall Assessment

## Strengths

- **Roadmap alignment is correct.** M14 is the explicit next milestone in `docs/ROADMAP.md` §"Current Sequence" ("Next: Milestone 14 → `docs/prd/PRD_M14.md`"). The PRD's product question — "What makes Snake Run unique? Growth-Based Risk Management" — is preserved as the milestone's exit decision (PRD §26, mirrored in plan §Post-Implementation Review).

- **The plan correctly identifies the highest-leverage mechanism.** Multiplier Pressure (E) is the only mechanism the PRD §10 lists that creates an immediate, visible, player-readable signal of risk. Tail pressure (A) and obstacle density (D) are already in place and would not answer the PRD §5 "Does growth change decisions?" question on their own. The plan makes E the load-bearing change and treats A/D as additive (correctly).

- **Code placement is mostly consistent with `ARCHITECTURE.md`.** Phase A touches `src/game/constants.ts` and `src/game/state.ts`, both of which exist and are framework-agnostic. Phase C's `onMilestone` callback follows the existing `onEat`/`onLevelUp`/`onGameOver` pattern in `Engine.ts:284-288`. Phase D modifies `src/game/runnerCourse.ts`, which already encapsulates runner-specific logic. The plan respects the `src/game/` vs `src/components/` vs `src/platform/` separation documented in ARCHITECTURE.md §"Project Structure".

- **Phase decomposition is clean and the dependency graph is correct.** Phase A (scoring engine) → Phase B (HUD) → Phase C (celebration) → Phase D (course gen) → Phase E (docs). The plan correctly notes that B and C could be parallelized and that D depends only on A. The order matches the foundation-first principle.

- **Risk register addresses real concerns.** The HUD becoming crowded on mobile, milestone sounds overlapping, and risk-aware food placement producing unreachable food are all genuine risks for a feel-driven milestone. The plan's mitigations (fallback to safe placement, fire-and-forget oscillators, responsive wrapping) are appropriate for a single-developer validation cycle.

- **Out-of-Scope section is tight and matches PRD §4.** No powerups, no new food types, no cosmetics, no online features, no mobile-specific UI beyond responsive CSS. The "no PWA deployment changes" exclusion is especially important — M14 must not entangle with packaging.

- **Test plan reuses existing patterns.** The plan adds new tests to `src/game/__tests__/state.test.ts` and `src/game/__tests__/runnerCourse.test.ts`, both of which already exist and follow the Vitest + jsdom conventions. New component tests follow the existing `src/components/__tests__/` pattern.

- **Validation infrastructure mirrors M13.5.** The 5-recordings + 5-owner-questions + 5-AI-questions structure is the same shape as M13.5's validation (which successfully completed). Reusing the pattern is a sign of disciplined process.

- **The plan correctly treats distance scoring as immutable.** "Distance scoring is NOT multiplied — only food points are" preserves the distance baseline and makes the food-multiply dynamic the differentiator. This is the right product call and matches the existing `Math.floor(newDistance / RUNNER_DISTANCE_PER_POINT) - Math.floor(state.distance / RUNNER_DISTANCE_PER_POINT)` pattern in `state.ts:124-125`.

## Weaknesses

- **`getMultiplier` placed in `constants.ts` is non-idiomatic.** Phase A step 1 says "Add to `src/game/constants.ts`". `constants.ts` is a pure-constants file (GRID_SIZE, POINTS_PER_FOOD, RUNNER_LANE_X, etc. — see `constants.ts:1-40`). The codebase already has logical grouping for game logic (`src/game/snake.ts`, `src/game/collision.ts`, `src/game/food.ts`, `src/game/levels.ts`, `src/game/runnerCourse.ts`). Putting a function with conditional logic in a constants file breaks the existing pattern. The `getMultiplier` function naturally belongs in `src/game/snake.ts` (which already exists and is the right home for length-related logic) or a new `src/game/multiplier.ts`. This is a small refactor that an AI implementer may not catch.

- **The pre-eat vs. post-eat multiplier semantics are ambiguous.** Phase A step 2 uses `getMultiplier(state.snake.length)` (pre-eat length). For the milestone-crossing case, this means the food that grows the snake from length 9 → 10 is rewarded at x1, while the food at length 10 → 11 is rewarded at x2. The PRD §12 ("Length 10 = x2") is more naturally read as "the food that pushes you over the threshold is rewarded at the new tier." The plan's code rewards the threshold-crossing food at the OLD tier. The plan should specify which interpretation is intended. The current code (`Math.floor(state.snake.length / 5) + 1` on `state.ts:122`) is pre-eat, so the plan preserves the existing behavior — but the plan should explicitly acknowledge this is a deliberate design choice, not an oversight, since it interacts with Phase C's milestone detection.

- **Phase B's `maxMultiplier` tracking location is unspecified.** Phase B step 3 says "RunnerGameOver tracks max multiplier per run via a ref or closure variable updated each tick." A `useRef` in `RunnerGame` is fragile (state updates are async; refs and React state can desync). A closure variable doesn't survive re-renders. The cleanest implementation is to add `maxMultiplier` to `GameState` and compute it in the `MOVE_SNAKE` runner branch (similar to how `score` and `distance` are tracked). The plan should specify the tracking location, not leave it to the implementer's discretion.

- **Phase C's milestone detection has a subtle off-by-one concern.** The plan computes `prevMultiplier` before dispatch and `newMultiplier` after dispatch, then fires when `newMultiplier > prevMultiplier`. This works correctly for the "grow past threshold" case (9 → 10, 19 → 20, 29 → 30, 49 → 50). However, the plan does not include a test for "MOVE_SNAKE at length 10 with NO food eaten does not fire `onMilestone`" — only the "length 11, 21" case. The implementer should verify the callback does not fire on non-food ticks (e.g., the snake's first MOVE_SNAKE after a `START_RUNNER` may already be at length 2; the first threshold is at 10; many non-food ticks happen between).

- **The plan does not address `Engine.onMilestone` callback cleanup.** The plan adds `this.onMilestone?.(newMultiplier)` to `Engine.dispatch()` but does not mention adding `onMilestone?: (tier: number) => void` to the class declaration (alongside `onEat`, `onLevelUp` at `Engine.ts:284-288`) nor the cleanup in `RunnerGame`'s `useEffect`. The existing pattern in `useGame.ts:78-94` clears callbacks on unmount, but `onMilestone` is runner-specific and belongs in `RunnerGame`'s useEffect, not `useGame`. The plan must specify the declaration and the cleanup.

- **Validation directory name drifts from PRD §18.** The PRD says "Store in: `docs/Milestone 14-validation/`" (with hyphen, title case). The plan uses `docs/Milestone 14_validation/` (with underscore). This is the same kind of silent deviation the M13.1 review flagged as a documentation-drift issue. The plan should use the PRD's path or update the PRD.

- **No mobile responsive layout guidance for the expanded HUD.** Phase B adds 3 sections to RunnerHUD (Multiplier, Next Milestone, Max on Game Over). The current RunnerHUD has 5 sections (Score, Distance, Food, Length, Best) and already uses a mobile breakpoint (`@media (max-width: 600px)` at `RunnerHUD.module.css:63-74`). Adding 3 more sections will worsen wrapping. The plan's risk table acknowledges this ("Hide separator on mobile") but does not include a CSS verification step. The plan should specify how the 7-section HUD wraps and what is hidden on mobile.

- **Phase D's "risk-aware course generation" has inconsistent placement logic.** The plan describes two mechanisms: (a) deterministic distance bands (distance < 100 = safe, 100-300 = mixed, > 300 = mostly) and (b) probabilistic `P(risky) = clamp((distance - 100) / 400, 0, 0.8)`. The two are not the same. The plan should pick one and describe the algorithm in pseudocode. The "Food is placed in the lowest-risk lane available on the chosen row" phrase is also vague: on a 2-obstacle row, there is 1 clear lane; on a 1-obstacle row, there are 2 clear lanes. Which is "lowest-risk"?

- **Phase D's headY exclusion note is not implemented in the plan's existing code.** The plan says "Ensure the obstacle row exclusion (`Math.abs(y - headY) < 3`) also applies to food rows." The existing `spawnRunnerFood` at `runnerCourse.ts:42-48` already does this check (`if (Math.abs(y - headY) < 3) continue;`). The plan implies this is a new requirement, but it is already implemented. The plan should acknowledge this and clarify what (if anything) is being added.

- **SPEC.md update is too vague.** Phase E says "Update §20 Runner Mode with growth risk system details." The current SPEC.md §20.4 documents the old `floor(length/5) + 1` multiplier at `SPEC.md:724`. The plan should list the specific sub-sections to update: §20.4 (new tiered multiplier), §20.5 (HUD additions: multiplier, next milestone, max multiplier), §20.6 (max multiplier in game over), §20.9 (risk-aware course generation), and a new §20.13 (milestone celebration feedback). Otherwise the implementer may make a partial update.

- **ARCHITECTURE.md update is too vague.** Phase E says "Document multiplier system, milestone celebration, risk-aware course gen." The current `ARCHITECTURE.md` has explicit sub-sections for other milestone features (e.g., "Lane Change Visual Feedback" at line 203-205, "Viewport Scrolling" at line 199-201). The plan should specify the equivalent sub-sections to add for M14.

- **The plan does not mention the pre-existing `state.test.ts` gold-food-timer flakiness.** `docs/PROJECT_STATE.md` §"Known Technical Debt" #1 documents a flaky test in `MOVE_SNAKE spawns replacement normal food when timer reaches 0`. The new multiplier tests added by Phase A operate on runner-mode `MOVE_SNAKE` (which uses normal food only), so the flakiness is unaffected. But the plan should acknowledge this for the implementer's awareness, as the M13.1 review recommended.

- **Phase A's test "Eating food at length 50 earns POINTS_PER_FOOD * 5 points" requires a synthetic state with 50 snake segments.** The plan should clarify that the test creates a state directly with `snake.length = 50` rather than simulating 48 ticks. The runner starts at length 2, so 48 ticks with food at every position is the alternative, but a synthetic state is cleaner and faster.

- **Phase A's test "Eating food at length 5 earns POINTS_PER_FOOD * 1 points" uses a length that is unreachable in runner mode (snake grows from 2 to 3, 4, 5 by eating food; tier 1 is lengths 3-9, so length 5 is in tier 1).** The test is valid, but it should use a snake that has been grown to length 5 (synthetic state) since you cannot grow past length 9 in tier 1 without crossing into tier 2.

- **Phase B's `MILESTONES` constant is duplicated.** Phase A exports `[10, 20, 30, 50]` from `constants.ts`. Phase B step 2 declares `const MILESTONES = [10, 20, 30, 50]` again in `RunnerGame.tsx`. The plan should direct `RunnerGame` to import `MILESTONES` from the same source (wherever Phase A places it). A duplicated constant is a maintenance hazard.

- **The plan does not specify `Engine.onMilestone` signature in terms of strict typing.** The plan shows `engine.onMilestone = (tier) => { ... }` with the parameter implicitly typed as `number`. For consistency with TypeScript strict mode, the type should be `2 | 3 | 4 | 5` (the valid tiers) or `number` with an explicit comment. A discriminated union would be cleaner.

- **Phase C's milestone sound design has clipping potential at Tier 5.** Tier 5 is "five-tone with chord harmony (fundamental + fifth, ascending pattern)." The existing `playLevelUp` at `sound.ts:69-73` uses three tones with `gain.gain.setValueAtTime(0.15, ...)` each. A 5-tone chord at the same gain could exceed 0.15 peak. The plan's risk register says "SoundManager's fire-and-forget oscillators are fine for overlapping; gain envelope prevents clipping" — but the envelope is exponential decay per tone, not a chord gain mixer. Five simultaneous tones at 0.15 could sum to ~0.5+ peak.

- **No PRD §9 "Each tier must feel different. Not visually. Mechanically." verification.** The PRD requires mechanical tier differences. The plan introduces: tier 2 has x2 multiplier, tier 3 x3, etc. — that's the mechanical difference for Mechanism E. But the plan does not verify Mechanism A (tail pressure), C (future choice restriction), or D (obstacle density) is meaningfully different at each tier. The existing tail lane blocking and obstacle density scaling are distance-based, not length-based, so they don't create tier-specific mechanical differences. The PRD §7 failure criterion E is "Length 3 and Length 30 play identically" — the plan's Mechanism E (multiplier) addresses scoring, not navigation decisions. Phase D (risk-aware food placement) is the only plan mechanism that creates tier-specific navigation decisions, and only loosely (more risky food at higher distance, not higher length).

- **Plan does not add a regression test for classic-mode scoring.** Phase A changes runner-mode scoring. The classic-mode `MOVE_SNAKE` branch is unchanged, but a regression test that "classic mode food scoring is unaffected by the multiplier refactor" should be added. The plan's test list says "Non-runner mode scoring is unchanged" but does not specify a test file or approach.

- **Plan does not specify what happens when the player starts a new run with `START_RUNNER` if `maxMultiplier` is set from a prior run.** If `maxMultiplier` lives in `GameState`, it must be reset on `START_RUNNER`. The plan should specify this reset (likely alongside `score`, `distance`, `snake` reset at `state.ts:50-69`).

## Major Risks

1. **The plan's three "already in place" claims for Mechanisms A, C, and D are partially misleading.** The plan states: "Tail Pressure (A) — Existing lane-blocking mechanic (already in place — no code changes needed)" and "Future Choice Restriction (C) — Existing tail-lane blocking (already in place — no code changes needed)". Both A and C are described as the same code path (the `bodyAtHeadY` check at `state.ts:91-95`). The PRD §10 lists A and C as separate mechanisms ("Longer snake creates navigation constraints" vs. "Longer snake limits future options"). Claiming the same code covers two separate mechanisms is a double-counting that could lead to under-engineering C if the team later decides to add C-specific behavior. The plan should either (a) acknowledge that A and C are not independent and merge them, or (b) describe the additional C-specific behavior (e.g., lane blocking at multiple Y positions, not just headY).

2. **The plan's response to PRD §7 failure criteria is incomplete.** PRD §7E: "Length 3 and Length 30 play identically" = failure. The plan's Mechanism E (multiplier) creates a scoring difference, not a navigation difference. At length 3 and length 30, the snake navigates the same way (the tail lane blocking is determined by `bodyAtHeadY`, not by total length). Phase D's risk-aware food placement is distance-based, not length-based — a length-30 snake and a length-3 snake at the same distance encounter the same food risk. The plan should add at least one length-based risk mechanism, or explicitly document that the PRD §7E criterion is satisfied by Mechanism E alone.

3. **Phase C's milestone celebration depends on Phase A's multiplier function being correct and stable.** If `getMultiplier` is changed after Phase C is implemented (e.g., to add a tier at length 5), the milestone detection and the HUD display must be updated together. The plan's risk register does not address this coupling. A small refactor (e.g., Phase A decides to add a tier 1.5 at length 7) would require touching Phase B and Phase C.

4. **The plan does not define what "max multiplier" means for the game-over stat.** If `maxMultiplier` is the highest tier reached, the stat is "x5" at length 50+. If it's the highest food multiplier earned (which is the same as the tier), the stat is the same. But what about the FIRST food earned at a new tier? At length 10, the first food gives x2 (per the post-eat interpretation) or x1 (per the pre-eat interpretation). The plan should be explicit.

5. **Sound clipping at Tier 5.** Five simultaneous tones at 0.15 gain can exceed the master volume. The plan's risk register mentions clipping but the mitigation is "gain envelope prevents clipping" which is incorrect for a 5-tone chord. The implementer should reduce the per-tone gain for higher tiers (e.g., 0.10 for tier 5) or sequence the tones (the plan says Tier 4 is "four-tone sine with rising amplitude" — sequential vs. chord is not specified for Tier 5).

## Recommended Changes

### Required (must apply)

1. **Move `getMultiplier` out of `constants.ts`.** Place it in `src/game/snake.ts` (or a new `src/game/multiplier.ts`). Export `MILESTONES` from the same location. Update Phase A step 1 to specify the new file. The `snake.ts` location is the most natural fit (length-based, snake-related) and follows the existing `levels.ts`, `food.ts`, `runnerCourse.ts` pattern of one-purpose modules.

2. **Specify pre-eat vs. post-eat multiplier semantics.** The plan should explicitly state which length the multiplier is based on, with a one-sentence justification tied to the PRD. If pre-eat (current code behavior), update SPEC.md §20.4 to document this. If post-eat (more intuitive), change the implementation in `state.ts:122` to use `newSnake.length` after the snake grows. The decision affects Phase C's milestone detection timing (currently pre-eat is fine because the threshold is crossed after the food grows the snake).

3. **Specify `maxMultiplier` state location and lifecycle.** Recommend: add `maxMultiplier: number` to `GameState` (alongside `score`, `distance`). Compute in the `MOVE_SNAKE` runner branch: `const newMaxMultiplier = Math.max(state.maxMultiplier ?? 1, getMultiplier(newSnake.length))`. Reset to 1 on `START_RUNNER` (alongside other runner reset fields at `state.ts:50-69`). Expose via `getState()` for the RunnerGameOver display.

4. **Add `Engine.onMilestone` declaration and cleanup to Phase C.** Specify: (a) add `onMilestone?: (tier: 2 | 3 | 4 | 5) => void;` to the `Engine` class alongside `onEat`, `onLevelUp` at `Engine.ts:284-288`; (b) wire the callback in a `useEffect` in `RunnerGame.tsx`; (c) clean up in the effect's return function (set `engine.onMilestone = undefined`); (d) for tier, use a discriminated union `2 | 3 | 4 | 5` to give type safety.

5. **Use the PRD's validation directory name.** Change `docs/Milestone 14_validation/` to `docs/Milestone 14-validation/` to match PRD §18. Add the same `.gitignore` policy as M13.5 (webm, mp4, mov file patterns in the recordings subdirectory).

6. **Reconcile Phase D's placement logic.** Pick one of the two described mechanisms (deterministic distance bands OR probabilistic `P(risky)`) and write the algorithm in pseudocode. Clarify "lowest-risk lane available" with examples. Specify the fallback behavior when no row matches the desired risk level.

7. **Document the existing headY exclusion in Phase D as already-implemented, not new.** The `Math.abs(y - headY) < 3` check already exists in `spawnRunnerFood` at `runnerCourse.ts:42-48`. Phase D should not list this as a new requirement.

8. **Specify which SPEC.md and ARCHITECTURE.md sub-sections to update.** For SPEC.md: §20.4 (multiplier), §20.5 (HUD), §20.6 (Game Over with max multiplier), §20.9 (course gen), new §20.13 (milestone feedback). For ARCHITECTURE.md: a new "Growth Risk System" sub-section after the lane visualization / viewport scrolling sub-sections, with bullet points for multiplier, celebration, risk-aware food.

### Recommended (should apply)

9. **Add a regression test that classic-mode scoring is unchanged.** Add to `src/game/__tests__/state.test.ts` a test that runs `MOVE_SNAKE` on a non-runner state with `score = 90`, `snake.length = 3`, eats food, and verifies `newScore = 100` (no multiplier applied). The current classic mode awards `POINTS_PER_FOOD = 10` per food, and the new code should preserve this for non-runner mode.

10. **Add a test for `MOVE_SNAKE` at length 10 with no food eaten — `onMilestone` does not fire.** Add to `src/game/__tests__/Engine.test.ts`: "Runner MOVE_SNAKE at length 10 with no food eaten does not fire onMilestone." This guards against accidental firing on every tick.

11. **Add a one-liner to Phase A acknowledging the pre-existing `state.test.ts` flakiness.** The new tests added by Phase A use runner-mode `MOVE_SNAKE` with normal food, so the flakiness is unaffected. But the implementer should be aware, as the M13.1 review recommended.

12. **Tighten Phase B's mobile responsive guidance.** The 7-section HUD will need explicit wrap behavior. Specify: on mobile (`@media (max-width: 600px)`), the separator is hidden (existing), and the new Multiplier and Next sections may be hidden entirely (showing only Score, Length, and Best) OR wrap below. Pick one and document the CSS.

13. **Add the `Engine.onMilestone` type signature as `2 | 3 | 4 | 5` (tier literal union), not `number`.** This catches type errors at the React callback site (e.g., if someone tries to pass tier=1, TypeScript flags it). Update Phase C step 3 accordingly.

14. **Reduce per-tone gain for higher milestone tiers.** Tier 5 (five-tone chord) should use `gain.gain.setValueAtTime(0.08, ...)` (or sequence the tones) to prevent clipping. Update Phase C step 1 to specify per-tier gain.

15. **Clarify "lowest-risk lane available on the chosen row."** Example: on a 2-obstacle row, the 1 clear lane is the only choice. On a 1-obstacle row, the 2 clear lanes are equally "low-risk" (one is the active lane, the other is a different lane). The plan should specify: food is placed in the clear lane that is NOT the player's current lane (forcing a lane change) OR in the clear lane that IS the player's current lane (no lane change). The PRD §15 ("Risk Route: Higher reward. Higher danger.") suggests forcing a lane change.

16. **Add a length-based risk mechanism or document why PRD §7E is satisfied by Mechanism E alone.** The PRD §7E is a failure criterion ("Length 3 and Length 30 play identically"). The plan's Mechanism E creates a scoring difference, not a navigation difference. Either (a) add a length-based food-placement modifier (e.g., lengthier snakes encounter riskier food at any given distance), or (b) explicitly document that the multiplier + risk-aware food placement (distance-based) jointly satisfy the criterion. Recommend option (b) with explicit reasoning.

17. **Clarify what `maxMultiplier` measures.** Two interpretations: (a) highest tier reached during the run (an integer 1-5); (b) highest food multiplier earned (same as the tier at the time of eating, accounting for pre/post-eat semantics). These are different. Recommend (a) for the game-over display ("Max Multiplier: x3" = reached tier 3 at some point).

### Optional (nice to have)

18. **Add a test for the `MOVE_SNAKE` runner branch with a snake of length 50 to verify `getMultiplier(50) = 5` is used in scoring.** The plan's test list includes this but it requires a synthetic state. The plan should make this explicit so the implementer doesn't simulate 48 ticks.

19. **Add a `data-growth-milestone` data attribute on the board when a milestone is reached.** Allows future CSS hooks (e.g., temporary green border glow on milestone) without modifying component code.

20. **Add `getMultiplier` to the `game/` barrel export (`src/game/index.ts`).** Other utility functions are re-exported here; this keeps the public API consistent.

21. **Add a `data-tier` data attribute to the Board for runner mode at higher tiers.** Future-proofs for tier-specific visual polish (e.g., progressive glow intensity).

22. **Consider gating `onMilestone` on `state.snake.length >= 10` instead of relying on `newMultiplier > prevMultiplier`.** Slightly more explicit and matches the PRD's "Length 10, 20, 30, 50" language. The current logic is correct but indirect.

---

# Detailed Findings

## Finding 1 — `getMultiplier` function placement in `constants.ts` is non-idiomatic (Phase A)

- **Severity:** Critical
- **Description:** Phase A step 1 says "Add to `src/game/constants.ts`". The current `constants.ts` (`src/game/constants.ts:1-40`) is a pure-constants file containing GRID_SIZE, POINTS_PER_FOOD, LEVEL_COUNT, INITIAL_SNAKE, KEY_MAP, RUNNER_LANE_X, etc. The codebase has separate utility modules for game logic: `src/game/snake.ts` (snake movement helpers), `src/game/collision.ts` (collision detection), `src/game/food.ts` (food spawning), `src/game/levels.ts` (level data), `src/game/runnerCourse.ts` (runner course generation). Mixing a function with conditional logic into a constants file breaks the existing pattern.
- **Recommendation:** Move `getMultiplier` to `src/game/snake.ts` (the most natural fit — length-based, snake-related) or a new `src/game/multiplier.ts` module. Export `MILESTONES` from the same location. Update Phase A step 1 to specify the new file. The `snake.ts` location is preferred because the multiplier is a property of the snake, not a generic game concept.

## Finding 2 — Pre-eat vs. post-eat multiplier semantics are ambiguous (Phase A)

- **Severity:** Critical
- **Description:** Phase A step 2 uses `getMultiplier(state.snake.length)` (pre-eat length). For the milestone-crossing case, this means the food that grows the snake from length 9 → 10 is rewarded at x1, while the food at length 10 → 11 is rewarded at x2. The PRD §12 ("Length 10 = x2") is more naturally read as "the food that pushes you over the threshold is rewarded at the new tier." The plan's code rewards the threshold-crossing food at the OLD tier. The current code at `state.ts:122` (`Math.floor(state.snake.length / 5) + 1`) is pre-eat, so the plan preserves the existing behavior — but the plan should explicitly acknowledge this is a deliberate design choice, not an oversight.
- **Recommendation:** Explicitly state in the plan whether pre-eat or post-eat is intended. If pre-eat (current behavior), add a sentence: "The multiplier is based on snake length at the start of the tick (pre-eat). The food that crosses the threshold is rewarded at the OLD tier; the next food is rewarded at the NEW tier." If post-eat (more intuitive), change the implementation in `state.ts:122` to use `newSnake.length` after the snake grows. Document the choice in SPEC.md §20.4.

## Finding 3 — `maxMultiplier` tracking location is unspecified (Phase B)

- **Severity:** High
- **Description:** Phase B step 3 says "RunnerGameOver tracks max multiplier per run via a ref or closure variable updated each tick." A `useRef` in `RunnerGame` is fragile (state updates are async; refs and React state can desync). A closure variable doesn't survive re-renders. The cleanest implementation is to add `maxMultiplier` to `GameState` and compute it in the `MOVE_SNAKE` runner branch (similar to how `score` and `distance` are tracked at `state.ts:120-125`).
- **Recommendation:** Add `maxMultiplier: number` to `GameState` (alongside `score`, `distance`, `lane`). Compute in the `MOVE_SNAKE` runner branch: `const newMaxMultiplier = Math.max(state.maxMultiplier ?? 1, getMultiplier(newSnake.length))`. Reset to 1 on `START_RUNNER` (alongside other runner reset fields at `state.ts:50-69`). Expose via `getState()` for the RunnerGameOver display.

## Finding 4 — `Engine.onMilestone` callback declaration and cleanup not specified (Phase C)

- **Severity:** High
- **Description:** Phase C step 2 shows the dispatch logic (`this.onMilestone?.(newMultiplier)`) but does not mention: (a) adding `onMilestone?: (tier: number) => void;` to the `Engine` class declaration (alongside `onEat`, `onLevelUp` at `Engine.ts:284-288`); (b) wiring the callback in a `useEffect` in `RunnerGame.tsx`; (c) cleaning up the callback in the effect's return function. The existing pattern in `useGame.ts:78-94` clears callbacks on unmount, but `onMilestone` is runner-specific and belongs in `RunnerGame`'s useEffect, not `useGame`.
- **Recommendation:** Add to Phase C: (a) declare `onMilestone?: (tier: 2 | 3 | 4 | 5) => void;` on the `Engine` class; (b) wire the callback in a `useEffect` in `RunnerGame.tsx` that has `state` (or `state.snake.length`) in the dependency array; (c) clean up in the effect's return function by setting `engine.onMilestone = undefined`. For tier, use a discriminated union `2 | 3 | 4 | 5` for type safety.

## Finding 5 — Validation directory name drifts from PRD §18 (Phase E)

- **Severity:** High
- **Description:** The PRD says "Store in: `docs/Milestone 14-validation/`" (with hyphen, title case). The plan uses `docs/Milestone 14_validation/` (with underscore). This is the same kind of silent deviation the M13.1 review flagged as a documentation-drift issue. AGENTS.md §"Documentation Consistency" says "Keep SPEC.md, ARCHITECTURE.md, PROJECT_STATE.md, and ROADMAP.md consistent with one another."
- **Recommendation:** Use the PRD's path: `docs/Milestone 14-validation/`. Add `.gitignore` entries for the recordings subdirectory (webm, mp4, mov patterns), mirroring the M13.5 policy at `.gitignore:38-40`. Document the storage policy in the validation README: "Recording files are stored externally; only README.md and screenshots are committed."

## Finding 6 — Phase D's risk-aware placement logic is inconsistent (Phase D)

- **Severity:** High
- **Description:** Phase D describes two mechanisms that are not the same: (a) deterministic distance bands ("distance < 100 (always)" safe, "distance 100–300 (mixed)" medium, "distance > 300 (mostly)" high) and (b) probabilistic `P(risky) = clamp((distance - 100) / 400, 0, 0.8)`. The two produce different distributions. Additionally, "Food is placed in the lowest-risk lane available on the chosen row" is vague: on a 2-obstacle row, there is 1 clear lane; on a 1-obstacle row, there are 2 clear lanes. Which is "lowest-risk"?
- **Recommendation:** Pick one mechanism and describe the algorithm in pseudocode. Example:
  ```
  riskLevel = distance < 100 ? 'safe'
           : distance < 300 ? 'medium' (probability 0.5)
           : 'high' (probability 0.5 + (distance - 300) / 200 * 0.3)
  if (riskLevel === 'safe') targetRow = any row with 0 obstacles
  else if (riskLevel === 'medium') targetRow = any row with 1 obstacle
  else targetRow = any row with 2 obstacles
  food = lowest-clear-lane (player.currentLane is preferred if row is 0-obstacle, else forced lane change)
  ```
  Specify the fallback: "If no row matches the desired risk level, fall back to the next safest level." Specify "lowest-risk lane" with examples.

## Finding 7 — `headY` exclusion in Phase D is already implemented (Phase D)

- **Severity:** Medium
- **Description:** Phase D step 4 says "Ensure the obstacle row exclusion (`Math.abs(y - headY) < 3`) also applies to food rows to prevent spawning food adjacent to the snake head." The existing `spawnRunnerFood` at `runnerCourse.ts:42-48` already has this check: `if (Math.abs(y - headY) < 3) continue;`. The plan implies this is a new requirement, but it is already implemented. The plan should acknowledge this and clarify what (if anything) is being added.
- **Recommendation:** Remove the "ensure" wording from Phase D step 4 and replace with: "The existing `headY` exclusion in `spawnRunnerFood` (`runnerCourse.ts:42-48`) is preserved. The new risk-aware placement also respects this exclusion (food is never within 3 rows of the snake head)."

## Finding 8 — SPEC.md update is too vague (Phase E)

- **Severity:** Medium
- **Description:** Phase E says "Update §20 Runner Mode with growth risk system details." The current SPEC.md §20.4 documents the old `floor(length/5) + 1` multiplier at `SPEC.md:724`. The plan should list the specific sub-sections to update: §20.4 (new tiered multiplier), §20.5 (HUD additions: multiplier, next milestone), §20.6 (max multiplier in game over), §20.9 (risk-aware course generation), and a new §20.13 (milestone celebration feedback). Otherwise the implementer may make a partial update.
- **Recommendation:** Replace Phase E's SPEC.md bullet with:
  - `SPEC.md` §20.4: replace `floor(length/5) + 1` with tiered multiplier (10→x2, 20→x3, 30→x4, 50→x5)
  - `SPEC.md` §20.5: add Multiplier section, Next Milestone section, Max Multiplier section
  - `SPEC.md` §20.6: add Max Multiplier stat row to RunnerGameOver
  - `SPEC.md` §20.9: add risk-aware food placement details (Safe/Medium/High, distance bands)
  - `SPEC.md` new §20.13: Milestone Celebration (visual pulse, sound at length 10/20/30/50)

## Finding 9 — ARCHITECTURE.md update is too vague (Phase E)

- **Severity:** Medium
- **Description:** Phase E says "Document multiplier system, milestone celebration, risk-aware course gen." The current `ARCHITECTURE.md` has explicit sub-sections for other milestone features (e.g., "Lane Change Visual Feedback" at line 203-205, "Viewport Scrolling" at line 199-201). The plan should specify the equivalent sub-sections to add for M14.
- **Recommendation:** Replace Phase E's ARCHITECTURE.md bullet with: "Add new sub-section 'Growth Risk System' to ARCHITECTURE.md after the 'Lane Change Visual Feedback' sub-section (line 205), documenting: (a) tiered length multiplier (src/game/snake.ts:getMultiplier), (b) onMilestone callback wired in RunnerGame.tsx, (c) risk-aware food placement in src/game/runnerCourse.ts."

## Finding 10 — Plan does not mention pre-existing test flakiness (Phase A)

- **Severity:** Low
- **Description:** `docs/PROJECT_STATE.md` §"Known Technical Debt" #1 documents a flaky test in `MOVE_SNAKE spawns replacement normal food when timer reaches 0`. The new multiplier tests added by Phase A operate on runner-mode `MOVE_SNAKE` (which uses normal food only), so the flakiness is unaffected. But the plan should acknowledge this for the implementer's awareness, as the M13.1 review recommended.
- **Recommendation:** Add to Phase A: "Note: The pre-existing `state.test.ts` gold-food-timer flakiness (PROJECT_STATE.md §Known Technical Debt #1) is unaffected by this milestone — the new multiplier tests use runner-mode `MOVE_SNAKE` with normal food, no gold timer."

## Finding 11 — Phase A test "Eating food at length 50" needs synthetic state clarification (Phase A)

- **Severity:** Low
- **Description:** The runner starts at length 2. To reach length 50, you need to dispatch 48 `MOVE_SNAKE` actions with food at every position. The plan's test list says "Eating food at length 50 earns `POINTS_PER_FOOD * 5` points" but doesn't specify the testing approach. The implementer might simulate 48 ticks (slow, fragile) or create a state directly with `snake.length = 50` (fast, clear). The plan should clarify that the test creates a synthetic state.
- **Recommendation:** Add to Phase A test list: "Test uses a synthetic `GameState` with `snake = [50 segments at valid positions]`, not a 48-tick simulation. The runner's start length is 2, but the test does not depend on the start length."

## Finding 12 — Phase B `MILESTONES` constant is duplicated (Phase A, Phase B)

- **Severity:** Medium
- **Description:** Phase A exports `[10, 20, 30, 50]` as a constant. Phase B step 2 declares `const MILESTONES = [10, 20, 30, 50]` again in `RunnerGame.tsx`. A duplicated constant is a maintenance hazard — if the milestones change (e.g., add tier 1.5 at length 7), the constant must be updated in two places.
- **Recommendation:** Direct `RunnerGame.tsx` to import `MILESTONES` from the same location where `getMultiplier` is defined (e.g., `src/game/snake.ts` or `src/game/multiplier.ts`). Update Phase B step 2 to remove the inline declaration.

## Finding 13 — Phase C's `onMilestone` callback type is not strictly typed (Phase C)

- **Severity:** Low
- **Description:** The plan shows `engine.onMilestone = (tier) => { ... }` with the parameter implicitly typed as `number`. For consistency with TypeScript strict mode (the project uses TypeScript 6.0+ strict mode per ARCHITECTURE.md §"Technology Stack"), the type should be `2 | 3 | 4 | 5` (the valid tiers) or `number` with an explicit comment. A discriminated union would be cleaner and catches type errors at the React callback site.
- **Recommendation:** Specify `onMilestone?: (tier: 2 | 3 | 4 | 5) => void;` in the Engine class declaration. This catches type errors if a caller tries to pass tier=1 or tier=6.

## Finding 14 — Phase C's Tier 5 sound may clip (Phase C)

- **Severity:** Medium
- **Description:** The existing `playLevelUp` at `sound.ts:69-73` uses three tones with `gain.gain.setValueAtTime(0.15, ...)` each. A 5-tone chord at the same gain could exceed 0.15 peak. The plan's risk register says "SoundManager's fire-and-forget oscillators are fine for overlapping; gain envelope prevents clipping" — but the envelope is exponential decay per tone, not a chord gain mixer. Five simultaneous tones at 0.15 could sum to ~0.5+ peak, which may cause audible distortion.
- **Recommendation:** For Tier 5 (5-tone chord), use a lower per-tone gain (e.g., `gain.gain.setValueAtTime(0.08, ...)`) OR sequence the tones (chord harmonies across time, not simultaneously). Update Phase C step 1 to specify per-tier gain values. Test on the implementation with audio output to verify no clipping.

## Finding 15 — No length-based risk mechanism in plan (PRD §7E)

- **Severity:** High
- **Description:** PRD §7E: "Length 3 and Length 30 play identically" = failure. The plan's Mechanism E (multiplier) creates a scoring difference, not a navigation difference. At length 3 and length 30, the snake navigates the same way (the tail lane blocking is determined by `bodyAtHeadY`, not by total length). Phase D's risk-aware food placement is distance-based, not length-based — a length-30 snake and a length-3 snake at the same distance encounter the same food risk. The plan should add at least one length-based risk mechanism, or explicitly document that the PRD §7E criterion is satisfied by Mechanism E alone.
- **Recommendation:** Either (a) add a length-based food-placement modifier (e.g., lengthier snakes encounter riskier food at any given distance), or (b) explicitly document that the multiplier + risk-aware food placement (distance-based) jointly satisfy the criterion. Recommend option (b) with explicit reasoning: "PRD §7E is satisfied because (i) food at higher multipliers is more 'valuable' to the player, making the decision to skip vs. pursue more meaningful; (ii) higher-tier players are more likely to be in late-game (high distance) where risk-aware food is more dangerous. The mechanical difference between length 3 and length 30 is the food multiplier (x1 vs. x4), which creates an explicit scoring tension."

## Finding 16 — `maxMultiplier` definition is ambiguous (Phase B)

- **Severity:** Medium
- **Description:** The plan does not define what "max multiplier" measures. Two interpretations: (a) highest tier reached during the run (an integer 1-5); (b) highest food multiplier earned (same as the tier at the time of eating, accounting for pre/post-eat semantics). These are different only in the pre-eat vs. post-eat case, but the plan should be explicit.
- **Recommendation:** Define `maxMultiplier` as the highest tier reached during the run (interpretation a). The game-over display shows "Max Multiplier: x3" meaning the player reached tier 3 at some point. This is the most natural interpretation and is independent of pre/post-eat semantics.

## Finding 17 — `START_RUNNER` should reset `maxMultiplier` (Phase A/B)

- **Severity:** Medium
- **Description:** If `maxMultiplier` is added to `GameState`, it must be reset on `START_RUNNER` to prevent stale state from a prior run. The plan does not mention this. The `START_RUNNER` case in `state.ts:50-69` already resets many fields; `maxMultiplier` must be added to the reset.
- **Recommendation:** Specify in Phase B (or Phase A if `maxMultiplier` is added in Phase A): "`START_RUNNER` resets `maxMultiplier` to 1 alongside `score`, `distance`, `snake`, `lane`, `obstacles`, `food`." Update the `START_RUNNER` case in `state.ts:50-69` accordingly.

## Finding 18 — No test for `MOVE_SNAKE` at length 10 with no food eaten (Phase C)

- **Severity:** Medium
- **Description:** The plan's Phase C test list says "does NOT fire at length 11, 21" but does not include "does NOT fire on a tick at length 10 with no food eaten." A MOVE_SNAKE at length 10 that does not eat food: snake length stays at 10, newMultiplier = prevMultiplier = 2, no fire. This is the correct behavior, but a test guards against accidental firing on every tick.
- **Recommendation:** Add to `src/game/__tests__/Engine.test.ts`: "Runner MOVE_SNAKE at length 10 with no food eaten does not fire onMilestone." Setup: state with snake.length=10, food not at the new head position. Dispatch MOVE_SNAKE. Assert `onMilestone` was not called.

## Finding 19 — Phase B's mobile responsive layout not specified (Phase B)

- **Severity:** Medium
- **Description:** Phase B adds 3 sections to RunnerHUD (Multiplier, Next Milestone, Max on Game Over). The current RunnerHUD has 5 sections (Score, Distance, Food, Length, Best) and already uses a mobile breakpoint (`@media (max-width: 600px)` at `RunnerHUD.module.css:63-74`). Adding 3 more sections will worsen wrapping. The plan's risk table acknowledges this ("Hide separator on mobile") but does not include a CSS verification step. The plan should specify how the 7-section HUD wraps and what is hidden on mobile.
- **Recommendation:** Specify: on mobile (`@media (max-width: 600px)`), the Multiplier and Next sections wrap below the row of (Score, Distance, Food, Length, Best). The separator is hidden (existing). The `Max Multiplier` stat in RunnerGameOver is also hidden on mobile (reduces to 4 stat rows). Alternatively, hide the `Next` section on mobile and keep Multiplier inline. Pick one and document the CSS.

## Finding 20 — `MILESTONES` could be derived from `getMultiplier` tier values (Phase A)

- **Severity:** Low
- **Description:** The plan hard-codes `[10, 20, 30, 50]` as the milestone boundaries. A more maintainable approach is to derive them from `getMultiplier`: iterate lengths 3 to 60, collect lengths where `getMultiplier` changes. This guarantees the milestone list is always in sync with the function. However, this adds complexity for a small benefit.
- **Recommendation:** Keep the hard-coded `MILESTONES` constant for clarity, but add a unit test that verifies every milestone in the constant is a tier boundary: `for (const m of MILESTONES) { expect(getMultiplier(m - 1)).toBeLessThan(getMultiplier(m)); }`. This catches drift if `getMultiplier` is changed.

---

# Handoff Assessment

## Phase structure

**Assessment:** Strong.

The 5-phase structure is clean: scoring engine (A) → UI (B) → celebration (C) → course gen (D) → docs (E). Each phase has a clear goal, a list of files to change, implementation details, tests, and verification steps. The dependency graph is explicit and correct.

**Concerns:**
- Phases A, B, C, D could be sub-phased further (e.g., A.1 = `getMultiplier` function, A.2 = state.ts integration, A.3 = tests) for finer-grained handoff. The current granularity is acceptable for a single-developer plan but may benefit from sub-phases if execution is interrupted.
- Phase E's "5 gameplay recordings" is the longest single step (estimated 1-2 hours per recording × 5 = 5-10 hours). Consider splitting into E.1 (infrastructure + 1 test recording) and E.2 (remaining 4 recordings + owner questions).

## Task decomposition

**Assessment:** Strong, with one gap.

Each phase's "Files expected to change" table is clear. The "Implementation details" section provides code snippets that are ready to implement. The "Tests" section lists specific test cases with expected values.

**Concern:**
- Phase C's "Engine.dispatch() adds milestone detection" shows the dispatch logic but does not specify the `onMilestone` callback declaration on the Engine class nor the cleanup in RunnerGame. An AI implementer may add the dispatch logic but forget the declaration/cleanup, leading to silent callback failure.

## Verification strategy

**Assessment:** Adequate, with gaps.

The verification steps in each phase (`npm test`, `npx tsc --noEmit`, `npm run lint`, `npm run build`) are correct and consistent with the project's quality gates. Phase D includes `npm run dev` for manual visual verification.

**Gaps:**
- No regression test for classic-mode scoring after Phase A's refactor.
- No test for the non-food-eaten case in Phase C (MOVE_SNAKE at length 10 with no food).
- No end-to-end recording or screenshot for Phase B's HUD additions.
- Phase D's verification is "manually verify" — no automated check that the risk distribution matches the design.

## Definition of Done

**Assessment:** Adequate, with one gap.

The DoD section is a flat list of checkboxes for each phase's deliverables, plus validation criteria (recordings, owner questions, project owner confirmation). The criteria are verifiable.

**Gap:**
- The DoD says "5 gameplay recordings created in `docs/Milestone 14_validation/`" but does not specify the storage policy (commit vs. external). Add: "Recordings stored externally; only README.md and screenshots committed."

## AI-agent execution readiness

**Assessment:** Moderate.

The plan is mostly ready for an AI agent to execute, with some clarifications needed.

**Blockers (must resolve before AI execution):**
- `getMultiplier` function placement (Finding 1)
- Pre-eat vs. post-eat multiplier semantics (Finding 2)
- `maxMultiplier` state location and lifecycle (Finding 3, 17)
- `Engine.onMilestone` declaration and cleanup (Finding 4)
- Validation directory name (Finding 5)
- Phase D's placement logic (Finding 6)

**Clarifications (should resolve):**
- SPEC.md sub-sections to update (Finding 8)
- ARCHITECTURE.md sub-sections to update (Finding 9)
- Mobile responsive layout (Finding 19)
- Length-based risk mechanism or justification (Finding 15)

**Non-blockers (can be resolved during execution):**
- Test file naming and approach
- CSS class names for the new HUD sections
- Sound gain values for tiers (Finding 14)

---

# Supplementary Review (Second Reviewer Perspective)

A second reviewer produced a substantive critique focused on a concern the first review did not foreground: **the plan may satisfy PRD §5/§6/§7 mechanically (multiplier reaches x3, length reaches 20) without satisfying them behaviorally (food is sometimes skipped, food is sometimes pursued despite danger)**. The second reviewer's points are valid and are integrated below.

## Core Concern: Growth Visibility vs. Growth-Driven Decisions

The plan allocates the majority of its implementation effort to:

- **Multiplier System** (Phase A) — scoring consequence of growth
- **HUD Changes** (Phase B) — surface visibility of multiplier / next milestone
- **Celebration Effects** (Phase C) — feedback when crossing tier thresholds
- **Risk Placement** (Phase D) — only the mechanism that actually changes the player's decisions

The second reviewer correctly identifies that this is the **wrong priority order**. PRD §5 success question is "Does growth change decisions?" — not "Does growth change score?" or "Does growth look good?" The plan's Mechanism E (multiplier) is necessary but insufficient. Mechanism E creates *visibility* of growth. It does not by itself create *decision pressure* — a player can collect every food they see and accumulate a higher score without any decision changing.

The PRD §7 failure criterion E ("Length 3 and Length 30 play identically") is the most direct test of this. Under the current plan, a length-3 player and a length-30 player experience the same gameplay; the only difference is that the length-30 player earns more points per food. That is a scoring difference, not a decision difference.

**Where this overlaps with the first review:**
- Finding 15 (no length-based risk mechanism) already touches this concern, but the first review framed it as "add a length-based mechanism or document why PRD §7E is satisfied by Mechanism E alone." The second reviewer goes further: **Mechanism E alone does not satisfy §7E**, and the plan should not pretend otherwise.

**Where this is new:**
- The first review treated Phase D as one of four roughly equal phases. The second reviewer correctly identifies Phase D as **the load-bearing phase** of the entire milestone. Without Phase D producing real decision pressure, the milestone is "Score Multiplier System" rather than "Growth-Based Risk System."

## Required Changes from Second Reviewer

### Change 1: Validate Behavior Change, Not State Change

The DoD currently references PRD §6's 5 observable success criteria (food skipped, food pursued despite danger, route influenced, death by greed, long runs protected) but the validation evidence is "5 recordings + 5 owner questions." This is a state-based checklist, not a behavior-based one.

**Recommendation:** Add specific recording-based evidence requirements:

- Recording must show at least one moment where a player **skips** food that is reachable and visible.
- Recording must show at least one moment where a player **pursues** food across a dangerous lane despite a safe alternative.
- Recording must show at least one moment where the player **changes route** because food is on the other side.
- Recording must show at least one **death caused by food pursuit** (e.g., player dies 1-2 seconds after collecting food in a high-risk position).

If recordings do not show these behaviors, the milestone fails regardless of the multiplier or HUD work being correct.

### Change 2: Reframe Phase Priorities

Current phase weights:

| Area | Current Plan Effort | Required Effort |
|------|---------------------|-----------------|
| Multiplier System (Phase A) | High | Medium |
| HUD Changes (Phase B) | High | Low |
| Celebration Effects (Phase C) | Medium | Low |
| Risk Placement (Phase D) | Medium | **Very High** |
| Growth Gameplay Impact | Low (implicit) | **Very High** |

**Recommendation:** Reorder and rebalance:

1. **Risk-aware food placement** (Phase D): highest effort, highest scrutiny
2. **Growth pressure mechanisms** (new sub-phase or extension of D): explicitly length-driven, not distance-driven
3. **Multiplier system** (Phase A): supporting mechanism, not the goal
4. **HUD support** (Phase B): necessary but minimal
5. **Celebration effects** (Phase C): optional polish, may be deferred

### Change 3: Food Risk Should Create Competing Incentives, Not Just Difficulty

Phase D's current Safe/Medium/High scheme is based on **obstacle count**. A "Medium" row has 1 obstacle; a "High" row has 2 obstacles. The "risk" is the obstacle density, not the **choice** the player faces.

A better framing:

- **Safe lane**: no food, easy navigation
- **Risk lane**: food, harder navigation (or food at the cost of a different risk)

The current implementation "places food relative to obstacles." The second reviewer recommends placing food relative to **choices**: the food should be on a path that requires the player to deviate from the safe path. The risk is the *cost of the deviation*, not the obstacle count.

**Example of choice-based placement (not in plan):**
- Player's natural forward path is the center lane.
- Food is in the left lane, 5 rows ahead.
- A 2-obstacle row in the center lane forces the player to choose: stay center and skip food, or move to left lane and take the food.
- The risk is not "is there an obstacle near the food" — it is "does the player accept a different route to get the food."

### Change 4: Tail Pressure Is a Hypothesis, Not a Solved Mechanism

The plan claims: "Tail Pressure (A) — Existing lane-blocking mechanic (already in place — no code changes needed)."

The second reviewer pushes back: this assumption is unproven. Looking at the M13.5 recording (per the second reviewer's claim; not directly verified in this review), tail pressure was almost invisible because the snake rarely became long enough for the body-at-headY check to matter. In typical runs, the snake is length 3-8. The tail lane blocking is meaningful only when the snake's body extends across multiple lanes at the head's Y position — which requires a snake of length ~10+ distributed across lanes.

**Recommendation:** Do not claim Tail Pressure is solved. Treat it as a hypothesis to validate in Phase E. Add to the validation:

- Record gameplay at length 10, 20, 30.
- Review: can a viewer actually see growth creating navigation constraints?
- If not, tail pressure remains unsolved and Phase D must compensate.

**Where this overlaps with the first review:**
- First review noted that Mechanisms A and C are double-counted as the same code path. The second reviewer goes further: A may not even be a working mechanism at typical run lengths.

### Change 5: Milestone Celebrations Are Overbuilt

Phase C specifies 4 tier-specific sound designs with increasing complexity (2-tone, 3-tone, 4-tone, 5-tone chord). This is significant audio engineering for a milestone whose gameplay impact is unvalidated.

**Recommendation:** Simplify. Required minimum:
- A single milestone sound (reused for tiers 2, 3, 4, 5 with slight pitch variation).
- A HUD flash on the multiplier section.

Optional polish (defer until after validation):
- Tier-specific harmonic progressions.
- Animation escalation.

The argument: **growth impact is more important than celebration quality.** Spending 30% of phase C effort on audio design for an unvalidated gameplay mechanism is the wrong priority.

**Where this overlaps with the first review:**
- First review Finding 14 noted Tier 5 sound clipping risk. Both reviews agree Phase C is overbuilt.

### Change 6: HUD Expansion May Be Larger Than Necessary

Phase B adds 3 new sections to RunnerHUD (Multiplier, Next Milestone, Max Multiplier). The current HUD has 5 sections. Adding 3 brings it to 7-8 sections during active play. On mobile (where most players will be), this is information-dense.

**Recommendation:** Prioritize during active play:
- **Score** (existing): primary feedback
- **Length** (existing): growth signal
- **Multiplier** (new): growth-consequence signal

Defer to game-over or settings:
- **Next Milestone** (new): can be inferred from Multiplier color change
- **Max Multiplier** (new): game-over stat, not active HUD

The principle: the player should care about **growth**, not **milestone forecasting**. Showing the next milestone is a UI affordance that may make the player optimize for the next threshold rather than the current risk.

**Where this overlaps with the first review:**
- First review Finding 19 noted mobile responsive layout not specified. Both reviews agree the HUD is information-heavy.

### Change 7: Validation Criteria Should Be Concrete

The DoD references PRD §6 (observable success criteria) and §20 (project owner questions), but the evidence is subjective ("Project owner answers YES to all 5 questions").

**Recommendation:** Add concrete recording-based checks before the project-owner subjective review. Required observations in recordings:

- **A. Food intentionally skipped** — player passes through a row with food without changing lane.
- **B. Food intentionally pursued despite danger** — player crosses into a high-risk lane to collect food.
- **C. Route change caused by food** — player changes lane 2+ times in a single lap to pursue a food item.
- **D. Death while pursuing food** — player dies within 1-2 seconds of collecting food in a high-risk position.

If the recordings show all 4, the milestone is behaviorally validated. If any are missing, the milestone fails.

**Where this overlaps with the first review:**
- The first review's "Post-Implementation Review Checklist" mirrors PRD §6 but does not specify the methodology for verifying each criterion. The second reviewer's concrete recording observations are an actionable methodology.

### Change 8: Add a Mid-Milestone Decision Gate

Current execution order: A → B → C → D → E. This is risky because if Phase D fails to create meaningful choices, most of the milestone's effort (A, B, C) has already been spent on supporting mechanisms for a non-working core.

**Recommendation:** Reorder to fail fast:

```
A (multiplier) → D (risk placement) → Validation Gate
   ↓ successful
B (HUD) → C (celebration) → E (docs)
   ↓ unsuccessful
Rework risk system before proceeding to B/C
```

**Rationale:** Phase D is the most uncertain phase (it depends on game design intuition, not engineering). Validating Phase D's behavioral impact *before* building the HUD and celebration that depend on it prevents wasted work. If Phase D does not produce the 4 recording observations in Change 7, the implementation should pause and the risk system should be reworked before Phase B/C effort is spent.

**Trade-off acknowledged:** This reordering delays the visible artifacts (HUD, sounds) that the project owner can review. The project owner may want to see the multiplier display before seeing the risk system. The recommendation is: show the multiplier in a minimal HUD (no celebration, no next-milestone) for early validation, then expand to the full HUD only after Phase D is validated.

### Change 9: Risk Placement Should Scale With Multiplier/Length, Not Distance

Phase D's current risk bands are distance-based:

- distance < 100: always safe
- distance 100-300: mixed
- distance > 300: mostly risky

The PRD §8 explicitly defines tiers by **length**, not distance. A length-30 snake at distance 50 and a length-3 snake at distance 50 are in different tiers and should face different risk. The current plan treats them identically.

**Recommendation:** Tie risk generation to **current length** (or current multiplier) instead of distance:

- length 3-9 (tier 1): food always on safe rows
- length 10-19 (tier 2): food on safe or medium rows, biased toward safe
- length 20-29 (tier 3): food on medium rows, occasionally high
- length 30-49 (tier 4): food on high rows, occasionally medium
- length 50+ (tier 5): food on high rows, rarely safe

This makes the risk **grow with the player**, not with survival time. A new player at distance 0 faces safe food; an experienced player at length 30+ faces risky food regardless of distance. The growth pressure is tied to the growth metric, not the time metric.

**Where this overlaps with the first review:**
- First review Finding 15 noted "no length-based risk mechanism." The second reviewer's recommendation is the concrete implementation: tie risk to length.

### Change 10: Add Per-Death Failure Analysis to Validation

After each recording, the project owner and AI reviewer should answer for each death:

1. Why did the player die? (collision with obstacle / wall / self)
2. Was food involved in the death? (just ate food / pursuing food / moved for food)
3. Was growth involved? (longer snake contributed to the crash)
4. Would a shorter snake have survived? (counterfactual analysis)

This directly evaluates whether growth is influencing gameplay at the moment of failure. If 0% of deaths are growth-related, the milestone has not changed behavior. If 30%+ are growth-related, the milestone is producing real risk.

## New Detailed Findings (Second Review)

### Finding S1 — Phase D is the load-bearing phase, not Phase A (Phase D)

- **Severity:** Critical
- **Description:** The plan treats Phase A (multiplier) and Phase D (risk placement) as roughly equal phases. The PRD §5 success question is "Does growth change decisions?" — only Phase D (risk placement) creates decision pressure. Phase A creates score pressure, which is a downstream consequence. The plan's effort allocation is inverted.
- **Recommendation:** Reorder execution to A → D → validation gate → B → C → E. If validation gate fails, rework Phase D before B/C.

### Finding S2 — Risk placement is distance-based but should be length-based (Phase D)

- **Severity:** Critical
- **Description:** Phase D uses `distance` as the risk driver: "distance < 100 = always safe," "distance > 300 = mostly high." A length-3 snake and a length-30 snake at the same distance face identical food risk. This is incorrect: PRD §8 ties tiers to length, not distance. The growth pressure should be tied to growth (length), not survival time.
- **Recommendation:** Replace distance bands with length/multiplier bands. Example: `tier = getMultiplier(snake.length)`, `risk = mapTierToRisk(tier)` where `tier 1 = safe`, `tier 2 = safe/medium`, `tier 3 = medium`, `tier 4 = medium/high`, `tier 5 = high`. This makes the risk grow with the player.

### Finding S3 — Tail Pressure claim is unproven (Phase A Overview)

- **Severity:** High
- **Description:** The plan claims "Tail Pressure (A) — Existing lane-blocking mechanic (already in place — no code changes needed)." This is unproven. The body-at-headY check at `state.ts:91-95` only blocks lane changes when the snake's body is at the same Y as the head. For a length-3 or length-5 snake, this almost never happens. The mechanism is only meaningful at length 10+. The plan should treat this as a hypothesis, not a solved mechanism.
- **Recommendation:** Add to Phase E validation: "Record gameplay at length 10, 20, 30. Review: can a viewer see growth creating navigation constraints? If not, tail pressure is not a working mechanism and Phase D must compensate." Update the plan's "Overview" section to mark A as "to be validated in Phase E," not "in place."

### Finding S4 — Food risk should be choice-based, not obstacle-based (Phase D)

- **Severity:** High
- **Description:** Phase D's risk levels are based on obstacle count: "0 obstacles = safe," "1 obstacle = medium," "2 obstacles = high." This is a proxy for difficulty, not a "choice" framing. A high-risk placement (2 obstacles) is still a deterministic pattern — the player can learn the obstacle layout and the food location. A choice-based placement would: (a) put food on a path the player must deviate to reach, regardless of obstacle count; (b) create a competing incentive where the safe path is clear but food-free, and the risky path has food.
- **Recommendation:** Re-frame Phase D's placement logic. Instead of "find a row with N obstacles and place food there," use "place food such that reaching it requires deviating from the player's current lane for at least K rows." Add a test: "food placement requires at least 1 lane change to reach from the player's starting position."

### Finding S5 — Validation criteria are state-based, not behavior-based (Phase E)

- **Severity:** Critical
- **Description:** The DoD references PRD §6's 5 observable success criteria but the validation evidence is "5 recordings + 5 owner questions." This is a state-based checklist (multiplier reached x3, length reached 20) that can be satisfied without behavior change. The PRD §5 question is "Does growth change decisions?" — decisions are observable in recordings but not in state.
- **Recommendation:** Add concrete recording observations as DoD prerequisites (per Change 1 and Change 7 above). If the recordings do not show all 4 behaviors (food skipped, food pursued, route changed, death by food), the milestone fails regardless of state checks passing.

### Finding S6 — Phase C is overbuilt relative to validated impact (Phase C)

- **Severity:** Medium
- **Description:** Phase C specifies 4 tier-specific sound designs with increasing complexity. This is significant implementation effort for a celebration mechanism whose gameplay impact is unvalidated. The argument: if Phase D fails to create decision pressure, Phase C's elaborate sounds are celebrating a non-working system.
- **Recommendation:** Defer the tier-specific harmonic progression to a follow-up milestone. Ship Phase C with: (a) a single milestone sound with slight pitch variation per tier; (b) a HUD flash on the multiplier section. Reserve the elaborate audio design for after Phase D's behavioral validation.

### Finding S7 — HUD is information-dense; defer non-essential sections (Phase B)

- **Severity:** Medium
- **Description:** Phase B adds 3 new sections to RunnerHUD (Multiplier, Next Milestone, Max Multiplier). On mobile, 7-8 sections during active play is overwhelming. The "Next Milestone" section in particular may cause the player to optimize for the next threshold rather than current risk.
- **Recommendation:** During active play, show only: Score, Distance, Length, Multiplier (4 sections, existing 4 + 1 new). Defer "Next Milestone" to the settings/help screen or to a tooltip on the Multiplier section. Show "Max Multiplier" only on the Game Over screen.

### Finding S8 — Execution order should fail fast on Phase D (Phase Order)

- **Severity:** High
- **Description:** The current execution order A → B → C → D → E is risky: if Phase D fails, the multiplier/HUD/celebration work is wasted. Phase D is the most uncertain phase (game design, not engineering) and should be validated first.
- **Recommendation:** New order: A (minimal — just the scoring change) → D (risk placement) → Validation Gate (1 recording, behavioral checks) → B (HUD) → C (simplified celebration) → E (docs). If validation gate fails, pause and rework D before B/C.

## Cross-Reference: How This Review Complements the First Review

The first review focused on **execution-readiness** issues: file placement, state lifecycle, callback wiring, documentation specificity, mobile layout, and missing tests. These are real blockers for an AI implementer.

The second review focuses on **design impact** issues: behavior change vs. state change, decision pressure vs. visibility, and the load-bearing role of Phase D. These are real blockers for the milestone succeeding at its goal.

Both reviews agree on:
- Phase D's placement logic is weak (first review Finding 6, second review Findings S2, S4).
- Mechanism A (tail pressure) is overstated (first review's Mechanism A/C double-counting note, second review Finding S3).
- Phase C is overbuilt (first review Finding 14 on sound clipping, second review Finding S6).
- HUD is information-heavy (first review Finding 19, second review Finding S7).
- Validation is too subjective (first review's Post-Implementation Review Checklist, second review Findings S1, S5).

The two reviews diverge on:
- The first review treats Phase A and Phase D as roughly equal phases. The second review identifies Phase D as the load-bearing phase and recommends reordering execution.
- The first review accepts the multiplier (Mechanism E) as the primary mechanism. The second review argues Mechanism E alone does not satisfy the PRD and Phase D is the actual mechanism.
- The first review recommends "Approve with Major Changes" focused on execution-clarity issues. The second review implies a more fundamental design concern: the plan may need restructuring around Phase D as the central phase.

## Summary of New Critical / High Issues (from Second Review)

**Critical (3 new):**
- Finding S1: Phase D is the load-bearing phase; plan effort allocation is inverted
- Finding S2: Risk placement is distance-based, should be length-based
- Finding S5: Validation is state-based, should be behavior-based

**High (3 new):**
- Finding S3: Tail pressure (A) is unproven
- Finding S4: Food risk is obstacle-based, should be choice-based
- Finding S8: Execution order does not fail fast on Phase D

---

# Final Recommendation (Combined Review)

**Approve with Major Changes — and reconsider the design priority**

The first review identified 2 Critical + 6 High execution-readiness issues. The second review identified 3 Critical + 3 High design-impact issues. **Combined, the plan has 5 Critical + 9 High issues that must be resolved before the plan can be executed and have a credible chance of satisfying the PRD.**

**Critical (5):**
1. `getMultiplier` placement in `constants.ts` is non-idiomatic. *(first review)*
2. Pre-eat vs. post-eat multiplier semantics are ambiguous. *(first review)*
3. **Phase D is the load-bearing phase; plan's effort allocation inverts priority.** *(second review)*
4. **Risk placement is distance-based; should be length-based to align with PRD §8 tier definitions.** *(second review)*
5. **Validation criteria are state-based; should be behavior-based with concrete recording observations.** *(second review)*

**High (9):**
6. `maxMultiplier` tracking location and lifecycle are unspecified. *(first review)*
7. `Engine.onMilestone` callback declaration and cleanup are unspecified. *(first review)*
8. Validation directory name drifts from the PRD. *(first review)*
9. Phase D's placement logic is inconsistent. *(first review, also second review S4)*
10. No length-based risk mechanism. *(first review, also second review S2)*
11. `maxMultiplier` reset on `START_RUNNER` is not specified. *(first review)*
12. **Tail Pressure (A) claim is unproven; should be treated as a hypothesis to validate.** *(second review)*
13. **Food risk is obstacle-based; should be choice-based for meaningful decision pressure.** *(second review)*
14. **Execution order does not fail fast on Phase D; should be A → D → validation gate → B → C → E.** *(second review)*

**Architectural concern raised by second review:**
The plan's design priority is "growth visibility" (multipliers, HUD, celebrations). The PRD's success criterion is "growth-driven decisions" (route pressure, decision pressure). These are different. The plan needs to rebalance toward Phase D (risk placement) and away from Phase C (celebration polish) to satisfy the PRD. The plan's current effort allocation may satisfy PRD §6/§7 mechanically (state checks pass) without satisfying them behaviorally (no decision change).

**Recommended resolution before approval:**

The plan should be revised to:

1. **Move Phase D before Phase B/C in execution order** (with a validation gate between D and B/C).
2. **Tie Phase D's risk placement to length/multiplier, not distance.**
3. **Reframe Phase D's placement logic as choice-based, not obstacle-count-based.**
4. **Add concrete behavioral observations to the DoD** (food skipped, food pursued, route changed, death by food).
5. **Simplify Phase C** to a single sound + HUD flash, deferring tier-specific harmonic progression to a follow-up.
6. **Defer "Next Milestone" HUD section** to settings or game-over only; keep active HUD to Score, Distance, Length, Multiplier.
7. **Mark Mechanism A (tail pressure) as a hypothesis to validate**, not a solved mechanism.
8. **Resolve the first review's execution-readiness issues** (file placement, state lifecycle, callback wiring, validation directory name, SPEC/ARCHITECTURE update specificity, etc.).

After these revisions, the plan can be approved and executed. The first set of changes (1-3) is a design re-prioritization; the second set (4-7) is a simplification of overbuilt elements; the third set (8) is execution-clarity. None require architectural rewrites — they are scope and priority adjustments within the existing milestone.

**The single question to evaluate this milestone's success:** Does a length-30 snake make different decisions than a length-3 snake? If the answer is no, the milestone fails regardless of multiplier, HUD, or sound work. The plan as written has a meaningful risk of producing "yes, the score is higher" without producing "yes, the decisions are different."
