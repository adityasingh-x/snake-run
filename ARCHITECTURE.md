# Snake Game — Codebase Map

## Technology Stack

- **Language:** TypeScript 6.0+ (strict mode)
- **Framework:** React 19
- **Build Tool:** Vite 8
- **Test Framework:** Vitest with jsdom
- **CSS:** CSS Modules (scoped component styles)
- **Audio:** Web Audio API (no asset files)

## Core Functionality

Classic Snake game on a 20x20 grid. Players control a snake that grows by eating food. Game ends on collision with walls, self, or obstacles. Win by completing all 10 levels.

## Project Structure

```
src/
├── components/
│   ├── Cell.tsx              # Individual grid cell renderer
│   ├── Cell.module.css
│   ├── Board.tsx             # Grid container with cell generation
│   ├── Board.module.css
│   ├── Game.tsx              # Main game container with overlays
│   ├── Game.module.css
│   ├── GameOver.tsx          # Win/gameover modal (variant prop)
│   ├── ScoreBoard.tsx        # Score display + sound toggle
│   └── ScoreBoard.module.css
├── hooks/
│   ├── useKeyboard.ts        # Keyboard event handling
│   ├── useSnakeGame.ts       # Main game logic + reducer
│   ├── useSound.ts           # Web Audio API sound effects
│   └── useTouch.ts           # Touch swipe detection + D-pad
├── utils/
│   ├── constants.ts          # Reads from import.meta.env
│   ├── gameLogic.ts          # Collision detection, food spawning
│   ├── levelData.ts          # Level configuration
│   ├── storage.ts            # localStorage high score
│   └── __tests__/
│       ├── gameLogic.test.ts     # 25 unit tests
│       ├── levelData.test.ts     # 18 unit tests
│       ├── useSnakeGame.test.ts  # 24 unit tests
│       └── storage.test.ts       # 8 unit tests
├── types/
│   ├── game.ts               # GameState, GameAction, Direction
│   └── components.ts         # BoardProps, CellProps, etc.
├── main.tsx                  # React entry point
└── index.css                 # Global resets, .sr-only utility
```

Root config files:
- `vite.config.ts` — sourcemaps, `--host` preview
- `vitest.config.ts` — extends vite.config, jsdom environment
- `.env` — VITE_GRID_SIZE, VITE_CELL_SIZE, VITE_POINTS_PER_FOOD, VITE_LEVEL_COUNT

## Architecture & Design Patterns

### State Management
- **useReducer** with single `gameReducer` function
- **Single source of truth** — all game state in one `GameState` object
- **Action dispatch** via `GameAction` discriminated union: START_GAME, PAUSE_GAME, RESUME_GAME, MOVE_SNAKE, CHANGE_DIRECTION, RESET

### Game Loop Pattern
- **requestAnimationFrame** with accumulator pattern (not setInterval)
- **Dynamic speed** based on current level (150ms → 60ms)
- **Cleanup** via `cancelAnimationFrame` on unmount/status change
- **Direction queuing** (`nextDirection`) debounces rapid key presses

### Component Architecture
- **Top-level:** `Game` orchestrates hooks and rendering
- **Hooks:** useKeyboard, useTouch, useSound, useSnakeGame
- **Pure utility functions:** testable logic in `gameLogic.ts`
- **CSS Modules:** scoped styles per component
- **Compositional rendering:** Game → ScoreBoard + Board + Overlays

### Data Flow
```
Keyboard/Touch Input → useKeyboard/useTouch → dispatch CHANGE_DIRECTION →
reducer updates nextDirection → MOVE_SNAKE action →
reducer calculates new head → collision check →
level up / game over / normal move → re-render
```

## Key Features

### Collision Detection
1. **Wall collision:** bounds check
2. **Self collision:** checks all segments except tail
3. **Obstacle collision:** Set-based lookup
- Combined via `isCollision()` utility

### Food Spawning
- Random position within grid bounds
- Excludes snake body and obstacles
- Uses Set for O(1) lookup
- Max attempts limit prevents infinite loops
- Fallback to snake head if grid fills

### Level System
- **10 levels** with dynamic generation
- **Progression:** target score = 50 x level number
- **Speed ramp:** 150ms → 60ms (10ms per level)
- **Obstacles:** `floor(level * 0.5)`, capped at 8
- **Level-up:** snake resets to initial position
- **Win:** complete level 10

### Touch Controls
- **Swipe gestures:** 30px threshold, maps to Direction
- **D-pad buttons:** on-screen controls for mobile
- **Hidden on desktop** via `@media (hover: none) and (pointer: coarse)`

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
- `.env` file with VITE_ prefix for Vite env vars
- `constants.ts` reads from `import.meta.env`

## State Machine

```
START (idle)
    ├── START_GAME → PLAYING
    ├── PAUSE_GAME → PAUSED
    └── RESET → IDLE

PLAYING
    ├── PAUSE_GAME → PAUSED
    ├── COLLISION → GAMEOVER (save high score)
    └── LEVEL 10 → WON (save high score)

PAUSED
    ├── RESUME_GAME → PLAYING
    └── SPACE → RESET → IDLE

GAMEOVER
    └── RESTART → RESET → IDLE

WON
    └── RESTART → RESET → IDLE
```

## Important Constants

| Constant | Value | Description |
|----------|-------|-------------|
| GRID_SIZE | 20 | Grid dimensions |
| CELL_SIZE | 20 | Each cell is 20px |
| POINTS_PER_FOOD | 10 | Points per food |
| INITIAL_SNAKE | 3 segments | Starting length |
| LEVEL_COUNT | 10 | Total levels |
| INITIAL_SPEED | 150ms | Starting speed |
| MIN_SPEED | 60ms | Final level speed |

## Styling Conventions

- **Dark theme:** Background #1a1a2e, Card #16213e
- **Snake head:** Green #22c55e with glow
- **Snake body:** Darker green #16a34a
- **Food:** Red #ef4444 with pulse animation
- **Obstacles:** Indigo #6366f1 with border
- **Typography:** System fonts
- **CSS Modules:** scoped per component

## Testing

- **Framework:** Vitest with jsdom
- **75 unit tests** across 4 test files
- **Coverage:** gameLogic.ts (25 tests), levelData.ts (18 tests), useSnakeGame.ts (24 tests), storage.ts (8 tests)
- **Run:** `npm test` or `npm run test:watch`
