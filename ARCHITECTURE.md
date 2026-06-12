# Snake Run — Codebase Map

## Technology Stack

- **Language:** TypeScript 6.0+ (strict mode)
- **Framework:** React 19
- **Build Tool:** Vite 8
- **Test Framework:** Vitest with jsdom
- **CSS:** CSS Modules (scoped component styles)
- **Audio:** Web Audio API (no asset files)

## Core Functionality

Classic Snake Run on a 20x20 grid. Players control a snake that grows by eating food. Game ends on collision with walls, self, or obstacles. Win by completing all 10 levels.

## Project Structure

```
src/
├── game/                     # React-independent game engine
│   ├── types.ts              # GameState, GameAction, Direction, Position
│   ├── constants.ts          # Grid size, initial snake, key mappings
│   ├── state.ts              # Game reducer and initial state
│   ├── Engine.ts             # Framework-agnostic game engine class
│   ├── collision.ts          # Collision detection utilities
│   ├── food.ts               # Food spawning logic
│   ├── snake.ts              # Snake movement helpers
│   ├── levels.ts             # Level data and obstacle generation
│   ├── runnerCourse.ts       # Runner mode course generation
│   ├── storage.ts            # High score and level progress persistence
│   ├── statistics.ts         # Player statistics tracking (localStorage)
│   ├── achievements.ts       # Achievement definitions, detection, persistence
│   ├── profile.ts            # Centralized persistence service (loadGameProfile)
│   └── index.ts              # Barrel exports
├── platform/                 # Platform-specific adapters
│   ├── keyboard.ts           # Keyboard event handling
│   ├── touch.ts              # Touch/gesture handling
│   ├── sound.ts              # Web Audio API sound effects
│   └── index.ts              # Barrel exports
├── hooks/                    # React hooks (thin wrappers)
│   ├── useGame.ts            # Bridges game Engine to React
│   ├── useKeyboard.ts        # Keyboard hook (wraps platform/keyboard)
│   ├── useTouch.ts           # Touch hook (wraps platform/touch)
│   └── useTheme.ts           # Theme management hook
├── components/               # React UI components
│   ├── App.tsx               # Screen router and profile loader
│   ├── Game.tsx              # Main game container
│   ├── RunnerGame.tsx        # Runner mode orchestrator
│   ├── Board.tsx             # Grid renderer
│   ├── Cell.tsx              # Individual cell renderer
│   ├── ScoreBoard.tsx        # Score display
│   ├── RunnerHUD.tsx         # Runner mode HUD bar
│   ├── GameOver.tsx          # Win/gameover modal
│   ├── RunnerGameOver.tsx    # Runner mode game over overlay
│   ├── LevelTransition.tsx   # Level complete overlay
│   ├── ReadyOverlay.tsx      # Pre-level start overlay
│   ├── PauseMenu.tsx         # Pause overlay with resume/restart/return
│   ├── MainMenu.tsx          # Entry menu screen
│   ├── StatisticsScreen.tsx  # Full-screen statistics view
│   ├── AchievementsScreen.tsx# Full-screen achievements view
│   ├── SettingsScreen.tsx    # Settings and theme selector
│   ├── HelpScreen.tsx        # Help / How To Play screen
│   ├── Statistics.tsx        # Player statistics panel
│   ├── Achievements.tsx      # Achievement display panel
│   └── *.module.css          # Component styles
├── types/                    # Shared types
│   ├── game.ts               # Re-exports from game/types
│   ├── components.ts         # Component prop types
│   └── navigation.ts         # Screen navigation types
├── utils/                    # Legacy utilities (re-exports from game/)
│   ├── constants.ts          # Re-exports from game/constants
│   ├── gameLogic.ts          # Re-exports from game/*
│   ├── levelData.ts          # Re-exports from game/levels
│   ├── storage.ts            # Re-exports from game/storage
│   └── __tests__/            # Utility tests
├── assets/                   # Static assets
├── main.tsx                  # React entry point
└── index.css                 # Global resets + theme overrides
```

## Architecture & Design Patterns

### Game Engine (Framework-Agnostic)

The core game logic lives in `src/game/` with zero React dependencies:

- **Engine class** (`Engine.ts`): Manages game loop, state, and events
- **State reducer** (`state.ts`): Pure function for state transitions
- **Domain modules**: collision, food, snake, levels, storage

```typescript
// Usage without React:
import { Engine } from './game';

const engine = new Engine();
engine.subscribe(state => console.log(state));
engine.start();
```

### Platform Adapters

Platform-specific code is isolated in `src/platform/`:

- **Keyboard**: Event listener management
- **Touch**: Rich gesture recognizer with axis locking, progress callbacks, and cooldown
- **Sound**: Web Audio API synthesis (with `sharedSoundManager` singleton)

These adapters are framework-agnostic and can be used by any UI.

### React Integration

React hooks in `src/hooks/` provide thin wrappers:

- **useGame**: Bridges Engine to React state
- **useKeyboard**: Wraps platform/keyboard for React
- **useTouch**: Wraps platform/touch for React

Sound is consumed directly via the `sharedSoundManager` singleton exported from `platform/sound.ts`.

### State Management

- **Single source of truth** — all game state in one `GameState` object
- **Action dispatch** via `GameAction` discriminated union
- **Engine** manages state transitions via reducer

### Game Loop Pattern

- **requestAnimationFrame** with accumulator pattern (not setInterval)
- **Dynamic speed** based on current level (150ms → 100ms)
- **Cleanup** via `cancelAnimationFrame` on unmount/status change
- **Direction queuing** (`nextDirection`) debounces rapid key presses
- **Pause behavior:** loop stops when status is not `playing` (including `levelComplete`); resumes from where it left off when status returns to `playing`

### Component Architecture

- **Top-level:** `App.tsx` manages screen state and profile data
- **Screen components:** Stateless presenters receiving data as props from `App.tsx`
- **Game:** Orchestrates hooks and rendering when screen is `'game'`
- **RunnerGame:** Orchestrates runner mode with viewport scrolling (`viewportHeadY` prop), lane change feedback (`laneChangeDirection` state), HUD and game over
- **Board:** Wrapped in `React.memo`; accepts `viewportHeadY` for viewport scrolling, `laneChangeDirection` for feedback threading, `runnerLane` for lane visualization
- **Cell:** Pure presentational component; accepts `isViewportScrolling`, `laneChangeDirection` for animation classes
- **Hooks:** useGame, useKeyboard, useTouch, useTheme
- **Pure utility functions:** testable logic in `game/` modules
- **CSS Modules:** scoped styles per component
- **Compositional rendering:**
  - App → Screen component (MainMenu, Game, RunnerGame, StatisticsScreen, etc.)
  - Game → ScoreBoard + Board + Overlays (ReadyOverlay, PauseMenu, LevelTransition, GameOver)
  - RunnerGame → RunnerHUD + Board + Overlays (Start, RunnerGameOver)

### Data Flow

```
App.tsx loads profile → passes slices as props → Screen components render

In Game:
Input (Keyboard/Touch) → Platform Adapter → useGame hook → Engine →
dispatch action → gameReducer → new state → subscribe → React re-render
```

### Navigation Pattern

Screen navigation is state-based using a single `useState<Screen>` in `App.tsx`:

```typescript
type Screen = 'menu' | 'game' | 'runner' | 'statistics' | 'achievements' | 'settings' | 'help';
```

- No routing library is used; a `switch` or conditional rendering maps `screen` to component.
- `App.tsx` is the single owner of profile data — it calls `loadGameProfile()` once and passes slices to each screen.
- Screen components never read localStorage directly.
- Navigation callbacks flow upward: `Screen → App.tsx → setScreen(next)`.

## Key Features

- **Directional Snake Eyes:** Snake head rendering includes eyes that face the current direction of movement.

### Food Variants

Four food types with weighted random spawning (80/10/5/5):
- **Normal** (80%): +10 points, grow by 1, no timer
- **Gold** (10%): +30 points, grow by 1, despawns after 10 ticks
- **Poison** (5%): 0 points, shrinks snake by 1 (floored at 3), no timer
- **Slow** (5%): +10 points, speed × 1.3 for 10 ticks, despawns after 8 ticks

Spawn probabilities and timers are exported constants from `src/game/food.ts`.

### Wrap-Around Levels

Level 5 (Maze Runner) has `wrapAround: true`. The snake's head coordinates are normalized modulo grid size before collision checks, allowing it to exit one edge and appear on the opposite edge. Self-collision and obstacle collision still apply.

### Portal Levels

Level 7 (Four Chambers) has one portal pair. When the snake's head lands on a portal tile, it teleports to the paired position. Collision is checked against the teleported position. Food does not spawn on portal tiles.

### Runner Lane Visualization

In runner mode, the Board and Cell components accept optional `runnerLane`, `isLaneColumn`, and `isActiveLane` props. When these are provided, CSS classes transform the 20×20 grid into a 3-lane visual presentation without changing the underlying grid structure. Lane columns (x=4, 10, 16) render at full visibility with visible borders. Non-lane columns are dimmed to near-transparent. The active lane shows a subtle green background highlight. The board border changes to green accent (`data-runner="true"`). Food respawning in runner mode is constrained to lane columns via `spawnRunnerFood()`.

