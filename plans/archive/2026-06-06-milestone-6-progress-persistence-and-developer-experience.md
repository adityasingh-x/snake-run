# Milestone 6 — Progress Persistence & Developer Experience

## Status: Draft (Ready for Implementation)

---

## Overview

Three features derived from the ROADMAP:

1. **Continue From Last Reached Level** — persist highest unlocked level, let players resume from it after game over
2. **New Game Option** — explicit "New Game" button to restart from Level 1 (complementing Continue)
3. **Developer Level Select** — dev-only dropdown to jump to any level instantly

---

## Definition of Done (Milestone)

- [ ] `lastUnlockedLevel` persisted to localStorage across browser sessions
- [ ] GameOver and Win screens show "Continue from Level N" button when `lastUnlockedLevel > 1`
- [ ] "New Game" / "Play Again" starts from Level 1 (current behavior, now explicit)
- [ ] Dev level select visible only when `import.meta.env.DEV`, absent from production
- [ ] Continue starts at beginning of selected level with fresh snake, score=0, correct obstacles
- [ ] All unit tests pass (`npm test`), no regressions in existing 143 tests
- [ ] `npm run build` compiles with zero errors
- [ ] `npm run lint` passes with zero errors
- [ ] SPEC.md updated with new state machine transitions and persistence keys
- [ ] No new architectural abstractions or framework additions. Existing state machine shape preserved (no new statuses); one new transition (`START_AT_LEVEL`) and one new persisted field (`lastUnlockedLevel`) added.

---

## Files Expected to Change

| File | Change |
|------|--------|
| `src/game/types.ts` | New field + action |
| `src/game/storage.ts` | Two new functions |
| `src/game/state.ts` | New action, level tracking |
| `src/game/Engine.ts` | New method + persistence call |
| `src/game/index.ts` | New exports |
| `src/hooks/useGame.ts` | Expose `startGameAtLevel` |
| `src/types/components.ts` | Update `GameOverProps` |
| `src/components/GameOver.tsx` | Dual-button layout |
| `src/components/GameOver.module.css` | Minor style additions |
| `src/components/Game.tsx` | Wire callbacks + dev select |
| `src/game/__tests__/state.test.ts` | New test cases |
| `src/game/__tests__/Engine.test.ts` | New test cases |
| `src/utils/__tests__/storage.test.ts` | New test cases |
| `src/components/__tests__/Game.test.tsx` | Updated tests |
| `SPEC.md` | State machine + persistence docs |
| `ARCHITECTURE.md` | State machine diagram + test count |
| `package.json` | Version bump to 0.6.0 |

**17 files total.** No new files. No new packages.

---

## Phase 1: Persistence Layer

**Goal:** Add localStorage read/write for `lastUnlockedLevel`.

### Files: `src/game/storage.ts`

```ts
// New localStorage key
const LAST_UNLOCKED_KEY = 'snakeLastUnlockedLevel';

export function loadLastUnlockedLevel(): number {
  const val = localStorage.getItem(LAST_UNLOCKED_KEY) || '1';
  const parsed = parseInt(val, 10);
  return Number.isNaN(parsed) ? 1 : parsed;
}

export function saveLastUnlockedLevel(level: number): void {
  const current = loadLastUnlockedLevel();
  if (level > current) {
    localStorage.setItem(LAST_UNLOCKED_KEY, level.toString());
  }
}
```

- `loadLastUnlockedLevel` defaults to `1` if missing/corrupted (matching existing `loadHighScore` pattern)
- `saveLastUnlockedLevel` only writes when `level > current` (no unnecessary writes)

### Files: `src/game/index.ts`
- Export `loadLastUnlockedLevel` and `saveLastUnlockedLevel`

Note: The test file `src/utils/__tests__/storage.test.ts` imports through the legacy re-export `src/utils/storage.ts`. The new functions must also be re-exported from `src/utils/storage.ts` for existing tests to access them (or add a new test file `src/game/__tests__/storage.test.ts` that imports directly from `../storage`).

**Verification:** Existing storage tests pass. New unit tests in Phase 7 test these functions directly.

---

## Phase 2: State & Reducer

**Goal:** Add `lastUnlockedLevel` to game state. Add `START_AT_LEVEL` action. Track level unlocks.

