# Plan Review — Milestone 9: Replayability Systems

**Plan under review:** `plans/ACTIVE.md`
**Reviewer role:** Staff Engineer
**Date:** 2026-06-07

---

# Overall Assessment

## Strengths

- **Roadmap alignment is precise.** The three feature tracks (Endless Mode, Statistics, Achievements) map 1:1 to the three sub-features described in `docs/ROADMAP.md` §Milestone 9, including the three explicit achievement examples. Scope is well-contained.
- **Architecture alignment is strong.** Achievement detection reuses the existing `onEat` / `onLevelUp` / `onGameOver` / `onWin` callback pattern in `Engine.ts:161-164`. Statistics hook into the same `dispatch()` lifecycle. This stays within the established `game/` is framework-agnostic / `hooks/` thin wrapper / `components/` UI layering.
- **The "Out of Scope" section is unusually disciplined.** Explicitly defers leaderboards, persistent run history, toast animations, procedural generation, difficulty scaling, music, and a separate stats screen. Each deferral is a justified simplification and aligns with the "ship the game" philosophy in `AGENTS.md`.
- **Phase structure is clean and independent.** Each phase can be merged independently. Statistics storage from Phase 2 naturally feeds achievement detection in Phase 3, but the dependency is loose (achievements use their own `achievements.ts` module, not stats).
- **The "Simplification Review" section pre-empts common scope creep.** Documenting what was deliberately not built is helpful for future maintainers.
- **Risks & Assumptions section is thoughtful.** The `no_pause` edge case for pausing during `levelComplete` is a non-obvious decision and is captured.
- **File tables per phase are a strong deliverable artifact.** Maps each change to a file path, which is exactly the input a follow-on implementation agent needs.
- **Definition of Done is comprehensive.** Includes build, lint, tests, documentation, and version bump. Aligns with `AGENTS.md` Definition of Done.

## Weaknesses

- **Several ambiguities that would block a downstream agent.** Most are small, but they would generate clarifying questions before implementation could start (see Findings 2, 3, 7, 8).
- **Documentation update tasks are listed but not detailed.** The DoD says "SPEC.md, ARCHITECTURE.md, ROADMAP.md, PROJECT_STATE.md updated" but the plan does not specify *which sections* in each document need changes. A handoff agent would have to re-read each document to determine this.
- **Coupling of side effects inside `Engine.dispatch()` is increasing.** `dispatch()` already saves high score and `lastUnlockedLevel` synchronously. Adding statistics writes (one per food eaten) and achievement writes (on unlock) expands this. Functionally fine, but worth a deliberate design pass.
- **The `wasPaused` field is a new piece of Engine-only state that is not part of `GameState`.** It is a private flag, which is fine, but the plan does not justify *why* this lives in the Engine rather than in `GameState` (where it would be more inspectable in dev tools, persisted across HMR, and simpler to reset). The plan should briefly justify this or move it.
- **Version bump target is unspecified.** The DoD says "package.json version bumped appropriately" but the target is not stated. Given M8 is at `0.8.0` (per `package.json:4`) and the ROADMAP pattern, M9 is naturally `0.9.0`.
- **The Phase 3 file table references `src/components/__tests__/Achievements.test.tsx`** but the "New tests" subsection for Phase 3 does not list this test file. Internal inconsistency.

## Major Risks

1. **Engine dispatch lifecycle ordering.** The plan states that `checkAchievements` is called "after state update, but before notifying subscribers" and that newly unlocked achievements are saved and `onAchievementUnlock` is fired. The current `Engine.ts:30-66` order is: (1) apply reducer, (2) save high score / lastUnlockedLevel, (3) notify listeners, (4) fire callbacks. Inserting achievement detection in step 2 saves from inside `dispatch()` (consistent with current localStorage pattern), but the `onAchievementUnlock` callback is fired in the same step rather than at the end like `onEat` / `onLevelUp`. Either is defensible, but the plan should be explicit about the chosen order and why.
2. **localStorage write amplification.** Each `MOVE_SNAKE` that eats food now writes the stats record. With up to 30 food per level and 10 levels, that is up to 300 writes per campaign run, plus 1 for `gamesPlayed` per game and 1 for `bestLevel` per game. Synchronous localStorage writes are not a measurable problem at this scale, but the plan does not acknowledge the cost or consider an in-memory cache flushed on gameover / pause / unload.
3. **Statistics UI placement is vague.** "Show `<Statistics>` on idle overlay" and "render `<Statistics>` inline on game over / win" leaves the exact placement and behavior (always visible vs. collapsed, scrolling on small screens, ordering relative to existing controls) up to the implementer. The ScoreBoard already lives outside the board, so re-stating it inside the overlay on game over could create visual duplication.
4. **Achievement "newly unlocked" vs. "all unlocked" UI distinction is unresolved.** The plan says "Show newly unlocked achievements" on game over, but also "Show each unlocked achievement name" generically. A precise spec is: do you list all unlocked achievements with the new one(s) highlighted, or do you list only the ones unlocked *this session*? The implementation will need this answer.
5. **Endless mode interaction with pause/level-end semantics is implicit.** Endless mode is a `playing` state, so Space pauses and the pause button is visible. The plan does not address whether the player should be able to pause endless mode. (Current behavior suggests yes, which is probably fine, but should be confirmed.)
6. **Test coverage of integration points is thin.** The plan adds unit tests for the new modules and the `GameOver` component, but does not require a test that verifies the idle overlay actually renders the new `<Statistics>` / `<Achievements>` components, nor that the `Engine` correctly saves stats on game over / level-up. Both would catch regressions a future refactor could introduce.

