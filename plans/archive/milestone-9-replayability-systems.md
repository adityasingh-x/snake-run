# Active Plan — Milestone 9: Replayability Systems

## Goal

Encourage repeat play through endless mode, statistics, and achievements.

---

## Scope Overview

Three independent feature tracks, each a separate phase:

| Phase | Feature | Effort |
|-------|---------|--------|
| 1 | Endless Mode | Medium |
| 2 | Statistics | Small |
| 3 | Achievements | Medium |

Phases are ordered so each builds on the prior one where relevant (e.g., statistics storage feeds achievement detection).

---

## Out of Scope

- Leaderboards or online features
- Persistent run history (only aggregate stats)
- Achievement notifications with animations/toasts (screen-reader announcement only, plus static display on overlays)
- Expanding beyond the 3 example achievements listed in ROADMAP
- Any UI beyond idle screen + game over/win screen for stats/achievements display
- Procedural level generation for endless mode (reuses level 10 layout)
- Music or new sound effects for achievements
- Difficulty scaling in endless mode (fixed 100ms speed)

---

## Phase 1 — Endless Mode

### Summary
After winning level 10, the player can choose "Endless Mode" — indefinite play on level 10's layout at 100ms speed with no level transitions or win condition.

### GameState changes (`src/game/types.ts`)
- Add `isEndless: boolean` field to `GameState` (default `false`)
- Add `START_ENDLESS_GAME` action to `GameAction` union

### Reducer changes (`src/game/state.ts`)
- Handle `START_ENDLESS_GAME`: set `isEndless: true`, set level to `LEVEL_COUNT` (10), reset snake to INITIAL_SNAKE, reset direction to RIGHT, reset foodEaten, spawn new food, status = `playing`, keep score, obstacles = level 10 layout. Note: the only valid call site is the win overlay (post-`status === 'won'`)
- In `MOVE_SNAKE`: when `isEndless` is true, skip the `shouldLevelUp` check entirely — never transition to `levelComplete` or `won`

### Engine changes (`src/game/Engine.ts`)
- Add `startEndless()` method that dispatches `START_ENDLESS_GAME` and starts loop

### Hook changes (`src/hooks/useGame.ts`)
- Add `startEndlessGame` callback that calls `engine.startEndless()`

### Component changes

#### `src/components/Game.tsx`
- Wire `startEndlessGame` to a new `handleStartEndless` callback
- Pass `isEndless={state.isEndless}` to `ScoreBoard`
- On `won` overlay: add `onStartEndless` prop to `GameOver`
- Pass `handleStartEndless` as `onStartEndless` to `GameOver`
- No changes needed to `useKeyboard` / `useTouch` — endless mode is a `playing` state, existing handlers are correct

#### `src/components/ScoreBoard.tsx` + `src/types/components.ts`
- Add `isEndless?: boolean` to `ScoreBoardProps`
- When `isEndless`: show "Endless" instead of "Level: N — Name", hide food progress meter/bar

#### `src/components/GameOver.tsx` + `src/types/components.ts`
- Add `isEndless?: boolean` and `onStartEndless?: () => void` to `GameOverProps`
- On win variant: add "Endless Mode" button (primary, `autoFocus`) above "Continue from Level N" / "New Game"
- On win variant hint text: mention Endless Mode ("Press Space for new game, or choose Endless Mode")
- When `isEndless` is true: score text reads "Endless Score: N" instead of "Your score: N"

### Verification
- Complete level 10 → win overlay shows "Endless Mode" button
- Click "Endless Mode" → game plays indefinitely, no level-ups
- Speed stays at 100ms, obstacles are level 10 layout
- ScoreBoard shows "Endless" and score only (no food meter)
- Game over in endless mode → shows "Endless Score" in overlay
- Endless mode is only reachable via the win overlay; no dev shortcut is provided (the dev-level select continues to work for campaign levels only)
- `npm run build` succeeds
- `npm test` all pass (existing + new tests)
- `npm run lint` passes

### New tests (`src/game/__tests__/state.test.ts` additions)
- `START_ENDLESS_GAME` sets `isEndless: true` and status to `playing`
- `MOVE_SNAKE` in endless mode never triggers `levelComplete` or `won` even after many food
- `MOVE_SNAKE` in endless mode still triggers collision/gameover

