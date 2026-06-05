# Plan Review: Milestone 4 — Level Progression System

**Reviewer:** Staff Engineer (Plan Review)
**Plan under review:** `plans/ACTIVE.md` (Milestone 4 — Level Progression System, Draft, 2026-06-05)
**Source documents:** `ROADMAP.md`, `AGENTS.md`, `ARCHITECTURE.md`, `SPEC.md`, `docs/PROJECT_STATE.md`
**Review date:** 2026-06-05

---

# Overall Assessment

## Strengths

1. **Honest pre-implementation diagnosis.** The plan openly documents the three-way conflict between `ROADMAP.md`, `PROJECT_STATE.md`, and the prior `ACTIVE.md` about what Milestone 4 actually is, then resolves it correctly per `AGENTS.md` (ROADMAP is the source of truth for milestone identity).
2. **Codebase-aware.** All file paths, line numbers (`state.ts:70–95`, `Game.module.css:39–51`), and proposed edits line up with what is actually in the repo. I verified every reference — Engine dispatch order, keyboard Space routing, `useTouch` enablement, the existing overlay pattern, and the existing test fixtures.
3. **Right scope for "ship the game".** The single-overlay decision, the placeholder metadata, and the "no architectural churn" stance all match `AGENTS.md`'s `Avoid: premature abstractions, framework building, speculative architecture` guidance.
4. **Strong Definition of Done.** The DoD is concrete and testable. Sound-callback timing, accessibility, d-pad/pause visibility, swipe gating, and the L10 → `won` exception are all enumerated.
5. **Out of Scope table is explicit.** It correctly fences M5/M6/M7/M11 work and calls out the empty `LEVEL_DESIGN.md` so the next agent won't be confused.
6. **Sound callback reasoning is precise.** The plan correctly reasons through the Engine dispatch order in `src/game/Engine.ts:30–61` and explains why `onLevelUp` should fire on `CONTINUE_GAME` (not on the triggering `MOVE_SNAKE`) and why `onEat` fires on the food that triggers level-up.

## Weaknesses

1. **Silent deviation from a ROADMAP success criterion.** ROADMAP M4 has three named features: "Level Metadata System", "Level Introduction Overlay", and "Level Complete Overlay". The plan collapses "Level Introduction" into the post-complete overlay and explicitly drops a separate pre-level intro screen ("Before level 1, the existing idle overlay already serves as an introduction. It will be enhanced with level 1 metadata if time permits"). That is a real scope change from ROADMAP, not a simplification of an internal detail.
2. **No ADR for the single-overlay decision.** Per `AGENTS.md`, "Redesigning the level progression system" is an explicit ADR trigger. Combining two named features into one is exactly that kind of decision, and the rationale belongs in a durable record — not just a paragraph in a draft plan.
3. **Missing file in test maintenance scope.** `src/components/__tests__/Game.test.tsx` mocks the return shape of `useGame()` (lines 47–55, 65–73). Once the hook gains a `continueGame` member, the mock object becomes structurally incomplete and TypeScript will fail `npm run build`. The plan does not list this file in Phase 6.
4. **Engine test coverage is soft-pedalled.** Phase 6 marks the `Engine.test.ts` addition as "(Optional)". Given that `continueGame()` is a new public method on the engine, this should be a required test, not optional. The existing test file already uses fake timers and dispatch mechanics that make it straightforward.
5. **Test churn estimate is imprecise.** "~4 existing state tests will need updating" overstates impact: 2 tests in the "level up" describe block fail directly (`levels up when score reaches target`, `resets snake on level up`); the other 2 (`sets won status when level 10 is completed`, `updates high score on win`) keep passing as-is. The L10-won tests should also be updated to assert "not `levelComplete`" so future regressions are caught.
6. **"Existing ScoreBoard tests pass" is a vacuous claim.** There is no `ScoreBoard.test.tsx` in `src/components/__tests__/`. The plan should not claim a test that does not exist passes.
7. **Pre-existing doc inconsistency is not addressed.** `ARCHITECTURE.md:242` says "116 unit tests", while `SPEC.md:331` and `PROJECT_STATE.md:100,176` say "122 unit tests". The plan updates SPEC.md and PROJECT_STATE.md test counts but does not touch ARCHITECTURE.md. Since Phase 7 already touches ARCHITECTURE.md, fixing the count there is a one-line correction in the same change.
8. **Reducible phase count.** Phases 1 and 2 both edit `src/game/types.ts`. The level metadata extension and the `levelComplete` status / `CONTINUE_GAME` action are all additive type-level changes. They could be a single "extend the type system + reducer" phase to reduce hand-off overhead without losing clarity. Not a blocker; mild improvement.
9. **Implementation of `continueGame()` is shown but its loop semantics are described imprecisely.** The plan says "The loop auto-stops when status becomes `levelComplete` because `startLoop()` checks `status !== 'playing'`." `startLoop()` does not check this directly — it is the `tick()` callback at `Engine.ts:96` that returns early when status is not `playing`. The `rafId` lingers until the next frame. Behavior is correct, but the description is the kind of wording that confuses a future agent reading the code.
10. **Pre-aiming behaviour during `levelComplete` is unspecified.** The keyboard listener still routes direction keys to `onChangeDirection` (`platform/keyboard.ts:38–41`) regardless of status, so a player can pre-aim a direction while the level-complete overlay is up. This is consistent with the existing "pre-aim while paused" behaviour in SPEC §8.2, but the plan never states it — it leaves the reader to infer it.
11. **No touch/swipe story for the `LevelTransition` overlay button.** A touch-only player has no documented way to dismiss the overlay if they have the d-pad hidden and no keyboard. The existing "Start" overlay is dismissed by the `autoFocus` button, which works for touch too. The plan should explicitly say the Continue button receives `autoFocus` and is therefore tappable on touch — it does say "Button uses `autoFocus` for keyboard accessibility" but frames it as keyboard-only.

