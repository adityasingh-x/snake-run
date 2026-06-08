# Active Plan — Milestone 10: Gameplay Expansion

## Goal

Introduce new gameplay decisions through food variants and advanced level mechanics, scoped narrowly to ship a fun, playable milestone without speculative architecture.

This plan supersedes any prior drafts. It is implementation-ready: each phase lists exact file changes, verification steps, and a Definition of Done.

---

## Pre-Flight Verification (Phase 0)

The implementing agent MUST complete these steps before any code change. If any step fails, stop and report — do not proceed.

1. Read in this order: `AGENTS.md`, `SPEC.md` (sections 3, 5, 6, 10, 14), `ARCHITECTURE.md` (State Shape, Project Structure, Testing).
2. Verify the working tree is clean: `git status` shows no uncommitted changes.
3. Confirm baseline tests pass: `npm test` reports 212 tests across 17 files.
4. Confirm baseline build succeeds: `npm run build` produces no errors.
5. Confirm baseline lint passes: `npm run lint` reports no new warnings.
6. Confirm Node, npm, and Vite versions match `package.json`.

If any baseline check fails, the environment is not ready for this milestone — resolve that first.

---

## Scope Overview

Three independent feature tracks, executed as three phases plus a documentation phase. Each feature phase is independently shippable.

| Phase | Feature | Effort | Source-of-Truth Files |
|-------|---------|--------|------------------------|
| 1 | Food Variants (gold, poison, slow) | Medium | `src/game/{types,state,food,Engine}.ts`, `src/index.css`, `src/components/{Cell,Board,ScoreBoard}.{tsx,module.css}` |
| 2 | Wrap-Around Levels (Level 5 only) | Small | `src/game/{types,levels,collision,state}.ts`, `src/components/Board.{tsx,module.css}` |
| 3 | Portal Levels (Level 7 only) | Small | `src/game/{types,levels,state,food}.ts`, `src/index.css`, `src/components/{Cell,Board}.{tsx,module.css}` |
| 4 | Documentation Pass | Small | `SPEC.md`, `ARCHITECTURE.md`, `docs/ROADMAP.md`, `docs/PROJECT_STATE.md`, `package.json` |

Phases are ordered so Phase 1 introduces the `Food` object shape that the board/cell components already need for Phase 2/3. Phase 2 changes wall behavior in collision detection; Phase 3 adds teleport behavior in `MOVE_SNAKE`. All three can be reverted independently.

---

## Out of Scope

Explicit non-goals for this milestone:

- Enemy snakes or AI opponents (future milestone)
- Boss levels (future milestone)
- Moving obstacles (future milestone)
- New sound effects — reuse existing eat sound on gold/slow; poison is silent
- Multiple simultaneous food items on the board
- Per-level food variant probability configuration — one global table
- New achievements tied to food variants
- Procedural level generation
- New level layouts beyond adding mechanic flags to existing levels
- Wrap-around or portal configuration UI in dev level select
- Wrap-around or portal mechanics for endless mode (endless uses level 10 layout, which has neither)
- A full visual identity overhaul — only the tokens strictly required to disambiguate new mechanics
- Light theme or theme switching (project is dark-theme-only)

---

## Cross-Phase Constraints

Invariants that hold across all three phases:

1. **One food at a time.** Never store an array of foods in `GameState`.
2. **No new dependencies.** Use only React, TypeScript, Vite, Vitest, CSS Modules — all already in `package.json`.
3. **Add only the 3 new CSS tokens listed below.** Reuse existing tokens everywhere else.
4. **No architecture changes.** Do not introduce new directories, abstractions, or design patterns.
5. **Endless mode is sacred.** It uses level 10 layout only. Do not enable wrap or portals there.
6. **Determinism for tests.** Tests that need to assert food type must construct `Food` objects directly via the `makeState` helper in `src/game/__tests__/state.test.ts:6`, not rely on `Math.random` rolls. Exception: the food-type statistical smoke test in Phase 1.10 is the only allowed stochastic test.
7. **Test files follow the project convention.** New tests for `gameLogic` and `levelData` go in `src/utils/__tests__/`, not `src/game/__tests__/`. New tests for `state`, `Engine`, `achievements`, and `statistics` go in `src/game/__tests__/`. Component tests go in `src/components/__tests__/`.
8. **Commit per phase.** Each phase is its own commit / PR. The next agent must be able to revert phases independently.

---

## Visual Design Additions

The new mechanics (3 food types, 1 portal type) need new colors that do not collide with the existing palette. The rationale is documented in `docs/ROADMAP.md` (Milestone 10 — "Design Note — Visual Tokens Added"). The implementation requirement is below.

### New tokens (`src/index.css`)

Add to the `:root` block in a clearly labeled `/* Milestone 10 */` section, in this order across phases:

| Phase | Token | Value | Used by |
|-------|-------|-------|---------|
| 1 | `--color-food-poison` | `#d946ef` (magenta) | Poison food cell |
| 1 | `--color-food-slow` | `#22d3ee` (cyan) | Slow food cell |
| 3 | `--color-portal` | `#a855f7` (purple) | Portal cell |

All three are saturated and pairwise distinguishable from the existing palette. No existing tokens are renamed, removed, or repurposed.