### New tests (`src/game/__tests__/Engine.test.ts` additions)
- `startEndless()` dispatches correctly and starts loop
- After 50 `MOVE_SNAKE` dispatches in endless mode, status remains `playing` and snake position has changed each time (validates indefinite play)

### New tests (`src/components/__tests__/GameOver.test.tsx` additions)
- Win variant shows "Endless Mode" button
- "Endless Mode" button triggers `onStartEndless` callback
- Endless game over shows "Endless Score" text

---

## Phase 2 — Statistics

### Summary
Track aggregate player statistics across all runs, displayed on the idle screen and game over/win screens.

### Statistics tracked
| Stat | Storage Key | Type | Source |
|------|-------------|------|--------|
| Games Played | `snakeStatsGamesPlayed` | number | localStorage |
| Total Food Eaten | `snakeStatsTotalFood` | number | localStorage |
| Highest Score | `snakeHighScore` (reuse existing) | number | `state.highScore` from engine |
| Best Level | `snakeStatsBestLevel` | number | localStorage |

### New file: `src/game/statistics.ts`
- `loadStats(): Stats` — loads from localStorage, returns defaults (0, 0, 0, 1)
- `saveStats(stats: Stats): void` — saves to localStorage
- `incrementGamesPlayed(): void` — load, increment, save
- `incrementTotalFood(count: number): void` — load, add count, save
- `updateBestLevel(level: number): void` — load, set if higher, save

### Engine integration (`src/game/Engine.ts`)
- Add `getStats(): Stats` public method that calls `loadStats()` and merges in `this.state.highScore`
- Add `private statsCache: Stats` field, initialized empty; written to localStorage on game over / win / pause (avoids per-food writes)
- In `dispatch()`:
    - On `START_GAME` / `RESET` / `START_ENDLESS_GAME` actions → increment `gamesPlayed` on the cache
    - When score increases (food eaten): compute `(newScore - prevScore) / POINTS_PER_FOOD` and add to `totalFood` on the cache
    - When level changes to a higher value → update `bestLevel` on the cache
    - On `gameOver` / `won` / `pause` → flush `statsCache` to localStorage
- The `useGame` hook calls `engine.getStats()` on mount and after each state change to keep UI in sync

### New component: `src/components/Statistics.tsx`
- Props: `gamesPlayed`, `totalFood`, `bestLevel`, `highScore`
- Renders a compact stats panel with labels and values
- Uses arcade-style CSS (follows existing ScoreBoard/overlay patterns)

### New file: `src/components/Statistics.module.css`
- Styles for the statistics panel

### Component changes

#### `src/components/Game.tsx`
- Use `engine.getStats()` (exposed via `useGame().stats`) to read stats — avoids components reading localStorage directly
- Show `<Statistics>` on idle overlay (below Start button, above controls hint)
- Show `<Statistics>` on game over / win overlay

#### `src/components/GameOver.tsx`
- Accept optional `stats` prop and render `<Statistics>` inline on game over / win

### Verification
- Start a game, eat food, game over → games played +1, total food updated
- Complete multiple runs → games played accumulates correctly
- Reach level 5, then die → best level recorded as 5
- Idle screen shows statistics panel
- Game over screen shows statistics summary
- `npm run build` succeeds
- `npm test` all pass
- `npm run lint` passes

### New tests (`src/game/__tests__/statistics.test.ts`)
- `loadStats` returns defaults when empty
- `incrementGamesPlayed` increments and persists
- `incrementTotalFood` accumulates correctly
- `updateBestLevel` only saves if higher

### New tests (`src/components/__tests__/Statistics.test.tsx`)
- Renders all four stat labels and values

---

## Phase 3 — Achievements

### Summary
Three achievements that unlock on specific conditions. Unlocked achievements persist in localStorage and display on idle and game over screens. Screen reader announces new unlocks.

### Achievement definitions

| ID | Name | Condition |
|----|------|-----------|
| `beat_game` | Snake Master | Complete level 10 (status becomes `won`) |
| `score_500` | High Scorer | Reach score >= 500 in a single run |
| `no_pause` | Marathon Run | Complete game (win) without ever pausing |

