# Active Plan: Milestone 4 — Level Progression System

**Status:** Draft (review resolved — see [PLAN_REVIEW.md](PLAN_REVIEW.md) and [ADR-003](../docs/adr/ADR-003-level-transition-overlay-design.md))

**Created:** 2026-06-05

**Parent Milestone:** Milestone 4 — Level Progression System (ROADMAP.md §Milestone 4)

---

## Pre-Implementation Notes

### Documentation Conflict

Three project documents disagree on Milestone 4's identity:

| Document | Says M4 is... |
|----------|--------------|
| `ROADMAP.md` | Level Progression System |
| `PROJECT_STATE.md` | Feedback & Iteration |
| `plans/ACTIVE.md` (prior draft, now superseded) | Feedback & Iteration |

**Resolution:** ROADMAP is the source of truth for milestone identity (per AGENTS.md). This plan follows ROADMAP.md (Level Progression System) and supersedes the prior draft. Assumes Milestone 1-3 work is complete. `docs/PROJECT_STATE.md` will be updated in Phase 7 to align with ROADMAP.

### Empty Design Document

`docs/design/LEVEL_DESIGN.md` is empty. This plan does not depend on it — handcrafted layouts belong to Milestone 5. Level metadata added here (names, descriptions) are placeholders that can be refined later.

---

## Problem Statement (from ROADMAP)

Current level progression is difficult to notice. Players may not understand:
- When a level ends
- Why the snake resets
- What changed in the next level
- What makes levels different

## Goals

1. Make level transitions visible and intentional
2. Give every level a name, description, and objective
3. Eliminate the abrupt, invisible snake reset between levels

---

## Architecture Overview

### Current Flow (broken)

```
MOVE_SNAKE → reducer detects level-up → immediately resets snake,
    increments level, generates obstacles → continues playing
```

The player sees the snake teleport with no explanation.

### Target Flow

```
MOVE_SNAKE → reducer detects level-up → status = levelComplete
                                         (board freezes, loop stops)
           → LevelTransition overlay appears
           → Player clicks "Continue" or presses Space
           → CONTINUE_GAME action resets snake, increments level,
             generates obstacles → status = playing → loop resumes
```

### Key Design Decision: Single Overlay vs Two Overlays

ROADMAP proposes separate "Level Complete" and "Level Introduction" overlays. Showing two sequential overlays between every level would require two clicks per transition and slow down gameplay. **This plan uses a single combined overlay** that shows both the completion message and the next level preview, reducing to one click per transition.

The standalone "Level Introduction Overlay" feature from ROADMAP is formally retired. The combined overlay meets the same success criteria ("Players understand upcoming content", "Progression feels intentional") in a single screen. This decision, including its rationale and consequences, is recorded in [`docs/adr/ADR-003-level-transition-overlay-design.md`](../docs/adr/ADR-003-level-transition-overlay-design.md).

Before level 1, the existing idle overlay already serves as an introduction. It will be enhanced with level 1 metadata if time permits, but this is secondary.

---

## Phases

---

### Phase 1: Level Metadata

**Goal:** Make levels data-driven with names, descriptions, and objectives.

**Files changed:**
| File | Change |
|------|--------|
| `src/game/types.ts` | Add `name`, `description`, `objective` to `Level` interface |
| `src/game/levels.ts` | Replace for-loop with explicit level definitions containing metadata |

**What to implement:**

1. Extend `Level` in `types.ts`:
```ts
export interface Level {
  id: number;
  name: string;
  description: string;
  objective: string;
  targetScore: number;
  speed: number;
}
```

2. Replace the `for`-loop in `levels.ts` with an explicit array of 10 level objects. Each level keeps its existing `id`, `targetScore`, `speed` and adds:
   - `name` — 1–3 word label (e.g., "First Steps", "Tight Spaces", "Final Run")
   - `description` — one-sentence flavor text about the challenge
   - `objective` — short imperative phrase (e.g., "Eat 5 food.")

   Copy is non-final and will be revisited in M5 alongside handcrafted layouts. Do not over-invest in prose — one sentence each is sufficient.

