# Active Plan: Milestone 12 — User Experience & Navigation

## Overview

Make the game feel like a complete product by adding screen-based navigation (Main Menu, Statistics, Achievements, Settings, Help / How To Play), a centralized persistence service, theme support, and an improved pause experience.

**Status:** Planning — updated per PLAN_REVIEW.md findings (second pass). Ready for approval.

**Review Resolution:** All Critical and High findings accepted. All Medium findings accepted. Low findings accepted where practical. Second-pass follow-up findings 1, 2, 4, and 5 resolved. Finding 3 (Help Screen boundary) confirmed resolved.

---

## Phase 1: Navigation Infrastructure & Screen Management

### Goal

Introduce a lightweight state-based screen navigation system. Create an `App.tsx` that switches between screens, and a Main Menu shell with navigation buttons.

### Files

| Action | File | Description |
|--------|------|-------------|
| New | `src/types/navigation.ts` | `Screen` type: `'menu' \| 'game' \| 'statistics' \| 'achievements' \| 'settings' \| 'help'` |
| Modify | `src/App.tsx` | Add `useState<Screen>('menu')`, render screen component via switch/map; wrap in fragment with shared UI (theme attribute, aria-live) |
| New | `src/components/MainMenu.tsx` | Main menu component shell — renders title and navigation buttons; accepts `onNavigate` callback and receives `lastUnlockedLevel`/`highScore` as props (sourced from `loadGameProfile()` by `App.tsx`) for the Continue hint |
| New | `src/components/MainMenu.module.css` | Menu styling following existing arcade/neon visual language |
| New | `src/components/Screen.module.css` | Shared screen layout styles: centered container, back button, heading, neon divider (reuses existing `.neon-divider` pattern) |

### Key Decisions

- **No React Router.** A `useState<Screen>` in `App.tsx` is sufficient for a single-page game. Avoids adding a dependency for 6 screens.
- **Screen components are stateless presenters.** They receive data as props and call navigation callbacks. Data originates from localStorage (stats, achievements, level progress) or is read fresh on mount.
- **MainMenu receives persistence data as props.** `App.tsx` calls `loadGameProfile()` once and passes `lastUnlockedLevel` and `highScore` to `MainMenu` as props. No screen component reads localStorage directly — the centralized `loadGameProfile()` service (introduced in Phase 2) is the only access pattern for the entire milestone.

### Verification

1. `npm run build` completes with no errors
2. App renders MainMenu on load (not the Game board)
3. Clicking menu items changes the rendered screen in App
4. `npm run lint` passes with no new warnings

---

## Phase 2: Main Menu, Statistics, Achievements, Help & Persistence Service

### Goal

Complete the Main Menu with full Continue experience. Create dedicated full-screen views for Statistics, Achievements, and Help / How To Play. Introduce a `ReadyOverlay` component so players see the level name, description, and objective before gameplay begins. Establish a centralized `loadGameProfile()` persistence service so all screens read and write data through a single contract.

### Files