### Architecture
Achievement detection lives in the Engine, using callbacks (consistent with existing `onEat`/`onGameOver`/`onWin` pattern). The Engine fires detection after state update but before notifying subscribers. The `useGame` hook reads achievements from storage and provides them to React.

### New file: `src/game/achievements.ts`
- `Achievement` type with `id`, `name`, `description`, `unlocked` fields
- `ACHIEVEMENTS: Achievement[]` — the three definitions above (always `unlocked: false` initially)
- `loadAchievements(): Achievement[]` — merges persisted unlock state into definitions
- `saveAchievement(id: string): void` — persists a single unlock
- `checkAchievements(state: GameState, prevState: GameState, wasPaused: boolean): string[]` — returns IDs of newly unlocked achievements

Detection logic in `checkAchievements`:
- `beat_game`: `state.status === 'won' && prevState.status !== 'won'`
- `score_500`: `state.score >= 500 && prevState.score < 500`
- `no_pause`: `state.status === 'won' && !wasPaused`

The `wasPaused` flag is tracked in the Engine (private boolean, reset on `start()`/`reset()`/`startEndless()`, set to true on `pause()`).

### Engine changes (`src/game/Engine.ts`)
- Add `private wasPaused: boolean = false` field. This lives in the Engine rather than `GameState` because it is an Engine-private tracker never read by the UI or the reducer. The Engine owns the flag's mutation and passes it to `checkAchievements`.
- In `pause()`: set `wasPaused = true`
- In `start()`/`reset()`/`startEndless()`: reset `wasPaused = false`
- In `dispatch()`: between the `gameReducer` call and the `this.listeners.forEach(...)` call, call `checkAchievements(prevState, this.state, this.wasPaused)`, save any newly unlocked achievements to localStorage, and fire `onAchievementUnlock?.(achievementId)` callback for each. This order ensures: achievements are persisted before listeners (components) re-render, and the callback fires after persistence is durable.
- Add `onAchievementUnlock?: (id: string) => void` callback property