3. `getLevelData()` and `generateObstacles()` signatures do NOT change. They continue to work with the extended `Level` interface.

**Verification:**
- `npm run build` passes (no type errors)
- `npm test -- src/utils/__tests__/levelData.test.ts` passes (existing tests still work)
- New test: verify `getLevelData(1).name` returns a non-empty string

**Risks:**
- Low risk. Purely additive change to the type and data layer.

---

### Phase 2: Level-Complete State & CONTINUE_GAME Action

**Goal:** Add a `levelComplete` game state and the action to advance past it.

**Files changed:**
| File | Change |
|------|--------|
| `src/game/types.ts` | Add `'levelComplete'` to `GameStatus`; add `CONTINUE_GAME` to `GameAction` |
| `src/game/state.ts` | Modify MOVE_SNAKE level-up path to return `levelComplete`; add CONTINUE_GAME handler |
| `src/game/Engine.ts` | Add `continueGame()` method |

**What to implement:**

1. `types.ts` — Add to `GameStatus`:
   - `'levelComplete'` between `'playing'` and `'won'`

2. `types.ts` — Add to `GameAction`:
   - `{ type: 'CONTINUE_GAME' }`

3. `state.ts` MOVE_SNAKE handler — change the `shouldLevelUp` branch (lines 70–95):
   - When `shouldLevelUp && state.level < LEVEL_COUNT`:
     - Update score and snake (eat the food, grow snake, spawn new food)
     - Keep the current level number
     - Set `status: 'levelComplete'`
     - Do NOT reset the snake or increment the level
   - When level 10 completed: keep existing `won` behavior

4. `state.ts` — add CONTINUE_GAME case:
    - Only acts when `state.status === 'levelComplete'`. For any other status, return state unchanged (no-op via the `default` fall-through). This is a safety requirement — do not rely on the caller to guard this.
    - Increment level by 1
    - Reset snake to INITIAL_SNAKE
    - Reset direction to RIGHT
    - Generate obstacles for the new level
    - Spawn food
    - Set `status: 'playing'`
    - (Score carries over — already captured in the state)

5. `Engine.ts` — add `continueGame()` method:
    ```ts
    continueGame(): void {
      this.dispatch({ type: 'CONTINUE_GAME' });
      this.startLoop();
    }
    ```
    The loop's `tick()` closure at `Engine.ts:96` returns early when `status` is not `'playing'`; on the next `requestAnimationFrame` callback, `rafId` is cleared. No explicit `stopLoop()` call is needed — setting `status: 'levelComplete'` in the reducer is sufficient.

6. `Engine.ts` dispatch — verify level-up sound behavior:
    - The `onLevelUp` callback fires on CONTINUE_GAME (level increments + status = playing), NOT on the original MOVE_SNAKE. This is correct — the sound should fire when the player advances, not when the freeze happens.
    - **Design note:** `onLevelUp` depends on `Engine.ts:52` (`this.state.status === 'playing'`) AND on CONTINUE_GAME being the only path that increments the level mid-game. If a future refactor adds another level-incrementing action without that guard, the level-up sound would be lost. Keep this coupling in mind.
    - The `onEat` callback fires during the MOVE_SNAKE that triggers `levelComplete` (score increases). Correct.
    - `saveHighScore` does NOT fire on `levelComplete`. Correct — saves only on gameover/won.

**Verification:**
- `npm test -- src/game/__tests__/state.test.ts` — two existing tests in the "level up" describe block will fail and must be updated:
  - `levels up when score reaches target` — expects `level === 2`; new behaviour keeps level at 1 and sets `status: 'levelComplete'`
  - `resets snake on level up` — expects snake reset to `INITIAL_SNAKE`; new behaviour keeps the grown snake in position
  - `sets won status when level 10 is completed` — passes as-is; strengthen with `expect(state.status).not.toBe('levelComplete')` assertion
  - `updates high score on win` — passes as-is
  - `Engine.test.ts` "continues running the loop after reset" still passes because RESET's status transition is unchanged.
