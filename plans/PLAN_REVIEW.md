# Plan Review — Milestone 13: Runner Prototype Validation

**Plan under review:** `plans/ACTIVE.md` (Milestone 13)
**Reviewer role:** Staff Engineer
**Date:** 2026-06-10
**Baseline:** v0.12.0 (M12 complete), 414 unit tests passing across 26 test files (verified via `npm test -- --run`)

---

# Overall Assessment

## Strengths

- **Roadmap alignment is direct and intentional.** The plan is the explicit realization of `docs/ROADMAP.md` §"Milestone 13 Target Vision — Runner Prototype Validation." Every feature in the plan (auto-UP movement, 3 lanes, obstacle patterns, food, distance-based scoring, HUD, game over, play again) maps to a stated M13 requirement. Nothing is invented. The validation question — "Is endless runner gameplay more engaging?" — is preserved as the success criterion.
- **Architecture alignment is exemplary.** The plan reuses the existing engine, collision, food, snake, touch, sound, Board, Cell, and useGame modules exactly as ARCHITECTURE.md documents them. The `isRunner` flag mirrors the existing `isEndless` pattern from M9. The separate `RunnerGame` component avoids bloating `Game.tsx` — the runner's UI is genuinely different (no D-pad, no pause, no level transitions, no overlays like the classic game). Inline keyboard handling in `RunnerGame` correctly avoids contaminating the shared `platform/keyboard.ts` (which has status-based Space routing and `DIRECTION_OPPOSITE` blocking that don't apply to runner mode).
- **AGENTS.md compliance is strong.** "Small changes, simple solutions, maintainable code, playable progress" is honored. No new dependencies, no new framework, no router, no state management library. The plan uses the project's existing patterns: reducer cases, Engine methods, React hooks, CSS Modules, and CSS custom property tokens.
- **Course generation is appropriately simple.** The Y-axis wrap-around + per-lap obstacle regeneration is the simplest correct way to create "constantly advancing forward" without scrolling infrastructure. The plan correctly commits to Option A from the ROADMAP.md vision (snake near bottom, world "scrolls" via wrap). Difficulty scales via a single `difficulty = min(1, distance / 500)` factor with two pattern types (single/double blockers). This is the right MVP scope.
- **Out-of-scope list is comprehensive and aligned.** The plan explicitly excludes M14 (multipliers, risk routes, growth milestones), M15 (obstacle pattern library expansion, near-miss design, difficulty director, runner events), M16 (powerups, food chains, combos), M17 (missions, achievements integration, statistics integration, unlockables), M18 (visual polish, audio pass), and ad-hoc items (pause, D-pad, online, story). Each exclusion matches a future-milestone boundary in ROADMAP.md. The "out of scope" list is the single strongest argument for plan approval.
- **Phase decomposition is clean.** 7 phases with explicit dependencies: 1–3 are tightly-coupled game logic (reducer, engine, course), 4–5 are UI components, 6 is integration, 7 is verification + docs. The plan correctly notes that "no phase requires code from future phases," enabling incremental verification after each phase.
- **Testing plan is concrete and complete.** Every phase specifies the test file, the assertions, and the verification command. New test files: `runnerCourse.test.ts`, `RunnerHUD.test.tsx`, `RunnerGameOver.test.tsx`, `RunnerGame.test.tsx`. Updates to: `state.test.ts`, `Engine.test.ts`, `MainMenu.test.tsx`. This is the right level of test coverage for a validation prototype.
- **Documentation updates are explicit in Phase 7.** SPEC.md, ARCHITECTURE.md, PROJECT_STATE.md, ROADMAP.md, and package.json are all listed with the specific changes. This is critical for the "documentation is part of implementation" rule in AGENTS.md.
- **The plan correctly identifies the audio wiring non-issue.** Phase 5 notes that `useGame` already wires `onEat`/`onGameOver`/`onLevelUp`/`onWin`/`onAchievementUnlock` universally. The runner benefits from this without modification. This is a thoughtful detail that prevents double-wiring.

## Weaknesses

