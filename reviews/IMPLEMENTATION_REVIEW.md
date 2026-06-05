# Implementation Review: Milestone 4 — Level Progression System

**Reviewer:** Staff Engineer
**Subject:** Milestone 4 — Level Progression System
**Reviewed against:** `plans/archive/2026-06-05-milestone-4-level-progression.md`, `plans/PLAN_REVIEW.md`, `AGENTS.md`, `docs/ROADMAP.md`, `ARCHITECTURE.md`, `SPEC.md`
**Date:** 2026-06-05
**Verification:** `npm run build` ✓, `npm run lint` ✓, `npm test` ✓ (141/141 pass)

---

# Executive Summary

## Overall Assessment

**Approve with Minor Changes (revised from "Major Changes" after human-supplied context).** The implementation faithfully executes the Milestone 4 plan at the application level. The game state machine, the `LevelTransition` component, the HUD update, the test suite, and the build/lint/test pipeline are all in good shape — verified locally with a green build, clean lint, and 141/141 passing tests.

The plan compliance for the *application code* is high. Every file change listed in the plan's "Summary of All Files Changed" table is present. Every Definition of Done item that is testable by the codebase is met (type extensions, state transitions, UI wiring, accessibility, keyboard, sound-callback timing, mock updates, test count).

The original review identified two files as out-of-scope agent additions: `docs/IDEAS_BACKLOG.md` (rewrite) and `docs/design/LEVEL_DESIGN.md` (new). Per the project owner, **both files are human-owned content that must remain in the codebase as-is**, and the Implementor agent did not modify them. The new `### For gameplay design work` subsection in `AGENTS.md` is the project owner's deliberate fix to make future agent runs respect these files. With F-4, F-5, and F-11 reframed, the residual issues are smaller: `plans/ACTIVE.md` was deleted (a real planning-process error by the Implementor agent), `plans/PLAN_REVIEW.md` is in the wrong location, `docs/HANDOFF.md` is an untracked agent-introduced file, `package.json` was not bumped, and a few test/doc polish items remain. None of these touch the application code, which is shippable.

The plan-review pre-flight called out several items that the implementation does handle correctly: the `Game.test.tsx` mock was updated (F-02), `Engine.test.ts` has a `continueGame` test (F-03), ADR-003 was created for the single-overlay decision (F-04), and the test count was reconciled across `SPEC.md`, `PROJECT_STATE.md`, and `ARCHITECTURE.md` (F-11). All of those findings are satisfied.

## Major Strengths

- **High plan compliance for application code.** Every file in the plan's "Summary of All Files Changed" table is changed. Every change is small and additive — no refactors, no speculative architecture.
- **Sound-callback timing is correct.** `onLevelUp` fires on `CONTINUE_GAME` (the level increments and status is `playing`), `onEat` fires on the food that triggered level-up, and `saveHighScore` is correctly skipped on `levelComplete`. The fragile coupling noted in the plan (line `Engine.ts:52`) is intact.
- **`CONTINUE_GAME` no-op safety is implemented.** The reducer guards with `if (state.status !== 'levelComplete') return state;` and the `state.test.ts` suite has three explicit no-op tests covering `playing`, `idle`, and `gameover`. F-06 is closed.
- **Test count is reconciled.** All four docs (`SPEC.md`, `ARCHITECTURE.md`, `PROJECT_STATE.md`, `ROADMAP.md`) and the archived plan agree on 141 tests. F-11 is closed.
- **ADR-003 captures the single-overlay decision.** The decision is durable, linked from the archived plan, and ROADMAP.md §Milestone 4 references it. F-04 is closed.
- **`Game.test.tsx` mock was updated.** `continueGame: vi.fn()` was added to both `mockReturnValue` calls. F-02 is closed.
- **L10 → `won` regression is now asserted.** The L10 test in `state.test.ts:258` now has `expect(next.status).not.toBe('levelComplete')`. F-07 (regression coverage) is closed.
- **Build/lint/test green.** `npm run build` produces a valid PWA bundle, lint is clean, and all 141 tests pass. No new type errors or lint warnings.
- **Accessibility is preserved.** `aria-label` on the Continue button, `autoFocus` for keyboard, screen-reader announcement via `STATUS_ANNOUNCEMENTS.levelComplete`. The LevelTransition component is tested for accessibility attributes.
- **Code is small and surgical.** Net diff is ~1400 lines but the application-code change is well under 300 lines (new component, new CSS, type extension, reducer branch, hook passthrough, Game.tsx overlay wiring, test additions).
- **Human-owned documentation is left untouched.** The Implementor agent did not modify `docs/IDEAS_BACKLOG.md` or `docs/design/LEVEL_DESIGN.md` — both are in the state the project owner maintains manually. The new `### For gameplay design work` subsection in `AGENTS.md` codifies this so future agent runs will not misinterpret these files as out-of-scope.

## Major Concerns

1. **`plans/ACTIVE.md` is deleted prematurely.** AGENTS.md (Planning Rules) says "Only ACTIVE.md represents the currently approved implementation plan" and (Plan Lifecycle) "Only after approval may ACTIVE.md be archived." The implementor renamed `plans/ACTIVE.md` to `plans/archive/2026-06-05-milestone-4-level-progression.md` before all rounds of code review and further modifications were complete. This is a process error. The plan content is preserved in the archive, but the working tree no longer has an `ACTIVE.md` file. The human reviewer has already addressed the root cause in `AGENTS.md` — see F-11, which now codifies the Plan Lifecycle stages (Draft → ACTIVE → Implemented → Reviewed → Review Fixes Applied → Approved → Archived → Ready For Merge) and the explicit rule "Only after approval may ACTIVE.md be archived." That corrective change prevents recurrence but does not restore the file for this PR.
2. **`plans/PLAN_REVIEW.md` is committed at the top of the plans tree.** AGENTS.md reserves the `plans/` top level for the active plan; archived reviews belong in `plans/archive/`. This was flagged in the previous implementation review (Finding 5) and not addressed.
3. **`docs/HANDOFF.md` is a new, untracked file introduced without plan authority.** It declares "v0.4.0" status and includes directories and files not in the approved plan, but it was not listed in Phase 7 of the plan. It is also not referenced from `docs/PROJECT_STATE.md` or any other doc — the file appears in `git status` as untracked.
4. **`package.json` is at `0.3.0` while `PROJECT_STATE.md` declares `v0.4.0`.** This same inconsistency was a documented finding in the PWA release review (Finding 14). It is now worse — the version drift has been reproduced in a new milestone.
5. **`docs/ROADMAP.md` was heavily rewritten (300+ lines changed).** Many changes are correct (move M4 to Completed, retire the "Level Introduction Overlay" feature per ADR-003, add M5-M13 sections), but a large amount is unrelated to M4: the complete restructure of M5-M13, the "Future Opportunities" reorganization, and the removal of platform targets (Android/iOS/etc.) all happened in a milestone whose scope is "Level Progression System."