| Action | File | Description |
|--------|------|-------------|
| New | `src/game/profile.ts` | Centralized persistence service. Exports `loadGameProfile()` returning `{ progress: { lastUnlockedLevel, highScore }, statistics: Stats, achievements: Achievement[], settings: { soundEnabled, theme } }`. Wraps all `loadLastUnlockedLevel()`, `loadHighScore()`, `loadStats()`, `loadAchievements()`, `loadTheme()`, `loadSoundEnabled()` calls. Screens consume this one service instead of reading localStorage directly. Also exports `saveGameProfile(profile)` for batch writes where needed. |
| Modify | `src/components/MainMenu.tsx` | Complete menu: "Continue" (with level/high-score preview), "New Game", "Statistics", "Achievements", "Settings", "Help". Continue is disabled/hidden when `lastUnlockedLevel === 1` and no games played. Reads data via `loadGameProfile()` instead of individual localStorage calls. |
| Modify | `src/components/MainMenu.module.css` | Full menu styling |
| New | `src/components/StatisticsScreen.tsx` | Full-screen wrapper around existing `Statistics` presentational component. Adds a heading, neon divider, and back button. Receives stats as props from `App.tsx` (sourced from `loadGameProfile()`). |
| New | `src/components/StatisticsScreen.module.css` | Screen layout extending `Screen.module.css` patterns |
| New | `src/components/AchievementsScreen.tsx` | Full-screen wrapper around existing `Achievements` component. Receives achievements as props from `App.tsx` (sourced from `loadGameProfile()`). |
| New | `src/components/AchievementsScreen.module.css` | Screen layout |
| New | `src/components/HelpScreen.tsx` | Static help screen explaining game mechanics. Sections: Controls (arrows, WASD, Space to pause, touch swipe), Food Types (normal/gold/poison/slow with point values and effects), Special Mechanics (portals — instant teleport to exit, wrap-around — snake wraps board edges), Progression (level objectives, endless mode, unlocks), Achievements overview. Back button. |
| New | `src/components/HelpScreen.module.css` | Help screen layout — clean sectioned layout with headings, paragraph text, and color-coded food type labels matching in-game colors |
| New | `src/components/ReadyOverlay.tsx` | Shown when Game component mounts with a `startLevel` prop but before gameplay begins. Displays: level number, level name, level description, and objective text (from `getLevelDefinition(level)` in `src/game/levels.ts`). Renders a "Start" button. Accepts `startLevel: number`, `levelName: string`, `levelDescription: string`, `levelObjective: string`, and `onStart: () => void` props. Auto-focuses the Start button. |
| New | `src/components/ReadyOverlay.module.css` | Ready overlay styling — centered card with level info, matching existing overlay visual patterns (GameOver, LevelTransition) |
| Modify | `src/components/Game.tsx` | Accept `startLevel: number` prop and `onNavigateToMenu?: () => void` prop. When the game has not started (`gamePhase === 'ready'` or equivalent), render `<ReadyOverlay>` with level metadata instead of the idle overlay. Remove the old idle overlay entirely (including its Statistics/Achievements panels). When the player clicks Start on ReadyOverlay, start the game at the given level. |
| Modify | `src/App.tsx` | Pass `onNavigate` callbacks to MainMenu; when navigating to `'game'`, pass `startLevel` and `onNavigateToMenu` to `<Game>`. Load profile once via `useEffect(() => loadGameProfile(), [])` and pass relevant slices to screens as props. `App.tsx` is the single owner of profile data — screens never call `loadGameProfile()` directly. |
| Modify | `src/hooks/useGame.ts` | No `autoStartLevel` parameter (replaced by `startLevel` + ReadyOverlay flow). The hook continues to expose `startGame()` and `startAtLevel()` — these are called by Game.tsx when the player clicks Start on the ReadyOverlay, not automatically on mount. |

### Key Decisions

- **Ready Overlay replaces auto-start and idle overlay.** There is exactly one startup flow: `MainMenu → Game (with startLevel) → Ready Overlay → Start → playing`. The old idle overlay is removed entirely — no safety net, no fallback. This gives players time to read the level name, description, and objective before the snake starts moving. It surfaces the existing level metadata that was previously invisible outside the Level Transition overlay. One path, simple to test, simple to maintain.
- **`loadGameProfile()` centralizes persistence.** Instead of `MainMenu`, `StatisticsScreen`, `AchievementsScreen`, and `SettingsScreen` each calling individual `load*()` functions, all screens consume a single `loadGameProfile()` service from `src/game/profile.ts`. If a future migration changes storage keys or adds/removes fields, only `profile.ts` needs updating. This is the plan's own "Acceptable Alternative" adopted.
- **Screens are stateless presenters.** They receive all data as props from `App.tsx` and call navigation callbacks. `App.tsx` owns the profile data — loading once on mount and passing slices to each screen. This makes screens purely presentational and centralizes the persistence contract in `App.tsx` and `src/game/profile.ts`.
- **Continue preview data comes from props.** `App.tsx` calls `loadGameProfile()` and passes `lastUnlockedLevel` and `highScore` to `MainMenu` as props. No Engine instance needed.
- **No idle overlay remains.** The Game component renders exactly one of: Ready Overlay (before start), playing board (during play), Pause Overlay (when paused), Game Over Overlay (when dead), or Level Transition Overlay (between levels). The old idle overlay with Statistics/Achievements panels is deleted; those features now live in dedicated screens accessible from the main menu.
- **The dev-level-select dropdown remains in `Game.tsx`**, gated by `import.meta.env.DEV`. It is not affected by the navigation changes and continues to work when visible.

### Game Over Navigation