- **Test baseline count is wrong.** The plan says "all existing 392 tests pass" in Phase 1 and Phase 7, and the `npm test` verification step. The actual current count is **414 tests** across 26 test files (verified via `npm test -- --run` at v0.12.0). The plan was likely drafted from `PROJECT_STATE.md` (which says 392) without re-running the suite. PROJECT_STATE.md itself is stale — M12 added 22 new tests that are not reflected in the count. The implementer should update the plan to 414, or run `npm test` to confirm the live count.
- **PROJECT_STATE.md has a stale M13 reference.** The current `docs/PROJECT_STATE.md` (v0.12.0) says `Current Milestone: Milestone 13 - Onboarding & Discoverability` and lists the priorities as "First-time player onboarding, In-game gameplay guide, Mechanics guide for food variants, Endless mode explanation." This contradicts ROADMAP.md (M13 = Runner Prototype Validation) and the plan itself. This is a **documentation drift bug** that the plan's Phase 7 must explicitly fix. The plan's Phase 7 description ("Update current milestone to M13 Runner Prototype Validation") is correct in intent but does not call out the prior inconsistency.
- **The "Runner Mode" button placement in MainMenu is ambiguous.** The plan says: "Add 'Runner Mode' button (primary, between Continue and New Game)" in two places. The current MainMenu renders: title → divider → (Continue hint if canContinue) → (Continue button if canContinue) → New Game → Statistics → Achievements → Settings → Help. There are two interpretations: (a) "between Continue and New Game" = after Continue (only when canContinue, before New Game), or (b) = after the divider, before any other button. Interpretation (a) hides the runner mode button for new players. The plan should commit to one placement and justify it.
- **`toggleSound` is referenced but not defined in the RunnerGame snippet.** Phase 5's `RunnerGame` code uses `onClick={toggleSound}` on the toolbar's sound button, but the function isn't defined anywhere in the snippet. The implementer will need to wire it to `sharedSoundManager.setEnabled()` or a similar pattern from the existing classic `Game.tsx` toolbar. The plan should either define it or remove the call and let the implementer discover the pattern.
- **The `MOVE_SNAKE` runner branch duplicates `markGameOver` logic.** Phase 1's runner short-circuit inlines the `status: 'gameover', highScore: Math.max(...), lastUnlockedLevel: Math.max(...)` block instead of calling the existing `markGameOver(state)` helper at `src/game/state.ts:29-36`. The two are functionally equivalent, but the duplication creates drift risk if `markGameOver` is updated (e.g., to add achievement tracking, stats flushing, or analytics). The plan should call `markGameOver(state)` to keep gameover semantics centralized.
- **The plan's Phase 1 line numbers (`~40-44`, `~52-60`, `~62-66`) are rough estimates.** I verified against the live `state.ts`: `START_GAME`/`RESET` is at line 40, `CHANGE_DIRECTION` is at 52, `MOVE_SNAKE` is at 62. The estimates are accurate enough, but the plan should say "verify line numbers against the current file before editing" to prevent stale guidance.
- **The plan does not specify `spawnFood`'s default behavior when `forceType` is undefined.** Phase 1's `food.ts` modification adds an optional `forceType?: FoodType` parameter. The classic game's existing call sites do not pass this parameter. The implicit contract is "when undefined, fall back to `rollFoodType()`." The plan should state this explicitly so the implementer doesn't break the classic game's weighted random spawn (80/10/5/5).
- **Classic and runner high scores are unified.** The plan states: "`storage.ts` — `saveHighScore` uses the same `snakeHighScore` key; runner saves on gameover." This means a runner distance record and a classic level-based score share the same number on the main menu. For a validation prototype this is acceptable — the question is "is runner more engaging," not "which mode has the best score." But the implementer should be aware that a runner run will overwrite a classic high score. The plan should call this out as an explicit design choice.
- **Initial snake has a visual quirk.** Phase 1's `START_RUNNER` reducer creates a snake with two stacked body segments at y=19 (`{ x: RUNNER_LANE_X[1], y: 19 }, { x: RUNNER_LANE_X[1], y: 19 }`). The first frame shows a 3-segment snake with overlapping tail. The plan notes this in a comment but does not address whether this is intentional or a bug to fix in polish. The cleaner alternative is `INITIAL_SNAKE.map(seg => ({ ...seg, y: seg.y + 9 }))` (shift the classic starting snake down 9 rows), but this is a small visual nit and not a blocker.
- **`generateRunnerCourse` uses `Math.random()` without seeded RNG.** The plan's course generation calls `Math.random()` for both pattern count (via difficulty) and lane selection. This makes tests non-deterministic. The plan's test list for `runnerCourse.test.ts` includes properties like "Every row has at least one clear lane" that are stable regardless of RNG, but a determinism test (run 1000 times, all results satisfy invariants) would be stronger. The plan should either mock `Math.random` in tests or note that the existing non-determinism is acceptable for a prototype.
- **The plan's `Engine.startRunner()` does not call `stopLoop()` before dispatching.** The existing `start()`, `startAtLevel()`, `startEndless()`, and `continueGame()` methods all follow the same pattern (dispatch then startLoop with startLoop's `if (this.rafId !== null) return` guarding against duplicate loops). The plan is consistent with the existing pattern. This is a **non-issue** — the loop guard handles it — but the plan should note that the runner benefits from the same guard.
- **The plan's `Engine.startLoop` speed branch is the right idea but order-sensitive.** Phase 2's snippet puts the `isRunner` branch first, skipping the `getLevelData(this.state.level)` call. The current code at `Engine.ts:235` calls `getLevelData` once per tick for all modes. The plan's branch is correct, but the implementer must ensure the runner branch returns early or skips the `getLevelData` call. The plan's snippet is correct; just flagging that the order matters.
- **The plan does not address the pre-existing test flakiness in `state.test.ts`.** `docs/PROJECT_STATE.md` §"Known Technical Debt" item 1: "Pre-existing test flakiness: `state.test.ts > MOVE_SNAKE spawns replacement normal food when timer reaches 0` — Gold food timer expiry occasionally spawns gold instead of normal food due to non-deterministic RNG in `food.ts`." The new runner tests won't trigger this (the runner uses only `'normal'` food), but the implementer should be aware that a flaky test exists in the baseline. The plan should note that the runner's `forceType: 'normal'` path sidesteps this known issue.
- **The plan does not address PWA service worker behavior for new files.** The M3 PWA infrastructure uses `vite-plugin-pwa` with workbox precaching of all static assets. New files (`RunnerGame.tsx`, `RunnerHUD.tsx`, `RunnerGameOver.tsx`, `runnerCourse.ts`) will be auto-cached at build time. This is fine for the M13 milestone — no service worker changes are needed. The plan should briefly note this so the implementer doesn't accidentally modify `vite.config.ts` or the manifest.
- **The "match existing ScoreBoard visual style" reference is vague.** Phase 4 says RunnerHUD should "match existing ScoreBoard visual style" but does not reference specific class names, color tokens, or layout patterns. The implementer will need to read `src/components/ScoreBoard.tsx` and `ScoreBoard.module.css` to extract the style. The plan should reference the file paths explicitly.
- **The Runner Mode button color/styling is unspecified.** Phase 6 says "Use a distinct style (e.g., accent border or slightly different color) to highlight it as the primary new mode." This is too vague. The implementer will need to design. The plan should either provide a CSS class sketch (e.g., `runnerButton { border: 2px solid var(--color-accent); }`) or defer the visual to the implementer's judgment.
- **The `RunnerGame` start overlay is INSIDE `boardRef`.** Phase 5's JSX renders the start prompt and game over overlay as children of `<div ref={boardRef}>`. The `useTouch` hook attaches the gesture recognizer to the boardRef element. The recognizer is `enabled: state.status === 'playing' && state.isRunner`, so during the start prompt the recognizer is disabled — tapping the start button works because it's a `<button>`. But if a user swipes during the start prompt and the game starts, the swipe could fire on the very first frame. The plan should verify this behavior or move the start overlay outside the boardRef.
- **The `RunnerGame` does not handle Escape key to navigate to menu.** Classic `Game.tsx` uses Space for pause/resume; runner has no pause. An Escape key binding for "return to menu" would be a small UX addition. Out of scope for M13, but worth flagging as a polish candidate.
- **The plan does not address the `useGame` Engine create-on-mount contract.** `useGame.ts:10-13` creates a new `Engine` on first render of the consuming component. With the runner being a separate component (`RunnerGame.tsx`), each mount of `RunnerGame` creates a fresh Engine. When the user navigates Runner → Menu → Runner, the second mount creates a second Engine. The `useEffect` cleanup at `useGame.ts:30-32` calls `engine.destroy()` on unmount, so the first Engine is cleaned up. The plan should note that this is the intended behavior and that profile/high-score persistence works across the create/destroy cycle.

## Major Risks

1. **Documentation drift between PROJECT_STATE.md, ROADMAP.md, and the plan.** PROJECT_STATE.md currently says M13 = "Onboarding & Discoverability"; ROADMAP.md and the plan both say M13 = "Runner Prototype Validation." The plan's Phase 7 must explicitly fix PROJECT_STATE.md to align with the new direction. Without this fix, the docs will be contradictory at the end of the milestone. (Weakness #2; same severity as the wrong test count.)

2. **The Runner Mode button placement creates two reasonable implementations.** A new implementer could place the button before or after Continue. The plan does not justify its choice. The recommended placement is "after the divider, before New Game, regardless of `canContinue`" — this makes runner mode equally discoverable for new and returning players. Without explicit guidance, the implementer may choose the wrong placement and miss the validation opportunity (a player who never sees the Runner Mode button cannot validate the concept).

3. **The `MOVE_SNAKE` runner branch's inline gameover logic will drift from `markGameOver` over time.** The plan's snippet hardcodes the gameover state shape. If M14+ adds achievement tracking on death, stats flushing, or analytics calls to `markGameOver`, the runner's inline logic will not benefit. The recommended fix is to call `markGameOver(state)` from the runner branch and let the helper centralize the contract.