### Minimal visual language for new objects (CSS only)

- **Shape encoding** (in `Cell.module.css`): normal = circle, gold = diamond (`rotate(45deg)`), poison = square (no border-radius), slow = triangle (`clip-path: polygon(50% 0%, 0% 100%, 100% 100%)`).
- **Animation** (in `Cell.module.css`): reuse existing `pulse` keyframes for normal; faster 0.5s pulse for gold; static for poison. Portals use a new 4s linear `spin` keyframe on the outer ring with counter-rotation on the inner ring (CSS-only via pseudo-elements).
- **Glow budget respected.** All new visual effects stay within the existing 16px max blur / 6 simultaneous `box-shadow` budget. Reuse existing shadow tokens (`--shadow-neon-*`) where possible.
- **Wrap indicator** (Phase 2, `Board.module.css`): a 2px dashed `--color-warning` border on `[data-wrap-around="true"]`.

What this redesign explicitly does **not** include: snake head/body changes, existing obstacle changes, board background/border (except wrap indicator), overlay/button/HUD changes, new fonts or spacing tokens.

---

## Phase 1 — Food Variants

### Summary

Introduce three special food types in addition to normal food. Each has a distinct effect, optional despawn timer, and visual. Spawn probabilities and timer values are initial values; expect tuning after playtesting (future M11).

### Food Type Specification

| Type | Spawn % | Points | Effect | Timer (ticks) | Shape | Color Token |
|------|---------|--------|--------|---------------|-------|-------------|
| `normal` | 80% | +10 | Grow by 1 | ∞ (`-1`) | Circle, pulse 1s | `--color-danger` |
| `gold` | 10% | +30 | Grow by 1 | 10 | Diamond, pulse 0.5s | `--color-warning` |
| `poison` | 5% | 0 | Shrink by 1 (floor at `INITIAL_SNAKE.length`) | ∞ (`-1`) | Square, static | `--color-food-poison` |
| `slow` | 5% | +10 | Speed × 1.3 for 10 ticks | 8 | Triangle, glow | `--color-food-slow` |

Spawn percentages and timers are exported constants from `src/game/food.ts` so they can be tuned in one place.

### Implementation Steps

#### 1.1 Types (`src/game/types.ts`)

- Add `export type FoodType = 'normal' | 'gold' | 'poison' | 'slow';`
- Add `export interface Food { position: Position; type: FoodType; timer: number; }` where `timer === -1` means "no despawn".
- Change `GameState.food: Position` to `GameState.food: Food`.
- Add `speedEffectTicks: number` to `GameState` (0 = inactive).
- Re-export `FoodType` and `Food` from `src/game/index.ts` and `src/types/game.ts`.

#### 1.2 New CSS Tokens (`src/index.css`)

Add inside `:root`, in a `/* Milestone 10 — Food Variants */` block:

```css
--color-food-poison: #d946ef;
--color-food-slow:   #22d3ee;
```

The third token (`--color-portal`) is added in Phase 3. This is the **only** addition to `src/index.css` in this phase.

#### 1.3 Food Spawning (`src/game/food.ts`)

- Export `FOOD_SPAWN_WEIGHTS = { normal: 80, gold: 10, poison: 5, slow: 5 }` and `FOOD_TIMERS = { normal: -1, gold: 10, poison: -1, slow: 8 }` at module top.
- Change `spawnFood(snake, obstacles)` return type from `Position` to `Food`.
- After picking a valid position, roll a `FoodType` by weighted random selection (cumulative-weight method: compute `total = sum(weights)`, generate `r = Math.random() * total`, find the first type whose cumulative weight exceeds `r`), then return `{ position, type, timer: FOOD_TIMERS[type] }`.
- Keep the function signature stable so callers do not need to change in Phase 1.
- Update `src/utils/gameLogic.ts` to re-export the new return type if needed for downstream consumers.

#### 1.4 Game Reducer (`src/game/state.ts`)

In `MOVE_SNAKE`:

- Replace `ateFood = positionsEqual(newHead, state.food)` with `ateFood = positionsEqual(newHead, state.food.position)`.
- Decrement `state.food.timer` if `> 0`. If it reaches 0, spawn a replacement `normal` food in place (do not wait for collision).
- Decrement `state.speedEffectTicks` if `> 0`.
- On `ateFood === true`, apply the effect based on `state.food.type`:
  - `normal`: `score += 10`, grow by 1 (current behavior)
  - `gold`: `score += 30`, grow by 1
  - `poison`: `score += 0`, `snake.length -= 1` floored at `INITIAL_SNAKE.length`
  - `slow`: `score += 10`, `speedEffectTicks = 10` (resets to 10 if already active; last-write-wins)
- Spawn the next food via `spawnFood(newSnake, state.obstacles)` after applying the effect.

In `getInitialState`, `CONTINUE_GAME`, `START_AT_LEVEL`, `START_ENDLESS_GAME`:

- Reset `speedEffectTicks: 0`.
- Use the new `spawnFood` return shape (the result is now a `Food`).

Update the `makeState` test helper in `src/game/__tests__/state.test.ts:6-26` to include `food: { position: { x: 10, y: 10 }, type: 'normal', timer: -1 }` and `speedEffectTicks: 0`.