- New tests:
  - MOVE_SNAKE that triggers level-up returns `status: 'levelComplete'`, does not increment level
  - MOVE_SNAKE that triggers level-up does not reset snake position
  - CONTINUE_GAME from levelComplete increments level and resets snake
  - CONTINUE_GAME from non-levelComplete is a no-op (returns state unchanged)
  - MOVE_SNAKE at level 10 still transitions directly to `won`
- `npm run build` passes

**Risks:**
- Medium risk. Changes the existing state machine. Existing tests in `state.test.ts` for level-up behavior must be updated to reflect the new two-step transition.
- The `gameReducer` is a pure function — the refactor stays within the same file and does not affect other modules.

---

### Phase 3: LevelTransition Component

**Goal:** Build the overlay that displays between levels.

**Files changed:**
| File | Change |
|------|--------|
| `src/components/LevelTransition.tsx` | New file — overlay component |
| `src/components/LevelTransition.module.css` | New file — component styles |
| `src/types/components.ts` | Add `LevelTransitionProps` interface |

**What to implement:**

1. `LevelTransitionProps`:
```ts
export interface LevelTransitionProps {
  completedLevelId: number;
  completedLevelName: string;
  nextLevelName: string;
  nextLevelDescription: string;
  score: number;
  onContinue: () => void;
}
```

2. `LevelTransition.tsx` — renders a full-screen overlay (matching existing overlay pattern from `Game.module.css:39-51` and `GameOver.tsx`):

```
LEVEL {N} COMPLETE

Next: {Next Level Name}
{Next Level Description}

Score: {score}

[Continue]
Press Space to continue
```

3. Use CSS Modules. Reuse existing design tokens (colors, fonts, button styles from `Game.module.css`). The overlay backdrop should match the existing `rgba(15, 23, 42, 0.95)`.

4. Button uses the same pattern as the existing Start/Resume buttons in `Game.module.css`. `autoFocus` provides keyboard accessibility; the button is naturally tappable on touch devices via standard click handling, matching the existing idle/paused overlay behaviour.

5. Accessibility: `aria-label` on button, screen-reader-friendly text.

**Verification:**
- Visual check: overlay renders correctly in the browser
- Component renders without errors in isolation
- New test: `LevelTransition.test.tsx` — renders level data, fires onContinue on button click
- `npm run build` passes
- `npm run lint` passes

---

### Phase 4: React Integration — useGame + Game.tsx

**Goal:** Wire the new state, component, and action into React.

**Files changed:**
| File | Change |
|------|--------|
| `src/hooks/useGame.ts` | Add `continueGame` method |
| `src/components/Game.tsx` | Add LevelTransition overlay, handleContinue callback, wire keyboard |
| `src/platform/keyboard.ts` | Add `onContinue` handler, handle Space in `levelComplete` |
| `src/hooks/useKeyboard.ts` | Add `onContinue` prop |

**What to implement:**

1. `useGame.ts` — add:
   ```ts
   const continueGame = useCallback(() => {
     engineRef.current?.continueGame();
   }, []);
   ```
   Return it in the hook's return object.

2. `useKeyboard.ts` — add `onContinue: () => void` to `UseKeyboardProps`. Pass it to `createKeyboardListener`.

3. `keyboard.ts` — add `onContinue` to `KeyboardHandler`. In `handleKeyDown`, add `levelComplete` case to the Space key handler:
    ```ts
    } else if (currentStatus === 'levelComplete') {
      handler.onContinue();
    }
    ```
    Direction keys remain live during `levelComplete` — the keyboard listener routes Arrow/WASD to `onChangeDirection` regardless of status at `platform/keyboard.ts:38–41`. This is consistent with the existing pre-aim-while-paused behaviour (SPEC §8.2).

