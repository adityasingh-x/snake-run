# ACTIVE PLAN — Milestone 13: Runner Prototype Validation

## Goal

Prove that Snake Run is more engaging as an endless runner than as a traditional
level-based snake game. This is a gameplay validation milestone — the output is
an answer to the question:

> "Is endless runner gameplay more enjoyable than the current level-based
> gameplay?"

The prototype does not need to be polished. It only needs to validate the
concept.

---

## Core Gameplay Model

```
Snake moves UP automatically (forward)
  → Player changes lanes (LEFT / RIGHT)
  → Avoids obstacles
  → Collects food
  → Grows longer
  → Crashes
  → Player hits "Play Again"
```

---

## Architecture Decision

**Extend the existing Engine with an `isRunner` flag** (same pattern used for
`isEndless`). The `MOVE_SNAKE` reducer case gets a runner branch that returns
early before level-based logic. The `CHANGE_DIRECTION` action is **not**
overloaded — a new `CHANGE_LANE` action handles lane switching directly by
modifying the snake head position immediately (zero tick delay).

**Separate `RunnerGame` component** avoids conditionally bloating `Game.tsx`.
The runner UI is fundamentally different: no D-pad, no overlays, no level
transitions, no pause, no achievements panel. A dedicated component keeps each
code path clean.

**RunnerGame handles keyboard inline** (one `useEffect` with `addEventListener`)
rather than modifying the shared `platform/keyboard.ts`. The shared keyboard
module's `DIRECTION_OPPOSITE` and status-based Space routing don't map to runner
mode. Inline handling is simpler and avoids contamination.

**Course uses Y-axis wrap-around** to create the "constantly advancing forward"
feeling. The snake moves UP each tick. When `y < 0`, the head wraps to `y = 19`.
Obstacles are static on the grid but replaced each time the snake wraps
(completes a "lap"), creating fresh challenges. This reuses the existing
wrap-around collision logic and requires no scrolling infrastructure.

---

## Existing Systems Analysis

### Reused As-Is (zero changes)

| System | Why it works for runner mode |
|--------|------------------------------|
| `collision.ts` | `isCollision`, `isWallCollision`, `isSelfCollision`, `isObstacleCollision`, `positionsEqual` — all operate on `Position[]` and don't care about game mode |
| `snake.ts` | `calculateNewHead` works for any Direction; runner always passes UP |
| `storage.ts` | `saveHighScore` uses the same `snakeHighScore` key; runner saves on gameover |
| `platform/touch.ts` | Gesture recognizer already produces LEFT/RIGHT/DOWN/UP swipes; RunnerGame filters to LEFT/RIGHT |
| `platform/sound.ts` | `playEat()`, `playCollision()` — no mode awareness needed |
| `hooks/useTouch.ts` | Accepts `onSwipe: (Direction) => void`; RunnerGame maps LEFT/RIGHT to lane changes |
| `hooks/useTheme.ts` | Theme management is orthogonal to game mode |
| `components/Board.tsx` | Renders any set of `snake`, `food`, `obstacles`, `direction` — runtime data, not mode-specific |
| `components/Cell.tsx` | Reads `foodType` from props; `'normal'` is already handled |
| `components/Screen.module.css` | Reusable screen layout styles |
| `components/MainMenu.module.css` | Reusable menu button styles |

### Modified (minor, additive)

| File | Change | Reason |
|------|--------|--------|
| `src/game/types.ts` | Add `isRunner`, `distance`, `lane` to `GameState`. Add `START_RUNNER`, `CHANGE_LANE` to `GameAction` | New state fields + actions for runner mode |
| `src/game/constants.ts` | Add `RUNNER_LANE_X`, `RUNNER_INITIAL_SPEED`, `RUNNER_MIN_SPEED`, `RUNNER_DISTANCE_PER_POINT` | Lane positions and difficulty tuning constants |
| `src/game/state.ts` | Add runner defaults to `getInitialState()`. Add `START_RUNNER` and `CHANGE_LANE` cases. Add runner short-circuit in `MOVE_SNAKE` (return early before level logic). Optional `forceType` parameter on spawnFood for runner's normal-food-only constraint. | Core runner game logic |
| `src/game/Engine.ts` | Add `startRunner()` and `changeLane()` methods. Branch speed calculation in `startLoop()` to use runner distance-based curve when `isRunner`. Include `START_RUNNER` in games-played counter. | Runner lifecycle management |
| `src/game/food.ts` | Add optional `forceType?: FoodType` parameter to `spawnFood()` | Runner mode only spawns `'normal'` food |
| `src/hooks/useGame.ts` | Expose `startRunner()`, `changeLane()` | React bridge for runner actions |
| `src/types/navigation.ts` | Add `'runner'` to `Screen` type | Screen navigation routing |
| `src/App.tsx` | Add `'runner'` screen case, import `RunnerGame`, add `handleStartRunner` callback | Navigation integration |
| `src/components/MainMenu.tsx` | Add `onStartRunner` prop. Add "Runner Mode" button after the neon divider, always visible regardless of `canContinue`. | Menu entry point |

