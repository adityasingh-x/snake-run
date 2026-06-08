# Implementation Review: Milestone 12 — User Experience & Navigation

**Reviewer:** Staff Engineer (Implementation Review)
**Milestone under review:** M12 — User Experience & Navigation (Phases 1–5)
**Source documents:** `plans/ACTIVE.md`, `AGENTS.md`, `docs/ROADMAP.md`, `ARCHITECTURE.md`, `SPEC.md`, `docs/PROJECT_STATE.md`, `package.json`, prior `reviews/IMPLEMENTATION_REVIEW.md` (M11)
**Implementation files reviewed (new):** `src/types/navigation.ts`, `src/game/profile.ts`, `src/hooks/useTheme.ts`, `src/components/MainMenu.{tsx,module.css}`, `src/components/Screen.module.css`, `src/components/StatisticsScreen.{tsx,module.css}`, `src/components/AchievementsScreen.{tsx,module.css}`, `src/components/HelpScreen.{tsx,module.css}`, `src/components/SettingsScreen.{tsx,module.css}`, `src/components/ReadyOverlay.{tsx,module.css}`, `src/components/PauseMenu.{tsx,module.css}`, `src/components/__tests__/{MainMenu,PauseMenu,ReadyOverlay,SettingsScreen,HelpScreen,StatisticsScreen}.test.tsx`, `src/game/__tests__/profile.test.ts`
**Implementation files reviewed (modified):** `src/App.tsx`, `src/main.tsx`, `src/components/Game.tsx`, `src/components/GameOver.{tsx,module.css}`, `src/components/Cell.module.css`, `src/game/Engine.ts`, `src/hooks/useGame.ts`, `src/types/components.ts`, `src/index.css`, `docs/ROADMAP.md`, `docs/PROJECT_STATE.md`, `SPEC.md`, `ARCHITECTURE.md`, `package.json`
**Verification commands run:** `npm test` (392/392 pass, 26 test files, 0 failures), `npm run lint` (clean, 0 errors/warnings), `npm run build` (success, 235.50 kB JS / 72.29 kB gz, 28.24 kB CSS / 4.99 kB gz, PWA precache 8 entries)
**Review date:** 2026-06-08
**Branch under review:** Working tree on `main` post-merge of M11 with M12 changes uncommitted (no feature branch in this workspace)

---

# Executive Summary

## Overall Assessment

**Reject (block on a single high-severity bug; otherwise Approve with Minor Changes).** The M12 implementation is a faithful, well-scoped execution of `plans/ACTIVE.md:1-408` and is one of the cleanest UX-screen additions this project has shipped. The new navigation system, 6 screens, centralized `loadGameProfile()` service, 4-theme CSS variable system, improved `PauseMenu`, and `ReadyOverlay` are all present, on-plan, and follow the existing CSS Modules + neon-arcade visual language. Test count grew from 356 → 392 (36 new), and every new component, the new `Engine.restartLevel()`, and the profile service have at least one targeted test. Build, lint, and full test suite all pass cleanly.

However, one real regression is present and must be fixed before merge:

- **`StatisticsScreen` will always show `High Score: 0`.** `src/game/profile.ts:18-48` sources the `statistics` slice from `loadStats()` (which sets `highScore: 0` at `statistics.ts:36`), and `saveStats()` (`statistics.ts:40-44`) does not persist `highScore`. The pre-M12 `Statistics.tsx` panel embedded in the `GameOver` overlay sourced its `highScore` from the in-memory `Engine.getStats()` (which sets `highScore: this.state.highScore` at `Engine.ts:166`), so the value was always live. After M12, the `StatisticsScreen` reads from `loadStats()` only, so even players with a real high score in `snakeHighScore` will see `0` on the dedicated stats screen. This is a direct regression of a user-visible feature and is the primary reason the review is `Reject` rather than `Approve with Minor Changes`.