## Recommended Changes

- Tighten ambiguous wording in Phase 1 ("keep level as current (or 10)" → "set level to LEVEL_COUNT"), Phase 2 (decide on load mechanism: from `Engine.getStats()` vs. local `useState` initialized at mount), and Phase 3 (clarify "all unlocked" vs. "newly unlocked this session" in the GameOver overlay).
- Specify the version bump target (`0.9.0`) in DoD.
- Add a short ADR-lite note in the plan explaining why `wasPaused` lives in the Engine rather than in `GameState` — or move it to `GameState` if simpler.
- Add a per-phase documentation checklist specifying *which sections* of SPEC.md, ARCHITECTURE.md, PROJECT_STATE.md, and ROADMAP.md must change. At minimum: SPEC.md §6 (Scoring/Levels), §7 (States), §10 (UI Components), §12 (Persistence); ARCHITECTURE.md State Shape, Project Structure, Testing sections; ROADMAP.md move M9 to Completed; PROJECT_STATE.md current version, status, completed features.
- Add a brief verification step for the localStorage cost (e.g., "Profile shows no measurable jank during 30-food level at 100ms tick") or explicitly accept it as a non-goal.
- Reconcile the Phase 3 file table to include `src/components/__tests__/Achievements.test.tsx` in the "New tests" section.

---

# Detailed Findings

## F1 — Engine `wasPaused` field placement and lifecycle

- **Severity:** Medium
- **Description:** The plan introduces `private wasPaused: boolean = false` in `Engine` and resets it in `start()` / `reset()` / `startEndless()`. This is a new piece of state that lives outside `GameState`. It is required to detect the `Marathon Run` achievement. The current code keeps all "session memory" fields (like `lastUnlockedLevel`) in `GameState` even when they are derived from runtime events, except for trivial flags. There is no clear principle stated for which side a flag belongs on.
- **Recommendation:** Add a one-line justification for keeping `wasPaused` in the Engine (simpler — no reducer case needed, never read by the UI), or move it to `GameState` for consistency with other derived state. Either is fine; the plan should pick one explicitly. If kept in the Engine, the plan should also clarify that `checkAchievements` receives `wasPaused` as a parameter (already in the plan — good) and that the Engine owns the flag's mutation.

## F2 — Ambiguous "keep level as current (or 10)" in Phase 1

- **Severity:** Medium
- **Description:** The `START_ENDLESS_GAME` description in Phase 1 says "set isEndless: true, keep level as current (or 10)". The only realistic entry point is the win overlay (where `state.level === LEVEL_COUNT === 10`), so the parenthetical creates ambiguity without covering a real case.
- **Recommendation:** Specify "set level to LEVEL_COUNT" and state explicitly that the only legal call site is the win overlay (post-`state.status === 'won'`).

## F3 — Statistics loading mechanism in `useGame` is underspecified

- **Severity:** Medium
- **Description:** Phase 2 says "Load stats on mount / from engine (or use separate state)". This is one of two valid approaches: (a) add a `getStats()` method to the Engine and have the hook call it on mount, treating stats as part of the engine surface, or (b) keep stats as React-local state in `useGame` initialized at mount. Each has trade-offs (single source of truth vs. simpler types).
- **Recommendation:** Pick (a) — `engine.getStats()` exposed via `useGame().stats` — for consistency with the rest of the architecture. The Engine already owns the storage writes, so it should own the reads too. This avoids `Game.tsx` having to read localStorage directly.