### Obsolete (for runner mode — not used, not removed)

| System | Why not used |
|--------|-------------|
| `levels.ts` | Runner has no levels, no `getLevelData`, no `generateObstacles` by level |
| `LevelTransition.tsx` | No level transitions |
| `ReadyOverlay.tsx` | Simpler inline start prompt |
| `PauseMenu.tsx` | No pause in runner prototype |
| `GameOver.tsx` | Runner has dedicated `RunnerGameOver` |
| `ScoreBoard.tsx` | Runner has dedicated `RunnerHUD` |
| `Statistics.tsx` / `Achievements.tsx` | Out of scope for runner display |
| D-pad system in `Game.tsx` | No D-pad in runner |
| Dev level select in `Game.tsx` | No levels in runner |

These files are **not deleted**. They remain for the classic level-based game
which must stay fully functional.

### New Files

| File | Purpose |
|------|---------|
| `src/game/runnerCourse.ts` | `generateRunnerCourse()` — produces obstacle patterns and food for one lap around the grid |
| `src/components/RunnerGame.tsx` | Runner game orchestrator: owns Engine via `useGame`, keyboard, touch, HUD, game over |
| `src/components/RunnerGame.module.css` | Runner container, board wrapper, toolbar, start prompt styles |
| `src/components/RunnerHUD.tsx` | Displays Distance, Food, Length, High Score in arcade-style bar |
| `src/components/RunnerHUD.module.css` | HUD bar styles |
| `src/components/RunnerGameOver.tsx` | Game over overlay: stats + Play Again button + Menu back |
| `src/components/RunnerGameOver.module.css` | Game over overlay styles |

---

## Detailed Phase Breakdown

---

### Phase 1: Runner Types, Constants & Core Reducer Logic

**Goal:** Add the data model, state transitions, and reducer logic that make the
runner game function — without any UI. All existing tests continue to pass.

**Files:**

| File | Action |
|------|--------|
| `src/game/types.ts` | ADD to `GameState`: `isRunner: boolean`, `distance: number`, `lane: 0 \| 1 \| 2`. ADD to `GameAction`: `{ type: 'START_RUNNER' }`, `{ type: 'CHANGE_LANE'; payload: -1 \| 1 }` |
| `src/game/constants.ts` | ADD: `RUNNER_LANE_X: [number, number, number] = [4, 10, 16]`. ADD: `RUNNER_INITIAL_SPEED = 200`. ADD: `RUNNER_MIN_SPEED = 80`. ADD: `RUNNER_DISTANCE_PER_POINT = 10` |
| `src/game/state.ts` | ADD `isRunner: false`, `distance: 0`, `lane: 1` to `getInitialState()`. ADD `START_RUNNER` case after `RESET`. ADD `CHANGE_LANE` case after `CHANGE_DIRECTION`. ADD runner short-circuit at top of `MOVE_SNAKE` that returns early before level-based logic. Verify exact insertion points against the current file before editing. |
| `src/game/food.ts` | ADD optional `forceType?: FoodType` parameter to `spawnFood()`. When provided, use it instead of `rollFoodType()`. When `forceType` is `undefined`, the function falls back to `rollFoodType()` for backward compatibility with classic mode. Classic mode's existing call sites do not pass this parameter. |

**`CHANGE_LANE` reducer logic (new case, before `MOVE_SNAKE`):**

```ts
case 'CHANGE_LANE': {
  if (!state.isRunner || state.status !== 'playing') return state;
  const newLane = Math.max(0, Math.min(2, state.lane + action.payload)) as 0 | 1 | 2;
  if (newLane === state.lane) return state;
  // Tail lane blocking: prevent moving into a lane occupied by body at head's y
  const head = state.snake[0];
  const bodyAtHeadY = state.snake.slice(1).some(
    seg => seg.x === RUNNER_LANE_X[newLane] && seg.y === head.y
  );
  if (bodyAtHeadY) return state;
  // Immediately shift head x for responsive feel
  return {
    ...state,
    lane: newLane,
    snake: [{ x: RUNNER_LANE_X[newLane], y: head.y }, ...state.snake.slice(1)],
  };
}
```

**`START_RUNNER` reducer logic:**

```ts
case 'START_RUNNER': {
  const initial = getInitialState();
  const runnerSnake: Position[] = [
    { x: RUNNER_LANE_X[1], y: 18 },
    { x: RUNNER_LANE_X[1], y: 19 },
    { x: RUNNER_LANE_X[1], y: 19 }, // stacked: 3 segments in center lane at bottom
  ];
  const course = generateRunnerCourse(18, runnerSnake, 0);
  return {
    ...initial,
    snake: runnerSnake,
    food: course.food,
    direction: 'UP',
    nextDirection: 'UP',
    status: 'playing',
    isRunner: true,
    obstacles: course.obstacles,
    lastUnlockedLevel: state.lastUnlockedLevel,
    lane: 1,
  };
}
```

