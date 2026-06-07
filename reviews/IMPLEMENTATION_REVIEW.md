# Implementation Review: Milestone 9 — Replayability Systems

**Reviewer:** Staff Engineer (Implementation Review)
**Milestone under review:** M9 — Replayability Systems (all three phases)
**Source documents:** `plans/ACTIVE.md`, `AGENTS.md`, `docs/ROADMAP.md`, `ARCHITECTURE.md`, `SPEC.md`, `docs/PROJECT_STATE.md`, `package.json`
**Implementation files reviewed:** `src/game/types.ts`, `src/game/state.ts`, `src/game/Engine.ts`, `src/game/statistics.ts`, `src/game/achievements.ts`, `src/game/index.ts`, `src/hooks/useGame.ts`, `src/components/Game.tsx`, `src/components/GameOver.tsx`, `src/components/ScoreBoard.tsx`, `src/components/Statistics.tsx`, `src/components/Achievements.tsx`, `src/types/components.ts`, all 17 test files
**Verification commands run:** `npm test` (212/212 pass), `npm run lint` (clean), `npm run build` (success, 220 kB JS / 68 kB gz)
**Review date:** 2026-06-07
**Branch under review:** `feature/milestone-8-visual-identity` (M9 work applied on top of M8)

---

# Executive Summary

## Overall Assessment

**Approve.** The M9 implementation is a faithful, appropriately-scoped execution of `plans/ACTIVE.md:1-386` across all three phases (Endless Mode, Statistics, Achievements). The change surface matches the plan's file tables precisely: 6 new files (`statistics.ts`, `achievements.ts`, `Statistics.tsx`, `Statistics.module.css`, `Achievements.tsx`, `Achievements.module.css`), 11 modified files, and 3 new test files. The architectural choices made in the plan (Engine callback pattern, batched stats cache, screen-reader re-use via `announceRef`) are implemented as designed. The reducer is a clean, minimal extension of the existing `MOVE_SNAKE` switch case. The `Engine.dispatch()` lifecycle ordering matches the plan's spec for achievement detection (between reducer and listener notification, with persistence before callback fire).

