# Plan Review — Milestone 12: User Experience & Navigation

**Plan under review:** `plans/ACTIVE.md` (Milestone 12)
**Reviewer role:** Staff Engineer
**Date:** 2026-06-08
**Baseline:** v0.11.0 (M11 complete), 356 unit tests passing across 19 test files (verified via `npm test -- --run`)

---

# Overall Assessment

## Strengths

- **Roadmap alignment is direct and complete.** Every feature in the plan (Main Menu, Continue, Statistics, Achievements, Settings, Theme System, Credits, Improved Pause) maps to a feature in `docs/ROADMAP.md` §Milestone 12. No drift, no scope expansion into M13+ territory.
- **AGENTS.md compliance is strong.** The plan respects "small changes, simple solutions, maintainable code, playable progress." No new dependencies, no framework changes, no speculative architecture. The `useState<Screen>` navigation pattern is the simplest correct approach for 6 screens and matches the project's "avoid premature abstractions" philosophy.
- **Architecture alignment is correct.** New screen components live in `src/components/`, the new `useTheme` hook lives in `src/hooks/`, the new `Screen` type lives in `src/types/`. The plan correctly leverages the existing CSS custom property token system (introduced in M8) and the existing `Engine`, `useGame`, and persistence modules. The `restartLevel()` Engine method chains existing methods rather than adding new reducer cases — minimal surface area.
- **Theme system design is exemplary.** Using CSS custom property overrides via `[data-theme="..."]` selectors is the correct, simplest approach. The plan's "no component contains theme-specific logic" rule matches the M8 architectural decision and the ROADMAP.md success criteria ("New themes can be added with minimal engineering effort"). Reading the theme in `main.tsx` before React mounts to prevent FOUC is a thoughtful detail.
- **Theme token tables are comprehensive and concrete.** Every override is specified with an exact hex value and a "Notes" column explaining the intent (e.g., Terminal uses `0a0a0a` surface to "feel CRT"). This level of detail removes ambiguity for the implementer.
- **Risks are realistic and well-mitigated.** The autoStartLevel race condition, the Engine destroy/recreate cycle, and the theme flash on slow connections are the actual risks. The mitigations (effect-based auto-start with proper dependencies, useEffect cleanup of engine, synchronous dataset assignment before first paint) are appropriate.
- **Out-of-scope list is exemplary.** Explicit exclusions (no onboarding/tutorials, no animation pass, no background music, no accessibility audit, no UI testing infrastructure, no Capacitor/Tauri, no cloud saves) are tightly aligned with AGENTS.md's "milestone scope" rule and the M13–M17 boundaries in ROADMAP.md.
- **Phase decomposition is parallelizable.** Phases 1, 2, 3, 4 can be developed somewhat independently; Phase 5 is the integration/test/docs phase. The dependency chain is correct.
- **No new dependencies.** The plan explicitly notes this. No React Router, no state management library, no new build tool. The codebase grows with only its own code.

## Weaknesses