_Note: The initial snake is stacked vertically (same x, decreasing y) so the
first few ticks show the snake "emerging" from the bottom. The `lane: 1` starts
in center._

**`MOVE_SNAKE` runner short-circuit (insert at top of case, before existing logic):**

```ts
case 'MOVE_SNAKE': {
  if (state.isRunner) {
    const head = state.snake[0];
    let newHead: Position = { x: RUNNER_LANE_X[state.lane], y: head.y - 1 };

    // Y-axis wrap-around
    const wrapped = newHead.y < 0;
    if (wrapped) newHead = { ...newHead, y: 19 };

    // Collision (x bounds, self, obstacle — no wrapAround on walls)
    if (isCollision(newHead, state.snake, state.obstacles, false)) {
      return markGameOver(state);
    }

    const ateFood = positionsEqual(newHead, state.food.position);
    const newSnake = ateFood
      ? [newHead, ...state.snake]
      : [newHead, ...state.snake.slice(0, -1)];
    const newFoodEaten = state.foodEaten + (ateFood ? 1 : 0);
    const newDistance = state.distance + 1;

    // Score: food points (with length multiplier) + distance-based points
    const lengthMultiplier = Math.floor(state.snake.length / 5) + 1;
    let newScore = state.score + (ateFood ? POINTS_PER_FOOD * lengthMultiplier : 0);
    newScore += Math.floor(newDistance / RUNNER_DISTANCE_PER_POINT)
             - Math.floor(state.distance / RUNNER_DISTANCE_PER_POINT);

    let newFood = state.food;
    let newObstacles = state.obstacles;

    if (ateFood) {
      newFood = spawnFood(newSnake, newObstacles, [], 'normal');
    }

    // Regenerate course on wrap (new lap)
    if (wrapped) {
      const course = generateRunnerCourse(newHead.y, newSnake, newDistance);
      newObstacles = course.obstacles;
      newFood = course.food;
    }

    return {
      ...state,
      snake: newSnake,
      food: newFood,
      obstacles: newObstacles,
      direction: 'UP',
      nextDirection: 'UP',
      score: newScore,
      distance: newDistance,
      foodEaten: newFoodEaten,
    };
  }

  // … existing level-based logic unchanged below …
}
```

**Risks:**
- Adding fields to `GameState` changes the shape. Existing tests that
  snapshot/compare full state objects may need trivial updates (adding
  `isRunner: false`, `distance: 0`, `lane: 1` to expected values).
- The runner short-circuit is a large block inside an already-large function.
  Mitigation: it returns early, so the existing code path is untouched.

**Testing approach:**
- Add to `src/game/__tests__/state.test.ts`: START_RUNNER initializes correctly
  (snake at bottom center, lane=1, distance=0, obstacles generated).
- CHANGE_LANE updates lane and head x; clamped at bounds; no-op outside runner;
  tail lane blocking (rejects lane change into body-occupied lane at head Y).
- MOVE_SNAKE in runner: auto-UP movement, Y-wrap, distance increments, score
  increases with distance and food (with length multiplier), collision calls
  `markGameOver`.
- `spawnFood` with `forceType: 'normal'` returns normal food; without
  `forceType` falls back to `rollFoodType()`.
- Existing 414 tests pass: `npm test`
- `npm run lint` clean

**Acceptance criteria:**
- [ ] Reducer accepts `START_RUNNER` and `CHANGE_LANE` actions
- [ ] `MOVE_SNAKE` in runner mode moves head UP with lane x, wraps at y<0
- [ ] Collision (x out of bounds, self, obstacle) calls `markGameOver(state)`
- [ ] Food spawns only `'normal'` type in runner mode
- [ ] Score increases from both distance and food (with length-based multiplier)
- [ ] `CHANGE_LANE` blocks lane changes into a lane occupied by the snake's body at the head's y (tail lane blocking)
- [ ] `spawnFood()` falls back to `rollFoodType()` when `forceType` is `undefined`
- [ ] All existing tests pass with new state field defaults (baseline: 414 tests)

---

### Phase 2: Engine Runner Support

**Goal:** Add `startRunner()` and `changeLane()` to the Engine class, and add
runner-specific speed curve to the game loop.

**Files:**

| File | Action |
|------|--------|
| `src/game/Engine.ts` | ADD `startRunner()` method. ADD `changeLane(delta: -1 \| 1)` method. BRANCH speed calculation in `startLoop()` for runner mode. ADD `START_RUNNER` to games-played counter. |

**Speed curve (in `startLoop`):**