### Runner Viewport Scrolling

In runner mode, Board supports a `viewportHeadY` prop that creates forward motion perception by mapping screen rows to grid rows. The snake stays fixed at screen row 13 (`RUNNER_VIEWPORT_TAIL`) while obstacles and food scroll downward. The rendering transform is: `screenRow = (gridY - headY + VIEWPORT_TAIL + GRID_SIZE) % GRID_SIZE`. The Board is wrapped in `React.memo` and uses `data-viewport-scrolling="true"` attribute when viewport is active. When `viewportHeadY` is undefined (classic mode), rendering is identical to pre-viewport behavior.

### Lane Change Visual Feedback

When the player changes lanes, RunnerGame tracks the direction via `laneChangeDir` state and clears it after 200ms via a `laneChangeTimerRef`. The direction is threaded through `BoardProps` and `CellProps` as `laneChangeDirection`. Cell applies `laneSlidingLeft` or `laneSlidingRight` CSS classes on the snake head cell, triggering a 150ms directional slide animation with green glow.

### Growth Risk System

**Multiplier Engine:** Tiered length-based multiplier defined in `src/game/snake.ts` via `getMultiplier(length)` and `MILESTONES` constant (`[10, 20, 30, 50]`). Returns x1 (3–9), x2 (10–19), x3 (20–29), x4 (30–49), x5 (50+). Multiplier is computed post-eat (based on snake length after food consumption) in `state.ts` runner `MOVE_SNAKE` branch.

**State Tracking:** `maxMultiplier` field in `GameState` tracks the highest multiplier tier reached during a run. Updated on each runner `MOVE_SNAKE` via `Math.max(state.maxMultiplier, getMultiplier(newSnake.length))`. Reset to 1 on `START_RUNNER` and `START_AT_LEVEL`.

**Milestone Callback:** `onMilestone?(tier: 2 | 3 | 4 | 5)` on `Engine` fires when the snake crosses a multiplier tier boundary in runner mode. Detection in `dispatch()` compares `getMultiplier` before and after the state transition, gated on `foodEaten` increase. Wired in `useGame.ts` via a single callback that both triggers `sharedSoundManager.playMilestone(tier)` for audio feedback and sets `celebrateMultiplier` state (with a 600ms auto-clear timeout) for the HUD pulse animation. The UI reads `celebrateMultiplier` from `useGame()` and passes `celebrating` to `RunnerHUD` when it matches the current multiplier. This single-path design ensures sound and visual celebration stay synchronized.

**Risk-Aware Food Placement:** `src/game/runnerCourse.ts` — `spawnRunnerFood()` categorizes grid rows by obstacle count (safe=0, medium=1, high=2) and selects a target row based on the snake's tier. Food lane is chosen to create choice-based risk: tier 1 prefers current/adjacent lane, tier 2 may require lane change, tier 3 requires different lane, tier 4 requires significant deviation, tier 5 forces thread-through on high-obstacle rows. Fallback chain: same-row other lanes → any safe row → ultimate fallback at center lane.

**Milestone Sound:** `src/platform/sound.ts` — `playMilestone(tier)` creates a two-tone ascending sine oscillator. Base frequency = 400 + tier * 100 Hz, second tone at base+200 Hz. Fire-and-forget oscillators with linear gain decay.

### Collision Detection

1. **Wall collision:** bounds check
2. **Self collision:** checks all segments except tail
3. **Obstacle collision:** linear scan O(n) (max 8 obstacles)

- Combined via `isCollision()` utility in `game/collision.ts`

### Food Spawning

- Random position within grid bounds
- Excludes snake body and obstacles
- Uses Set for O(1) lookup
- Max attempts limit prevents infinite loops
- Fallback to snake head if grid fills

### Level System

- **10 levels** with data-driven metadata (name, description)
- **Progression:** food-objective system (10–30 food per level)
- **Speed ramp:** 150ms → 100ms (see SPEC.md for full table)
- **Obstacles:** predefined handcrafted layouts per level (see `LEVEL_DESIGN.md`)
- **Wrap-around:** Level 5 has `wrapAround: true`; snake exits one edge and appears on the opposite
- **Portals:** Level 7 has one portal pair (`portals: [[{x:2,y:4}, {x:16,y:15}]]`); landing on one teleports to the other
- **Level-up (two-step):**
  1. Score reaches target → status = `levelComplete`, game freezes, overlay appears
  2. Player clicks Continue or presses Space → `CONTINUE_GAME` → level increments, snake resets, game resumes