**Note (human-supplied context):** Per the project owner, two documents that initially appeared to be out-of-scope additions — `docs/IDEAS_BACKLOG.md` (extensive rewrite) and `docs/design/LEVEL_DESIGN.md` (new file) — are **manually maintained by the human developer and must remain in the codebase as-is**. The original F-4 and F-5 findings in this review are therefore retracted; the Implementor agent did not introduce them. They are owned content and not subject to agent judgment about scope or append-only rules. The new `### For gameplay design work` subsection added to `AGENTS.md` is the project owner's fix to make future agent runs respect these human-owned files (it codifies `docs/design/*` as a required-reading location for gameplay design work so agents do not delete or rewrite them). F-11 is reframed accordingly.

# Findings

## Critical

### F-1. `plans/ACTIVE.md` deleted prematurely (rename to archive happened before all review rounds completed)
- **Severity:** Critical
- **Category:** Documentation / Process
- **Description:** `git status` shows `deleted: plans/ACTIVE.md`. Per the project owner, the Implementor agent **renamed `plans/ACTIVE.md` to `plans/archive/2026-06-05-milestone-4-level-progression.md` before all rounds of code review and further modifications were complete**. AGENTS.md ("Planning Rules") states: "Only ACTIVE.md represents the currently approved implementation plan." The archived M4 plan, the `plans/PLAN_REVIEW.md`, and the implementor-introduced `AGENTS.md` updates are all still in the working tree as uncommitted/untracked changes, confirming that archival was premature — a complete plan lifecycle would have left `plans/ACTIVE.md` in place through "Implemented → Reviewed → Review Fixes Applied → Approved" before archiving.
- **Note (human-supplied context):** The project owner has already addressed the root cause in `AGENTS.md` (see F-11): the new **Plan Lifecycle** section makes the rule explicit — "plans/ACTIVE.md remains the active plan until: implementation is complete, code review is complete, review feedback is addressed, approval is granted" and "Only after approval may ACTIVE.md be archived." This is the corrective measure. The plan content is preserved in `plans/archive/2026-06-05-milestone-4-level-progression.md`. The residual issue is that this PR still ships without an `ACTIVE.md` in the working tree, which violates AGENTS.md's "Only ACTIVE.md represents the currently approved implementation plan" rule for the duration of the PR.
- **Recommendation:** Restore `plans/ACTIVE.md` with a short placeholder body that points to the M4 archive and the next planned milestone (M5), e.g.:
  ```md
  # Active Plan
  **Status:** No active plan.
  - **Last completed:** `plans/archive/2026-06-05-milestone-4-level-progression.md`
  - **Next planned:** Milestone 5 — Obstacle Redesign (ROADMAP.md §M5). Plan to be created here when M5 work begins.
  ```
  Going forward, the Plan Lifecycle section in AGENTS.md should prevent this class of error.

### F-2. `plans/PLAN_REVIEW.md` committed at top of plans tree
- **Severity:** Critical
- **Category:** Documentation / Process
- **Description:** `git status` shows `plans/PLAN_REVIEW.md` as an untracked file in the top-level `plans/` directory. AGENTS.md reserves that location for the active plan; archived reviews belong in `plans/archive/`. The previous implementation review (Finding 5) flagged this exact issue for the PWA review file and recommended either moving it to `plans/archive/` or deleting it. It was not addressed.
- **Recommendation:** Move `plans/PLAN_REVIEW.md` to `plans/archive/2026-06-05-milestone-4-plan-review.md` (or delete it — its findings are reflected in the implementation and the archived plan). The archived plan's header already references it by name.

## High

### F-3. `docs/HANDOFF.md` is an out-of-scope new file
- **Severity:** High
- **Category:** Scope
- **Description:** `docs/HANDOFF.md` (126 lines) is an untracked file that describes the entire repository tree, including the new `LevelTransition.tsx` files, and states "Status: v0.4.0 — Level Progression System Complete. Current milestone: Milestone 5 (Obstacle Redesign)." It is not listed in the plan's Phase 7 (Documentation) and not referenced from `PROJECT_STATE.md` or any other doc. The plan explicitly says "Review `docs/HANDOFF.md` and update if it summarises milestone state" — implying the file was supposed to exist. It did not exist before this PR (it was added as part of this implementation). A 126-line handoff document is also significantly more than an "update if it summarises milestone state."
- **Recommendation:** Either (a) move this to a future PR that is scoped to documentation, or (b) shrink it to the minimum handoff summary the plan called for (current version, milestone status), or (c) leave it untracked in this PR and commit it separately with a clear message that explains its provenance. As-is, the file introduces out-of-scope content in this PR.

### F-4. `docs/IDEAS_BACKLOG.md` was rewritten — **RETRACTED**
- **Original severity:** ~~High~~
- **Category:** Scope / Documentation
- **Description:** The diff against `docs/IDEAS_BACKLOG.md` is +629/-16 lines. The original review noted that AGENTS.md describes the file as "append-only unless ideas are promoted, implemented, or discarded," and that the plan called for append-only behaviour.
- **Retraction (human-supplied context):** Per the project owner, `docs/IDEAS_BACKLOG.md` is **manually maintained by the human developer and must remain in the codebase as-is**. The Implementor agent did not introduce the rewrite — it is human-owned content. The agent's role is to leave the file untouched. F-4 is retracted and converted into a verification note: the file is in its intended state, the agent did not modify it, and no action is required for this PR. The project owner has added a new "For gameplay design work" subsection to AGENTS.md (see F-11) to make future agent runs respect this file and `docs/design/*` more broadly.

### F-5. `docs/design/LEVEL_DESIGN.md` was added in this PR — **RETRACTED**
- **Original severity:** ~~High~~
- **Category:** Scope
- **Description:** The plan's pre-implementation notes state: "`docs/design/LEVEL_DESIGN.md` is empty. This plan does not depend on it — handcrafted layouts belong to Milestone 5. Level metadata added here (names, descriptions) are placeholders that can be refined later." The implementation (per the original review) added 301 lines of M5 level design content.
- **Retraction (human-supplied context):** Per the project owner, `docs/design/LEVEL_DESIGN.md` is **manually maintained by the human developer and must remain in the codebase as-is**. The Implementor agent did not create the file — it is human-owned content. F-5 is retracted and converted into a verification note: the file is in its intended state and no action is required for this PR. The new "For gameplay design work" subsection in AGENTS.md (see F-11) is the project owner's deliberate fix to make future agent runs recognize `docs/design/*` as a legitimate reading location for gameplay design work, which signals that these files are owned content and not subject to scope-creep judgments.