## F4 — Achievements UI scope on the GameOver overlay is unclear

- **Severity:** Medium
- **Description:** Phase 3 says GameOver "Show 'Achievements Unlocked' section if any unlocked achievements exist" and "Show each unlocked achievement name". The plan also says "Game Over / Win screens show statistics and newly unlocked achievements" (in DoD). It is not clear whether the overlay should display: (a) only achievements unlocked in the just-finished run, (b) all unlocked achievements with new ones highlighted, or (c) all unlocked achievements without distinction. Each choice has different UX implications.
- **Recommendation:** Specify "show all unlocked achievements, with a visual marker (e.g., 'NEW' badge or accent color) on those unlocked in the current run". This gives the player a sense of progress without requiring a second state container for "newly unlocked in this session".

## F5 — Version bump target not specified

- **Severity:** Low
- **Description:** DoD says "package.json version bumped appropriately". The current version is `0.8.0` (M8). M9 is a feature milestone, so the natural semver bump is `0.9.0`. Without specifying this, an implementer might bump to `0.8.1` (a patch) or `1.0.0` (premature GA).
- **Recommendation:** State "bump to `0.9.0`" explicitly in the DoD. This matches the pattern established by M8.

## F6 — Phase 3 test file list inconsistency

- **Severity:** Low
- **Description:** The "New tests" subsection for Phase 3 lists only `src/game/__tests__/achievements.test.ts`, but the file table for Phase 3 lists `src/components/__tests__/Achievements.test.tsx`. An implementer would have to reconcile this.
- **Recommendation:** Add the component test file to the "New tests" subsection so both lists are consistent. The current GameOver test patterns can be mirrored for the new component.

## F7 — Plan does not specify the high score read for Statistics

- **Severity:** Low
- **Description:** Phase 2 lists "Highest Score" as a stat but says it reuses the existing `snakeHighScore` localStorage key. The plan does not say whether the Statistics component reads it directly from localStorage or from `state.highScore`. `state.highScore` is already loaded by `getInitialState()` (`state.ts:19`) and saved on gameover / win. Reading from localStorage in the component would race with the engine.
- **Recommendation:** Use `state.highScore` from the engine. This is what the Statistics component should consume. Add a one-line note in Phase 2 making this explicit.

## F8 — Documentation update tasks need section-level detail

- **Severity:** Low
- **Description:** DoD says "SPEC.md, ARCHITECTURE.md, ROADMAP.md, PROJECT_STATE.md updated" without specifying which sections. The plan should list, per phase, which sections need editing so a documentation pass is not a "find every reference" exercise.
- **Recommendation:** Add a per-phase documentation checklist. Suggested content:
  - SPEC.md §6 (Scoring and Levels — endless mode) §7 (State Machine — `START_ENDLESS_GAME`) §10 (UI Components — `Statistics` / `Achievements` panels) §12 (Persistence — new localStorage keys)
  - ARCHITECTURE.md State Shape (add `isEndless`) and Project Structure (add `statistics.ts`, `achievements.ts`)
  - ROADMAP.md: move M9 to Completed; add new "Current Progress" entry
  - PROJECT_STATE.md: bump to v0.9.0, update Current Status, add M9 to Completed Features, mark Next Milestone as TBD (M10 is "Gameplay Expansion")

## F9 — localStorage write amplification not addressed

- **Severity:** Low
- **Description:** With the new Engine integration, every food eaten triggers a `localStorage.setItem` for the stats record. The plan does not acknowledge this or propose a mitigation (in-memory cache flushed at gameover / pause / visibilitychange).
- **Recommendation:** Either (a) explicitly accept this as out of scope and add a one-line note, or (b) add a small optimization: cache the in-memory stats object and write on gameover / win / pause / `beforeunload`. The simplest is (a) for now — the volume is small and the writes are synchronous but fast.

## F10 — Engine callback ordering in Phase 3 is imprecise

- **Severity:** Low
- **Description:** The plan says "after state update, call `checkAchievements(prevState, this.state, this.wasPaused)`, save any newly unlocked achievements, and fire `onAchievementUnlock?.(achievementId)` callback for each". The current `Engine.dispatch()` (lines 30-66) has a specific order: reducer → save high score/lastUnlockedLevel → notify listeners → fire sound callbacks. Achievement detection in step 2 is consistent with the current save pattern, but the plan does not explicitly say which step to insert into. The listener-notification order matters because React will re-render on the state change, and the screen reader / toast logic depends on whether the unlock has been saved by then.
- **Recommendation:** Specify the exact insertion point: "between the `gameReducer` call and the `this.listeners.forEach(...)` call in `Engine.dispatch()`. Save the achievement to localStorage first, then fire the callback. Listeners see the new state without the achievement unlock having affected state shape (achievements live in a separate localStorage-backed record)."