After updating `makeState`, search the entire project (test files) for `food: { x:` and `food: {x:` patterns and update every hit to the new `Food` shape: `food: { position: { x, y }, type: 'normal', timer: -1 }`. There are approximately 12+ inline overrides in `state.test.ts` alone that will fail to typecheck. Run `npm run build` and confirm zero TypeScript errors before proceeding.

#### 1.5 Game Loop (`src/game/Engine.ts`)

In `startLoop()` `tick()` callback (line 167), change the threshold check from:

```ts
if (this.accumulator >= speed) {
```

to:

```ts
const effectiveSpeed = this.state.speedEffectTicks > 0 ? speed * SLOW_EFFECT_MULTIPLIER : speed;
if (this.accumulator >= effectiveSpeed) {
```

Add `const SLOW_EFFECT_MULTIPLIER = 1.3;` at the top of `Engine.ts`, above the `Engine` class declaration.

The slow effect applies to the current tick's effective speed, not retroactively. If the accumulator has overshot `speed` but not `speed * 1.3` when the effect begins, the player may perceive a brief delay on the first tick. This is acceptable for M10; tune in M11 if needed.

#### 1.6 Component Prop Types (`src/types/components.ts`)

- Change `BoardProps.food: Position` to `BoardProps.food: Food`.
- Change `CellProps.isFood: boolean` to `CellProps.foodType?: FoodType`.
- Add `ScoreBoardProps.speedEffectTicks?: number`.

#### 1.7 Board (`src/components/Board.tsx`)

- Compare cell position to `food.position` (not `food` directly).
- Pass `foodType={food.type}` to the cell at `food.position`.

#### 1.8 Cell (`src/components/Cell.tsx` + `src/components/Cell.module.css`)

- Replace `isFood: boolean` with `foodType?: FoodType`.
- Apply class based on `foodType`:
  - `gold`: `var(--color-warning)`, `transform: rotate(45deg)`, `animation: pulse 0.5s infinite` (faster than normal)
  - `poison`: `var(--color-food-poison)`, square, no animation
  - `slow`: `var(--color-food-slow)`, `clip-path: polygon(50% 0%, 0% 100%, 100% 100%)`, `box-shadow: 0 0 8px var(--color-food-slow)`
  - `normal` (default): existing red circle with pulse
- Update `aria-label` per type: "Gold food at x,y", "Poison food at x,y", "Slow food at x,y", "Food at x,y".

#### 1.9 ScoreBoard (`src/components/ScoreBoard.tsx` + `src/components/ScoreBoard.module.css`)

- Accept `speedEffectTicks` prop.
- When `> 0`, show a "SLOW" badge with the remaining tick count, positioned next to the score section.
- Placement: insert a new `.section` after the high-score section in `ScoreBoard.tsx`, with class `slowBadge` styled in `ScoreBoard.module.css`. The badge shows `SLOW (N ticks remaining)` when `speedEffectTicks > 0` and is hidden when `0`. Color: `--color-food-slow`. On mobile (`@media (max-width: 600px)`), it wraps below the score row.
- Update `Game.tsx:185` to pass `speedEffectTicks={state.speedEffectTicks}`.

#### 1.10 Test Updates

Per the test file convention in Cross-Phase Constraint #7:

- `src/utils/__tests__/gameLogic.test.ts`: add tests for `spawnFood` returning a `Food` object; statistical smoke test (at least 2 of {gold, poison, slow} appear in 200 spawns). The threshold of "2 of 3 special types" is chosen because the probability that a special type is absent in 200 spawns is `0.90^200 ≈ 7.5e-10` for gold and `0.95^200 ≈ 3.5e-24` for poison/slow. Failure rate is negligible. If CI shows flakiness, replace with `vi.spyOn(Math, 'random')` to use a deterministic sequence.
- `src/game/__tests__/state.test.ts`:
  - Update `makeState` per 1.4.
  - Gold food: `MOVE_SNAKE` gives 30 points.
  - Poison food: `MOVE_SNAKE` shrinks snake, floored at `INITIAL_SNAKE.length`.
   - Slow food: `MOVE_SNAKE` sets `speedEffectTicks: 10`.
   - Slow food re-eat while `speedEffectTicks > 0` resets ticks to 10 (last-write-wins).
   - `MOVE_SNAKE` decrements `speedEffectTicks` each tick.
  - `MOVE_SNAKE` decrements `food.timer` each tick.
  - `MOVE_SNAKE` spawns replacement `normal` food when timer reaches 0.
  - `CONTINUE_GAME`, `START_AT_LEVEL`, `START_ENDLESS_GAME` all reset `speedEffectTicks: 0`.
  - `getInitialState` returns `food` as a `Food` object with `type: 'normal'`.
- `src/game/__tests__/Engine.test.ts`: speed multiplier applies when `speedEffectTicks > 0`.
- `src/components/__tests__/Cell.test.tsx`: Cell renders `.gold`, `.poison`, `.slow` classes for each `foodType`. Note: the existing 4 `Cell.test.tsx` tests use the old `isFood={false}` prop and will continue to compile (`foodType` is optional), but they no longer test the relevant code path. Migrate them to use the new `foodType` prop for clarity (non-blocking).
- `src/components/__tests__/Board.test.tsx`: Board passes `foodType` to the food cell. Note: existing `Board.test.tsx` tests pass `food: { x, y }` and must be updated to `food: { position: { x, y }, type: 'normal', timer: -1 }` to satisfy the new `BoardProps` type.