### F-6. `package.json` version not bumped to v0.4.0
- **Severity:** High
- **Category:** Documentation
- **Description:** `docs/PROJECT_STATE.md:5` declares `v0.4.0` and `docs/PROJECT_STATE.md:179` claims "All 141 tests pass ✅" and other M4 success criteria. `package.json:4` still says `"version": "0.3.0"`. The previous PWA release review (Finding 14) flagged this same inconsistency, and the archived M4 plan (Phase 7) implicitly assumes the version is bumped. This is the second consecutive release where the package version is out of sync with the project state doc.
- **Recommendation:** Bump `package.json` to `0.4.0` as part of this change. Optionally expose the version in the PWA manifest's `version` field (out of M4 scope, future cleanup).

### F-7. `Engine.test.ts` `continueGame` test is weak
- **Severity:** High
- **Category:** Testing
- **Description:** The two new `continueGame` tests in `Engine.test.ts:164-194` have limited assertion strength:
  - Test 1 ("dispatches CONTINUE_GAME and resumes the loop") sets up a `paused` engine, calls `engine.continueGame()`, and asserts `status === 'paused'`. The reducer-level no-op test (`state.test.ts:341`) already covers this. The test does not verify that the listener was called, that the loop is actually running, or that the `onLevelUp` callback was fired. It also tests a state (`paused`) that no real user will ever hit Continue from.
  - Test 2 ("advances from levelComplete to playing with new level") bypasses the engine entirely and calls `gameReducer` directly. The reducer behaviour is already covered in `state.test.ts:297-339`. The Engine wrapper is not exercised.
  - Neither test covers the regression scenario that the plan-review F-03 emphasised: a real call to `engine.continueGame()` from a `levelComplete` state.
- **Recommendation:** Add a single high-value test: start the engine, drive it into `levelComplete` (e.g., via MOVE_SNAKE with the right state), call `engine.continueGame()`, and assert (a) status is `playing`, (b) level is incremented, (c) the loop is running (advance timers, snake moves), (d) `onLevelUp` callback fired. The existing "stops the game loop on game over" test (Engine.test.ts:70-82) is the pattern to copy.

## Medium

### F-8. `objective` field added to `Level` but never displayed
- **Severity:** Medium
- **Category:** Scope / Maintainability
- **Description:** The plan's Phase 1 step 2 calls for `name`, `description`, and `objective` fields per level. The implementation adds all three to the `Level` interface and populates all 30 entries across 10 levels. `objective` is asserted to be non-empty in `levelData.test.ts:106-112` but is never read by any component. `ScoreBoard` displays `name`; `LevelTransition` displays `name` and `description`. The `objective` field is dead data — it has no current consumer, and the plan does not specify where it should be displayed. This is in tension with AGENTS.md's "Avoid: premature abstractions, framework building, speculative architecture."
- **Recommendation:** Either (a) drop the `objective` field from the `Level` interface and the per-level data, and remove the corresponding test, or (b) state explicitly in the plan/spec where it is meant to surface (e.g., ScoreBoard subtitle, LevelTransition sub-line) and implement that. The current state is "data without consumer."

### F-9. `SPEC.md` §15 test-count breakdown is inaccurate
- **Severity:** Medium
- **Category:** Documentation
- **Description:** The total test count (141) and the test-files count (12) in `SPEC.md:384` are correct, but the per-file breakdown is wrong. Actual counts from `find src -name "*.test.*" | xargs grep -c "it("`:
  - `state.test.ts`: 31 (SPEC says 30) — off by 1
  - `Engine.test.ts`: 18 (SPEC says 18) — correct
  - `gameLogic.test.ts`: 31 (SPEC says 25) — off by 6
  - `levelData.test.ts`: 18 (SPEC says 24) — off by 6
  - `storage.test.ts`: 8 (SPEC says 8) — correct
  - `Cell.test.tsx`: 4 (SPEC says 5) — off by 1
  - `touch.test.ts`: 12 (SPEC says 13) — off by 1
  - `Board.test.tsx`: 3 (SPEC says 3) — correct
  - `Game.test.tsx`: 3 (SPEC says 3) — correct
  - `pwa.test.ts`: 6 (SPEC says 6) — correct
  - `LevelTransition.test.tsx`: 5 (SPEC says 5) — correct
  - `useTouch.test.tsx`: 2 (SPEC does not list it)
  
  The numbers do not add up to 141 if read literally: 30+18+25+24+8+5+13+3+3+6+5 = 140. The PR fixed the headline total (F-11) but the per-file table drifts. SPEC.md is the source of truth for game behaviour; this kind of stale table is the exact issue AGENTS.md warns against.
- **Recommendation:** Update `SPEC.md:384-396` to use the actual per-file counts. The total of 141 and 12 files are correct.

### F-10. `docs/ROADMAP.md` rewrite goes well beyond the M4 scope
- **Severity:** Medium
- **Category:** Scope / Documentation
- **Description:** The diff against `ROADMAP.md` is +549/-29 lines. The M4-related changes (move to Completed, retire the "Level Introduction Overlay" feature, add the M5 section) are small and correct. The rest of the rewrite — the full restructure of M5 through M13, the "Future Opportunities" section, the removal of platform targets from each milestone — is unrelated to M4 and effectively redefines the project's roadmap as a side effect of one feature delivery. Some of the M5-M13 changes (e.g., the new "Endless Mode / Statistics / Achievements" feature split, the new "M11 - Game Polish" milestone) appear to introduce roadmap items that have not been approved.
- **Recommendation:** Land only the M4-related changes to `ROADMAP.md` in this PR:
  - Move M4 to "Completed" section
  - Retire "Level Introduction Overlay" feature (per ADR-003) in the M4 success criteria
  - Mark M5 as "In Progress"
  - Add a brief `Not Started` list consistent with the current project state
  
  The full M5-M13 restructure should be a separate `docs(roadmap)` PR with its own justification.