- **Win:** complete level 10 (transitions directly to `won`, no levelComplete step)

### Touch Controls

- **Gesture recognizer:** axis-locked swipe detection with configurable thresholds
  - `lockThreshold`: distance to lock axis (24px default)
  - `triggerThreshold`: minimum distance to fire swipe (36px default)
  - `axisRatio`: required ratio of primary to secondary axis (1.5 default)
  - `cooldownMs`: delay between consecutive swipes (80ms default)
- **Progress callbacks:** `onProgress` fires during drag with candidate direction and progress
- **Controls toolbar:** always-visible row above the board with Sound toggle, D-pad toggle (touch only), and Pause/Resume button
- **D-pad buttons:** on-screen controls for mobile (64px on touch devices), toggleable via toolbar button
- **Pause/Resume button:** visible during playing and paused states; pauses or resumes game
- **Hidden on desktop** via `@media (pointer: coarse)` for touch-only elements

### Sound Effects

- **Web Audio API** oscillators (no audio files)
- **AudioContext** created lazily via `initAudio()`, called from user gesture handlers (Start, Resume, Restart) to satisfy browser autoplay policies
- **Eat:** short sine wave chirp
- **Collision:** square wave buzz
- **Level-up:** ascending arpeggio
- **Toggle:** persisted to localStorage, shared across instances

### Accessibility

- `role="grid"` + `aria-label` on Board
- `role="gridcell"` + contextual `aria-label` on Cell
- `aria-live="polite"` on ScoreBoard for score/level changes
- Screen-reader-only `aria-live="assertive"` status announcements
- `autoFocus` on action buttons
- `.sr-only` CSS utility for off-screen text

### Environment Configuration

- `.env` file with VITE\_ prefix for Vite env vars
- `game/constants.ts` reads from `import.meta.env`

## State Machine

```
START (idle)
    ├── START_GAME → PLAYING (level 1)
    ├── START_AT_LEVEL(N) → PLAYING (level N)
    ├── PAUSE_GAME → PAUSED
    └── RESET → IDLE

PLAYING
    ├── PAUSE_GAME → PAUSED
    ├── COLLISION → GAMEOVER (save high score, update lastUnlockedLevel)
    ├── FOOD OBJECTIVE REACHED (levels 1-9) → LEVELCOMPLETE (update lastUnlockedLevel)
    └── FOOD OBJECTIVE REACHED (level 10) → WON (save high score, update lastUnlockedLevel)

PAUSED
    ├── RESUME_GAME → PLAYING
    └── SPACE → RESUME → PLAYING

LEVELCOMPLETE
    ├── CONTINUE_GAME → PLAYING (increment level, reset snake)
    └── SPACE → CONTINUE_GAME → PLAYING

GAMEOVER
    ├── RESTART → RESET → PLAYING (level 1)          [New Game]
    └── START_AT_LEVEL(N) → PLAYING (level N)        [Continue from Level N]

WON
    ├── RESTART → RESET → PLAYING (level 1)          [New Game]
    └── START_AT_LEVEL(N) → PLAYING (level N)        [Continue from Level N]

RUNNER MODE
    ├── START_RUNNER → PLAYING (isRunner=true, snake auto-advances UP)
    ├── CHANGE_LANE(-1|1) → PLAYING (shift lane, immediate head x change)
    ├── MOVE_SNAKE (collision) → GAMEOVER
    └── MOVE_SNAKE (wrap, y<0→y=19) → PLAYING (regenerate course)
```

## State Shape

```typescript
interface GameState {
  snake: Position[];
  food: Food;           // { position, type, timer }
  direction: Direction;
  nextDirection: Direction;
  status: GameStatus;
  score: number;
  highScore: number;
  level: number;
  obstacles: Position[];
  lastUnlockedLevel: number;  // Persisted to localStorage
  foodEaten: number;          // Per-level food counter
  isEndless: boolean;         // True when playing endless mode
  speedEffectTicks: number;   // Slow effect remaining ticks (0 = inactive)
  isRunner: boolean;          // True when playing runner mode
  distance: number;           // Distance traveled in runner mode
  lane: 0 | 1 | 2;            // Current lane in runner mode
  maxMultiplier: number;      // Highest multiplier tier reached this run
}
```

## Important Constants

