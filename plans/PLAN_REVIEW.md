# Plan Review — Milestone 10: Gameplay Expansion

**Plan under review:** `plans/ACTIVE.md` (Milestone 10 — Food Variants, Wrap-Around, Portals)
**Reviewer role:** Staff Engineer
**Date:** 2026-06-07
**Baseline:** v0.9.0 (M9 complete), 212 unit tests passing

---

# Overall Assessment

## Strengths

- **Roadmap alignment is precise and well-scoped.** The three feature tracks (food variants, wrap-around, portals) map directly onto the M10 features listed in `docs/ROADMAP.md` §Milestone 10. The plan inherits the "Design Note — Visual Tokens Added" rationale from the ROADMAP and re-states it in its own "Visual Design Additions" section, which is exactly the kind of traceability a future maintainer needs.
- **Scope discipline is exceptional.** The "Out of Scope" list is unusually thorough (14 explicit non-goals) and aligns with `AGENTS.md`'s "ship the game" philosophy. Moving obstacles, enemy snakes, boss levels, achievements tied to food variants, and per-level probability configuration are all cleanly deferred. The "Why Each Phase Is Not Over-Engineered" and "What Was Explicitly Rejected" subsections are a strong handoff artifact.
- **Cross-Phase Constraints are well-designed guardrails.** Especially #1 (one food at a time), #4 (no architecture changes), #6 (deterministic tests via `makeState`), and #7 (test file convention). These would prevent an implementation agent from over-extending the work.
- **Type-level refactor is shaped to minimize cascading changes.** Changing `GameState.food: Position` to `Food` is a deliberate breaking change that is contained to a small number of files; the plan correctly identifies the touch points (`BoardProps`, `CellProps`, `state.ts`, `food.ts`, `Engine.ts`, components) and the test-helper that anchors everything.
- **Phases are independently shippable and revertable.** Each phase is its own commit/PR with no forward dependencies. The ordering is justified (Phase 1 introduces the `Food` shape that the board/cell components will read in Phases 2 and 3).
- **Concrete file references with line numbers.** The plan references `src/game/__tests__/state.test.ts:6`, `Game.tsx:185`, `Game.tsx:217`, `Engine.ts:167`, and `src/game/levels.ts:79-85`. I verified each of these line numbers against the current source — they all check out.
- **Documentation updates are well-catalogued.** Phase 4 enumerates exactly which sections of SPEC.md, ARCHITECTURE.md, ROADMAP.md, and PROJECT_STATE.md must change. This is significantly more thorough than the previous milestones.
- **Visual token addition is justified by the M8 palette constraint.** The plan correctly identifies that the existing 18-token palette is fully consumed (food = danger, obstacles = indigo, snake = green, etc.), so the 3 new tokens (poison magenta, slow cyan, portal purple) are necessary, not arbitrary.
- **Risk and assumption table is thorough.** 12 risks identified; mitigations are concrete. Particularly strong: Risk 10 (existing 212 tests break from `Food` shape change) — this is the highest-impact risk and is correctly flagged.

## Weaknesses

