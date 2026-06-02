# Foundation Refactor Plan

## Goal

Separate game engine from React UI to enable future platform support (PWA, mobile, desktop).

## Current State

- Game logic lives in `src/hooks/useSnakeGame.ts` (React-coupled)
- Pure utilities exist in `src/utils/gameLogic.ts`
- Game types in `src/types/game.ts`

## Target Structure

```
src/
├── game/           # React-independent game engine
│   ├── Engine.ts       # Game loop, state machine
│   ├── types.ts        # Game types (moved from types/game.ts)
│   ├── state.ts        # Reducer logic (from useSnakeGame.ts)
│   ├── collision.ts    # Collision detection (from gameLogic.ts)
│   ├── food.ts         # Food spawning (from gameLogic.ts)
│   ├── snake.ts        # Snake movement helpers
│   ├── levels.ts       # Level data (from levelData.ts)
│   └── storage.ts      # High score persistence
├── platform/       # Platform-specific adapters
│   ├── keyboard.ts     # (from useKeyboard.ts)
│   ├── touch.ts        # (from useTouch.ts)
│   └── sound.ts        # (from useSound.ts)
├── ui/             # React components
│   └── components/     # (from components/)
├── hooks/          # React hooks (thin wrappers)
│   └── useGame.ts      # Wraps game engine for React
├── types/          # Shared types only
└── assets/
```

## Execution Steps

### Step 1: Create game engine types

Move game-specific types to `src/game/types.ts`. Keep React component types in `src/types/`.

**Files to create/modify:**
- Create: `src/game/types.ts` (move GameState, GameAction, Direction, Position, Level)
- Modify: `src/types/game.ts` (re-export from game/types.ts for backward compat)

**Verification:** `npm run typecheck` passes

---

### Step 2: Extract pure game logic functions

Move pure functions from `src/utils/` into `src/game/` domain modules.

**Files to create:**
- `src/game/collision.ts` - `isCollision()` from gameLogic.ts
- `src/game/food.ts` - `spawnFood()`, `positionsEqual()` from gameLogic.ts
- `src/game/snake.ts` - `calculateNewHead()`, direction constants
- `src/game/levels.ts` - `getLevelData()`, `generateObstacles()` from levelData.ts
- `src/game/storage.ts` - `loadHighScore()`, `saveHighScore()` from storage.ts

**Files to modify:**
- `src/utils/gameLogic.ts` - re-export from game/ for backward compat
- `src/utils/levelData.ts` - re-export from game/ for backward compat
- `src/utils/storage.ts` - re-export from game/ for backward compat

**Verification:** `npm test` passes, all imports still work

---

### Step 3: Extract game reducer

Move `gameReducer` and `getInitialState` to `src/game/state.ts`.

**Files to create:**
- `src/game/state.ts` - reducer logic from useSnakeGame.ts

**Files to modify:**
- `src/hooks/useSnakeGame.ts` - import reducer from game/state.ts

**Verification:** `npm test` passes

---

### Step 4: Create game engine class

Create `src/game/Engine.ts` - a framework-agnostic game engine that:
- Manages game loop (requestAnimationFrame with accumulator)
- Dispatches actions to reducer
- Emits state change events
- Exposes control methods (start, pause, resume, changeDirection, reset)

**Files to create:**
- `src/game/Engine.ts`

**Verification:** Write unit tests for Engine in `src/game/__tests__/Engine.test.ts`

---

### Step 5: Create platform adapters

Extract platform-specific logic into adapter modules.

**Files to create:**
- `src/platform/keyboard.ts` - keyboard event handling
- `src/platform/touch.ts` - touch/gesture handling
- `src/platform/sound.ts` - Web Audio API sound effects

**Files to modify:**
- `src/hooks/useKeyboard.ts` - thin wrapper around platform/keyboard.ts
- `src/hooks/useTouch.ts` - thin wrapper around platform/touch.ts
- `src/hooks/useSound.ts` - thin wrapper around platform/sound.ts

**Verification:** `npm test` passes

---

### Step 6: Create React bridge hook

Create `src/hooks/useGame.ts` that:
- Instantiates the game Engine
- Connects React state to engine events
- Returns same API as current useSnakeGame

**Files to create:**
- `src/hooks/useGame.ts`

**Files to modify:**
- `src/components/Game.tsx` - use new useGame hook

**Verification:** `npm test` passes, game plays correctly

---

### Step 7: Update documentation

Update ARCHITECTURE.md with new structure.

**Verification:** Documentation matches implementation

---

## Success Criteria

- [ ] Game engine (`src/game/`) has zero React imports
- [ ] All existing tests pass
- [ ] New engine unit tests added
- [ ] Game plays correctly in browser
- [ ] ARCHITECTURE.md updated