### Verification

- [ ] `npm test` — all 212 existing tests pass; new tests pass; final count recorded
- [ ] `npm run build` — no TypeScript errors
- [ ] `npm run lint` — no new warnings
- [ ] Manual: in level 1, observe ~80% normal food and occasional gold/poison/slow
- [ ] Manual: eat gold food → score increases by 30
- [ ] Manual: eat poison food → snake length decreases by 1 (and stops at 3)
- [ ] Manual: eat slow food → game visibly slows for ~10 ticks
- [ ] Manual: gold food despawns after ~10 ticks; a new normal food appears
- [ ] Manual: slow food despawns after ~8 ticks; a new normal food appears
- [ ] Manual: poison food persists until eaten
- [ ] Manual: "SLOW" indicator appears in ScoreBoard while effect is active
- [ ] Manual: poison food is visibly magenta; slow food is visibly cyan; gold food is visibly amber

### Definition of Done (Phase 1)

- [ ] All file changes above applied
- [ ] All new and existing tests pass
- [ ] All manual checks above confirmed
- [ ] `git diff` shows no accidental changes to other files
- [ ] `package.json` version unchanged (bump happens in Phase 4)

---

## Phase 2 — Wrap-Around Levels

### Summary

Enable a flag on level metadata that allows the snake to exit one edge and appear on the opposite edge. Only Level 5 (Maze Runner) gets this flag — its winding layout creates natural continuous corridors when wrapping is enabled.

### Implementation Steps

#### 2.1 Types (`src/game/types.ts`)

- Add `wrapAround?: boolean` to the `Level` interface.

#### 2.2 Level Data (`src/game/levels.ts`)

- Add `wrapAround: true` to the Level 5 entry only. All other levels remain unchanged (default `false` / undefined).

#### 2.3 Collision (`src/game/collision.ts`)

- Change `isWallCollision(pos: Position): boolean` to `isWallCollision(pos: Position, wrapAround: boolean = false): boolean`.
- When `wrapAround` is `true`, return `false` unconditionally (the caller wraps the position first, so the in-bounds check is a no-op).
- Update `isCollision(head, snake, obstacles)` to accept and forward `wrapAround`.

#### 2.4 Reducer (`src/game/state.ts`)

In `MOVE_SNAKE`, before the `isCollision` call:

- If `getLevelData(state.level).wrapAround === true`, normalize the new head coordinates:
  - `x = ((x % GRID_SIZE) + GRID_SIZE) % GRID_SIZE` (handles negatives)
  - Same for `y`
- Pass `wrapAround` to `isCollision`.

This is the only order change: wrap first, then check collision against the wrapped position. Self-collision and obstacle collision still apply normally.

#### 2.5 Board Visual Indicator (`src/components/Board.tsx` + `src/components/Board.module.css`)

- Accept `wrapAround?: boolean` in `BoardProps`.
- When `true`, set `data-wrap-around="true"` on the board `<div>`.
- Add a CSS rule: `.board[data-wrap-around="true"] { border: 2px dashed var(--color-warning); }` to give a clear visual signal.
- Update `Game.tsx:217` to compute `wrapAround={getLevelData(state.level).wrapAround}` and pass it down.

#### 2.6 Test Updates

- `src/utils/__tests__/gameLogic.test.ts`:
  - `isWallCollision(out-of-bounds, true)` returns `false`
  - `isWallCollision(out-of-bounds, false)` returns `true`
  - `isCollision` still detects self/obstacle collisions when wrapping is on
- `src/game/__tests__/state.test.ts`:
  - On level 5 with `wrapAround: true`, `MOVE_SNAKE` from x=0 going LEFT lands at x=19
  - On level 5 with `wrapAround: true`, `MOVE_SNAKE` from y=19 going DOWN lands at y=0
  - On level 5 with `wrapAround: true`, self-collision still triggers gameover
- `src/utils/__tests__/levelData.test.ts`:
  - Level 5 has `wrapAround: true`
  - All other levels have `wrapAround: false` or `undefined`

### Verification

- [ ] `npm test` — all tests pass
- [ ] `npm run build` — no errors
- [ ] `npm run lint` — no warnings
- [ ] Manual: in level 5, snake exits right edge → appears on left
- [ ] Manual: in level 5, snake exits top edge → appears on bottom
- [ ] Manual: in level 5, wrap into a body segment → game over
- [ ] Manual: in any other level, wall collision still triggers game over
- [ ] Manual: level 5 board has a visible dashed border

### Definition of Done (Phase 2)

- [ ] All file changes above applied
- [ ] All new and existing tests pass
- [ ] All manual checks above confirmed

---

## Phase 3 — Portal Levels

### Summary

Enable paired portal tiles on selected levels. When the snake's head lands on one portal tile, it instantly teleports to the paired position. Only Level 7 (Four Chambers) gets a single portal pair, chosen to connect opposite chambers for meaningful routing.

### Implementation Steps

#### 3.1 Types (`src/game/types.ts`)