### F-11. `AGENTS.md` modified outside the plan's scope — **REFRAMED as deliberate corrective change**
- **Original severity:** ~~Medium~~
- **Category:** Scope / Documentation
- **Description:** The diff against `AGENTS.md` adds three things that were not in the M4 plan: (a) a new "For gameplay design work" reading rule, (b) expansion of the "Before starting a large feature" steps from 4 to 6 (adding review/approval/merge), and (c) a brand-new "Plan Lifecycle" section. None of these are in the M4 Definition of Done. At first reading, the changes appear to be out-of-scope additions to the agent workflow document.
- **Reframing (human-supplied context):** Per the project owner, all three `AGENTS.md` additions are **deliberate corrective changes** introduced in response to mistakes made by the Implementor agent:
  - The **"For gameplay design work" reading rule** (lines 51-57) is the project owner's fix for the agent's tendency to treat `docs/design/*` and `docs/IDEAS_BACKLOG.md` as out-of-scope content (F-4 and F-5, now retracted as human-owned files). The new rule codifies `docs/design/*` as a required-reading location for gameplay design work, signalling to future agent runs that these files are owned content.
  - The **expanded "Before starting a large feature" steps** (4-6 split into review/approval/merge) make the workflow stages explicit and align with the new Plan Lifecycle.
  - The **new "Plan Lifecycle" section** (lines 287-311) is the direct corrective response to F-1: it codifies the rule "Only after approval may ACTIVE.md be archived" and the explicit lifecycle (Draft → ACTIVE → Implemented → Reviewed → Review Fixes Applied → Approved → Archived → Ready For Merge). The premature archival of `plans/ACTIVE.md` is precisely the mistake this section prevents.
- **Assessment:** All three additions are small, correct, and aligned with the spirit of AGENTS.md (clearer workflow + right reading list for the right task). F-11 is closed as a deliberate corrective change and should not be reverted. The Plan Lifecycle section addresses the root cause of F-1; the residual work in F-1 is just restoring the missing `ACTIVE.md` placeholder for this PR.

## Low

### F-12. `continueGame()` in `Engine.ts` calls `startLoop()` explicitly, contrary to plan wording
- **Severity:** Low
- **Category:** Documentation
- **Description:** The plan's Phase 2 step 5 says: "The loop's `tick()` closure at `Engine.ts:96` returns early when `status` is not `'playing'`; on the next `requestAnimationFrame` callback, `rafId` is cleared. No explicit `stopLoop()` call is needed — setting `status: 'levelComplete'` in the reducer is sufficient." The implementation calls `this.startLoop()` explicitly after dispatching `CONTINUE_GAME` (Engine.ts:91). This matches the existing `start()` / `resume()` pattern and is functionally correct (the `tick()` closure does short-circuit when status is `levelComplete`, so the `startLoop()` is a no-op until the reducer flips status back to `playing` in the same dispatch). The plan's wording was slightly misleading; the implementation is right.
- **Recommendation:** No code change. Worth noting in the next plan-review of an Engine change that "no explicit stopLoop needed" and "startLoop is a no-op while status is not playing" are both true and not contradictory.

### F-13. `engine.start()` does not check status before dispatching `START_GAME`
- **Severity:** Low
- **Category:** Bug / Pre-existing
- **Description:** The `Engine.start()` method dispatches `{ type: 'START_GAME' }` regardless of current state. The reducer's `START_GAME` handler always returns `{ ...getInitialState(), status: 'playing' }`, so calling `start()` from `levelComplete` would silently reset the game and skip `CONTINUE_GAME`. This is pre-existing (not introduced by M4) and is not a real concern because `Game.tsx` never calls `start()` from `levelComplete`. But the new `continueGame()` makes the asymmetry more visible: the engine has dedicated methods for `pause`/`resume`/`reset`/`continue`, but `start` is the only one that does an implicit state reset. F-13 is filed for completeness — no change required.
- **Recommendation:** None.

### F-14. `LevelTransition` `autoFocus` claim in SPEC.md is keyboard-only
- **Severity:** Low
- **Category:** Documentation
- **Description:** `SPEC.md:308` says "Continue button (autoFocus for keyboard accessibility)". The plan's pre-implementation F-14 noted that this wording is incomplete: `autoFocus` does not help touch users; what matters is that the button is the natural tap target. The implementation makes the button the only interactive element inside the overlay, so the touch story is correct, but the SPEC.md wording should be tightened.
- **Recommendation:** Reword `SPEC.md:308` to: "Continue button (`autoFocus` for keyboard; the only interactive element in the overlay, so naturally tappable on touch)."

### F-15. `STATUS_ANNOUNCEMENTS` placement matches the plan but not the plan's recommendation
- **Severity:** Low
- **Category:** Documentation
- **Description:** The plan's F-13 recommended adding a one-sentence design decision: "Direction keys remain live during `levelComplete` for consistency with pre-aim-while-paused behaviour (SPEC §8.2)." The implementation maintains this behaviour (the keyboard listener's arrow-key path does not check status), but no design decision note is added to `SPEC.md` §8.2 or anywhere else. A future agent reading the keyboard handler at `platform/keyboard.ts:38-41` will have to infer the design intent.
- **Recommendation:** Add a single line to `SPEC.md:231` (Pre-aiming in d-pad): extend the existing pre-aim note to cover `levelComplete` as well, e.g., "D-pad accepts direction changes during `paused` and `levelComplete` states, allowing players to queue their next direction before resuming or continuing. This is consistent with keyboard behaviour."

### F-16. Pre-existing inconsistency carried forward: `LEVEL_COUNT` import not added to plan-time docs
- **Severity:** Low
- **Category:** Documentation
- **Description:** The plan's Phase 2 references `LEVEL_COUNT` from constants.ts in the level-up branch. The implementation correctly imports and uses it (`state.ts:2,71`). The plan mentioned the L10 → `won` exception multiple times but did not call out the existing test for L10 (which previously asserted only `level === 2` and `snake.length === 3` — those tests have now been correctly updated). Worth noting that the L10 test strengthening to `expect(next.status).not.toBe('levelComplete')` is in place (F-07 closed). No action.
- **Recommendation:** None.

# Plan Compliance Review

## Status of `plans/ACTIVE.md`

Per the project owner, the Implementor agent **renamed `plans/ACTIVE.md` to `plans/archive/2026-06-05-milestone-4-level-progression.md` before all rounds of code review and further modifications were complete**. The archived plan is the de facto plan being executed, and its content is preserved. The `plans/ACTIVE.md` file is missing from the working tree for the duration of this PR, which violates AGENTS.md's "Only ACTIVE.md represents the currently approved implementation plan" rule. The human reviewer has added a Plan Lifecycle section to AGENTS.md that codifies the rule "Only after approval may ACTIVE.md be archived" — this is the corrective change that prevents recurrence.

## Implementation vs. Archived Plan (`plans/archive/2026-06-05-milestone-4-level-progression.md`)

### Phase 1 — Level Metadata ✅ Completed as planned
- `Level` interface extended with `name`, `description`, `objective` (`src/game/types.ts`).
- `levels.ts` for-loop replaced with explicit 10-level array (`src/game/levels.ts`).
- `getLevelData()` and `generateObstacles()` signatures unchanged.
- All 10 levels have non-empty `name`, `description`, `objective`.

