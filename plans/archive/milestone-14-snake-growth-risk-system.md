# Milestone 14 — Snake Growth Risk System

**Plan created:** 2026-06-12  
**Status:** Active  
**PRD:** `docs/prd/PRD_M14.md`

---

## Overview

Milestone 14 transforms food from an automatic collection into a meaningful risk/reward decision. The core mechanism is a tiered length-based multiplier that makes every food pickup increasingly valuable — and increasingly risky to pursue.

The plan implements five mechanisms from the PRD. **Phase D (risk-aware course generation) is the load-bearing phase** — it is the only mechanism that creates the "should I deviate for this food?" decision pressure. All other phases support, display, or celebrate that decision system.

- **Multiplier Pressure (E):** Tiered length-based scoring multiplier, displayed in HUD. Creates score pressure (food is "worth more") but does not by itself create decision pressure.
- **Tail Pressure (A):** Existing lane-blocking mechanic — **treated as a hypothesis to validate** (not a solved mechanism). The body-at-headY check only blocks lane changes when the snake's body is at the same Y as the head. For short snakes (length 3–8), this almost never occurs. Phase E validation will assess whether tail pressure is visible at lengths 10, 20, 30. If not, Phase D's risk placement must compensate.
- **Future Choice Restriction (C):** Existing tail-lane blocking — same code path as A. Acknowledged as not independent from A.
- **Obstacle Density Pressure (D):** Existing difficulty-scaling obstacle density (already in place — no code changes needed)

---

## Phases

### Phase A — Multiplier Engine & State

**Goal:** Replace the existing continuous length multiplier (`floor(length/5) + 1`) with a tiered milestone-based multiplier, and apply it to runner-mode food scoring. Add `maxMultiplier` to `GameState` for tracking the highest tier reached during a run.

**Multiplier semantic:** **Post-eat** — the multiplier is based on the snake's length *after* eating. The food that grows the snake from length 9 → 10 is rewarded at x2 (the new tier). This is the natural reading of PRD §12 ("Length 10 = x2") and aligns milestone detection timing with scoring.

**Files expected to change:**

| File | Change |
|------|--------|
| `src/game/snake.ts` | Add `getMultiplier(length)` function, export `MILESTONES` constant |
| `src/game/state.ts` | Replace `lengthMultiplier` with tiered `getMultiplier()` (post-eat); add `maxMultiplier` field; reset on `START_RUNNER` |
| `src/game/__tests__/state.test.ts` | Add tests: multiplier values at tier boundaries, scoring with multiplier, maxMultiplier tracking |
| `src/game/__tests__/snake.test.ts` | Add unit tests for `getMultiplier` function |

**Implementation details:**

1. Add to `src/game/snake.ts` (the natural home for length-based snake logic, consistent with `levels.ts`, `food.ts`, `runnerCourse.ts` pattern of one-purpose modules):
   ```ts
   export const MILESTONES = [10, 20, 30, 50];

   export function getMultiplier(length: number): number {
     if (length >= 50) return 5;
     if (length >= 30) return 4;
     if (length >= 20) return 3;
     if (length >= 10) return 2;
     return 1;
   }
   ```

2. In `src/game/state.ts`, `MOVE_SNAKE` runner branch — use post-eat length:
   ```ts
   // Use newSnake.length (post-eat) so the food that crosses the threshold gets the new tier
   const multiplier = getMultiplier(newSnake.length);
   let newScore = state.score + (ateFood ? POINTS_PER_FOOD * multiplier : 0);
   ```

3. Add `maxMultiplier: number` to `GameState` (alongside `score`, `distance`, `lane`):
   ```ts
   // In MOVE_SNAKE runner branch:
   const newMaxMultiplier = Math.max(state.maxMultiplier, getMultiplier(newSnake.length));
   ```
   Reset to `1` on `START_RUNNER` (alongside other runner reset fields in the `START_RUNNER` case at `state.ts:50-69`).

4. Distance scoring is NOT multiplied — only food points are. This preserves distance as a baseline and makes food collection the differentiator.

5. Re-export `getMultiplier` and `MILESTONES` from `src/game/index.ts` barrel export (consistent with other utility exports).