## Major Risks

1. **ROADMAP ↔ plan mismatch risk.** If a future contributor reads ROADMAP and sees "Level Introduction Overlay" as a Milestone 4 deliverable, they will believe the milestone is incomplete after this plan ships. Resolution: the single-overlay deviation must be either reflected in ROADMAP or recorded in an ADR before the plan is approved.
2. **State-machine regression risk.** The level-up branch in `state.ts:70–96` is the most exercised path in the game. Splitting it into a two-step transition introduces a new failure mode (CONTINUE_GAME dispatched when status is not `levelComplete`) that the current test suite does not cover. The plan's "CONTINUE_GAME from non-levelComplete is a no-op" test in Phase 6 mitigates this; do not drop it.
3. **Sound-callback timing regression risk.** The plan's claim that `onLevelUp` fires on CONTINUE_GAME relies on `Engine.ts:52` (`this.state.status === 'playing'`) and on `continueGame()` being the only path that increments the level. If a future refactor adds another level-incrementing action without that guard, the level-up sound will be lost. The plan should call this out in the Engine.ts section explicitly.
4. **Build-break risk from missed test mock update.** The unchecked `Game.test.tsx` mock is a guaranteed `npm run build` failure on the first CI run. Easy to fix, but it is a real risk if an agent skims Phase 6.

## Recommended Changes

1. **Either restore the "Level Introduction Overlay" feature for level 1 (and document the L2+ consolidation) OR add an ADR explaining the single-overlay decision and link it from `plans/ACTIVE.md`.** The plan's current prose-only justification is not durable.
2. **Add `Game.test.tsx` to Phase 6** as an explicit update to the `useGame()` mock return value.
3. **Promote the `Engine.test.ts` `continueGame()` test from "Optional" to required.**
4. **Correct the test-count wording in the plan and in `ARCHITECTURE.md`** to match the real post-implementation number, and fix the existing 116 vs 122 discrepancy in `ARCHITECTURE.md:242`.
5. **Clarify `continueGame()`'s loop-stop semantics** by referencing the actual `Engine.ts:96` early-return rather than misattributing it to `startLoop()`.
6. **State the pre-aim-during-levelComplete behaviour explicitly** (or explicitly block direction input during `levelComplete` if that is the desired UX).
7. **Tighten the "Existing ScoreBoard tests pass" verification step** to "ScoreBoard renders and accepts the new optional prop without errors" — phrased as a build-level check, since no test file exists.

