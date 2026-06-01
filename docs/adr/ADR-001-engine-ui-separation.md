# ADR-001: Separate Game Engine from React UI

**Status:** Accepted
**Date:** 2026-06-01
**Milestone:** 1 — Foundation Refactor

## Context

The game logic was previously tightly coupled to React through `useSnakeGame.ts`, which combined:

- A `useReducer` holding the game state
- A `useEffect` driving the `requestAnimationFrame` loop
- Sound effect side effects (`playEat`, `playCollision`, `playLevelUp`)
- The game reducer itself

This had three concrete problems:

1. **Untestable core logic** — every gameplay test had to mount React and fake timers against a `useReducer` hook, even though the state transitions are pure functions.
2. **Blocked multi-platform packaging** — PWA, Capacitor (mobile), and Tauri (desktop) targets all need to drive the same game from different runtimes. A React-coupled engine cannot be reused from a Capacitor plugin or a Tauri backend without significant duplication.
3. **Hidden coupling** — sound playback was triggered inside a React `useEffect`, mixing "what happened in the game" with "what the UI should do about it."

## Decision

Introduce a framework-agnostic `Engine` class in `src/game/` that owns the full game state, game loop, and sound event hooks. The React layer is reduced to a thin `useGame` bridge that subscribes to engine state and forwards user actions.

### Module Layout

```
src/game/
  types.ts        # GameState, GameAction, Position, Direction, Level
  constants.ts    # GRID_SIZE, INITIAL_SNAKE, KEY_MAP, …
  state.ts        # Pure gameReducer + getInitialState
  Engine.ts       # Framework-agnostic Engine class
  collision.ts    # isWallCollision, isSelfCollision, isObstacleCollision
  food.ts         # spawnFood
  snake.ts        # calculateNewHead
  levels.ts       # LEVELS table, getLevelData, generateObstacles
  storage.ts      # loadHighScore, saveHighScore
```

The React layer (`useGame.ts`) does only three things:
- Instantiate the engine (once, via `useRef`)
- Mirror engine state into React state via `subscribe`
- Forward UI actions (`start`, `pause`, `changeDirection`, …) to engine methods

### Engine API

```typescript
class Engine {
  getState(): GameState
  subscribe(listener: (state: GameState) => void): () => void
  start(): void
  pause(): void
  resume(): void
  reset(): void
  changeDirection(d: Direction): void
  destroy(): void
  onEat?: () => void
  onGameOver?: () => void
  onLevelUp?: () => void
  onWin?: () => void
}
```

Sound effects are wired by the React layer assigning callback properties to the engine — the engine itself knows nothing about Web Audio, React, or any UI library.

## Consequences

### Positive

- **Pure reducer is now directly unit-testable** — `state.test.ts` exercises `gameReducer` without React, timers, or the DOM.
- **Game engine is reusable from any host** — a Capacitor plugin, a Tauri command, or a vanilla JS host can drive the same engine.
- **Engine tests use real timers via `requestAnimationFrame`** — `Engine.test.ts` verifies the loop starts, stops on gameover, restarts on reset, and tears down on `destroy()`.
- **Cleaner sound integration** — the engine emits `onEat`/`onGameOver`/… events; any host can attach whatever effect system it wants (or none).
- **Mute toggle works** — by sharing one `SoundManager` singleton across the engine and the UI (see ADR-002).

### Negative

- **Indirection** — beginners reading `Game.tsx` must follow into `useGame` → `Engine` → `state.ts` to understand the flow. The old code was a single file.
- **Slightly more boilerplate** — the `useGame` hook has more setup than the old `useSnakeGame`, mostly to satisfy `react-hooks/refs` and `react-hooks/immutability` lint rules around the engine reference.
- **Engine callbacks can be re-assigned** — `engine.onEat = …` works, but means the engine is not "frozen" once running. We accepted this for ergonomics.

### Mitigations

- The indirection cost is paid once during code reading; subsequent changes are easier because the engine boundary is explicit.
- `useGame` is documented to show the three responsibilities (mirror state, forward actions, wire callbacks).
- The engine API is small (8 methods + 4 callbacks) — easy to learn.

## Alternatives Considered

### A. Keep `useReducer`, extract only the reducer

Move `gameReducer` to a plain function and keep everything else in React. Cheaper to do, but still couples the game loop and sound effects to React lifecycle. Rejected — does not unblock multi-platform.

### B. Full ECS / event-sourced architecture

Decouple game systems further with an entity-component-system or a pure event log. Overkill for a single-player game of this size; would delay Milestone 1 by weeks. Rejected.

### C. Keep everything but expose the engine as a thin wrapper

Make `useSnakeGame` return an object that is also directly instantiable without React. Same result as the chosen design but obscures the React-free surface. Rejected — the explicit `Engine` class makes the boundary obvious.

## References

- ARCHITECTURE.md § "Game Engine (Framework-Agnostic)"
- SPEC.md § "Game States" (state machine)
- `src/game/Engine.ts`
- `src/hooks/useGame.ts`
- `src/game/__tests__/Engine.test.ts`
- `src/game/__tests__/state.test.ts`
- `docs/ROADMAP.md` § "Milestone 1 — Foundation Refactor"
- `review.md` (issues fixed in this milestone)