- **Auto-starting gameplay removes a player-orientation opportunity.** The plan's "Game auto-starts on mount" decision (Phase 2) and the "Idle overlay stays as safety net" note contradict good UX. A new player clicks "Continue" or "New Game" and is immediately dropped into a moving snake with no time to read the level name, see the objective, or orient themselves. The level metadata (name, description, objective) is rendered invisible.
- **Dual startup flows are explicitly designed in.** Phase 2 says: "If the Game component mounts without `autoStartLevel` (e.g., edge cases), the existing idle overlay renders normally. This avoids breaking existing behavior." This means both `MainMenu → autoStart → playing` and `idle overlay → start` are live simultaneously — two competing entry paths to the same game. AGENTS.md ("simplicity first") and the project's "no speculative architecture" philosophy both push toward a single path.
- **Multiple screens read localStorage directly.** The plan has `MainMenu`, `StatisticsScreen`, `AchievementsScreen`, and `SettingsScreen` all calling `loadLastUnlockedLevel()`, `loadHighScore()`, `loadStats()`, `loadAchievements()` from inside the component. This spreads persistence knowledge across the UI layer and creates N locations responsible for storage keys, error handling, and re-render coordination.
- **A Credits screen is low-value relative to a Help/How To Play screen.** The plan dedicates Phase 2 time to a CreditsScreen that displays project name, author, and tech stack — static content with near-zero player utility. The game now contains Gold Food, Poison Food, Slow Food, Portals, Wrap-around, Endless Mode, and Achievements, none of which are self-explanatory. A Help/How To Play screen would deliver more player value at similar implementation cost.
- **`Engine.destroy()` is called on Game component unmount, but a new Engine is created on every re-mount via the `useRef` initializer in `useGame`.** With the menu → game → pause → return-to-menu flow, the destroy/create cycle happens once per session-warp. If a player navigates Main Menu → Game → Pause → Return to Menu → Game rapidly, two Engines may briefly exist (one in cleanup, one freshly created). The plan's risk #2 acknowledges this but does not propose a test. (Verified: `useGame.ts:11-13` always creates a new Engine on first render. A `useEffect` with cleanup is fine, but a stress test is missing.)
- **The "Game auto-starts on mount" decision is documented as a Key Decision in Phase 2 but the plan does not discuss why auto-start is preferable to a Ready overlay.** A simple alternative — render a Ready overlay with the level name, description, and a Start button — would preserve all the level metadata benefits without losing the "single click to play" ergonomics. The plan does not consider this option.
- **The plan removes the Statistics and Achievements panels from the idle overlay (Phase 2 decision), but these panels were the player's way to see their progress at a glance.** With auto-start, the player never sees the idle overlay in the normal flow. The dedicated screens compensate, but it adds a navigation step to view stats.
- **Phase 3 settings reset actions are missing a "data migration on schema change" note.** If the game ever changes the localStorage key names, the reset buttons do not migrate old data. This is low-priority for M12 but worth a one-line note in the plan.
- **Phase 3's confirmation dialog is described as "inline" but the plan does not specify whether it is a true modal (focus-trapped) or a simple text prompt.** Both patterns are acceptable, but accessibility and touch UX differ. A keyboard player should be able to dismiss the dialog with Escape. A touch player should not be able to tap through it. The plan should specify.
- **The plan does not address the existing `Engine.getStats()` method's behavior with the new centralized-persistence flow.** If a separate `loadGameProfile()` is created (per the alternative approach), `Engine.getStats()` may become redundant or need updating. The plan does not call this out.
- **Phase 4's "Return to Menu destroys the Engine" is correct, but the plan does not specify whether `useGame`'s `engineRef.current = new Engine()` lazy initializer will run on the next Game mount.** Looking at `useGame.ts:11-13`, yes, it will — the `useRef` is component-scoped and the previous component instance is unmounted. So a fresh Engine is created. This is fine, but the plan should state this explicitly.
- **Phase 5's manual verification checklist is a good idea but does not specify who performs it.** For a PWA targeting mobile, "mobile run: all navigation via tap, swipe controls work in game" requires a physical device or emulator. The plan implies the implementing agent can do this, but most agents cannot. This should be flagged.
- **The plan's Phase 5 says "All existing 356 tests still pass" but several new tests overlap with existing test concerns.** For example, the new `Game.test.tsx` test "Game calls onNavigateToMenu on pause→return" depends on the new `onNavigateToMenu` prop, which the plan adds to `Game`. This is fine, but the test must be written carefully to not break the existing `Game.test.tsx` (which doesn't pass this prop). The plan should note this.
- **No mention of the "stats panel during play" regression risk.** The idle overlay currently shows Statistics and Achievements. The plan removes them. If a player pauses mid-game and wants to see their stats, they cannot — they must return to menu and navigate to Statistics. This is a UX step backward. A "Stats" or "Achievements" link in the pause menu would resolve this, but ROADMAP.md explicitly says "only Resume, Restart Level, Return to Menu" for pause. The plan correctly excludes this, but the tradeoff is worth noting.
- **The plan's CSS Modules approach for themes is correct, but the audit step "no hardcoded colors remain in any component CSS (audit via grep for hex values)" is not specified in detail.** `grep -E '#[0-9a-fA-F]{3,6}' src/components/**/*.module.css` is the obvious check, but the plan should specify this command so the implementer doesn't have to invent it.
- **The plan does not address the PWA manifest's `theme_color` and `background_color` for the new themes.** Currently these are set to `#16213e` and `#1a1a2e` (Neon Arcade defaults). Switching to Classic or Terminal themes should arguably update these to match. The plan should specify whether the manifest stays static or follows the active theme.
- **No Phase 5 test for "StatisticsScreen reflects updated stats after a game over."** The plan's `StatisticsScreen.test.tsx` does not include this. It's the most important user-facing test for that screen. (Could be in the existing `Statistics.test.tsx` already — but the plan adds a new component, and the new tests should cover the new behavior.)
- **The plan does not specify whether the dev-level-select dropdown survives the new architecture.** It currently lives inside `Game.tsx` and is gated by `import.meta.env.DEV`. With the new navigation, this should still work, but the plan should confirm or move the dropdown to MainMenu.

## Major Risks