```ts
// In the tick function, replace the existing speed block:
let effectiveSpeed: number;
if (this.state.isRunner) {
  // Starts at RUNNER_INITIAL_SPEED, decreases by 2ms every 50 distance,
  // floors at RUNNER_MIN_SPEED
  effectiveSpeed = Math.max(
    RUNNER_MIN_SPEED,
    RUNNER_INITIAL_SPEED - Math.floor(this.state.distance / 50) * 2
  );
} else {
  const config = getLevelData(this.state.level);
  const speed = config.speed ?? 150;
  effectiveSpeed = this.state.speedEffectTicks > 0 ? speed * SLOW_EFFECT_MULTIPLIER : speed;
}
```

**`startRunner()` and `changeLane()`:**

```ts
startRunner(): void {
  this.wasPaused = false;
  this.dispatch({ type: 'START_RUNNER' });
  this.startLoop();
}

changeLane(delta: -1 | 1): void {
  this.dispatch({ type: 'CHANGE_LANE', payload: delta });
}
```

**Risks:**
- `getLevelData(state.level)` is called in the loop. When `isRunner` is true,
  `state.level` is 1 (from initial state) but this path is never reached due to
  the runner branch. No functional issue, but the import of `getLevelData`
  remains for the non-runner path.

**Testing approach:**
- Add to `src/game/__tests__/Engine.test.ts`: `startRunner()` dispatches
  START_RUNNER and starts loop; `changeLane()` dispatches CHANGE_LANE; gameover
  stops loop and saves high score; speed decreases with distance.
- All existing tests pass.

**Acceptance criteria:**
- [ ] `engine.startRunner()` starts the game loop and state is playing
- [ ] `engine.changeLane(-1)` moves lane left; `engine.changeLane(1)` moves right
- [ ] Speed starts at 200ms and decreases as distance grows
- [ ] Speed floors at 80ms
- [ ] Game over stops the loop and saves high score via `onGameOver` callback

---

### Phase 3: Runner Course Generation

**Goal:** Implement `generateRunnerCourse()` that produces obstacle patterns and
food for one lap of the grid, scaled by difficulty.

**New file:** `src/game/runnerCourse.ts`

**Design:**

```ts
import type { Position, Food } from './types';
import { RUNNER_LANE_X, GRID_SIZE } from './constants';
import { spawnFood } from './food';

export function generateRunnerCourse(
  headY: number,
  snake: Position[],
  distance: number
): { obstacles: Position[]; food: Food } {
  const difficulty = Math.min(1, distance / 500); // 0→1 over first 500 distance
  const numPatterns = 6 + Math.floor(difficulty * 6); // 6→12 patterns per lap

  const obstacles: Position[] = [];
  const rowStep = Math.floor(GRID_SIZE / numPatterns);

  for (let i = 0; i < numPatterns; i++) {
    const y = i * rowStep;
    // Skip rows too close to snake head
    if (Math.abs(y - headY) < 3) continue;

    const blockedLanes = selectBlockedLanes(difficulty);
    for (const lane of blockedLanes) {
      obstacles.push({ x: RUNNER_LANE_X[lane], y });
    }
  }

  const food = spawnFood(snake, obstacles, [], 'normal');
  return { obstacles, food };
}

function selectBlockedLanes(difficulty: number): number[] {
  const r = Math.random();
  if (r < 0.3 + difficulty * 0.2) {
    // Double blocker (2 lanes blocked)
    const lanes = [0, 1, 2];
    const keep = lanes.splice(Math.floor(Math.random() * 3), 1)[0];
    return lanes; // returns the 2 blocked lanes
  }
  // Single blocker (1 lane blocked)
  return [Math.floor(Math.random() * 3)];
}
```

Patterns scale with difficulty:
- **Low difficulty (early run):** Mostly single-lane blockers, sparse placement
- **High difficulty (late run):** More double-lane blockers, denser placement, fewer safe rows

**Risks:**
- Random generation can produce unfair patterns (all three lanes blocked at one
  row). Mitigation: `selectBlockedLanes` only returns 1 or 2 lanes, so at least
  one lane is always clear per row.
- `spawnFood` with `forceType: 'normal'` requires Phase 1's parameter addition.

**Testing approach:**
- New file `src/game/__tests__/runnerCourse.test.ts`:
  - Generated obstacles are within grid bounds
  - At least one lane is clear at any y row
  - No obstacle overlaps with snake positions
  - Food is not on an obstacle
  - Food type is always `'normal'`
  - More patterns at higher distance
  - Determinism check: run `generateRunnerCourse` 100 times with random parameters;
    verify all 100 results satisfy invariants (no row fully blocked, no obstacle
    on snake, food not on obstacle, food type is `'normal'`)

**Acceptance criteria:**
- [ ] `generateRunnerCourse` returns valid obstacle positions within grid
- [ ] Every row has at least one clear lane
- [ ] No obstacle on snake body positions
- [ ] Food is `'normal'` type, not on obstacle or snake
- [ ] Pattern count and density increase with distance

