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
- **Head:** `{x:10,y:10}`, bright green (`#22c55e`) with glow (`box-shadow: 0 0 12px`)
- **Body:** darker green (`#16a34a`), 1px border-radius
- **Growth:** when food is eaten, new head is prepended and tail is NOT removed (net +1 segment)
- **Movement:** when no food eaten, new head is prepended and tail is removed (net 0 change)
- **Position tracking:** array of `{x, y}` positions; `snake[0]` is always the head

### 3.2 Food
- **Appearance:** red (`#ef4444`), circular (`border-radius: 50%`), pulsing animation (scale 0.8 to 1.0 over 1s)
- **Spawning:** random position within grid bounds, excluding all snake segments and obstacles
- **Algorithm:** generates random candidates, checks against a Set of occupied positions, max attempts to prevent infinite loop, falls back to snake head position if grid is completely full
- **Replacement:** new food spawns immediately when eaten

### 3.3 Obstacles
- **Appearance:** indigo (`#6366f1`) with lighter border (`#818cf8`) and glow (`box-shadow: 0 0 8px`)
- **Generation per level:** `min(max(1, floor(level * 0.5)), 8)` obstacles
  - Level 1: 1 obstacle
  - Level 2: 1 obstacle
  - Level 3: 1 obstacle
  - Level 4: 2 obstacles
  - Level 5: 2 obstacles
  - Level 6: 3 obstacles
  - Level 7: 3 obstacles
  - Level 8: 4 obstacles
  - Level 9: 4 obstacles
  - Level 10: 5 obstacles
- **Placement:** random positions avoiding snake and food; no duplicates
- **Persistence:** new set generated on each level-up; obstacles do NOT carry over between levels

---

## 4. Game Loop

- **Mechanism:** `requestAnimationFrame` with accumulator pattern (NOT setInterval)
- **Tick timing:** when accumulated time >= current speed, dispatch `MOVE_SNAKE` and reset accumulator
- **Speed per level:**
  - Level 1: 150ms
  - Level 2: 140ms
  - ...
  - Level 10: 60ms
  - Formula: `150 - (level - 1) * 10` ms
- **Cleanup:** `cancelAnimationFrame` on unmount or status change; accumulator and timestamp reset
- **Pause behavior:** loop stops when status is not `playing`; resumes from where it left off

---

## 5. Movement and Direction

### 5.1 Direction Changes
- Input is queued in `nextDirection`; applied on next `MOVE_SNAKE` tick
- **Opposite direction blocking:** cannot reverse into yourself (UP blocks DOWN, LEFT blocks RIGHT, etc.)
- Direction changes are debounced per tick; only the last queued direction is applied

### 5.2 Collision Detection (checked in order on each MOVE_SNAKE)
1. **Wall collision:** new head position x < 0, x >= 20, y < 0, or y >= 20
2. **Self collision:** new head overlaps any snake segment EXCEPT the tail (tail moves away before head arrives)
3. **Obstacle collision:** new head position matches any obstacle position (Set-based O(1) lookup)
- Any collision triggers game over

### 5.3 Collision Outcome
- Status changes to `gameover`
- High score is updated: `max(currentHighScore, currentScore)`
- High score is persisted to localStorage
- Collision sound plays

---

## 6. Scoring and Levels

### 6.1 Scoring
- **Points per food:** 10
- **Score only increases** when food is eaten
- Score does NOT decrease on any event

### 6.2 Level Progression
- **Target score per level:** `level * 50`
  - Level 1: 50 points
  - Level 5: 250 points
  - Level 10: 500 points
- **Level-up trigger:** score >= target score AND food was just eaten
- **Level-up behavior:**
  - Snake resets to initial position `[{x:10,y:10}, {x:9,y:10}, {x:8,y:10}]`
  - Direction resets to RIGHT
  - Score carries over (does NOT reset)
  - New obstacles generated for next level
  - New food spawned
  - Level-up sound plays
  - Speed increases per new level formula

### 6.3 Win Condition

- When level `LEVEL_COUNT` target score is reached (`LEVEL_COUNT * 50` points)
- Status changes to `won`
- High score saved
- Win overlay displayed: "You Win! You completed the game! Score: {score}"
- Level-up sound plays

---

## 7. Game States

### 7.1 State Machine
```
idle
  START_GAME -> playing
  PAUSE_GAME -> paused
  RESET -> playing

playing
  PAUSE_GAME -> paused
  MOVE_SNAKE (collision) -> gameover
  MOVE_SNAKE (level 10 complete) -> won

paused
  RESUME_GAME -> playing
  SPACE -> RESUME_GAME -> playing

gameover
  RESTART -> RESET -> playing

won
  RESTART -> RESET -> playing
```

### 7.2 State Descriptions
| Status | Description | Board | Overlay |
|--------|-------------|-------|---------|
| `idle` | Initial state, game not started | Shows snake + food + obstacles | "Snake Run" with Start button |
| `playing` | Active gameplay, snake moving | Full board visible | None |
| `paused` | Game paused by user | Board visible (frozen) | "Paused" with Resume button |
| `gameover` | Player lost | Board visible (frozen) | "Game Over!" with score + Play Again |
| `won` | Player completed level 10 | Board visible (frozen) | "You Win!" with score + Play Again |

---