### 2a: Types (`src/game/types.ts`)

Add to `GameState`:
```ts
lastUnlockedLevel: number;
```

Add to `GameAction`:
```ts
| { type: 'START_AT_LEVEL'; payload: number }
```

### 2b: Reducer (`src/game/state.ts`)

**In `getInitialState()`:**
```ts
lastUnlockedLevel: loadLastUnlockedLevel(),
```

**New action handler:**
```ts
case 'START_AT_LEVEL': {
  const level = Math.min(Math.max(1, action.payload), LEVEL_COUNT);
  const obstacles = generateObstacles(level);
  const food = spawnFood(INITIAL_SNAKE, obstacles);
  return {
    ...state,
    snake: [...INITIAL_SNAKE],
    food,
    direction: 'RIGHT',
    nextDirection: 'RIGHT',
    status: 'playing',
    score: 0,
    level,
    obstacles,
  };
}
```

Clamps `level` to `[1, LEVEL_COUNT]` for safety. Preserves `highScore` and `lastUnlockedLevel` from current state.

**Update `MOVE_SNAKE` paths to track `lastUnlockedLevel`:**

In the `levelComplete` branch (after score reaches target, levels 1-9):
```ts
lastUnlockedLevel: Math.max(state.lastUnlockedLevel, state.level + 1),
```

In the `won` branch (level 10 complete):
```ts
lastUnlockedLevel: Math.max(state.lastUnlockedLevel, state.level),
```

In the `gameover` branch (`markGameOver`):
```ts
lastUnlockedLevel: Math.max(state.lastUnlockedLevel, state.level),
```

Update `markGameOver` to accept and return the full state:
```ts
function markGameOver(state: GameState): GameState {
  return {
    ...state,
    status: 'gameover',
    highScore: Math.max(state.highScore, state.score),
    lastUnlockedLevel: Math.max(state.lastUnlockedLevel, state.level),
  };
}
```

**`RESET` / `START_GAME`:** Preserve `lastUnlockedLevel` (no change — current code spreads from `getInitialState()` which now includes it).