---

# Detailed Findings

## Critical

### F-01. ROADMAP defines a "Level Introduction Overlay" feature that the plan does not implement
- **Severity:** Critical
- **Description:** `ROADMAP.md:216–245` lists a "Level Introduction Overlay" feature as a separate M4 deliverable with its own success criteria ("Before a level begins: Display: Level number, Level name, Description, Objective ... [Start] button"). The plan acknowledges this in passing ("Before level 1, the existing idle overlay already serves as an introduction") but does not implement the L2+ introduction case. After this plan ships, every level transition will be a "complete → continue" pair, never a "preview → start" pair. The ROADMAP success criteria "Players understand upcoming content" is only met for level 1.
- **Recommendation:** Pick one of:
  - (a) **Restore** the L2+ introduction overlay (renders next-level metadata before CONTINUE_GAME takes effect, with [Start] button). This is a modest extension to Phase 3 and Phase 4.
  - (b) **Formally retire** the "Level Introduction Overlay" feature from ROADMAP and replace it with the combined overlay. Capture the decision in an ADR (`docs/adr/ADR-003-…md`) citing the playability rationale and update ROADMAP.md accordingly.
  - Do not ship a plan that leaves ROADMAP and the codebase disagreeing about M4 scope.

### F-02. Missing `Game.test.tsx` mock update will break `npm run build`
- **Severity:** Critical
- **Description:** `src/components/__tests__/Game.test.tsx:47–55` and `:65–73` both return a literal object from `mockUseGame.mockReturnValue({...})`. After Phase 4 adds `continueGame` to the `useGame()` return type (`src/hooks/useGame.ts:73–82`), the test's return objects will be missing a required property and the build will fail. The plan's Phase 6 list omits this file.
- **Recommendation:** Add `Game.test.tsx` to Phase 6. Add `continueGame: vi.fn()` to both `mockReturnValue` calls and to any new test that exercises the levelComplete overlay. This is a 4-line change.

## High

### F-03. `Engine.test.ts` `continueGame()` test marked optional
- **Severity:** High
- **Description:** Phase 6 says "(Optional) Add continueGame test if Engine test patterns support it". `Engine.test.ts` already uses `vi.useFakeTimers()` and the dispatch/loop lifecycle mechanics, which are exactly what a `continueGame()` test needs. Marking it optional invites the implementing agent to skip the only test that would catch a regression in the new public method.
- **Recommendation:** Make the test required. Suggested test: "calls continueGame from `levelComplete` resumes the loop and increments the level". Pattern: dispatch MOVE_SNAKE into levelComplete via the same pattern used in the "stops the game loop on game over" test.

### F-04. No ADR for the single-overlay / merged-introduction design decision
- **Severity:** High
- **Description:** `AGENTS.md` lists "Redesigning the level progression system" as an example of when an ADR is required. Collapsing two named ROADMAP features into one combined overlay is exactly that kind of decision. The plan's prose justification in the "Key Design Decision" section is appropriate for a plan but is not durable.
- **Recommendation:** Either (a) create `docs/adr/ADR-003-level-transition-overlay-design.md` capturing the decision and reference it from the plan, or (b) fold the L2+ introduction overlay back into scope (see F-01). Existing `docs/adr/ADR-001-engine-ui-separation.md` and `ADR-002-platform-adapters.md` show the established format.

### F-05. Pre-implementation note misattributes the identity of the old plan
- **Severity:** Low
- **Description:** The "Documentation Conflict" table in Pre-Implementation Notes lists three documents in disagreement, but the second row labels the source as `plans/ACTIVE.md (old)` while the file is `docs/PROJECT_STATE.md`. This is a minor labelling error in a draft document, but reviewers may misread the conflict.
- **Recommendation:** Correct the table cell to read `docs/PROJECT_STATE.md` and remove the `(old)` qualifier on `plans/ACTIVE.md`.