### Hook changes (`src/hooks/useGame.ts`)
- Add `achievements` state (loaded from `loadAchievements()`)
- Wire `onAchievementUnlock` to reload achievements after unlock
- Expose an `announceAchievement` callback that writes "Achievement unlocked: {name}" to the existing `announceRef` (re-uses `Game.tsx`'s accessibility live region pattern)
- Return `achievements` array and `announceAchievement`

### Component changes

#### `src/components/Game.tsx`
- Pass `achievements` to idle overlay and game over overlay
- Announce new achievement via screen reader region when unlocked

#### `src/components/GameOver.tsx`
- Accept optional `achievements: Achievement[]` prop and optional `newAchievementIds: string[]` prop (IDs unlocked in the just-finished run)
- Show "Achievements Unlocked" section if any unlocked achievements exist
- Show all unlocked achievement names, with a visual marker (e.g., "NEW" badge or accent color) on those whose IDs appear in `newAchievementIds`
- This gives the player a sense of progression without requiring a secondary state container for "newly unlocked this session"

#### New component: `src/components/Achievements.tsx`
- Props: `achievements: Achievement[]`
- Renders achievement list (locked shown as ??? or grayed, unlocked shown with name)
- Compact layout, follows arcade style

### New file: `src/components/Achievements.module.css`
- Styles for achievement badges/list

### Verification
- Win the game → "Snake Master" achievement unlocks and persists
- Score 500 → "High Scorer" unlocks during gameplay
- Win without pausing → "Marathon Run" unlocks
- Achievements persist across page reloads
- Idle screen shows unlock status
- Game over/win screens show newly unlocked achievements
- Screen reader announces unlock
- `npm run build` succeeds
- `npm test` all pass
- `npm run lint` passes

### New tests (`src/game/__tests__/achievements.test.ts`)
- `checkAchievements` detects `beat_game` on win
- `checkAchievements` detects `score_500` when crossing threshold
- `checkAchievements` detects `no_pause` when win without pause
- `checkAchievements` does NOT award `no_pause` when `wasPaused=true`
- `saveAchievement` persists correctly
- `loadAchievements` merges persisted state
- Achievement not re-awarded if already unlocked

### New tests (`src/components/__tests__/Achievements.test.tsx`)
- Renders all three achievements with correct locked/unlocked state
- Unlocked achievements show their name; locked achievements show placeholder
- Renders the "NEW" badge on achievements whose IDs are in `newAchievementIds`

---

## Risks & Assumptions

1. **Endless mode game-over experience**: The game over screen in endless mode shows the same buttons as normal game over (New Game, Continue from Level N). This is acceptable since the player just played a non-campaign run. If feedback indicates confusion, a future iteration could add a "Play Endless Again" button.

2. **Statistics tracking granularity**: `totalFoodEaten` increments on each eat event. If the game is reset before eating any food, no food is added. This is correct behavior.

3. **Achievement detection timing**: Achievements are checked in the Engine's `dispatch()` after state update but before subscriber notification. This avoids race conditions with React re-renders.

4. **No pause achievement edge case**: If a player pauses during `levelComplete` status (between levels), that counts as pausing for the "Marathon Run" achievement. This is intentional — a true no-pause run means never pressing Pause/Space at any point.

5. **CSS Modules convention**: All new components use CSS Modules (`.module.css`), following existing convention. Color tokens from `src/index.css` `:root` are reused — no new tokens needed.

6. **localStorage write amplification acceptance**: Stats writes are batched (in-memory cache flushed on game over / win / pause) rather than per-food. Achievement writes are infrequent (at most 3 per player lifetime). The remaining localStorage writes (high score, level progress) are unchanged from current behavior and are not a measurable performance concern at this scale.

7. **`isEndless` default in test helpers**: The `makeState` helper in `src/game/__tests__/state.test.ts` should be updated to include `isEndless: false` in its default spread to match the new `GameState` contract. Tests that construct partial states will need this to avoid `undefined` vs `false` confusion in conditional checks.

---

## Files Expected to Change

### Phase 1
| File | Change |
|------|--------|
| `src/game/types.ts` | Add `isEndless`, `START_ENDLESS_GAME` |
| `src/game/state.ts` | Handle `START_ENDLESS_GAME`, skip level-up in endless |
| `src/game/Engine.ts` | Add `startEndless()` method |
| `src/hooks/useGame.ts` | Expose `startEndlessGame` |
| `src/components/Game.tsx` | Wire endless mode button, pass `isEndless` |
| `src/components/ScoreBoard.tsx` | Handle `isEndless` display |
| `src/components/GameOver.tsx` | Win overlay "Endless Mode" button, endless game over text |
| `src/types/components.ts` | Add `isEndless`, `onStartEndless` props |
| `src/game/__tests__/state.test.ts` | Endless mode state transitions |
| `src/game/__tests__/Engine.test.ts` | `startEndless()` method |
| `src/components/__tests__/GameOver.test.tsx` | Endless mode UI |

### Phase 2
| File | Change |
|------|--------|
| `src/game/statistics.ts` | **New** — stats load/save/increment |
| `src/game/Engine.ts` | Integrate stat tracking in `dispatch()` |
| `src/components/Statistics.tsx` | **New** — stats display |
| `src/components/Statistics.module.css` | **New** — stats styles |
| `src/components/Game.tsx` | Load and display stats |
| `src/components/GameOver.tsx` | Optional stats display |
| `src/game/__tests__/statistics.test.ts` | **New** — stats tests |
| `src/components/__tests__/Statistics.test.tsx` | **New** — component tests |

### Phase 3
| File | Change |
|------|--------|
| `src/game/achievements.ts` | **New** — achievement definitions, detection, persistence |
| `src/game/Engine.ts` | Add `wasPaused` tracking, `onAchievementUnlock` callback |
| `src/hooks/useGame.ts` | Achievement state, wire callback |
| `src/components/Achievements.tsx` | **New** — achievement display |
| `src/components/Achievements.module.css` | **New** — achievement styles |
| `src/components/Game.tsx` | Display achievements on idle/overlay, screen reader announce |
| `src/components/GameOver.tsx` | Display achievements on game over / win |
| `src/game/__tests__/achievements.test.ts` | **New** — achievement tests |
| `src/components/__tests__/Achievements.test.tsx` | **New** — component tests |

### Shared (all phases)
| File | Change |
|------|--------|
| `src/game/index.ts` | Export new modules. Phase 1: `isEndless` type, `START_ENDLESS_GAME` action. Phase 2: `Stats` type, `loadStats`, `saveStats`, `getStats`. Phase 3: `Achievement` type, `ACHIEVEMENTS`, `loadAchievements`, `saveAchievement` (keep `checkAchievements` internal to Engine only)
| `docs/ROADMAP.md` | Mark M9 complete after all phases |
| `docs/PROJECT_STATE.md` | Update version, status, completed features |
| `SPEC.md` | Update with endless mode, statistics, achievements |

---

## Milestone Definition of Done

- [ ] Endless Mode playable from win screen with indefinite play, no level-ups
- [ ] Statistics tracking (games played, total food, best level) persisted and displayed
- [ ] All 3 achievements detectable, persistable, and displayed
- [ ] Idle screen shows statistics and achievements
- [ ] Game Over / Win screens show statistics and newly unlocked achievements
- [ ] Screen reader announces achievement unlocks
- [ ] All existing 178 tests still pass
- [ ] New tests added for all new modules and components
- [ ] `npm run build` completes with no errors
- [ ] `npm run lint` passes with no new warnings
- [ ] SPEC.md, ARCHITECTURE.md, ROADMAP.md, PROJECT_STATE.md updated
- [ ] `package.json` version bumped to `0.9.0`

---

## Documentation Update Targets

Each phase must update documentation to keep SPEC, ARCHITECTURE, ROADMAP, and PROJECT_STATE consistent.

### Phase 1 — Endless Mode
- **SPEC.md:** §6 (Scoring and Levels — endless mode variant), §7 (State Machine — `START_ENDLESS_GAME` action), §10 (UI Components — ScoreBoard endless display)
- **ARCHITECTURE.md:** State Shape (add `isEndless: boolean`), Project Structure (no new files in Phase 1)
- **ROADMAP.md:** Mark Phase 1 task complete under M9 sub-items
- **PROJECT_STATE.md:** Update Phase 1 completion status

### Phase 2 — Statistics
- **SPEC.md:** §12 (Persistence — new localStorage keys: `snakeStatsGamesPlayed`, `snakeStatsTotalFood`, `snakeStatsBestLevel`), §10 (UI Components — `Statistics` panel)
- **ARCHITECTURE.md:** Project Structure (add `statistics.ts`, `Statistics.tsx`, `Statistics.module.css`), Testing (add `statistics.test.ts`, `Statistics.test.tsx`)
- **ROADMAP.md:** Mark Phase 2 task complete under M9 sub-items
- **PROJECT_STATE.md:** Update Phase 2 completion status

### Phase 3 — Achievements
- **SPEC.md:** §12 (Persistence — new `snakeAchievements` localStorage key), §7 (State Machine — achievement detection during state transitions), §10 (UI Components — `Achievements` panel)
- **ARCHITECTURE.md:** Project Structure (add `achievements.ts`, `Achievements.tsx`, `Achievements.module.css`), Testing (add `achievements.test.ts`, `Achievements.test.tsx`)
- **ROADMAP.md:** Mark Phase 3 task complete
- **PROJECT_STATE.md:** Update Phase 3 completion status

### After All Phases — Final Documentation Pass
- **ROADMAP.md:** Move M9 to Completed; update Current Progress to reflect next milestone (M10)
- **PROJECT_STATE.md:** Bump version to v0.9.0, update Current Status, add M9 to Completed Features, mark Next Milestone as M10 (Gameplay Expansion)
- **SPEC.md:** Final review for consistency across all three features
- **ARCHITECTURE.md:** Final review of State Shape, Project Structure, and Testing sections

---

## Simplification Review

- **No toast/popup for achievements** — static display on overlays is sufficient; avoids animation complexity
- **No new sound effects** — achievement unlock announced via screen reader only; keeps audio system simple
- **Endless mode reuses level 10** — no procedural generation needed; aligns with "ship the game" philosophy
- **Only 3 achievements** — matches ROADMAP examples exactly; system is extensible later
- **No separate stats screen** — idle screen gets a compact panel; avoids a new navigation surface
- **No achievement progress tracking** — achievements are binary (locked/unlocked); no "47/50 food" progress bars
- **Phase independence respected** — each phase can be shipped independently if needed
