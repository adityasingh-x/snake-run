# Snake Run — End-to-End Specification

Complete behavioral and technical specification of the game as currently implemented. Intended as a handoff document for AI-assisted feature planning.

---

## 1. Game Overview

A classic single-player Snake Run. The player controls a snake on a 20x20 grid. The snake moves continuously in one of four directions. Eating food grows the snake and earns points. The game ends on collision with a wall, the snake's own body, or an obstacle. There are 10 levels with increasing speed and obstacles. Completing level 10 wins the game.

---

## 2. Grid and Rendering

- **Grid dimensions:** 20 columns x 20 rows (0-indexed: x in [0,19], y in [0,19])
- **Cell size:** CSS-only responsive sizing using `1fr` units
- **Total board:** responsive, fills available viewport (max 400px)
- **Layout:** CSS Grid with `gridTemplateColumns: repeat(20, 1fr)`
- **Cell rendering:** 400 individual `<div>` elements, one per cell, each with `role="gridcell"` and contextual `aria-label`
- **Board wrapper:** `position: relative` container with `aspect-ratio: 1/1` and `width: min(90vw, 70dvh, 400px)` for responsive sizing
- **Note:** `CELL_SIZE` constant is retained for reference but is no longer used for layout

---

## 3. Game Objects

### 3.1 Snake
- **Initial state:** 3 segments at `[{x:10,y:10}, {x:9,y:10}, {x:8,y:10}]`, facing RIGHT
- **Head:** `{x:10,y:10}`, bright green (`--color-accent` / #22c55e) with glow (`box-shadow: 0 0 12px`)
- **Body:** darker green (`--color-accent-deep` / #16a34a), 1px border-radius
- **Growth:** when food is eaten, new head is prepended and tail is NOT removed (net +1 segment)
- **Movement:** when no food eaten, new head is prepended and tail is removed (net 0 change)
- **Position tracking:** array of `{x, y}` positions; `snake[0]` is always the head

### 3.2 Food
- **Appearance:** red (`--color-danger` / #ef4444), circular (`border-radius: 50%`), pulsing animation (scale 0.8 to 1.0 over 1s)
- **Spawning:** random position within grid bounds, excluding all snake segments, obstacles, and portal tiles
- **Algorithm:** generates random candidates, checks against a Set of occupied positions, max attempts to prevent infinite loop, falls back to snake head position if grid is completely full
- **Replacement:** new food spawns immediately when eaten
- **Food Types:**
  | Type | Spawn % | Points | Effect | Timer (ticks) | Shape | Color |
  |------|---------|--------|--------|---------------|-------|-------|
  | `normal` | 80% | +10 | Grow by 1 | ∞ (`-1`) | Circle, pulse 1s | `--color-danger` |
  | `gold` | 10% | +30 | Grow by 1 | 10 | Diamond (`rotate(45deg)`), pulse 0.5s | `--color-warning` |
  | `poison` | 5% | 0 | Shrink by 1 (floor at initial snake length) | ∞ (`-1`) | Square, static | `--color-food-poison` |
  | `slow` | 5% | +10 | Speed × 1.3 for 10 ticks | 8 | Triangle (`clip-path`), glow | `--color-food-slow` |
- **Timer behavior:** When a food's timer reaches 0, it is replaced by a new `normal` food immediately. Normal and poison food have no timer (`-1`) and persist until eaten.

### 3.3 Obstacles
- **Appearance:** indigo (`--color-obstacle` / #6366f1) with lighter border (`--color-obstacle-edge` / #818cf8) and glow (`box-shadow: 0 0 8px`)
- **Layout:** Each level has a predefined handcrafted obstacle layout defined in level metadata
- **No randomness:** Obstacle positions are authored, not generated randomly
- **Persistence:** Layout changes based on the level definition on each level-up; obstacles do NOT carry over between levels

---

## 4. Game Loop

- **Mechanism:** `requestAnimationFrame` with accumulator pattern (NOT setInterval)
- **Tick timing:** when accumulated time >= current speed, dispatch `MOVE_SNAKE` and reset accumulator
- **Speed per level:**
  - Level 1: 150ms
  - Level 2: 140ms
  - Level 3: 130ms
  - Level 4: 120ms
  - Level 5: 115ms
  - Level 6: 110ms
  - Level 7: 110ms
  - Level 8: 105ms
  - Level 9: 105ms
  - Level 10: 100ms
- **Cleanup:** `cancelAnimationFrame` on unmount or status change; accumulator and timestamp reset
- **Pause behavior:** loop stops when status is not `playing`; resumes from where it left off

---

## 5. Movement and Direction

### 5.1 Direction Changes
- Input is queued in `nextDirection`; applied on next `MOVE_SNAKE` tick
- **Opposite direction blocking:** cannot reverse into yourself (UP blocks DOWN, LEFT blocks RIGHT, etc.)
- Direction changes are debounced per tick; only the last queued direction is applied

### 5.2 Collision Detection (checked in order on each MOVE_SNAKE)
1. **Wrap-around:** If the current level has `wrapAround: true`, normalize head coordinates modulo grid size before collision checks. The snake exits one edge and appears on the opposite edge. If the resulting position collides with the snake's own body or an obstacle, game over applies.
2. **Portal teleport:** If the current level has `portals`, check if the (possibly wrapped) head position matches a portal tile. If so, teleport to the paired position. If the resulting position lands on the snake's own body, an obstacle, or outside the grid, game over applies.
3. **Wall collision:** new head position x < 0, x >= 20, y < 0, or y >= 20 (after wrap/portal)
4. **Self collision:** new head overlaps any snake segment EXCEPT the tail (tail moves away before head arrives)
5. **Obstacle collision:** new head position matches any obstacle position (Set-based O(1) lookup)
- Any collision (after wrap and portal processing) triggers game over

### 5.3 Collision Outcome
- Status changes to `gameover`
- High score is updated: `max(currentHighScore, currentScore)`
- High score is persisted to localStorage
- Collision sound plays
- **Note:** Eating poison food shrinks the snake by 1 segment (floored at initial length of 3). This is NOT a collision and does NOT trigger game over.

---

## 6. Scoring and Levels

### 6.1 Scoring
- **Points per normal food:** 10
- **Points per gold food:** 30
- **Points per slow food:** 10
- **Points per poison food:** 0
- Score only increases when normal, gold, or slow food is eaten
- Score does NOT decrease on any event

### 6.2 Level Progression

- **Food objective per level:**
  - Level 1: 10 food
  - Level 2: 12 food
  - Level 3: 14 food
  - Level 4: 16 food
  - Level 5: 18 food
  - Level 6: 20 food
  - Level 7: 22 food
  - Level 8: 24 food
  - Level 9: 26 food
  - Level 10: 30 food
- **Level-up trigger:** foodEaten >= foodRequired AND food was just eaten
- **Level-up behavior (two-step transition):**
  1. **Step 1 — Level Complete:** When food objective is reached (levels 1-9):
     - Status changes to `levelComplete`
     - Game loop freezes (board visible but snake does not move)
     - Snake keeps its grown position (NOT reset)
     - Score carries over
     - LevelTransition overlay appears showing completed level info and next level preview
     - Eat sound plays (for the food that triggered level-up)
  2. **Step 2 — Continue:** When player clicks Continue or presses Space:
     - `CONTINUE_GAME` action dispatched
     - Level incremented by 1
     - Snake reset to initial position `[{x:10,y:10}, {x:9,y:10}, {x:8,y:10}]`
     - Direction reset to RIGHT
     - New obstacles generated for next level
     - New food spawned
     - foodEaten reset to 0
     - Status changes to `playing`
     - Game loop resumes
     - Level-up sound plays
- **Level 10 completion:** Transitions directly to `won` (no levelComplete step)

### 6.3 Level Metadata

Each level is defined as a data-driven object with the following structure:

```ts
{
  id: number;        // 1-10
  name: string;      // 1-3 word label (e.g., "First Meal", "Final Run")
  description: string; // One-sentence flavor text
  foodRequired: number; // Food count threshold for level completion
  speed: number;       // Tick interval in milliseconds
  layout: Position[];   // Predefined obstacle positions for the level
  wrapAround?: boolean; // If true, snake exits one edge and appears on opposite edge (Level 5 only)
  portals?: [Position, Position][]; // Paired portal tiles; landing on one teleports to the other (Level 7 only)
}
```

Level metadata is displayed in:
- **ScoreBoard HUD:** Shows "Level: {id} — {name}" during gameplay
- **LevelTransition overlay:** Shows completed level name, next level name and description between levels

### 6.4 Win Condition

- When level `LEVEL_COUNT` food objective is reached (30 food eaten at level 10)
- Status changes to `won`
- High score saved
- Win overlay displayed: "You Win! You completed the game! Score: {score}"
- Level-up sound plays

### 6.5 Endless Mode

- Available from the win overlay after completing level 10
- Indefinite play on level 10's obstacle layout at 100ms speed
- No level transitions, no level-up checks, no win condition
- Score continues to accumulate normally (10 points per food)
- Game over on collision (wall, self, or obstacle)
- `isEndless` flag set to `true` in game state
- ScoreBoard displays "Endless" instead of level number/name, hides food progress meter
- Game over screen shows "Endless Score: {score}" when `isEndless` is true

### 6.6 Statistics

- Aggregate player statistics tracked across all runs
- Persisted to localStorage
- Tracked stats:
  - Games Played (`snakeStatsGamesPlayed`): incremented on each game start
  - Total Food Eaten (`snakeStatsTotalFood`): accumulated on each food eaten
  - Best Level (`snakeStatsBestLevel`): updated when reaching a higher level
  - Highest Score (`snakeHighScore`): reused from existing high score system
- Displayed on idle screen and game over/win screens

### 6.7 Achievements

- Three achievements that unlock on specific conditions
- Persisted to localStorage (`snakeAchievements` key)
- Achievement definitions:
  - **Snake Master** (`beat_game`): Complete level 10 (status becomes `won`)
  - **High Scorer** (`score_500`): Reach score >= 500 in a single run
  - **Marathon Run** (`no_pause`): Complete game (win) without ever pausing
- Unlocked achievements display on idle and game over screens
- Screen reader announces new unlocks via existing `aria-live` region
- Newly unlocked achievements show a "NEW" badge on game over/win screens

---

## 7. Game States

### 7.1 State Machine
```
idle
  START_GAME -> playing (level 1)
  START_AT_LEVEL(N) -> playing (level N)
  PAUSE_GAME -> paused
  RESET -> playing

playing
  PAUSE_GAME -> paused
  MOVE_SNAKE (collision) -> gameover
  MOVE_SNAKE (food objective reached, levels 1-9) -> levelComplete
  MOVE_SNAKE (level 10 food objective reached) -> won
  MOVE_SNAKE (isEndless=true) -> playing (no level-up, indefinite)

paused
  RESUME_GAME -> playing
  SPACE -> RESUME_GAME -> playing

levelComplete
  CONTINUE_GAME -> playing
  SPACE -> CONTINUE_GAME -> playing

gameover
  RESTART -> RESET -> playing (level 1)          [New Game]
  START_AT_LEVEL(N) -> playing (level N)         [Continue from Level N]

won
  RESTART -> RESET -> playing (level 1)          [New Game]
  START_AT_LEVEL(N) -> playing (level N)         [Continue from Level N]
  START_ENDLESS_GAME -> playing (isEndless=true) [Endless Mode]
```

### 7.2 State Descriptions
| Status | Description | Board | Overlay |
|--------|-------------|-------|---------|
| `idle` | Initial state, game not started | Shows snake + food + obstacles | ReadyOverlay with level name, description, objective, and Start button |
| `playing` | Active gameplay, snake moving | Full board visible | None |
| `paused` | Game paused by user | Board visible (frozen) | PauseMenu with Resume, Restart Level, and Return to Menu |
| `levelComplete` | Level completed, waiting for player to continue | Board visible (frozen) | LevelTransition with completed/next level info |
| `gameover` | Player lost | Board visible (frozen) | "Game Over!" with score + "Continue from Level N" (if unlocked) + "New Game" + "Return to Menu" |
| `won` | Player completed level 10 | Board visible (frozen) | "You Win!" with score + "Continue from Level N" (if unlocked) + "New Game" + "Endless Mode" + "Return to Menu" |

---

## 8. Input System

### 8.1 Keyboard
- **Movement keys:** Arrow keys (Up/Down/Left/Right) + WASD (case-insensitive)
- **Action key:** Space bar
  - `idle` -> start game
  - `playing` -> pause
  - `paused` -> resume
  - `levelComplete` -> continue to next level
  - `gameover` -> restart (New Game, Level 1)
  - `won` -> restart (New Game, Level 1)
- **Note:** Space on gameover/won triggers "New Game" (Level 1). "Continue from Level N" requires a click/tap.
- **Key prevention:** Arrow keys and WASD prevent default browser behavior (scrolling)
- **Ref-based tracking:** latest direction and status stored in refs for closure stability

### 8.2 Touch (Mobile)
- **Swipe gestures:** axis-locked gesture recognizer with progress feedback
  - `lockThreshold`: 24px (distance to lock axis)
  - `triggerThreshold`: 36px (minimum distance to fire swipe)
  - `axisRatio`: 1.5 (required ratio of primary to secondary axis movement)
  - `cooldownMs`: 80ms between consecutive swipes
  - Axis is locked on first move exceeding lockThreshold; subsequent moves cannot switch axis
  - Swipe fires on touchend if locked axis distance >= triggerThreshold and axis ratio is satisfied
  - Diagonals, short taps, and slow drags produce no swipe
  - `touchcancel` resets state silently
  - All listeners attached with `{ passive: true }` (CSS handles scroll prevention via `touch-action: none`)
- **D-pad buttons:** on-screen directional buttons (64px on touch devices for thumb comfort)
  - Hidden on desktop (`display: none`)
  - Shown on touch devices via `@media (pointer: coarse)`
  - Hidden during idle/gameover/won overlays; visible during playing/paused
  - Layout: cross pattern (up, left, center spacer, right, down)
  - `touch-action: manipulation` to prevent zoom
  - **Pre-aiming:** D-pad accepts direction changes during `paused` and `levelComplete` states, allowing players to queue their next direction before resuming or continuing. This is consistent with keyboard behavior.
  - **D-pad toggle:** button in controls toolbar to show/hide d-pad; persisted to localStorage; only visible on touch devices
- **Controls toolbar:** row of buttons above the board, always visible on all platforms
  - **Sound toggle:** speaker emoji, toggles between enabled/disabled; persisted to localStorage
  - **D-pad toggle:** gamepad emoji, toggles d-pad visibility (touch devices only)
  - **Pause/Resume button:** pauses or resumes game; visible during `playing` and `paused` states; pauses game on tap, resumes when paused
- **Touch events:** passive listeners on board wrapper; swipe disabled when status is not `playing`

---

## 9. Sound System

- **Engine:** Web Audio API oscillators (no audio asset files)
- **AudioContext:** created lazily via `SoundManager.initAudio()`; called from user gesture handlers (Start, Resume, Restart buttons, Space key) to satisfy browser autoplay policies
- **Shared state:** a single `sharedSoundManager` singleton (exported from `src/platform/sound.ts`) is used by the game engine for playback and by the React component for the toggle, ensuring mute state is shared across the app
- **Persistence:** sound preference stored in localStorage key `snakeSoundEnabled`
- **Default:** enabled (`true`)

### 9.1 Sound Effects
| Event | Waveform | Frequency | Duration | Notes |
|-------|----------|-----------|----------|-------|
| Eat food | sine | 600Hz + 800Hz | 0.1s each | Two-tone chirp with 50ms delay |
| Collision | sawtooth | 150Hz | 0.3s | Low buzz |
| Level up | sine | 400Hz + 600Hz + 800Hz | 0.15s + 0.15s + 0.2s | Ascending arpeggio, 100ms intervals |

### 9.2 Sound Triggering
- Eat sound fires when `score` increases (regardless of level-up)
- Level-up sound fires when `level` increases
- Collision sound fires when status becomes `gameover`
- On win: level-up sound fires (for the win jingle) AND eat sound fires (for the last food) — both play

---

## 10. UI Components

### 10.1 Game (orchestrator)
- Renders all child components and overlays
- Manages boardRef for touch events
- Dispatches screen reader announcements on status change
- Contains D-pad and controls info

### 10.2 Board
- Renders 400 Cell components in CSS Grid
- Memoizes grid cell coordinates (static)
- Memoizes snake body Set and obstacles Set for O(1) lookups per cell
- `role="grid"` + `aria-label="Snake Run board"`

### 10.3 Cell
- Pure presentational component
- Applies CSS class based on: isSnakeHead, isSnakeBody, isFood, isObstacle
- Snake head takes priority over body; obstacles overlay on top of other states
- `role="gridcell"` + contextual aria-label

### 10.4 ScoreBoard

- Displays: Level (with level name), Food progress, Score, High Score, SLOW indicator (when active)
- Level display format: "Level: {id} — {name}" (e.g., "Level: 1 — First Meal")
- Food progress display: "Food: {foodEaten}/{foodRequired}" (e.g., "Food: 3/10")
- Sound toggle button (speaker emoji, toggles between enabled/disabled)
- `aria-live="polite"` for score/level changes
- Screen-reader-only `aria-live="assertive"` region announces score, food progress, and level
- **Endless mode:** When `isEndless` is true, shows "Endless" instead of level display and hides food progress meter
- **SLOW indicator:** When `speedEffectTicks > 0`, displays "SLOW (N ticks remaining)" badge in cyan (`--color-food-slow`). Positioned after the High Score section. On mobile (`@media (max-width: 600px)`), wraps below the score row.

### 10.4a Statistics Panel

- Displays aggregate player stats: Games Played, Total Food, Best Level, High Score
- Shown on idle screen (below Start button, above controls hint)
- Shown on game over / win screens
- Compact layout following arcade-style CSS patterns
- Uses CSS Modules (`Statistics.module.css`)

### 10.4b Achievements Panel

- Displays achievement list with locked/unlocked state
- Locked achievements shown as "???"; unlocked achievements show their name
- Newly unlocked achievements show a "NEW" badge
- Shown on idle screen and game over/win screens
- Screen reader announces new unlocks via existing `aria-live` region
- Uses CSS Modules (`Achievements.module.css`)

### 10.5 GameOver (shared component)

- Accepts `variant` prop: `"gameover"` (default) or `"win"`
- `gameover`: "Game Over!" in red, "Your score: {score}"
- `win`: "You Win!" in green, "You completed the game! Score: {score}"
- Renders a single "Play Again" button when `lastUnlockedLevel === 1`. When `lastUnlockedLevel > 1`, renders "Continue from Level N" (primary, green, `autoFocus`) and "New Game" (secondary, muted) buttons. The hint text adapts: "Press Space for new game — click Continue to resume" when a continue option is available, otherwise "Press Space to restart".
- Win state styled via `data-win` attribute on modal
- **Endless mode:** When `isEndless` is true, score text reads "Endless Score: {score}"
- **Endless Mode button:** On win overlay, an "Endless Mode" button (primary, `autoFocus`) appears above "Continue from Level N" / "New Game". Hint text: "Press Space for new game, or choose Endless Mode"
- **Statistics:** Displays Statistics panel inline on game over/win screens
- **Achievements:** Displays Achievements panel on game over/win screens; newly unlocked achievements show "NEW" badge

### 10.6 LevelTransition

- Displays between levels when status is `levelComplete`
- Shows:
  - "Level {N} Complete" heading
  - Completed level name
  - "Next: {Next Level Name}" with description
  - Current score
  - Continue button (`autoFocus` for keyboard; the only interactive element in the overlay, so naturally tappable on touch)
  - "Press Space to continue" hint
- Uses same overlay pattern as idle/paused overlays (`rgba(15, 23, 42, 0.95)` backdrop)
- Button uses same styling as Start/Resume buttons

### 10.7 ReadyOverlay

- Shown when Game mounts with a `startLevel` prop before gameplay begins
- Displays:
  - Level number
  - Level name
  - Level description
  - Level objective (food required)
  - Start button (`autoFocus`)
  - "Press Space to start" hint
- On Start click, calls `startGameAtLevel(startLevel)` and the overlay disappears

### 10.8 PauseMenu

- Replaces the inline pause overlay
- Shows:
  - "Paused" heading
  - "Resume" button (primary, `autoFocus`)
  - "Restart Level" button (secondary)
  - "Return to Menu" button (muted)
  - "Press Space to resume" hint
- Resume continues gameplay
- Restart Level retries the current level without resetting accumulated run score
- Return to Menu calls `onNavigateToMenu` prop

### 10.9 MainMenu

- Entry screen displayed on app load
- Shows:
  - Game title "Snake Run"
  - "Runner Mode" button (always visible, highlighted with accent border)
  - Continue hint (last unlocked level + high score) when progress exists
  - Continue button (when `lastUnlockedLevel > 1` or `highScore > 0`)
  - New Game button
  - Statistics, Achievements, Settings, Help buttons
- Runner Mode navigates to `RunnerGame` screen
- Continue navigates to Game with `startLevel = lastUnlockedLevel`
- New Game navigates to Game with `startLevel = 1`

### 10.10 StatisticsScreen

- Full-screen wrapper around the Statistics presentational component
- Displays all four stats (Games Played, Total Food, Best Level, High Score)
- Back button returns to MainMenu

### 10.11 AchievementsScreen

- Full-screen wrapper around the Achievements presentational component
- Shows all achievements with locked/unlocked state
- Back button returns to MainMenu

### 10.12 SettingsScreen

- Sound toggle (ON/OFF button)
- Theme selector dropdown (Neon Arcade, Classic Snake, Terminal, High Contrast)
- Danger zone with reset buttons:
  - Reset Progress (clears `snakeLastUnlockedLevel`)
  - Reset Statistics (clears stats keys)
  - Reset Achievements (clears `snakeAchievements`)
- Each reset action shows a confirmation dialog with Cancel (default focus) and Confirm
- Back button returns to MainMenu

### 10.13 HelpScreen

- Static help screen explaining game mechanics
- Sections: Controls, Food Types, Special Mechanics, Progression, Achievements
- Back button returns to MainMenu

---

## 11. Accessibility

- **Board:** `role="grid"` with `aria-label`
- **Cells:** `role="gridcell"` with contextual labels ("Snake head at 5,5", "Food at 10,10", etc.)
- **ScoreBoard:** `aria-live="polite"` announces score/level changes to screen readers
- **Status announcements:** `aria-live="assertive"` region with contextual messages per state
- **Keyboard:** all actions available via keyboard; `autoFocus` on action buttons (Start, Resume, Play Again)
- **Screen-reader-only:** `.sr-only` CSS utility class for off-screen text
- **D-pad:** `aria-label` on each direction button
- **Pause button:** `aria-label="Pause game"` for screen reader announcement
- **Note:** `user-scalable=no` in viewport meta prevents browser-level text zoom during play. This is a known accessibility trade-off accepted for predictable touch behavior in a fast-paced game.

---

## 12. Persistence

### 12.1 High Score
- **Storage key:** `snakeHighScore`
- **Type:** number (string in localStorage)
- **Load:** on game init via `loadHighScore()`; returns 0 if missing or corrupted
- **Save:** on gameover or win, only if current score > stored high score
- **Scope:** per-browser, per-origin

### 12.2 Sound Preference
- **Storage key:** `snakeSoundEnabled`
- **Type:** `"true"` or `"false"` string
- **Load:** on module init; defaults to `true` if missing
- **Save:** on toggle

### 12.3 Level Progress
- **Storage key:** `snakeLastUnlockedLevel`
- **Type:** number (string in localStorage)
- **Default:** 1
- **Save:** When player reaches `levelComplete`, `gameover`, or `won`
- **Value:** Highest level the player has unlocked (the next level after a completed level, or the current level on gameover/win)
- **Load:** On game init via `loadLastUnlockedLevel()`

### 12.4 Statistics
- **Storage keys:** `snakeStatsGamesPlayed`, `snakeStatsTotalFood`, `snakeStatsBestLevel`
- **Type:** number (string in localStorage)
- **Defaults:** 0 for games played and total food, 1 for best level
- **Save:** Batched — flushed to localStorage on gameover, win, or pause
- **Load:** On game init via `loadStats()`

### 12.5 Achievements
- **Storage key:** `snakeAchievements`
- **Type:** JSON array of achievement IDs (strings)
- **Default:** empty array
- **Save:** When an achievement is unlocked
- **Load:** On game init via `loadAchievements()`

---

## 13. Environment Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_GRID_SIZE` | 20 | Grid dimensions |
| `VITE_CELL_SIZE` | 20 | Cell pixel size |
| `VITE_POINTS_PER_FOOD` | 10 | Points per food eaten (scoring only, not progression) |
| `VITE_LEVEL_COUNT` | 10 | Total levels |

- Defined in `.env` file
- Read via `import.meta.env.VITE_*`
- Fallback to defaults if env vars missing

---

## 14. Styling

- **CSS Modules:** scoped per component (`.module.css` files)
- **CSS Custom Properties:** centralized in `src/index.css` on `:root`
  - 18 color tokens (`--color-*`), 3 font tokens (`--font-display`, `--font-body`, `--font-mono`), spacing, shadow, radius, and transition tokens
- **Display font:** "Press Start 2P" (self-hosted `woff2` in `public/fonts/`, pre-cached by PWA workbox, `font-display: swap`)
  - Used for headings, titles, overlay headings, and button text
- **Numeric values:** `--font-mono` (system mono stack) for score, level numbers, food progress
- **Level name text:** `--font-body` (system stack) for readability of names like "First Meal"
- **Glow ceiling:** max 16px blur radius, max 6 simultaneous `box-shadow` elements visible at once
- **Theme tokens:**
  - Background: `--color-bg` (#1a1a2e), Surface: `--color-surface` (#16213e), Board: `--color-board-bg` (#0f172a)
  - Text: `--color-text-primary` (#f8fafc), `--color-text-body` (#eee), `--color-text-label` (#94a3b8), `--color-text-hint` (#64748b)
  - Accents: `--color-accent-soft` (#4ade80), `--color-accent` (#22c55e), `--color-accent-deep` (#16a34a)
  - Danger: `--color-danger` (#ef4444), Warning: `--color-warning` (#fbbf24)
  - Obstacles: `--color-obstacle` (#6366f1), `--color-obstacle-edge` (#818cf8)
  - Borders: `--color-border-default` (#475569), `--color-board-border` (#334155), `--color-cell-border` (#1e293b)
  - Food variants (Milestone 10): `--color-food-poison` (#d946ef, magenta), `--color-food-slow` (#22d3ee, cyan)
  - Portals (Milestone 10): `--color-portal` (#a855f7, purple)
- **Snake head:** `--color-accent` (#22c55e) with `box-shadow: 0 0 12px rgba(34, 197, 94, 0.8)`, 4px border-radius, and **directional eyes** that align visually according to the movement vector (UP, DOWN, LEFT, RIGHT).
- **Snake body:** `--color-accent-deep` (#16a34a), 1px border-radius
- **Food:** `--color-danger` (#ef4444), circular, pulse animation (scale 0.8 to 1.0). Variants: gold (`--color-warning`, diamond, fast pulse), poison (`--color-food-poison`, square, static), slow (`--color-food-slow`, triangle, glow)
- **Obstacles:** `--color-obstacle` (#6366f1) background, `--color-obstacle-edge` border, `box-shadow: 0 0 8px`, 2px border-radius
- **Board:** `--color-board-border` border with `--shadow-neon-purple` glow
- **Overlays:** `rgba(15, 23, 42, 0.95)` backdrop, centered content, consistent neon styling with reusable `.neon-divider` class
- **Buttons:** `--color-accent-soft` background, `--color-text-on-accent` text, hover: `--color-accent` with scale(1.05), neon glow box-shadow
- **ScoreBoard:** arcade-style horizontal panel with section separators, food progress meter bar, high score in gold (`--color-warning`)
- **Responsive:** `@media (max-width: 600px)` reduces padding; ScoreBoard wraps gracefully
- **Mobile viewport:** `position: fixed`, `overflow: hidden`, `overscroll-behavior: none`, `touch-action: none` on body and root
- **Safe-area insets:** `padding: max(var(--space-lg), env(safe-area-inset-*))` on game container for notched devices
- **iOS PWA:** `apple-mobile-web-app-capable`, `viewport-fit=cover`, `theme-color` meta tags
- **Themes:** 4 themes implemented via `[data-theme]` attribute on `<html>`:
  - **Neon Arcade** (default): existing dark navy + neon green/purple
  - **Classic Snake**: light cream background, forest green snake, minimal glow
  - **Terminal**: black background, green monochrome, no glow
  - **High Contrast**: black background, maximum contrast colors (yellow snake, red food, blue obstacles, magenta/cyan food variants), no glow
- **Theme system:** All colors reference CSS custom properties. No component contains theme-specific logic. New themes are addable by creating a new `[data-theme="..."]` block in `src/index.css`.

---

## 15. Testing

- **Framework:** Vitest with jsdom environment
- **392 unit tests** across 26 test files:
  - `state.test.ts` (43 tests): gameReducer state transitions (START, RESET, PAUSE, RESUME, CHANGE_DIRECTION, MOVE_SNAKE, collisions, levelComplete, CONTINUE_GAME, win, high score, START_AT_LEVEL, lastUnlockedLevel tracking, endless mode)
  - `Engine.test.ts` (31 tests): Engine class behavior (start, pause, resume, reset, continueGame, startAtLevel, restartLevel, startEndless, loop management, subscriptions, destroy, sound callback wiring, lastUnlockedLevel persistence)
  - `gameLogic.test.ts` (31 tests): positionsEqual, calculateNewHead, isWallCollision, isSelfCollision, isObstacleCollision, isCollision, spawnFood
  - `levelData.test.ts` (20 tests): getLevelData, generateObstacles, level metadata (name, description), layout validity
  - `storage.test.ts` (13 tests): loadHighScore, saveHighScore, loadLastUnlockedLevel, saveLastUnlockedLevel with localStorage mock
  - `statistics.test.ts` (5 tests): loadStats, incrementGamesPlayed, incrementTotalFood, updateBestLevel, saveStats
  - `achievements.test.ts` (7 tests): loadAchievements, saveAchievement, checkAchievements (beat_game, score_500, no_pause, wasPaused, re-award prevention)
  - `profile.test.ts` (4 tests): loadGameProfile shape, defaults, corruption resilience, saveGameProfile
  - `Cell.test.tsx` (4 tests): Cell component rendering, accessibility, and direction styling
  - `touch.test.ts` (12 tests): Gesture recognizer with axis locking, cooldown, progress, disabled state
  - `useTouch.test.tsx` (2 tests): Hook integration with touch events
  - `Game.test.tsx` (9 tests): Pause button, dev level select, ReadyOverlay, Start click, PauseMenu return to menu, rapid mount/unmount stress test
  - `Board.test.tsx` (3 tests): Board rendering and responsive sizing
  - `pwa.test.ts` (6 tests): PWA build output verification (service worker, manifest, registration, HTML title, HTML manifest/SW links, manifest values)
  - `LevelTransition.test.tsx` (5 tests): LevelTransition component rendering, interaction, and accessibility
  - `GameOver.test.tsx` (9 tests): GameOver component rendering with continue/new game buttons, callback verification, win variant, endless mode UI
  - `Statistics.test.tsx` (1 test): Statistics component rendering
  - `Achievements.test.tsx` (3 tests): Achievements component rendering, locked/unlocked state, NEW badge
  - `MainMenu.test.tsx` (6 tests): Menu options, Continue visibility, navigation callbacks
  - `PauseMenu.test.tsx` (5 tests): Resume/Restart/Return buttons, callbacks, autoFocus
  - `SettingsScreen.test.tsx` (6 tests): Sections, theme, sound, reset confirmation, back navigation, Escape cancels dialog
  - `HelpScreen.test.tsx` (2 tests): Mechanics sections, back navigation
  - `ReadyOverlay.test.tsx` (3 tests): Level metadata, Start button, autoFocus
  - `StatisticsScreen.test.tsx` (2 tests): Stats rendering, back navigation

---

## 16. Build and Dev

- **Dev server:** `npm run dev` (Vite HMR)
- **Production build:** `npm run build` (tsc + vite build)
- **Preview:** `npm run preview` (with `--host` for local network access)
- **Test:** `npm test` (single run), `npm run test:watch` (watch mode)
- **Lint:** `npm run lint` (ESLint)
- **Output:** sourcemaps enabled, ~207KB JS bundle (65KB gzipped), ~6KB CSS (2KB gzip)

---

## 17. Known Limitations

1. No difficulty selection — levels are sequential only
2. High score is local only (no level progress sync across browsers/devices yet)
3. Sound effects are simple oscillators — no music or complex audio
4. Statistics and achievements are local only (no cloud sync)
5. Grid size is fixed — not responsive to screen size beyond viewport constraints
6. `user-scalable=no` prevents browser-level text zoom (documented accessibility trade-off)
7. `overscroll-behavior: none` requires iOS Safari 16+ or Chrome 95+ for full support

## 18. PWA Support

- **Manifest:** `manifest.webmanifest` generated by `vite-plugin-pwa` at build time
- **Service Worker:** Workbox-generated, auto-updating (`registerType: 'autoUpdate'`), pre-caches all static assets for offline play
- **Installability:** `display: standalone`, theme color `#16213e`, background color `#1a1a2e`
- **Offline:** Full offline play after first visit via pre-caching
- **Icons:** SVG favicon used as PWA icon (`purpose: 'any'`)
- **iOS:** `apple-mobile-web-app-capable` enables standalone mode; no custom `apple-touch-icon` (falls back to screenshot)
- **Deployment:** GitHub Pages via GitHub Actions (`.github/workflows/deploy.yml`)

## 19. Navigation & Screens

### 19.1 Screen Architecture

The app uses a lightweight state-based navigation system in `App.tsx` with a `useState<Screen>` hook. No routing library is used. Screens are purely presentational and receive all data as props from `App.tsx`.

Screens:
- `menu` — MainMenu
- `game` — Game (with `startLevel` prop)
- `statistics` — StatisticsScreen
- `achievements` — AchievementsScreen
- `settings` — SettingsScreen
- `help` — HelpScreen

### 19.2 Startup Flow

The only path from menu to gameplay:
```
MainMenu → Game (startLevel) → ReadyOverlay → Start → playing
```

- `Game` accepts `startLevel: number` and `onNavigateToMenu?: () => void` props
- When mounted, `Game` shows `ReadyOverlay` with level metadata
- Clicking Start calls `startGameAtLevel(startLevel)` and hides the overlay
- The old idle overlay has been removed entirely

### 19.3 Game Over Navigation

| Action | Destination | Behavior |
|--------|-------------|----------|
| Continue | ReadyOverlay → lastUnlockedLevel | Preserves score |
| New Game | ReadyOverlay → Level 1 | Resets score to 0 |
| Return to Menu | MainMenu | Destroys Engine |

### 19.4 Pause Menu

The pause overlay shows three options:
- **Resume** — continues gameplay
- **Restart Level** — retries current level, preserves accumulated run score
- **Return to Menu** — calls `onNavigateToMenu`, destroys Engine

### 19.5 Persistence Service

`src/game/profile.ts` provides a centralized `loadGameProfile()` function that returns:
- `progress`: `{ lastUnlockedLevel, highScore }`
- `statistics`: `Stats`
- `achievements`: `Achievement[]`
- `settings`: `{ soundEnabled, theme }`

`App.tsx` loads the profile once on mount and passes slices to each screen as props. No screen reads localStorage directly.

### 19.6 Theme System

Themes are implemented via CSS custom property overrides on `[data-theme]` attribute on `<html>`:
- `neon-arcade` (default)
- `classic`
- `terminal`
- `high-contrast`

The `useTheme()` hook in `src/hooks/useTheme.ts` reads/writes `snakeTheme` from localStorage and updates `document.documentElement.dataset.theme`. `main.tsx` sets the theme synchronously before React mounts to prevent flash.

---

## 20. Runner Mode

### 20.1 Game Overview

Runner Mode is an endless runner variant of Snake Run. The snake automatically moves upward and the player changes lanes (left/right) to avoid obstacles and collect food. The goal is to survive as long as possible while maximizing score through distance and food collection.

### 20.2 Lane System

- **Three lanes** positioned at x-coordinates: Left (4), Center (10), Right (16)
- The snake always occupies exactly one lane
- Lane changes shift the head's x-coordinate immediately (zero tick delay)
- Lane changes clamp to bounds [0, 2] and are rejected if the target lane already contains a body segment at the head's Y position (tail lane blocking)
- **Lane visualization:** In runner mode, the 20×20 grid is visually transformed into a 3-lane presentation. Lane columns (x=4, 10, 16) are rendered at full visibility with visible borders. Non-lane columns are dimmed to near-transparent with no borders. The active lane shows a subtle green background highlight. This replaces the previous text-only "Lanes: Left | Center | Right" indicator. The board border changes from purple to green accent to reinforce runner mode at a glance.
- **Lane change feedback:** When the player changes lanes, the snake head shows a brief directional slide animation (150ms) with a green glow pulse. The direction determines whether it slides left or right, providing immediate visual confirmation of input registration.

### 20.3 Movement Model

- The snake moves UP automatically each tick
- The player does not control forward movement
- **Y-axis wrap-around:** When the snake reaches y < 0, it wraps to y = 19. Obstacles and food are regenerated for the new "lap"
- Collision detection checks x bounds (0..19), self-collision, and obstacle collision

### 20.4 Scoring

- **Distance points:** 1 point per 10 distance units traveled
- **Food points:** 10 points per food × length multiplier (floor(length/5) + 1)
- Both distance and food contribute to the total score each tick

### 20.5 HUD

The `RunnerHUD` component displays:
- Score (total points from distance + food, displayed in gold)
- Distance
- Food eaten
- Snake length
- High score (Best)

Lane structure is communicated visually on the board rather than via text.

### 20.6 Game Over

The `RunnerGameOver` overlay displays:
- "Run Over!" heading
- Score prominently with "New Best!" badge when score equals or exceeds high score, or "Best: {highScore}" for comparison
- Distance, food eaten, snake length
- "Play Again" button (primary, autoFocus)
- "Menu" button (secondary)
- "Press Space to play again" hint

### 20.7 Controls

**Desktop:**
- Left Arrow / A: Change lane left
- Right Arrow / D: Change lane right
- Space: Start run / Play Again
- Escape: Return to menu

**Mobile:**
- Swipe Left: Change lane left
- Swipe Right: Change lane right
- Tap Start button: Start run
- Tap Play Again: Restart

### 20.8 Runner State Machine

```
RUNNER_START (screen: 'runner')
  START_RUNNER -> playing (isRunner=true, lane=1, distance=0)

playing (isRunner=true)
  MOVE_SNAKE (collision) -> gameover
  MOVE_SNAKE (wrap, y=0->19) -> playing (regenerate course)
  CHANGE_LANE(-1|1) -> playing (shift head x)

gameover (isRunner=true)
  START_RUNNER -> playing (fresh run)
  Return to Menu -> menu (Engine destroyed)
```

### 20.9 Course Generation

- `generateRunnerCourse()` produces obstacle patterns and one food item per lap
- Difficulty scales from 0 to 1 over 500 distance units
- Pattern count: 6 → 12 patterns per lap as difficulty increases
- Blocked lanes per row: 1 (single blocker) or 2 (double blocker); at least one lane is always clear
- Only `'normal'` food type is spawned in runner mode

### 20.10 Difficulty Scaling

Speed decreases from 200ms (initial) by 2ms every 50 distance, flooring at 80ms minimum speed. This creates an accelerating difficulty curve as the run progresses.

### 20.11 Viewport Scrolling

Runner mode uses a viewport scrolling render transform that creates forward motion perception. The snake stays fixed in the lower third of the board (screen row 13) while obstacles and food scroll downward from the top.

- **Rendering transform:** Board maps screen rows to grid rows via `screenRow = (gridY - headY + VIEWPORT_TAIL + GRID_SIZE) % GRID_SIZE`
- **Constants:** `RUNNER_VIEWPORT_TAIL = 13` (rows visible behind snake), giving 6 rows ahead and 13 behind
- **Implementation:** Pure rendering transform in Board.tsx. When `viewportHeadY` is provided, Board iterates screen rows and computes corresponding grid rows via modulo. Game engine is unchanged. `data-viewport-scrolling="true"` attribute on Board element.
- **Classic mode:** When `viewportHeadY` is undefined, Board renders identically to pre-viewport behavior
- **Wrap-around:** Modulo formula handles Y-axis wrap (snake at y=0 wrapping to y=19 correctly shows content from the new lap above)

### 20.12 Speed Profiles

A dev-only speed multiplier constant enables validation testing at different speeds:

```ts
export const RUNNER_SPEED_MULTIPLIER = 1.0;
```

Speed profiles for validation:

| Profile | Multiplier | Initial Speed | Min Speed |
|---------|-----------|---------------|-----------|
| A (baseline) | 1.00 | 200ms | 80ms |
| B (+25%) | 1.25 | 160ms | 64ms |
| C (+50%) | 1.50 | 133ms | 53ms |
| D (+75%) | 1.75 | 114ms | 46ms |

The multiplier is applied in Engine.ts tick calculation as `effectiveSpeed = Math.round(effectiveSpeed / RUNNER_SPEED_MULTIPLIER)`. This is temporary validation infrastructure, not user-exposed.