4. **The high-score key is shared between classic and runner modes.** A player who plays both modes will see only the higher of the two scores. For a validation prototype, this is acceptable. For a polished release, the modes should have separate leaderboards. The plan should explicitly call this out so a future milestone can split the keys if the runner concept is validated.

5. **The plan's `isRunner` flag pattern does not generalize.** The plan adds a runner-specific short-circuit at the top of `MOVE_SNAKE`, runner-specific speed branching in `startLoop`, and runner-specific state fields (`isRunner`, `distance`, `lane`). If M14+ adds more modes (e.g., "Time Attack," "Zen Mode"), each will add another short-circuit and another speed branch. The architecture is "mode flag + conditional short-circuit" — simple for 2 modes, awkward for 4+. The plan should note that the current pattern is appropriate for M13 but a polymorphic dispatch or per-mode engine would be considered if the mode count exceeds 3.

## Recommended Changes

### Required (must apply)

1. **Update test baseline to 414.** Replace "392 tests" with "414 tests" in Phase 1, Phase 7, and the DoD. Verify the count with `npm test -- --run` before merging.
2. **Add an explicit "Fix PROJECT_STATE.md M13 reference" item to Phase 7.** The current `docs/PROJECT_STATE.md` says M13 = "Onboarding & Discoverability" and lists unrelated priorities. The plan's Phase 7 must overwrite this to "Runner Prototype Validation" and update priorities to runner-mode-specific items. Without this fix, PROJECT_STATE.md remains a documentation liar.
3. **Define or remove `toggleSound` in the RunnerGame snippet.** Either add the implementation (`const toggleSound = () => sharedSoundManager.setEnabled(!sharedSoundManager.isEnabled());`) or remove the toolbar sound button from M13. The button is small polish, not core gameplay; removing it is acceptable.
4. **Commit to a single "Runner Mode" button placement in MainMenu.** Recommended: "after the neon divider, before New Game, always visible (not gated on `canContinue`)." This makes the runner mode equally discoverable. Update Phase 6's MainMenu section to be explicit.
5. **Call `markGameOver(state)` in the runner's `MOVE_SNAKE` branch.** Replaces the inline gameover block with a single helper call. Maintains the contract that all gameovers go through the centralized helper.

### Recommended (should apply)

6. **Specify `spawnFood`'s default behavior when `forceType` is undefined.** Add a one-line comment: "When undefined, falls back to `rollFoodType()` for backward compatibility with classic mode."
7. **Note the PWA service worker auto-caching of new files.** Phase 7 should add: "New component files are auto-cached by the existing workbox precache at build time; no service worker changes are needed."
8. **Add a determinism check to `runnerCourse.test.ts`.** A "run generation 100 times, all results satisfy invariants" test would catch any non-determinism regression. The plan's current test list is property-based (no RNG mocking needed) but doesn't explicitly exercise randomness stability.
9. **Note the pre-existing test flakiness is unaffected.** Add a one-liner to Phase 7: "The pre-existing `state.test.ts` gold-food-timer flakiness (PROJECT_STATE.md §Known Technical Debt) is not affected by M13 changes — the runner's `forceType: 'normal'` path sidesteps the non-deterministic RNG branch."
10. **Reference `ScoreBoard.tsx` and `ScoreBoard.module.css` for RunnerHUD visual style.** Phase 4 should say "match the visual style of `src/components/ScoreBoard.tsx` and its CSS Module" rather than the abstract "match existing ScoreBoard visual style."

### Optional (nice to have)

11. **Move the start overlay outside `boardRef` in `RunnerGame`.** Renders the overlay as a sibling of the board, not a child. This eliminates the theoretical touch-handler-overlap concern.
12. **Add an Escape-to-menu binding in `RunnerGame` keyboard handler.** A small UX addition (`key === 'Escape' && onNavigateToMenu?.()`). Optional for M13 but aligns with the classic game's pause-to-menu flow.
13. **Add a `runnerMode: boolean` field to `GameProfile` for future separation.** Out of scope for M13, but a one-line addition to `src/game/profile.ts` would let M14+ split the high-score key without a refactor. Defer this if the M13 scope is tight.

---

# Detailed Findings

## Finding 1 — Test baseline count is wrong (Phase 1, Phase 7, DoD)

- **Severity:** Critical
- **Description:** The plan repeatedly references "392 existing tests" (Phase 1 acceptance, Phase 7 verification, DoD checklist). The actual current count is **414** across 26 test files (verified via `npm test -- --run` at v0.12.0). The plan was likely drafted from `docs/PROJECT_STATE.md` (which itself says 392) without re-running the test suite. PROJECT_STATE.md is also stale on this point.
- **Recommendation:** Update the plan to reference 414 tests, or instruct the implementer to run `npm test -- --run` and use the live count. Update PROJECT_STATE.md's "Completed Features → M12" section to reflect the correct count (392 + 22 = 414).

## Finding 2 — PROJECT_STATE.md has stale M13 reference

- **Severity:** Critical
- **Description:** `docs/PROJECT_STATE.md` line 24-30 says: `Current Milestone: Milestone 13 - Onboarding & Discoverability` and lists priorities as "First-time player onboarding, In-game gameplay guide, Mechanics guide for food variants, Endless mode explanation." This contradicts `docs/ROADMAP.md` (M13 = Runner Prototype Validation) and the plan itself. The drift predates the plan but the plan's Phase 7 must fix it.
- **Recommendation:** Add an explicit Phase 7 step: "Update `docs/PROJECT_STATE.md` to reflect that M13 is Runner Prototype Validation. Update the priorities list to runner-mode-specific items. Update the version bump to 0.13.0."

## Finding 3 — `toggleSound` is referenced but not defined in the RunnerGame snippet