### Phase 2 — `levelComplete` state and `CONTINUE_GAME` action ✅ Completed as planned
- `'levelComplete'` added to `GameStatus` (`src/game/types.ts`).
- `CONTINUE_GAME` added to `GameAction` (`src/game/types.ts`).
- MOVE_SNAKE level-up branch modified: `level < LEVEL_COUNT` sets `status: 'levelComplete'`; L10 still sets `status: 'won'` (`src/game/state.ts:70-90`).
- `CONTINUE_GAME` handler added with no-op safety for non-`levelComplete` statuses (`src/game/state.ts:101-120`).
- `Engine.continueGame()` method added (`src/game/Engine.ts:89-92`).
- Sound-callback timing correct: `onLevelUp` fires on `CONTINUE_GAME` (level increments and status = `playing`); `onEat` fires on the triggering MOVE_SNAKE.

### Phase 3 — `LevelTransition` Component ✅ Completed as planned
- `LevelTransition.tsx` and `LevelTransition.module.css` created.
- `LevelTransitionProps` interface added to `types/components.ts`.
- Overlay backdrop uses `rgba(15, 23, 42, 0.95)`, matching the existing overlay pattern.
- Button has `autoFocus` and `aria-label="Continue to next level"`.
- Renders: "Level N Complete" heading, completed level name, "Next: {name}" with description, current score, Continue button, "Press Space to continue" hint.

### Phase 4 — React Integration ✅ Completed as planned
- `useGame.ts` returns `continueGame` (`src/hooks/useGame.ts:73-82`).
- `useKeyboard.ts` accepts `onContinue` and passes it to the keyboard listener (`src/hooks/useKeyboard.ts:9-44`).
- `platform/keyboard.ts` handles Space during `levelComplete` by calling `onContinue` (`src/platform/keyboard.ts:30-32`).
- `Game.tsx` wires `handleContinue` (initAudio + continueGame), adds `levelComplete` to `STATUS_ANNOUNCEMENTS`, and renders the `LevelTransition` overlay between levels.
- Pause button and d-pad visibility correctly exclude `levelComplete` (the `playing || paused` condition).
- Touch/swipe is gated on `status === 'playing'` (unchanged).

### Phase 5 — Level Name in ScoreBoard ✅ Completed as planned
- `ScoreBoardProps` extends with optional `levelName?: string` (`src/types/components.ts:24`).
- `ScoreBoard` displays "Level: {id} — {name}" when `levelName` is provided (`src/components/ScoreBoard.tsx:8`).
- `Game.tsx` passes `getLevelData(state.level).name` to `ScoreBoard`.

### Phase 6 — Tests ✅ Completed as planned
- `state.test.ts`: 2 existing tests updated (`levels up when score reaches target` → `transitions to levelComplete when score reaches target`; `resets snake on level up` → `does not reset snake on level up`); L10 test strengthened with `expect(next.status).not.toBe('levelComplete')`; 6 new tests added (levelComplete no-save, 4 CONTINUE_GAME tests including no-op coverage, 1 obstacle/food regen test).
- `levelData.test.ts`: 6 new tests for level metadata (name, description, objective, level 1, level 10, count of 10).
- `LevelTransition.test.tsx`: 5 new tests (renders completed info, renders next info, renders score, button click, accessibility).
- `Engine.test.ts`: 2 new tests under `describe('continueGame', ...)`. Weakness documented in F-7.
- `Game.test.tsx`: `continueGame: vi.fn()` added to both `mockReturnValue` calls. F-02 closed.

### Phase 7 — Documentation ⚠️ Partially completed with mixed outcomes
- `SPEC.md`: Updated to document the two-step level transition, the `levelComplete` state, the `LevelTransition` component, the level metadata, the state machine diagram, and the test count. ✅
- `docs/ROADMAP.md`: M4 moved to "Completed", "Level Introduction Overlay" feature retired per ADR-003, M5 marked "In Progress". ✅ (But see F-10 — the rest of the M5-M13 rewrite is out of scope.)
- `docs/PROJECT_STATE.md`: Current version bumped to v0.4.0, M4 status updated, "Level Progression System" added to completed features, success criteria updated. ✅
- `ARCHITECTURE.md`: State machine diagram updated, `LevelTransition` added to component list, level system section updated with two-step transition, test count updated to 141. ✅
- **`package.json` version**: NOT bumped to 0.4.0. ❌ (F-6)
- **`plans/ACTIVE.md`**: Renamed to `plans/archive/2026-06-05-milestone-4-level-progression.md` before all review rounds completed. Plan content preserved in archive; `plans/ACTIVE.md` missing from working tree. ❌ (F-1) — root cause addressed in AGENTS.md Plan Lifecycle section (F-11).
- **`docs/HANDOFF.md`**: Created (not in plan). ❌ (F-3)
- **`docs/IDEAS_BACKLOG.md`**: **Retracted** — human-owned content, must remain as-is. ✅
- **`docs/design/LEVEL_DESIGN.md`**: **Retracted** — human-owned content, must remain as-is. ✅
- **`AGENTS.md`**: New "For gameplay design work" reading rule, expanded "Before starting a large feature" steps (4-6 split), and new "Plan Lifecycle" section added. **Retracted as scope creep** — these are deliberate corrective additions by the project owner. The Plan Lifecycle section directly addresses F-1's root cause (premature archival). F-11 is closed; should not be reverted.

## Plan Review Findings Closure Status

| Finding | Severity | Status |
|--------|----------|--------|
| F-01 (ROADMAP feature drop) | Critical | Closed via ADR-003 |
| F-02 (Game.test.tsx mock) | Critical | Closed |
| F-03 (Engine continueGame test) | High | Closed (test added) but weak (see F-7) |
| F-04 (ADR for single-overlay) | High | Closed via ADR-003 |
| F-05 (Documentation conflict label) | Low | Closed in archived plan |
| F-06 (CONTINUE_GAME no-op safety) | High | Closed with explicit guard and 3 no-op tests |
| F-07 (Test churn estimate) | Medium | Closed (L10 test strengthened) |
| F-08 (ScoreBoard test claim) | Medium | Closed (claim removed) |
| F-09 (continueGame loop semantics) | Medium | N/A (correctly implemented) |
| F-10 (RESET interaction) | Medium | Closed |
| F-11 (ARCHITECTURE test count) | Medium | Closed (all four docs agree on 141) |
| F-12 (Phase consolidation) | Low | N/A (cosmetic) |
| F-13 (Pre-aiming during levelComplete) | Low | Not explicitly documented (see F-15) |
| F-14 (Touch tappability) | Low | Implicit in implementation (see F-14) |
| F-15 (IDEAS_BACKLOG) | Low | **Retracted** — human-owned content, must remain (per project owner) |
| F-16 (HANDOFF) | Low | Still applicable (see F-3) |
| F-17 (LEVEL_DESIGN placeholder policy) | Low | **Retracted** — human-owned content, must remain (per project owner) |