**Note:** The pre-existing `state.test.ts` gold-food-timer flakiness (PROJECT_STATE.md §Known Technical Debt #1) is unaffected — the new multiplier tests use runner-mode `MOVE_SNAKE` with normal food, no gold timer.

**Tests:**
- `getMultiplier` returns correct values at boundaries: 3→1, 9→1, 10→2, 19→2, 20→3, 29→3, 30→4, 49→4, 50→5
- Eating food at length 10 earns `POINTS_PER_FOOD * 2` points (post-eat: snake grew from 9→10, uses length 10)
- Eating food at length 5 earns `POINTS_PER_FOOD * 1` points (use synthetic state with `snake.length = 5` after eating)
- Eating food at length 50 earns `POINTS_PER_FOOD * 5` points (use synthetic state with `snake.length = 50`, not 48-tick simulation)
- `maxMultiplier` updates correctly at tier crossings
- `START_RUNNER` resets `maxMultiplier` to 1
- Classic-mode food scoring is unchanged by the multiplier refactor (regression test: `MOVE_SNAKE` in non-runner mode with `score = 90`, snake at length 3, eats food → `newScore = 100`)

**Verification:**
- `npm test` — all existing tests pass, new multiplier tests pass
- `npx tsc --noEmit` — no type errors

---

### Phase B — HUD Expansion (Minimal)

**Goal:** Display the current multiplier and snake length prominently in the RunnerHUD so the player always knows their growth status. Keep active-play HUD minimal (4 sections); defer non-essential information.

**Design principle:** During active play, the player should care about **growth** (length, multiplier), not **milestone forecasting**. The "Next Milestone" section may cause the player to optimize for thresholds rather than current risk — defer to game-over only.

**Files expected to change:**

| File | Change |
|------|--------|
| `src/components/RunnerHUD.tsx` | Add `multiplier` prop; render multiplier section (accent color + glow) alongside existing sections |
| `src/components/RunnerHUD.module.css` | Add styles for multiplier section; mobile responsive wrapping |
| `src/components/RunnerGame.tsx` | Read `multiplier` and `maxMultiplier` from state, pass to RunnerHUD/RunnerGameOver |
| `src/components/RunnerGameOver.tsx` | Add `maxMultiplier` prop; display "Max Multiplier: xN" + "Next Milestone: N" in stats |
| `src/components/RunnerGameOver.module.css` | Minor: add style for max multiplier and next milestone stat rows |

**Implementation details:**

1. RunnerHUD layout (active play — 4 sections):
   ```
   [Score (gold)] | [Multiplier x2] | [Length 12] | [Distance]
   ```
   - Multiplier section uses accent color (`--color-accent-soft`) with glow, distinct from the gold score
   - "Best" (existing section) moves to a secondary row OR is hidden during active play (shown only on game over)
   - **No "Next Milestone" in active HUD** — deferred to game-over screen

2. RunnerGame reads multiplier from state (already computed from `state.maxMultiplier`):
   ```ts
   const multiplier = getMultiplier(state.snake.length);
   ```
   Import `MILESTONES` from `src/game/snake.ts` (no duplicate constant declaration).

3. RunnerGameOver shows:
   ```
   Max Multiplier: x3
   Next Milestone: 20   (hidden if at max tier 50+)
   ```
   alongside existing Distance, Food, Length, Best stats. The "Next Milestone" row shows the nearest milestone above the player's current length at time of death.

4. Mobile responsive CSS (`@media (max-width: 600px)`):
   - Existing separator is hidden (preserve existing pattern)
   - The `Best` stat wraps to a second row
   - Multiplier and Length remain in the primary row with Score and Distance
   - Mobile: 4 primary sections inline, Best wrapped below
   - Desktop: all 5 sections inline

5. `maxMultiplier` comes from `GameState.maxMultiplier` (added in Phase A), not a ref/closure. Reset automatically on `START_RUNNER`.

**Tests:**
- `src/components/__tests__/RunnerHUD.test.tsx` (new file): renders multiplier section with correct value, accent color class present
- `src/components/__tests__/RunnerGameOver.test.tsx` (new file): shows max multiplier, shows next milestone (hidden at length 50+)

**Verification:**
- `npm test` — new component tests pass
- `npm run dev` — visual check of HUD with 4 active-play sections, multiplier styling distinct from score
- `npx tsc --noEmit` — no type errors
- `npm run lint` — no warnings

---

### Phase C — Milestone Celebration (Simplified)

**Goal:** Provide audio and visual feedback when the snake crosses a multiplier tier boundary (length 10, 20, 30, 50). This makes growth feel rewarding. **Keep it simple** — a single milestone sound with pitch variation, plus a HUD flash. Defer tier-specific harmonic progressions to a follow-up milestone. The growth impact of Phase D is more important than celebration quality.

**Files expected to change:**

| File | Change |
|------|--------|
| `src/platform/sound.ts` | Add `playMilestone(tier: 2 | 3 | 4 | 5)` method — single ascending tone pattern, higher pitch per tier |
| `src/game/Engine.ts` | Declare `onMilestone?: (tier: 2 | 3 | 4 | 5) => void;` alongside `onEat`/`onLevelUp`; fire on tier-up in runner mode during `dispatch()` |
| `src/components/RunnerGame.tsx` | Wire `onMilestone` in `useEffect` to sound + HUD animation trigger; clean up in return function |
| `src/components/RunnerHUD.tsx` | Accept `celebrateMultiplier` prop for visual pulse animation |
| `src/components/RunnerHUD.module.css` | Add `.celebrating` class with scale + glow keyframe animation |
| `src/game/__tests__/Engine.test.ts` | Add test: `onMilestone` fires at length 10, 20, 30, 50; does NOT fire at length 11, 21; does NOT fire on non-food tick at length 10 |

**Implementation details:**

1. SoundManager.playMilestone(tier):
   - Single ascending two-tone sine: base frequency = `400 + tier * 100` Hz (tier 2→600, tier 3→700, tier 4→800, tier 5→900)
   - Two tones: base frequency for 0.12s, then base+200Hz for 0.12s, 80ms gap
   - Gain: `gain.gain.setValueAtTime(0.12, ...)` per tone (safe for 2 simultaneous tones), linear decay to 0 over 0.3s
   - Higher tiers get slightly longer sustain (0.15s per tone) and slightly higher gain (up to 0.15)
   - Fire-and-forget oscillators (follow existing `playLevelUp` pattern)

2. Engine class declaration — add alongside `onEat`, `onLevelUp` (at `Engine.ts:284-288`):
   ```ts
   onMilestone?: (tier: 2 | 3 | 4 | 5) => void;
   ```
   Use a discriminated union for type safety (not plain `number`).

3. Engine.dispatch() adds milestone detection:
   ```ts
   if (this.state.isRunner && this.state.status === 'playing' && ateFood) {
     const newMultiplier = getMultiplier(newSnake.length);
     const prevMultiplier = getMultiplier(this.state.snake.length);
     if (newMultiplier > prevMultiplier) {
       this.onMilestone?.(newMultiplier as 2 | 3 | 4 | 5);
     }
   }
   ```
   Detection is gated on `ateFood` — prevents firing on non-food ticks.

4. RunnerGame wires `onMilestone` in a `useEffect`:
   ```ts
   useEffect(() => {
     if (!engine) return;
     engine.onMilestone = (tier) => {
       sharedSoundManager.playMilestone(tier);
       setCelebrateMultiplier(tier);
       setTimeout(() => setCelebrateMultiplier(null), 600);
     };
     return () => { engine.onMilestone = undefined; };
   }, [engine]);
   ```

5. RunnerHUD: multiplier section gets class `styles.celebrating` when `celebrateMultiplier` matches current multiplier. Animation: 0.6s scale pulse (1.0 → 1.15 → 1.0) + accent-color glow flash.

**Tests:**
- `src/game/__tests__/Engine.test.ts`:
  - `onMilestone` fires when snake grows from 9→10 (post-eat, new tier at length 10)
  - `onMilestone` fires when snake grows from 19→20, 29→30, 49→50
  - `onMilestone` does NOT fire when snake grows from 10→11 (same tier)
  - `onMilestone` does NOT fire on MOVE_SNAKE at length 10 with no food eaten (guard against accidental firing)

**Verification:**
- `npm test` — engine milestone tests pass
- `npm run dev` — manually verify: play runner mode, eat food until length 10 → hear sound, see HUD pulse
- `npx tsc --noEmit` — no type errors

---

### Phase D — Risk-Aware Course Generation

**Goal:** Place food in positions that create risk/reward decisions tied to the snake's **length** (current multiplier tier), not distance. The core question: does the player deviate from their safe forward path to collect food? The food placement should create a competing incentive — the safe path is food-free, and the risky path has the reward.

**Design principle:** Risk is defined by the **choice cost** (how much lane deviation is required), not just the obstacle count. A "risky" placement forces the player to change lanes to reach food, potentially into a lane with more obstacles. The risk should **grow with the player** (length/multiplier), not with survival time.

**Food risk by tier (length-based):**

| Tier | Multiplier | Length Range | Food Placement Bias |
|------|------------|--------------|---------------------|
| 1 | x1 | 3–9 | Safe rows only (0 obstacles). Food in player's current lane or adjacent lane. |
| 2 | x2 | 10–19 | Safe or Medium rows. Food may be in non-current lane, requiring a lane change. |
| 3 | x3 | 20–29 | Medium rows preferred. Food in a different lane from player. |
| 4 | x4 | 30–49 | Medium/High rows. Food requires lane deviation of 2+ positions from current lane. |
| 5 | x5 | 50+ | High rows preferred. Food on a row with 2 obstacles (1 clear lane), forcing a thread-through maneuver. |

**Algorithm (pseudocode):**

```
function placeRiskAwareFood(rows: Row[], headY: number, snakeLength: number, currentLane: LaneIndex): Food {
  const tier = getMultiplier(snakeLength);
  
  // Categorize rows by obstacle count (excluding rows within 3 of headY)
  // The existing headY exclusion in spawnRunnerFood (runnerCourse.ts:42-48) is preserved.
  const safeRows = rows.filter(r => r.obstacles === 0 && Math.abs(r.y - headY) >= 3);
  const mediumRows = rows.filter(r => r.obstacles === 1 && Math.abs(r.y - headY) >= 3);
  const highRows = rows.filter(r => r.obstacles === 2 && Math.abs(r.y - headY) >= 3);
  
  // Select target row based on tier
  let targetRow: Row | null = null;
  switch (tier) {
    case 1: // Safe only, prefer current lane or adjacent
      targetRow = pickSafeRow(safeRows, currentLane);
      break;
    case 2: // Safe or medium, may require lane change
      targetRow = pickWeightedRow(safeRows, mediumRows, bias=0.7); // 70% safe
      break;
    case 3: // Medium preferred, different lane from player
      targetRow = pickMediumRowDifferentLane(mediumRows, safeRows, currentLane);
      break;
    case 4: // Medium/High, requires 2+ lane deviation
      targetRow = pickDeviatedRow(mediumRows, highRows, safeRows, currentLane, minDeviation=2);
      break;
    case 5: // High preferred, forced thread-through
      targetRow = pickWeightedRow(highRows, mediumRows, bias=0.8); // 80% high
      break;
  }
  
  // Fallback: if no row matches the desired risk level, use next safest level
  // If still no row, spawn on any safe row (guaranteed to exist per course generation contract)
  if (!targetRow) targetRow = safeRows[0] ?? mediumRows[0] ?? highRows[0];
  
  // Place food: if the row has 0 obstacles, food goes in a clear lane
  // If 1 obstacle, food goes in a clear lane NOT matching player's current lane (forces lane change)
  // If 2 obstacles, food goes in the single clear lane (forced thread-through)
  const foodLane = pickFoodLane(targetRow, currentLane, tier);
  
  return { y: targetRow.y, x: RUNNER_LANE_X[foodLane] };
}
```

**Placement principles:**
- **Tier 1 (safe):** Food in player's current lane on a clear row. No decision — free score.
- **Tier 2:** Food may be in an adjacent lane on a clear row. The "decision" is whether to lane-change for food (low cost).
- **Tier 3:** Food in a different lane, row has 1 obstacle. Player must evaluate the obstacle pattern to reach food.
- **Tier 4:** Food requires significant lane deviation (crossing 2+ obstacles), creating real navigation risk.
- **Tier 5:** Food on high-risk rows with 2 obstacles. Reaching food means threading a narrow gap — high chance of death.

**"Lowest-risk lane" clarification:** On a 2-obstacle row, only 1 lane is clear — food goes there (no choice). On a 1-obstacle row, 2 lanes are clear — food goes in the clear lane that is NOT the player's current lane (forcing a lane change for tiers 3+). On a 0-obstacle row, food goes in the player's current lane (tier 1) or adjacent lane (tier 2).

**One food per lap** (same as current). The risk level varies per tier — the player must decide whether to deviate for risky food.

**Existing headY exclusion preserved:** The existing `Math.abs(y - headY) < 3` check in `spawnRunnerFood` (`runnerCourse.ts:42-48`) is already implemented and is preserved. The new risk-aware placement also respects this exclusion — no code change required.

**Files expected to change:**

| File | Change |
|------|--------|
| `src/game/runnerCourse.ts` | Add risk classification logic (`getMultiplier`-based); vary food placement by tier |
| `src/game/__tests__/runnerCourse.test.ts` | Add tests for risk categories per tier, safe-path existence, food-is-optional, lane-deviation requirement |

**Tests:**
- Food is always in a lane column (x in RUNNER_LANE_X)
- At tier 1 (length 3–9), food is on a row with 0 obstacles (safe)
- At tier 3 (length 20), food may be on rows with 1 obstacle (medium), in a different lane from player
- At tier 5 (length 50), food may be on rows with 2 obstacles (high), food lane is the only clear lane
- A clear lane always exists on food rows (food is reachable)
- Food never spawns within 3 rows of head Y (existing exclusion preserved)
- Fallback: if no row matches the desired risk level, food spawns on a safe row
- All existing course tests still pass (spacing, bounds, clear lanes)
- Food placement at tier 2+ requires a lane change from player's current position (choice-based)

**Verification:**
- `npm test` — all course generation tests pass
- `npm run dev` — manually verify:
  - Early game (length 3–9): food on clear rows, easy to collect
  - Mid game (length 10–29): food starts appearing on rows with obstacles, in different lanes
  - Late game (length 30+): food on high-risk rows, requires navigating through narrow gaps
- `npx tsc --noEmit` — no type errors

---

### Phase E — Validation Setup & Documentation

**Goal:** Create validation infrastructure for recordings, update all project documentation, and execute behavioral validation.

**Files expected to change/create:**

| File | Change |
|------|--------|
| `docs/Milestone 14-validation/README.md` | Create: recording instructions, success criteria, per-death failure analysis template |
| `.gitignore` | Add validation recording file patterns (`.mov`, `.mp4`, `.webm`); recordings stored externally, only README.md and screenshots committed |
| `SPEC.md` | Update specific sub-sections (see below) |
| `ARCHITECTURE.md` | Add new sub-section (see below) |
| `docs/PROJECT_STATE.md` | Update version to v0.14.0, status, features, test count |
| `docs/ROADMAP.md` | Mark M14 complete, move to archive |
| `docs/archive/completed-milestones.md` | Add M14 entry |

**SPEC.md updates (specific sub-sections):**
- §20.4: Replace `floor(length/5) + 1` with tiered multiplier (10→x2, 20→x3, 30→x4, 50→x5). Document post-eat semantics.
- §20.5: Add Multiplier section to HUD (active-play 4-section layout: Score | Multiplier | Length | Distance)
- §20.6: Add Max Multiplier stat row to RunnerGameOver, Next Milestone row
- §20.9: Add risk-aware food placement details (length-based tiers, Safe/Medium/High, choice-based placement)
- New §20.13: Milestone Celebration (visual pulse + sound at length 10/20/30/50)

**ARCHITECTURE.md update:**
- Add new sub-section "Growth Risk System" after the "Lane Change Visual Feedback" sub-section (~line 205), documenting:
  - (a) `getMultiplier` and `MILESTONES` in `src/game/snake.ts`
  - (b) `maxMultiplier` in `GameState`, computed in runner `MOVE_SNAKE`, reset on `START_RUNNER`
  - (c) `onMilestone` callback on `Engine`, wired in `RunnerGame.tsx` via `useEffect`
  - (d) Risk-aware food placement in `src/game/runnerCourse.ts` (length-based, choice-based)
  - (e) `playMilestone` in `src/platform/sound.ts`

**Validation evidence — concrete behavioral observations (DoD blockers):**

The following behaviors MUST be observable in at least one recording each. If any are missing, the milestone fails regardless of multiplier/HUD/sound correctness:

| # | Behavior | Evidence |
|---|----------|----------|
| A | Food intentionally skipped | Player passes through a row with food without changing lane to collect it |
| B | Food intentionally pursued despite danger | Player crosses into a high-risk lane to collect food |
| C | Route changed by food | Player changes lane 2+ times in a single lap to pursue a food item |
| D | Death caused by food pursuit | Player dies within 1–2 seconds of collecting food in a high-risk position |

**Per-death failure analysis (for each recording):**
1. Why did the player die? (collision with obstacle / wall / self)
2. Was food involved in the death? (just ate food / pursuing food / moved for food)
3. Was growth involved? (longer snake contributed to the crash)
4. Would a shorter snake have survived? (counterfactual analysis)

If 0% of deaths are growth-related, the milestone has not changed behavior. If 30%+ are growth-related, the milestone is producing real risk.

**Tail Pressure validation (Phase E task):**
- Record gameplay at lengths 10, 20, 30.
- Review: can a viewer see growth creating navigation constraints?
- If not, tail pressure is not a working mechanism and Phase E documents this finding.

**Verification:**
- Review all docs for consistency
- `npm test` — full test suite passes
- `npm run build` — clean build
- `npx tsc --noEmit` — clean
- `npm run lint` — no new warnings

---

## Risks and Assumptions

| Risk | Mitigation |
|------|-----------|
| Multiplier scoring change may make high scores drastically higher than classic mode | Acceptable — runner and classic are separate modes. Score display is per-mode. |
| Risk-aware food placement may produce unreachable food at extreme tiers | Fallback: if no valid row exists for the desired risk level, fall back to next safest level → safe row as ultimate fallback (same as current logic) |
| Milestone celebration sounds may clip or overlap if player grows rapidly | SoundManager's fire-and-forget oscillators handle overlap; simplified to 2-tone design with per-tier gain < 0.15 prevents clipping |
| HUD becomes too crowded on mobile with new sections | Reduced to 4 active-play sections (Score, Multiplier, Length, Distance); Best wraps to second row on mobile; Next Milestone deferred to game-over |
| Tail pressure / lane blocking may not be proven at typical run lengths (3–8) | Treated as hypothesis — Phase E validation checks visibility at lengths 10, 20, 30. If not visible, Phase D's risk placement compensates. |
| New component tests may need new test infrastructure | Follow existing patterns — vitest + jsdom, same as other component tests |
| Phase D (risk placement) is the most uncertain phase — game design, not engineering | Validation gate after Phase D prevents wasted effort on B/C if D doesn't create decision pressure |
| Food placement may not actually change player behavior (players may collect all food regardless) | Behavioral validation in Phase E explicitly requires recording evidence of skipping/pursuing; if missing, risk system must be reworked |
| Milestone multiplier changes require updating both `getMultiplier` and `MILESTONES` in sync | Both live in `src/game/snake.ts` (single source of truth); Phase A test verifies each MILESTONE is a tier boundary |

**Assumptions:**
- The existing tail lane blocking mechanic at `state.ts:91-95` *may* create navigation constraints at lengths 10+, but this is unproven and treated as a hypothesis — Phase E validates
- The existing obstacle density scaling (6→12 patterns, increasing double-blockers) provides sufficient obstacle diversity for risk-aware food placement
- The multiplier applies to food points only, not distance points. This keeps distance as a baseline reward and makes the "food is a decision" dynamic clear.
- One food per lap is sufficient — risk comes from whether the single food is worth diverting for at the current tier
- Milestone sounds use the same Web Audio API oscillator approach (no audio asset files)
- `maxMultiplier` tracks the highest tier reached (an integer 1–5), not the highest food multiplier earned — these are equivalent given post-eat semantics

---

## Out of Scope

These items are explicitly NOT part of Milestone 14:

- New food types (gold, poison, slow) in runner mode — existing normal food is sufficient
- Multiple food items per lap — adds complexity without clear benefit over single-food risk variation
- Powerups, achievements, missions, unlockables, cosmetics (per PRD §4 Non-Goals)
- Lane commitment slowdown mechanic (Mechanism B) — rejected as artificial per PRD philosophy
- Changes to classic/endless mode — M14 is runner-mode only
- Cloud sync, leaderboards, or online features
- Mobile-specific UI beyond responsive CSS
- PWA deployment or packaging changes

---

## Milestone Definition of Done

- [ ] Phase A: Multiplier engine implemented; food scoring uses tiered multiplier (post-eat); `maxMultiplier` tracked in GameState; reset on `START_RUNNER`
- [ ] Phase D: Course generation places food with risk-vs-reward positioning tied to length/multiplier tier (choice-based)
- [ ] Validation Gate: 1 recording shows at least 2 of 4 behavioral observations (food skipped, food pursued, route changed, death by food)
- [ ] Phase B: HUD shows current multiplier during active play (4-section layout); max multiplier and next milestone on game over
- [ ] Phase C: Milestone celebration single sound + HUD animation at length 10, 20, 30, 50
- [ ] Phase E: Documentation updated (SPEC §20.4, §20.5, §20.6, §20.9, §20.13; ARCHITECTURE "Growth Risk System" sub-section; ROADMAP; PROJECT_STATE)
- [ ] Phase E: 5 gameplay recordings with per-death failure analysis completed in `docs/Milestone 14-validation/`
- [ ] All 4 behavioral observations confirmed in recordings (food skipped, food pursued, route changed, death by food)
- [ ] Tail pressure assessed: visible at lengths 10, 20, 30 (or documented as non-working)
- [ ] All tests pass (`npm test`)
- [ ] `npm run build` completes with no errors
- [ ] `npx tsc --noEmit` passes with no errors
- [ ] `npm run lint` passes with no new warnings
- [ ] Project owner confirms growth changes behavior (answers YES to PRD §20 validation questions)

**Milestone success evaluation:** Does a length-30 snake make different decisions than a length-3 snake? If the answer is "no, only the score is higher," the milestone fails regardless of multiplier, HUD, or sound correctness.

---

## Execution Order

Phases are designed to **fail fast**: validate the risk system's behavioral impact before building UI/celebration that depend on it.

```
A (Multiplier + State) → D (Risk Placement) → Validation Gate
   ↓ successful                                    ↓ unsuccessful
B (HUD) → C (Celebration) → E (Docs)        Rework D before proceeding
```

**Phase A must complete first** (scoring engine and state fields are foundational).  
**Phase D is the load-bearing phase** — it is validated next because if it fails to create decision pressure, Phases B and C are wasted.  
**Validation Gate:** After Phase D, create 1 recording and verify at least 2 of the 4 behavioral observations (food skipped, food pursued, route changed, death by food). If the gate passes, proceed to B/C. If not, rework Phase D before spending effort on B/C.  
**Phase B (HUD)** and **Phase C (celebrations)** both depend on D being validated. They can be parallelized if needed.  
**Phase E is last** (captures the complete system).

---

## Post-Implementation Review Checklist

After all phases are implemented, verify against PRD requirements:

**PRD §5 Success Question:** Does growth change decisions?  
→ Verify via recordings using the 4 concrete behavioral observations (food skipped, food pursued, route changed, death by food) and per-death failure analysis.

**PRD §6 Observable Success Criteria:**  
→ A: Food intentionally skipped — Player passes through a row with food without changing lane ✓  
→ B: Food intentionally pursued despite danger — Player crosses into a high-risk lane to collect food ✓  
→ C: Route changed by food — Player changes lane 2+ times in a single lap to pursue food ✓  
→ D: Death caused by food pursuit — Player dies within 1–2 seconds of collecting food in a high-risk position ✓  
→ E: Long runs visibly protected — Player with high multiplier survives multiple laps with risk-aware placement ✓

**PRD §8 Growth Tiers:**  
→ Each tier feels mechanically different: tier 1 (safe food, free score), tier 2 (food may require lane change), tier 3 (food in different lane with obstacles), tier 4 (significant lane deviation required), tier 5 (thread-through high-risk rows). The multiplier escalation (x2→x5) and risk escalation compound to create increasing tension.

**PRD §20 Project Owner Validation Questions:**  
→ 1. Did growth matter?  
→ 2. Did growth change routes?  
→ 3. Did growth create tension?  
→ 4. Did growth create memorable moments?  
→ 5. Would removing growth make the game worse?
