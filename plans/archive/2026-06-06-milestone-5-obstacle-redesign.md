# Milestone 5 — Obstacle Redesign

**Status:** ACTIVE — Planning

**Created:** 2026-06-06

---

## Overview

Replace random obstacle generation with handcrafted obstacle layouts for all 10 progression levels.

Currently `generateObstacles()` uses `Math.random()` to scatter obstacles. After this milestone, each level has a predefined `layout: Position[]` that creates a distinct, memorable gameplay experience.

This milestone implements the layouts described in `docs/design/LEVEL_DESIGN.md`.

---

## Scope

### In Scope

- Define handcrafted obstacle layouts (`Position[]`) for all 10 levels
- Store layouts in level metadata (`Level` type gains a `layout` field)
- Replace random obstacle generation with layout lookup
- Update level names and descriptions to match new layouts (per `LEVEL_DESIGN.md`)
- Level 1 has zero obstacles (currently the system enforces a minimum of 1)
- Unit tests for layout lookup, layout validity, and integration
- Update SPEC.md, ROADMAP.md, PROJECT_STATE.md

### Out of Scope

- Speed curve rebalancing (Milestone 6)
- Food-objective progression system (Milestone 6)
- Changing `targetScore` values (Milestone 6)
- Visual / HUD redesign (Milestone 7)
- New obstacle mechanics: moving obstacles, portals, wrap-around (Milestone 9)
- Food variants (Milestone 9)
- Endless mode (Milestone 8)
- Any UI or overlay changes

---

## Risks and Assumptions

| Risk | Likelihood | Mitigation |
|------|-----------|------------|
| Layouts feel unfair or unplayable at current speeds | Medium | Playtest each level after implementation; speed rebalance is M6 but layouts must be playable now |
| Obstacle positions overlap with initial snake position | Low | Validation test ensures no layout tile collides with `INITIAL_SNAKE` |
| Level 1 zero obstacles breaks assumptions in collision/food code | Low | `spawnFood`, `isObstacleCollision`, and `isCollision` all handle empty obstacle arrays already |
| Layout designs differ between plan author and implementer | Medium | The plan defines intent but not exact coordinates; implementer has design authority per `LEVEL_DESIGN.md` |

**Assumption:** The implementer will use `LEVEL_DESIGN.md` as the authoritative layout reference. Exact tile coordinates are a design decision left to the implementer.

---

## Definition of Done (Milestone-Level)

- [ ] All 10 levels have predefined obstacle layouts in level data
- [ ] `generateObstacles` returns layouts from level data (no `Math.random()`)
- [ ] Level 1 has exactly 0 obstacles
- [ ] Level names and descriptions match `LEVEL_DESIGN.md`
- [ ] No layout tile overlaps with `INITIAL_SNAKE` starting positions
- [ ] Level name displayed correctly in ScoreBoard HUD and LevelTransition overlay
- [ ] All existing tests pass (140+)
- [ ] New tests cover layout lookup, validity, and level metadata
- [ ] `npm run build` succeeds with zero errors
- [ ] `npm run lint` passes
- [ ] SPEC.md updated (obstacle generation section)
- [ ] `package.json` version bumped to `0.5.0`
- [ ] ROADMAP.md updated (move M5 to Completed)
- [ ] PROJECT_STATE.md updated (bump version to v0.5.0, update status)

---

## Phase 1: Define Obstacle Layouts and Update Level Data

**Goal:** Add predefined `layout` arrays to level definitions and update metadata.

### Files Changed

- `src/game/types.ts` — Add `layout: Position[]` to `Level` interface
- `src/game/levels.ts` — Add `layout` arrays to each level entry; update names and descriptions per `LEVEL_DESIGN.md`

### Details

1. **Add `layout` to the `Level` interface** (`src/game/types.ts:10-16`):
   ```ts
   export interface Level {
     id: number;
     name: string;
     description: string;
     targetScore: number;
     speed: number;
     layout: Position[];  // NEW: predefined obstacle positions
   }
   ```