- **A `Food` type shape change touches every existing test that constructs state.** The plan updates `makeState` (Phase 1.4) but does not enumerate the inline `food: { x, y }` overrides scattered through `src/game/__tests__/state.test.ts` (e.g., lines 100-108, 114-127, 130-141, 210-220, 234-249, 254-272, 274-289, 292-...). These will all fail to typecheck after the type change. The plan should call this out as a sub-task, not just a risk.
- **Behavior of stacking / re-eating slow food is unspecified.** If the snake eats slow food while `speedEffectTicks > 0`, the plan's `MOVE_SNAKE` step says `speedEffectTicks = 10` (assignment, not increment). This resets the effect, which is a sensible default but should be stated explicitly with a one-line test.
- **One decision is left as "or" in Phase 3.5.** "`spawnFood(snake, obstacles, portals: Position[] = [])` ... Backward compatible: omit the third argument to get the previous behavior." The plan does not commit to whether the third argument is required (with `[]` default) or optional (`portals?: Position[]`). Pick one. Same ambiguity for the `getPortalPositions` helper — the plan does not specify whether it returns an empty array or `undefined` for non-portal levels.
- **The "Determinism for tests" constraint partially contradicts the "statistical smoke test" verification.** Cross-Phase Constraint #6 says tests must not rely on `Math.random`, but Phase 1.10 lists a "statistical smoke test (at least 2 of {gold, poison, slow} appear in 200 spawns)". With 5%/5% spawn rates, the probability of one of {gold, poison, slow} being absent in 200 spawns is `0.90^200 ≈ 7.5e-10` for a single type, so 2 of 3 absent in 200 is astronomically unlikely. The test is safe in practice, but the constraint wording should clarify that this is the one allowed stochastic assertion.
- **`Cell.tsx` prop signature change is not described as a backward-compatibility step.** Replacing `isFood: boolean` with `foodType?: FoodType` will change the call sites in `Board.tsx` (the plan covers this), but existing `Cell.test.tsx` (4 tests) all use the old `isFood={false}` prop. The plan does not call out updating those tests, only adding new ones. After the change, the existing 4 tests will continue to compile (optional prop) but they test a no-longer-relevant code path.
- **SLOW badge position / styling in ScoreBoard is unspecified.** The plan says "show a 'SLOW' badge with the remaining tick count, positioned next to the score section" but the existing `ScoreBoard.module.css` has a fixed flexbox layout. An implementer would need to add a new CSS class and place it in a specific `.section`. The plan should either commit to a placement or list it as an open question.
- **The plan does not address dev-level select entry to wrap / portal levels.** The dev select already supports `START_AT_LEVEL(N)` (M6). The plan correctly excludes "Wrap-around or portal configuration UI in dev level select" from scope, but does not confirm that the existing dev select can already be used to test levels 5 and 7. (It can, but a one-line note would be helpful.)
- **No ADR is created for the new game-mechanic primitives.** Per `AGENTS.md`, "changing core gameplay architecture" should create an ADR. Adding a `Food` object with type/timer/effect is a non-trivial state-shape change. The previous milestones (M8 visual identity, M9 replayability) also did not create ADRs for additive changes, so this is consistent with project practice — but a lightweight ADR documenting the design rationale (one global probability table, single food at a time, decoupled timer fields) would benefit future contributors.

## Major Risks