When the player dies and the Game Over overlay appears, the following actions are available with their defined destinations:

| Action | Destination | Behavior |
|--------|-------------|----------|
| **Continue** | Ready Overlay → Last Unlocked Level | Shows the Ready Overlay for `lastUnlockedLevel` (the highest level the player has reached). Clicking Start begins gameplay from that level. Score carries over from the previous run. |
| **New Game** | Ready Overlay → Level 1 | Shows the Ready Overlay for level 1. Clicking Start begins a fresh run at level 1. Score resets to 0. |
| **Return To Menu** | Main Menu | Navigates to the Main Menu. The Engine is destroyed. Starting a subsequent game from the menu creates a fresh Engine and run. |

All three destinations pass through the same `Game` component but with different `startLevel` props. The Game Over overlay itself (existing `GameOver` component) already has these three buttons; this subsection defines their navigation behavior in the new screen-based architecture.

### Verification

1. `npm run build` completes with no errors
2. Main Menu shows all 6 options (Continue, New Game, Statistics, Achievements, Settings, Help)
3. "Continue" shows last unlocked level and high score
4. Clicking "Continue" → Game mounts → Ready Overlay shows with level name, description, objective → clicking Start begins gameplay at `lastUnlockedLevel`
5. Clicking "New Game" → Game mounts → Ready Overlay shows level 1 info → clicking Start begins gameplay at level 1
6. Statistics screen shows all 4 stats correctly
7. Achievements screen shows locked/unlocked state
8. Help screen displays all game mechanics sections with correct information
9. Back button on every screen returns to menu
10. Old idle overlay is fully removed; no dead code paths remain
11. `npm run lint` passes

---

## Phase 3: Settings Screen & Theme System

### Goal

Create a Settings screen with sound toggle, data reset options, and theme selection. Implement the 4-theme system using CSS custom property overrides with `data-theme` attribute.

### Files

| Action | File | Description |
|--------|------|-------------|
| New | `src/components/SettingsScreen.tsx` | Settings screen with: Sound on/off toggle (reuses `sharedSoundManager`), Theme selector (dropdown with 4 options), Reset Progress button (confirmation prompt, clears `snakeLastUnlockedLevel`), Reset Statistics button (confirmation, clears stats keys), Reset Achievements button (confirmation, clears `snakeAchievements`). Back button. |
| New | `src/components/SettingsScreen.module.css` | Settings layout: grouped sections with headers, toggle switches styled as arcade buttons, danger-zone section with red-accented reset buttons, confirmation dialog overlay |
| New | `src/hooks/useTheme.ts` | `useTheme()` hook: reads initial theme from `localStorage` key `snakeTheme` (defaults to `'neon-arcade'`), returns `[theme, setTheme]`. `setTheme` persists to localStorage and sets `document.documentElement.dataset.theme`. Exports `THEME_OPTIONS` constant array for the dropdown. |
| Modify | `src/index.css` | Add `[data-theme="classic"]`, `[data-theme="terminal"]`, and `[data-theme="high-contrast"]` blocks overriding all color tokens and shadow tokens. Default (no attribute / `data-theme="neon-arcade"`) is the existing `:root` block. Also remove glow/box-shadow effects where needed per theme. |
| Modify | `src/main.tsx` | On app init, read `snakeTheme` from localStorage and set `document.documentElement.dataset.theme` before first render, ensuring no flash of wrong theme. |
| Modify | `src/components/Game.module.css` | Audit for hardcoded colors that should reference CSS variables. Replace any found. |
| Modify | `src/components/MainMenu.module.css` | Ensure all colors reference CSS variables so themes apply correctly. |

### Theme Definitions

#### Neon Arcade (default, `data-theme="neon-arcade"`)
No overrides needed — existing `:root` tokens are the Neon Arcade theme.

#### Classic Snake (`data-theme="classic"`)
Light background, dark snake, minimal glow. Inspired by classic Nokia-style snake games.