---

### Phase 4: Runner HUD & Game Over Components

**Goal:** Build the two display components RunnerGame uses: the in-game HUD bar
and the post-run game over screen. No game logic — pure presentation.

**New files:**

| File | Description |
|------|-------------|
| `src/components/RunnerHUD.tsx` | Arcade-style bar: 4 labeled stat sections (Distance, Food, Length, Best) |
| `src/components/RunnerHUD.module.css` | HUD bar layout, match existing ScoreBoard visual style |
| `src/components/RunnerGameOver.tsx` | Overlay: "Run Over!", 4 stat rows, "Play Again" (primary, autoFocus), "Menu" (secondary) |
| `src/components/RunnerGameOver.module.css` | Overlay/modal styles, match existing GameOver visual patterns |

**RunnerHUD props:**

```ts
interface RunnerHUDProps {
  distance: number;
  foodEaten: number;
  snakeLength: number;
  highScore: number;
}
```

**RunnerGameOver props:**

```ts
interface RunnerGameOverProps {
  distance: number;
  foodEaten: number;
  snakeLength: number;
  highScore: number;
  onPlayAgain: () => void;
  onReturnToMenu?: () => void;
}
```

**Design rules:**
- HUD uses existing CSS custom properties (`--color-*`, `--font-*`, `--space-*`)
- Match the visual style of `src/components/ScoreBoard.tsx` and its CSS Module —
  use the same `aria-live`, `var(--color-*)` tokens, and grid layout pattern
- GameOver overlay uses the same backdrop pattern as `GameOver.module.css`
  (`rgba(15, 23, 42, 0.95)`)
- "Play Again" button gets `autoFocus` for keyboard accessibility
- Hint text: "Press Space to play again"

**Risks:**
- Low risk — these are pure presentation components with no game logic.

**Testing approach:**
- `src/components/__tests__/RunnerHUD.test.tsx`: renders distance/food/length/high score values
- `src/components/__tests__/RunnerGameOver.test.tsx`: renders stats, Play Again
  onClick fires, Menu onClick fires, autoFocus on Play Again

**Acceptance criteria:**
- [ ] RunnerHUD displays all 4 stats with correct values
- [ ] RunnerGameOver shows distance, food, length, and high score
- [ ] "Play Again" button calls `onPlayAgain`
- [ ] "Menu" button calls `onReturnToMenu`
- [ ] Visual matches existing arcade aesthetic

---

### Phase 5: RunnerGame Component

**Goal:** Build the orchestrator component that ties Engine, Board, RunnerHUD,
RunnerGameOver, keyboard, and touch into a playable runner experience.

**New files:**

| File | Description |
|------|-------------|
| `src/components/RunnerGame.tsx` | Orchestrator: useGame hook, inline keyboard handler, useTouch hook, Board, RunnerHUD, RunnerGameOver, toolbar |
| `src/components/RunnerGame.module.css` | Container, board wrapper, toolbar, start prompt styles |

**RunnerGame structure:**

```tsx
function RunnerGame({ onNavigateToMenu }: { onNavigateToMenu?: () => void }) {
  const { state, initAudio, startRunner, changeLane } = useGame();
  const [soundOn, setSoundOn] = useState(() => sharedSoundManager.isEnabled());
  const boardRef = useRef<HTMLDivElement>(null);
  const [hasStarted, setHasStarted] = useState(false);

  const toggleSound = () => {
    sharedSoundManager.setEnabled(!sharedSoundManager.isEnabled());
    setSoundOn(sharedSoundManager.isEnabled());
  };

  // Audio callbacks
  useEffect(() => {
    const engine = /* access engine ref */;
    // Not directly possible with useGame; need to wire audio via engine callbacks
  }, []);

  // Inline keyboard: LEFT/RIGHT for lanes, Space for start/restart
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      const key = e.key;
      if (key === 'ArrowLeft' || key === 'a' || key === 'A') {
        e.preventDefault();
        changeLane(-1);
      } else if (key === 'ArrowRight' || key === 'd' || key === 'D') {
        e.preventDefault();
        changeLane(1);
      } else if (key === ' ' || key === 'Spacebar') {
        e.preventDefault();
        if (!hasStarted || state.status === 'gameover') {
          initAudio();
          startRunner();
          setHasStarted(true);
        }
      } else if (key === 'Escape') {
        e.preventDefault();
        if (onNavigateToMenu) onNavigateToMenu();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [hasStarted, state.status, changeLane, startRunner, initAudio]);

  // Touch: filter to LEFT/RIGHT swipes for lane changes
  useTouch({
    onSwipe: (dir) => {
      if (dir === 'LEFT') changeLane(-1);
      if (dir === 'RIGHT') changeLane(1);
    },
    enabled: state.status === 'playing' && state.isRunner,
    boardRef,
  });

  const isPlaying = state.status === 'playing' && state.isRunner;
  const isGameOver = state.status === 'gameover' && state.isRunner;

  return (
    <div className={styles.runnerContainer}>
      {/* Toolbar: sound toggle + menu button */}
      <div className={styles.toolbar}>
        <button onClick={toggleSound} aria-label={soundOn ? 'Mute' : 'Unmute'}>
          {soundOn ? '🔊' : '🔇'}
        </button>
        {onNavigateToMenu && (
          <button onClick={onNavigateToMenu} className={styles.toolbarBtn}>
            Menu
          </button>
        )}
      </div>

      {/* HUD */}
      <RunnerHUD
        distance={state.distance}
        foodEaten={state.foodEaten}
        snakeLength={state.snake.length}
        highScore={state.highScore}
      />

      {/* Board */}
      <div ref={boardRef} className={styles.boardWrapper}>
        <Board
          snake={state.snake}
          direction={state.direction}
          food={state.food}
          obstacles={state.obstacles}
        />
      </div>

      {/* Idle / Start Prompt — rendered outside boardRef to avoid touch handler overlap */}
      {!hasStarted && (
        <div className={styles.startOverlay}>
          <h2>Runner Mode</h2>
          <p>Press Space or tap to start</p>
          <button onClick={() => { initAudio(); startRunner(); setHasStarted(true); }}
                  autoFocus className={styles.startBtn}>
            Start
          </button>
        </div>
      )}

      {/* Game Over */}
      {isGameOver && (
        <RunnerGameOver
          distance={state.distance}
          foodEaten={state.foodEaten}
          snakeLength={state.snake.length}
          highScore={state.highScore}
          onPlayAgain={() => { initAudio(); startRunner(); }}
          onReturnToMenu={onNavigateToMenu}
        />
      )}
    </div>
  );
}
```