- Add `portals?: [Position, Position][]` to the `Level` interface.

#### 3.2 Level Data (`src/game/levels.ts`)

- Add `portals: [[{ x: 2, y: 4 }, { x: 16, y: 15 }]]` to the Level 7 entry.
- All other levels remain unchanged.
- Manual validation: confirm both portal positions are empty in the Level 7 layout (see `src/game/levels.ts:79-85`); no obstacle, no body conflict.

#### 3.3 New CSS Token (`src/index.css`)

Add the third M10 token in a `/* Milestone 10 — Portals */` block:

```css
--color-portal: #a855f7;
```

#### 3.4 Reducer (`src/game/state.ts`)

In `MOVE_SNAKE`, after wrapping (if applicable) and before the collision check:

- Look up `portals = getLevelData(state.level).portals`.
- For each `[a, b]` pair: if `newHead` equals `a`, set `newHead = b`; if it equals `b`, set `newHead = a`.
- Break on first match (no overlapping portal pairs in the same level).
- Proceed with collision check on the (possibly teleported) `newHead`.

Edge case: if both portal tiles in a pair are at the same position (degenerate data), the lookup is a no-op. The level 7 pair is validated manually.

#### 3.5 Food Spawning (`src/game/food.ts`)

- Change the function signature to `spawnFood(snake: Position[], obstacles: Position[] = [], portals: Position[] = []): Food`. The third argument defaults to `[]` (empty array, no portal exclusion). All call sites in `state.ts` must pass `getLevelData(state.level).portals?.flat() ?? []`.
- Treat portal positions as occupied alongside snake and obstacles.

#### 3.6 Cell Visual (`src/components/Cell.tsx` + `src/components/Cell.module.css`)

- Accept `isPortal?: boolean` prop.
- When `true`, render two concentric ring pseudo-elements (`::before`, `::after`) with `border: 2px solid var(--color-portal)` and `border-radius: 50%`. The outer ring rotates at 4s linear infinite; the inner ring counter-rotates at 1.5s linear infinite to create a swirl effect.
- Add a new `@keyframes spin` (and `spinReverse`) animation block in `Cell.module.css`.
- Aria label: "Portal at x,y".

#### 3.7 Board (`src/components/Board.tsx`)

- Accept `portals?: Position[]` in `BoardProps`.
- Compute `portalSet: Set<string>` from the level metadata (passed as a prop).
- For each cell, if `portalSet.has(key)`, pass `isPortal: true`.

#### 3.8 Game.tsx (`src/components/Game.tsx`)

- Add a small helper `getPortalPositions(level: number): Position[]` in `src/game/levels.ts` that flattens `portals?.flat() ?? []`. Non-portal levels return `[]` (empty array). Callers can do `if (portalSet.size > 0)` to check whether portals exist, or pass the array unconditionally to `Board` (it filters per-cell).

#### 3.9 Test Updates

- `src/game/__tests__/state.test.ts`:
   - On level 7, `MOVE_SNAKE` from head at adjacent-to-portal-A lands on portal-B
   - On level 7, `MOVE_SNAKE` from head at adjacent-to-portal-B lands on portal-A
   - On level 7, teleporting into a wall (when no wrap) triggers game over
   - On level 7, teleporting into own body triggers game over
   - On level 7, teleporting into an obstacle triggers game over
   - On non-portal levels, no teleport occurs
   - Synthesize a hypothetical level with both `wrapAround: true` and `portals` (inline in the test) and assert that wrap is applied first, then portal lookup, then collision. This locks in the ordering invariant even though no real level has both.
- `src/utils/__tests__/gameLogic.test.ts`:
  - `spawnFood` does not place food on portal tiles when portals are passed
- `src/utils/__tests__/levelData.test.ts`:
   - Level 7 has exactly one portal pair
   - All other levels have no portals
   - `getPortalPositions(7)` returns exactly 2 positions
   - `getPortalPositions(1)` returns `[]`; verify for all non-portal levels
- `src/components/__tests__/Cell.test.tsx`:
  - Cell renders `.portal` class when `isPortal` is true

### Verification

- [ ] `npm test` — all tests pass
- [ ] `npm run build` — no errors
- [ ] `npm run lint` — no warnings
- [ ] Manual: in level 7, head lands on portal A → appears at portal B
- [ ] Manual: snake body follows the teleport correctly
- [ ] Manual: teleporting into a wall/obstacle/body → game over
- [ ] Manual: food does not spawn on portal tiles
- [ ] Manual: portal tiles are visibly purple (not amber, not magenta) and rotate slowly
- [ ] Manual: non-portal levels render normally

### Definition of Done (Phase 3)

- [ ] All file changes above applied
- [ ] All new and existing tests pass
- [ ] All manual checks above confirmed

---

## Phase 4 — Final Documentation Pass

Performed only after all three feature phases are complete and individually approved.

### 4.1 `SPEC.md` Updates

- **§3.2 Food:** add food types, timers, effects, and spawn probabilities
- **§5.2 Collision Detection:** add wrap-around behavior note
- **§5.3 Collision Outcome:** add poison food outcome (shrink not game over)
- **§6.1 Scoring:** add gold food 30-point value
- **§6.2 Levels:** add wrap-around and portal flags
- **§10.4 ScoreBoard:** document SLOW indicator
- **§14 Styling:** add the 3 new M10 color tokens with values; add a one-line note that they were introduced to disambiguate food types and portals from existing obstacles/snake
- **§15 Testing:** bump test count