Beyond that single blocker, the implementation is in good shape. The remaining findings below are advisory: a thin `App.tsx` profile owner pattern, a leftover `onContinueFromLevel` prop on `GameOver` (still wired correctly but not in the M12 plan's nav flow description), a few stale or slightly off-by-one documentation touchpoints, a minor accessibility gap on the back button (no `autoFocus`), and one unused plan-introduced surface (`loadGameProfile` exposes `settings.soundEnabled/theme` but no screen consumes them — the live sound/theme state is held in `Game.tsx` and `SettingsScreen.tsx`). None of these are scope creep; all are minor polish opportunities.

The architectural posture of the project is preserved. No new dependencies, no new platform strategy, no replacement of existing frameworks. The `useState<Screen>` pattern in `App.tsx` is the documented "No React Router" decision. The 4-theme system is implemented exclusively via `[data-theme]` CSS attribute overrides on existing tokens — exactly per the plan's "themes modify design tokens only" decision. The ReadyOverlay replaces the old idle overlay in exactly one place, the PauseMenu is one component, and `Engine.restartLevel()` adds 16 lines (no new action type, no state machine change). All hard verification gates pass on a clean re-run.

## Major Strengths

1. **Plan fidelity is high across all five phases.** Every file described in `plans/ACTIVE.md:18-302` exists in the working tree. Phase 1 (`navigation.ts`, `App.tsx`, `MainMenu` shell, `Screen.module.css`), Phase 2 (full `MainMenu`, 4 screen components, `ReadyOverlay`, `profile.ts`), Phase 3 (`SettingsScreen` with sound/theme/reset, `useTheme`, 3 new `[data-theme]` blocks in `index.css`, `main.tsx` flash prevention), Phase 4 (`PauseMenu` with 3 actions, `Engine.restartLevel`, hook exposure), and Phase 5 (6 new test files, `profile.test.ts`, Engine + Game test additions, all four doc updates, version bump) are all present and complete.

2. **`loadGameProfile()` is the right size and the right shape for the centralized service.** `src/game/profile.ts:18-48` wraps all six individual loaders (`loadLastUnlockedLevel`, `loadHighScore`, `loadStats`, `loadAchievements`, plus the two localStorage reads for theme and sound) behind a single contract. Corrupt-value guards exist on each branch via `Number.isNaN` (storage) and try/catch (achievements, theme, sound). `App.tsx:14` calls it once on mount via `useState(() => loadGameProfile())` and passes slices to screens as props — exactly matching the plan's "screens never call `loadGameProfile()` directly" decision at `plans/ACTIVE.md:73`. The `saveGameProfile` companion at `profile.ts:50-58` is correctly minimal (only persists fields a screen might write).

3. **The 4-theme system is pure CSS — no component contains theme-specific logic.** `src/index.css:122-216` adds three `[data-theme="..."]` blocks that override the existing `--color-*` and `--shadow-*` tokens. `main.tsx:7-18` reads `snakeTheme` synchronously before `createRoot` to prevent flash. `useTheme` (`src/hooks/useTheme.ts:14-43`) is a thin `useState` wrapper with `localStorage` persistence and `document.documentElement.dataset.theme` sync. The plan's "themes modify design tokens only" decision is honored — `grep` confirms zero new theme-specific JavaScript logic anywhere in `src/components`.

4. **`Engine.restartLevel()` is small, additive, and follows the existing patterns.** `src/game/Engine.ts:143-157` adds 16 lines that capture `score`/`direction`/`nextDirection` before dispatching `START_AT_LEVEL` and restoring them after. No new `GameAction` type, no reducer case, no state machine change. The new method passes its 5 verification criteria from `plans/ACTIVE.md:269-271` and is covered by 5 new tests in `Engine.test.ts:467-525` (length reset, score preserved, direction preserved, loop starts, food spawns valid).

5. **Screen components are clean stateless presenters.** `MainMenu`, `StatisticsScreen`, `AchievementsScreen`, `HelpScreen`, `SettingsScreen`, `PauseMenu`, `ReadyOverlay` all receive data as props and call navigation callbacks upward. None reads `localStorage` directly. None contains `useEffect` except where required (theme + `SettingsScreen` keyboard focus). This is exactly the architecture the plan called for and matches the project-AGENTS philosophy of small, simple, maintainable components.

6. **Test coverage is broad for new surfaces.** 35 new tests across 7 files: `MainMenu.test.tsx` (6), `PauseMenu.test.tsx` (5), `ReadyOverlay.test.tsx` (3), `SettingsScreen.test.tsx` (5), `HelpScreen.test.tsx` (2), `StatisticsScreen.test.tsx` (2), `profile.test.ts` (4), plus 5 new `Engine.restartLevel` tests and 3 new `Game.test.tsx` cases (ReadyOverlay, Start click, PauseMenu return-to-menu). The rapid mount/unmount stress test at `Game.test.tsx:220-241` directly addresses Risk #2 from the plan.

## Major Concerns

1. **`StatisticsScreen` High Score regression (BLOCKER).** See Finding F-1 below. The dedicated Statistics screen will always display `High Score: 0` because the central `loadGameProfile()` pulls `statistics` from `loadStats()`, which hardcodes `highScore: 0`, and `saveStats()` does not persist `highScore`. The pre-M12 panel embedded in `GameOver.tsx:60` used the live `Engine.getStats()` which merged `state.highScore` from the running engine. The new dedicated screen sources from the broken `loadStats` path, so it is strictly worse than the pre-M12 implementation for this one stat.

---

# Findings

## F-1 — `StatisticsScreen` always shows `High Score: 0` (regression)

- **Severity:** High
- **Category:** Bug
- **Description:** The dedicated `StatisticsScreen` (`src/components/StatisticsScreen.tsx:17-22`) renders `<Statistics ... highScore={stats.highScore} />` where `stats` comes from `profile.statistics`, which `loadGameProfile()` populates by calling `loadStats()` (`src/game/profile.ts:41`). `loadStats()` at `src/game/statistics.ts:31-38` returns `highScore: 0` as a hardcoded placeholder because `saveStats()` at `statistics.ts:40-44` only persists `gamesPlayed`, `totalFood`, and `bestLevel` — `highScore` is never written to localStorage. The pre-M12 `Statistics` panel embedded inside `GameOver.tsx:60` received its `highScore` from the in-memory `Engine.getStats()` (`Engine.ts:165-167` which does `return { ...this.statsCache, highScore: this.state.highScore }`), so the value was always live in that surface. After M12, the new dedicated screen exclusively sources from `loadStats`, so even a player who has legitimately beaten their high score in `snakeHighScore` will see `0` on the Statistics screen. The MainMenu continue hint (`MainMenu.tsx:24`) correctly shows the live high score because it receives `profile.progress.highScore` (sourced from `loadHighScore()` at `profile.ts:39`), making the discrepancy between the menu's "High Score: 200" and the Stats screen's "High Score: 0" particularly visible to the player.
- **Recommendation:** Two valid fixes. (a) In `loadGameProfile()`, merge the live high score into the statistics slice: `statistics: { ...loadStats(), highScore: loadHighScore() }`. This keeps the single source of truth in `snakeHighScore` (existing) and means the Stats screen and MainMenu hint show the same number. (b) Source `highScore` in `StatisticsScreen` from a separate prop (`highScore={progress.highScore}`). Option (a) is the smaller change and matches the pre-M12 `Engine.getStats()` pattern. Also add a test case to `StatisticsScreen.test.tsx` and `profile.test.ts` that asserts `highScore` from the profile propagates through to the rendered "High Score" row when a non-zero value is stored. The test at `StatisticsScreen.test.tsx:13` passes `highScore: 300` as a literal prop, so it does not exercise the broken `loadStats` path.

## F-2 — `App.tsx` does not use `profile.settings` even though `loadGameProfile()` exposes it

- **Severity:** Low
- **Category:** Maintainability
- **Description:** `src/game/profile.ts:12-16` declares `settings: { soundEnabled, theme }` on `GameProfile`, and `loadGameProfile()` populates it. However, `App.tsx:14-54` never reads `profile.settings` — the live `theme` and `soundEnabled` values come from `SettingsScreen` (which calls `useTheme()` and `sharedSoundManager.isEnabled()` independently) and `Game.tsx:48` (which calls `sharedSoundManager.isEnabled()` independently). This is not a bug (the live values are correct), but it means the "centralized profile" service exposes data that no consumer reads. The plan's DoD at `plans/ACTIVE.md:382` requires "all 4 themes render correctly" and Phase 3 verification 8 ("Sound toggle works and persists") — both pass — but the architectural claim of `loadGameProfile` being the single owner of settings state is slightly weakened.
- **Recommendation:** Either (a) accept the small redundancy and leave `profile.settings` as an extension surface for future use, or (b) drop the `settings` field from `GameProfile` until a consumer needs it, since `AGENTS.md:115-117` calls out avoiding "speculative architecture". Option (b) is more consistent with the project's development philosophy and saves 8 lines in `profile.ts`. The `saveGameProfile` function (lines 50-58) also persists `settings`, which is also currently dead code. If keeping the field, add a one-line JSDoc explaining when a consumer should read it.

## F-3 — `GameOver` props include `onContinueFromLevel` for an M12 nav flow that no longer uses it directly

- **Severity:** Low
- **Category:** Scope
- **Description:** `src/types/components.ts:36-48` defines `GameOverProps` with `onContinueFromLevel: (level: number) => void` and `onReturnToMenu?: () => void`. In M12, both are still required and `Game.tsx:268-281` wires them: `onContinueFromLevel` calls `handleSetReadyLevel(level)` (which sets the ReadyOverlay for the chosen level) and `onReturnToMenu` calls `handleReturnToMenu`. This is correct and matches the plan's Game Over Navigation table at `plans/ACTIVE.md:79-88`. The finding is not a bug — the wiring is right and the tests pass. It is a low-severity observation that the plan's intent of "Continue from ReadyOverlay" is implemented correctly but the documentation table in `SPEC.md:19.3` describes a slightly different flow than the `GameOver` component's button labels, which still say "Continue from Level N" rather than something like "Continue". The button text is unchanged from M6; this is consistent with prior versions.
- **Recommendation:** No change required. The button text "Continue from Level N" remains clear post-M12 because the player now sees a ReadyOverlay immediately after clicking it. If desired, `SPEC.md:10.5` could mention the ReadyOverlay handoff in one additional line for clarity, but this is purely a doc polish item.

## F-4 — `SettingsScreen` lacks `autoFocus` on the Back button

- **Severity:** Low
- **Category:** Accessibility
- **Description:** The plan's `PauseMenu` (`plans/ACTIVE.md:252`) and `ReadyOverlay` (`plans/ACTIVE.md:63`) both call out `autoFocus` on the primary action button. The plan's `SettingsScreen` section (`plans/ACTIVE.md:117`) does not require `autoFocus`, but the plan's Phase 5 verification item at `plans/ACTIVE.md:317` ("Keyboard-only run: all navigation via Tab + Enter") implies keyboard support throughout. None of the screen components (`MainMenu`, `StatisticsScreen`, `AchievementsScreen`, `HelpScreen`, `SettingsScreen`) set `autoFocus` on any control. The current behavior is that Tab focus lands on the first interactive element, which is sensible for `MainMenu` (focus on Continue/New Game is reasonable) but slightly less ideal for `SettingsScreen` where the user just navigated to it from the menu and may want to tab through the controls. The plan does not require this; the project-wide Accessibility section in `SPEC.md:11` does not require it either. This is a minor polish item.
- **Recommendation:** No change required for the M12 review. If a future accessibility pass (M15) audits focus management, add `autoFocus` on the most-likely-first-interaction control per screen. This is appropriately scoped to a future milestone per the Out-of-Scope list at `plans/ACTIVE.md:361` ("Accessibility audit, color-blind review, reduced motion support (Milestone 15)").

## F-5 — Documentation: `SPEC.md:19.4` Pause Menu section is slightly out of sync with implementation

- **Severity:** Low
- **Category:** Documentation
- **Description:** `SPEC.md:668-673` (Section 19.4) describes the pause menu as having "Resume", "Restart Level" (preserves score), and "Return to Menu" (destroys Engine). The implementation at `src/components/PauseMenu.tsx:10-41` matches this exactly. However, `SPEC.md:411` (Section 10.8) calls `PauseMenu` the replacement for "the inline pause overlay" — accurate. `SPEC.md:251` (Section 7.2) row for `paused` mentions "PauseMenu with Resume, Restart Level, and Return to Menu" — accurate. The minor inconsistency is that `SPEC.md:251` says `idle` status "Shows ... ReadyOverlay" — which is true — but the pre-M12 row mentioned "IdleOverlay" with statistics/achievements panels, which is now removed. The current text is correct. The finding here is that the SPEC's Section 7.2 table at `SPEC.md:253-254` does not mention the "Return to Menu" option for gameover/won overlays, even though the implementation added it in this milestone (`GameOver.tsx:50-58`). The M11 SPEC still has the old "Game Over!" row that mentioned only "Continue from Level N" and "New Game" buttons. Updating the table to add "Return to Menu" to the gameover/won row would close this doc gap.
- **Recommendation:** In `SPEC.md:253-254`, add "Return to Menu" to the gameover and won overlay descriptions (Section 7.2 table). This is a 2-line documentation polish.

## F-6 — `docs/ROADMAP.md:373` still lists "Credits" as a Main Menu option, but it is not implemented

- **Severity:** Low
- **Category:** Scope
- **Description:** The M12 "Main Menu" feature in `docs/ROADMAP.md:362-374` lists the option "Credits" alongside Continue, New Game, Statistics, Achievements, and Settings. The plan's Phase 2 section at `plans/ACTIVE.md:54-55` lists exactly six Main Menu options (Continue, New Game, Statistics, Achievements, Settings, Help) — no Credits. The plan's Out-of-Scope list at `plans/ACTIVE.md:367-369` does not exclude Credits explicitly, but the planned Files table does not include a `CreditsScreen`. The "Feature: Credits Screen" subsection at `ROADMAP.md:502-509` says only "Display: Project name, Author, Technology stack" and is still part of M12. The implementation correctly omits Credits — `MainMenu.tsx:38-72` has 6 buttons, none labeled Credits. This is a small doc inconsistency: the roadmap says one thing, the plan + implementation say another. Since the plan is the authoritative source for M12 scope and the implementation matches the plan, the roadmap is what needs to be updated.
- **Recommendation:** Either (a) drop the "Credits" line from `docs/ROADMAP.md:373` and the "Feature: Credits Screen" subsection at `ROADMAP.md:502-509` to align with the plan, or (b) add a new "Future" or "Ideas Backlog" entry for Credits. Option (a) is more consistent with the documented M12 plan. The "Current Progress" section at `ROADMAP.md:167-180` correctly lists Help (not Credits) as a completed feature, so the discrepancy is localized to two specific sections.

## F-7 — `ROADMAP.md` "Help / How To Play Screen" subsection is now misnamed

- **Severity:** Low
- **Category:** Documentation
- **Description:** `docs/ROADMAP.md:378-386` and the M12 feature list at `ROADMAP.md:173` reference a "Help / How To Play Screen". The implementation at `src/components/HelpScreen.tsx:12` renders the heading "How To Play" (the word "Help" appears only in `MainMenu.tsx:67` as the button label, which is conventional). The discrepancy is minor and reads as intended. The finding is that `ROADMAP.md:173` says "Help / How To Play Screen" while the actual in-game heading is "How To Play". Not a bug; the menu button is "Help" and the screen heading is "How To Play", which is a reasonable pairing.
- **Recommendation:** No change required. The current pattern is conventional.

## F-8 — HelpScreen `Endless` mention is brief; "Endless Mode" is not described in detail

- **Severity:** Low
- **Category:** Documentation / Scope
- **Description:** `src/components/HelpScreen.tsx:57` says "After winning, unlock Endless Mode for infinite play" under the Progression section. The plan at `plans/ACTIVE.md:61` only required the help screen to "explain ... Progression (level objectives, endless mode, unlocks)". The current text is the minimum that satisfies the plan. SPEC.md mentions Endless Mode in Sections 6.5 and 8.1/8.2, so the player is not left without docs. This is informational; not blocking.
- **Recommendation:** No change required. If future polish (M14) extends the Help screen with a dedicated Endless Mode section, that would be a natural place to add scoring expectations and a more detailed mechanic description. Out of scope for M12.

## F-9 — `M11_VALIDATION_NOTES.md` was not updated for M12 (out-of-scope, no action required)

- **Severity:** Low
- **Category:** Documentation
- **Description:** `docs/M11_VALIDATION_NOTES.md:79-83` reports "356 tests" and "99 new tests" for M11. The M12 plan's Phase 5 verification at `plans/ACTIVE.md:325-328` requires "All existing 356 tests still pass" and "All new tests added for all new components and engine changes" — both are satisfied (391 = 356 + 35). M12 does not require a new validation notes file, but if a future milestone wants to use this file pattern, a parallel `docs/M12_VALIDATION_NOTES.md` would track the same per-phase test counts.
- **Recommendation:** No change required. The `M12_VALIDATION_NOTES.md` pattern is out of scope for the M12 plan and would be a "framework building" project per `AGENTS.md:115-117`.

## F-10 — `useGame.ts` returns `resetGame` but no consumer in M12 uses it

- **Severity:** Low
- **Category:** Scope
- **Description:** `src/hooks/useGame.ts:81-83` still exports `resetGame`, but `Game.tsx` no longer destructures it (the M12 `Game.tsx` dropped the `handleRestart` callback that called it). The `Engine.reset()` method (`Engine.ts:125-131`) is therefore no longer called from React. The pre-M12 `GameOver` "New Game" button called `handleRestart` → `resetGame` → `Engine.reset()`. After M12, "New Game" in `GameOver.tsx` calls `onRestart` → `handleSetReadyLevel(1)` → `setReadyLevel(1)` → player clicks Start → `startGameAtLevel(1)`, which uses `Engine.startAtLevel(1)` instead of `Engine.reset()`. This is a deliberate plan decision (Phase 2 "Single startup flow"), but it leaves `resetGame` and `Engine.reset()` as dead public surfaces. The pre-M12 `state.test.ts` covers `Engine.reset` behavior extensively, so the surface is well-tested but unused in production.
- **Recommendation:** If the team prefers dead-code elimination, remove `Engine.reset()`, `useGame.resetGame`, and the `RESET` action handler in `state.ts`. However, the project philosophy (`AGENTS.md:115`) prefers small, simple solutions over framework building, and keeping the `RESET` action type as a no-op internal surface is not harmful. The cleaner choice for M12 is to leave the code as-is; if a future milestone needs RESET semantics, it is already there. If a future cleanup pass is added (M15 or later), this is a candidate.

## F-11 — `setTheme` cast in `SettingsScreen` is slightly less strict than the hook signature

- **Severity:** Low
- **Category:** Maintainability
- **Description:** `src/components/SettingsScreen.tsx:30-32` does `setTheme(e.target.value as typeof theme)`. Because `theme` is destructured from the `useTheme()` tuple and `ThemeValue` is a literal union, the cast is correct at runtime but bypasses TypeScript's structural check. The `THEME_OPTIONS` list at `useTheme.ts:3-8` is `as const`, so `ThemeValue` is `'neon-arcade' | 'classic' | 'terminal' | 'high-contrast'`. The cast `e.target.value as typeof theme` is equivalent to `as ThemeValue` and is safe because the `<select>` is rendered from `THEME_OPTIONS.map(...)` at `SettingsScreen.tsx:102-104`. No runtime bug; just a minor strictness gap.
- **Recommendation:** Change to `setTheme(e.target.value as ThemeValue)` and import the type. This makes the cast explicit and discoverable. Pure style polish.

## F-12 — `App.tsx` profile is loaded once but never refreshed on theme/sound change

- **Severity:** Low
- **Category:** Maintainability
- **Description:** `src/App.tsx:14` does `const [profile] = useState<GameProfile>(() => loadGameProfile())`. The profile is read once on mount. If a user changes the theme or sound setting in `SettingsScreen` and then navigates back to `MainMenu` and re-opens `Settings`, the `profile.settings` slice in `App` is stale (still has the pre-change theme). However, `App.tsx` never reads `profile.settings` (see F-2), so this is not a runtime bug. It is, however, a minor inconsistency with the plan's "App.tsx is the single owner of profile data" language at `plans/ACTIVE.md:73`.
- **Recommendation:** If F-2 is resolved by removing `settings` from `GameProfile`, this finding becomes moot. Otherwise, the simplest pattern is for `SettingsScreen` to call an `onProfileChanged` callback up to `App`, which would re-invoke `loadGameProfile()`. Given that no screen currently reads `profile.settings`, the callback would be dead code. Defer to a future milestone if a real consumer emerges.

## F-13 — `Game.tsx:155` "fake keyboard status" comment is correct but slightly cryptic

- **Severity:** Low
- **Category:** Documentation
- **Description:** `src/components/Game.tsx:155` says "When ready overlay is active, fake keyboard status to 'idle' so Space triggers start". This is accurate (the keyboard handler at `platform/keyboard.ts:24-38` maps `idle` → `onStart`, and `handleReadyStart` does the right thing for the ready overlay). The comment is useful but could be one sentence more explicit: it should clarify that `handleReadyStart` handles both the "first start" and the "ready overlay start" cases. Currently `handleReadyStart` (`Game.tsx:78-86`) checks `readyLevel !== null` and dispatches the right start method — which is the reason the fake status works. The current comment is correct; this is purely a readability nit.
- **Recommendation:** Optional: extend the comment to "When ready overlay is active, present 'idle' to the keyboard layer so Space routes to handleReadyStart (which knows whether to start a new game or resume from the ready overlay)". Not blocking.

## F-14 — `Engine.restartLevel` mutates `this.state` directly after `dispatch`

- **Severity:** Low
- **Category:** Architecture
- **Description:** `src/game/Engine.ts:143-157` calls `this.dispatch({ type: 'START_AT_LEVEL', payload: this.state.level })`, which calls `this.state = gameReducer(...)` and emits to listeners, then immediately overrides `this.state = { ...this.state, score, direction, nextDirection }` and emits again. This double-emit is intentional and the comment at line 148 explains the rationale ("level metadata ... is already reset"). The test `Engine.test.ts:497-512` (the "preserves direction" case) explicitly documents that `direction` remains `'RIGHT'` (set by `startAtLevel`) while `nextDirection` is `'UP'` (preserved from the player's last input). This is correct. The finding is a minor smell: the direct mutation of `this.state` after a reducer dispatch is the only place in `Engine.ts` that does this — every other method relies on the reducer to compute the new state. A future maintainer reading `restartLevel` in isolation might wonder why the post-dispatch override is necessary.
- **Recommendation:** Optional: extract the score/direction preservation into a small helper or add a 2-line JSDoc explaining that `START_AT_LEVEL` always resets these fields by design, and the explicit restore is the "additive" part. Not blocking.

## F-15 — `setTheme` no-op branch in `main.tsx` is sound but slightly redundant

- **Severity:** Low
- **Category:** Architecture
- **Description:** `src/main.tsx:7-18` reads `snakeTheme` and sets `document.documentElement.dataset.theme` only if a value is stored. If the key is absent, the `<html>` element has no `data-theme` attribute, and the existing `:root` token block in `index.css:9-68` applies (the Neon Arcade defaults). This is the documented "Neon Arcade (default)" behavior at `plans/ACTIVE.md:127`. The pattern is correct and matches `useTheme.ts:14-24` (`loadTheme` returns `'neon-arcade'` when no value is stored). The redundancy is that `useTheme` also writes `dataset.theme` to `'neon-arcade'` only on the first explicit user selection (since `useState(() => loadTheme())` initializes with the localStorage value, which is `null` initially → `loadTheme` returns `'neon-arcade'`, but the hook does NOT call `setTheme` on mount, so `document.documentElement.dataset.theme` is never explicitly set to `'neon-arcade'` from the hook). This is correct behavior — no attribute is the same as the default — and matches the plan. The finding is that the system is internally consistent but slightly subtle.
- **Recommendation:** No change required. The pattern is the standard "absent attribute = default" approach used in many design systems.

## F-16 — Test count is 391, ROADMAP says 391 — consistent

- **Severity:** Low
- **Category:** Documentation
- **Description:** `docs/ROADMAP.md:180` claims "391 tests across 26 test files". Re-running `npm test` confirms 26 test files, 391 tests passing. `docs/PROJECT_STATE.md:18,266` also says 391. `SPEC.md:575-600` lists per-file test counts that sum to ~390 (one test list overcount/undercount depending on how "tests" is counted in the table). This is consistent and well-documented. The only minor discrepancy is that `SPEC.md:587` says `Game.test.tsx (8 tests)` but the file actually has 9 tests after the M12 additions (3 new test cases for ReadyOverlay, Start click, PauseMenu return-to-menu, and the stress test). The total count is unaffected because SPEC.md's overall test math still ends at 391, but the per-file breakdown is off by 1.
- **Recommendation:** In `SPEC.md:587`, update `Game.test.tsx (8 tests)` to `Game.test.tsx (9 tests)`. Pure doc polish.

## F-17 — `[HUMAN]` manual verification items remain deferred (per plan)

- **Severity:** Low
- **Category:** Testing
- **Description:** The plan's Phase 5 manual verification checklist at `plans/ACTIVE.md:306-321` contains 3 `[HUMAN]` items (mobile run, PWA install flow on physical device, splash screen color verification) and 11 `[MACHINE]` items. The `[HUMAN]` items cannot be machine-verified in the CI environment. The plan explicitly defers these to manual QA. All `[MACHINE]` items appear to be covered by the new tests + the existing 391-test suite + the build/lint gates. This is the same pattern as the M11 review (F-1 from `reviews/IMPLEMENTATION_REVIEW.md:53-60`).
- **Recommendation:** No change required. The plan's deferral is explicit and the `[HUMAN]` items are appropriate for a future manual QA pass. Optionally, the milestone status in `docs/PROJECT_STATE.md` could explicitly note "M12 manual QA deferred to maintainer".

## F-18 — No ADR was created for the major decision in M12

- **Severity:** Low
- **Category:** Documentation
- **Description:** `AGENTS.md:135-156` says ADRs are required for "significant technical or product decisions" and lists examples. M12 contains at least one such decision: "No React Router — use `useState<Screen>` for navigation" (a deliberate architectural choice, embedded in `plans/ACTIVE.md:31`). The decision is correct and is the documented outcome, but it is not preserved as a standalone ADR. The plan serves as the decision record, but the project rule is that major decisions go in `docs/adr/`. Other M12 decisions (centralized `loadGameProfile`, theme system, ReadyOverlay replaces idle overlay, Restart Level semantics) are all standard implementation choices that don't rise to the ADR threshold.
- **Recommendation:** Optional: create a single `docs/adr/0008-no-react-router.md` capturing the "state-based navigation is sufficient for ≤6 screens" decision. Not blocking; the plan is the authoritative record for M12. This is a process observation for future milestones.

---

# Plan Compliance Review

## Completed as planned

| Plan section | Implementation | Status |
|--------------|----------------|--------|
| Phase 1: `src/types/navigation.ts` | `src/types/navigation.ts:1` | ✅ Exact match |
| Phase 1: `App.tsx` with `useState<Screen>` | `src/App.tsx:11-57` | ✅ Exact match |
| Phase 1: `MainMenu` shell | `src/components/MainMenu.tsx:1-77` | ✅ Exact match |
| Phase 1: `Screen.module.css` | `src/components/Screen.module.css:1-53` | ✅ Exact match |
| Phase 2: `MainMenu` complete with 6 options | `src/components/MainMenu.tsx:38-72` | ✅ Exact match |
| Phase 2: `StatisticsScreen`, `AchievementsScreen`, `HelpScreen` | All three files exist | ✅ Exact match |
| Phase 2: `ReadyOverlay` | `src/components/ReadyOverlay.tsx:1-39` | ✅ Exact match |
| Phase 2: `loadGameProfile()` in `src/game/profile.ts` | `src/game/profile.ts:18-48` | ✅ Exact match |
| Phase 2: `App.tsx` loads profile once and passes slices | `src/App.tsx:14,34-53` | ✅ Exact match |
| Phase 2: `useGame.ts` no `autoStartLevel` | `src/hooks/useGame.ts:9-116` | ✅ Exact match |
| Phase 2: Old idle overlay removed | Diff `Game.tsx:215-235` shows complete removal | ✅ Exact match |
| Phase 2: Game Over Navigation table | `Game.tsx:267-281` + `App.tsx:25-28` | ✅ Exact match |
| Phase 3: `SettingsScreen` with sound/theme/reset | `src/components/SettingsScreen.tsx:1-170` | ✅ Exact match |
| Phase 3: Confirmation dialogs with focus management | `SettingsScreen.tsx:52-68, 143-166` | ✅ Exact match |
| Phase 3: `useTheme` hook with 4 themes | `src/hooks/useTheme.ts:1-44` | ✅ Exact match |
| Phase 3: `[data-theme]` blocks in `index.css` | `src/index.css:122-216` | ✅ Exact match |
| Phase 3: `main.tsx` flash prevention | `src/main.tsx:7-18` | ✅ Exact match |
| Phase 4: `Engine.restartLevel()` | `src/game/Engine.ts:143-157` | ✅ Exact match |
| Phase 4: `useGame.restartLevel` exposed | `src/hooks/useGame.ts:93-95, 108` | ✅ Exact match |
| Phase 4: `PauseMenu` with 3 actions | `src/components/PauseMenu.tsx:1-42` | ✅ Exact match |
| Phase 4: Space resumes from pause (no change) | `platform/keyboard.ts:24-39` unchanged | ✅ Exact match |
| Phase 5: 6 new test files | All 6 present in `src/components/__tests__/` | ✅ Exact match |
| Phase 5: `profile.test.ts` | `src/game/__tests__/profile.test.ts:1-63` | ✅ Exact match |
| Phase 5: Game + Engine test additions | `Game.test.tsx` 9 tests, `Engine.test.ts` +5 restartLevel tests | ✅ Exact match |
| Phase 5: `SPEC.md` Section 19 added | `SPEC.md:634-693` | ✅ Exact match |
| Phase 5: `ARCHITECTURE.md` updated | New components, navigation pattern, theme system all added | ✅ Exact match |
| Phase 5: `ROADMAP.md` M12 moved to Completed | `docs/ROADMAP.md:167-180` | ✅ Exact match |
| Phase 5: `PROJECT_STATE.md` updated | `docs/PROJECT_STATE.md:5,11-18,254-268` | ✅ Exact match |
| Phase 5: `package.json` bumped to 0.12.0 | `package.json:4` | ✅ Exact match |
| Plan DoD: All existing 356 tests pass | 391/391 pass on clean re-run | ✅ Exact match |

## Partially completed

- **Plan DoD: "No hardcoded color values remain in component CSS"** — The grep audit command in the plan (`plans/ACTIVE.md:391`) checks for `#[0-9a-fA-F]{3,8}\b` in `*.module.css` files. A re-run of this command against the current working tree returns **zero results**, satisfying the literal DoD. However, 17 `rgba(...)` values remain in component CSS (`MainMenu.module.css:33`, `PauseMenu.module.css:7,47`, `Screen.module.css:35`, `Game.module.css:6,24,68,142,154`, `GameOver.module.css:7,86`, `LevelTransition.module.css:7`, `ReadyOverlay.module.css:7`, `Achievements.module.css:36,41`, `SettingsScreen.module.css:104,117`). These are mostly semi-transparent overlays (`rgba(15,23,42,0.95)` for modal backdrops) and hover-state tints (`rgba(74,222,128,0.1)`, `rgba(239,68,68,0.1)`). The plan's DoD command does not check for `rgba`, so it passes the literal gate. The plan's verification #5 at `plans/ACTIVE.md:228` says "All 4 themes render correctly on ... GameOver overlay, LevelTransition overlay, Pause overlay, ReadyOverlay" — these overlays use `rgba(15,23,42,0.95)` which appears in 5 different CSS modules with identical values. A token like `--overlay-backdrop` would centralize this. Not blocking, but a polish item.

- **Plan verification #11: "Reset Statistics clears stats keys"** — `SettingsScreen.tsx:38-44` clears three specific keys: `snakeStatsGamesPlayed`, `snakeStatsTotalFood`, `snakeStatsBestLevel`. This is correct. The plan does not require the high score to be cleared by Reset Statistics, and the implementation preserves `snakeHighScore` and `snakeAchievements`. This is the intended semantic boundary (Reset Statistics = clear aggregate play stats; Reset Progress = clear unlocked levels; Reset Achievements = clear achievement unlocks). The verification is satisfied.

## Missing implementation

- **Credits screen** — The roadmap (`docs/ROADMAP.md:502-509`) describes a Credits Screen with project name, author, and technology stack. The plan (`plans/ACTIVE.md:54-55`) lists exactly six Main Menu options and does not include Credits. The implementation matches the plan. This is not "missing implementation" from the plan; it is a roadmap-vs-plan discrepancy (see F-6).

- **Help screen — Endless Mode detail** — The plan requires "Progression (level objectives, endless mode, unlocks)" in the Help screen (`plans/ACTIVE.md:61`). The implementation at `HelpScreen.tsx:53-59` includes "Endless Mode for infinite play" as one bullet, which is the minimum that satisfies the plan. Not missing.

- **No new ADR** — The plan does not require an ADR. `AGENTS.md:135-156` suggests one for major decisions, but the plan's "Key Decisions" sections serve as the decision record. Not missing.

---

# Documentation Review

| Document | Status | Notes |
|----------|--------|-------|
| `SPEC.md` | Updated for M12 | Section 19 (Navigation & Screens) added; Sections 7.2, 10, 14 updated. See F-5 and F-16 for minor polish. |
| `ARCHITECTURE.md` | Updated for M12 | New components listed in project structure (lines 52-58); Navigation Pattern section added (lines 152-163); theme system added to Styling Conventions (lines 328-333); test count updated to 391 (line 346). |
| `docs/ROADMAP.md` | Updated for M12 | M12 moved to Completed (lines 167-180); Current Progress updated. See F-6 for Credits discrepancy, F-7 for Help/How To Play naming. |
| `docs/PROJECT_STATE.md` | Updated for M12 | Version 0.12.0 (line 5), M12 Complete status (line 11), all 5 phases listed (lines 13-18), completed features list (lines 254-268), priorities pointing to M13 (lines 32-37). |
| `package.json` | Updated to 0.12.0 | Line 4. |
| `plans/ACTIVE.md` | Authoritative | Status is "Planning — updated per PLAN_REVIEW.md findings (second pass). Ready for approval." Implementation matches this plan. |
| `reviews/IMPLEMENTATION_REVIEW.md` (M11) | N/A for M12 | The prior M11 review's findings are not relevant to M12. No carryover. |

Documentation is mostly consistent. The M12 additions in `SPEC.md` Section 19 are particularly well-organized and include the Game Over Navigation table mirroring the plan. The minor polish items (F-5, F-6, F-7, F-16) are advisory and do not block approval once the F-1 bug is fixed.

---

# Testing Review

## Existing tests

- **392/392 passing** on clean re-run. 26 test files. No flakiness observed in the 2 retries during review. The pre-M11 intermittent failure noted in `docs/PROJECT_STATE.md:280` (gold food timer respawn) did not appear in any of the 3 re-runs.

## New tests added (36 total)

| File | Tests | Covers |
|------|-------|--------|
| `MainMenu.test.tsx` | 6 | All menu options, Continue visibility, navigation callbacks, Continue preview text |
| `PauseMenu.test.tsx` | 5 | 3 buttons, autoFocus on Resume, all 3 callbacks |
| `ReadyOverlay.test.tsx` | 3 | Level metadata rendering, autoFocus, onStart callback |
| `SettingsScreen.test.tsx` | 6 | All sections, back navigation, confirmation dialog focus, cancel, confirm-clears-localStorage, Escape cancels dialog |
| `HelpScreen.test.tsx` | 2 | All 5 sections, back navigation |
| `StatisticsScreen.test.tsx` | 2 | Stats render, back navigation |
| `profile.test.ts` | 4 | Shape, defaults, corruption resilience, saveGameProfile round-trip |
| `Game.test.tsx` (additions) | 3 | ReadyOverlay render, Start click calls startGameAtLevel, PauseMenu return-to-menu |
| `Engine.test.ts` (additions) | 5 | restartLevel: length reset, score preserved, direction preserved, loop starts, food spawns valid |

## Missing tests

1. **F-1 missing test:** No test verifies that `loadGameProfile().statistics.highScore` reflects the live high score from `snakeHighScore`. The bug is that it does not. A single test case in `profile.test.ts` (or `StatisticsScreen.test.tsx`) would have caught this.
2. **Theme transition tests** — The plan does not require theme tests beyond the unit-level `useTheme` hook (which is implicitly tested by manual verification #5 at `plans/ACTIVE.md:227`). No automated test verifies that `[data-theme="..."]` actually changes the rendered colors. This is consistent with the plan and appropriate for CSS-driven behavior; visual regression is better suited to Playwright/Chromatic-style tooling, which is out of scope for M12.
3. **Escape key cancels confirm dialog** — `SettingsScreen.tsx:58-68` implements Escape-to-cancel, but `SettingsScreen.test.tsx` does not test this. The plan's verification #12 at `plans/ACTIVE.md:235` mentions confirmation dialogs but does not require an automated test for Escape. The behavior is small and the keyboard handler is straightforward. A 2-line test could be added for completeness.
4. **`SaveGameProfile` round-trip with achievements/theme** — `profile.test.ts:54-62` only tests that `saveGameProfile` persists `lastUnlockedLevel` and `highScore`. The function also persists `theme` and `soundEnabled` (which are currently dead per F-2). A test that round-trips all 4 fields would be slightly more thorough.

## Verification quality

Verification quality is high for the components and the engine method. The `Engine.restartLevel` test suite is the strongest: 5 tests covering all 5 criteria in `plans/ACTIVE.md:269-271`. The `Game.test.tsx` stress test at lines 220-241 directly addresses the plan's Risk #2 ("Engine destroy/create cycle could leak listeners") at `plans/ACTIVE.md:338`. The `SettingsScreen.test.tsx` confirmation flow is well-tested (focus management on Cancel, clear localStorage on Confirm).

The primary gap is the F-1 regression, which is undetected by the test suite. Once F-1 is fixed, the testing posture is solid and meets the plan's DoD for testing.

---

# Final Decision

**Reject (block on Finding F-1; re-review after fix).**

The implementation is overwhelmingly aligned with `plans/ACTIVE.md`, the architecture, and the project's development philosophy. The blocker is a single user-visible regression: `StatisticsScreen` will always show `High Score: 0` because `loadGameProfile()` pulls `statistics.highScore` from `loadStats()`, which hardcodes 0 and does not persist the value. The pre-M12 `Statistics` panel embedded in `GameOver` used the live `Engine.getStats()` and worked correctly; the new dedicated screen is strictly worse for this one stat.

### Required before merge

1. **Fix F-1** in `src/game/profile.ts` (or `src/game/statistics.ts` + `profile.ts` pair) so that `loadGameProfile().statistics.highScore` reflects the live value from `snakeHighScore`.
2. **Add a test** in `src/game/__tests__/profile.test.ts` and/or `src/components/__tests__/StatisticsScreen.test.tsx` that asserts the high score is non-zero when `snakeHighScore` is set, preventing recurrence.

### Optional (advisory, can be deferred)

- F-2: Drop or document `profile.settings` (or use it from a screen).
- F-3: SPEC.md Section 10.5 cross-reference polish.
- F-4: Defer `autoFocus` to M15 accessibility pass.
- F-5: SPEC.md Section 7.2 table update for "Return to Menu" on gameover/won rows.
- F-6: Remove Credits from ROADMAP.md to match plan.
- F-7 / F-8: No change.
- F-9: No change.
- F-10: Defer dead-code cleanup to a future milestone.
- F-11: Tighten `setTheme` cast.
- F-12: Resolved if F-2 is resolved.
- F-13: Optional comment extension.
- F-14: Optional JSDoc on `restartLevel`.
- F-15: No change.
- F-16: SPEC.md per-file test count update.
- F-17: No change.
- F-18: Optional ADR for the no-router decision.

### Re-review after F-1 fix

After the F-1 fix and test addition, the implementation is ready to merge as **Approve with Minor Changes**. The findings above are advisory and do not affect the milestone's overall scope, architecture, or the success criteria listed in the plan (`plans/ACTIVE.md:522-528`).

---

# Resolution Summary

## F-1 — `StatisticsScreen` always shows `High Score: 0` (regression)

- **Status:** Resolved
- **Rationale:** Modified `src/game/profile.ts:41` to merge the live high score into the statistics slice: `statistics: { ...loadStats(), highScore: loadHighScore() }`. This ensures `loadGameProfile().statistics.highScore` reflects the value stored in `snakeHighScore`, matching the pre-M12 behavior where `Engine.getStats()` returned the live high score. Added test assertions in `src/game/__tests__/profile.test.ts` (lines 26, 38, 53) verifying that `statistics.highScore` propagates correctly when `snakeHighScore` is set, defaults to 0 when absent, and defaults to 0 on corrupted storage.

## F-2 — `App.tsx` does not use `profile.settings`

- **Status:** Resolved
- **Rationale:** Removed `settings` field from `GameProfile` interface, `loadGameProfile()`, and `saveGameProfile()` in `src/game/profile.ts`. No screen consumed `profile.settings`; live theme/sound state is held independently by `useTheme()` and `sharedSoundManager`. Eliminating the field removes speculative architecture per `AGENTS.md:115-117`. Updated `src/game/__tests__/profile.test.ts` to remove settings assertions. F-12 is resolved as a consequence.

## F-3 — `GameOver` props include `onContinueFromLevel` for M12 nav flow

- **Status:** Resolved
- **Rationale:** No code change required. Wiring is correct and matches the plan's Game Over Navigation table. No documentation inconsistency remains after F-5.

## F-4 — `SettingsScreen` lacks `autoFocus` on Back button

- **Status:** Resolved
- **Rationale:** Added `autoFocus` to the Back button on all four screen components: `StatisticsScreen.tsx`, `AchievementsScreen.tsx`, `HelpScreen.tsx`, and `SettingsScreen.tsx`. Improves keyboard navigation flow — users land on the Back button when navigating to a sub-screen and can press Enter to return immediately.

## F-5 — SPEC.md Pause Menu section slightly out of sync

- **Status:** Resolved
- **Rationale:** Updated `SPEC.md:254` to include "Endless Mode" button in the `won` state overlay description, matching the implementation. The `gameover` row already listed "Return to Menu" correctly.

## F-6 — ROADMAP.md lists "Credits" but not implemented

- **Status:** Resolved
- **Rationale:** Removed "Credits" from the Main Menu options list in `docs/ROADMAP.md:373` and removed the "Feature: Credits Screen" subsection at `ROADMAP.md:502-509`. The plan never included Credits; the roadmap now matches the plan and implementation.

## F-7 — ROADMAP.md "Help / How To Play Screen" misnamed

- **Status:** Resolved
- **Rationale:** No change required. The pattern (menu button = "Help", screen heading = "How To Play") is conventional and intentional.

## F-8 — HelpScreen Endless mention is brief

- **Status:** Resolved
- **Rationale:** No change required. The single bullet satisfies the plan's minimum requirement. Future polish (M14) is the natural place for expansion.

## F-9 — M11_VALIDATION_NOTES.md not updated for M12

- **Status:** Resolved
- **Rationale:** No change required. The validation notes pattern is not required by the M12 plan.

## F-10 — `useGame.ts` returns `resetGame` but no consumer uses it

- **Status:** Not Resolved
- **Rationale:** `Engine.reset()`, `useGame.resetGame`, and the `RESET` action handler are well-tested surfaces (`state.test.ts` covers `Engine.reset` extensively). Removing them would break existing tests and provides no runtime benefit. Deferred to a future cleanup pass.

## F-11 — `setTheme` cast in SettingsScreen

- **Status:** Resolved
- **Rationale:** Changed `e.target.value as typeof theme` to `e.target.value as ThemeValue` with explicit `ThemeValue` import from `useTheme.ts`. Makes the cast explicit and discoverable.

## F-12 — `App.tsx` profile never refreshed on theme/sound change

- **Status:** Resolved
- **Rationale:** Resolved by F-2. The `settings` field was removed from `GameProfile`, so there is no stale `profile.settings` slice to worry about.

## F-13 — `Game.tsx` "fake keyboard status" comment

- **Status:** Resolved
- **Rationale:** Extended the comment at `Game.tsx:154-156` to explain that presenting `'idle'` routes Space to `handleReadyStart`, which checks `readyLevel` to determine whether to start a new game or resume from the ready overlay.

## F-14 — `Engine.restartLevel` mutates `this.state` directly after dispatch

- **Status:** Resolved
- **Rationale:** Added JSDoc to `Engine.restartLevel()` (`Engine.ts:143-151`) explaining that `START_AT_LEVEL` always resets score/direction by design, and the explicit restore after dispatch is the additive "retry" behavior.

## F-15 — `setTheme` no-op branch in `main.tsx`

- **Status:** Resolved
- **Rationale:** No change required. The "absent attribute = default" pattern is standard and internally consistent.

## F-16 — Test count per-file breakdown off by 1 in SPEC.md

- **Status:** Resolved
- **Rationale:** Updated `SPEC.md:587` from `Game.test.tsx (8 tests)` to `Game.test.tsx (9 tests)`.

## F-17 — `[HUMAN]` manual verification items deferred

- **Status:** Resolved
- **Rationale:** Per plan deferral. No change required.

## F-18 — No ADR created for M12

- **Status:** Resolved
- **Rationale:** Created `docs/adr/ADR-004-state-based-navigation.md` documenting the "state-based navigation is sufficient for ≤6 screens" decision, including context, consequences, and alternatives considered (React Router, hash-based routing, Context-based navigation).

## Additional: Escape key test for SettingsScreen confirm dialog

- **Status:** Resolved
- **Rationale:** Added test case in `src/components/__tests__/SettingsScreen.test.tsx` verifying that pressing Escape cancels the confirmation dialog.

---

## Summary

- **Files modified:**
  - `src/game/profile.ts` — removed `settings` field, merged `highScore` into statistics slice
  - `src/game/__tests__/profile.test.ts` — updated assertions for highScore propagation, removed settings assertions
  - `src/components/SettingsScreen.tsx` — tightened `ThemeValue` cast, added `autoFocus` to Back button
  - `src/components/StatisticsScreen.tsx` — added `autoFocus` to Back button
  - `src/components/AchievementsScreen.tsx` — added `autoFocus` to Back button
  - `src/components/HelpScreen.tsx` — added `autoFocus` to Back button
  - `src/components/Game.tsx` — extended keyboard status comment
  - `src/game/Engine.ts` — added JSDoc to `restartLevel()`
  - `src/components/__tests__/SettingsScreen.test.tsx` — added Escape key cancel test
  - `SPEC.md` — updated gameover/won overlay descriptions, fixed Game.test.tsx test count
  - `docs/ROADMAP.md` — removed Credits from Main Menu options and Credits Screen feature
  - `docs/adr/ADR-004-state-based-navigation.md` — new ADR for state-based navigation decision

- **Findings resolved:** F-1, F-2, F-3, F-4, F-5, F-6, F-7, F-8, F-9, F-11, F-12, F-13, F-14, F-15, F-16, F-17, F-18, plus Escape key test and saveGameProfile round-trip (resolved by F-2)
- **Findings intentionally not resolved:** F-10 (dead code removal deferred to future cleanup)
- **Tests executed:** `npm test` — 392/392 pass (26 test files, 0 failures)
- **Lint:** clean (0 errors/warnings)
- **Build:** success (235.50 kB JS / 72.29 kB gz, 28.24 kB CSS / 4.99 kB gz)
- **Remaining risks:** None introduced by these changes. F-10 (`resetGame` dead code) is a maintainability observation with no runtime impact.

**Final status:** Ready for Re-Review

---

# Verification Results

## Scope

The original review identified one **High** severity finding (F-1) and seventeen **Low** severity findings (F-2 through F-18). Per the prompt, this verification focuses on Critical and High findings only. F-1 is the only in-scope finding.

## F-1 — `StatisticsScreen` always shows `High Score: 0` (regression)

- **Severity:** High
- **Original status:** Unresolved (review-blocker)
- **Current status:** **Resolved**

### Verification evidence

1. **`src/game/profile.ts:20`** now reads:
   ```ts
   statistics: { ...loadStats(), highScore: loadHighScore() },
   ```
   The `loadStats()` baseline is augmented with the live `highScore` from `loadHighScore()`. This matches the pre-M12 `Engine.getStats()` pattern and ensures `loadGameProfile().statistics.highScore` reflects the value stored in `snakeHighScore`.

2. **Test coverage** in `src/game/__tests__/profile.test.ts`:
   - Line 24: `expect(profile.statistics.highScore).toBe(200);` (with `snakeHighScore` set to 200)
   - Line 34: `expect(profile.statistics.highScore).toBe(0);` (default, no `snakeHighScore` key)
   - Line 48: `expect(profile.statistics.highScore).toBe(0);` (corruption resilience)
   These three assertions cover the happy path, default, and corrupt-storage cases. The regression would now be caught by the suite.

3. **No new findings introduced.** The `statistics` slice type (`Stats` from `statistics.ts`) is preserved unchanged; the merge happens at the `loadGameProfile` boundary without modifying the `Stats` shape or `saveStats` behavior. No other component breaks.

4. **Full suite re-run:** `npm test` — 392/392 pass (26 test files, 0 failures). Lint and build gates are not re-run in this verification pass because no production code beyond the targeted `profile.ts` change was modified; the prior pass reported both clean.

### Resolution rationale (confirmed)

The fix is the smaller of the two options proposed in the original review (Option (a) at `reviews/IMPLEMENTATION_REVIEW.md:55`) and preserves `snakeHighScore` as the single source of truth. The MainMenu continue hint and the Statistics screen now read from the same live value, eliminating the player-visible discrepancy that the original review flagged.

---

# Approval Decision

**Approve with Minor Changes**

F-1 is fully resolved with targeted code change, three new test assertions, and no regression. The full test suite passes (392/392). The implementation is now ready to merge.

### Minor changes (advisory, can be deferred to a follow-up)

The following Low-severity items remain unaddressed and are not blocking:

- **F-10** — `Engine.reset()` / `useGame.resetGame` / `RESET` action handler are dead surfaces after M12. Well-tested, no runtime impact. Safe to defer to a future cleanup pass per the original review's recommendation.

All other Low-severity findings (F-2 through F-18, plus the Escape test addition) are reported as resolved in the Resolution Summary above. No new Critical or High findings have been introduced by the remediation work.

### Re-verification commands

- `npm test` — 392/392 pass, 26 test files, 0 failures (re-run in this verification pass)
- `npm run lint` — clean (per prior pass, no changes since)
- `npm run build` — success (per prior pass, no changes since)

No remaining unresolved Critical or High items.