**Audio wiring challenge:** `useGame` wires `onEat`/`onGameOver` callbacks on the
Engine in a `useEffect`. RunnerGame needs the same audio. Since `useGame` already
does this unconditionally, the audio callbacks fire for any mode. **No change
needed** — the existing useGame audio wiring works for runner mode too.

**Engine lifecycle:** The `useGame` hook creates a new `Engine` on first render of
`RunnerGame.tsx` (`useGame.ts:10-13`). Each mount of `RunnerGame` creates a fresh
Engine. The `useEffect` cleanup at `useGame.ts:30-32` calls `engine.destroy()` on
unmount, so the previous Engine is cleaned up. Profile and high-score persistence
work across the create/destroy cycle via `localStorage`. This is the same pattern
as the classic `Game.tsx`.

**Risks:**
- The `hasStarted` flag is local component state. If the user presses Space
  rapidly, `startRunner()` could be called multiple times. Mitigation: `Engine.
  startLoop()` already guards against duplicate loops (`if (this.rafId !== null)
  return`). Calling `startRunner()` again dispatches START_RUNNER which resets
  state, which is the correct "restart" behavior.
- `useTouch` hooks into boardRef. Multiple touch handlers on the same element
  could conflict. RunnerGame uses its own board ref and mounts a separate
  `useTouch` instance.

**Testing approach:**
- `src/components/__tests__/RunnerGame.test.tsx`: renders start prompt, Start
  button dispatches, game over overlay appears after collision state, Play Again
  resets.
- Manual smoke test: `npm run dev`, click Runner Mode, play, crash, play again.

**Acceptance criteria:**
- [ ] Start prompt appears on first load
- [ ] Space or Start button begins the run
- [ ] LEFT/RIGHT keys and A/D change lanes
- [ ] LEFT/RIGHT swipes change lanes on touch devices
- [ ] Snake moves UP automatically
- [ ] Collision shows game over overlay with stats
- [ ] "Play Again" immediately restarts (under 2 seconds)
- [ ] "Menu" navigates back to main menu
- [ ] Sound toggle works
- [ ] Existing classic game remains fully functional

---

### Phase 6: Navigation Integration

**Goal:** Add the Runner Mode entry point to the main menu and route it to the
RunnerGame component via App.tsx.

**Files:**

| File | Action |
|------|--------|
| `src/types/navigation.ts` | ADD `'runner'` to `Screen` union type |
| `src/App.tsx` | IMPORT `RunnerGame`. ADD `'runner'` case that renders `<RunnerGame onNavigateToMenu={handleNavigateToMenu} />`. ADD `handleStartRunner` callback. |
| `src/components/MainMenu.tsx` | ADD `onStartRunner: () => void` prop. ADD "Runner Mode" button after the neon divider, always visible regardless of `canContinue`. | Menu entry point |

**MainMenu changes:**

```tsx
interface MainMenuProps {
  // … existing props …
  onStartRunner: () => void;  // NEW
}
```

New button added after the neon divider, always visible (not gated on
`canContinue`), before Continue/New Game buttons. Runner mode is a primary
navigation option — hiding it for new players misses the validation opportunity:

```tsx
<button
  className={`${styles.menuButton} ${styles.runnerButton}`}
  onClick={onStartRunner}
  type="button"
>
  Runner Mode
</button>
```

Use a distinct style to highlight it as the primary new mode:
`styles.runnerButton { border: 2px solid var(--color-accent); }`

**App.tsx changes:**

```tsx
import { RunnerGame } from './components/RunnerGame';

// In the render:
{screen === 'runner' && (
  <RunnerGame onNavigateToMenu={handleNavigateToMenu} />
)}
```

**Risks:**
- Two `Screen` types (`'game'` and `'runner'`) both mount Engine instances.
  When navigating between them, the old Engine must be destroyed. The `useGame`
  hook's cleanup effect handles this via `engine.destroy()` — each screen
  instance gets a fresh Engine.
- Profile refresh in App.tsx's `useEffect` should include `'runner'` screen
  check. When returning to menu from runner, profile should refresh. The current
  effect checks for `'menu'`, which is triggered on return.

**Testing approach:**
- Update `src/components/__tests__/MainMenu.test.tsx`: new button renders,
  clicking calls `onStartRunner`.
- Manual: full flow — Menu → Runner Mode → Play → Crash → Menu → Classic Game
  — all works.

**Acceptance criteria:**
- [ ] "Runner Mode" button appears on main menu
- [ ] Clicking navigates to runner screen
- [ ] Returning to menu from runner destroys Engine and refreshes profile
- [ ] Classic game ("New Game" / "Continue") still works from same menu

---

### Phase 7: Integration Verification & Documentation

**Goal:** End-to-end validation, documentation updates, and final quality checks.

**Verification steps:**

1. **`npm test`** — all existing 414 tests pass, new runner tests pass
2. **`npm run lint`** — zero errors
3. **`npm run build`** — clean production build
4. **Manual gameplay test:**
   - Start runner from menu
   - Snake moves UP automatically
   - LEFT/RIGHT lane changes work
   - Tail lane blocking prevents moving into body-occupied lanes
   - Collect food → snake grows → score increases (with length multiplier)
   - Distance increments in HUD
   - Collision with obstacle → game over overlay
   - Play Again restarts under 2 seconds
   - Return to menu works (via button or Escape key)
   - Classic mode still fully playable
5. **Mobile test:**
   - Swipe left/right changes lanes
   - Touch start works
   - Responsive layout
6. **PWA:** New component files (`RunnerGame.tsx`, `RunnerHUD.tsx`, `RunnerGameOver.tsx`, `runnerCourse.ts`, and their CSS Modules) are auto-cached by the existing workbox precache at build time. No service worker, `vite.config.ts`, or manifest changes are required.
7. **Pre-existing test flakiness:** The `state.test.ts` gold-food-timer flakiness (documented in PROJECT_STATE.md §Known Technical Debt) is not affected by M13 changes — the runner's `forceType: 'normal'` path sidesteps the non-deterministic RNG branch in `food.ts`.

**Documentation updates:**

| File | Changes |
|------|---------|
| `SPEC.md` | Add §20 Runner Mode: game overview, lane system, movement model, scoring (distance + food), HUD display, game over, controls (desktop + mobile), state machine for runner, course generation |
| `ARCHITECTURE.md` | Add RunnerGame component, runnerCourse module, lane system in architecture section. Add `isRunner`, `distance`, `lane` to state shape. Add `START_RUNNER`, `CHANGE_LANE` to actions. |
| `docs/PROJECT_STATE.md` | **CRITICAL:** The current file (v0.12.0) says `Current Milestone: Milestone 13 - Onboarding & Discoverability` and lists unrelated priorities. This contradicts ROADMAP.md and this plan. Overwrite the M13 reference to "Runner Prototype Validation." Update Current Milestone, priorities list, and In Progress to runner-specific items. Update status to Complete. Update version to 0.13.0. Update completed features with runner mode entry. Fix the stale test count (update from 392 to 414 in the Completed Features → M12 section). |
| `docs/ROADMAP.md` | Mark all M13 features as complete. Move to Completed section. Update current progress. Set M14 (Snake Growth Risk System) as next milestone. |
| `package.json` | Bump version to `0.13.0` |

**Definition of Done for Milestone 13:**

- [ ] Runner Mode playable from main menu
- [ ] Snake auto-advances UP; LEFT/RIGHT change lanes
- [ ] Tail lane blocking prevents changing into body-occupied lanes
- [ ] Three-lane system responsive and clear
- [ ] Obstacles continuously appear; collision calls `markGameOver`
- [ ] Food in lanes; collection increases score (with length multiplier) and length
- [ ] Distance-based scoring with HUD display
- [ ] Game over shows run stats; Play Again under 2 seconds
- [ ] Classic level-based game remains fully functional
- [ ] All tests pass (existing 414 + new)
- [ ] Lint clean
- [ ] Build clean
- [ ] PWA precache includes all new files
- [ ] All documentation updated and consistent (incl. PROJECT_STATE.md M13 reference fix)
- [ ] `package.json` version bumped to `0.13.0`
- [ ] **Success Question answerable:** team can evaluate whether the base runner loop is engaging