### 4.2 `ARCHITECTURE.md` Updates

- **State Shape:** replace `food: Position` with `food: Food`; add `speedEffectTicks`
- **Level data:** document `wrapAround` and `portals` fields
- **Key Features:** add "Food Variants", "Wrap-Around Levels", "Portal Levels" subsections
- **Styling Conventions:** add the 3 new M10 tokens
- **Project Structure:** no new files
- **Testing:** bump test count

### 4.3 `docs/ROADMAP.md` Updates

- Mark M10 complete with completion date
- Move M10 from "Not Started" to "Completed" section
- Add M10 features to the completed list

### 4.4 `docs/PROJECT_STATE.md` Updates

- Bump `Current Version` to `0.10.0`
- Add M10 entry under "Completed Features" with all three phases
- Mark M11 (Feedback & Balancing) as the next milestone
- Update "Current Milestone" to "Milestone 11"

### 4.5 `package.json`

- Bump `version` field from `0.9.0` to `0.10.0`

### 4.6 Final Verification (Full Suite)

- [ ] `npm test` — all tests pass; record final count
- [ ] `npm run build` — clean
- [ ] `npm run lint` — clean
- [ ] `git status` — only the expected files are modified
- [ ] Manual smoke test of all three features in a single run

---

## Files Expected to Change

### Phase 1

| File | Change |
|------|--------|
| `src/index.css` | Add `--color-food-poison` and `--color-food-slow` tokens |
| `src/game/types.ts` | Add `FoodType`, `Food`; change `food: Food`; add `speedEffectTicks` |
| `src/game/food.ts` | Return `Food`; weighted random type selection; export constants |
| `src/game/state.ts` | Apply type effects; decrement timers; reset `speedEffectTicks` |
| `src/game/Engine.ts` | Apply 1.3x speed multiplier when slow effect active |
| `src/game/index.ts` | Re-export `Food`, `FoodType` |
| `src/types/game.ts` | Re-export `Food`, `FoodType` |
| `src/types/components.ts` | `food: Food`; `foodType?: FoodType`; `speedEffectTicks?` |
| `src/components/Board.tsx` | Use `food.position`; pass `foodType` |
| `src/components/Cell.tsx` | `foodType` prop; type-specific classes/aria |
| `src/components/Cell.module.css` | Add `.gold`, `.poison`, `.slow` classes |
| `src/components/ScoreBoard.tsx` | Show SLOW indicator |
| `src/components/ScoreBoard.module.css` | Style SLOW indicator |
| `src/components/Game.tsx` | Pass `speedEffectTicks` to `ScoreBoard` |
| `src/utils/gameLogic.ts` | (No code change; re-export remains correct) |
| `src/game/__tests__/state.test.ts` | Update `makeState`; add new tests |
| `src/utils/__tests__/gameLogic.test.ts` | New tests for typed food |
| `src/game/__tests__/Engine.test.ts` | Speed multiplier test |
| `src/components/__tests__/Cell.test.tsx` | Food type rendering tests |
| `src/components/__tests__/Board.test.tsx` | Food type propagation test |

### Phase 2

| File | Change |
|------|--------|
| `src/game/types.ts` | Add `wrapAround?: boolean` to `Level` |
| `src/game/levels.ts` | `wrapAround: true` on Level 5 |
| `src/game/collision.ts` | `isWallCollision` accepts `wrapAround`; forward in `isCollision` |
| `src/game/state.ts` | Wrap coordinates before collision in `MOVE_SNAKE` |
| `src/components/Board.tsx` | Accept `wrapAround`; set data attribute |
| `src/components/Board.module.css` | `[data-wrap-around]` border style |
| `src/components/Game.tsx` | Pass `wrapAround` to `Board` |
| `src/types/components.ts` | `wrapAround?: boolean` on `BoardProps` |
| `src/utils/__tests__/gameLogic.test.ts` | Wrap-aware wall collision tests |
| `src/game/__tests__/state.test.ts` | Coordinate wrap tests |
| `src/utils/__tests__/levelData.test.ts` | Wrap-around flag tests |

### Phase 3

| File | Change |
|------|--------|
| `src/index.css` | Add `--color-portal` token |
| `src/game/types.ts` | Add `portals?: [Position, Position][]` to `Level` |
| `src/game/levels.ts` | Portal pair on Level 7; add `getPortalPositions` helper |
| `src/game/state.ts` | Teleport head on portal landing in `MOVE_SNAKE` |
| `src/game/food.ts` | Accept optional `portals` arg; exclude portal positions from spawn |
| `src/components/Cell.tsx` | `isPortal` prop; portal class |
| `src/components/Cell.module.css` | `.portal` class with rotation animation; new `spin` keyframes |
| `src/components/Board.tsx` | Compute portal set; pass `isPortal` |
| `src/components/Game.tsx` | Pass `portals` to `Board` |
| `src/types/components.ts` | `portals?: Position[]` on `BoardProps` |
| `src/game/__tests__/state.test.ts` | Teleport and post-teleport collision tests |
| `src/utils/__tests__/gameLogic.test.ts` | Portal-exclusion test |
| `src/utils/__tests__/levelData.test.ts` | Portal definition tests; `getPortalPositions` test |
| `src/components/__tests__/Cell.test.tsx` | Portal rendering test |