4. `Game.tsx` — changes:
   - Extract `continueGame` from `useGame()`
   - Add `handleContinue` callback (same pattern as handleResume — calls `initAudio()` then `continueGame()`)
   - Pass `onContinue` to `useKeyboard`
   - Add `levelComplete` to `STATUS_ANNOUNCEMENTS`:
     ```ts
     levelComplete: 'Level complete! Press Space to continue.',
     ```
   - Add overlay condition between `paused` and `gameover` overlays:
     ```tsx
     {state.status === 'levelComplete' && (
       <LevelTransition
         completedLevelId={state.level}
         completedLevelName={getLevelData(state.level).name}
         nextLevelName={getLevelData(state.level + 1).name}
         nextLevelDescription={getLevelData(state.level + 1).description}
         score={state.score}
         onContinue={handleContinue}
       />
     )}
     ```
   - Update the pause button visibility to also exclude `levelComplete` (currently uses `playing || paused` — no change needed)
   - Update the D-pad visibility to also hide during `levelComplete` (currently `playing || paused` — no change needed)
   - Touch/swipe is already gated on `status === 'playing'` — no change needed

**Verification:**
- Manual playthrough: level 1 → eat 5 food → overlay appears → click Continue → level 2 starts
- Space key works on levelComplete overlay
- D-pad hidden during levelComplete
- Pause button hidden during levelComplete
- Swipe disabled during levelComplete
- `npm run build` passes
- `npm run lint` passes
- Existing tests pass: `npm test`

**Risks:**
- Low risk. The overlay pattern already exists (idle, paused, gameover). This adds one more condition to an existing if-else chain.

---

### Phase 5: Add Level Name to ScoreBoard HUD

**Goal:** Show the current level's name in the HUD during gameplay so players always know where they are.

**Files changed:**
| File | Change |
|------|--------|
| `src/types/components.ts` | Add optional `levelName` to `ScoreBoardProps` |
| `src/components/ScoreBoard.tsx` | Display level name alongside level number |
| `src/components/Game.tsx` | Pass `levelName` from `getLevelData` to `ScoreBoard` |

**What to implement:**

1. `ScoreBoardProps` — add: `levelName?: string;`
2. `ScoreBoard.tsx` — display as `Level: {level} — {levelName}` or show just the number if name is undefined (backward compatible).
3. `Game.tsx` — pass `levelName={getLevelData(state.level).name}` to `<ScoreBoard>`.

**Verification:**
- HUD shows "Level: 1 — First Steps" during gameplay
- `npm run build` passes (no TypeScript errors with new optional prop)
- ScoreBoard renders without errors when `levelName` is omitted (backward compatible) and when it is included
- Confirm `ScoreBoard.test.tsx` does not exist — the verification is a build-level check, not a test pass

---

### Phase 6: Tests

**Goal:** Comprehensive test coverage for new functionality.

**Files changed:**
| File | Change |
|------|--------|
| `src/game/__tests__/state.test.ts` | Update level-up tests; add levelComplete and CONTINUE_GAME tests |
| `src/utils/__tests__/levelData.test.ts` | Add tests for level metadata (name, description, objective) |
| `src/components/__tests__/LevelTransition.test.tsx` | New file — component rendering and interaction tests |
| `src/game/__tests__/Engine.test.ts` | Add continueGame test |
| `src/components/__tests__/Game.test.tsx` | Update `useGame()` mock return values to include `continueGame` |

**Test cases to add/update:**

`state.test.ts` additions:
- MOVE_SNAKE with score reaching target at level 1 → status is `levelComplete`, level stays 1
- MOVE_SNAKE with score reaching target — snake is NOT reset (head moved, food eaten)
- CONTINUE_GAME from levelComplete → status is `playing`, level incremented, snake reset
- CONTINUE_GAME from non-levelComplete status → state unchanged
- MOVE_SNAKE at level 10 with score reaching target → status is `won` (unchanged behavior)
- levelComplete preserves high score correctly (no save)

`levelData.test.ts` additions:
- Each level has a non-empty name
- Each level has a non-empty description
- getLevelData returns correct name for each level
- Export COUNT_LEVELS or use existing LEVEL_COUNT to verify 10 levels exist

`LevelTransition.test.tsx`:
- Renders completed level info and next level info
- Renders score
- Calls onContinue when button is clicked
- Uses correct accessibility attributes

`Engine.test.ts`:
- `continueGame()` from `levelComplete` state dispatches CONTINUE_GAME and resumes the loop (use fake timers + dispatch pattern from existing "stops the game loop on game over" test)