1. **Auto-start removes a player-orientation opportunity and creates dual startup flows.** The current plan's Phase 2 has two competing entry paths: `MainMenu → autoStart → playing` (normal) and `idle overlay → start` (fallback). The "fallback" exists to "avoid breaking existing behavior," but it preserves a UX path that no longer matches the new architecture. The plan should either (a) commit to auto-start and remove the idle overlay entirely (replacing it with a "Game Ready" screen), or (b) commit to a single path: a Ready Overlay with level metadata, shown on both menu launch and any legacy flow.

2. **Persistence logic scattered across screens.** `MainMenu` reads `lastUnlockedLevel` and `highScore`. `StatisticsScreen` reads stats. `AchievementsScreen` reads achievements. `SettingsScreen` reads + writes. If a future migration changes storage keys, all four screens must be updated. The plan's acceptable alternative ("Create a dedicated persistence service layer") is the right answer — the plan just doesn't commit to it. A single `loadGameProfile()` returning `{ progress, statistics, achievements, settings }` would be cleaner and easier to test.

3. **Engine destroy/recreate cycle has no explicit test for "rapid Menu → Game → Pause → Menu → Game" navigation.** The plan's risk #2 lists this as a real risk with `useGame`'s cleanup as mitigation, but no test exercises it. A stress test (mount/unmount the Game component 10 times in a row, assert no duplicate event listeners, no console errors) would close the gap.

4. **Theme audit ("no hardcoded colors remain") is unverified-able without an explicit command.** The plan lists this as a verification step but does not specify how to perform it. An agent that skips this step will not know it has been skipped. The plan should provide the exact `grep` or `rg` command.

5. **The manual verification checklist in Phase 5 requires a physical mobile device or emulator, which most AI agents cannot perform.** The plan should explicitly state which checklist items are machine-verifiable (keyboard-only run, build/lint/test passes) and which require a human (mobile tap/swipe run). The current plan conflates them.

6. **The plan does not specify what happens to PWA manifest `theme_color` / `background_color` for non-default themes.** The manifest is static and currently matches Neon Arcade. If a player switches to Terminal or Classic and installs the PWA, the install splash will use the wrong colors. This is a subtle but real polish gap.

## Recommended Changes

1. **Replace `Credits` screen with a `Help / How To Play` screen.** The plan's `CreditsScreen` is low-value; a help screen explaining Gold Food, Poison Food, Slow Food, Portals, Wrap-around, Endless Mode, and Achievements would deliver more player value at the same implementation cost. This is the highest-leverage change in the review.

2. **Replace the auto-start decision with a `Ready Overlay` shown between menu navigation and gameplay.** Render a simple overlay in `Game.tsx` (or as a new `ReadyOverlay.tsx` component) that displays: level number, level name, level description, objective, and a "Start" button. Players then have one button to confirm they're ready. This addresses dual startup flows (the idle overlay can be replaced by the Ready overlay entirely) and surfaces the existing level metadata.

3. **Commit to a single startup flow.** With the Ready overlay, the navigation is: `MainMenu → Game (with autoStartLevel) → Ready Overlay → playing`. The old idle overlay is removed (the Ready overlay replaces it). No safety net, no fallback — one path, simple to test, simple to maintain.

4. **Introduce a thin `loadGameProfile()` service in `src/game/profile.ts` (or similar).** Single function returning `{ progress, statistics, achievements, settings }`. Screens consume this rather than reading `localStorage` directly. `useGame` already loads stats/achievements; the MainMenu and Statistics/Achievements screens can call this service in a `useEffect` or via props. This is the plan's own "Acceptable Alternative" — adopt it.

5. **Pass the profile from `App.tsx` to screens via props where possible.** `App.tsx` can `useEffect(() => loadGameProfile(), [])` once and pass `{ progress, statistics, achievements, settings }` down. This makes screens truly presentational and centralizes the persistence contract.

6. **Add an explicit "Engine destroy + recreate stress test" to Phase 5.** Mount/unmount `Game` 10 times rapidly. Assert no duplicate event listeners (a single `addEventListener` count) and no console errors. This closes the risk #2 gap.

7. **Specify the exact audit command for "no hardcoded colors remain."** Suggested: `grep -rE '#[0-9a-fA-F]{3,8}\b' src/components --include='*.module.css' --exclude='index.module.css'` (or similar). Phase 5 verification #5 should reference this command.

8. **Add a note in Phase 5 about the manual checklist's scope.** Mark which items require human verification (mobile tap/swipe, PWA install flow on a device) and which are machine-verifiable (keyboard-only run, build/lint/test, theme contrast checks). Do not silently require a human to do the full checklist.

9. **Specify the PWA manifest `theme_color` / `background_color` behavior.** Recommendation: keep the manifest static (matching Neon Arcade) for the PWA install splash. The runtime theme is independent. This is the simplest answer; document it as a deliberate decision.