### Phase 4

| File | Change |
|------|--------|
| `SPEC.md` | Multiple sections per 4.1 |
| `ARCHITECTURE.md` | State shape, level data, features, styling |
| `docs/ROADMAP.md` | Mark M10 complete |
| `docs/PROJECT_STATE.md` | M10 entry; bump to v0.10.0; M11 next |
| `package.json` | Version `0.10.0` |

---

## Risks, Assumptions & Mitigations

### Risks

| # | Risk | Likelihood | Impact | Mitigation |
|---|------|------------|--------|------------|
| 1 | Spawn probabilities feel wrong in practice | High | Low | Defined as named constants; tunable in one file; M11 (Feedback & Balancing) is the right place to retune |
| 2 | Poison food as "shrink" is misunderstood as bug | Medium | Low | Update SPEC §5.3 explicitly; in-game label is out of scope (KISS) |
| 3 | Slow effect feels too short or too long | Medium | Low | Tunable in `Engine.ts`; one constant change; collect feedback in M11 |
| 4 | Wrap-around causes confusing wrap-into-self | Low | Medium | Self-collision still applies; documented in SPEC §5.2 |
| 5 | Portal + wrap interaction is undefined | Low | Medium | Explicit ordering in `MOVE_SNAKE` (wrap first, then portal); no level has both; documented |
| 6 | Portal data error (overlapping pairs, same coords) | Low | Low | No-overlap invariant; degenerate pair is a no-op; manual validation in Phase 3 |
| 7 | `makeState` helper drift causes test suite to break | High | Low | Update helper in Phase 1 first; document in cross-phase constraints |
| 8 | CSS animation on gold food causes jank | Low | Low | Reuse existing `pulse` keyframes; no new animation; respects glow ceiling |
| 9 | Board prop changes break other consumers | Low | Medium | `BoardProps` is consumed only in `Game.tsx`; update in same phase as the prop change |
| 10 | Existing 212 tests break from `Food` shape change | High | High | Update `makeState` and any test constructing `food: Position` directly; do this in the same commit as the type change |
| 11 | Statistical food type test is flaky | Medium | Low | Use a non-degeneracy check ("at least 2 of 3 special types in 200 spawns") — does not assert exact distribution |
| 12 | Scope creep: "while we're here, add achievements" | Medium | High | Out-of-scope list above; review at end of each phase |

### Assumptions

1. Initial spawn probabilities (80/10/5/5) are starting points; tuning is a separate concern.
2. Timer tick counts (10, 8) feel meaningful at typical game speeds. They are tick-based, not time-based, so they scale with level speed automatically.
3. The level 5 layout (Maze Runner) is the most natural fit for wrap-around because its corridors line up. Choosing it required no layout changes.
4. The level 7 layout (Four Chambers) has obvious "opposite chamber" positions for the portal pair. Choosing it required no layout changes.
5. Endless mode users will not expect wrap or portals. They use level 10 layout which has neither, so no change is needed.
6. The current `useGame` hook does not need changes — the engine is the source of truth and components receive new props reactively.
7. The dev level select works as-is with the new mechanics — no UI changes needed.
8. No new localStorage keys are required (no new persistence).
9. The Cell component's memoization is preserved — `foodType` and `isPortal` are primitives, so they do not break `memo`.

---

## Milestone Definition of Done

- [ ] All three food variants spawn, render, and apply effects correctly
- [ ] Food timers work correctly (gold: 10 ticks; slow: 8 ticks; normal/poison: persist)
- [ ] Slow effect visibly slows the game and expires after 10 ticks
- [ ] Level 5 (Maze Runner) allows wrap-around; snake exits and re-enters
- [ ] Non-wrap levels still trigger wall collision as game over
- [ ] Level 5 has a visible dashed border indicator
- [ ] Level 7 (Four Chambers) has one working portal pair
- [ ] Teleport into wall/obstacle/body triggers game over
- [ ] Food does not spawn on portal tiles
- [ ] 3 new CSS tokens added to `src/index.css` and used by the relevant components
- [ ] Poison food is visibly magenta; slow food is visibly cyan; portal tiles are visibly purple
- [ ] Portal tiles have a slow rotation animation
- [ ] All existing tests pass (212 baseline)
- [ ] New tests added for all new modules and mechanics
- [ ] `npm run build` completes with no errors
- [ ] `npm run lint` passes with no new warnings
- [ ] SPEC.md, ARCHITECTURE.md, ROADMAP.md, PROJECT_STATE.md updated
- [ ] `package.json` version bumped to `0.10.0`
- [ ] Git workflow followed (see below)

---

## Git Workflow

Per `AGENTS.md` "Git Workflow Protocol", the implementing agent prepares each phase as a separate branch / commit / PR.

### Branch naming

Format: `<prefix>/<short-descriptive-name>`

- Phase 1: `feature/m10-food-variants`
- Phase 2: `feature/m10-wrap-around`
- Phase 3: `feature/m10-portals`
- Phase 4: `chore/m10-docs-and-version`