1. **Cascading test failures from the `food: Food` shape change.** The single largest implementation risk. The plan correctly identifies it (Risk 10) but the mitigation ("Update `makeState` and any test constructing `food: Position` directly; do this in the same commit as the type change") understates the scope. `state.test.ts` alone has approximately 12+ inline `food: { x: ..., y: ... }` overrides (lines 100-300+) that will all need rewriting. The implementer must do a project-wide search and replace.
2. **Wrap-around + portal interaction is undefined-by-design but undocumented in the test matrix.** The plan says "no level has both" (Cross-Phase Constraint #5; Risk 5) and the "explicit ordering in `MOVE_SNAKE`" (wrap first, then portal). This is fine, but a test that asserts "on a hypothetical level that has both, wrap is applied first" is missing. Without this, a future refactor could silently swap the order and only the level-up tests would fail.
3. **Statistical smoke test is the only stochastic test.** A 200-spawn test with 5%/5% rare events is technically fine, but if a test runner has different entropy behavior (e.g., a CI worker) the test could be flaky. The plan should specify `vi.spyOn(Math, 'random')` to use a deterministic sequence instead, or accept the current approach and document the small failure probability.
4. **Poison food shrinking at length 3 (the initial snake length) is a gameplay regression risk.** Players who lose food variants at start will see "snake doesn't shrink — bug?" If they happen to be at length 3, no visible change occurs. The plan handles this correctly (`floor at INITIAL_SNAKE.length`), but the ScoreBoard does not indicate why the snake did not shrink. A future UX improvement would be a brief flicker or sound, but that is explicitly out of scope (M11+).
5. **Cell rendering is a memoization risk.** The current `Cell` is wrapped in `React.memo`. Adding `foodType?: FoodType` is a primitive prop, so memoization should continue to work. The plan assumes this in Assumption 9. However, the `Board` passes the same `food` object reference on each render (until the snake moves), so `foodType` is a string primitive — memoization holds. This is correct but worth a one-line note in the plan that an implementer can verify by reading `Cell.tsx:1` (`memo(...)`).
6. **`Engine.ts` slow-effect multiplier interleaves with the accumulator.** The plan modifies line 167 in `Engine.ts` (the `tick()` callback) to multiply speed by 1.3. This is a small surface change, but the `accumulator` is reset to 0 after every `MOVE_SNAKE`. If the multiplier is applied after the accumulator check (which the plan correctly specifies), then a slow effect can cause the player to perceive irregular movement if the accumulator has overshot `speed * 1.3` but not `speed`. The plan does not address this minor feel issue (e.g., "the slow effect can cause one extra `MOVE_SNAKE` to fire on the first tick after the effect begins"). This is borderline acceptable; worth a one-line acknowledgment.

## Recommended Changes

- Add a Phase 1.4 sub-task: "Update all inline `food:` overrides in `state.test.ts` (and any other test files) to use the new `Food` shape. A repository-wide search for `food: { x:` should yield zero results after the change."
- Specify slow-effect stacking: "If the snake eats slow food while `speedEffectTicks > 0`, the effect is reset to 10 ticks (last-write-wins). Add a test for this."
- Commit to a `spawnFood` signature: `spawnFood(snake: Position[], obstacles: Position[] = [], portals: Position[] = []): Food`. Make `portals` required-with-default for clarity, not optional.
- Add a `portals?: Position[]` empty-array return for `getPortalPositions(1)` and friends, not `undefined`. This avoids downstream null checks.
- In Cross-Phase Constraint #6, carve out an explicit exception: "The one allowed stochastic test is the food-type statistical smoke test in Phase 1.10. All other food-related tests must use `makeState` with an explicit `Food` object."
- Add a note in Phase 1.8 saying that the 4 existing `Cell.test.tsx` tests will continue to pass after the change (`foodType` is optional) but should be migrated to use the new prop for clarity.
- Specify SLOW badge placement: "Insert a new `.section` after the score section in `ScoreBoard.tsx`, with class `slowBadge` styled in `ScoreBoard.module.css`. The badge shows `SLOW (N ticks remaining)` when `speedEffectTicks > 0`."
- Confirm (with one line) that the existing dev level select works for testing level 5 and 7 mechanics without changes.
- Consider creating `docs/adr/ADR-004-m10-gameplay-mechanics.md` documenting the design rationale: one global spawn table, `Food` object as the single source of truth, decoupled timer fields, no simultaneous food. (Optional — would benefit future contributors but is not required by the milestone scope.)

---

# Detailed Findings

## F1 — `Food` type change cascades through every test that constructs state

- **Severity:** High
- **Description:** Phase 1.1 changes `GameState.food: Position` to `GameState.food: Food`. The plan updates `makeState` (Phase 1.4) to the new shape but does not enumerate the inline `food:` overrides in `src/game/__tests__/state.test.ts`. I counted at least 12 inline `food: { x: 10, y: 10 }` overrides in the first 300 lines of that file (e.g., lines 100-108, 114-127, 130-141, 210-220, 234-249, 254-272, 274-289, 292-300). These all currently typecheck against `Position` and will fail to typecheck against `Food` after the change.
- **Recommendation:** Add an explicit sub-task in Phase 1.4: "Search the repository for `food: { x:` and `food: {x:` and update every hit to the new `Food` shape. Run `npm run build` and confirm zero TypeScript errors before merging." A short test that greps the codebase for the old shape (or a `tsc` `--noEmit` step in the Phase 1 Definition of Done) would catch any missed site.

## F2 — Slow food re-eat behavior is unspecified

- **Severity:** Medium
- **Description:** Phase 1.4 says `speedEffectTicks = 10` on eating slow food. If the snake eats another slow food while `speedEffectTicks > 0`, the current wording resets the effect. This is a sensible default (avoids stacking / runaway slow) but is not explicitly stated. The plan should commit to one of: (a) reset to 10 (last-write-wins), (b) extend by 10 (additive), or (c) ignore if already active.
- **Recommendation:** Add to Phase 1.4: "If the snake eats slow food while `speedEffectTicks > 0`, reset to 10 ticks (last-write-wins). Add a test in `state.test.ts` that asserts this."

## F3 — `spawnFood` optional `portals` argument wording is ambiguous

- **Severity:** Low
- **Description:** Phase 3.5 says `spawnFood(snake, obstacles, portals: Position[] = [])` and later "Backward compatible: omit the third argument to get the previous behavior." This is a contradiction: `portals: Position[] = []` makes the argument optional, but "previous behavior" implies a different default. In practice both read the same way, but the wording should be unified.
- **Recommendation:** Commit to `spawnFood(snake: Position[], obstacles: Position[] = [], portals: Position[] = []): Food`. The argument is required at the call site (so all callers must think about it), but the default is `[]` (empty array, no portal exclusion). Update the call sites in `state.ts` to pass `getLevelData(state.level).portals?.flat() ?? []`.

## F4 — `getPortalPositions` empty-result return type is unspecified

- **Severity:** Low
- **Description:** Phase 3.8 says "Add a small helper `getPortalPositions(level: number): Position[]` in `src/game/levels.ts` that flattens `portals?.flat() ?? []`." The `??` implies returning `[]` for non-portal levels. This is good. But the helper could also be typed to return `undefined` (forcing callers to handle the absent case). The plan should pick one.
- **Recommendation:** Return `Position[]` (always an array, possibly empty). Callers can do `if (portalSet.size > 0)` if they need to know whether portals exist, or pass the array unconditionally to `Board` (it already filters per-cell).

## F5 — Cross-Phase Constraint #6 partially contradicts Phase 1.10

- **Severity:** Low
- **Description:** Constraint #6 says tests "must construct `Food` objects directly via the `makeState` helper... not rely on `Math.random` rolls." Phase 1.10 lists a "statistical smoke test (at least 2 of {gold, poison, slow} appear in 200 spawns)" which is intrinsically stochastic. The two are in tension. The test is statistically safe (failure probability is astronomically low with 5%/5% rates) but the constraint should explicitly exempt this one case.
- **Recommendation:** Add to Cross-Phase Constraint #6: "Exception: the food-type statistical smoke test in Phase 1.10 is the only allowed stochastic test. All other food-related tests must use `makeState` with an explicit `Food` object."

## F6 — `Cell.test.tsx` migration is not in the plan

- **Severity:** Low
- **Description:** Phase 1.8 changes `CellProps` from `isFood: boolean` to `foodType?: FoodType`. The plan adds new tests for the new prop (lines 230-231 of the plan) but does not call out updating the existing 4 tests in `src/components/__tests__/Cell.test.tsx`, which currently pass `isFood={false}`. After the change, those tests will still compile (the new prop is optional) but they will not exercise the new prop's rendering. This is a low-risk issue but worth a one-line note.
- **Recommendation:** Add a one-line note in Phase 1.10: "The existing 4 `Cell.test.tsx` tests will continue to pass after the prop change (the new prop is optional). Migrate them to the new `foodType` prop for clarity, but this is not blocking."

## F7 — SLOW badge placement / styling in ScoreBoard is unspecified

- **Severity:** Low
- **Description:** Phase 1.9 says "show a 'SLOW' badge with the remaining tick count, positioned next to the score section." The existing `ScoreBoard.module.css` has a strict flexbox layout with separators. Adding a new section requires (a) choosing a position relative to existing sections, (b) defining a new CSS class, (c) considering mobile wrapping (the existing CSS wraps at `@media (max-width: 600px)`). The plan gives no guidance.
- **Recommendation:** Add to Phase 1.9: "Insert a new `.section` after the high-score section, with a `slowBadge` class. The badge is hidden when `speedEffectTicks === 0`. On mobile, it wraps below the score row. Color: `--color-food-slow` to disambiguate from warning colors."

## F8 — Dev-level select entry to wrap / portal levels not confirmed

- **Severity:** Low
- **Description:** The plan excludes "Wrap-around or portal configuration UI in dev level select" from scope, but does not confirm that the existing dev select (M6) can already be used to test levels 5 and 7. Reading `Game.tsx:104-184` and `useGame` confirms that `startGameAtLevel(N)` works for any level and the new mechanics are derived from level metadata at the time of `MOVE_SNAKE`. So the dev select does work — but a one-line confirmation would be helpful.
- **Recommendation:** Add a one-line note in Handoff Notes: "The existing dev level select (M6) can be used to jump to levels 5 and 7 for testing wrap and portal mechanics. No changes to the dev select are needed."

## F9 — No ADR for the new game-mechanic primitives

- **Severity:** Low
- **Description:** `AGENTS.md` lists "Changing core gameplay architecture" as an ADR trigger. Adding a `Food` object with type/timer/effect, plus `wrapAround` and `portals` flags on `Level`, is a non-trivial state-shape change. The previous milestones (M8 visual identity, M9 replayability) also did not create ADRs for additive changes, so this is consistent with project practice. However, the design decisions (one global probability table, single food at a time, decoupled timer fields) are exactly the kind of rationale that would benefit a future contributor.
- **Recommendation:** Optional: create `docs/adr/ADR-004-m10-gameplay-mechanics.md` documenting the design rationale. This is a 30-minute task and would match the "Permanent record of major decisions" purpose of ADRs. Not required for milestone completion, but encouraged.

## F10 — Wrap-around + portal ordering test is missing

- **Severity:** Low
- **Description:** Phase 3.4 says "in `MOVE_SNAKE`, after wrapping (if applicable) and before the collision check: look up portals". The plan correctly specifies the ordering but does not include a test for the combined case. Risk 5 acknowledges the "Portal + wrap interaction is undefined" but says "no level has both" — which is true, but the test for the ordering invariant is what locks it in.
- **Recommendation:** Add a test in `state.test.ts` that synthesizes a hypothetical level with both `wrapAround: true` and a `portals` array, then asserts that on a single `MOVE_SNAKE`, the wrap is applied first, then the portal lookup, then collision. The level data can be constructed inline in the test (no level metadata change required).

## F11 — `Engine.ts` accumulator behavior on slow-effect transition is undocumented

- **Severity:** Low
- **Description:** Phase 1.5 modifies the `tick()` callback to check against `effectiveSpeed = speed * SLOW_EFFECT_MULTIPLIER`. The accumulator is reset to 0 after each `MOVE_SNAKE`. If the slow effect begins mid-accumulation (e.g., accumulator has 110ms and speed is 100ms, multiplier kicks in making effective speed 130ms), the next `MOVE_SNAKE` will not fire until the accumulator reaches 130ms — which can feel like a long pause. This is borderline acceptable behavior but should be acknowledged.
- **Recommendation:** Add a one-line note in Phase 1.5: "The slow effect applies to the current tick's effective speed, not retroactively. Players may notice a brief delay on the first tick after the effect begins if the accumulator has overshot `speed` but not `speed * 1.3`. This is acceptable for M10; tune in M11 if needed."

## F12 — Weighted random selection algorithm is unspecified

- **Severity:** Low
- **Description:** Phase 1.3 says "roll a `FoodType` by weighted random selection". There are several valid algorithms (cumulative weights, table expansion, etc.). The plan should commit to one for consistency with the existing `spawnFood` code style.
- **Recommendation:** Add a one-liner: "Use cumulative-weight selection: compute `total = sum(weights)`, generate `r = Math.random() * total`, find the first type whose cumulative weight exceeds `r`." This is the standard approach and matches the existing `spawnFood` style of using `Math.random()` directly.

## F13 — `Engine.ts` "class-level constants" wording is imprecise

- **Severity:** Low
- **Description:** Phase 1.5 says "Add `const SLOW_EFFECT_MULTIPLIER = 1.3;` at the top of `Engine.ts` (next to the existing class-level constants)." There are no class-level constants in `Engine.ts` — module-level imports only. The instruction is clear in intent (top of file, before the class) but the wording is slightly off.
- **Recommendation:** Rewrite: "Add `const SLOW_EFFECT_MULTIPLIER = 1.3;` at the top of `Engine.ts`, above the `Engine` class declaration."

## F14 — `BoardProps` and `CellProps` type changes are not listed in the file table for the parent files

- **Severity:** Low
- **Description:** Phase 1.6 modifies `src/types/components.ts` (correctly listed in the file table). However, the plan does not call out that `src/components/__tests__/Cell.test.tsx` and `src/components/__tests__/Board.test.tsx` will need prop-type updates (existing tests pass `food: { x, y }`). Same as F6 but for `Board`.
- **Recommendation:** Add to Phase 1.10: "The existing `Board.test.tsx` tests pass `food: { x, y }` and will need to be updated to `food: { position: { x, y }, type: 'normal', timer: -1 }` to satisfy the new `BoardProps` type."

## F15 — `getPortalPositions` test for empty / non-portal levels

- **Severity:** Low
- **Description:** Phase 3.9 lists "`getPortalPositions(7)` returns exactly 2 positions" but does not list a test for non-portal levels (e.g., `getPortalPositions(1)` returns `[]`). This is implied by the helper's `portals?.flat() ?? []` logic but should be explicit.
- **Recommendation:** Add to the `levelData.test.ts` list in Phase 3.9: "`getPortalPositions(1)` returns `[]`; `getPortalPositions(5)` returns `[]`; etc. for all non-portal levels."

## F16 — `useGame` hook is not called out as unchanged

- **Severity:** Low
- **Description:** Assumption 6 says "The current `useGame` hook does not need changes — the engine is the source of truth and components receive new props reactively." This is correct, but the plan does not make the same claim about `useKeyboard` / `useTouch` (which is also true, since both consume `state.status` only). The previous M9 review flagged the same gap (F16) and recommended a one-line note.
- **Recommendation:** Add a one-line note in Handoff Notes: "No changes to `useGame`, `useKeyboard`, or `useTouch` — all new mechanics are derived from `state.food` and `getLevelData(state.level)` at render time."

## F17 — Test file convention cross-reference

- **Severity:** Low
- **Description:** Cross-Phase Constraint #7 specifies the test file convention (new `gameLogic` / `levelData` tests in `src/utils/__tests__/`, new `state` / `Engine` tests in `src/game/__tests__/`). This is correct and matches the current state. However, the plan does not mention `src/components/__tests__/` for the new Cell / Board tests — which is the obvious place. The convention is implicit from the existing `Cell.test.tsx` / `Board.test.tsx` location, but a one-line confirmation would help.
- **Recommendation:** Add to Cross-Phase Constraint #7: "Component tests for `Cell` and `Board` go in `src/components/__tests__/` (existing convention)."

## F18 — Statistical test threshold (2 of 3) is good but unstated rationale

- **Severity:** Low
- **Description:** The Phase 1.10 statistical test says "at least 2 of {gold, poison, slow} appear in 200 spawns". With spawn probabilities 10% / 5% / 5%, the probability that a single special type is absent in 200 spawns is `0.90^200 ≈ 7.5e-10` for gold, `0.95^200 ≈ 3.5e-24` for poison and slow. The probability that 2 of 3 are absent is bounded by the max of these squared, which is negligible. The threshold of "2 of 3" is therefore a near-100% reliable test. The plan should briefly note this.
- **Recommendation:** Optional: add a one-line note in Phase 1.10: "The threshold '2 of 3 special types' is chosen so that the test passes with probability ≈ 1 - 7.5e-20 (negligible failure rate). If a CI environment shows flakiness, lower the threshold to '1 of 3' or replace with `vi.spyOn(Math, 'random')` to use a deterministic sequence."

---

# Handoff Assessment

## Phase structure

**Verdict: Strong.**

- Four phases: 1 (Food Variants), 2 (Wrap-Around), 3 (Portals), 4 (Docs). Each is independently shippable.
- Phase 1 introduces the `Food` object shape that the board/cell components will read in Phases 2 and 3 — the ordering is justified and necessary.
- Phase 4 is a deliberate separation: docs are not bundled into feature phases, matching the pattern established in earlier milestones.
- Each phase has its own Definition of Done with concrete verification steps.

## Task decomposition

**Verdict: Good, with a few small gaps.**

- The file tables per phase (Phase 1: 18 files, Phase 2: 11 files, Phase 3: 14 files, Phase 4: 5 files) are comprehensive and concrete. An implementer can locate the exact insertion points.
- Sub-tasks within each phase (e.g., Phase 1 has 10 sub-tasks 1.1-1.10) are well-scoped.
- Gaps: F1 (inline test overrides not enumerated), F6/F14 (existing component test files not flagged for migration), F7 (SLOW badge placement unspecified). All are addressable in 5-10 minutes each.

## Verification strategy

**Verdict: Comprehensive.**

- Each phase has `npm test`, `npm run build`, `npm run lint`, and a list of manual checks. The manual checks are behavior-driven (e.g., "snake exits right edge → appears on left").
- The pre-flight verification (Phase 0) is a good practice — it catches a broken environment before the implementer starts.
- The cross-cutting "Determinism for tests" constraint (F5 minor wording issue) and the statistical smoke test (F18) together cover the testability of stochastic behavior.
- Gaps: no integration test that verifies `Game.tsx` correctly threads new props (e.g., that `wrapAround={true}` from level metadata reaches `Board`). Existing `Game.test.tsx` is minimal (4 tests) so a small extension is appropriate. (Consistent with the M9 review's F11 finding.)

## Definition of Done

**Verdict: Strong.**

- Phase 1 / 2 / 3 / 4 DoDs all include: file changes applied, tests pass, manual checks confirmed, no accidental file changes.
- The Milestone Definition of Done at the end consolidates the per-phase DoDs and adds: docs updated, version bumped to 0.10.0, git workflow followed. This matches the pattern from M9.
- Missing detail: the `package.json` version bump is committed in Phase 4 (correctly), but the DoD for Phases 1-3 should explicitly say "no version bump in this phase" to prevent premature bumps. (F13 in the M9 review flagged a similar issue; the current plan is mostly fine on this point.)

## AI-agent execution readiness

**Verdict: Good, with small clarifications needed.**

- A follow-on implementation agent could start on Phase 1 with the current plan. The pre-flight checks, file tables, and per-phase verification would give high confidence of unblocked execution.
- The most likely blocker is F1 (the cascading test changes from the `Food` shape). Once that is acknowledged in the plan, execution should be smooth.
- Smaller clarifications (F2, F3, F4, F7, F10, F12) are all single-decision items that an implementer could resolve without re-asking, but baking them into the plan saves a round trip.
- The Simplification Review and "What Was Explicitly Rejected" sections are excellent handoff artifacts — they pre-empt scope creep questions.

---

# Final Recommendation

## Approve with Minor Changes

The plan is exceptionally well-conceived. It is precisely aligned with `ROADMAP.md` §M10, `ARCHITECTURE.md`, and `SPEC.md`, respects the "ship the game" philosophy in `AGENTS.md`, and correctly defers complexity (moving obstacles, enemy snakes, boss levels, per-level food configuration). The Cross-Phase Constraints are strong guardrails, the per-phase file tables are concrete, and the documentation update list is the most thorough of any milestone so far.

The findings are mostly clarifications and small gaps. None of them are blockers, but addressing F1, F2, F3, F4, F5, F7, F10, and F12 before implementation begins will save iteration time and reduce the risk of mid-phase course corrections.

**Conditions for approval:**

1. Resolve F1 (cascade of inline `food:` overrides in tests) with an explicit sub-task in Phase 1.4.
2. Resolve F2 (slow food re-eat behavior) with a one-line spec and a test.
3. Resolve F3 (`spawnFood` third-arg wording) and F4 (`getPortalPositions` empty-result type) with a unified signature.
4. Resolve F5 (constraint #6 vs Phase 1.10 contradiction) by adding an explicit exception.
5. Resolve F7 (SLOW badge placement) with a one-line CSS placement note.
6. Resolve F10 (wrap+portal ordering test) with a synthetic-level test in `state.test.ts`.
7. Resolve F12 (weighted random algorithm) by committing to cumulative-weight selection.

**Recommended but not required for approval** (acceptable as-is or for the implementation agent to decide):

- F6 (existing `Cell.test.tsx` migration): tests will continue to pass; migration is a clarity improvement.
- F8 (dev-level select confirmation): one-line note would be helpful but the current dev select does work.
- F9 (ADR creation): optional, would benefit future contributors but is not required by milestone scope.
- F11 (accumulator behavior on slow transition): one-line note would be helpful but is acceptable as-is.
- F13 (`Engine.ts` "class-level constants" wording): minor rewording.
- F14 (existing `Board.test.tsx` migration): same as F6, for `Board`.
- F15 (`getPortalPositions` empty test): would be a nice-to-have test.
- F16 (`useGame` / `useKeyboard` / `useTouch` no-op note): clarification, not blocker.
- F17 (test file convention for components): clarification, not blocker.
- F18 (statistical test threshold rationale): optional documentation.

Once F1-F7, F10, and F12 are folded in (a 15-20 minute exercise), the plan can be handed to an implementation agent with high confidence of unblocked execution. The estimated implementation effort (3 feature phases + 1 docs phase) is consistent with the milestone's complexity and aligns with the project's prior velocity.

**Implementation is approved to proceed once the conditions above are addressed.**