10. **Add a `StatisticsScreen` test that updates stats via a fake Engine and asserts the screen re-renders.** This is the most important user-facing test for the screen and is missing from Phase 5.

11. **Consider including a small "Reset Confirmation" modal spec.** Specify that the confirmation is a focus-trapped modal (keyboard: Enter confirms, Escape cancels; touch: tap outside the dialog does NOT confirm). This is small but matters for accessibility.

12. **Remove the "Statistics/Achievements on idle overlay are removed" decision from Phase 2 if the Ready overlay replaces the idle overlay.** With one startup flow, the "removed" decision becomes "no idle overlay exists, so nothing to remove." Simpler.

13. **Confirm or relocate the dev-level-select dropdown.** Currently in `Game.tsx`, gated by `import.meta.env.DEV`. With auto-start removed (per the Ready overlay change), the dropdown still works but only on the Game screen. The plan should confirm this, or move the dropdown to the MainMenu (where it's more discoverable for developers).

14. **Add a `0.11.0 → 0.12.0` version bump to DoD.** The plan mentions this in Phase 5 but it's easy to overlook. Make it a separate DoD item.

15. **Clarify the Phase 4 Engine destroy / Engine create contract for the "return to menu" flow.** Document: "`useGame.ts` uses a `useRef` with a lazy initializer, so each new Game component mount creates a fresh Engine. The previous component's cleanup effect calls `engine.destroy()`, which removes all listeners. No state leaks across Menu → Game → Pause → Menu → Game cycles." This is reassurance for the reader and a behavioral contract for future maintainers.

---

# Detailed Findings

## Finding 1 — Credits screen has low player value relative to a Help screen

- **Severity:** High
- **Description:** The plan dedicates a `CreditsScreen.tsx` component (Phase 2) that displays project name, author, and tech stack. This is static, low-engagement content. The game now contains Gold Food, Poison Food, Slow Food, Portals, Wrap-around, Endless Mode, and Achievements — none of which are self-explanatory. A new player is far more likely to need help understanding gameplay than to need a credits page.
- **Recommendation:** Replace `Credits` with `Help / How To Play`. Display: controls (arrows, WASD, pause, touch, swipe), food types (normal/gold/poison/slow with effects), special mechanics (portals, wrap-around), progression (level objectives, endless mode, achievements). A static help screen with this content is more valuable than a credits page. Implementation cost is identical.

## Finding 2 — Auto-starting gameplay removes player orientation

- **Severity:** High
- **Description:** Phase 2's "Game auto-starts on mount" decision means clicking "Continue" or "New Game" drops the player directly into a moving snake. The level name, description, and objective (all defined in `src/game/levels.ts` and rendered in the Level Transition overlay after each level) are never shown before level 1. The player has no time to orient themselves.
- **Recommendation:** Replace auto-start with a `Ready Overlay` shown when the Game component mounts. The overlay displays level number, name, description, objective, and a Start button. The player presses Start (or Space) to begin. This preserves the "single click from menu" ergonomics (Continue → Game with Ready overlay → press Start) and surfaces the level metadata that already exists.

## Finding 3 — Dual startup flows (auto-start + idle overlay fallback)

- **Severity:** High
- **Description:** Phase 2 explicitly preserves the idle overlay as a "safety net" for when `Game` mounts without `autoStartLevel`. This creates two startup paths: `MainMenu → autoStart → playing` and `Game without autoStartLevel → idle overlay → start`. The plan justifies this as "avoiding breaking existing behavior," but the existing behavior is being replaced. AGENTS.md ("simplicity first") and the project's "no speculative architecture" principle both push toward a single path.
- **Recommendation:** With the Ready overlay change (Finding 2), commit to a single path: `MainMenu → Game (with autoStartLevel) → Ready Overlay → playing`. The idle overlay is removed (or replaced entirely by the Ready overlay). No safety net, no fallback — one path, easy to test, easy to maintain.

## Finding 4 — Persistence logic scattered across screens

- **Severity:** Medium
- **Description:** The plan has `MainMenu`, `StatisticsScreen`, `AchievementsScreen`, and `SettingsScreen` all reading localStorage directly via `loadLastUnlockedLevel()`, `loadHighScore()`, `loadStats()`, and `loadAchievements()`. The plan's own "Acceptable Alternative" acknowledges this and suggests a `loadGameProfile()` service, but does not commit to it.
- **Recommendation:** Adopt the plan's own alternative. Create `src/game/profile.ts` with a `loadGameProfile()` function returning `{ progress, statistics, achievements, settings }`. Screens consume this service rather than raw localStorage. `App.tsx` can load the profile once and pass it to screens as props, making screens truly presentational and centralizing the persistence contract. This is a small refactor (one new file, one function, four screens updated) with significant architectural benefit.

## Finding 5 — Engine destroy/recreate has no stress test

- **Severity:** Medium
- **Description:** Risk #2 (Engine destroy/create cycle) is real. `useGame.ts:11-13` always creates a new Engine on first render of a `Game` component. The `useEffect` cleanup at `useGame.ts:29-32` calls `engine.destroy()`. The plan acknowledges this but does not include a test.
- **Recommendation:** Add a test in Phase 5: "Rapid mount/unmount of `Game` component (e.g., 10 cycles) produces no duplicate event listeners and no console errors." Use `vi.spyOn(console, 'error')` and check listener counts on `window` for `keydown` / `touchstart` / `touchmove` / `touchend`. This is a 15-line test and closes a real risk.

## Finding 6 — Theme audit command not specified

- **Severity:** Medium
- **Description:** Phase 3 verification #5 is "No hardcoded colors remain in any component CSS (audit via grep for hex values)." The "via grep" is the only hint. The implementer must invent the exact command. An agent that runs `grep '#[0-9a-fA-F]' src/components/` (without `\b` word boundary) will miss `box-shadow: 0 0 0 #abc` in shorthand and may not include the index file. This is process ambiguity.
- **Recommendation:** Specify the exact command. Suggested: `grep -rE '#[0-9a-fA-F]{3,8}\b' src/components --include='*.module.css' --exclude='index.module.css'` or `rg -t css -e '#[0-9a-fA-F]{3,8}\b' src/components/`. Add this command to Phase 3 verification #5 so the implementer doesn't have to invent it.

## Finding 7 — Manual verification checklist conflates machine and human checks

- **Severity:** Medium
- **Description:** Phase 5's manual verification checklist includes 11 items, of which 2 require a physical device (mobile tap/swipe, PWA install on device). Most AI agents cannot perform these. The current plan implies the implementing agent can complete the full list.
- **Recommendation:** Mark each item as `[MACHINE]` or `[HUMAN]`. Items 1–9 (navigation loops, keyboard-only, theme persistence) are machine-verifiable. Items 10–11 (mobile tap/swipe, PWA install) require a human. The DoD should say "All [MACHINE] checklist items pass; [HUMAN] items deferred to manual QA" rather than "All manual verification checklist items pass."

## Finding 8 — PWA manifest theme_color / background_color behavior unspecified

- **Severity:** Low
- **Description:** The PWA manifest (`public/manifest.webmanifest`, generated by `vite-plugin-pwa`) currently has `theme_color: #16213e` and `background_color: #1a1a2e` — Neon Arcade defaults. When a player switches to Terminal or Classic and installs the PWA, the install splash will use the wrong colors. The plan does not address this.
- **Recommendation:** Document the deliberate decision: keep the manifest static (Neon Arcade) for the install splash. The runtime theme is independent. This is the simplest answer and avoids dynamic manifest generation. Add this as a Phase 3 verification item or a one-line note.

## Finding 9 — Settings reset confirmation modal accessibility not specified

- **Severity:** Low
- **Description:** Phase 3's Settings screen has Reset buttons that show an "inline confirmation prompt" before executing. The plan does not specify whether this is a true modal (focus-trapped) or a simple text prompt. Both are acceptable, but accessibility and touch UX differ.
- **Recommendation:** Specify: confirmation is a small modal dialog. Keyboard: `Enter` confirms, `Escape` cancels, focus is trapped in the dialog. Touch: tap "Confirm" to execute, tap "Cancel" or outside the dialog to dismiss. Auto-focus the Cancel button by default. Add a one-line note in Phase 3.

## Finding 10 — `StatisticsScreen` test does not cover stat updates

- **Severity:** Low
- **Description:** Phase 5's `SettingsScreen.test.tsx` is listed, but `StatisticsScreen.test.tsx` is not. The plan covers the new component but does not test its primary user-facing behavior: that updated stats are reflected in the screen.
- **Recommendation:** Add `src/components/__tests__/StatisticsScreen.test.tsx` to Phase 5 with at least one test: "renders updated stats after a mock `loadStats()` returns new values." This is the most important behavior of the screen and is currently untested.

## Finding 11 — Dev-level-select dropdown not addressed in the new architecture

- **Severity:** Low
- **Description:** The dev-level-select dropdown is currently inside `Game.tsx`, gated by `import.meta.env.DEV`. With the new navigation and the Ready overlay change, the dropdown still works (it appears on the Game screen) but is no longer the primary entry point. The plan does not confirm or relocate it.
- **Recommendation:** Add a note in Phase 2: "The dev-level-select dropdown remains in `Game.tsx`, gated by `import.meta.env.DEV`. It is not affected by the navigation changes." This is a 1-line confirmation that prevents the implementer from worrying about it.

## Finding 12 — Version bump not a separate DoD item

- **Severity:** Low
- **Description:** Phase 5 lists `package.json` version bump as a file modification, but the Milestone DoD at the end of the plan does not list it as a separate item. The previous milestone plans (M10, M11) had this as an explicit DoD item.
- **Recommendation:** Add to DoD: "`package.json` version bumped to `0.12.0`." Make it a separate checkbox, not buried in the file list.

## Finding 13 — Ready Overlay and idle overlay replacement not fully thought through

- **Severity:** Medium
- **Description:** If the Ready overlay replaces the idle overlay, what happens to the existing "Statistics and Achievements panels" on the idle overlay (Phase 2 decision: "Statistics/Achievements on idle overlay are removed. They now live in dedicated screens")? With the Ready overlay, the panels are simply not rendered. The plan's removal decision is moot but should be made explicit in the Ready overlay update.
- **Recommendation:** When updating the plan with the Ready overlay change, state: "The existing idle overlay is removed entirely. Its only remaining function (displaying Statistics and Achievements panels) is now served by the dedicated Statistics and Achievements screens accessible from the Main Menu." This closes the loop.

## Finding 14 — `useGame` Engine create-on-mount contract not documented

- **Severity:** Low
- **Description:** `useGame.ts:11-13` creates a new Engine on first render via a `useRef` lazy initializer. Each new `Game` component mount gets a fresh Engine. The previous component's `useEffect` cleanup calls `engine.destroy()`. This is the contract that makes "Menu → Game → Pause → Return to Menu → Game" work cleanly. The plan relies on this but does not document it.
- **Recommendation:** Add a note in Phase 4: "`useGame.ts` uses a `useRef` with a lazy initializer, so each new `Game` component mount creates a fresh Engine. The previous component's cleanup effect calls `engine.destroy()`, which removes all listeners. No state leaks across navigation cycles. This is the contract that makes Menu → Game → Pause → Menu → Game safe."

## Finding 15 — No Phase 4 test for "Restart Level preserves score but resets snake/food/foodEaten"

- **Severity:** Low
- **Description:** Phase 4 says "Restart Level resets snake, food, foodEaten at same level; score is preserved (since score carries across levels)" in the verification list, but the Phase 5 test additions only list a generic "Restart Level resets current level" test. The "score preserved, foodEaten reset" invariant is important and deserves its own assertion.
- **Recommendation:** Specify the test: "After `restartLevel()`, `state.score` equals the pre-restart score, `state.foodEaten` equals 0, `state.snake` length equals `INITIAL_SNAKE.length`, `state.food.position` is a valid spawn position (not on snake/obstacle), `state.level` is unchanged." This is 6 assertions in one test and pins down the contract.

---

# Follow-Up Review (Second Pass) — 2026-06-08

**Purpose:** Verify remediation of the original review's Critical and High findings. Do not re-review the full plan; focus only on whether the second-pass follow-up's five findings have been addressed.

**Status source:** `plans/ACTIVE.md` lines cited inline below.

---

## Finding 1 — Persistence architecture still contains ambiguity
**Status: Partially Resolved**

`plans/ACTIVE.md:25` (Phase 1, MainMenu file description) still states: "reads `lastUnlockedLevel`/`highScore` from localStorage for the Continue hint". `plans/ACTIVE.md:33` (Phase 1, Key Decision) reaffirms: "MainMenu reads persistence directly... (Will be replaced by `loadGameProfile()` in Phase 2 when the persistence service is introduced.)"

The follow-up's stated principle was that the temporary architecture should never appear at all. The plan keeps a two-pattern world in Phase 1: direct localStorage access in screen components, with the centralized `loadGameProfile()` deferred to Phase 2. An implementation agent reading Phase 1 in isolation could ship the temporary pattern.

**Action required:**
- Delete the "reads `lastUnlockedLevel`/`highScore` from localStorage" clause from the MainMenu file description in Phase 1.
- Reword the Phase 1 Key Decision so it never endorses direct localStorage access from screen components. Phases 1 and 2 should both route through `loadGameProfile()`. Either:
  - Introduce `loadGameProfile()` in Phase 1 (recommended — collapses the two-phase separation), or
  - State explicitly in Phase 1 that "no screen component reads localStorage directly; the centralized service is the only access pattern, even if introduced in Phase 2."

---

## Finding 2 — Ownership of profile data is not explicit
**Status: Partially Resolved**

`plans/ACTIVE.md:66` (Phase 2, App.tsx modification) states: "Load profile once via `useEffect(() => loadGameProfile(), [])` and pass relevant slices to screens as props (optional optimization — screens can also call `loadGameProfile()` directly)." The parenthetical "optional optimization" leaves the ownership model open: App loads and passes via props, OR screens self-load.

`plans/ACTIVE.md:73` (Phase 2, Key Decisions) reaffirms: "Screens are stateless presenters. They receive data as props (or call `loadGameProfile()` in a `useEffect`)". Again, both models are presented as valid.

The follow-up's preferred model was unambiguous: App loads, owns, refreshes, and passes data to screens via props. Screens remain presentation-focused and never call the persistence service.

**Action required:**
- Remove the "optional optimization" hedging from the App.tsx modification in Phase 2.
- Reword the "Screens are stateless presenters" Key Decision to commit to props-based data flow.
- Update the test entries (`StatisticsScreen.test.tsx`, `AchievementsScreen.test.tsx`, `HelpScreen.test.tsx`, `SettingsScreen.test.tsx`) to receive profile data as props, not load it themselves.

---

## Finding 3 — Help Screen and Milestone 13 boundary
**Status: Resolved**

`plans/ACTIVE.md:61` (Phase 2, HelpScreen description) scopes the screen to static reference documentation: Controls, Food Types, Special Mechanics, Progression, Achievements overview. `plans/ACTIVE.md:341` (Out of Scope) explicitly excludes: "Onboarding, tutorials, gameplay guide, mechanics guide (Milestone 13)". The boundary is clear; the Help Screen is reference material, not interactive onboarding.

**No action required.**

---

## Finding 4 — Restart Level rules should be explicitly documented
**Status: Partially Resolved**

The behavior is documented across `plans/ACTIVE.md:65` (Phase 2) and `plans/ACTIVE.md:238` (Phase 4 Engine method), and pinned by the Phase 5 test at `plans/ACTIVE.md:284`. However, the design intent — why the rules are the way they are — is not stated as an explicit game rule.

The follow-up requested a rationale statement to prevent a future contributor from treating "score preserved, food progress reset" as an implementation accident.

**Action required:**
- Add a design note to Phase 4 (most natural location, near the `restartLevel()` description and verification list):
  > Restart Level is intended to retry the current level without invalidating overall run progress. Score remains unchanged. Current-level food progress resets. The player is retrying the level, not restarting the entire run.

---

## Finding 5 — Game Over navigation requires explicit definition
**Status: Unresolved**

No phase documents the Game Over → Continue / New Game / Return to Menu destinations. The follow-up's recommended flow:

```
Continue
  → Ready Overlay
  → Last Unlocked Level

New Game
  → Ready Overlay
  → Level 1

Return To Menu
  → Main Menu
```

is not present in the plan. `plans/ACTIVE.md:296` (Phase 5 manual verification) references "Die → Game Over → Ready Overlay → Start → Play" for one path but does not enumerate all Game Over destinations or define the post-death flow completely.

**Action required:**
- Add a "Game Over Navigation" subsection (most natural in Phase 2, alongside the `ReadyOverlay` description, since the Ready Overlay is the post-Continue / post-New-Game destination).
- Define each Game Over action and its destination, per the follow-up's recommended flow (or the project's preferred variant).
- Add a corresponding manual verification item to Phase 5 covering all three Game Over destinations.