2. **Define layouts per `LEVEL_DESIGN.md`** — The design doc specifies concepts, not exact coordinates. The implementer translates each concept into concrete `Position[]` values on the 20×20 grid. Layout intent per level:

   | Level | Name | Description | Layout Intent | Rough Tile Count |
   |-------|------|-------------|---------------|-----------------|
   | 1 | First Meal | Learn movement and food collection | Empty board — no obstacles | 0 |
   | 2 | Pillar Run | Learn to route around obstacles | A single central pillar (avoiding snake start at x=8–10, y=10) | 4–6 |
   | 3 | Split Paths | Choose your route | Two vertical walls creating 3 lanes | 10–14 |
   | 4 | Crossroads | Navigate divided sectors | Cross-shaped structure dividing board into quadrants | 12–16 |
   | 5 | Maze Runner | Plan your moves ahead | Simple maze with winding paths | 14–18 |
   | 6 | Narrow Passage | Manage your growing length | Multiple narrow 1–2 tile corridors | 16–20 |
   | 7 | Four Chambers | Travel efficiently between regions | Board divided into 4 connected rooms with doorways | 18–22 |
   | 8 | Spiral | Find the shortest path | Large spiral pattern forcing long routes | 20–26 |
   | 9 | Survival Grid | React quickly under pressure | Dense scattered obstacle field | 24–30 |
   | 10 | Final Run | Combine all skills | Hybrid: crossroads + maze + narrow passages | 26–32 |

   **Source of truth:** The layout intent, level names, concepts, and description text in this table are illustrative and derived from `docs/design/LEVEL_DESIGN.md`. When this table and `LEVEL_DESIGN.md` disagree, the design doc wins. The implementing agent must verify the table against the design doc. Rough tile counts are estimates for implementer guidance; the agent may adjust within reason based on playability.

   **Layout design constraints:**
   - No tile may overlap with `INITIAL_SNAKE` positions: `{x:10,y:10}, {x:9,y:10}, {x:8,y:10}`
   - No tile may sit directly adjacent to the initial snake head at (10,10) in the RIGHT direction (x=11,y=10) — this would cause instant death on first tick
   - Leave the initial food spawn area reasonably open (food spawns randomly but avoid blocking the entire right side of the board)
   - Prefer connected obstacle structures over scattered tiles — walls and shapes create more interesting gameplay than isolated dots
   - Ensure all layouts leave at least one valid path from the snake's starting area to a majority of the board

3. **Update level names and descriptions** to match `docs/design/LEVEL_DESIGN.md`:

   | Level | Old Name | New Name |
   |-------|----------|----------|
   | 1 | First Steps | First Meal |
   | 2 | Tight Spaces | Pillar Run |
   | 3 | Pillar Run | Split Paths |
   | 4 | Crowded Path | Crossroads |
   | 5 | Split Paths | Maze Runner |
   | 6 | Maze Runner | Narrow Passage |
   | 7 | Obstacle Field | Four Chambers |
   | 8 | Narrow Corridors | Spiral |
   | 9 | Chaos Zone | Survival Grid |
   | 10 | Final Run | Final Run (unchanged) |

   **Description text:** The `description` field for each level is a 1-sentence, ~10–20 word flavor string shown in the LevelTransition overlay and the in-game HUD. Take description text from the "Purpose" section of `docs/design/LEVEL_DESIGN.md` and paraphrase to fit. The table in Phase 1 step 2 is illustrative; when it and the design doc differ, the design doc wins.

   - `targetScore` and `speed` values remain unchanged (these are M6 work)

### Verification

- [ ] `npm run build` succeeds (TypeScript compiles with new `layout` field on `Level`)
- [ ] All 10 level entries have a `layout` array defined
- [ ] Level 1 layout is `[]` (empty)
- [ ] Each layout contains only valid grid positions (`0 <= x,y < 20`)
- [ ] Manual visual inspection: load the game, observe Level 1 has no obstacles, Level 2 has a pillar, etc.
- [ ] ScoreBoard HUD shows updated level names

---

## Phase 2: Replace Random Generation with Layout Lookup

**Goal:** Modify `generateObstacles` to return predefined layouts instead of random positions.

### Files Changed

- `src/game/levels.ts` — Rewrite `generateObstacles` function
- `src/game/state.ts` — Update call sites (signature change)

### Details