## F11 — No test for idle screen showing statistics / achievements

- **Severity:** Low
- **Description:** Phase 2 / Phase 3 specify tests for the new components in isolation, but the DoD and per-phase verification sections do not require a test that `Game.tsx` actually wires them into the idle and game-over overlays.
- **Recommendation:** Add a test (likely in `Game.test.tsx`) that renders `Game` in idle state and asserts that statistics labels and achievement names appear. Existing `Game.test.tsx` is minimal (3 tests) so a small extension is appropriate.

## F12 — Phase 1 verification of "indefinitely" is vague

- **Severity:** Low
- **Description:** Phase 1 verification says "Endless mode loop runs indefinitely" and the Engine test says "Endless mode loop runs indefinitely". This is not a property a unit test can verify — it is a heuristic.
- **Recommendation:** Reword as "after N (e.g., 50) `MOVE_SNAKE` dispatches in endless mode, status remains `playing` and the snake position has changed each time". This is a precise, testable claim.

## F13 — Achievement toast/animation is out of scope, but the screen-reader announce path is not specified

- **Severity:** Low
- **Description:** The DoD says "Screen reader announces achievement unlocks" and the plan mentions "Screen reader announces new unlocks" and "Announce new achievement via screen reader region when unlocked" in the Game.tsx changes. The existing pattern in `Game.tsx:122-127` uses a ref'd `announceRef` with `STATUS_ANNOUNCEMENTS[state.status]`. There is no current mechanism to announce a one-shot event like an achievement unlock that is not tied to status. The plan should describe how the announcement is triggered.
- **Recommendation:** Specify that `useGame` exposes an `announce` callback (or a similar primitive) that writes to the existing `announceRef`. The hook's `onAchievementUnlock` callback appends "Achievement unlocked: {name}" to the live region. This re-uses the existing accessibility infrastructure.

## F14 — `Engine.test.ts` needs test-only access to `wasPaused` reset

- **Severity:** Low
- **Description:** The existing `Engine.test.ts:104-112` exposes `setState()` and `testDispatch()` as test seams. The new `wasPaused` is a private field. Tests that want to verify "win without pausing unlocks Marathon Run" need a way to assert that the field is not set. This is a public-API concern that the plan should call out.
- **Recommendation:** Add a comment in the plan that `wasPaused` is private and tests will exercise it through behavior (e.g., call `pause()` then `engine.start()` and assert that the achievement does not fire on subsequent win). No new public API is needed.

## F15 — `index.ts` barrel export updates not enumerated in the "Files Expected to Change" table

- **Severity:** Low
- **Description:** The "Shared (all phases)" file table lists `src/game/index.ts` for barrel exports. The plan correctly notes this. However, the specific exports to add are not enumerated. An implementer has to figure out: should `Stats` type, `loadStats`, `saveStats`, `Achievement` type, `ACHIEVEMENTS`, `loadAchievements`, `saveAchievement`, `checkAchievements` all be exported? Some are internal-only.
- **Recommendation:** Add a note: export the public API (types and functions used by hooks/components) but keep `checkAchievements` internal to the Engine. This matches the existing pattern of `gameReducer` being exported and `markGameOver` being internal.

## F16 — No task in plan for updating `useKeyboard` / `useTouch` hooks for endless mode

- **Severity:** Low
- **Description:** Endless mode is a `playing` state. `useTouch` is enabled when `state.status === 'playing'` (`Game.tsx:118`). `useKeyboard` consumes `state.status` and dispatches `pause` on Space when `playing`. Both will function correctly in endless mode without changes. The plan does not call this out as a "no-op" decision, which leaves a small risk that a future implementer wonders if they need to touch them.
- **Recommendation:** Add a one-line note in Phase 1: "No changes to `useKeyboard` / `useTouch` — endless mode is a `playing` state, and existing handlers are correct." This is a positive clarification.

## F17 — Dev-level select behavior in endless mode not addressed

- **Severity:** Low
- **Description:** The dev-level select uses `startAtLevel(N)`. There is no dev path into endless mode without winning level 10. This may be acceptable (endless is for after the win flow) but should be confirmed.
- **Recommendation:** Note explicitly that endless mode is reachable only via the win overlay and that no dev shortcut is provided. If a dev shortcut is desired (e.g., add a dev button "Start Endless"), say so; otherwise, this is a non-issue.