All hard verification gates pass cleanly:
- `npm test` → 17 files, **212/212 tests passing** (34-test increase from M8's 178).
- `npm run lint` → exit 0, no errors, no warnings.
- `npm run build` → exit 0, PWA manifest emitted, precache 8 entries, JS bundle 220 kB / 68 kB gz, CSS 15 kB / 3 kB gz.

The cross-document set (SPEC.md, ARCHITECTURE.md, ROADMAP.md, PROJECT_STATE.md) is internally consistent. The version bump to `0.9.0` is applied. The plan's Definition of Done is met.

The findings below are minor and none blocks the milestone. The most notable are: (1) the `statsCache` is undermined by per-action `increment*`/`update*` calls that also write to localStorage, partially defeating the plan's "avoids per-food writes" intent; (2) `Engine.getStats()` re-reads localStorage on every state change instead of using the cache; (3) `checkAchievements` triggers a localStorage read on every dispatch; (4) `Engine.ts:58` hardcodes `10` rather than `POINTS_PER_FOOD`; (5) `GameOver.tsx` has a complex nested conditional structure that could benefit from small refactoring.

## Major Strengths

1. **Plan fidelity is high across all three phases.** The implementation matches `plans/ACTIVE.md:1-386` essentially line-for-line:
   - Phase 1 (Endless Mode): `isEndless: boolean` field on `GameState` (`types.ts:31`), `START_ENDLESS_GAME` action (`types.ts:43`), reducer case at `state.ts:152-167` setting all required fields, `MOVE_SNAKE` level-up guard at `state.ts:74`, `Engine.startEndless()` at `Engine.ts:138-142`, `useGame` exposing `startEndlessGame` (`useGame.ts:93-95`), `ScoreBoard` endless display (`ScoreBoard.tsx:9-15`), `GameOver` endless button + score text (`GameOver.tsx:14-20`).
   - Phase 2 (Statistics): `src/game/statistics.ts` with the full surface (`loadStats`, `saveStats`, `incrementGamesPlayed`, `incrementTotalFood`, `updateBestLevel`), Engine integration in `Engine.dispatch()` (`Engine.ts:41-71`), `Statistics.tsx` panel, `Engine.getStats()` (`Engine.ts:144-147`).
   - Phase 3 (Achievements): `src/game/achievements.ts` with `Achievement` type, 3 definitions, `loadAchievements`, `saveAchievement`, `checkAchievements`; `Engine.wasPaused` private field (`Engine.ts:18`); Engine check at `Engine.ts:73-77`; `onAchievementUnlock` callback (`Engine.ts:210`); `Achievements.tsx` with "NEW" badge; screen reader announce via `Game.tsx:130-133`.

2. **Architecture alignment is strong.** The Engine remains framework-agnostic: `statistics.ts` and `achievements.ts` import only from `game/types.ts` and `game/storage.ts` (`achievements.ts:1`, `statistics.ts:1-6`). The React layer reads stats through `Engine.getStats()` exclusively (no localStorage reads from `Game.tsx`), per F3 in the plan review. The `wasPaused` field lives in the Engine (not `GameState`) per the plan's justification ("Engine-private tracker never read by the UI or the reducer"). Achievements and statistics share no state with each other; their persistence is independent.

3. **Conservative change surface.** Six new files; eleven modified files. All new files appear in the plan's "Files Expected to Change" tables. No new abstractions (no toast manager, no achievement system object, no state machine library) were introduced. The new UI components are flat, presentational, and consume props directly. The `MOVE_SNAKE` endless guard is a single token added to a boolean expression.

4. **Test coverage matches the plan's specified test list.** All test categories from `plans/ACTIVE.md:85-97, 159-167, 245-257` are covered. The test counts are:
   - `state.test.ts`: 43 tests including 6 for `START_ENDLESS_GAME` (`state.test.ts:563-601`) and 4 for endless `MOVE_SNAKE` (`state.test.ts:603-691`).
   - `Engine.test.ts`: 26 tests including 2 for `startEndless` (`Engine.test.ts:306-354`).
   - `GameOver.test.tsx`: 9 tests including 4 for endless mode UI (`GameOver.test.tsx:94-154`).
   - `statistics.test.ts`: 5 tests (`statistics.test.ts:4-61`).
   - `achievements.test.ts`: 7 tests (`achievements.test.ts:23-97`).
   - `Statistics.test.tsx`: 1 test (`Statistics.test.tsx:7-21`).
   - `Achievements.test.tsx`: 3 tests (`Achievements.test.tsx:14-35`).

5. **All hard verification gates pass.**
   - `npm test` → 17 files, **212/212 tests passing** (1.96s).
   - `npm run lint` → exit 0, no errors, no warnings.
   - `npm run build` → exit 0, PWA precache 8 entries (242 KiB), JS 220 kB / 68 kB gz, CSS 15 kB / 3 kB gz.

6. **Documentation is comprehensive and consistent.** SPEC.md adds §6.5 (Endless Mode), §6.6 (Statistics), §6.7 (Achievements), §10.4a/b (Statistics/Achievements panels), §12.4/5 (new persistence keys), §15 (updated test counts). ARCHITECTURE.md updates State Shape, Project Structure, and Testing sections. ROADMAP.md marks M9 complete with the four sub-features listed. PROJECT_STATE.md updates Current Version (0.9.0), Current Status, Current Milestone (M10), and the per-phase success criteria. The `package.json` version is bumped to `0.9.0`.

## Major Concerns

None. The implementation is solid and consistent with the plan. The findings below are minor and could be addressed in a follow-up cleanup pass or carried into M10.

---

# Findings

## F1 — Per-food localStorage writes undermine the stats cache (Deviation from plan)

- **Severity:** Medium
- **Category:** Performance / Scope
- **Description:** `plans/ACTIVE.md:273` states: "Stats writes are batched (in-memory cache flushed on game over / win / pause) rather than per-food." However, the implementation calls `incrementTotalFood(foodCount)` (`Engine.ts:60`) on every food eaten, which reads and writes localStorage immediately. Similarly, `incrementGamesPlayed()` (`Engine.ts:42`) writes on every start action, and `updateBestLevel(level)` (`Engine.ts:65`) writes on every level change. The cache (`this.statsCache`) is then also flushed on `gameover`/`won`/`paused` (`Engine.ts:70`), producing duplicate writes.
- **Consequence:** For a full 10-level campaign run (200–230 food eaten), there are ~200–230 read+write cycles for `snakeStatsTotalFood` plus a single batched `saveStats` write at the end. This is ~200 extra localStorage operations per run. Synchronous localStorage is fast enough that this is not a user-visible problem, but it is a measurable deviation from the plan's stated intent.
- **Recommendation:** Either (a) remove the per-action `incrementTotalFood` / `updateBestLevel` calls in `Engine.dispatch()` and rely solely on the `saveStats` flush at gameover/win/pause, or (b) explicitly acknowledge the deviation in a plan/RISKS comment. Option (a) is consistent with the plan and saves 200+ localStorage operations per run.

## F2 — `Engine.getStats()` re-reads localStorage on every state change (Missed optimization)

- **Severity:** Medium
- **Category:** Performance / Architecture
- **Description:** `Engine.getStats()` (`Engine.ts:144-147`) calls `loadStats()` (which reads 3 localStorage keys) and merges in `this.state.highScore`. The hook calls `engine.getStats()` in the subscriber callback (`useGame.ts:27`), which fires on every dispatch (every `MOVE_SNAKE`, `CHANGE_DIRECTION`, etc.). The `statsCache` field exists in the Engine but is never used in `getStats()`. So the cache is dead state from the perspective of the read path.
- **Consequence:** Every `MOVE_SNAKE` produces 3 localStorage reads (via `getStats` → `loadStats`). For a 100ms tick rate, this is 30 localStorage reads per second during gameplay. Acceptable but wasteful.
- **Recommendation:** Have `getStats()` return `{ ...this.statsCache, highScore: this.state.highScore }` (or a normalized version) and have the `Engine` constructor seed `statsCache` from `loadStats()`. This eliminates the per-tick localStorage read while keeping the public API identical. The flush at gameover/win/pause (`Engine.ts:70`) already persists the cache.

## F3 — `checkAchievements` reads localStorage on every dispatch (Performance)

- **Severity:** Low
- **Category:** Performance
- **Description:** `checkAchievements` (`achievements.ts:70`) calls `loadAchievements()` to read the current unlock state and filter out already-unlocked IDs. This runs from `Engine.dispatch()` on every action. So every `MOVE_SNAKE`, `CHANGE_DIRECTION`, `PAUSE_GAME`, etc. triggers a JSON parse of `snakeAchievements` from localStorage.
- **Consequence:** Same as F2 — adds a localStorage read on every dispatch. At a 100ms tick rate, this is 10 reads/second during gameplay. Not a user-visible problem at the current scale.
- **Recommendation:** Cache the unlocked-IDs set in the Engine (mirror of `statsCache` pattern), updated when an achievement is saved. Alternative: skip `checkAchievements` entirely for actions that cannot produce unlocks (e.g., `MOVE_SNAKE` before food threshold, `CHANGE_DIRECTION`, `PAUSE_GAME`, `RESUME_GAME`).

## F4 — Hardcoded `10` in `Engine.ts:58` (Maintainability)

- **Severity:** Low
- **Category:** Maintainability
- **Description:** `Engine.ts:58` computes the food count as `(this.state.score - prevScore) / 10`, hardcoding the POINTS_PER_FOOD value. Every other reference to this constant uses the named import (`state.ts:2`, `state.test.ts:4`). If the value ever changes (via env var, since `POINTS_PER_FOOD = Number(import.meta.env.VITE_POINTS_PER_FOOD) || 10`), the stats tracking will silently break.
- **Recommendation:** Import `POINTS_PER_FOOD` in `Engine.ts` and use it. One-line change.

## F5 — `GameOver.tsx` complex nested conditional structure (Maintainability)

- **Severity:** Low
- **Category:** Maintainability
- **Description:** The button section in `GameOver.tsx:21-43` has four nested branches based on `lastUnlockedLevel > 1`, `isWin`, and `isEndless`. The control flow is hard to follow at a glance, especially the case where `isWin && !isEndless` and `lastUnlockedLevel > 1` (line 28-32), which conditionally sets `autoFocus` based on whether `onStartEndless` is provided.
- **Recommendation:** Extract the button list into a small data-driven structure (e.g., a list of `{ label, onClick, autoFocus, variant }` objects) and render with `.map()`. Pure refactor; no behavior change.

## F6 — ROADMAP M9 format inconsistency (Documentation)

- **Severity:** Low
- **Category:** Documentation
- **Description:** Milestones M1–M8 in `ROADMAP.md` follow the pattern `### Milestone N — Name ✅` (with a single `✅` after the milestone title) followed by goal/problem/features. M9 (`ROADMAP.md:534-575`) uses a different pattern: `### Milestone 9 - Replayability Systems ✅` followed by sub-bullets `### Endless Mode ✅`, `### Statistics ✅`, `### Achievements ✅` (using `###` for the sub-bullets rather than `##` or list items).
- **Recommendation:** Restructure M9 to follow the M1–M8 pattern. Optional cleanup; the content is correct and complete.

## F7 — No integration test for idle screen rendering statistics / achievements (Testing)

- **Severity:** Low
- **Category:** Testing
- **Description:** F11 in `plans/PLAN_REVIEW.md` noted: "Phase 2 / Phase 3 specify tests for the new components in isolation, but the DoD and per-phase verification sections do not require a test that `Game.tsx` actually wires them into the idle and game-over overlays." The current `Game.test.tsx` (4 tests) only covers the pause button. There is no test asserting that the idle overlay renders `<Statistics>` and `<Achievements>` panels.
- **Recommendation:** Add a small test in `Game.test.tsx` that renders `Game` in idle state and asserts the presence of "Games Played" / "Achievements" / "Total Food" text. Would catch regressions where someone removes the wiring.

## F8 — Inconsistent data-win attribute behaviour (Minor; not a bug)

- **Severity:** Low
- **Category:** Maintainability
- **Description:** `GameOver.tsx:11` sets `data-win={isWin || undefined}`, which evaluates to `undefined` (no attribute) when `isWin` is false. The previous review (Phase 1 only) flagged this as a potential issue with endless game-over. Verifying the implementation: endless game-over uses `variant="gameover"` (default), so `isWin === false`, and `data-win` is correctly absent. The CSS rule `.gameOverModal[data-win] h2` at `GameOver.module.css:28` therefore does not apply for endless game-over, which is the desired behavior.
- **Recommendation:** No action required. The implementation is correct; the previous review's concern was based on an incorrect reading.

## F9 — `wasPaused` reset semantics are correct but undocumented (Documentation)

- **Severity:** Low
- **Category:** Documentation
- **Description:** `Engine.wasPaused` is reset to `false` in `start()` (`Engine.ts:100`), `reset()` (`Engine.ts:121`), and `startEndless()` (`Engine.ts:139`), and set to `true` in `pause()` (`Engine.ts:106`). This is per the plan. However, the `Engine.ts` file has no inline comment explaining the rationale ("Engine-private tracker never read by the UI or the reducer").
- **Recommendation:** Add a one-line comment in `Engine.ts` near the `wasPaused` field declaration. Optional but improves handoff quality.

## F10 — Redundant per-game `gamesPlayed` write (Performance / Cleanliness)

- **Severity:** Low
- **Category:** Performance
- **Description:** Related to F1. On every `START_GAME` / `RESET` / `START_ENDLESS_GAME` action, `Engine.ts:42` calls `incrementGamesPlayed()` which performs a localStorage read + write. Then on the eventual `gameover`/`won`/`paused`, `saveStats(this.statsCache)` (`Engine.ts:70`) writes `gamesPlayed` again. The first write is redundant — the cache has the same value, and the eventual flush will write it.
- **Recommendation:** Same as F1 — drop the per-action `incrementGamesPlayed` call and rely on the cache + flush. Saves one read+write per game.

## F11 — Inconsistent README handling (Documentation)

- **Severity:** N/A (informational)
- **Category:** Documentation
- **Description:** `README.md` was not updated. Per `AGENTS.md`: "Do not update README.md unless setup instructions, controls, or user-facing features change." M9 adds a user-facing feature (endless mode) and new overlays (statistics, achievements), but the controls and setup did not change. The README is correctly untouched. The plan's "Documentation Update Targets" section does not list README.
- **Recommendation:** No action required. Listing here for completeness.

---

# Plan Compliance Review

## Phase 1 — Endless Mode

**Verdict: Complete as planned.**

| Plan Deliverable | Status | Reference |
|---|---|---|
| `isEndless` field on `GameState` | ✅ Done | `types.ts:31` |
| `START_ENDLESS_GAME` action | ✅ Done | `types.ts:43` |
| Reducer handles `START_ENDLESS_GAME` (level=10, reset snake/direction/foodEaten, status=playing, keep score, level 10 obstacles) | ✅ Done | `state.ts:152-167` |
| `MOVE_SNAKE` skips level-up when `isEndless` | ✅ Done | `state.ts:74` |
| `Engine.startEndless()` method | ✅ Done | `Engine.ts:138-142` |
| `useGame.startEndlessGame` callback | ✅ Done | `useGame.ts:93-95` |
| `Game.tsx` wires `handleStartEndless` | ✅ Done | `Game.tsx:99-102` |
| `ScoreBoard.isEndless` prop + display | ✅ Done | `ScoreBoard.tsx:9-15` |
| `GameOver` win overlay "Endless Mode" button (primary, autoFocus) | ✅ Done | `GameOver.tsx:16-20` |
| `GameOver` endless score text "Endless Score: N" | ✅ Done | `GameOver.tsx:14` |
| GameOver hint mentions Endless Mode | ✅ Done | `GameOver.tsx:51` |
| 3 new state tests + 2 new engine tests + 3 new GameOver tests | ✅ Done (9 new) | `state.test.ts:563-691`, `Engine.test.ts:306-354`, `GameOver.test.tsx:94-154` |

No deviation from the plan in Phase 1. The `makeState` helper in `state.test.ts:6-26` includes `isEndless: false` per Risk #7 in the plan.

## Phase 2 — Statistics

**Verdict: Complete as planned, with the F1/F2 deviation noted above.**

| Plan Deliverable | Status | Reference |
|---|---|---|
| `src/game/statistics.ts` with `loadStats`, `saveStats`, `incrementGamesPlayed`, `incrementTotalFood`, `updateBestLevel` | ✅ Done | `statistics.ts:1-61` |
| Engine integration: `incrementGamesPlayed` on start/reset/startEndless | ✅ Done | `Engine.ts:41-44` |
| Engine integration: food count + level changes update cache | ✅ Done | `Engine.ts:57-66` |
| Engine integration: cache flush on gameover/win/pause | ✅ Done | `Engine.ts:68-71` |
| `Engine.getStats()` method | ✅ Done | `Engine.ts:144-147` |
| `useGame` exposes `stats` | ✅ Done | `useGame.ts:18`, `:99` |
| `Statistics.tsx` component (4 stats) | ✅ Done | `Statistics.tsx:1-25` |
| `Statistics.module.css` styles | ✅ Done | `Statistics.module.css` |
| Statistics shown on idle overlay | ✅ Done | `Game.tsx:227` |
| Statistics shown on gameover/win overlay | ✅ Done | `GameOver.tsx:44-46` |
| 5 statistics tests + 1 component test | ✅ Done (6 new) | `statistics.test.ts`, `Statistics.test.tsx` |

Deviation: the plan's intent of "avoids per-food writes" (Risk #6) is not fully met because `incrementTotalFood` / `updateBestLevel` / `incrementGamesPlayed` are called per action and write to localStorage immediately (F1, F10). The cache is present but its value is also written through these per-action calls.

## Phase 3 — Achievements

**Verdict: Complete as planned.**

| Plan Deliverable | Status | Reference |
|---|---|---|
| `src/game/achievements.ts` with `Achievement` type, 3 definitions, `loadAchievements`, `saveAchievement`, `checkAchievements` | ✅ Done | `achievements.ts:1-75` |
| 3 achievement definitions (`beat_game`, `score_500`, `no_pause`) | ✅ Done | `achievements.ts:12-16` |
| Detection conditions in `checkAchievements` | ✅ Done | `achievements.ts:55-74` |
| Re-award prevention | ✅ Done | `achievements.ts:71-74` |
| `Engine.wasPaused` private field | ✅ Done | `Engine.ts:18` |
| `wasPaused` reset on start/reset/startEndless | ✅ Done | `Engine.ts:100,121,139` |
| `wasPaused` set on pause | ✅ Done | `Engine.ts:106` |
| Engine calls `checkAchievements` after reducer, before listeners | ✅ Done | `Engine.ts:73-77` (before `Engine.ts:79` listener notify) |
| Achievements saved to localStorage before callback fires | ✅ Done | `Engine.ts:75-76` |
| `onAchievementUnlock` callback property | ✅ Done | `Engine.ts:210` |
| `useGame` exposes `achievements` | ✅ Done | `useGame.ts:19,100` |
| `useGame` reloads achievements on unlock callback | ✅ Done | `useGame.ts:42-44` |
| Screen reader announces unlocks via `announceRef` | ✅ Done | `Game.tsx:117-136,275` |
| `GameOver` shows "Achievements Unlocked" section + "NEW" badge | ✅ Done | `GameOver.tsx:47-49` |
| `Achievements.tsx` component | ✅ Done | `Achievements.tsx:1-28` |
| `Achievements.module.css` styles | ✅ Done | `Achievements.module.css` |
| Idle overlay shows achievements | ✅ Done | `Game.tsx:228` |
| 7 achievement tests + 3 component tests | ✅ Done (10 new) | `achievements.test.ts`, `Achievements.test.tsx` |

The plan's spec for "between the `gameReducer` call and the `this.listeners.forEach(...)` call, call `checkAchievements(...)`, save, fire callback" is met. The implementation does this at `Engine.ts:73-77`, and `this.listeners.forEach` is at `Engine.ts:79`. Persistence is durable before the callback fires (line 75-76). Listeners see the new state, and the React-side `setAchievements(loadAchievements())` callback in `useGame.ts:43` updates the UI in the next render.

## Shared

**Verdict: Complete as planned.**

| Deliverable | Status | Reference |
|---|---|---|
| `src/game/index.ts` exports new types and functions | ✅ Done | `index.ts:34-37` |
| `checkAchievements` is exported (not internal) | ⚠️ Minor deviation | `index.ts` does not export `checkAchievements` (consistent with the plan review's F15 recommendation to keep it internal) |
| `ROADMAP.md` marks M9 complete | ✅ Done | `ROADMAP.md:147-154, 534-575` |
| `PROJECT_STATE.md` updates version, status, features | ✅ Done | `PROJECT_STATE.md:1-373` |
| `SPEC.md` documents all three features | ✅ Done | `SPEC.md:159-191, 418-430, 484-501` |
| `package.json` version bumped to `0.9.0` | ✅ Done | `package.json:4` |

Note: The plan's "Files Expected to Change" table mentions exporting `checkAchievements` (via "Phase 2: ... `getStats`. Phase 3: ... `loadAchievements`, `saveAchievement` (keep `checkAchievements` internal to Engine only)"). The parenthetical at the end of that line is the actual instruction: `checkAchievements` should NOT be exported. The implementation correctly does not export it. The F15 finding in `plans/PLAN_REVIEW.md` is therefore satisfied. (The plan-review's previous reading of this section was ambiguous; the implementation is correct.)

## Milestone Definition of Done

| DoD Item | Status |
|---|---|
| Endless Mode playable from win screen with indefinite play, no level-ups | ✅ Verified by `state.test.ts:603-691`, `Engine.test.ts:306-354` |
| Statistics tracking persisted and displayed | ✅ Verified by `statistics.test.ts` + `Statistics.test.tsx` + manual flow |
| All 3 achievements detectable, persistable, displayed | ✅ Verified by `achievements.test.ts` + `Achievements.test.tsx` |
| Idle screen shows statistics and achievements | ✅ `Game.tsx:227-228` |
| Game Over / Win screens show statistics and achievements | ✅ `GameOver.tsx:44-49` |
| Screen reader announces achievement unlocks | ✅ `Game.tsx:117-136` |
| All existing 178 tests still pass | ✅ 212/212 (34 new + 178 existing) |
| New tests for new modules and components | ✅ 34 new tests across 4 new test files |
| `npm run build` no errors | ✅ Exit 0 |
| `npm run lint` no new warnings | ✅ Exit 0 |
| SPEC.md, ARCHITECTURE.md, ROADMAP.md, PROJECT_STATE.md updated | ✅ Verified (see Documentation Review below) |
| `package.json` version bumped to `0.9.0` | ✅ `package.json:4` |

All DoD items are met.

---

# Documentation Review

## ROADMAP.md

- **M9 in Completed section:** ✅ Present at `ROADMAP.md:147-154` with the four sub-features.
- **M9 milestone detail section:** ✅ Present at `ROADMAP.md:534-575` with Endless Mode, Statistics, Achievements sub-features and success criteria.
- **Current Progress → Next Milestone:** ✅ M9 is "Completed: 2026-06-07" (`ROADMAP.md:573`). "In Progress" is empty (`ROADMAP.md:157-158`). "Not Started" lists M10+ (`ROADMAP.md:160-167`).
- **Format inconsistency (F6):** ⚠️ M9 uses inline `### Endless Mode ✅` sub-bullets inside the milestone block, while M1–M8 use a flatter structure. Content is correct, just stylistic.

## ARCHITECTURE.md

- **State Shape updated:** ✅ `ARCHITECTURE.md:235-250` now includes `isEndless: boolean`.
- **Project Structure updated:** ✅ `ARCHITECTURE.md:30-31` lists `statistics.ts` and `achievements.ts`. `ARCHITECTURE.md:49-50` lists `Statistics.tsx` and `Achievements.tsx`. `ARCHITECTURE.md:60` lists `utils/__tests__/` (legacy).
- **Testing section updated:** ✅ `ARCHITECTURE.md:282-287` lists 17 test files and 212 tests across the new modules. File list in coverage mentions `statistics, achievements` in modules and `Statistics, Achievements` in components.
- **State Machine:** The M9-related transitions (`START_ENDLESS_GAME → playing (isEndless=true)`, endless mode `MOVE_SNAKE → playing`) are NOT explicitly added to the state diagram (`ARCHITECTURE.md:203-231`). SPEC.md §7.1 does include them (`SPEC.md:198-228`), but ARCHITECTURE.md is silent. This is a minor gap.
- **No ADR created for M9 architecture decisions:** The plan introduced a new `Engine.wasPaused` private field, `Engine.statsCache` field, and `Engine.getStats()` public method. None of these are individually novel enough to warrant an ADR (per AGENTS.md's ADR Rules), so the absence of an ADR is acceptable.

## PROJECT_STATE.md

- **Current Version:** ✅ v0.9.0 (`PROJECT_STATE.md:5`).
- **Current Status:** ✅ "Milestone 9 (Replayability Systems) Complete" with all three phases listed (`PROJECT_STATE.md:11-16`).
- **Current Milestone:** ✅ Milestone 10 - Gameplay Expansion (`PROJECT_STATE.md:22-26`).
- **Current Priorities:** ✅ "Replayability systems (Milestone 9), Endless mode, statistics, and achievements, Gameplay expansion planning (Milestone 10)" (`PROJECT_STATE.md:32-34`). All three M9 phases are listed.
- **In Progress section:** ✅ "Milestone 10: Gameplay Expansion (food variants, advanced mechanics)" (`PROJECT_STATE.md:207`).
- **Next Milestone section:** ✅ Mirrors the In Progress section.
- **Completed Features (M9):** ✅ Three subsections (`PROJECT_STATE.md:165-197`) cover Endless Mode, Statistics, and Achievements with per-feature summary.
- **Success criteria (per phase + overall):** ✅ Three per-phase + one overall Milestone 9 success criteria blocks (`PROJECT_STATE.md:314-364`). Each criterion is checkmarked.
- **Known Technical Debt:** ✅ "_No known technical debt._" (`PROJECT_STATE.md:213`). The F1–F11 findings above are minor; the user has not asked us to add them. If the team considers F1/F2/F3 worth tracking, this section should be updated.

## SPEC.md

- **§6.5 Endless Mode:** ✅ `SPEC.md:159-168` — describes availability, layout/speed, no transitions, score, game over, isEndless flag, ScoreBoard/GameOver display.
- **§6.6 Statistics:** ✅ `SPEC.md:170-179` — describes aggregate stats, persistence, four tracked stats, display locations.
- **§6.7 Achievements:** ✅ `SPEC.md:181-191` — describes three achievements, persistence, display, screen reader, NEW badge.
- **§7.1 State Machine:** ✅ `SPEC.md:198-228` — adds `START_ENDLESS_GAME → playing (isEndless=true)` from `won`, and `MOVE_SNAKE (isEndless=true) → playing` from playing.
- **§10.4a Statistics Panel:** ✅ `SPEC.md:337-343` — describes compact panel, CSS Modules, idle/gameover placement.
- **§10.4b Achievements Panel:** ✅ `SPEC.md:345-352` — describes locked/unlocked display, NEW badge, screen reader, CSS Modules.
- **§10.5 GameOver updates:** ✅ `SPEC.md:354-364` — endless score text, Endless Mode button, Statistics inline, Achievements inline.
- **§12.4 Statistics:** ✅ `SPEC.md:418-423` — new localStorage keys, defaults, batched save, load.
- **§12.5 Achievements:** ✅ `SPEC.md:425-430` — new key, JSON array, default empty, save/load.
- **§15 Testing:** ✅ `SPEC.md:482-501` — test counts updated to 212 across 17 files; new modules/components listed.

## Documentation Consistency

Cross-checking the three doc files (SPEC, ARCHITECTURE, PROJECT_STATE) for internal consistency on M9:

- **`isEndless` field name:** Consistent across all docs. ✅
- **localStorage keys:** `snakeStatsGamesPlayed`, `snakeStatsTotalFood`, `snakeStatsBestLevel`, `snakeAchievements` — consistent across all docs. ✅
- **Achievement IDs:** `beat_game`, `score_500`, `no_pause` — consistent. ✅
- **Test count:** 212 across 17 files — consistent across all docs. ✅
- **Version:** 0.9.0 — consistent in `package.json` and PROJECT_STATE. ✅

No documentation contradictions found.

---

# Testing Review

## Test Inventory

| File | Tests | Notes |
|---|---|---|
| `state.test.ts` | 43 (incl. 10 new for M9) | Covers START_ENDLESS_GAME (6) and endless MOVE_SNAKE (4) |
| `Engine.test.ts` | 26 (incl. 2 new) | Covers startEndless dispatch + indefinite play |
| `GameOver.test.tsx` | 9 (incl. 4 new) | Endless mode UI: button presence, click, score text, autoFocus |
| `statistics.test.ts` | 5 (new) | loadStats, incrementGamesPlayed, incrementTotalFood, updateBestLevel, saveStats |
| `achievements.test.ts` | 7 (new) | loadAchievements, saveAchievement (incl. re-award), checkAchievements (4 conditions + re-award) |
| `Statistics.test.tsx` | 1 (new) | Renders all 4 stat labels and values |
| `Achievements.test.tsx` | 3 (new) | Renders 3 achievements, locked vs unlocked, NEW badge |
| All other test files | 116 (unchanged) | Pre-M9 test coverage |
| **Total** | **212** | **+34 from M8's 178** |

## Verification Quality

- **Reducer coverage** is thorough. The `START_ENDLESS_GAME` case is tested for 6 distinct conditions (sets isEndless, level, snake, foodEaten, score, obstacles). The endless `MOVE_SNAKE` is tested for 4 conditions (no levelComplete, no won, collision still triggers gameover, indefinite play beyond level 10 threshold).
- **Engine coverage** is appropriate. `startEndless` is tested for dispatch + status, and the indefinite-play test runs 6 MOVE_SNAKE dispatches in endless mode and asserts status remains `playing`. (The plan suggested 50 dispatches with snake-position validation; the implementation uses 5 dispatches with status validation. F12 in the plan review noted that 50 is arbitrary; the current approach is adequate.)
- **Component coverage** is sufficient. The GameOver tests cover presence, callback wiring, and the autoFocus attribute. The Statistics and Achievements component tests are minimal but cover the contract.
- **Achievement re-award prevention** is explicitly tested (`achievements.test.ts:90-96`).

## Missing Tests

- **F7**: No test that the idle overlay actually renders `<Statistics>` and `<Achievements>`. The components are tested in isolation but the wiring in `Game.tsx:227-228` is not exercised.
- **F3 in plan review (F11)**: No test for `Engine.dispatch` correctly saving stats on game over / level-up. Stats tracking is covered via the `statistics.ts` module, but the integration in `Engine.dispatch` (e.g., that eating food actually updates the in-memory `statsCache`) is not tested.
- **No test for the screen reader announce path** (`Game.tsx:117-136`). A test could verify that `announceRef.textContent` is set to "Achievement unlocked: {name}" after a win. Existing `useGame.ts` does not expose an announce method; the test would need to render `Game` and assert on the live region. This is a low-priority gap.

## Test Hygiene

- **Test count matches the plan's "all existing 178 tests still pass" DoD item:** ✅ 178 existing + 34 new = 212 total.
- **Test isolation:** All tests use Vitest's `beforeEach(() => localStorage.clear())` for storage tests. Engine tests use `vi.useFakeTimers()` correctly.
- **Test naming:** Descriptive `describe` / `it` blocks throughout. No `it.only` or `.skip` left behind.

---

# Architectural Review

## Engine Surface Area

The Engine class (`Engine.ts:11-216`) now exposes:
- Public: `getState`, `subscribe`, `start`, `pause`, `resume`, `changeDirection`, `reset`, `continueGame`, `startAtLevel`, `startEndless`, `getStats`, `destroy`, and the optional callback properties (`onEat`, `onLevelUp`, `onGameOver`, `onWin`, `onAchievementUnlock`).
- Test-only: `setState`, `testDispatch` (`Engine.ts:150-157`).
- Private: `dispatch`, `startLoop`, `stopLoop`, plus the instance fields.

This is a reasonable surface. The new `startEndless` and `getStats` methods are well-scoped additions. The `onAchievementUnlock` callback follows the existing `onEat` / `onLevelUp` / `onGameOver` / `onWin` pattern (consistency).

## `Engine.dispatch()` Complexity

`Engine.ts:36-97` is now 62 lines. Pre-M9 it was ~37 lines. The growth is linear with the number of features that hook into state transitions. The method is now a sequence of independent observation blocks:

1. Capture `prevScore`, `prevLevel`, `prevState`.
2. If start action, increment `gamesPlayed` cache and persist.
3. Apply reducer.
4. If gameover/won, save high score + lastUnlockedLevel.
5. If levelComplete, save lastUnlockedLevel.
6. If score increased, update `totalFood` cache and persist.
7. If level changed, update `bestLevel` cache and persist.
8. If gameover/won/paused, flush stats cache.
9. Check achievements, save, fire callback.
10. Notify listeners.
11. Stop loop if gameover/won.
12. Fire sound callbacks.

This is a lot of orthogonal side effects in one method. It is readable today (each block is short and labeled by an `if` comment), but it is approaching the point where extracting the side effects into named helper methods (e.g., `private updateStats(prevScore, prevLevel)`, `private checkAndSaveAchievements(prevState)`) would be a small clarity win. The F1/F2/F3 findings all stem from this concentration. A refactor is not required for the milestone but is worth considering for M10.

## `wasPaused` Field

`Engine.ts:18` declares `private wasPaused: boolean = false`. The field is mutated in 4 places (`Engine.ts:100, 106, 121, 139`) and read in 1 place (`Engine.ts:73`). This is a small, well-contained change. The decision to keep it in the Engine (rather than `GameState`) is correct per the plan's justification and F1 in the plan review.

## `statsCache` Field

`Engine.ts:17` declares `private statsCache: Stats`, initialized in the constructor (`Engine.ts:22`). The cache is updated in `Engine.dispatch` (`Engine.ts:43, 59, 64, 69`) and flushed on gameover/win/pause (`Engine.ts:70`). It is NOT used in `getStats` (F2). The cache is half-effective: it provides batched writes for `saveStats` but is undermined by the per-action `increment*`/`update*` calls that also write. F1/F2/F10 are the consequence.

## Achievement Localstorage Key

`snakeAchievements` stores a JSON array of achievement IDs (`achievements.ts:42-48`). The format is a flat array of strings, not a record. This is simple and sufficient for the current scale (3 achievements total). Future-proofing is not required for the milestone.

## Achievement Persistence Ordering

The plan's ordering is implemented correctly:
- Persistence (`Engine.ts:75`: `saveAchievement(id)`) happens before the callback (`Engine.ts:76`: `this.onAchievementUnlock?.(id)`).
- The callback fires before listener notification (`Engine.ts:79`).
- The React-side callback in `useGame.ts:43` calls `setAchievements(loadAchievements())`, which is queued for the next React render.

This means: when React re-renders, the new achievements are already in localStorage. The screen reader announce (which happens in `Game.tsx:117-136` in a separate effect triggered by the `achievements` prop changing) fires after the re-render. The sequence is correct.

---

# Final Decision

## **Approve**

The M9 (Replayability Systems) implementation is approved.

The implementation meets all Definition of Done items in `plans/ACTIVE.md:331-344`. All 212 tests pass, the linter is clean, and the build succeeds. The documentation across SPEC.md, ARCHITECTURE.md, ROADMAP.md, and PROJECT_STATE.md is comprehensive and internally consistent. The version bump to `0.9.0` is applied. The change surface is minimal and matches the plan's file tables precisely. The Engine lifecycle ordering for achievement detection matches the plan's spec.

The findings (F1–F11) are minor and non-blocking. They are summarized below in priority order for the team to consider as a follow-up cleanup pass or as the basis for a M10 technical-debt item.

### Recommended follow-up actions (in priority order)

1. **F1, F10:** Remove the per-action `incrementTotalFood`, `incrementGamesPlayed`, `updateBestLevel` calls in `Engine.dispatch()` and rely solely on the `statsCache` + `saveStats` flush. Restores the plan's "avoids per-food writes" intent. Saves ~200 localStorage operations per campaign run.
2. **F2:** Make `Engine.getStats()` use `this.statsCache` (with a fresh load in the constructor) instead of re-reading localStorage. Eliminates per-tick localStorage reads.
3. **F3:** Cache the unlocked-IDs set in the Engine (or skip `checkAchievements` for non-productive actions). Eliminates per-tick JSON parse of `snakeAchievements`.
4. **F4:** Replace the hardcoded `10` in `Engine.ts:58` with `POINTS_PER_FOOD`.
5. **F5:** Refactor `GameOver.tsx:21-43` to a data-driven button list.
6. **F6:** Normalize M9 format in `ROADMAP.md` to match M1–M8.
7. **F7:** Add an integration test in `Game.test.tsx` asserting the idle overlay renders `<Statistics>` and `<Achievements>`.
8. **F8, F9, F11:** Documentation and comment polish; no behavioral changes.

None of the above should block approval. They are appropriate as M10 cleanup or pre-merge polish items.

### Alignment with project philosophy

The implementation is consistent with the project's "Development Philosophy" in `AGENTS.md`:
- **Small changes** ✅ (one boolean flag, one new action, minimal component additions).
- **Simple solutions** ✅ (flat React components, no new state machines, no toast manager).
- **Maintainable code** ✅ (clear separation, well-typed props, no clever tricks).
- **Playable progress** ✅ (M9 is shippable as-is).

The implementation is consistent with the "Documentation Rules" in `AGENTS.md`:
- Behavior changes update SPEC.md ✅.
- Architecture changes update ARCHITECTURE.md ✅.
- Completed roadmap work updates ROADMAP.md ✅.
- Project status changes update PROJECT_STATE.md ✅.
- No major decisions warranting a new ADR were made (Engine.wasPaused is justified in the plan, not a new architectural decision).

The implementation is consistent with the "Milestone Scope" rule in `AGENTS.md`:
- Did not pull future milestone work into M9 ✅.
- The "Out of Scope" section in `plans/ACTIVE.md:23-33` was respected (no leaderboards, no procedural generation, no music, no achievement toasts, no separate stats screen).
- No ideas were added to the implementation that aren't in the plan; the "Simplification Review" section in the plan (lines 378-385) correctly maps to the implementation.

---

**Outcome:** Approve. M9 is ready to merge.

---

# Resolution Summary

## F1 — Per-food localStorage writes undermine the stats cache

- **Status:** Resolved
- **Rationale:** Removed `incrementGamesPlayed()`, `incrementTotalFood()`, and `updateBestLevel()` calls from `Engine.dispatch()`. The `statsCache` is now updated in-memory on each action and flushed to localStorage only on gameover/won/pause via `saveStats()`. This restores the plan's "avoids per-food writes" intent and eliminates ~200 localStorage operations per campaign run.

## F2 — `Engine.getStats()` re-reads localStorage on every state change

- **Status:** Resolved
- **Rationale:** Changed `getStats()` to return `{ ...this.statsCache, highScore: this.state.highScore }` instead of calling `loadStats()`. The constructor seeds `statsCache` from `loadStats()`, and the flush at gameover/win/pause persists it. Eliminates per-tick localStorage reads (30/second at 100ms tick rate).

## F3 — `checkAchievements` reads localStorage on every dispatch

- **Status:** Resolved
- **Rationale:** Added `private unlockedAchievementIds: Set<string>` to Engine, initialized in constructor from `loadAchievements()`. The `checkAchievements` function now accepts this Set as a parameter instead of calling `loadAchievements()`. The Engine adds newly unlocked IDs to the Set after saving. Eliminates per-dispatch JSON parse of `snakeAchievements`.

## F4 — Hardcoded `10` in `Engine.ts:58`

- **Status:** Resolved
- **Rationale:** Imported `POINTS_PER_FOOD` from `./constants` and replaced the hardcoded `10` in the food count calculation. One-line change; prevents silent breakage if the constant value changes.

## F5 — `GameOver.tsx` complex nested conditional structure

- **Status:** Resolved
- **Rationale:** Refactored the button section to use a data-driven `ButtonDef[]` array with `.map()` rendering. The control flow for building the array is linear and easier to follow. No behavior change.

## F6 — ROADMAP M9 format inconsistency

- **Status:** Resolved
- **Rationale:** Restructured M9 in `ROADMAP.md` to follow the M1–M8 flat pattern (goal, features described inline, success criteria) instead of using `###` sub-bullets for Endless Mode, Statistics, and Achievements.

## F7 — No integration test for idle screen rendering statistics / achievements

- **Status:** Resolved
- **Rationale:** Added a test in `Game.test.tsx` that renders `Game` in idle state with non-empty stats and achievements, then asserts the presence of "Games Played", "Total Food", and "High Scorer" text. Catches regressions where someone removes the wiring.

## F8 — Inconsistent data-win attribute behaviour

- **Status:** Not Resolved (no action required)
- **Rationale:** The implementation is correct; the previous review's concern was based on an incorrect reading. No change needed.

## F9 — `wasPaused` reset semantics undocumented

- **Status:** Resolved
- **Rationale:** Added a one-line comment above the `wasPaused` field declaration: "Engine-private tracker for the no_pause achievement; never read by UI or reducer."

## F10 — Redundant per-game `gamesPlayed` write

- **Status:** Resolved
- **Rationale:** Addressed as part of F1. The per-action `incrementGamesPlayed()` call was removed; the cache is incremented in-memory and flushed on gameover/win/pause.

## F11 — Inconsistent README handling

- **Status:** Not Resolved (no action required)
- **Rationale:** README was correctly left untouched per AGENTS.md rules. No change needed.

---

## Summary

### Files Modified

| File | Changes |
|------|---------|
| `src/game/Engine.ts` | Removed per-action localStorage writes (F1/F10), use statsCache in getStats (F2), cache achievement IDs (F3), use POINTS_PER_FOOD (F4), add wasPaused comment (F9) |
| `src/game/achievements.ts` | Accept `unlockedIds: Set<string>` parameter instead of reading localStorage (F3) |
| `src/game/__tests__/achievements.test.ts` | Updated `checkAchievements` calls to pass `Set` parameter (F3) |
| `src/components/GameOver.tsx` | Refactored buttons to data-driven list (F5) |
| `src/components/__tests__/Game.test.tsx` | Added idle screen integration test for Statistics/Achievements (F7) |
| `docs/ROADMAP.md` | Normalized M9 format to match M1–M8 pattern (F6) |

### Findings Resolved

- F1 (Medium) — Per-food localStorage writes
- F2 (Medium) — getStats() re-reads localStorage
- F3 (Low) — checkAchievements reads localStorage per dispatch
- F4 (Low) — Hardcoded POINTS_PER_FOOD
- F5 (Low) — GameOver nested conditionals
- F6 (Low) — ROADMAP format inconsistency
- F7 (Low) — Missing integration test
- F9 (Low) — wasPaused undocumented
- F10 (Low) — Redundant gamesPlayed write

### Findings Intentionally Not Resolved

- F8 — No action required (implementation correct)
- F11 — No action required (README correctly untouched)

### Tests Executed

- `npm test` → **213/213 tests passing** (212 existing + 1 new F7 test)
- `npm run lint` → exit 0, no errors, no warnings
- `npm run build` → exit 0, PWA precache 8 entries, JS 220 kB / 68 kB gz, CSS 15 kB / 3 kB gz

### Remaining Risks

None. All Medium findings are resolved. Low findings are either resolved or intentionally not addressed (F8, F11). The stats cache is now fully effective: in-memory updates on every action, single localStorage flush on gameover/win/pause. Achievement detection no longer reads localStorage per dispatch.

---

# Verification Results (2nd Pass)

**Reviewer:** Staff Engineer (Implementation Review)
**Verification date:** 2026-06-07
**Scope:** Confirm that each previously identified finding has been adequately addressed by the remediation work. The original review contained no Critical findings and no High findings; the two highest-severity items were Medium (F1, F2). All previously identified findings are evaluated below for completeness.

## Critical Findings

None. The original review identified no Critical findings.

## High Findings

None. The original review identified no High findings.

## Medium Findings

| ID | Title | Verdict | Evidence |
|----|-------|---------|----------|
| F1 | Per-food localStorage writes undermine the stats cache | **Resolved** | `Engine.dispatch()` (`src/game/Engine.ts:46-73`) no longer calls `incrementTotalFood`, `incrementGamesPlayed`, or `updateBestLevel`. The `statsCache` is updated in-memory on each action and flushed to localStorage only on `gameover`/`won`/`paused` via `saveStats(this.statsCache)` (line 72). The `increment*`/`update*` exports remain in `statistics.ts` but are unused by the Engine; they are dead code but harmless. |
| F2 | `Engine.getStats()` re-reads localStorage on every state change | **Resolved** | `Engine.getStats()` (`src/game/Engine.ts:147-149`) returns `{ ...this.statsCache, highScore: this.state.highScore }`. The constructor seeds `this.statsCache` from `loadStats()` (line 26). No localStorage reads on the read path. |

## Low Findings

| ID | Title | Verdict | Evidence |
|----|-------|---------|----------|
| F3 | `checkAchievements` reads localStorage on every dispatch | **Resolved** | New `private unlockedAchievementIds: Set<string>` field (`src/game/Engine.ts:22`) initialized in the constructor from `loadAchievements()` (line 27). `checkAchievements` (`src/game/achievements.ts:55`) now takes `unlockedIds: Set<string>` as a parameter and filters on line 70 using `!unlockedIds.has(id)`. The Engine adds newly unlocked IDs to the Set at line 78. |
| F4 | Hardcoded `10` in `Engine.ts:58` | **Resolved** | `POINTS_PER_FOOD` imported on line 3 of `src/game/Engine.ts` and used on line 62: `const foodCount = (this.state.score - prevScore) / POINTS_PER_FOOD;` |
| F5 | `GameOver.tsx` complex nested conditional structure | **Resolved** | `src/components/GameOver.tsx:6-11` defines `ButtonDef` interface. Lines 16-31 build a linear `ButtonDef[]` array. Lines 40-49 render via `.map()`. No behavior change. |
| F6 | ROADMAP M9 format inconsistency | **Resolved** | `docs/ROADMAP.md:534-552` now uses the flat Goal/Features/Success Criteria pattern matching M1–M8. The "In Progress" summary at line 147-154 uses bulleted features (consistent with the rest of the Completed section). |
| F7 | No integration test for idle screen rendering statistics / achievements | **Resolved** | New test at `src/components/__tests__/Game.test.tsx:132-159` ("renders Statistics and Achievements panels on idle screen") asserts the presence of "Games Played", "5", "Total Food", "42", and "High Scorer" in the idle state. Test count rose from 212 to 213. |
| F8 | Inconsistent data-win attribute behaviour | **N/A** | The previous review concluded no action was required. Implementation remains correct. |
| F9 | `wasPaused` reset semantics undocumented | **Resolved** | Comment added at `src/game/Engine.ts:19`: "Engine-private tracker for the no_pause achievement; never read by UI or reducer." |
| F10 | Redundant per-game `gamesPlayed` write | **Resolved** | Addressed as part of F1. The per-action `incrementGamesPlayed()` call is gone; the cache is incremented in-memory on `START_GAME`/`RESET`/`START_ENDLESS_GAME` (`src/game/Engine.ts:46-48`) and flushed with `saveStats` on terminal states. |
| F11 | Inconsistent README handling | **N/A** | Previous review concluded no action was required. README remains correctly untouched. |

## No New Findings

A targeted second-pass review of the remediated files (`src/game/Engine.ts`, `src/game/achievements.ts`, `src/components/GameOver.tsx`, `docs/ROADMAP.md`, `src/components/__tests__/Game.test.tsx`, `src/game/__tests__/achievements.test.ts`) found no new Critical findings and no findings directly caused by the remediation work.

The following are noted for completeness only and do not affect the approval decision:

- The `incrementGamesPlayed`, `incrementTotalFood`, and `updateBestLevel` exports in `src/game/statistics.ts` are now dead code from the Engine's perspective. They are still covered by `statistics.test.ts` and remain harmless. Dead-code removal could be a small follow-up, but it is not a regression.
- `loadStats()` in `src/game/statistics.ts:31-38` still hardcodes `highScore: 0`. The Engine's `getStats()` overrides this with `this.state.highScore`, so the field is never observed in practice. Consistent with the plan (stats persistence only covers gamesPlayed/totalFood/bestLevel).

## Verification Commands

- `npm test` → 17 files, **213/213 tests passing** (+1 from the F7 integration test).
- `npm run lint` → exit 0, no errors, no warnings.
- `npm run build` → exit 0, PWA precache 8 entries, JS 220 kB / 68 kB gz, CSS 15 kB / 3 kB gz.

# Approval Decision

**Approve.**

The remediation work addresses every previously identified finding that required action. The two Medium findings (F1, F2) and seven of the nine Low findings (F3, F4, F5, F6, F7, F9, F10) are fully resolved with code-level evidence verified. The two remaining Low findings (F8, F11) were correctly identified in the previous review as requiring no action.

No new Critical findings were introduced. The remediation is minimal and surgical, matching the project's "small changes / simple solutions" philosophy. The stats cache is now fully effective, and achievement detection no longer reads localStorage per dispatch.

The M9 (Replayability Systems) implementation is ready to merge.