**`CONTINUE_GAME`:** Preserve `lastUnlockedLevel` (no change needed — it's spread implicitly).

**Verification:** Phase 7 tests verify each transition updates `lastUnlockedLevel` correctly.

---

## Phase 3: Engine & Hook Integration

**Goal:** Add `startAtLevel()` method to Engine. Persist `lastUnlockedLevel` to localStorage. Expose via React hook.

### 3a: Engine (`src/game/Engine.ts`)

**New method:**
```ts
startAtLevel(level: number): void {
  this.dispatch({ type: 'START_AT_LEVEL', payload: level });
  this.startLoop();
}
```

**Persist `lastUnlockedLevel` in `dispatch()`:**

Add after the existing `saveHighScore` calls:
```ts
// Inside dispatch(), after reducer is called and status checks:
if (this.state.status === 'gameover' || this.state.status === 'won') {
  saveHighScore(this.state.score);
  saveLastUnlockedLevel(this.state.lastUnlockedLevel);
}
if (this.state.status === 'levelComplete') {
  saveLastUnlockedLevel(this.state.lastUnlockedLevel);
}
```

Note: `saveLastUnlockedLevel` only writes if the new value exceeds the stored value, so repeated calls from the same session have no side effect.

Note: `startAtLevel(N)` from a lower level fires `onLevelUp` once (the level-up sound plays). This is intentional — the player has moved to a new level. If the dev experience later needs silence, gate the callback on a dev flag.

### 3b: Hook (`src/hooks/useGame.ts`)

**Add to return value:**
```ts
const startGameAtLevel = useCallback((level: number) => {
  engineRef.current?.startAtLevel(level);
}, []);

return {
  state,
  initAudio,
  startGame,
  startGameAtLevel,   // NEW
  pauseGame,
  resumeGame,
  changeDirection,
  resetGame,
  continueGame,
};
```

**Verification:** State transitions verified by existing and new unit tests. Engine loop starts correctly when `startAtLevel` is called from `idle`/`gameover`/`won`.

---

## Phase 4: GameOver Component

**Goal:** Show "Continue from Level N" button when `lastUnlockedLevel > 1`, alongside explicit "New Game" option.

### 4a: Props (`src/types/components.ts`)

```ts
export interface GameOverProps {
  score: number;
  onRestart: () => void;
  onContinueFromLevel: (level: number) => void;  // NEW
  lastUnlockedLevel: number;                      // NEW
  variant?: 'gameover' | 'win';
}
```

### 4b: Component (`src/components/GameOver.tsx`)

When `lastUnlockedLevel > 1`, show two buttons in a vertical stack:
1. **"Continue from Level {N}"** (primary, green, `autoFocus`) — calls `onContinueFromLevel(lastUnlockedLevel)`
2. **"New Game"** (secondary/muted style) — calls `onRestart` (starts from Level 1)

When `lastUnlockedLevel === 1`, show only "Play Again" (identical to current behavior).

```tsx
export const GameOver = ({ score, onRestart, onContinueFromLevel, lastUnlockedLevel, variant = 'gameover' }: GameOverProps) => {
  const isWin = variant === 'win';

  return (
    <div className={styles.gameOverOverlay}>
      <div className={styles.gameOverModal} data-win={isWin || undefined}>
        <h2>{isWin ? 'You Win!' : 'Game Over!'}</h2>
        <p className={styles.finalScore}>
          {isWin ? `You completed the game! Score: ${score}` : `Your score: ${score}`}
        </p>
        {lastUnlockedLevel > 1 ? (
          <>
            <button className={styles.restartButton} onClick={() => onContinueFromLevel(lastUnlockedLevel)} autoFocus>
              Continue from Level {lastUnlockedLevel}
            </button>
            <button className={styles.secondaryButton} onClick={onRestart}>
              New Game
            </button>
          </>
        ) : (
          <>
            <button className={styles.restartButton} onClick={onRestart} autoFocus>
              Play Again
            </button>
          </>
        )}
        <p className={styles.hint}>
          {lastUnlockedLevel > 1 ? 'Press Space for new game — click Continue to resume' : 'Press Space to restart'}
        </p>
      </div>
    </div>
  );
};
```

### 4c: Styles (`src/components/GameOver.module.css`)

Add `.secondaryButton` class:
```css
.secondaryButton {
  background: transparent;
  color: #94a3b8;
  border: 2px solid #475569;
  padding: 12px 32px;
  font-size: 1.1rem;
  font-weight: 700;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  margin-bottom: 8px;
}
.secondaryButton:hover {
  background: rgba(71, 85, 105, 0.3);
  color: #f8fafc;
}
```

**Verification:** Component tests verify both layouts render correctly. Snapshot/manual check confirms styling.

**Button label note:** The `lastUnlockedLevel === 1` path shows "Play Again"; the `lastUnlockedLevel > 1` path shows "New Game" as the secondary label. Both call the same `onRestart` handler and start from Level 1. The label difference is intentional: "New Game" provides contrast against "Continue from Level N" when a choice is presented; "Play Again" is used when the choice is absent and a single action is available.

---

## Phase 5: Game Component Wiring

**Goal:** Wire `lastUnlockedLevel` through to GameOver. Connect new callbacks from useGame. Add dev level select.

### 5a: Game component (`src/components/Game.tsx`)

**Destructure new hook return:**
```ts
const {
  state,
  initAudio,
  startGame,
  startGameAtLevel,
  pauseGame,
  resumeGame,
  changeDirection,
  resetGame,
  continueGame,
} = useGame();
```

**Add handler:**
```ts
const handleStartAtLevel = useCallback((level: number) => {
  initAudio();
  startGameAtLevel(level);
}, [initAudio, startGameAtLevel]);
```

**Update GameOver usage (both gameover and won paths):**
```tsx
{state.status === 'gameover' && (
  <GameOver
    score={state.score}
    onRestart={handleRestart}
    onContinueFromLevel={handleStartAtLevel}
    lastUnlockedLevel={state.lastUnlockedLevel}
  />
)}
{state.status === 'won' && (
  <GameOver
    score={state.score}
    onRestart={handleRestart}
    onContinueFromLevel={handleStartAtLevel}
    lastUnlockedLevel={state.lastUnlockedLevel}
    variant="win"
  />
)}
```

**Keyboard behavior:** No changes needed. Space bar on gameover/won continues to trigger `handleRestart` → `resetGame()` (starts from Level 1). This is intentional — Space = "New Game", click = "Continue" avoids accidental continues. This is already consistent with the Space key mapping in `platform/keyboard.ts`.

### 5b: Dev Level Select

Add below the title, above the ScoreBoard, guarded by `import.meta.env.DEV`:

```tsx
{import.meta.env.DEV && (
  <div className={styles.devSelect}>
    <select
      className={styles.devSelectDropdown}
      value={devLevel}
      onChange={(e) => setDevLevel(Number(e.target.value))}
      aria-label="Developer level select"
    >
      {Array.from({ length: LEVEL_COUNT }, (_, i) => i + 1).map((n) => (
        <option key={n} value={n}>Level {n}</option>
      ))}
    </select>
    <button
      className={styles.devSelectBtn}
      onClick={() => handleStartAtLevel(devLevel)}
      type="button"
    >
      Go
    </button>
  </div>
)}
```

Add state: `const [devLevel, setDevLevel] = useState(1);`

Import `LEVEL_COUNT` from `'../game/constants'`.

### 5c: Dev select styles (`src/components/Game.module.css`)

```css
.devSelect {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-bottom: 8px;
}

.devSelectDropdown {
  background: rgba(15, 23, 42, 0.7);
  color: #f8fafc;
  border: 2px solid #475569;
  border-radius: 6px;
  padding: 6px 12px;
  font-size: 0.9rem;
  cursor: pointer;
}

.devSelectBtn {
  background: #4ade80;
  color: #0f172a;
  border: none;
  padding: 6px 16px;
  font-size: 0.9rem;
  font-weight: 700;
  border-radius: 6px;
  cursor: pointer;
}
```

**Verification:** 
- In `npm run dev`: dev select appears and works.
- In `npm run build` + `npm run preview`: dev select is absent.
- Existing Game tests still pass.

---

## Phase 6: Status Announcement Update

**Goal:** Update screen reader announcements to include the continue option context.

### File: `src/components/Game.tsx`

Update `STATUS_ANNOUNCEMENTS`:
```ts
gameover: 'Game over! Press Space for new game or click Continue.',
won: 'You won! Press Space for new game or click Continue.',
```

**Verification:** No behavior change, just improved accessibility text.

---

## Phase 7: Testing

### 7a: Storage Tests (`src/utils/__tests__/storage.test.ts`)

New test cases (add to existing describe block):
- `loadLastUnlockedLevel` returns 1 when key is missing
- `loadLastUnlockedLevel` returns parsed value when key exists
- `loadLastUnlockedLevel` returns 1 when value is corrupted
- `saveLastUnlockedLevel` writes when level > stored
- `saveLastUnlockedLevel` does not overwrite when level <= stored
- `saveLastUnlockedLevel` writes "1" when initial state is empty

### 7b: State Tests (`src/game/__tests__/state.test.ts`)

New test cases:

**START_AT_LEVEL:**
- `START_AT_LEVEL(3)` sets level=3, score=0, status=playing, resets snake
- `START_AT_LEVEL(3)` generates correct obstacles for level 3
- `START_AT_LEVEL(999)` clamps to `LEVEL_COUNT`
- `START_AT_LEVEL(0)` clamps to 1
- `START_AT_LEVEL` preserves `highScore` and `lastUnlockedLevel`

**lastUnlockedLevel tracking:**
- `levelComplete` transition sets `lastUnlockedLevel = level + 1`
- `gameover` transition preserves `lastUnlockedLevel >= current level`
- `won` transition preserves `lastUnlockedLevel >= current level`
- `START_GAME` preserves `lastUnlockedLevel` (does not reset to 1)
- Multiple level completions accumulate correctly (level 1 → 2, then 2 → 3)

### 7c: GameOver Component Tests (`src/components/__tests__/`)

New test file `GameOver.test.tsx` (or extend existing):
- Renders single "Play Again" button when `lastUnlockedLevel === 1`
- Renders "Continue from Level N" and "New Game" buttons when `lastUnlockedLevel > 1`
- "Continue" button calls `onContinueFromLevel` with correct level
- "New Game" button calls `onRestart`
- Win variant still works with both layouts

### 7d: Game Component Tests (`src/components/__tests__/Game.test.tsx`)

**Mock update (required — implements without this causes test render crash):**
- Add `startGameAtLevel: vi.fn()` to both `mockUseGame.mockReturnValue(...)` calls (lines 47-56 and 64-75 of the test file).

**Test updates:**
- Update existing tests to account for new GameOver props.
- Add test: `lastUnlockedLevel` is passed through to GameOver overlay.

**Dev select in test environment:**
- `import.meta.env.DEV` is `true` in Vitest, so the dev select renders in every `Game.test.tsx` render.
- Existing tests use targeted queries (`getByRole('button', { name: /pause game/i })`) and are unaffected.
- Tests that count or iterate all buttons should filter by accessible name.

### 7e: Engine Tests (`src/game/__tests__/Engine.test.ts`)

New describe block `startAtLevel` (mirrors the existing `continueGame` describe block):

- `startAtLevel(5) from idle` — starts playing at level 5, loop runs (snake moves after `vi.advanceTimersByTime`)
- `startAtLevel(3) from gameover` (via `setState`) — starts playing at level 3
- `startAtLevel` clamping through `Engine` — `startAtLevel(999)` results in `state.level === LEVEL_COUNT` (clamping is the reducer's job; assert it propagates through the engine)
- Loop starts after `startAtLevel(1)` — snake position changes after `vi.advanceTimersByTime(500)`

New describe block `lastUnlockedLevel persistence`:

- `beforeEach`: `localStorage.clear()`
- On `gameover` (via `setState` + `dispatch({ type: 'MOVE_SNAKE' })` to crash into wall): asserts `localStorage.getItem('snakeLastUnlockedLevel')` matches current level
- On `won` (via `setState` + `dispatch` on level 10): asserts `localStorage.getItem('snakeLastUnlockedLevel')` matches
- On `levelComplete` (via `setState` + `dispatch`): asserts `localStorage.getItem('snakeLastUnlockedLevel')` matches `state.level + 1`

**Verification:** `npm test` — all tests pass. Target: ~170 total tests (up from 143).

---

## Phase 8: Documentation

### 8a: SPEC.md

**Add to Section 12 (Persistence):**

New subsection **12.3 Level Progress**:

```markdown
### 12.3 Level Progress
- **Storage key:** `snakeLastUnlockedLevel`
- **Type:** number (string in localStorage)
- **Default:** 1
- **Save:** When player reaches `levelComplete`, `gameover`, or `won`
- **Value:** Highest level the player has unlocked (the next level after a completed level, or the current level on gameover/win)
- **Load:** On game init via `loadLastUnlockedLevel()`
```

**Update Section 7.1 (State Machine):** Add `START_AT_LEVEL` transitions:

```
idle
  START_GAME -> playing (level 1)
  START_AT_LEVEL(N) -> playing (level N)
  PAUSE_GAME -> paused

gameover
  RESTART -> playing (level 1)          [New Game]
  START_AT_LEVEL(N) -> playing (level N) [Continue from Level N]

won
  RESTART -> playing (level 1)          [New Game]
  START_AT_LEVEL(N) -> playing (level N) [Continue from Level N]
```

**Update Section 7.2 (State Descriptions):**

Annotate `gameover` and `won` rows: add "Continue from Level N" button description.

**Update Section 10.5 (GameOver shared component):**

Replace the second sentence ("Both: Play Again button + 'Press Space to restart' hint") with:

> Renders a single "Play Again" button when `lastUnlockedLevel === 1`. When `lastUnlockedLevel > 1`, renders "Continue from Level N" (primary, green, `autoFocus`) and "New Game" (secondary, muted) buttons. The hint text adapts: "Press Space for new game — click Continue to resume" when a continue option is available, otherwise "Press Space to restart".

**Update Section 17 (Known Limitations):**

Remove limitation #3: "No difficulty scaling between games — each START_GAME resets to level 1" — this is now addressed by the Continue feature.

Remove limitation #4: "No undo or continue-after-death" — addressed by the new Continue feature via localStorage persistence and the GameOver overlay's "Continue from Level N" button.

Update limitation #2 to note: "High score is local only (no level progress sync across browsers/devices yet)".

### 8b: SPEC.md — Keyboard (Section 8.1)

Add note: Space on gameover/won triggers "New Game" (Level 1). "Continue from Level N" requires a click/tap.

### 8c: ARCHITECTURE.md

Two changes:

1. **State machine diagram (Section 7.1):** Add three `START_AT_LEVEL(N) -> playing (level N)` transitions to the `idle`, `gameover`, and `won` states. Add the `lastUnlockedLevel` field to the state shape diagram.

2. **Testing count (Section 9):** Update the unit test count from "143 unit tests" to the actual post-milestone count reported by `npm test`.

### 8d: ROADMAP.md & PROJECT_STATE.md

Update AFTER all implementation and verification is complete. These are not updated in this plan phase.

### 8e: package.json

Change `"version": "0.5.0"` to `"version": "0.6.0"` to match the milestone release cadence.

---

## Risks & Assumptions

| Risk | Mitigation |
|------|------------|
| `import.meta.env.DEV` detection for dev select relies on Vite behavior; could break with build tool changes | Low risk — standard Vite feature, stable across major versions. Production build tree-shakes dead code naturally. |
| localStorage `lastUnlockedLevel` persistence may confuse if player clears browser data | Documented as per-browser, per-origin (same as high score). No cross-device sync expected. |
| "Continue from Level N" starts at same difficulty without earlier-level warmup | Intentional per ROADMAP: "preserve the intended challenge of the level." |
| Two buttons on GameOver may crowd the overlay on small screens | Stack vertically with adequate spacing. Existing overlay layout handles multiple buttons already. |
| Dev level select might accidentally ship in production | Double-gated: `import.meta.env.DEV` is `false` in production build. Build step verification catches this. |

---

## Out of Scope

- Cloud saves / cross-device sync (future opportunity in ROADMAP line 649)
- Production-facing level select (explicitly dev-only per ROADMAP)
- Mid-run level changes (Continue always starts from beginning of level)
- Difficulty rebalancing (Milestone 7)
- Achievement tracking (Milestone 9)
- Statistics tracking (Milestone 9)
- Any UI redesign beyond GameOver overlay buttons
- Changes to the keyboard Space key behavior (Space = New Game, intentional)
- Mobile-specific Continue UI changes (follows same pattern)
- Progress reset feature (no "clear progress" button — not requested)
- Persistence of score or snake state within a level (always fresh start)

---

## Execution Order

| Phase | What | Dependencies | Estimated Complexity |
|-------|------|--------------|---------------------|
| 1 | Persistence layer | None | Low (2 functions) |
| 2 | State & reducer | Phase 1 | Medium (new action + field tracking) |
| 3 | Engine & hook | Phase 2 | Low (1 method + 1 persistence call) |
| 4 | GameOver UI | Phase 2 (types only) | Low (conditional rendering) |
| 5 | Game wiring + dev select | Phases 2-4 | Medium (multiple connections) |
| 6 | Status announcements | None | Trivial (2 strings) |
| 7 | Testing | Phases 1-5 | Medium (6 test files, ~25 new cases) |
| 8 | Documentation | Phase 7 (after verification) | Low (SPEC.md + ARCHITECTURE.md updates) |

**Recommended merge strategy:** One branch for all phases. Each phase is a separate commit within the branch.

---

## Review Checklist (Pre-Merge)

- [ ] `npm run lint` — zero errors
- [ ] `npm run build` — zero errors
- [ ] `npm test` — all tests pass, no regressions
- [ ] `npm run preview` — manual smoke test:
  - [ ] Play to game over, verify "Continue from Level N" appears
  - [ ] Click Continue, verify start at correct level with correct obstacles
  - [ ] Click New Game, verify start at Level 1
  - [ ] Reload page, verify `lastUnlockedLevel` persists
  - [ ] Dev mode: dev select visible, works for all 10 levels
  - [ ] Production build: dev select absent (`npm run preview`)
- [ ] SPEC.md updated and consistent with implementation
- [ ] ROADMAP.md updated (mark Milestone 6 completed, move to Completed section)
- [ ] PROJECT_STATE.md updated (new current milestone, updated priorities)
- [ ] No dead code, unused imports, or orphaned comments