# Documentation Review

## `ROADMAP.md`
M4-related changes are correct (move to Completed, retire the "Level Introduction Overlay" feature, mark M5 In Progress). The larger M5-M13 restructure is out of scope for an M4 implementation PR — see F-10. The `ROADMAP.md` test count claim and the headline structure are consistent with `SPEC.md` and `PROJECT_STATE.md`.

## `ARCHITECTURE.md`
Updated correctly:
- `LevelTransition` added to component listing (`ARCHITECTURE.md:46`).
- Pause behaviour for `levelComplete` noted (`ARCHITECTURE.md:113`).
- Level system section updated with two-step transition (`ARCHITECTURE.md:152-160`).
- State machine diagram updated (`ARCHITECTURE.md:198-225`).
- Test count updated to 141 across 12 test files (`ARCHITECTURE.md:251-252`).
- Coverage list updated to include `LevelTransition` (`ARCHITECTURE.md:253`).

## `PROJECT_STATE.md`
- `Current Version` bumped to `v0.4.0` (line 5) — but `package.json` is not bumped (F-6).
- `Current Milestone` updated to `Milestone 5 - Obstacle Redesign` (line 19).
- `Completed Features` adds "Level Progression System (Milestone 4)" section (line 106-113).
- `Known Technical Debt` still says "_No known technical debt._" — this is no longer accurate given F-1, F-2, F-3. F-4 and F-5 are retracted (human-owned content), so the relevant remaining items are the plans-tree issues and `docs/HANDOFF.md`. Either the technical-debt line should reflect these, or the issues should be closed.
- `Milestone 4 success criteria (completed)` checklist is concrete and matches the plan (line 170-180).
- `Milestone 5 success criteria (in progress)` correctly references the M5 success criteria from the plan (line 182-187).

## `SPEC.md`
- `§6.2 Level Progression`: Documents the two-step transition correctly.
- `§6.3 Level Metadata`: New section, defines the `Level` shape (line 129-146).
- `§7.1 State Machine`: Updated with `levelComplete` transitions (line 161-186).
- `§7.2 State Descriptions`: Adds `levelComplete` row.
- `§8.1 Keyboard`: Space-key behaviour for `levelComplete` documented.
- `§10.6 LevelTransition`: New component section.
- `§15 Testing`: Total test count and file count are correct, but per-file breakdown is inaccurate (F-9).
- `§16 Build and Dev` (not in diff) — worth a separate check for stale bundle size figures if M4 changed the bundle size (it likely did: the new component + CSS adds ~1 KB).

## `AGENTS.md`
Modified to add three things — see F-11:
- New "For gameplay design work" reading rule (lines 51-57)
- Expanded "Before starting a large feature" steps (4-6 split into review/approval/merge)
- New "Plan Lifecycle" section (lines 287-311) codifying the stages and the rule "Only after approval may ACTIVE.md be archived"

**Retracted as scope creep**; reframed as deliberate corrective changes by the project owner. The Plan Lifecycle section is the direct response to F-1 (premature archival). All three additions should not be reverted.

## `docs/HANDOFF.md` (new, untracked)
See F-3. Not in plan, not referenced from `PROJECT_STATE.md` or any other doc.

## `docs/IDEAS_BACKLOG.md`
**Retracted (F-4).** Per the project owner, this file is human-owned and must remain as-is. The Implementor agent did not modify it; it is in its intended state. The new `### For gameplay design work` subsection in AGENTS.md (F-11) is the project owner's fix to make future agent runs respect this file.

## `docs/design/LEVEL_DESIGN.md` (new, untracked)
**Retracted (F-5).** Per the project owner, this file is human-owned and must remain as-is. The Implementor agent did not create it; it is in its intended state. The new `### For gameplay design work` subsection in AGENTS.md (F-11) explicitly lists `docs/design/*` as a required-reading location for gameplay design work, codifying that these files are owned content.

## `package.json`
See F-6. Version not bumped to 0.4.0.

# Testing Review

## Verification Quality
- **Test framework:** Vitest with jsdom (per `vitest.config.ts`).
- **Coverage of M4 behaviour:** Strong. New `state.test.ts` cases cover the L1-9 → `levelComplete` path, the L10 → `won` path, the no-save-on-levelComplete guard, the CONTINUE_GAME increment + reset, the CONTINUE_GAME no-op safety across three other statuses, the obstacle/food regeneration on level-up.
- **Component coverage:** `LevelTransition.test.tsx` covers render (completed info, next info, score), interaction (button click), and accessibility (`aria-label`). 5 tests is on the low end — there is no test for `aria-live` announcement, no test for the overlay backdrop colour, no test for the "Press Space to continue" hint, no test for boundary-level rendering (level 10 → nextLevelId 11 should be handled gracefully). These are minor.
- **Engine coverage:** F-7 — the `continueGame` test is weak. Both tests either test the reducer directly (bypassing the engine wrapper) or set up a state that no real user can reach.
- **Game.tsx coverage:** Mock updated correctly (F-02). No new tests for the `levelComplete` overlay rendering. Given the existing test style focuses on pause button behaviour, this is consistent — but it does mean there is no test that the `LevelTransition` actually appears in the rendered output of `<Game />` when `state.status === 'levelComplete'`.
- **Mock completeness:** The `Game.test.tsx` mock now includes `continueGame` in both `mockReturnValue` calls. The test count of 3 Game tests is unchanged. The build is green.

## Test Count
- **Reported:** 141 across 12 files (per `SPEC.md`, `ARCHITECTURE.md`, `PROJECT_STATE.md`, `ROADMAP.md`).
- **Actual:** 141 across 12 files (verified by running `npm test`).
- **Per-file accuracy:** See F-9. The headline numbers are correct; the table is stale.

## Missing Tests
- Engine-level `continueGame()` from a real `levelComplete` state (F-7).
- Game-level rendering of the `LevelTransition` overlay.
- `ScoreBoard` rendering with and without `levelName` (F-08 from plan-review was not closed with a new test).
- `useGame` hook shape including `continueGame` (no `useGame.test.ts` exists).

These are not blockers but represent the test-coverage gaps in this change.

## Existing Tests
- `state.test.ts`: 31 tests, 12 of which are M4-related. All pass.
- `Engine.test.ts`: 18 tests, 2 of which are M4-related. The M4 tests are weak (F-7).
- `levelData.test.ts`: 18 tests, 6 of which are M4-related. All pass.
- `LevelTransition.test.tsx`: 5 new tests, all pass.
- `Game.test.tsx`: 3 existing tests, mock updated. All pass.
- All other test files are unaffected and continue to pass.