---

## Approval Decision

**Approve with Minor Changes**

Three findings require remediation before implementation begins:

1. **Finding 1 (Persistence):** Eliminate the temporary direct-localStorage pattern from Phase 1. One persistence access pattern across the entire milestone.
2. **Finding 2 (Ownership):** Commit to App-owned, props-passed profile data. Remove all "optional optimization" and "or" hedging.
3. **Finding 4 (Restart Level):** Add a one-paragraph design rationale statement to Phase 4.
4. **Finding 5 (Game Over):** Add a Game Over navigation subsection defining all three post-death destinations.

Finding 3 is resolved. Estimated remediation effort: 15–30 minutes of targeted edits.

---

# Handoff Assessment

## Phase structure

**Grade: Good.** Five phases, each with a clear goal, a "Files to change" table, a verification step, and where applicable, a test-count estimate. The dependency chain is: Phase 1 (infrastructure) → Phase 2 (screens) → Phase 3 (settings + themes) → Phase 4 (pause improvements) → Phase 5 (integration, tests, docs).

The split between Phase 2 and Phase 3 is the weakest part — Statistics/Achievements screens and Settings screen are conceptually similar (data-display screens), and the Theme system touches every screen. A more interleaved order might be: Phase 1 (infrastructure) → Phase 3 partial (theme system, since it affects all later screens) → Phase 2 (screens) → Phase 3 rest (settings) → Phase 4 (pause) → Phase 5. But the current order is defensible: build the screens, then theme them.