1. **Rewrite `generateObstacles`** (`src/game/levels.ts:27-51`):
   - Remove `Math.random()` calls
   - Simplify signature from `(levelId, snake, food)` to `(levelId)`
   - Look up the level's `layout` field and return it directly
   ```ts
   export function generateObstacles(levelId: number): Position[] {
     const data = getLevelData(levelId);
     return [...data.layout]; // shallow copy to prevent mutation
   }
   ```

2. **Update call sites in `src/game/state.ts`**:
   - `getInitialState()` (line 10): `generateObstacles(1, INITIAL_SNAKE, {x:0, y:0})` → `generateObstacles(1)`
   - `CONTINUE_GAME` case (line 107): `generateObstacles(nextLevel, INITIAL_SNAKE, {x:0, y:0})` → `generateObstacles(nextLevel)`

3. **Remove unused function parameters** and clean up imports in `state.ts` if any become unused.

### Verification

- [ ] `npm run build` succeeds
- [ ] `npm test` — all existing tests that exercise `generateObstacles` still pass
- [ ] Game starts with Level 1 having zero obstacles (visually confirm board is empty except snake + food)
- [ ] Start a game, eat food until level-up, confirm Level 2 shows pillar layout
- [ ] Cycle through several levels, confirm each shows a different layout (not random)

---

## Phase 3: Update Tests

**Goal:** Add tests for the new layout system; update existing tests for the new function signature.

### Files Changed

- `src/utils/__tests__/levelData.test.ts` — Update `generateObstacles` tests; add layout validity tests
- `src/components/__tests__/LevelTransition.test.tsx` — Update hardcoded level names and descriptions for renamed levels
- `src/game/__tests__/state.test.ts` — Verify CONTINUE_GAME integration test assertion remains valid

### Details

1. **Update `generateObstacles` test calls** (`levelData.test.ts` lines 37–91) — Change from 3-argument to 1-argument calls (7 call sites: lines 44, 52, 59, 69, 76, 82, 88):
   - Remove `const snake = [...]` and `const food = {x:5, y:5}` fixture variables from the `describe('generateObstacles')` block (lines 37–42)
   - Change all `generateObstacles(N, snake, food)` calls → `generateObstacles(N)`

2. **Replace existing obscure count tests** with specific layout tests:
   - Remove: tests that only check obstacle count (since count is now determined by predefined layout, not formula)
   - Add: `it('Level 1 has zero obstacles')` → `expect(generateObstacles(1)).toEqual([])`
   - Add: `it('Level 1 layout is empty')` → verify empty array
   - Add per-level tests: `it('Level N has a non-empty layout')` for levels 2–10
   - Keep: bounds-check tests are still valid (verify no tile is out of bounds) — update to 1-arg calls
   - Keep: no-duplicate test still valid
   - Keep: no-overlap-with-snake test still valid (but use `INITIAL_SNAKE` from constants rather than parameter)

3. **Add new layout validation tests**:
   ```ts
   describe('layout validity', () => {
     it('no layout tile overlaps with INITIAL_SNAKE starting positions');
     it('no layout tile is directly in front of initial snake head (RIGHT direction)');
     it('all layout tiles are within grid bounds [0, GRID_SIZE)');
     it('no duplicate tiles within any single layout');
   });
   ```

4. **Update metadata tests** — The existing "returns correct name" tests for Level 1 ("First Steps") and Level 10 ("Final Run") need updating since names change:
   - Level 1 name test: `'First Steps'` → `'First Meal'`
   - Other metadata tests (all levels have names/descriptions, all 10 exist) remain valid

5. **Update `LevelTransition.test.tsx`** (`src/components/__tests__/LevelTransition.test.tsx:10–11, 20, 25`) — The default props and assertions hard-code `'First Steps'` and `'Tight Spaces'`, which no longer match after the Level 1/2 rename:
   - `completedLevelName: 'First Steps'` → `'First Meal'`
   - `nextLevelName: 'Tight Spaces'` → `'Pillar Run'`
   - `nextLevelDescription: 'Navigate around the growing obstacles.'` → the new Level 2 description from `LEVEL_DESIGN.md` (paraphrased from "Introduce obstacle navigation")
   - `screen.getByText('First Steps')` → `screen.getByText('First Meal')`
   - `screen.getByText('Next: Tight Spaces')` → `screen.getByText('Next: Pillar Run')`
   - `screen.getByText('Navigate around the growing obstacles.')` → match new description text