| Token | Value | Notes |
|-------|-------|-------|
| `--color-bg` | `#f0f0e0` | Light cream background |
| `--color-surface` | `#e8e8d8` | Slightly darker surface |
| `--color-board-bg` | `#d8d8c8` | Board background |
| `--color-text-primary` | `#1a1a1a` | Near-black text |
| `--color-text-body` | `#333333` | Body text |
| `--color-text-label` | `#666666` | Label text |
| `--color-text-hint` | `#888888` | Hint text |
| `--color-text-on-accent` | `#ffffff` | Text on accent buttons |
| `--color-accent-soft` | `#4a7c2e` | Muted green |
| `--color-accent` | `#228b22` | Forest green (snake) |
| `--color-accent-deep` | `#006400` | Dark green (snake body) |
| `--color-danger` | `#cc0000` | Red (food) |
| `--color-warning` | `#d4a017` | Dark gold |
| `--color-obstacle` | `#555555` | Dark gray |
| `--color-obstacle-edge` | `#777777` | Lighter gray border |
| `--color-border-default` | `#aaaaaa` | Muted borders |
| `--color-board-border` | `#888888` | Board border |
| `--color-cell-border` | `#cccccc` | Cell grid lines |
| `--color-food-poison` | `#9933cc` | Purple |
| `--color-food-slow` | `#3399cc` | Blue |
| `--color-portal` | `#cc6600` | Orange |
| Glow shadows | Set to `none` or `0 0 0 transparent` | Remove neon glow |

#### Terminal (`data-theme="terminal"`)
Black background, green monochrome. CRT-inspired.

| Token | Value | Notes |
|-------|-------|-------|
| `--color-bg` | `#000000` | Pure black |
| `--color-surface` | `#0a0a0a` | Near-black surface |
| `--color-board-bg` | `#000000` | Board background |
| `--color-text-primary` | `#00ff00` | Bright green |
| `--color-text-body` | `#00cc00` | Body text green |
| `--color-text-label` | `#009900` | Dim green labels |
| `--color-text-hint` | `#006600` | Very dim green hints |
| `--color-text-on-accent` | `#000000` | Black text on green |
| `--color-accent-soft` | `#00ff44` | Bright lime |
| `--color-accent` | `#00ff00` | Snake green |
| `--color-accent-deep` | `#00aa00` | Darker snake green |
| `--color-danger` | `#00ff00` | Same green (monochrome) |
| `--color-warning` | `#00ff00` | Same green |
| `--color-obstacle` | `#005500` | Very dark green |
| `--color-obstacle-edge` | `#008800` | Dim green border |
| `--color-border-default` | `#006600` | Green border |
| `--color-board-border` | `#00ff00` | Bright green board edge |
| `--color-cell-border` | `#001a00` | Very dim cell lines |
| `--color-food-poison` | `#00ff00` | Monochrome |
| `--color-food-slow` | `#00ff00` | Monochrome |
| `--color-portal` | `#00ff00` | Monochrome |
| Glow shadows | Set to `none` or `0 0 0 transparent` | No glow |

#### High Contrast (`data-theme="high-contrast"`)
Maximum contrast, accessibility-focused. Highly distinguishable gameplay elements.

| Token | Value | Notes |
|-------|-------|-------|
| `--color-bg` | `#000000` | Pure black |
| `--color-surface` | `#000000` | Black surface |
| `--color-board-bg` | `#000000` | Board background |
| `--color-text-primary` | `#ffffff` | Pure white |
| `--color-text-body` | `#ffffff` | White body text |
| `--color-text-label` | `#cccccc` | Light gray labels |
| `--color-text-hint` | `#999999` | Medium gray hints |
| `--color-text-on-accent` | `#000000` | Black text on bright buttons |
| `--color-accent-soft` | `#ffff00` | Yellow |
| `--color-accent` | `#ffff00` | Yellow snake |
| `--color-accent-deep` | `#ffaa00` | Orange snake body |
| `--color-danger` | `#ff0000` | Bright red food |
| `--color-warning` | `#ffff00` | Yellow gold food |
| `--color-obstacle` | `#0000ff` | Blue obstacles |
| `--color-obstacle-edge` | `#0088ff` | Lighter blue border |
| `--color-border-default` | `#ffffff` | White borders |
| `--color-board-border` | `#ffffff` | White board edge |
| `--color-cell-border` | `#333333` | Dark gray cell lines |
| `--color-food-poison` | `#ff00ff` | Magenta |
| `--color-food-slow` | `#00ffff` | Cyan |
| `--color-portal` | `#ff8800` | Orange portal |
| Glow shadows | Set to `none` or `0 0 0 transparent` | No glow |