## Task decomposition

**Grade: Good.** Each phase is broken into discrete, testable increments. File paths are exact. Function signatures are specified. Theme token tables are comprehensive.

The `autoStartLevel` parameter (Phase 2) is a small but important design decision. The plan's call-and-response is `useEffect` that dispatches the start action after the engine is ready, which is correct. But the plan does not specify what happens if the user clicks "Continue" twice in quick succession (e.g., double-click on the menu item). The second click could fire `startAtLevel` again while the first is still propagating. This is a low-probability race but worth a guard.

## Verification strategy

**Grade: Adequate, with gaps.** Each phase has a "Verification" subsection specifying `npm test`, `npm run build`, `npm run lint`, and per-phase acceptance. The gaps:

1. **No end-to-end "play the game" verification after the milestone.** The whole point is "feel like a complete product" but no automated test exercises the new flows. A minimal end-to-end test (e.g., "render App, click Main Menu → Continue, assert Game screen is shown with Ready overlay, click Start, assert playing") would catch navigation regressions.

2. **Theme audit command is unspecified** (Finding 6).

3. **Manual checklist conflates machine and human** (Finding 7).

4. **No test for rapid mount/unmount** (Finding 5).

## Definition of Done

**Grade: Adequate.** The DoD is a 20-item checklist with all major workstreams covered. Missing:
- Explicit `package.json` version bump (Finding 12)
- Cumulative test-count table (low priority)
- Cap on Phase 3 theme fixes (low priority — themes are well-specified)
- Marked [MACHINE] vs [HUMAN] verification items (Finding 7)