6. **Verify `state.test.ts` CONTINUE_GAME integration** (`src/game/__tests__/state.test.ts:337`) — The assertion `expect(next.obstacles.length).toBeGreaterThan(0)` on the level 1→2 CONTINUE_GAME path remains valid because Level 2's layout is non-empty (4–6 tiles per Phase 1). The assertion `expect(next.food).not.toEqual(state.food)` is also still valid. No fixture changes required. Do not weaken or delete these assertions. The test description "generates new obstacles and food for next level" stays accurate.

7. **Add determinism test** — The entire point of M5 is obstacle determinism. Add to the layout validity suite:
   ```ts
   it('generateObstacles is deterministic for all 10 levels', () => {
     for (let i = 1; i <= 10; i++) {
       expect(generateObstacles(i)).toEqual(generateObstacles(i));
       expect(generateObstacles(i)).toEqual(getLevelData(i).layout);
     }
   });
   ```
   This catches the headline regression: a future re-introduction of `Math.random()` in `generateObstacles`.

### Verification

- [ ] `npm test` passes all tests (existing + new)
- [ ] `LevelTransition.test.tsx` assertions pass with new level names
- [ ] Layout validation tests catch invalid layouts (e.g., obstacle at (10,10) would fail)
- [ ] Determinism test passes (no random variation between calls)
- [ ] `state.test.ts` CONTINUE_GAME test still passes unchanged
- [ ] No test relies on random obstacle positioning (determinism)

---

## Phase 4: Update Documentation

**Goal:** Bring SPEC.md, ROADMAP.md, PROJECT_STATE.md, and ARCHITECTURE.md in sync with the completed milestone.

### Files Changed

- `SPEC.md` — Update §3.3 (obstacle generation)
- `docs/ROADMAP.md` — Move M5 to Completed; update progress
- `docs/PROJECT_STATE.md` — Bump version to v0.5.0; update status
- `package.json` — Bump version to `0.5.0`
- `ARCHITECTURE.md` — Update level system description (optional, only if obstacle generation description changes)

### Details

1. **SPEC.md §3.3 Obstacles** — Replace:
   ```
   - **Generation per level:** `min(max(1, floor(level * 0.5)), 8)` obstacles
   ...
   - **Placement:** random positions avoiding snake and food; no duplicates
   - **Persistence:** new set generated on each level-up
   ```
   With:
   ```
   - **Layout:** Each level has a predefined handcrafted obstacle layout defined in level metadata
   - **No randomness:** Obstacle positions are authored, not generated randomly
   - **Persistence:** Layout changes based on the level definition on each level-up
   ```
   Remove the per-level count table (levels 1–10 obstacle counts).

2. **SPEC.md §6.4 Win Condition** — No substantive change needed; layout is metadata.

3. **docs/ROADMAP.md**:
   - Move §Milestone 5 — Obstacle Redesign from "In Progress" to "Completed" with ✅
   - Under "Not Started", remove "Obstacle redesign" line
   - Update "Current Progress" section
   - Mark features: "Handcrafted Layout System" as ✅
   - Mark success criteria: "Every level feels different" ✅, "Obstacles influence decisions" ✅, "Levels become memorable" ✅

4. **docs/PROJECT_STATE.md**:
   - Bump version: `v0.4.0` → `v0.5.0`
   - Current Status: "Level Progression System Complete" → "Obstacle Redesign Complete"
   - Current Milestone: "Milestone 5 - Obstacle Redesign" → "Milestone 6 - Difficulty Rebalance"
   - Current Priorities: update to M6 priorities
   - Next Milestone: M5 → M6
   - In Progress: remove "Handcrafted obstacle layout design"
   - Success Definition: mark M5 criteria as completed
   - Add Milestone 5 completion to "Completed Features" section

5. **package.json** (line 4):
   - Bump `"version": "0.4.0"` → `"0.5.0"`

6. **ARCHITECTURE.md** §Level System (line 155):
   - Update: `**Obstacles:** floor(level * 0.5), capped at 8` → `**Obstacles:** predefined handcrafted layouts per level (see `LEVEL_DESIGN.md`)`
   - Remove random obstacle placement description if present

### Verification