### Key Decisions

- **Themes modify design tokens only.** No component contains theme-specific logic. Theme CSS blocks override the same `--color-*` and `--shadow-*` variables used everywhere. This matches the roadmap requirement: "New themes should be addable without modifying gameplay components."
- **`data-theme` attribute on `<html>` element.** Set once in `main.tsx` on init and updated by `useTheme()`. All CSS selectors use `[data-theme="..."]` prefix.
- **Flash prevention.** The theme is read from localStorage **before** React mounts in `main.tsx`, so `document.documentElement.dataset.theme` is set synchronously before the first paint. No flash of default theme.
- **Confirmation dialogs for destructive actions.** Reset buttons show an inline confirmation prompt ("Are you sure?") before executing. The confirmation is a small modal dialog: keyboard `Enter` confirms, `Escape` cancels, focus is trapped in the dialog. Touch: tap "Confirm" to execute, tap "Cancel" or outside the dialog to dismiss. Auto-focus the Cancel button by default. Prevents accidental data loss.
- **Font tokens (`--font-display`, `--font-body`, `--font-mono`) are NOT overridden per theme.** Typography is considered part of the visual identity, not theme-specific. This simplifies the token system and avoids font-loading issues.
- **PWA manifest `theme_color` and `background_color` remain static (Neon Arcade defaults).** The runtime theme is independent of the PWA install splash. The manifest stays `#16213e` / `#1a1a2e` regardless of the player's selected theme. Avoids dynamic manifest generation complexity.

### Verification

1. `npm run build` completes with no errors
2. Switching themes in Settings applies immediately without page reload
3. Theme persists across page refreshes
4. All 4 themes render correctly on: MainMenu, Game board, StatisticsScreen, AchievementsScreen, SettingsScreen, HelpScreen, GameOver overlay, LevelTransition overlay, Pause overlay, ReadyOverlay
5. No hardcoded colors remain in any component CSS — run: `grep -rE '#[0-9a-fA-F]{3,8}\b' src/components --include='*.module.css' --exclude='index.module.css'`. Expected output: zero results (or only false positives in comments).
6. Snake, food variants, obstacles, and portals remain visually distinguishable in all themes
7. High Contrast theme meets WCAG AA contrast minimums (4.5:1 for text, 3:1 for large text)
8. Sound toggle works and persists
9. Reset Progress clears `snakeLastUnlockedLevel` and menu reflects level 1
10. Reset Statistics clears stats keys
11. Reset Achievements clears `snakeAchievements`
12. Confirmation prompts appear before destructive actions
13. `npm run lint` passes

---

## Phase 4: Improved Pause Experience

### Goal

Redesign the pause overlay to include Resume, Restart Level, and Return to Menu options. Add engine support for restarting the current level.

### Files

| Action | File | Description |
|--------|------|-------------|
| Modify | `src/game/Engine.ts` | Add `restartLevel()` method: stops the loop, then calls `startAtLevel(this.state.level)`. No new action type needed — reuses `START_AT_LEVEL`. |
| Modify | `src/hooks/useGame.ts` | Expose `restartLevel` callback wrapping `engine.restartLevel()`. |
| New | `src/components/PauseMenu.tsx` | Pause overlay component: "Paused" heading, "Resume" button (primary, `autoFocus`), "Restart Level" button (secondary), "Return to Menu" button (muted). Hint text: "Press Space to resume". Accepts `onResume`, `onRestartLevel`, `onReturnToMenu` callbacks. |
| New | `src/components/PauseMenu.module.css` | Pause overlay styling |
| Modify | `src/components/Game.tsx` | Replace the inline pause overlay with `<PauseMenu>`. Wire `onReturnToMenu` to call `engine.destroy()` then invoke the `onNavigateToMenu` prop. Wire `onRestartLevel` to the new `restartLevel` callback. |
| Modify | `src/platform/keyboard.ts` | Update `SPACE` handler for `paused` status — Space currently resumes, which should remain the default. No change needed for pause→menu since that's button-only (prevents accidental menu navigation via keyboard). |

### Key Decisions