## AI-agent execution readiness

**Grade: Good, with three known ambiguity points.**

1. **Help vs Credits decision** (Finding 1) — the agent cannot make this call; it requires human input. Resolve before implementation.

2. **Auto-start vs Ready overlay decision** (Findings 2, 3, 13) — the agent cannot make this call either; it requires human input. Resolve before implementation.

3. **Persistence centralization commitment** (Finding 4) — the agent could implement the `loadGameProfile()` service, but the plan does not explicitly require it. The agent might choose to skip it for "simplicity." Decide before implementation.

Other than these three, an AI agent with the plan plus AGENTS.md plus ROADMAP.md and ARCHITECTURE.md should be able to execute the milestone without further human input. The theme token tables are excellent — an agent can implement all 4 themes without ambiguity.

---

# Final Recommendation

**Approve with Major Changes**

The plan is well-scoped, well-aligned with ROADMAP.md and AGENTS.md, and chooses the simplest correct approach for most features (no router, CSS-only themes, Engine method chaining). The Out-of-Scope list is exemplary, the Risks are honest, and the theme token tables are exemplary.

However, three changes are required before approval:

### Required Changes (must apply)

1. **Replace `Credits` with `Help / How To Play`** (Finding 1). Static help content delivers more player value than a credits page at the same implementation cost. This is a high-leverage change.