| Constant        | Value      | Description       |
| --------------- | ---------- | ----------------- |
| GRID_SIZE       | 20         | Grid dimensions   |
| CELL_SIZE       | 20         | Reference only (no longer used for layout) |
| POINTS_PER_FOOD | 10         | Points per food   |
| INITIAL_SNAKE   | 3 segments | Starting length   |
| LEVEL_COUNT     | 10         | Total levels      |
| INITIAL_SPEED   | 150ms      | Starting speed    |
| RUNNER_LANE_X   | [4, 10, 16] | Runner lane x-coordinates |
| RUNNER_INITIAL_SPEED | 200ms  | Runner starting speed |
| RUNNER_MIN_SPEED | 80ms      | Runner minimum speed |
| RUNNER_DISTANCE_PER_POINT | 10 | Distance units per score point |
| RUNNER_VIEWPORT_TAIL | 13 | Rows visible behind snake head in viewport scrolling |
| RUNNER_SPEED_MULTIPLIER | 1.0 | Dev-only speed multiplier for validation testing |

## Styling Conventions

- **CSS Modules:** scoped per component
- **CSS Custom Properties:** centralized in `src/index.css` on `:root`
  - 18 color tokens (`--color-*`) for consistent theming
  - 3 font tokens (`--font-display`, `--font-body`, `--font-mono`)
  - Spacing, shadow, radius, and transition tokens
- **Display font:** "Press Start 2P" (self-hosted `woff2` in `public/fonts/`, pre-cached by PWA workbox)
  - Used for headings, titles, and button text
  - `font-display: swap` ensures non-blocking load
- **Numeric values:** use `--font-mono` (system mono stack) for readability
- **Level name text:** uses `--font-body` (system stack) to preserve lowercase readability
- **Glow ceiling:** max 16px blur radius, max 6 simultaneous `box-shadow` elements visible
- **Theme system:** 4 themes via `[data-theme]` attribute on `<html>`
  - Neon Arcade (default): existing `:root` tokens
  - Classic: light cream background, forest green snake, minimal glow
  - Terminal: black background, green monochrome, no glow
  - High Contrast: maximum contrast, no glow
  - New themes are addable without modifying component code
- **Dark theme tokens:** Background `--color-bg` (#1a1a2e), Surface `--color-surface` (#16213e)
- **Snake head:** `--color-accent` (#22c55e) with glow
- **Snake body:** `--color-accent-deep` (#16a34a)
- **Food:** `--color-danger` (#ef4444) with pulse animation
- **Food variants (M10):** Gold `--color-warning` (#fbbf24), Poison `--color-food-poison` (#d946ef), Slow `--color-food-slow` (#22d3ee)
- **Portals (M10):** `--color-portal` (#a855f7)
- **Obstacles:** `--color-obstacle` (#6366f1) with `--color-obstacle-edge` border

## Testing

- **Framework:** Vitest with jsdom
- **487 unit tests** across 30 test files
- **Coverage:** game/ modules (state, Engine, collision, food, snake, levels, storage, statistics, achievements, profile), hooks, utilities, touch recognizer, components (Game, Board, Cell, LevelTransition, GameOver, Statistics, Achievements, MainMenu, PauseMenu, ReadyOverlay, SettingsScreen, HelpScreen, StatisticsScreen, AchievementsScreen)
- **Run:** `npm test` or `npm run test:watch`

# Platform Strategy

Primary Platform:

- Browser

Planned Release Path:

1. Browser ✅
2. Progressive Web App (PWA) ✅
3. Capacitor mobile packaging
4. Tauri desktop packaging

### PWA Infrastructure

- **Build-time:** `vite-plugin-pwa` generates the service worker (`sw.js`), web manifest (`manifest.webmanifest`), and injects registration into `index.html`
- **Service worker:** Workbox-based, pre-caches all static assets (`**/*.{js,css,html,svg,png}`), auto-updates silently
- **Manifest:** `display: standalone`, `theme_color: #16213e`, `background_color: #1a1a2e`, SVG icon
- **Deployment:** GitHub Pages via GitHub Actions (`.github/workflows/deploy.yml`)
- **Caching:** Network-first for external resources with 24-hour cache expiration

Future architectural decisions should support this path unless superseded by an ADR.

---

# Architectural Direction

The game engine is now separated from React, enabling future platform support.

Current architecture:

- `game/` — Framework-agnostic game logic
- `platform/` — Platform-specific adapters
- `hooks/` — React integration layer
- `components/` — React UI

This separation allows:

- Independent testing of game logic
- Reuse with alternative UI frameworks
- Native mobile/desktop packaging via Capacitor/Tauri
- PWA support with minimal changes