- **No new `GameAction` type.** `restartLevel()` chains existing methods rather than adding a reducer case. Keeps the state machine unchanged.
- **Restart Level is intended to retry the current level without invalidating overall run progress.** Score remains unchanged (it accumulates across levels). Current-level food progress resets (foodEaten returns to 0, food re-spawns, snake reverts to initial length). The player is retrying the level, not restarting the entire run. This is an explicit game rule, not an implementation accident.
- **Space bar resumes (not restarts or exits).** Keyboard conventions stay consistent: Space resumes from pause. Restart Level and Return to Menu are explicit button actions only, preventing accidental data loss from mis-keyed Space presses during pause.
- **Return to Menu destroys the Engine.** When returning to menu from pause, `Engine.destroy()` is called. The Game component unmounts (App sets screen to `'menu'`). A fresh Engine is created when the player starts a new game. This ensures clean state. The `useGame` hook uses a `useRef` with a lazy initializer (`useRef(new Engine())`), so each new `Game` component mount creates a fresh Engine. The previous component's `useEffect` cleanup calls `engine.destroy()`, which removes all listeners. No state leaks across Menu → Game → Pause → Menu → Game navigation cycles.
- **Pause overlay gets its own component.** Extracting `PauseMenu` keeps `Game.tsx` focused on orchestration and follows the existing pattern of separate overlay components (GameOver, LevelTransition).

### Verification

1. `npm run build` completes with no errors
2. Pressing pause during gameplay shows: Resume, Restart Level, Return to Menu
3. Resume works identically to current behavior
4. After `restartLevel()`: `state.score` equals pre-restart score, `state.foodEaten` equals 0, `state.snake` length equals initial snake length, `state.food.position` is a valid spawn position (not overlapping snake/obstacle), `state.level` is unchanged, `state.direction` is preserved
5. Return to Menu navigates to main menu; Engine is destroyed
6. Starting a new game from menu after returning works correctly (clean state)
7. Space bar during pause resumes (unchanged behavior)
8. `npm run lint` passes
9. Existing Engine tests still pass (new method is additive)

---

## Phase 5: Integration, Testing & Documentation

### Goal

Write tests for new components and integration flows. Update all project documentation. Verify end-to-end navigation works on keyboard and touch.

### Files

| Action | File | Description |
|--------|------|-------------|
| New | `src/components/__tests__/MainMenu.test.tsx` | Tests: renders all menu options, Continue disabled when no progress, Continue shows correct level/high-score, navigation callbacks fire on click |
| New | `src/components/__tests__/PauseMenu.test.tsx` | Tests: renders Resume/Restart/Return buttons, callbacks fire, autoFocus on Resume |
| New | `src/components/__tests__/SettingsScreen.test.tsx` | Tests: renders all sections, theme dropdown changes theme, sound toggle works, reset confirmation flow, back button navigates |
| New | `src/components/__tests__/HelpScreen.test.tsx` | Tests: renders all mechanics sections (controls, food types, special mechanics, progression, achievements), back button navigates |
| New | `src/components/__tests__/ReadyOverlay.test.tsx` | Tests: renders level name/description/objective, Start button is auto-focused, onStart callback fires on click, onStart callback fires on Space keypress |
| New | `src/components/__tests__/StatisticsScreen.test.tsx` | Tests: renders stats after `loadStats()` returns values, reflects updated stats on re-render, back button navigates |
| New | `src/game/__tests__/profile.test.ts` | Tests: `loadGameProfile()` returns correct shape with all fields, handles corrupted localStorage gracefully, integrates with existing persistence functions |
| Modify | `src/components/__tests__/Game.test.tsx` | Add tests: Game shows ReadyOverlay when `startLevel` prop provided, ReadyOverlay confirms level metadata, Start triggers game start, Game calls onNavigateToMenu on pause→return, Restart Level preserves score at current level. Add stress test: mount/unmount Game component 10 times rapidly, assert no duplicate event listeners on `window` and no console errors triggered. |
| Modify | `src/game/__tests__/Engine.test.ts` | Add tests: `restartLevel()` resets snake/food/foodEaten at current level, preserves score and direction, starts loop |
| Modify | `SPEC.md` | Add Section 19: Navigation & Screens (Main Menu, Statistics Screen, Achievements Screen, Settings Screen, Help / How To Play Screen). Update Section 7.2 (State Descriptions) for improved pause and Ready Overlay flow. Update Section 10 (UI Components) with new components. Update Section 14 (Styling) for themes. |
| Modify | `ARCHITECTURE.md` | Add screen components to project structure. Document navigation pattern (state-based, no router). Add theme system to Styling Conventions section. Update component architecture diagram. |
| Modify | `docs/ROADMAP.md` | Move Milestone 12 from "Not Started" to "Completed". Update Current Progress section. |
| Modify | `docs/PROJECT_STATE.md` | Update version to 0.12.0. Update milestone status to Complete. Add completed features list for M12. Update current priorities to point to Milestone 13. |
| Modify | `package.json` | Bump version to `0.12.0`. |