### F-06. State-machine regression risk: CONTINUE_GAME from a non-levelComplete state
- **Severity:** High
- **Description:** The plan introduces a new public action `CONTINUE_GAME` that mutates snake, level, and obstacles. If dispatched when `state.status !== 'levelComplete'` (e.g. via a keyboard listener wired up in Phase 4 that fires Space at the wrong time), the player would be silently moved to the next level. The plan covers this with a unit test in Phase 6 ("CONTINUE_GAME from non-levelComplete is a no-op") but the implementation guidance is silent: the switch case simply falls through to `default: return state;` and the agent might not realize the safety depends on that fall-through.
- **Recommendation:** Phase 2 step 4 should explicitly state "no-op (return state unchanged) for any status other than `levelComplete`" so the agent either keeps the default fall-through or adds an explicit guard.

## Medium

### F-07. Test churn estimate is overstated and imprecise
- **Severity:** Medium
- **Description:** Phase 2 says "~4 existing state tests will need updating". Inspecting `src/game/__tests__/state.test.ts:208–275`:
  - `levels up when score reaches target` (line 209) — **breaks** (expects `level === 2`, new behaviour keeps level at 1)
  - `resets snake on level up` (line 226) — **breaks** (expects `snake[0] === {x:10,y:10}`, new behaviour keeps the grown snake)
  - `sets won status when level 10 is completed` (line 243) — **passes as-is** but should be tightened to `not.toBe('levelComplete')` so future regressions are caught
  - `updates high score on win` (line 259) — **passes as-is**
- **Recommendation:** Update Phase 2's "Verification" section to enumerate the exact two failing tests and recommend strengthening the two L10 tests with a negative assertion. This helps the implementing agent avoid under- or over-correcting.

### F-08. "Existing ScoreBoard tests pass" is a vacuous claim
- **Severity:** Medium
- **Description:** Phase 5 verification says "Existing ScoreBoard tests pass". There is no `ScoreBoard.test.tsx` file in `src/components/__tests__/`. The plan should not claim a test that does not exist passes.
- **Recommendation:** Replace with: "ScoreBoard renders without TypeScript errors when the new `levelName` prop is omitted (backward compatible) and is included" — or add a small `ScoreBoard.test.tsx` to Phase 6.

### F-09. `continueGame()` loop-stop semantics mis-described
- **Severity:** Medium
- **Description:** Phase 2 step 5 says "The loop auto-stops when status becomes `levelComplete` because `startLoop()` checks `status !== 'playing'`". The actual early-return is in the `tick()` closure at `Engine.ts:96` (`if (this.state.status !== 'playing') { this.rafId = null; return; }`). The `rafId` persists until the next animation frame, at which point the closure clears it. Behaviour is correct; the description is the kind of mis-statement that a future agent will believe literally.
- **Recommendation:** Correct the wording to: "The loop's `tick()` closure returns early at `Engine.ts:96` when `status` is not `playing`; on the next `requestAnimationFrame` callback, `rafId` is cleared. No explicit `stopLoop()` call is needed in the reducer."

### F-10. `Engine.test.ts` "continues running the loop after reset" interaction
- **Severity:** Medium
- **Description:** The existing test at `Engine.test.ts:59–67` advances the timer 200ms after `engine.reset()` and asserts the snake moved. `RESET` continues to set status to `playing` per the plan, so this test still passes. Worth confirming the plan's Phase 2 explicitly leaves RESET untouched (it does in step 3, but the verification list could mention this).
- **Recommendation:** Add a one-line note to Phase 2 verification: "`Engine.test.ts` 'continues running the loop after reset' still passes because RESET's status transition is unchanged."