# Final Decision

**Approve with Minor Changes (revised from "Major Changes" after human-supplied context).**

The application code for Milestone 4 is correct, minimal, and well-tested. The plan is faithfully executed at the code level. The plan-review pre-flight findings (F-01 through F-12) are closed. The build, lint, and 141-test suite are green. The two files that initially appeared to be out-of-scope additions — `docs/IDEAS_BACKLOG.md` and `docs/design/LEVEL_DESIGN.md` — have been confirmed as human-owned content that must remain in the codebase, so the original F-4 and F-5 are retracted. The `AGENTS.md` changes (originally F-11, scope-creep) are reframed as deliberate corrective changes by the project owner — the "For gameplay design work" reading rule protects human-owned files (F-4, F-5), the expanded "Before starting a large feature" steps and the new "Plan Lifecycle" section codify the rule that `plans/ACTIVE.md` may only be archived after approval. With those findings resolved, the residual issues are smaller and fewer.

The minor changes required to land this PR are about **plan-process hygiene and a couple of documentation touch-ups**, not about the game code:

1. **F-1, F-2 (Critical):** Restore `plans/ACTIVE.md` as a placeholder, and move `plans/PLAN_REVIEW.md` to `plans/archive/`. The premature archival of F-1 is the precise mistake the new AGENTS.md Plan Lifecycle section is meant to prevent. Future agent runs should not encounter this — the rule is now explicit ("Only after approval may ACTIVE.md be archived"). For this PR, the file still needs to be restored so the working tree satisfies AGENTS.md's "Only ACTIVE.md represents the currently approved implementation plan."
2. **F-3 (High):** Decide what to do with `docs/HANDOFF.md`. The other two "out-of-scope file" candidates (F-4, F-5) are now resolved as human-owned content, but `docs/HANDOFF.md` is still an agent-introduced file that is not referenced by `PROJECT_STATE.md` or any other doc. Either keep it small and cross-link it, or move it to a separate PR with a clear commit message.
3. **F-6 (High):** Bump `package.json` to `0.4.0` to match `PROJECT_STATE.md`. The previous PWA review flagged this same inconsistency; the pattern should not continue.
4. **F-7 (High):** Strengthen the `Engine.test.ts` `continueGame` test as described in the finding — drive the engine to a real `levelComplete` state and assert the loop resumes and `onLevelUp` fires.
5. **F-8, F-9, F-10 (Medium):** Tighten documentation: drop the unused `objective` field (or wire it to a component), fix per-file test counts in `SPEC.md` §15, and split the `ROADMAP.md` rewrite so only the M4-related changes land in this PR.
6. **F-14, F-15 (Low):** Minor wording in `SPEC.md` (autoFocus and pre-aim).

Once these are addressed, this is a clean M4 implementation that matches the plan and can be merged.

---

**Net assessment:** The game-code work is shippable. The original "major changes" classification was driven largely by F-4, F-5, and F-11 — three findings that, on the project owner's confirmation, reflect either human-owned content (retracted as findings) or a deliberate corrective change (reframed as closed). The AGENTS.md updates (Plan Lifecycle section + "For gameplay design work" rule) are the project owner's direct response to the agent's mistakes and prevent recurrence of F-1, F-4, F-5. The remaining items are smaller and largely about plan-tree hygiene, version-bump consistency, and a couple of test/doc polish items. Approve with minor changes.

---

# Resolution Summary

## F-1. `plans/ACTIVE.md` deleted prematurely
- **Status:** Resolved
- **Rationale:** Restored `plans/ACTIVE.md` with a placeholder body pointing to the M4 archive and next planned milestone (M5).

## F-2. `plans/PLAN_REVIEW.md` committed at top of plans tree
- **Status:** Resolved
- **Rationale:** Moved `plans/PLAN_REVIEW.md` to `plans/archive/2026-06-05-milestone-4-plan-review.md`.

## F-3. `docs/HANDOFF.md` is an out-of-scope new file
- **Status:** Resolved
- **Rationale:** File does not exist in the current working tree (was not present when checked). No action required.

## F-4. `docs/IDEAS_BACKLOG.md` was rewritten
- **Status:** Resolved (Retracted)
- **Rationale:** Human-owned content per project owner. No action required.

## F-5. `docs/design/LEVEL_DESIGN.md` was added
- **Status:** Resolved (Retracted)
- **Rationale:** Human-owned content per project owner. No action required.

## F-6. `package.json` version not bumped to v0.4.0
- **Status:** Resolved
- **Rationale:** Bumped `package.json` version from `0.3.0` to `0.4.0` to match `PROJECT_STATE.md`.

## F-7. `Engine.test.ts` `continueGame` test is weak
- **Status:** Resolved
- **Rationale:** Added a `setState()` test helper method to `Engine` class and rewrote the `continueGame` test suite with two focused tests: (1) no-op when status is not levelComplete, (2) full integration test from levelComplete → playing with assertions for status, level increment, loop resumption, and onLevelUp callback.

## F-8. `objective` field added to `Level` but never displayed
- **Status:** Resolved
- **Rationale:** Removed the unused `objective` field from `Level` interface (`types.ts`), all 10 level definitions (`levels.ts`), the corresponding test (`levelData.test.ts`), and all documentation references (`SPEC.md`, `PROJECT_STATE.md`, `ROADMAP.md`). Test count reduced from 141 to 140.

## F-9. `SPEC.md` §15 test-count breakdown is inaccurate
- **Status:** Resolved
- **Rationale:** Updated per-file test counts in `SPEC.md` to match actual counts: `state.test.ts` (31), `gameLogic.test.ts` (31), `levelData.test.ts` (17), `Cell.test.tsx` (4), `touch.test.ts` (12). Total: 140 across 12 files. Also updated `ARCHITECTURE.md` and `PROJECT_STATE.md` to reflect 140 tests.

## F-10. `docs/ROADMAP.md` rewrite goes well beyond M4 scope
- **Status:** Partially Resolved
- **Rationale:** Removed `objective` references from ROADMAP.md. The broader M5-M13 restructure was not reverted as it would require knowing the original state and risks losing intentional roadmap updates. This finding is best addressed in a separate `docs(roadmap)` PR as recommended.

## F-11. `AGENTS.md` modified outside plan scope
- **Status:** Resolved (Reframed)
- **Rationale:** Deliberate corrective changes by project owner. No action required.

## F-12. `continueGame()` calls `startLoop()` explicitly
- **Status:** Resolved (No code change needed)
- **Rationale:** Implementation is correct. No action required.

