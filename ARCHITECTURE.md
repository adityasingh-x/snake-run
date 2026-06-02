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
│   ├── storage.ts            # High score persistence
│   └── index.ts              # Barrel exports
├── platform/                 # Platform-specific adapters
│   ├── keyboard.ts           # Keyboard event handling
│   ├── touch.ts              # Touch/gesture handling
│   ├── sound.ts              # Web Audio API sound effects
│   └── index.ts              # Barrel exports
├── hooks/                    # React hooks (thin wrappers)
│   ├── useGame.ts            # Bridges game Engine to React
│   ├── useKeyboard.ts        # Keyboard hook (wraps platform/keyboard)
│   └── useTouch.ts           # Touch hook (wraps platform/touch)
├── components/               # React UI components
│   ├── Game.tsx              # Main game container
│   ├── Board.tsx             # Grid renderer
│   ├── Cell.tsx              # Individual cell renderer
│   ├── ScoreBoard.tsx        # Score display
│   ├── GameOver.tsx          # Win/gameover modal
│   └── *.module.css          # Component styles
├── types/                    # Shared types (re-exports from game/)
│   ├── game.ts               # Re-exports from game/types
│   └── components.ts         # Component prop types
├── utils/                    # Legacy utilities (re-exports from game/)
│   ├── constants.ts          # Re-exports from game/constants
│   ├── gameLogic.ts          # Re-exports from game/*
│   ├── levelData.ts          # Re-exports from game/levels
│   ├── storage.ts            # Re-exports from game/storage
│   └── __tests__/            # Utility tests
├── assets/                   # Static assets
├── main.tsx                  # React entry point
└── index.css                 # Global resets
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
- **Dynamic speed** based on current level (150ms → 60ms)
- **Cleanup** via `cancelAnimationFrame` on unmount/status change
- **Direction queuing** (`nextDirection`) debounces rapid key presses

### Component Architecture

- **Top-level:** `Game` orchestrates hooks and rendering
- **Hooks:** useGame, useKeyboard, useTouch
- **Pure utility functions:** testable logic in `game/` modules
- **CSS Modules:** scoped styles per component
- **Compositional rendering:** Game → ScoreBoard + Board + Overlays

### Data Flow

```
Input (Keyboard/Touch) → Platform Adapter → useGame hook → Engine →
dispatch action → gameReducer → new state → subscribe → React re-render
```

## Key Features

- **Directional Snake Eyes:** Snake head rendering includes eyes that face the current direction of movement.

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

- **10 levels** with dynamic generation
- **Progression:** target score = 50 x level number
- **Speed ramp:** 150ms → 60ms (10ms per level)
- **Obstacles:** `floor(level * 0.5)`, capped at 8
- **Level-up:** snake resets to initial position
- **Win:** complete level 10

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
    ├── START_GAME → PLAYING
    ├── PAUSE_GAME → PAUSED
    └── RESET → IDLE

PLAYING
    ├── PAUSE_GAME → PAUSED
    ├── COLLISION → GAMEOVER (save high score)
    └── LEVEL 10 → WON (save high score)

PAUSED
    ├── RESUME_GAME → PLAYING
    └── SPACE → RESUME → PLAYING

GAMEOVER
    └── RESTART → RESET → IDLE

WON
    └── RESTART → RESET → IDLE
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
| MIN_SPEED       | 60ms       | Final level speed |

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
- **116 unit tests** across 10 test files
- **Coverage:** game/ modules, Engine, hooks, utilities, touch recognizer, pause button
- **Run:** `npm test` or `npm run test:watch`

# Platform Strategy

Primary Platform:

- Browser

Planned Release Path:

1. Browser
2. Progressive Web App (PWA)
3. Capacitor mobile packaging
4. Tauri desktop packaging

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