## 8. Input System

### 8.1 Keyboard
- **Movement keys:** Arrow keys (Up/Down/Left/Right) + WASD (case-insensitive)
- **Action key:** Space bar
  - `idle` -> start game
  - `playing` -> pause
  - `paused` -> resume
  - `gameover` -> restart
  - `won` -> restart
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
  - **Pre-aiming:** D-pad accepts direction changes during `paused` state, allowing players to queue their next direction before resuming. This is consistent with keyboard behavior.
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
- Displays: Level, Score, High Score
- Sound toggle button (speaker emoji, toggles between enabled/disabled)
- `aria-live="polite"` for score/level changes
- Screen-reader-only `aria-live="assertive"` region announces score and level

### 10.5 GameOver (shared component)

- Accepts `variant` prop: `"gameover"` (default) or `"win"`
- `gameover`: "Game Over!" in red, "Your score: {score}"
- `win`: "You Win!" in green, "You completed the game! Score: {score}"
- Both: Play Again button + "Press Space to restart" hint
- Win state styled via `data-win` attribute on modal

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

---

## 13. Environment Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_GRID_SIZE` | 20 | Grid dimensions |
| `VITE_CELL_SIZE` | 20 | Cell pixel size |
| `VITE_POINTS_PER_FOOD` | 10 | Points per food eaten |
| `VITE_LEVEL_COUNT` | 10 | Total levels |

- Defined in `.env` file
- Read via `import.meta.env.VITE_*`
- Fallback to defaults if env vars missing

---

## 14. Styling

- **CSS Modules:** scoped per component (`.module.css` files)
- **Dark theme:**
  - Background: `#1a1a2e` (page), `#16213e` (game card)
  - Text: `#f8fafc` (primary), `#94a3b8` (secondary), `#64748b` (muted)
- **Snake head:** `#22c55e` with `box-shadow: 0 0 12px rgba(34, 197, 94, 0.8)`, 2px border-radius, and **directional eyes** that align visually according to the movement vector (UP, DOWN, LEFT, RIGHT).
- **Snake body:** `#16a34a`, 1px border-radius
- **Food:** `#ef4444`, circular, pulse animation (scale 0.8 to 1.0)
- **Obstacles:** `#6366f1` background, `#818cf8` border, `box-shadow: 0 0 8px`
- **Overlay:** `rgba(15, 23, 42, 0.95)` backdrop, centered content
- **Buttons:** `#4ade80` background, `#0f172a` text, hover: `#22c55e` with scale(1.05)
- **Typography:** system font stack, weights 400-700
- **Responsive:** `@media (max-width: 600px)` reduces padding and title size
- **Mobile viewport:** `position: fixed`, `overflow: hidden`, `overscroll-behavior: none`, `touch-action: none` on body and root
- **Safe-area insets:** `padding: max(20px, env(safe-area-inset-*))` on game container for notched devices
- **iOS PWA:** `apple-mobile-web-app-capable`, `viewport-fit=cover`, `theme-color` meta tags

---

## 15. Testing

- **Framework:** Vitest with jsdom environment
- **116 unit tests** across 10 test files:
  - `state.test.ts` (24 tests): gameReducer state transitions (START, RESET, PAUSE, RESUME, CHANGE_DIRECTION, MOVE_SNAKE, collisions, level-up, win, high score)
  - `Engine.test.ts` (15 tests): Engine class behavior (start, pause, resume, reset, loop management, subscriptions, destroy, sound callback wiring)
  - `gameLogic.test.ts` (25 tests): positionsEqual, calculateNewHead, isWallCollision, isSelfCollision, isObstacleCollision, isCollision, spawnFood
  - `levelData.test.ts` (18 tests): getLevelData, generateObstacles
  - `storage.test.ts` (8 tests): loadHighScore, saveHighScore with localStorage mock
  - `Cell.test.tsx` (5 tests): Cell component rendering, accessibility, and direction styling
  - `touch.test.ts` (13 tests): Gesture recognizer with axis locking, cooldown, progress, disabled state
  - `useTouch.test.tsx` (2 tests): Hook integration with touch events
  - `Game.test.tsx` (3 tests): Pause button rendering and interaction
  - `Board.test.tsx` (3 tests): Board rendering and responsive sizing

---

## 16. Build and Dev

- **Dev server:** `npm run dev` (Vite HMR)
- **Production build:** `npm run build` (tsc + vite build)
- **Preview:** `npm run preview` (with `--host` for local network access)
- **Test:** `npm test` (single run), `npm run test:watch` (watch mode)
- **Lint:** `npm run lint` (ESLint)
- **Output:** sourcemaps enabled, ~203KB JS bundle (64KB gzipped), ~4KB CSS

---

## 17. Known Limitations

1. No difficulty selection — levels are sequential only
2. No leaderboard — high score is local only
3. No difficulty scaling between games — each START_GAME resets to level 1
4. No undo or continue-after-death
5. Sound effects are simple oscillators — no music or complex audio
6. No PWA/offline support
7. No analytics or scoring history
8. Grid size is fixed — not responsive to screen size beyond viewport constraints
9. `user-scalable=no` prevents browser-level text zoom (documented accessibility trade-off)
10. `overscroll-behavior: none` requires iOS Safari 16+ or Chrome 95+ for full support