### F-11. ARCHITECTURE.md test count discrepancy not fixed
- **Severity:** Medium
- **Description:** `ARCHITECTURE.md:242` claims "116 unit tests", while `SPEC.md:331` and `docs/PROJECT_STATE.md:100,176` claim "122 unit tests". The plan updates SPEC.md and PROJECT_STATE.md but not ARCHITECTURE.md. Phase 7 already edits ARCHITECTURE.md for the state-machine diagram, so fixing the count there is a one-line change in the same PR.
- **Recommendation:** Add to Phase 7: "Reconcile test count across `ARCHITECTURE.md`, `SPEC.md`, and `docs/PROJECT_STATE.md`."

### F-12. Phases 1 and 2 both edit `src/game/types.ts`
- **Severity:** Low
- **Description:** Phase 1 extends the `Level` interface; Phase 2 extends `GameStatus` and `GameAction`. Both are additive type-only edits. The split into two phases is fine for clarity but introduces an extra handoff and risks a half-applied state if the agent does Phase 1 but pauses before Phase 2.
- **Recommendation:** Optional. Consider merging into a single Phase 1 "Extend the type system and reducer" without changing the file list meaningfully. Not a blocker.

### F-13. Pre-aiming during `levelComplete` unspecified
- **Severity:** Low
- **Description:** `platform/keyboard.ts:38–41` routes direction keys to `onChangeDirection` regardless of status. With the plan, a player can pre-aim during `levelComplete`. This is consistent with SPEC §8.2 (pre-aiming during `paused`) but the plan never states it. The behaviour could be desirable (consistent with pause pre-aim) or surprising (some designers prefer the overlay to be a clean break).
- **Recommendation:** Add a one-sentence design decision to Phase 4 step 3: "Direction keys remain live during `levelComplete` for consistency with pre-aim-while-paused behaviour (SPEC §8.2)."

## Low

### F-14. `LevelTransition` button tappability on touch devices not explicit
- **Severity:** Low
- **Description:** The plan says the button uses `autoFocus` "for keyboard accessibility" but doesn't say it doubles as the touch-tap target. A touch-only player with the d-pad hidden needs a clearly tappable button. `autoFocus` is irrelevant to touch; what matters is the overlay's stacking and pointer-events. Looking at the existing idle/paused overlays, they use the same `.overlay` class and the same `Start` / `Resume` button pattern, so the touch story is already proven. The plan should just say so explicitly.
- **Recommendation:** Phase 3 step 4: "Use the same button pattern as the existing Start/Resume buttons in `Game.module.css`; `autoFocus` for keyboard, naturally tappable on touch via standard click handling."

### F-15. `docs/IDEAS_BACKLOG.md` not referenced
- **Severity:** Low
- **Description:** `AGENTS.md` describes `IDEAS_BACKLOG.md` as "append-only unless ideas are promoted, implemented, or discarded." The plan does not mention it. M4 does not obviously generate new ideas, so this is fine — just confirm.
- **Recommendation:** No action. If during implementation the agent surfaces an idea (e.g. "an animated transition between levels would be nice"), append to `IDEAS_BACKLOG.md` rather than expanding scope.

### F-16. `docs/HANDOFF.md` not referenced
- **Severity:** Low
- **Description:** `docs/HANDOFF.md` exists in the repo. The plan does not list it. Without reading it I cannot tell whether it needs updating, but a handoff doc often summarises current state and could become stale.
- **Recommendation:** Add a one-line check in Phase 7: "Review `docs/HANDOFF.md` and update if it summarises milestone state."

### F-17. `LEVEL_DESIGN.md` placeholder content policy
- **Severity:** Low
- **Description:** Phase 1 leaves level names/descriptions as placeholders, which is correct. The plan does not state the placeholder policy clearly (one-line flavor? multi-line? exact wording constraints?). An implementing agent might either over-invest in copy or under-invest in clarity.
- **Recommendation:** Add a sentence to Phase 1: "Names should be 1–3 words; descriptions one sentence; objectives a short imperative ('Eat 5 food.'). Copy is non-final and will be revisited in M5."

---

# Handoff Assessment

## Phase structure — **Good**
- 7 phases, each with a single goal, a single set of file changes, and a verification step. Phase 7 (documentation) is appropriately last and lists the exact SPEC/ROADMAP/PROJECT_STATE/ARCHITECTURE edits. The progression — types → reducer → component → integration → HUD → tests → docs — is a sensible bottom-up order that keeps each commit compilable.