- [ ] Documentation reads consistently — no contradictory statements between files
- [ ] `SPEC.md` obstacle section accurately describes layout system
- [ ] `ROADMAP.md` M5 is under Completed with ✅
- [ ] `PROJECT_STATE.md` shows correct version and next milestone
- [ ] No references to random obstacle generation remain in documentation (except possibly in historical context)

---

## Phase 5: Integration and Final Verification

**Goal:** Full end-to-end verification that the game functions correctly with handcrafted layouts.

### Manual Checks

- [ ] `npm run dev` — game loads without errors
- [ ] Level 1: board shows only snake + food, zero obstacles
- [ ] Level 2: board shows pillar layout, snake can navigate around it
- [ ] Levels 3–10: each shows distinct, non-random obstacle pattern
- [ ] Level-up transitions work correctly: new layout loads for next level
- [ ] Collision with obstacle triggers game over
- [ ] ScoreBoard HUD shows correct level name matching the new names
- [ ] LevelTransition overlay shows correct level name on level complete
- [ ] Game can be completed through all 10 levels (win state)
- [ ] Restart works correctly (reloads Level 1 layout)
- [ ] **Playability smoke test:** Hand-play Levels 8, 9, and 10 for at least 30 seconds each with a grown snake (≥ 15 segments). If any level is unsolvable or the obstacle density prevents routing, return to Phase 1 and reduce the rough tile count for that level, then re-verify.

### Automated Checks

- [ ] `npm run lint` — zero errors
- [ ] `npm run build` — zero errors
- [ ] `npm test` — all tests pass (existing 140 + new)
- [ ] `npm run preview` — production build works, PWA assets intact

### Git Verification

- [ ] `git diff` shows only intended changes
- [ ] No generated files or build artifacts in diff
- [ ] No secret files or tokens in diff
- [ ] Commit message follows Conventional Commits format

**Commit strategy:** Ship as a single commit on branch `feature/obstacle-redesign` with Conventional Commits format `feat(game): redesign obstacles with handcrafted layouts`. Documentation-only updates (Phase 4) may be a separate `docs:` commit at the implementer's discretion.

---

## Summary of All Files Changed

| File | Phase | Change |
|------|-------|--------|
| `src/game/types.ts` | 1 | Add `layout: Position[]` to `Level` |
| `src/game/levels.ts` | 1, 2 | Add layout arrays, update metadata, rewrite `generateObstacles` |
| `src/game/state.ts` | 2 | Update `generateObstacles` call sites (remove snake/food args) |
| `src/utils/__tests__/levelData.test.ts` | 3 | Update existing tests, add layout validation tests |
| `src/components/__tests__/LevelTransition.test.tsx` | 3 | Update hardcoded level names and description for renamed levels |
| `src/game/__tests__/state.test.ts` | 3 | Verify CONTINUE_GAME integration assertions remain valid |
| `SPEC.md` | 4 | Update §3.3 Obstacles to describe layout system |
| `docs/ROADMAP.md` | 4 | Move M5 to Completed, update progress |
| `docs/PROJECT_STATE.md` | 4 | Bump to v0.5.0, update status and milestones |
| `package.json` | 4 | Bump version to `0.5.0` |
| `ARCHITECTURE.md` | 4 | Update Level System description |

**No UI component, CSS, or hook files change.** The obstacle data flows through the existing `GameState.obstacles` → `Board` → `Cell` pipeline unchanged. `LevelTransition.test.tsx` is updated only to match renamed level metadata — the component itself requires no changes.

---

## Plan Review Checklist

Before implementation begins, verified:

- [x] No future-milestone leakage (speed, food objectives, visuals, new mechanics excluded)
- [x] No speculative architecture (no obstacle system abstraction, no layout editor, no level format schema)
- [x] Aligns with "ship the game" — keeps changes minimal, observable, testable
- [x] Follows AGENTS.md — documentation updates included, ROADMAP maintenance planned
- [x] Simpler than alternatives — predefined arrays over layout DSL, no configuration file format
- [x] No UI or component changes — obstacle rendering pipeline unchanged
- [x] All test files referencing level names or `generateObstacles` are updated (including `LevelTransition.test.tsx`)
- [x] No file references the old Level 3 name "Pillar Run" for Level 3
- [x] Description text source is `LEVEL_DESIGN.md` Purpose field, not invented