2. **Replace auto-start with a `Ready Overlay` and commit to a single startup flow** (Findings 2, 3, 13). The current plan's auto-start + idle overlay fallback creates two competing paths. A Ready overlay with level metadata is the better UX and the simpler architecture.

3. **Commit to a `loadGameProfile()` persistence service** (Finding 4). The plan's own "Acceptable Alternative" is the right answer; the plan just doesn't commit to it. A single service is cleaner than four screens reading localStorage directly.

### Recommended Changes (should apply)

4. **Add a stress test for rapid mount/unmount** (Finding 5). Closes the Engine destroy/recreate risk gap.

5. **Specify the exact theme audit command** (Finding 6). Removes process ambiguity.

6. **Mark the manual checklist as [MACHINE] vs [HUMAN]** (Finding 7). Sets accurate expectations.

7. **Document the PWA manifest theme_color / background_color decision** (Finding 8). Keep the manifest static (Neon Arcade defaults) for the install splash; runtime theme is independent.

8. **Add `package.json` version bump to DoD as a separate item** (Finding 12). Match the M10/M11 convention.

9. **Add a Settings reset confirmation modal accessibility spec** (Finding 9). One line.

10. **Add `StatisticsScreen.test.tsx` to Phase 5** (Finding 10). Closes a test gap.

### Optional Changes (nice to have)

11. **Document the dev-level-select dropdown's continued placement in `Game.tsx`** (Finding 11).

12. **Document the `useGame` Engine create-on-mount contract** (Finding 14).

13. **Tighten the Phase 4 "Restart Level" test assertion** (Finding 15).

The three required changes can be applied in 30–60 minutes of editing. Once applied, the plan is ready for implementation by another AI agent with minimal ambiguity. The recommended and optional changes are quick polish that further reduce ambiguity.