## F18 — Future-proofing concern: adding `isEndless` to `GameState` is a minor state-shape change

- **Severity:** Low
- **Description:** Adding `isEndless: boolean` to `GameState` is consistent with the current pattern (all other fields are required, default in `getInitialState()`). The default is `false` in the initial state, which preserves backward compatibility for any code that constructs a partial state (tests do this in `state.test.ts:6-25`'s `makeState` helper). Tests that use `makeState({...})` to construct states will need to be aware of the new field, but since the helper uses spread, the new field will default to `undefined` rather than `false` in those tests. The `START_ENDLESS_GAME` reducer case must set it explicitly, but the rest of the reducer logic may need to read it (`MOVE_SNAKE` should check `state.isEndless` to skip level-ups).
- **Recommendation:** Add a one-line note in the plan that all `makeState` test helpers should be updated to include `isEndless: false` to match the new contract, even if not strictly required. This avoids `undefined` vs `false` confusion in `if (state.isEndless)` checks.

---

# Handoff Assessment

## Phase structure

**Verdict: Strong.**

- Three phases, each independently shippable. Phase 1 (endless) is the smallest and most self-contained. Phase 2 (statistics) introduces a new module with localStorage writes. Phase 3 (achievements) adds detection and a new component.
- Dependencies between phases are loose: Phase 3 could in principle be developed before Phase 2 (achievements do not depend on stats), but the ordering is reasonable for incremental delivery.

## Task decomposition

**Verdict: Good, with caveats.**

- The file tables and per-phase verification sections make the work splittable.
- Caveats: the "or" branches in F2 and F3 need to be resolved before tasks are unambiguous.
- Each phase has clear "New tests" subsections. The Phase 3 inconsistency (F6) is minor.

## Verification strategy

**Verdict: Adequate, with gaps.**

- The plan explicitly calls out `npm run build`, `npm test`, `npm run lint` per phase.
- Per-phase verification is mostly behavior-driven (e.g., "Complete level 10 → win overlay shows 'Endless Mode' button"), which is good.
- Gaps: F11 (no `Game.tsx` integration test), F12 (vague "indefinitely" test claim), F13 (screen reader announce path not specified).

## Definition of DoD

**Verdict: Comprehensive, with one missing detail (F5).**

- Covers build, lint, tests, documentation, version bump.
- Missing: target version (`0.9.0`).
- Could be strengthened with a section-level documentation checklist (F8).

## AI-agent execution readiness

**Verdict: Good, with minor clarifications needed.**

- A follow-on implementation agent could start on Phase 1 with the current plan, but would need to ask about F2 and F5 before completing it.
- Phases 2 and 3 would require resolution of F3, F4, F7, F8, F10, and F13 before confident implementation.
- The file tables and code-level change descriptions (`src/game/types.ts` add `isEndless`, etc.) are concrete enough that an agent can locate the exact insertion points.
- Risk: the Engine changes span three phases and grow `dispatch()` from a ~37-line method to something noticeably longer. A clear inline plan comment block in the Engine (e.g., "Phase 1: startEndless / isEndless; Phase 2: stats writes; Phase 3: achievement detection") would help, but this is a code-style suggestion, not a plan issue.

---

# Final Recommendation

## Approve with Minor Changes

The plan is well-conceived, aligned with `ROADMAP.md`, `ARCHITECTURE.md`, and `SPEC.md`, and respects the "ship the game" philosophy. It correctly defers complexity (toast animations, procedural generation, leaderboards) and reuses established patterns (Engine callbacks, localStorage helpers, CSS modules).

The findings are mostly clarifications and small gaps that a downstream agent would need to resolve before confident implementation. None of them are blockers, but addressing F2, F3, F4, F5, F6, F8, and F10 before implementation begins will save iteration time.

**Conditions for approval:**

1. Resolve F2 (endless level value), F3 (stats loading mechanism), F4 (achievement UI scope), F5 (version target), F6 (Phase 3 test list), F8 (documentation checklist), F10 (Engine callback ordering) before starting implementation.
2. Consider F1, F9, F11, F12, F13, F15, F16, F17, F18 as small additions / clarifications to bake into the plan or the implementation comments.

**Not required for approval** (acceptable as-is or for the implementation agent to decide):

- F14 (test seam access for `wasPaused`) — current API is sufficient.
- F7 (high score read source) — `state.highScore` is the obvious answer; a one-line note in the plan would be ideal but not blocking.

Once the minor changes are folded in, the plan can be handed to an implementation agent with high confidence of unblocked execution.