- **Severity:** High
- **Description:** Phase 5's `RunnerGame.tsx` code (line 551 in the plan) uses `onClick={toggleSound}` on the toolbar's sound button. The function is not defined anywhere in the snippet. The implementer will either invent a definition or get stuck.
- **Recommendation:** Add the implementation to the snippet: `const toggleSound = () => sharedSoundManager.setEnabled(!sharedSoundManager.isEnabled()); setSoundOn(sharedSoundManager.isEnabled());`. Or remove the toolbar sound button from M13 (it's polish, not core gameplay).

## Finding 4 — "Runner Mode" button placement in MainMenu is ambiguous

- **Severity:** High
- **Description:** Phase 6's MainMenu section says: "Add 'Runner Mode' button (primary, between Continue and New Game)" and the design sketch shows it after the neon divider. There are two reasonable interpretations: (a) after Continue (only when `canContinue`, before New Game), or (b) after the divider, before any other button. The current MainMenu renders Continue only when `lastUnlockedLevel > 1`, so interpretation (a) hides the runner for new players. The plan should commit to one placement.
- **Recommendation:** Specify: "The Runner Mode button is rendered after the neon divider, before the Continue/New Game buttons, always visible regardless of `canContinue`." Justify: "Runner mode is a primary navigation option; hiding it for new players misses the validation opportunity."

## Finding 5 — `MOVE_SNAKE` runner branch duplicates `markGameOver` logic

- **Severity:** High
- **Description:** Phase 1's `MOVE_SNAKE` runner short-circuit (line 199-204 in the plan) inlines the gameover state shape (`status: 'gameover', highScore: Math.max(...), lastUnlockedLevel: Math.max(...)`). The existing `markGameOver` helper at `src/game/state.ts:29-36` does the same thing. Duplication creates drift risk if `markGameOver` is extended.
- **Recommendation:** Replace the inline block with `return markGameOver(state);`. This keeps all gameover transitions routed through the same helper.

## Finding 6 — `spawnFood` default behavior for `forceType` is unspecified

- **Severity:** High
- **Description:** Phase 1's `food.ts` modification adds an optional `forceType?: FoodType` parameter. The plan's snippet does not show the function's body, only the signature change. The implicit contract is "when undefined, fall back to `rollFoodType()`." This must be stated explicitly so the implementer doesn't break the classic game's weighted random spawn (80/10/5/5).
- **Recommendation:** Add to Phase 1's `food.ts` row: "When `forceType` is undefined, the function falls back to `rollFoodType()` for backward compatibility with classic mode. Classic mode's existing call sites do not pass this parameter."

## Finding 7 — Classic and runner high scores are unified

- **Severity:** High
- **Description:** The plan states: "`storage.ts` — `saveHighScore` uses the same `snakeHighScore` key; runner saves on gameover." This means a runner distance run will overwrite a classic level-based high score. For a validation prototype, this is acceptable but should be called out as a design choice.
- **Recommendation:** Add to the "Out of Scope" section or as a Phase 7 documentation note: "Classic and runner share the same high score key (`snakeHighScore`). M13 is a validation prototype; if the runner concept is validated, M14+ should consider separate leaderboards per mode."

## Finding 8 — Phase 1 line numbers are rough estimates

- **Severity:** Medium
- **Description:** Phase 1 says: "ADD `START_RUNNER` case (lines ~40-44). ADD `CHANGE_LANE` case (lines ~52-60). ADD runner short-circuit at top of `MOVE_SNAKE` (lines ~62-66)." I verified against the live `state.ts`: `START_GAME`/`RESET` is at line 40, `CHANGE_DIRECTION` is at 52, `MOVE_SNAKE` is at 62. The estimates are accurate today but will drift if the file is edited between plan approval and implementation.
- **Recommendation:** Replace the line numbers with: "ADD `START_RUNNER` case after `RESET`. ADD `CHANGE_LANE` case after `CHANGE_DIRECTION`. ADD runner short-circuit at the top of `MOVE_SNAKE`, returning early before level-based logic. Verify line numbers against the current file before editing."

## Finding 9 — Initial snake has overlapping tail segments

- **Severity:** Medium
- **Description:** Phase 1's `START_RUNNER` reducer creates a snake with two stacked body segments at y=19: `[(x:10, y:18), (x:10, y:19), (x:10, y:19)]`. The first frame shows a 3-segment snake with overlapping tail (two body cells at the same position). The plan notes this in a comment but does not address whether this is intentional.
- **Recommendation:** Either accept the visual quirk and add a comment explaining why, or use `INITIAL_SNAKE.map(seg => ({ ...seg, y: seg.y + 9 }))` to shift the classic starting snake down 9 rows. The latter is cleaner but requires updating the comment.

## Finding 10 — `generateRunnerCourse` uses `Math.random()` without seeded RNG

- **Severity:** Medium
- **Description:** The course generation calls `Math.random()` for pattern count and lane selection. This makes tests non-deterministic. The plan's test list for `runnerCourse.test.ts` includes properties that are stable regardless of RNG ("Every row has at least one clear lane"), but a determinism test would be stronger.
- **Recommendation:** Add to Phase 3's test plan: "Run `generateRunnerCourse` 100 times; verify all 100 results satisfy the invariants (no row fully blocked, no obstacle on snake, food not on obstacle, food type is `'normal'`)." Alternatively, mock `Math.random` in tests. Either approach is acceptable for a prototype.

## Finding 11 — `Engine.startLoop` speed branch order matters

- **Severity:** Medium
- **Description:** Phase 2's snippet puts the `isRunner` branch first, skipping the `getLevelData(this.state.level)` call. The current code at `Engine.ts:235` calls `getLevelData` once per tick for all modes. The plan's branch is correct, but the implementer must ensure the runner branch returns early or skips the `getLevelData` call.
- **Recommendation:** The plan's snippet is correct as written. No change needed; just flagging for the implementer that the branch order must be preserved (runner first, then classic).

## Finding 12 — Pre-existing test flakiness is unaddressed

- **Severity:** Medium
- **Description:** `docs/PROJECT_STATE.md` §"Known Technical Debt" item 1: "Pre-existing test flakiness: `state.test.ts > MOVE_SNAKE spawns replacement normal food when timer reaches 0`." The new runner tests won't trigger this (the runner uses only `'normal'` food), but the implementer should be aware.
- **Recommendation:** Add a one-liner to Phase 7: "The pre-existing `state.test.ts` gold-food-timer flakiness is not affected by M13 changes — the runner's `forceType: 'normal'` path sidesteps the non-deterministic RNG branch in `food.ts`."

## Finding 13 — PWA service worker behavior is unaddressed

- **Severity:** Medium
- **Description:** The M3 PWA infrastructure uses `vite-plugin-pwa` with workbox precaching. New files (`RunnerGame.tsx`, `RunnerHUD.tsx`, `RunnerGameOver.tsx`, `runnerCourse.ts`, their CSS Modules) will be auto-cached at build time. This is fine for M13, but the plan should note it so the implementer doesn't modify `vite.config.ts` or the manifest.
- **Recommendation:** Add to Phase 7: "New component files are auto-cached by the existing workbox precache at build time. No service worker or manifest changes are required."

## Finding 14 — Vague reference to ScoreBoard visual style

- **Severity:** Low
- **Description:** Phase 4 says RunnerHUD should "match existing ScoreBoard visual style" but does not reference specific class names, color tokens, or layout patterns.
- **Recommendation:** Replace with: "Match the visual style of `src/components/ScoreBoard.tsx` and its CSS Module — use the same `aria-live`, `var(--color-*)` tokens, and grid layout pattern."

## Finding 15 — Runner Mode button color/styling is unspecified

- **Severity:** Low
- **Description:** Phase 6 says: "Use a distinct style (e.g., accent border or slightly different color) to highlight it as the primary new mode." The implementer will need to design.
- **Recommendation:** Provide a CSS class sketch: `styles.runnerButton { border: 2px solid var(--color-accent); }`. Or defer the visual to the implementer's judgment and add a "design polish" note to Phase 7.

## Finding 16 — Start overlay is inside `boardRef`

- **Severity:** Low
- **Description:** Phase 5's JSX renders the start prompt and game over overlay as children of `<div ref={boardRef}>`. The `useTouch` hook attaches the gesture recognizer to the boardRef element. The recognizer is disabled when not playing, so the start button works. But if a user swipes during the start prompt and the game starts, the swipe could fire on the first frame.
- **Recommendation:** Move the start overlay outside `boardRef` (render as a sibling of the board, not a child). This eliminates the theoretical touch-handler-overlap concern. Or verify with a manual test that no false swipe fires.

## Finding 17 — No Escape key for menu navigation

- **Severity:** Low
- **Description:** Classic `Game.tsx` uses Space for pause/resume; runner has no pause. An Escape key binding for "return to menu" would be a small UX addition. Out of scope for M13, but worth flagging.
- **Recommendation:** Add `else if (key === 'Escape' && onNavigateToMenu) onNavigateToMenu();` to the inline keyboard handler in Phase 5. Optional for M13.

## Finding 18 — `useGame` Engine create-on-mount contract is unaddressed

- **Severity:** Low
- **Description:** `useGame.ts:10-13` creates a new `Engine` on first render of the consuming component. With the runner being a separate component, each mount of `RunnerGame` creates a fresh Engine. The `useEffect` cleanup at `useGame.ts:30-32` calls `engine.destroy()` on unmount. The plan should note that this is the intended behavior and that profile/high-score persistence works across the create/destroy cycle.
- **Recommendation:** Add to Phase 5's "Audio wiring challenge" section: "The `useGame` hook creates a new Engine on first render of `RunnerGame`. The `useEffect` cleanup at unmount calls `engine.destroy()`. Profile and high-score persistence work across the create/destroy cycle via localStorage. This is the same pattern as the classic game."

---

# Handoff Assessment

## Phase structure

**Grade: Excellent.** 7 phases with explicit dependencies. Phases 1–3 (reducer, engine, course) are tightly coupled game logic and can be developed together (the plan correctly notes this). Phases 4–5 (UI components) depend on Phases 1–3. Phase 6 (navigation) wires everything together. Phase 7 (verification + docs) is the final gate. Each phase is independently verifiable.

The phase ordering is correct: data model → engine → course → UI components → integration → docs. The plan correctly notes that "no phase requires code from future phases."

## Task decomposition

**Grade: Excellent.** Each phase lists:
- Goal (single sentence)
- Files to modify/create
- Code snippets (for non-trivial logic)
- Risks (with mitigations)
- Testing approach
- Acceptance criteria (checkboxes)

The file-level granularity is appropriate for an AI agent to execute. The code snippets are detailed enough to be unambiguous (state transitions, type signatures, prop interfaces).

## Verification strategy

**Grade: Good, with one critical fix needed.**

**Per-phase verification:**
- Phase 1: `npm test`, `npm run lint`. Acceptance criteria in checkboxes.
- Phase 2: `Engine.test.ts` additions. `npm test`.
- Phase 3: `runnerCourse.test.ts` (new file). `npm test`.
- Phase 4: `RunnerHUD.test.tsx`, `RunnerGameOver.test.tsx`. `npm test`.
- Phase 5: `RunnerGame.test.tsx`. Manual smoke test.
- Phase 6: `MainMenu.test.tsx` update. Manual flow test.
- Phase 7: `npm test`, `npm run lint`, `npm run build`, manual gameplay test, mobile test.

**Gaps:**
1. **Test baseline count is wrong** (Finding 1). The plan says 392; the live count is 414. Critical to fix.
2. **No determinism check** for `generateRunnerCourse` (Finding 10). The test list is property-based but doesn't explicitly exercise randomness stability.
3. **Manual checklist conflates machine and human** (Finding 7 from the M12 review applies here too). The plan's manual checklist includes "Start runner from menu," "Snake moves UP automatically," etc. — these require a human or a full integration test. The plan should mark each item as `[MACHINE]` (e.g., covered by automated tests) or `[HUMAN]` (e.g., requires manual play).

## Definition of Done

**Grade: Adequate, with two critical fixes needed.**

The DoD is a 12-item checklist:
- Runner Mode playable
- Snake auto-advances UP
- 3-lane system responsive
- Obstacles appear, collision ends run
- Food in lanes, collection increases score/length
- Distance-based scoring with HUD
- Game over shows stats; Play Again under 2 seconds
- Classic level-based game remains fully functional
- All tests pass
- Lint clean
- Build clean
- All documentation updated
- Success question answerable

**Missing:**
1. **Test count is wrong** (Finding 1) — should say 414.
2. **PROJECT_STATE.md update is not in DoD** (Finding 2) — should be a separate item.
3. **Package.json version bump is in Phase 7 but not in DoD** — the M12 review recommended making this a separate DoD item. The current plan includes it in Phase 7's documentation list, which is fine, but a separate DoD entry would make the check explicit.

## AI-agent execution readiness

**Grade: Good, with five ambiguity points to resolve before implementation.**

1. **Test baseline count** (Finding 1) — must be updated from 392 to 414.
2. **PROJECT_STATE.md fix** (Finding 2) — must be explicit in Phase 7.
3. **`toggleSound` definition** (Finding 3) — must be defined or removed.
4. **Runner Mode button placement** (Finding 4) — must be committed.
5. **`markGameOver` reuse** (Finding 5) — should be reused in the runner branch.

Other than these five, an AI agent with the plan plus AGENTS.md plus ROADMAP.md and ARCHITECTURE.md should be able to execute the milestone without further human input. The code snippets are detailed, the file paths are exact, and the acceptance criteria are concrete.

---

# Gameplay Design Review

This section evaluates the proposed plan as a *game*, not as an *engineering artifact*. The questions are:

1. Does the Y-wrap approach create the feeling of an endless runner?
2. Would a scrolling-world approach be necessary to validate the product hypothesis?
3. Does the proposed lane system allow snake growth to create meaningful gameplay consequences?
4. Is the runner fun?
5. Does snake growth improve the runner?

The answers are based on the plan as written, plus the design space implied by the existing codebase and the ROADMAP.md M13 vision.

---

## Endless Runner Feel — Y-Wrap vs Scrolling-World

### What "endless runner" actually means

The benchmark products in ROADMAP.md (Temple Run, Subway Surfers, Jetpack Joyride) share three properties that define the genre:

- **Continuous forward motion.** The world scrolls past a roughly stationary player. The player's character is at a fixed visual anchor (center-bottom, center-screen). New content approaches from a "horizon."
- **Approaching obstacles.** Obstacles spawn ahead and travel toward the player. The player has time to *see*, *decide*, and *react*. Speed is felt as the *rate of incoming obstacles*, not as the player's position changing.
- **Camera follows the player.** The camera is fixed relative to the player. The world moves; the player does not (visually).

A valid runner prototype must deliver at least the first two. The third is presentation.

### The Y-wrap approach in detail

The plan's `MOVE_SNAKE` runner branch:
```ts
let newHead: Position = { x: RUNNER_LANE_X[state.lane], y: head.y - 1 };
const wrapped = newHead.y < 0;
if (wrapped) newHead = { ...newHead, y: 19 };
```

The head moves from y=18 to y=0 over 18 ticks, then *teleports* to y=19. Obstacles are static on the grid until a wrap regenerates the course.

### What the player sees

- **Tick 1 (head at y=18):** Snake near bottom. Player sees one row of free space above.
- **Tick 5 (head at y=14):** Snake in middle of board. Player has scanned 5 rows.
- **Tick 18 (head at y=0):** Snake at top of board. Player has seen the whole grid.
- **Tick 19 (head at y=19):** **HARD TELEPORT.** The snake jumps from the top row to the bottom row. The course behind the snake's old position is *replaced* with new obstacles. There is no visual continuity.

This is **not** an endless runner feel. This is "Snake on a 20-cell tall loop." The player is not advancing; the player is climbing and falling.

### The closest analogue is Jetpack Joyride

Jetpack Joyride is vertical, and the character *does* move up. But Jetpack Joyride has:

- A camera that follows the character continuously (no teleport).
- Obstacles that spawn ahead and approach.
- Visual scrolling of the background.
- The character is always at a fixed screen position once the camera locks on.

The Y-wrap approach has none of these.

### What the Y-wrap does deliver

- **Survival pressure** (speed ramp from 200ms to 80ms).
- **Lane decision-making** (single vs. double blockers).
- **Distance as a metric** (each tick = 1 distance unit).

These are the *mechanics* of an endless runner, but not the *feel*.

### Would scrolling-world be necessary to validate the hypothesis?

**Yes, for accurate validation. No, for first-pass validation.**

**The case for "yes":**
- The product hypothesis is "is endless runner more engaging?" The Y-wrap is a *poor simulation* of the genre. A negative validation result might mean "the Y-wrap prototype is boring" rather than "the endless runner concept is wrong."
- A scrolling-world prototype has the same gameplay depth (or lack thereof) as Y-wrap, but with stronger presentation. The validation result is more likely to reflect the *concept* than the *implementation*.
- The cost of a scrolling-world is moderate: camera offset + scroll speed + render offset. No new game logic, no new state. The reducer and Engine remain the same. The change is isolated to rendering.

**The case for "no" (i.e., Y-wrap is fine for M13):**
- The plan is explicitly a validation prototype. ROADMAP.md says: "Implementation may be simple. Sophisticated balancing is not required."
- The Y-wrap is dramatically simpler. No camera state, no scroll offset, no render-time transform. Less surface area for bugs.
- A negative validation result on the Y-wrap is still informative: it tells the team that the *mechanics* (lane-based, distance-scored, growth-aware) are not engaging even with simple presentation. The team can then decide whether to invest in scrolling-world for M14.

**Recommendation:**
- Accept the Y-wrap for M13, but **explicitly commit to a follow-up evaluation.** Phase 7 should add: "If playtesting suggests the prototype feels like 'climbing and falling' rather than 'endless running,' add a `docs/M14_SCROLLING_WORLD_FEASIBILITY.md` note that captures the design constraints for a M14+ scrolling implementation. Do not interpret a 'no' on the Y-wrap as a 'no' on the concept."
- Alternatively, if the team has appetite for slightly more engineering: implement a **partial scroll offset** in the Board renderer. The snake and obstacles are at the same coordinates, but the Board translates them visually by a sub-cell offset. This gives the feel of continuous motion without restructuring the game state. Estimated effort: 1–2 hours.

---

## Lane System and Snake Growth

### The plan's lane system

- 3 lanes at x = [4, 10, 16].
- Lane changes are **instant**: the head's x jumps to `RUNNER_LANE_X[newLane]`, the body keeps its old x.
- After several ticks, the snake becomes a **staircase**: head in current lane, body in previous lanes.

### What this means for self-collision

The plan's `CHANGE_LANE` reducer:
```ts
return {
  ...state,
  lane: newLane,
  snake: [{ x: RUNNER_LANE_X[newLane], y: head.y }, ...state.snake.slice(1)],
};
```

After `CHANGE_LANE(1)`, the head is at lane 2 (x=16), and the body is at lane 1 (x=10). The snake is now L-shaped.

On the next `MOVE_SNAKE`, the new head is at (16, y-1), and the body is [(16, y), (10, y+1)]. The body has a "stair step" at y+1.

As the snake grows, the staircase gets longer. A snake of length 5 might span 2–3 lanes vertically. A snake of length 10 might span all 3 lanes.

### What this means for obstacle collision

In the plan, only the **head's position** is checked against obstacles (via `isCollision(newHead, state.snake, state.obstacles, false)`). The body's positions are only checked against the head for self-collision.

This means:
- A longer snake's **body** can pass through obstacles without dying. Only the head matters.
- A longer snake does **not** become harder to navigate around obstacles. The body is "invisible" to the obstacle layer.

### Does growth create meaningful consequences?

**Currently: no.**

In the proposed design, snake growth has the following effects:
- **Visual length:** The snake is visibly longer. The player sees their survival progress.
- **Score per food:** +10 points per food. Marginal.
- **Staircase depth:** The body spreads across more lanes (visually), but this doesn't affect control.

The player can switch lanes **instantly and freely** at any length. A length-30 snake is controlled identically to a length-3 snake. There is no risk-reward tension around growth.

**Compare to the M14 vision (ROADMAP.md §"Snake Growth Risk System"):**
- "Longer snakes consume more space."
- "Navigation becomes more difficult."
- "Mistakes become more punishing."

None of these are present in the M13 plan. Growth is a *reward* with no *risk*.

### The product hypothesis depends on this

The product vision (ROADMAP.md, lines 22–49) says:
> "The unique differentiator is snake growth and length-based risk management."

If the M13 prototype has no length-based risk, it is not validating the differentiator. The team may answer "yes, runners are engaging" or "no, runners are not engaging" — but they cannot answer "yes, snake growth adds tension to a runner." That question is deferred to M14.

**This is acceptable for M13** (the prototype is a stepping stone to M14), but it must be **explicitly documented.** The validation question is "is the *base runner loop* engaging?" not "is the *full snake growth + risk* loop engaging?"

### Minimal changes that would allow growth-based risk to emerge

Three options, in order of increasing complexity:

**Option 1: Tail lane blocking (low complexity, high impact)**
- When the snake's body occupies a lane at a given y, the player cannot change to that lane until the body clears it.
- The reducer's `CHANGE_LANE` checks: "Is the new lane occupied by the snake's body at the head's y?" If yes, ignore the input.
- Effect: a longer snake blocks more lane changes. The player has fewer escape routes. Risk emerges.

**Option 2: Body fan-out (low complexity, medium impact)**
- The snake grows by adding segments in a **perpendicular lane** to the current head. Length 3 = 1 lane. Length 5 = 2 lanes. Length 7 = all 3 lanes.
- The body spreads across the board as the snake grows. The player must navigate around their own body.
- Effect: a longer snake is literally wider. Lane changes become constrained by the snake's own footprint.

**Option 3: Speed scaling with length (lowest complexity, lowest impact)**
- The snake's effective speed scales with length: `effectiveSpeed = max(MIN, INITIAL - length * 2)`.
- Effect: a longer snake is faster, which makes lane changes harder to time. Risk emerges from reaction time, not from control.

**Recommendation:**
- **Option 1 (tail lane blocking)** is the minimal change that creates real risk. It is a 5-line change to the `CHANGE_LANE` reducer. It does not affect rendering, course generation, or the Y-wrap. It is the right M13 scope.
- **Option 2 (body fan-out)** is more visually interesting but requires changing the snake's growth model. The visual is more "snake-like" but the engine is more complex. Defer to M14.
- **Option 3 (speed scaling)** is a one-line change to the Engine's speed curve. It is the lowest-effort option, but it adds risk through *difficulty*, not through *control*. The player doesn't learn that length is risky; they learn that the game is fast. This is weaker as a "growth risk" signal.

**Recommended minimal change for M13: Option 1 (tail lane blocking).**
- If the team wants to validate "does growth add risk," this is the smallest change that delivers an answer.
- If the team is comfortable answering the question in M14 instead, the M13 prototype can ship without it (with the caveat explicitly documented).

---

## Is the Runner Fun?

### Components of fun in a runner

- **Skill expression:** The player can improve at the game. Better play = better outcomes.
- **Tension:** The player feels pressure. Decisions matter.
- **Variety:** The game is not the same every run.
- **Mastery:** The player learns patterns and improves at predicting them.
- **Feedback:** The game acknowledges near-misses, good plays, milestones.

### The proposed runner

| Component | Present? | Notes |
|---|---|---|
| Skill expression | **Weak** | Lane choices are binary. There are only 3 lanes and 2 pattern types. The decision is trivial: "is the next row blocked in my lane? If yes, switch to a free lane." |
| Tension | **Moderate** | Speed ramps from 200ms to 80ms. The player has less time to react at higher distance. |
| Variety | **Weak** | Only 2 pattern types (single blocker, double blocker). Course regenerates each lap but with similar patterns. |
| Mastery | **Weak** | Patterns are random. The player cannot learn specific patterns. The "skill" is just reaction time. |
| Feedback | **Weak** | Sound on eat/collision. No near-miss feedback. No milestone feedback. No visual juice. |

### What would make it more fun (within M13 scope)?

- **Variety in obstacles:** Add a "triple blocker" pattern (single row, all 3 lanes blocked) is impossible because the player needs at least one free lane. But add a "wide blocker" (one lane blocked for 3 consecutive rows) and a "narrow gap" (one lane free for 1 row, then a different lane free next row). The player must commit to a lane multiple ticks ahead. This adds *planning* as a skill component.
- **Near-miss feedback:** When the snake passes within 1 cell of an obstacle (diagonally or adjacent), play a "whoosh" sound or flash a visual cue. The player feels they "almost died," which is a powerful engagement signal.
- **Score milestone feedback:** Every 100 distance, flash the HUD. Every 10 food, flash the snake. Audio cue on milestone.
- **"Rhythm" patterns:** Obstacles that require a specific sequence of lane changes (left-left-right-left). The player learns the rhythm and feels mastery.

**For M13:** The current MVP is acceptable for validation. The team should commit to M14/M15 content expansion to address variety and feedback.

### Honest assessment

The proposed prototype answers "is a *bare* endless runner engaging?" not "is a *fun* endless runner engaging?" If the validation is positive, the team has learned the right thing. If the validation is negative, the team cannot distinguish between "the concept is wrong" and "the prototype is too minimal."

**Recommendation:**
- Phase 7 should add a "playtest protocol" that records *why* the prototype is fun or not fun. Specifically: ask playtesters "what was the most engaging moment?" and "what was the most boring moment?" A "boring" answer that cites "no variety" or "no risk" is a different signal than "I didn't feel like I was running."
- The validation question should be expanded: "Is the *core loop* (advance + collect + avoid) engaging *enough* to justify further investment?" not "is the final product engaging?"

---

## Does Snake Growth Improve the Runner?

### In the proposed design

Growth has the following effects:
- **+10 points per food.** Marginal score increase.
- **Visual length.** The player sees their progress.
- **No control impact.** Lane changes are unchanged.
- **No risk impact.** Body is invisible to obstacles.

**Verdict:** Growth is a *cosmetic* feature, not a *gameplay* feature, in M13.

### The product vision requires more

ROADMAP.md:
> "Longer snakes increase score potential but also increase difficulty."
> "The unique differentiator is snake growth and length-based risk management."

The "difficulty" and "risk" are absent from M13. The M13 plan is a stepping stone.

### What would make growth improve the runner?

Beyond the lane-blocking option (Option 1 above), two more impactful changes:

**Multiplier by length:**
- Score per food scales with length: length 3 = x1, length 10 = x2, length 20 = x3.
- This is the M14 "Score Multipliers" feature.
- Effect: the player *wants* to grow. There's a clear reward.

**Food placement that forces risk:**
- Food spawns in dangerous positions (in a lane that's about to be blocked, or in a lane adjacent to an obstacle).
- The player has to take risks to collect food.
- Effect: each food is a *decision*, not a free pickup. Tension emerges.

**M13 can deliver the multiplier at trivial cost:**
- Add a `lengthMultiplier = floor(snake.length / 5) + 1` to the score formula.
- Food = `POINTS_PER_FOOD * lengthMultiplier`.
- One-line change.

This makes growth a *reward* even without risk. Combined with M14's risk features, growth becomes a strategic axis.

**Recommendation:**
- Add a length-based score multiplier to M13 (one line, trivial cost).
- Defer risk to M14.
- Document in Phase 7: "M13 validates 'is the base loop engaging?' M14 validates 'does growth + risk create strategic depth?'"

---

## Gameplay Validation Risk

### Does the proposed prototype answer the product hypothesis?

**The product hypothesis (ROADMAP.md):**
> "Is this more fun and replayable than the current level-based Snake gameplay?"

**What M13 actually validates:**

| Question | M13 Answer? |
|---|---|
| Is the base runner loop (advance + collect + avoid) engaging? | **Yes, partially.** Mechanics are present. Feel is weak. |
| Is endless runner gameplay more engaging than level-based? | **Yes, partially.** Depends on player preference. The level-based game has clearer structure; the runner has clearer escalation. |
| Does snake growth add tension to a runner? | **No, not in M13.** Growth is cosmetic. M14 will answer this. |
| Is the prototype *fun*? | **Maybe.** Depends on playtester expectations. |

### The risk of a false negative

A common failure mode for prototypes: the implementation is *too minimal*, the validation answer is "no," and the team abandons a good concept.

The M13 prototype has multiple "too minimal" risks:
- **Y-wrap feel:** Not endless runner.
- **Trivial lane decisions:** No skill depth.
- **No growth risk:** No differentiator from generic runners.
- **Limited variety:** 2 pattern types.

A playtester who experiences all four may say "this is boring" — but the *reason* is not "the concept is bad." The reasons are: "the Y-wrap is disorienting," "lane choices are trivial," "growth doesn't matter," and "patterns repeat."

### Recommendation for the validation methodology

Phase 7 should add a **structured playtest protocol** that distinguishes prototype issues from concept issues. Specifically:

1. **Minimum playtester count: 5.** Below 5, individual preferences dominate.
2. **Standardized opening:** Each playtester plays the same 60-second intro, then runs freely.
3. **Post-play interview (3 questions):**
   - "Did this feel like an endless runner?" (Yes / No / Unsure → "Why?")
   - "What was the most engaging moment?" (open answer)
   - "What was the most boring moment?" (open answer)
4. **Result categorization:**
   - "Concept issue" = playtester says "the *idea* of a snake runner doesn't appeal to me."
   - "Prototype issue" = playtester says "the *implementation* didn't deliver the idea."
   - "Both" = playtester mentions both.
5. **Validation verdict:**
   - "Yes, validate" = majority say "Concept issue: no."
   - "No, reject" = majority say "Concept issue: yes."
   - "Indeterminate" = majority say "Prototype issue" or "Both." This means the M13 prototype is insufficient; M14 should iterate before concluding.

This methodology protects against false negatives while still allowing a true negative to be detected.

---

# Final Recommendation

**Approve with Minor Changes**

The plan is well-scoped, well-aligned with ROADMAP.md and AGENTS.md, and chooses the simplest correct approach for most features (no router, no new dependencies, separate RunnerGame component, inline keyboard handling, Y-axis wrap-around for course). The Out-of-Scope list is exemplary, the Risks are honest, and the testing plan is concrete.

**Gameplay verdict:** The plan delivers a *mechanically correct* prototype, but a *weak* one in terms of genre feel. The Y-wrap fails the "endless runner" feel test (the player climbs and falls rather than runs). The lane system has no growth-based risk (length is cosmetic). The runner is functional but not yet fun. These limitations are *acceptable for a validation prototype* — the team can iterate on feel in M14+ — but they must be **explicitly documented in the plan's Phase 7** so the validation result is interpreted correctly. A "no" on the M13 prototype is not necessarily a "no" on the concept.

### Required Changes (must apply)

**Engineering:**
1. **Update test baseline from 392 to 414** (Finding 1). Verify with `npm test -- --run` before merging.
2. **Add an explicit "Fix PROJECT_STATE.md M13 reference" item to Phase 7** (Finding 2). The current PROJECT_STATE.md is inconsistent with ROADMAP.md and the plan.
3. **Define or remove `toggleSound` in the RunnerGame snippet** (Finding 3). Either add the implementation or remove the toolbar sound button from M13.
4. **Commit to a single "Runner Mode" button placement in MainMenu** (Finding 4). Recommended: after the divider, before New Game, always visible.
5. **Call `markGameOver(state)` in the runner's `MOVE_SNAKE` branch** (Finding 5). Replaces the inline gameover block with a single helper call.

**Gameplay:**
6. **Add a "Prototype Limitations" section to the plan.** Explicitly document that M13 validates the *base loop* (advance + collect + avoid), not the *full concept* (snake growth + risk + endless runner feel). Without this, a negative validation result will be misinterpreted.
7. **Add a "Scrolling-World Feasibility Note" to Phase 7.** If playtesting surfaces "this doesn't feel like an endless runner" feedback, the team should have a pre-written design constraint document for a M14+ scrolling implementation. Do not commit to a specific approach in M13, but commit to *not* interpreting a Y-wrap "no" as a concept "no."
8. **Add a "Structured Playtest Protocol" to Phase 7.** Minimum 5 playtesters, standardized opening, 3-question post-play interview, and categorization of feedback as "Concept issue" vs. "Prototype issue." Verdict = validate / reject / indeterminate.

### Recommended Changes (should apply)

**Engineering:**
9. **Specify `spawnFood`'s default behavior when `forceType` is undefined** (Finding 6). One-line comment.
10. **Note the PWA service worker auto-caching of new files** (Finding 13). One-line Phase 7 note.
11. **Add a determinism check to `runnerCourse.test.ts`** (Finding 10). Run generation 100 times, verify invariants.
12. **Note the pre-existing test flakiness is unaffected** (Finding 12). One-line Phase 7 note.
13. **Reference `ScoreBoard.tsx` and `ScoreBoard.module.css` for RunnerHUD visual style** (Finding 14). One-line Phase 4 update.

**Gameplay:**
14. **Add tail lane blocking to M13** (Option 1 from the Gameplay Design Review). A 5-line change to the `CHANGE_LANE` reducer that prevents the player from moving into a lane occupied by their own body. This is the minimal change that introduces growth-based risk, which is the *unique differentiator* in the product vision. If the team prefers to defer to M14, this becomes Optional #15.
15. **Add a length-based score multiplier to M13** (one-line score formula change). `points = POINTS_PER_FOOD * (floor(length / 5) + 1)`. This makes growth a *reward* even without risk, supporting the "longer snakes increase score potential" claim in the product vision. Combine with #14 for the strongest M13 growth signal.

### Optional Changes (nice to have)

**Engineering:**
16. **Move the start overlay outside `boardRef`** (Finding 16). Eliminates the theoretical touch-handler-overlap concern.
17. **Add an Escape-to-menu binding in `RunnerGame`** (Finding 17). Small UX addition.
18. **Document the `useGame` Engine create-on-mount contract** (Finding 18). One-line Phase 5 note.

**Gameplay:**
19. **Add a near-miss feedback hook in Phase 4.** When the snake passes within 1 cell of an obstacle, trigger a "whoosh" sound or visual flash. This is the lowest-effort "juice" addition that creates the "I almost died" engagement signal. ~10 lines of code in `RunnerGame.tsx`.
20. **Add a 3rd obstacle pattern type (wide blocker or narrow gap)** in Phase 3. The current 2 pattern types produce a "single + double blocker" rhythm that becomes predictable. A "wide blocker" (one lane blocked for 3 rows) forces the player to plan multiple ticks ahead. ~20 lines in `generateRunnerCourse`.
21. **Add milestone feedback to RunnerHUD** in Phase 4. Every 100 distance, flash the HUD. Every 10 food, flash the snake. Audio cue on milestone. Low effort, high "feedback" signal.

---

The 8 required changes can be applied in 30–60 minutes of editing (engineering changes are 15–30 min; gameplay changes are 15–30 min for the documentation/protocol additions, plus ~30 min for the tail-lane-blocking and multiplier code changes if applied). Once applied, the plan is ready for implementation by another AI agent with minimal ambiguity. The recommended and optional changes are quick polish that further reduce ambiguity and align with the M12 review's quality bar.

**Critical caveat for the human reader:** The plan's gameplay design is *acceptable for a validation prototype* but *weak as a game*. The team should treat M13 as a "does the *mechanics* work?" milestone, not "is this *fun*?" M14 is the milestone that adds the differentiators (growth risk, content variety, juice) that make the runner a *game* rather than a *demo*. If the team skips M14 and ships M13 as a public release, the validation will be misleading.