One branch per phase, or one branch (`feature/m10-gameplay-expansion`) with one commit per phase. The latter is preferred to keep the review surface unified; the former is preferred if the reviewer wants to merge phases independently.

### Commit message (per phase)

Format: `<type>(<scope>): <short description, max 50 chars>`

- Phase 1: `feat(game): add gold, poison, and slow food variants`
- Phase 2: `feat(game): add wrap-around mechanic for level 5`
- Phase 3: `feat(game): add portal mechanic for level 7`
- Phase 4: `chore(docs): update docs and bump version to 0.10.0`

### PR body template

```markdown
## Description

[Clear description of the changes, the problem solved, and the approach]

## Type of Change

- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Refactor / Chore / Documentation

## How Has This Been Tested?

- **Test Command:** npm test
- **Outcome:** [Insert test results summary here]
- **Build:** npm run build — clean
- **Lint:** npm run lint — clean
- **Manual checks:** [List the manual verification steps performed]
```

### Final output for the implementing agent

- **Branch Name:** `feature/m10-gameplay-expansion` (or four per-phase branches)
- **Commit Messages:** one per phase, as listed above
- **PR Title:** `Milestone 10: Gameplay Expansion (food variants, wrap-around, portals)`
- **PR Body:** the populated Markdown PR template above

---

## Simplification Review

This plan was reviewed against the "ship the game" philosophy:

- **No per-level food probabilities** — one global table; avoids per-level config and edge cases
- **No multiple simultaneous food items** — one food at a time; clean board, simple state
- **No despawn animations** — food vanishes, new food appears; no animation orchestration
- **No new sound effects** — gold/slow reuse eat sound; poison is silent
- **Wrap on one level only** — Level 5; no retrofit needed
- **Portals on one level only** — Level 7; one pair; no overwhelming design
- **No level with both wrap and portals** — no complex interaction testing
- **No poison timer** — poison persists; simpler timer logic
- **Slow effect is short (10 ticks)** — tactical moment, not a long debuff
- **No difficulty rebalance** — food variants add variety; level completion requirements unchanged
- **No new dependencies** — all changes use existing stack
- **No new directories or abstractions** — flat module additions only
- **Phases are independently shippable** — each can be merged separately if needed
- **Tunable constants at the top of files** — probabilities, timers, and multiplier are named constants, not magic numbers scattered through code
- **Test files follow the existing convention** — new logic tests go in `src/utils/__tests__/`; new reducer/engine tests go in `src/game/__tests__/`

### Why Each Phase Is Not Over-Engineered

- **Phase 1 (Food Variants):** Single global probability table. Timer system is a single field on the food object, not a separate system.
- **Phase 2 (Wrap-Around):** A single boolean flag on a level. No "wrap mode" enum, no portal pair indexing, no transition effects. Wrapping is a two-line modulo in the reducer.
- **Phase 3 (Portals):** A single optional array of coordinate pairs on a level. Teleport is a single lookup in the reducer, not a separate system. The visual is two pseudo-elements, not a custom component.

### What Was Explicitly Rejected

- Boss levels (different mechanics, different design)
- Enemy snakes (AI, separate system)
- Moving obstacles (animation loop, different timing)
- Per-level food variant configuration (config UI, validation)
- Visual particle effects (animation budget, complexity)
- Wrap-around and portal configuration in dev select (not needed; can use existing level jump)
- Achievements tied to new food types (out of scope; defer to M11+)
- Theming changes (use existing color tokens; no new palette work)

---

## Handoff Notes

For the implementing agent:

1. **Do all three feature phases and the docs phase.** Do not cherry-pick. The M10 milestone as defined in `ROADMAP.md` includes all three features plus documentation.
2. **Run lint and tests after every meaningful change.** Catch regressions early.
3. **Use `makeState` for state construction in tests.** Do not inline full state objects. The helper is at `src/game/__tests__/state.test.ts:6`.
4. **Follow the test file convention** (Cross-Phase Constraint #7). New `gameLogic` and `levelData` tests go in `src/utils/__tests__/`.
5. **Respect existing patterns.** Read `src/components/Statistics.tsx` and `src/components/Achievements.tsx` for how to add a small panel/indicator to the ScoreBoard.
6. **If a phase feels larger than expected**, stop and report. Do not expand scope to "fix" it.
7. **If a verification step fails**, fix the regression before proceeding. Do not accumulate broken state.
8. **If a new dependency seems needed**, do not add it. Find a way to do it with what's available.
9. **If SPEC.md disagrees with implementation**, fix one and update the other in the same change. Do not leave them inconsistent.
10. **Commit per phase**, not per file. The plan author (the next agent after you) will need to be able to revert individual phases.
11. **Phase 4 (docs) is a separate final step.** Do not bundle doc updates into feature phases.
12. **Prepare the PR per the Git Workflow section above** before declaring milestone complete.
13. **The existing dev level select (M6) can be used to jump to levels 5 and 7 for testing wrap and portal mechanics.** No changes to the dev select are needed.
14. **No changes to `useGame`, `useKeyboard`, or `useTouch`** — all new mechanics are derived from `state.food` and `getLevelData(state.level)` at render time.