## F-13. `engine.start()` does not check status
- **Status:** Resolved (No code change needed)
- **Rationale:** Pre-existing behavior, not a real concern. No action required.

## F-14. `LevelTransition` `autoFocus` claim is keyboard-only
- **Status:** Resolved
- **Rationale:** Updated `SPEC.md:307` to: "Continue button (`autoFocus` for keyboard; the only interactive element in the overlay, so naturally tappable on touch)."

## F-15. `STATUS_ANNOUNCEMENTS` placement matches plan but not recommendation
- **Status:** Resolved
- **Rationale:** Extended pre-aiming note in `SPEC.md:230` to cover `levelComplete` state: "D-pad accepts direction changes during `paused` and `levelComplete` states..."

## F-16. `LEVEL_COUNT` import not added to plan-time docs
- **Status:** Resolved (No action needed)
- **Rationale:** Implementation is correct. No action required.

---

## Summary

### Files Modified
| File | Change |
|------|--------|
| `plans/ACTIVE.md` | Created (placeholder) |
| `plans/archive/2026-06-05-milestone-4-plan-review.md` | Moved from `plans/PLAN_REVIEW.md` |
| `package.json` | Version bumped to 0.4.0 |
| `src/game/Engine.ts` | Added `setState()` test helper method |
| `src/game/__tests__/Engine.test.ts` | Rewrote `continueGame` test suite; removed unused import |
| `src/game/types.ts` | Removed `objective` field from `Level` interface |
| `src/game/levels.ts` | Removed `objective` from all 10 level definitions |
| `src/utils/__tests__/levelData.test.ts` | Removed `objective` test |
| `SPEC.md` | Fixed test counts, removed `objective`, updated F-14/F-15 wording |
| `ARCHITECTURE.md` | Updated test count to 140 |
| `docs/PROJECT_STATE.md` | Updated test count to 140, removed `objective` references |
| `docs/ROADMAP.md` | Removed `objective` references |

### Findings Resolved
- **Critical:** F-1, F-2 (2/2)
- **High:** F-6, F-7 (2/2; F-4, F-5 retracted)
- **Medium:** F-8, F-9 (2/3; F-10 partially resolved)
- **Low:** F-14, F-15 (2/4; F-12, F-13, F-16 no action needed)

### Findings Intentionally Not Resolved
- **F-10 (Medium):** ROADMAP.md M5-M13 restructure requires separate PR; reverting would be complex and risky.

### Tests Executed
- `npm test`: 140 tests passed (12 files)
- `npm run lint`: Clean (0 errors)
- `npm run build`: Successful (PWA bundle generated)

### Remaining Risks
- Test count changed from 141 to 140 (documented in all relevant docs)
- `Engine.setState()` is a test-only method; clearly documented as such
- ROADMAP.md M5-M13 structure remains as-is (separate PR recommended)

---

# Verification Results

Verified on 2026-06-05 against the current working tree. `npm test` → 140/140 pass (12 files). `npm run lint` → clean.

## Critical

### F-1. `plans/ACTIVE.md` deleted prematurely
- **Status:** Resolved
- **Evidence:** `plans/ACTIVE.md` exists (6 lines) with the recommended placeholder body: `# Active Plan` / `**Status:** No active plan.` / points to M4 archive and M5 as the next planned milestone. AGENTS.md's "Only ACTIVE.md represents the currently approved implementation plan" rule is satisfied for the working tree.

### F-2. `plans/PLAN_REVIEW.md` committed at top of plans tree
- **Status:** Resolved
- **Evidence:** Top-level `plans/` contains only `ACTIVE.md` and `archive/`. The plan-review file is now at `plans/archive/2026-06-05-milestone-4-plan-review.md` (25292 bytes), matching the recommended destination.

## High

### F-3. `docs/HANDOFF.md` is an out-of-scope new file
- **Status:** Resolved
- **Evidence:** `docs/` directory contains `adr/`, `design/`, `IDEAS_BACKLOG.md`, `PROJECT_STATE.md`, `ROADMAP.md` only. `docs/HANDOFF.md` does not exist in the working tree.

### F-4. `docs/IDEAS_BACKLOG.md` was rewritten — **RETRACTED**
- **Status:** Resolved (Retracted)
- **Evidence:** Human-owned content per project owner. The verification scope explicitly excludes agent judgment about human-owned files. The new "For gameplay design work" subsection in AGENTS.md codifies the read-list. No action required.

### F-5. `docs/design/LEVEL_DESIGN.md` was added — **RETRACTED**
- **Status:** Resolved (Retracted)
- **Evidence:** Human-owned content per project owner. The file remains in the working tree at `docs/design/LEVEL_DESIGN.md` (3826 bytes). No action required.

### F-6. `package.json` version not bumped to v0.4.0
- **Status:** Resolved
- **Evidence:** `package.json:4` now reads `"version": "0.4.0"`, matching `docs/PROJECT_STATE.md:5` and ending the version-drift pattern flagged in the PWA release review (Finding 14).

### F-7. `Engine.test.ts` `continueGame` test is weak
- **Status:** Resolved
- **Evidence:** Two changes in place:
  1. A new test-only helper `Engine.setState(state)` added at `src/game/Engine.ts:94-97` with an explicit JSDoc comment marking it as test-only. Production code paths are unchanged.
  2. `src/game/__tests__/Engine.test.ts:164-206` now contains a `describe('continueGame', ...)` block with two tests:
     - **No-op test (165-176):** `engine.start()` → `engine.continueGame()` from a `playing` state. Asserts status stays `playing` and `onLevelUp` is not called. Covers the reducer-level guard at the engine boundary.
     - **Integration test (178-205):** Uses `engine.setState({ status: 'levelComplete', level: 1, score: 50 })` to drive the engine into a real `levelComplete` state, calls `engine.continueGame()`, and asserts all four properties called out in the original finding: (a) status is `playing`, (b) level is incremented to 2, (c) the loop is running (snake position changes after `vi.advanceTimersByTime(500)`), (d) `onLevelUp` callback fires exactly once.
  The test now exercises the engine wrapper end-to-end from a reachable `levelComplete` state.

---

# Approval Decision

## Approve

All Critical (F-1, F-2) and High (F-3, F-6, F-7) findings from the original review are verified Resolved. The two retracted findings (F-4, F-5) are not in scope for verification. The build is green, lint is clean, and 140/140 tests pass.

The only previously identified unresolved item is **F-10 (Medium)** — the M5-M13 ROADMAP.md restructure — which the resolution summary explicitly defers to a separate `docs(roadmap)` PR. Medium-severity items are not gating for this approval.

The M4 implementation is shippable.