### Manual Verification Checklist

All items below except those marked [HUMAN] are machine-verifiable via automated tests. [HUMAN] items require a physical device or emulator and are deferred to manual QA.

- [ ] [MACHINE] Full navigation loop: Menu → Continue → Ready Overlay → Start → Play → Pause → Return to Menu → Menu
- [ ] [MACHINE] Full navigation loop: Menu → New Game → Ready Overlay → Start → Play → Die → Game Over → Continue → Ready Overlay (last unlocked level) → Start → Play
- [ ] [MACHINE] Game Over → New Game → Ready Overlay (level 1) → Start → Play (fresh run, score 0)
- [ ] [MACHINE] Game Over → Return To Menu → Menu (Engine destroyed, fresh Engine on next game)
- [ ] [MACHINE] Full navigation loop: Menu → Statistics → Back → Menu
- [ ] [MACHINE] Full navigation loop: Menu → Achievements → Back → Menu
- [ ] [MACHINE] Full navigation loop: Menu → Settings → change theme → Back → Menu → verify theme persists
- [ ] [MACHINE] Full navigation loop: Menu → Settings → Reset Progress (confirmed) → Back → Menu → Continue is hidden
- [ ] [MACHINE] Full navigation loop: Menu → Help → Back → Menu
- [ ] [MACHINE] Keyboard-only run: all navigation via Tab + Enter, Space to resume, Enter to confirm reset dialogs, Escape to cancel
- [ ] [HUMAN] Mobile run: all navigation via tap, swipe controls work in game
- [ ] [HUMAN] PWA install flow on a physical device; verify splash screen colors match manifest (Neon Arcade defaults, static)
- [ ] [MACHINE] Theme persists across page refresh and new game sessions
- [ ] [MACHINE] Sound toggle persists across page refresh

### Verification

1. All new tests pass: `npm test`
2. All existing 356 tests still pass (no regressions)
3. `npm run build` completes with no errors
4. `npm run lint` passes with no new warnings
5. All [MACHINE] manual verification checklist items pass; [HUMAN] items deferred to manual QA

---

## Risks & Assumptions

### Risks

1. **Theme CSS overrides may break contrast.** Some token overrides could produce low-contrast combinations on certain screen elements. Mitigation: verify all screens in all themes during Phase 3 verification using the explicit `grep` audit command.
2. **Engine destroy/create cycle could leak listeners.** If `useGame` cleanup doesn't fully tear down the Engine before a new one is created, duplicate keyboard/touch listeners could fire. Mitigation: `useGame` already calls `engine.destroy()` in its cleanup effect. A stress test (10 rapid mount/unmount cycles) in Phase 5 explicitly verifies no listener leaks.
3. **Ready Overlay metadata mismatch.** If the `startLevel` prop doesn't match an existing level definition, the Ready Overlay could show empty or incorrect level metadata. Mitigation: `getLevelDefinition()` already has a try/catch and falls back to a default level definition. The Ready Overlay renders nothing if metadata is missing and degrades gracefully to a generic "Start Level N" display.
4. **localStorage corruption in MainMenu.** If `snakeLastUnlockedLevel` is corrupted, MainMenu's Continue preview may show garbage. Mitigation: `loadGameProfile()` wraps all individual loader functions and each has a try/catch defaulting to safe values (level 1, score 0, empty stats/achievements).
5. **Theme flash on slow connections.** If `main.tsx` executes before the CSSOM is ready, the default theme may flash. Mitigation: `document.documentElement.dataset.theme` is set in a synchronous script block in `main.tsx` before React mounts. For the current PWA-first deployment, this is sufficient.

### Assumptions