---

## Prototype Limitations

M13 validates the **base runner loop** (advance + collect + avoid), not the full
concept (endless runner feel + snake growth risk + content variety). The following
limitations are intentional for this prototype and are addressed in future milestones:

| Limitation | Impact on Validation | Future Milestone |
|---|---|---|
| Y-axis wrap-around (teleport at y=0→19) | Player experience is "climbing and falling" rather than "continuous running." A negative gameplay verdict may reflect the wrap approach, not the runner concept itself. | M14+ scrolling-world render offset |
| Trivial lane decisions (only single/double blockers, 3 lanes) | Skill depth is minimal. Lane choices are binary. | M15 obstacle pattern library |
| Growth is mostly cosmetic | Snake length does not create navigation risk (tail lane blocking mitigates this partially). Risk-reward from length is absent. | M14 growth risk system |
| No near-miss feedback, milestone feedback, or visual juice | Engagement signals are limited to eat/collision sounds. | M18 visual/audio polish |
| Shared high score key (`snakeHighScore`) between classic and runner | A runner run overwrites a classic high score. Acceptable for validation; separate leaderboards deferred. | M14+ |

**A "no" on the M13 prototype is not necessarily a "no" on the runner concept.**
If playtesters report the prototype as boring, the team must distinguish between
"the concept is wrong" and "the prototype implementation is too minimal." The
playtest protocol below is designed to capture this distinction.

## Scrolling-World Feasibility Note

If playtesting surfaces feedback like "this doesn't feel like an endless runner"
or "the teleport is disorienting," the team should create a
`docs/M14_SCROLLING_WORLD_FEASIBILITY.md` note capturing design constraints for a
M14+ scrolling implementation. A partial scroll offset in the Board renderer
(snake and obstacles at the same coordinates, Board translates them visually by
a sub-cell offset) gives the feel of continuous motion without restructuring game
state. Estimated effort: 1–2 hours. Do not commit to a specific approach in M13,
but commit to **not** interpreting a Y-wrap "no" as a concept "no."

## Structured Playtest Protocol

To distinguish prototype issues from concept issues, conduct post-implementation
playtesting with the following protocol:

1. **Minimum playtester count: 5.** Below 5, individual preferences dominate.
2. **Standardized opening:** Each playtester plays the same 60-second intro, then
   runs freely.
3. **Post-play interview (3 questions):**
   - "Did this feel like an endless runner?" (Yes / No / Unsure → "Why?")
   - "What was the most engaging moment?" (open answer)
   - "What was the most boring moment?" (open answer)
4. **Result categorization:**
   - "Concept issue" — playtester says the *idea* of a snake runner doesn't appeal.
   - "Prototype issue" — playtester says the *implementation* didn't deliver.
   - "Both" — playtester mentions both.
5. **Validation verdict:**
   - "Yes, validate" — majority say "Concept issue: no."
   - "No, reject" — majority say "Concept issue: yes."
   - "Indeterminate" — majority say "Prototype issue" or "Both." The M13
     prototype is insufficient; M14 should iterate before concluding.

---

## Out of Scope (Explicitly)

- Gold food, poison food, slow food (M16)
- Advanced score multipliers / combo systems (M14; basic length-based multiplier is in M13)
- Risk routes / branching paths (M14)
- Growth milestones with visual/audio feedback (M14)
- Obstacle pattern library beyond single/double blockers (M15)
- Near-miss design (M15)
- Difficulty director beyond basic speed ramp (M15)
- Runner events (food rush, survival sections) (M15)
- Health, shields, recovery mechanics (M16)
- Magnet, slow-motion, shield powerups (M16)
- Food chains, combo system (M16)
- Missions (M17)
- Achievement integration for runner mode (M17)
- Statistics integration for runner mode (M17)
- Unlockables, skins, themes (M17)
- Visual polish, effects, animations (M18)
- Audio beyond existing eat/collision sounds (M18)
- Pause functionality in runner mode
- D-pad in runner mode
- Online features, leaderboards
- Story or narrative systems

---

## Implementation Order

Execute phases sequentially (1 → 2 → 3 → 4 → 5 → 6 → 7). Each phase is
verifiable independently:

1. **Phases 1-3** can be developed together (engine + reducer + course generation) since they're tightly coupled game logic. Verify with unit tests after each phase.
2. **Phases 4-5** (UI components) depend on Phase 1-3 completion. Verify with component tests.
3. **Phase 6** (navigation) wires everything together. Verify with integration tests and manual testing.
4. **Phase 7** (documentation + final verification) is the final gate.

No phase requires code from future phases.