`Game.test.tsx`:
- Both `mockReturnValue` calls (lines 47–55 and 65–73) must include `continueGame: vi.fn()` in the returned object. Without this, `npm run build` fails because the mock object is structurally incomplete against the updated `useGame()` return type.

**Verification:**
- `npm test` — all tests pass (expecting ~130+ tests after additions)
- Test output scanned for no failures

---

### Phase 7: Documentation

**Goal:** Keep documentation consistent with implementation.

**Files changed:**
| File | Change |
|------|--------|
| `SPEC.md` | Document `levelComplete` state, CONTINUE_GAME action, LevelTransition component, level metadata |
| `docs/ROADMAP.md` | Move M4 from "In Progress" to "Completed"; update Current Progress |
| `docs/PROJECT_STATE.md` | Update current milestone, completed features, current version |
| `ARCHITECTURE.md` | Update state machine diagram, component list, game statuses |

**SPEC.md sections to update:**
- §7 (Game States): add `levelComplete` row to state table, add to state machine diagram
- §6.2 (Level Progression): document the two-step transition
- §3.3 (Obstacles) or new section: document level metadata structure
- §10 (UI Components): add LevelTransition component
- §15 (Testing): update test count
- §17 (Known Limitations): remove item about invisible level transitions

**ROADMAP.md updates:**
- Retire the "Level Introduction Overlay" feature — replace with the combined overlay per ADR-003
- Move Milestone 4 into "Completed" section
- Mark "In Progress" as Milestone 5 — Obstacle Redesign
- Update Current Progress section

**PROJECT_STATE.md updates:**
- Resolve the M4 identity conflict: update to reflect Level Progression System completion
- Update current version to v0.4.0
- Update completed features
- Update known technical debt if any

**ARCHITECTURE.md updates:**
- Add `levelComplete` to state machine diagram
- Add `LevelTransition` to component directory listing
- Update game loop description to note levelComplete pause behavior
- Reconcile test count across ARCHITECTURE.md, SPEC.md, and PROJECT_STATE.md (ARCHITECTURE.md:242 currently says "116 unit tests" while SPEC.md and PROJECT_STATE.md say "122"; update all three to the new post-implementation count)

**docs/HANDOFF.md review:**
- Review `docs/HANDOFF.md` and update if it summarizes milestone state (current version, milestone status)

---

## Out of Scope

The following are explicitly NOT part of this milestone. Pulling them in would be scope creep.

| Item | Belongs To |
|------|-----------|
| Handcrafted obstacle layouts | Milestone 5 — Obstacle Redesign |
| Speed curve rebalance | Milestone 6 — Difficulty Rebalance |
| Food objective system (food-per-level) | Milestone 6 — Difficulty Rebalance |
| Level selection screen | Not planned |
| Level history or progress tracking | Not planned |
| Visual identity overhaul | Milestone 7 — Visual Identity |
| Animated transitions between levels | Milestone 11 — Game Polish |
| New game states beyond `levelComplete` | Future |
| Changing the idle start screen | Future (the existing idle overlay is adequate) |
| Level-specific obstacle configurations | Milestone 5 |

---

## Risks and Assumptions

### Assumptions

1. **Milestones 1-3 are complete.** The PWA, mobile controls, and foundation refactor are all verified and working.
2. **One overlay per transition is acceptable.** The single combined overlay (vs. two separate overlays) is a deliberate simplification aligned with project philosophy.
3. **Level names/descriptions can be placeholders.** Since Milestone 5 will add handcrafted layouts, level metadata will likely be revised then. Current names should be reasonable but don't need to be final.
4. **No gameplay balance changes.** This milestone is purely about making existing progression visible. Speed and obstacle counts are unchanged.

### Risks

1. **Test churn.** Phase 2 modifies the level-up behavior in the reducer. Two existing state tests fail directly (`levels up when score reaches target`, `resets snake on level up`) and must be updated. Two L10 tests pass as-is but should be strengthened with a negative `levelComplete` assertion. Risk is low — the test file is well-structured.
2. **Keyboard API change footprint.** Adding `onContinue` to the keyboard handler interface requires changes in 3 files (`keyboard.ts`, `useKeyboard.ts`, `Game.tsx`). Risk is low — this is a pattern already used for `onStart`, `onPause`, etc.
3. **Level 10 edge case.** Level 10 completion must still go directly to `won`, not `levelComplete`. The existing `state.level >= LEVEL_COUNT` check handles this; verify with tests.