1. Statistics and achievements data can be read via `loadGameProfile()` without an Engine instance. (True: `loadStats()` and `loadAchievements()` are pure functions.)
2. The existing CSS variable token system covers all currently hardcoded colors. (Will verify via explicit `grep` audit in Phase 3.)
3. `engine.destroy()` followed by component unmount is sufficient cleanup for navigation away from Game. (Verified by existing Engine tests and the new stress test in Phase 5.)
4. The existing idle overlay can be replaced entirely by the Ready Overlay. No other code depends on the idle overlay's Statistics/Achievements panels. (Verified: these panels are purely presentational; removing the idle overlay is safe.)

---

## Out of Scope

The following are **not** part of this milestone and should not be implemented:

- Onboarding, tutorials, gameplay guide, mechanics guide (Milestone 13)
- Food collection effects, death effects, level completion effects, achievement popups (Milestone 14)
- HUD animation improvements, menu animation improvements (Milestone 14)
- Audio expansion (menu sounds, achievement sounds) — Milestone 14
- Background music (Milestone 14)
- Accessibility audit, color-blind review, reduced motion support (Milestone 15)
- UI testing infrastructure (Milestone 15)
- Capacitor mobile packaging (Milestone 16)
- Tauri desktop packaging (Milestone 17)
- New gameplay mechanics, levels, food types, obstacles
- Cloud saves, leaderboards, daily challenges (Future Opportunities)
- Global state management library (Redux, Zustand, etc.) — the existing Engine subscription pattern is sufficient
- React Router or any routing library — state-based navigation is sufficient for 6 screens
- "Settings" option inside the pause menu (only Resume, Restart Level, Return to Menu per ROADMAP.md)

---

## Milestone Definition of Done

- [ ] Phase 1 complete: Navigation infrastructure works, MainMenu shell renders
- [ ] Phase 2 complete: All 6 screens accessible, Continue/New Game launch gameplay
- [ ] Phase 3 complete: Settings fully functional, all 4 themes render correctly on every screen
- [ ] Phase 4 complete: Pause menu has Resume, Restart Level, and Return to Menu
- [ ] Phase 5 complete: All tests pass, documentation updated
- [ ] `npm run build` completes with no errors
- [ ] `npm run lint` passes with no new warnings
- [ ] All existing 356 tests still pass (zero regressions)
- [ ] New tests added for all new components and engine changes
- [ ] SPEC.md updated with new screens, themes, and navigation behavior
- [ ] ARCHITECTURE.md updated with new components and theme system
- [ ] ROADMAP.md updated — Milestone 12 moved to Completed
- [ ] PROJECT_STATE.md updated — version bumped to 0.12.0, priorities updated
- [ ] `package.json` version bumped to `0.12.0`
- [ ] All [MACHINE] manual verification checklist items pass; [HUMAN] items deferred to manual QA
- [ ] No known navigation dead ends (every screen has a path back to menu or game)
- [ ] No hardcoded color values remain in component CSS (verified via `grep -rE '#[0-9a-fA-F]{3,8}\b' src/components --include='*.module.css' --exclude='index.module.css'`)
- [ ] Players always know what to do next (ROADMAP success criteria)
- [ ] Navigation feels intentional (ROADMAP success criteria)
- [ ] Settings feel complete (ROADMAP success criteria)
- [ ] Theme selection works across the entire application (ROADMAP success criteria)
- [ ] Game feels complete (ROADMAP success criteria)

---

## Complexity Review

- **No new dependencies.** Screen navigation uses `useState` in App.tsx. Themes use CSS custom properties. No new npm packages.
- **Engine changes are minimal.** One new method (`restartLevel`) that chains existing methods. No new action types, no state machine changes.
- **Theme system is pure CSS.** No JavaScript theme logic in components. The `useTheme` hook is a thin wrapper around `localStorage` + `dataset`.
- **Persistence is centralized.** `src/game/profile.ts` provides a single `loadGameProfile()` function consumed by all screens. No screen reads or writes localStorage directly. Future storage key migrations only touch one file.
- **Single startup flow.** The Ready Overlay is the only path from menu to gameplay. No dual paths, no fallback behavior, no idle overlay. Simple to test, simple to maintain.
- **New components follow existing patterns.** Screen components follow the same CSS Modules + neon aesthetic as existing overlays.
- **No speculative architecture.** The screen navigation is intentionally simple (a `switch` or object map in App.tsx) rather than a generic router abstraction. It can be replaced with React Router later if needed, but that migration is not planned.