## Task decomposition — **Good with one gap**
- File lists per phase are complete **except for `src/components/__tests__/Game.test.tsx`** (see F-02). The decomposition into "data → state → component → wiring → HUD → tests → docs" maps cleanly to the architecture. Task sizes are small (each phase is well under a day's work for an experienced agent).

## Verification strategy — **Adequate, can be tightened**
- Each phase names specific commands (`npm run build`, `npm test -- <path>`, `npm run lint`). Two gaps:
  1. The plan never says to run **all three** (build, lint, test) at the end of the milestone. The Definition of Done implies it, but a final "run all of: `npm run build && npm run lint && npm test`" task would catch cross-phase regressions.
  2. The plan does not require manual browser verification (the "Manual playthrough" in Phase 4 verification is the only mention). A short, explicit manual-test checklist before merge would catch UX regressions that unit tests cannot — e.g. visual appearance of the overlay, button tappability, and Space key behaviour on the new state.

## Definition of DoD — **Strong**
- 21 checkbox items. Covers type-level changes, state transitions, UI wiring, sound-callback timing, accessibility, and documentation. The list is concrete and testable. Minor: should also include "Existing 122 unit tests still pass" and "Test count in SPEC.md / PROJECT_STATE.md / ARCHITECTURE.md reconciled" (related to F-07, F-11).

## AI-agent execution readiness — **Moderate to High**
- The plan is detailed enough that a competent agent can execute it without re-reading the codebase top to bottom, **provided** the agent has read SPEC.md, ARCHITECTURE.md, and the test files the plan references. The risk is in the small-but-fatal omissions (F-02: the `Game.test.tsx` mock, F-06: the no-op safety on `CONTINUE_GAME`).
- A new agent should be able to:
  1. Apply Phase 1 to add `name`, `description`, `objective` to `Level` and replace the `for`-loop with an explicit array.
  2. Apply Phase 2 to add `levelComplete`, `CONTINUE_GAME`, and rewire the level-up branch. Update `state.test.ts`.
  3. Apply Phase 3 to build the `LevelTransition` component.
  4. Apply Phase 4 to wire it into `Game.tsx`, `useGame.ts`, `useKeyboard.ts`, `keyboard.ts`. **Update `Game.test.tsx` mock** (F-02).
  5. Apply Phase 5 to add `levelName` to `ScoreBoardProps`.
  6. Apply Phase 6 to add the new test files and update existing ones. **Required: `Engine.test.ts` continueGame test** (F-03).
  7. Apply Phase 7 to update SPEC, ROADMAP, PROJECT_STATE, ARCHITECTURE, and reconcile the test-count inconsistency (F-11).
- Resolve F-01 (either restore L2+ intro or add ADR) before the agent starts.

---

# Final Recommendation

## **Approve with Major Changes**

The plan is structurally sound, well-grounded in the codebase, and aligned with `AGENTS.md`'s "ship the game" philosophy. The phasing, file lists, and verification steps are good enough to hand off to another agent.

The **major** issues are:

1. **F-01 (Critical):** The plan silently drops a named ROADMAP feature. Either restore the "Level Introduction Overlay" for L2+ or formally retire it via an ADR + ROADMAP update. Shipping as-is leaves ROADMAP and the codebase permanently inconsistent — which is exactly what `AGENTS.md` says to avoid.
2. **F-02 (Critical):** The plan will break `npm run build` because `Game.test.tsx` is not in the test-update list. This is a one-line add but is a guaranteed CI failure.
3. **F-04 (High):** The single-overlay decision is an ADR-worthy product decision per `AGENTS.md`. Capture it durably.

The remaining findings (F-03 through F-17) are improvements that should be folded in but are not blocking on their own.

**Net assessment:** Simplicity, maintainability, and repository alignment are all served by this plan once the three critical/high items above are addressed. The plan favours executable, minimal changes — the right instinct. Approve after the three changes land.