---

## Definition of Done

- [ ] `Level` type includes `name`, `description`, `objective`
- [ ] All 10 levels have metadata defined
- [ ] `GameStatus` includes `levelComplete`
- [ ] `GameAction` includes `CONTINUE_GAME`
- [ ] MOVE_SNAKE transitions to `levelComplete` on level-up (levels 1-9)
- [ ] CONTINUE_GAME resets snake, increments level, starts new level
- [ ] Level 10 completion transitions directly to `won` (unchanged)
- [ ] `LevelTransition` component renders between levels
- [ ] Continue button and Space key advance to next level
- [ ] ScoreBoard displays current level name
- [ ] D-pad and pause button hidden during `levelComplete`
- [ ] Swipe/touch disabled during `levelComplete`
- [ ] Level-up sound plays on CONTINUE_GAME (not on the triggering MOVE_SNAKE)
- [ ] Eat sound plays on food eaten (including the food that triggers level-up)
- [ ] High score saves on gameover/won (unchanged behavior)
- [ ] Screen reader announces level complete
- [ ] `Game.test.tsx` mock updated with `continueGame` (prevents build break)
- [ ] `npm run build` passes with no errors
- [ ] `npm run lint` passes with no errors
- [ ] `npm test` passes with all new and updated tests
- [ ] Test count reconciled across SPEC.md, PROJECT_STATE.md, and ARCHITECTURE.md
- [ ] SPEC.md, ROADMAP.md, PROJECT_STATE.md, ARCHITECTURE.md, and HANDOFF.md updated
- [ ] ROADMAP.md "Level Introduction Overlay" feature retired (per ADR-003)

---

## Summary of All Files Changed

| Phase | File | Action |
|-------|------|--------|
| 1 | `src/game/types.ts` | Edit — extend Level interface |
| 1 | `src/game/levels.ts` | Edit — replace loop with explicit definitions |
| 2 | `src/game/types.ts` | Edit — add levelComplete status + CONTINUE_GAME action |
| 2 | `src/game/state.ts` | Edit — modify level-up branch, add CONTINUE_GAME handler |
| 2 | `src/game/Engine.ts` | Edit — add continueGame() method |
| 3 | `src/types/components.ts` | Edit — add LevelTransitionProps |
| 3 | `src/components/LevelTransition.tsx` | **New** — overlay component |
| 3 | `src/components/LevelTransition.module.css` | **New** — component styles |
| 4 | `src/hooks/useGame.ts` | Edit — add continueGame method |
| 4 | `src/hooks/useKeyboard.ts` | Edit — add onContinue prop |
| 4 | `src/platform/keyboard.ts` | Edit — add onContinue + levelComplete handling |
| 4 | `src/components/Game.tsx` | Edit — import + render LevelTransition, wire handlers |
| 5 | `src/types/components.ts` | Edit — add levelName to ScoreBoardProps |
| 5 | `src/components/ScoreBoard.tsx` | Edit — display levelName |
| 5 | `src/components/Game.tsx` | Edit — pass levelName to ScoreBoard |
| 6 | `src/game/__tests__/state.test.ts` | Edit — update + add tests |
| 6 | `src/utils/__tests__/levelData.test.ts` | Edit — add metadata tests |
| 6 | `src/components/__tests__/LevelTransition.test.tsx` | **New** — component tests |
| 6 | `src/game/__tests__/Engine.test.ts` | Edit — add continueGame test |
| 6 | `src/components/__tests__/Game.test.tsx` | Edit — update useGame() mock return values |
| 7 | `SPEC.md` | Edit — document new state, component, flow |
| 7 | `docs/ROADMAP.md` | Edit — mark M4 complete |
| 7 | `docs/PROJECT_STATE.md` | Edit — update status, version, completed features |
| 7 | `ARCHITECTURE.md` | Edit — update state machine, component list |
