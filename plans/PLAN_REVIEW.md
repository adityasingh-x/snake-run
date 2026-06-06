# Plan Review: Milestone 6 — Progress Persistence & Developer Experience

**Reviewer:** Staff Engineer (Plan Review)
**Plan under review:** `plans/ACTIVE.md` (Milestone 6 — Progress Persistence & Developer Experience, Draft, 2026-06-06)
**Source documents:** `ROADMAP.md`, `AGENTS.md`, `ARCHITECTURE.md`, `SPEC.md`, `docs/PROJECT_STATE.md`, `docs/adr/ADR-003-level-transition-overlay-design.md`, `package.json`, `src/game/Engine.ts`, `src/game/state.ts`, `src/game/storage.ts`, `src/game/types.ts`, `src/hooks/useGame.ts`, `src/components/Game.tsx`, `src/components/GameOver.tsx`, `src/platform/keyboard.ts`, `src/game/__tests__/Engine.test.ts`, `src/game/__tests__/state.test.ts`, `src/utils/__tests__/storage.test.ts`, `src/components/__tests__/Game.test.tsx`
**Review date:** 2026-06-06

---

# Overall Assessment

## Strengths

1. **Right-sized for the milestone.** Three features map 1:1 to ROADMAP M6 (`Continue From Last Reached Level`, `New Game Option`, `Developer Level Select`). No new abstractions, no new packages, no new files. This honours `AGENTS.md`'s "prefer simple solutions" and "avoid premature abstractions" rules.
2. **Mirrors existing patterns.** `loadLastUnlockedLevel` / `saveLastUnlockedLevel` mirror `loadHighScore` / `saveHighScore` (`src/game/storage.ts:1–12`) character-for-character. `Engine.startAtLevel()` mirrors `start()` and `continueGame()` (`src/game/Engine.ts:63–92`) with the same `dispatch + startLoop` pattern. New components follow the existing CSS-Module / props-style conventions. Zero new conventions introduced.
3. **Honest, bottom-up phasing.** Eight phases (persistence → state → engine → UI → wiring → a11y → tests → docs) with explicit per-phase verification. Every intermediate commit is compilable.
4. **Strong out-of-scope table.** Cloud saves, achievement tracking, statistics, difficulty rebalance, mobile-specific Continue UI, progress reset, mid-run level changes, production-facing level select are all explicitly fenced. Future-milestone leakage is essentially zero.
5. **Candid risk table.** Vite `import.meta.env.DEV` detection, two-button overlay crowding on small screens, dev-select leaking into production, and localStorage scope are all real risks with concrete mitigations.
6. **Testability is enumerated.** Phase 7 names ~17 new test cases across four files. Storage tests, state tests, component tests, and Game-component updates are each scoped.
7. **Button design is sound.** Primary (green, `autoFocus`, "Continue from Level N") and secondary (muted, no autoFocus, "New Game") are visually distinct. The Space=New Game / click=Continue asymmetry is intentional and pre-empts accidental continues on gameover.
8. **Persistence write pattern is correct.** Calling `saveLastUnlockedLevel` inside the existing `dispatch()` `if (gameover || won)` block (alongside `saveHighScore`) and a new `if (levelComplete)` block keeps the pattern consistent with how high score is persisted (`src/game/Engine.ts:36–38`). The `Math.max` inside `saveLastUnlockedLevel` makes repeated calls a no-op, so multiple dispatches in a session are safe.
9. **No ADR needed.** This is a self-contained feature addition (new state field, new action, new UI), not an architecture redesign. Skipping an ADR is the right call.

## Weaknesses

1. **`Engine.test.ts` is not in the Phase 7 file list.** The plan adds `Engine.startAtLevel()` (Phase 3a) and modifies `Engine.dispatch()` to write `lastUnlockedLevel` to localStorage (Phase 3a). Neither change has a test. The existing `Engine.test.ts:164–206` (`continueGame` describe block) shows the established pattern for testing engine methods that combine dispatch + startLoop — that pattern needs a parallel `startAtLevel` describe block, and a new test for the persistence side-effect.
2. **No `package.json` version bump.** `package.json:4` is currently `0.5.0`. `docs/PROJECT_STATE.md:5` is also `v0.5.0`. For M6, both should advance to `0.6.0` / `v0.6.0` to match the prior milestone's release cadence (`reviews/IMPLEMENTATION_REVIEW.md` and `plans/archive/2026-06-06-milestone-5-plan-review.md` F-07 establish the pattern). The plan updates `PROJECT_STATE.md` implicitly but does not list `package.json` in any phase.
3. **No `ARCHITECTURE.md` updates are planned.** AGENTS.md says: "Architecture changes: Update ARCHITECTURE.md". This is borderline — the system structure is unchanged, but two ARCHITECTURE.md items will go stale:
   - The state machine diagram (`ARCHITECTURE.md:199–224`) does not include the new `START_AT_LEVEL` transition or the `lastUnlockedLevel` field.
   - The testing count (`ARCHITECTURE.md:251`) says "143 unit tests" and will drift to ~160 after Phase 7.
4. **SPEC.md `§10.5 GameOver (shared component)` is not explicitly updated.** The plan updates `§7.1` (state machine), `§7.2` (state descriptions), `§8.1` (keyboard), `§12` (persistence, new `12.3`), and `§17` (limitations #2 and #3). It does not call out `§10.5`, which currently reads: "Both: Play Again button + 'Press Space to restart' hint" (`SPEC.md:287`). That sentence becomes incorrect when `lastUnlockedLevel > 1` and the second button appears.
5. **SPEC.md `§17` limitation #4 ("No undo or continue-after-death") is not removed.** The plan removes limitation #3 and updates #2, but leaves #4 untouched. The entire purpose of this milestone is to provide continue-after-death; #4 is now stale.
6. **Definition of Done claim is wrong.** DoD bullet 9: "No new architectural abstractions, state machine changes, or framework additions introduced." The plan introduces a new `START_AT_LEVEL` action and a new `lastUnlockedLevel` field — both are state machine changes. The bullet should be reworded to reflect that the *shape* of the existing state machine is preserved (no new statuses), while a single new transition is added.
7. **No test for the `Engine.dispatch` persistence side-effect.** `state.test.ts` tests the reducer only; `Engine.test.ts` exercises the dispatch wrapper. The plan adds `saveLastUnlockedLevel` calls to `dispatch()` but no test asserts that localStorage is written on gameover, won, or levelComplete. A regression where the persistence call is removed would not be caught.
8. **`Game.test.tsx` mock update is under-described.** The plan's Phase 7d says "Update existing tests to account for new GameOver props" but does not list the `useGame` mock return value change. The mock (`src/components/__tests__/Game.test.tsx:47–56, 64–75`) must add `startGameAtLevel: vi.fn()`. Without it, the new destructuring in `Game.tsx:25–34` will produce an undefined `startGameAtLevel` and crash on first render in tests.

## Major Risks

1. **Test coverage gap in `Engine.test.ts`.** The plan adds a new public method (`startAtLevel`) and a new side-effect (`saveLastUnlockedLevel` in `dispatch`). Neither is tested. A future regression (e.g., `startAtLevel` no longer starts the loop, or persistence is silently dropped from a status branch) will not be caught. Severity is High, not Critical, because existing tests still pass and the behaviour is observable in manual smoke testing.
2. **Documentation drift across four files.** The plan updates `SPEC.md` and the `SPEC.md §17` limitation list, but leaves `ARCHITECTURE.md` (state machine diagram, test count), `SPEC.md §10.5` (GameOver description), and `SPEC.md §17` limitation #4 (continue-after-death) untouched. AGENTS.md's "Documentation Consistency" rule ("Keep SPEC.md, ARCHITECTURE.md, PROJECT_STATE.md, and ROADMAP.md consistent with one another") is partially violated.
3. **Vitest renders the dev select by default.** `import.meta.env.DEV` is `true` in Vitest (dev environment). The new dev select in `Game.tsx` will render in every `Game.test.tsx` render. Existing tests use targeted queries (`getByRole('button', { name: /pause game/i })`), so they should still pass — but a future test that uses `getAllByRole('button')` will see the new "Go" button. The plan does not state whether tests should mock `import.meta.env.DEV` or accept the additional button. This is a latent landmine, not a current failure.
4. **The dev select's "Go" button can fire `onLevelUp` unexpectedly.** In `Engine.dispatch()` (`src/game/Engine.ts:52–54`), `onLevelUp` fires whenever `state.level > prevLevel && state.status === 'playing'`. When `startAtLevel(5)` is called from idle (level 1), the level jumps 1 → 5 and `onLevelUp` fires once. The level-up sound plays once, which is correct behaviour but a surprising source of the dev sound. Minor concern; not a bug.
5. **`getLevelData(state.level + 1)` latent landmine (pre-existing, not introduced by the plan).** `src/components/Game.tsx:183` does `getLevelData(state.level + 1).name` for the LevelTransition overlay. At level 10 the game transitions directly to `won` (no `levelComplete` overlay), so this is never called with `level = 10`. But the M6 plan does not address this latent landmine. It is a "while you're in there" cleanup, not a regression.

## Recommended Changes

1. **Add `src/game/__tests__/Engine.test.ts` to the Phase 7 file list.** Mirror the `continueGame` describe block (lines 164–206) with a `startAtLevel` describe block. Cover: idle → startAtLevel(5) → status=playing, level=5, loop running; gameover state (via `setState`) → startAtLevel(3) → status=playing, level=3, loop running; clamping is the reducer's job (already covered in state tests), but assert that `startAtLevel(999)` ends with `state.level === LEVEL_COUNT` through the engine.
2. **Add an `Engine.dispatch` persistence test.** In `Engine.test.ts`, add a describe block (or extend the existing `sound callback wiring` describe block) that:
   - Sets up `localStorage.clear()` in `beforeEach`.
   - On `won` (via `setState` + `dispatch({ type: 'MOVE_SNAKE' })` to crash on level 10), asserts `localStorage.getItem('snakeLastUnlockedLevel')` is updated.
   - On `gameover`, asserts the same.
   - On `levelComplete`, asserts the same.
3. **Bump `package.json` version to `0.6.0`** as part of the "Final wrap-up" between Phase 7 and Phase 8, or as a new Phase 8d. Add `package.json` to the Phase 7/8 file list. Matches the prior milestone's release cadence.
4. **Add `ARCHITECTURE.md` updates to Phase 8.** Two specific changes:
   - Update the state machine diagram (lines 199–224) to add `START_AT_LEVEL(N) -> playing (level N)` to `idle`, `gameover`, and `won`.
   - Update the testing count (line 251) from "143 unit tests" to the new post-milestone count (the plan targets ~160).
5. **Add `SPEC.md §10.5 GameOver (shared component)` to the Phase 8a file list.** Update the description to: "Renders 'Continue from Level N' (primary, when `lastUnlockedLevel > 1`) and 'New Game' (secondary, always) buttons, or a single 'Play Again' button (when `lastUnlockedLevel === 1`). The Continue button is `autoFocus`d when present."
6. **Update `SPEC.md §17` limitations** to also remove limitation #4 ("No undo or continue-after-death"). Add a one-line note that continue-after-death is now available via the localStorage persistence and the GameOver overlay's "Continue from Level N" button.
7. **Reword DoD bullet 9.** Replace "No new architectural abstractions, state machine changes, or framework additions introduced" with "No new architectural abstractions or framework additions. Existing state machine shape preserved; one new transition (`START_AT_LEVEL`) and one new persisted field (`lastUnlockedLevel`) added."
8. **Make `Game.test.tsx` Phase 7d step explicit.** "Add `startGameAtLevel: vi.fn()` to both `mockUseGame.mockReturnValue` calls (`src/components/__tests__/Game.test.tsx:47–56, 64–75`)."
9. **Add a dev-select render-time test or skip-clarification to Phase 7d.** Either:
   - Add a test that asserts the dev select is present in the Vitest render (since `import.meta.env.DEV` is `true`), or
   - Add a sentence: "Tests that query buttons by name (e.g., `getByRole('button', { name: /pause game/i })`) are unaffected by the new dev select. Tests that count or iterate all buttons may need to filter by accessible name."
10. **Tighten the in-game hint text in `GameOver.tsx`.** The current "Press Space to restart" hint is technically correct (Space = New Game = Level 1) but is now ambiguous: a player who has died and wants to continue may press Space expecting to continue, but Space restarts to Level 1. Recommend changing to "Press Space for new game — click Continue to resume" when `lastUnlockedLevel > 1`. Low priority, but cheap to address in Phase 4.

---

# Detailed Findings

## Critical

### F-01. `Engine.test.ts` is missing from the Phase 7 test-update list
- **Severity:** Critical
- **Description:** Phase 3a adds `Engine.startAtLevel(level: number): void` (line 178–183 in the plan) and modifies `Engine.dispatch()` to call `saveLastUnlockedLevel` on `gameover`/`won`/`levelComplete` (line 187–197). Neither change has a corresponding test. The plan's Phase 7 file list (`state.test.ts`, `storage.test.ts`, `GameOver.test.tsx`, `Game.test.tsx`) does not include `src/game/__tests__/Engine.test.ts`. The existing `continueGame` describe block (`src/game/__tests__/Engine.test.ts:164–206`) demonstrates the established pattern for testing engine methods that combine `dispatch` + `startLoop`. A `startAtLevel` describe block is the natural parallel. Additionally, a test for the new persistence side-effect (localStorage is written on terminal status transitions) is missing — this lives in `dispatch()`, not in the reducer, so `state.test.ts` cannot catch it.
- **Recommendation:** Add `src/game/__tests__/Engine.test.ts` to the Phase 7 file list. New tests:
  ```ts
  describe('startAtLevel', () => {
    it('starts game at requested level from idle', () => {
      engine.startAtLevel(5);
      expect(engine.getState().status).toBe('playing');
      expect(engine.getState().level).toBe(5);
    });

    it('starts game at requested level from gameover', () => {
      engine.setState({ ...getInitialState(), status: 'gameover', level: 3 });
      engine.startAtLevel(2);
      expect(engine.getState().status).toBe('playing');
      expect(engine.getState().level).toBe(2);
    });

    it('runs the loop after startAtLevel', () => {
      engine.startAtLevel(1);
      const snakeBefore = engine.getState().snake;
      vi.advanceTimersByTime(500);
      expect(engine.getState().snake).not.toEqual(snakeBefore);
    });

    it('persists lastUnlockedLevel on gameover', () => {
      // dispatch a state that produces gameover (e.g. wall collision at L3)
      // assert localStorage.getItem('snakeLastUnlockedLevel') === '3'
    });

    it('persists lastUnlockedLevel on levelComplete', () => {
      // dispatch a state that produces levelComplete at L4
      // assert localStorage.getItem('snakeLastUnlockedLevel') === '5'
    });
  });
  ```

### F-02. `ARCHITECTURE.md` is not in the Phase 8 file list
- **Severity:** Critical
- **Description:** AGENTS.md says "Architecture changes: Update ARCHITECTURE.md" and "Keep SPEC.md, ARCHITECTURE.md, PROJECT_STATE.md, and ROADMAP.md consistent with one another". The plan updates `SPEC.md` and `ROADMAP.md` (implicitly, post-merge) and `PROJECT_STATE.md`. It does not list `ARCHITECTURE.md` in any phase. Two ARCHITECTURE.md items will go stale after the milestone:
  1. **State machine diagram** (`ARCHITECTURE.md:199–224`) shows `idle -> START_GAME -> PLAYING`, `idle -> PAUSE_GAME -> PAUSED`, etc. After M6, the new transitions `idle -> START_AT_LEVEL(N) -> PLAYING`, `gameover -> START_AT_LEVEL(N) -> PLAYING`, `won -> START_AT_LEVEL(N) -> PLAYING` are missing.
  2. **Testing count** (`ARCHITECTURE.md:251`) says "143 unit tests across 12 test files". After M6, the count is ~160 and the file count is unchanged.
  Both create `AGENTS.md` "Documentation Consistency" drift.
- **Recommendation:** Add `ARCHITECTURE.md` to Phase 8 file list. Two specific changes:
  - Update the state machine diagram to add the three `START_AT_LEVEL` transitions.
  - Update line 251 test count to the post-milestone value (use the actual `npm test` count, not the "~160" estimate).

## High

### F-03. `package.json` version not bumped
- **Severity:** High
- **Description:** `package.json:4` is `0.5.0`. `docs/PROJECT_STATE.md:5` is `v0.5.0`. The plan updates `PROJECT_STATE.md` (implicitly) to `v0.6.0` but does not list `package.json` in any phase. After the milestone, `package.json` and `PROJECT_STATE.md` will disagree on the version. The prior milestone's review (`plans/archive/2026-06-06-milestone-5-plan-review.md` F-07) flagged the same issue and the fix is a one-line bump.
- **Recommendation:** Add `package.json` to the Phase 8 file list (or Phase 7 wrap-up): change `"version": "0.5.0"` to `"version": "0.6.0"`.

### F-04. `SPEC.md §10.5 GameOver (shared component)` description is not updated
- **Severity:** High
- **Description:** The plan updates `§7.1`, `§7.2`, `§8.1`, `§12` (new `12.3`), and `§17` (limitations #2 and #3). It does not call out `§10.5` (`SPEC.md:282–288`). That section currently reads: "Both: Play Again button + 'Press Space to restart' hint" (line 287). After the milestone, `GameOver` renders either a single "Play Again" button (when `lastUnlockedLevel === 1`) or two buttons ("Continue from Level N" + "New Game") (when `lastUnlockedLevel > 1`). The current SPEC text is wrong for the `lastUnlockedLevel > 1` case.
- **Recommendation:** Add a Phase 8a step: "Update `SPEC.md §10.5`: replace the second sentence ('Both: Play Again button + "Press Space to restart" hint') with a description of the dual-button layout: 'Renders "Continue from Level N" (primary, when `lastUnlockedLevel > 1`) and "New Game" (secondary, always when `lastUnlockedLevel > 1`) buttons. Falls back to a single "Play Again" button when `lastUnlockedLevel === 1`. The Continue button is `autoFocus`d when present.'"

### F-05. `SPEC.md §17` limitation #4 is not removed
- **Severity:** High
- **Description:** The plan removes limitation #3 ("No difficulty scaling between games — each START_GAME resets to level 1") and updates #2 ("No leaderboard — high score is local only" → "High score is local only (no level progress sync across browsers/devices yet)"). It does not remove limitation #4 ("No undo or continue-after-death"). The entire purpose of this milestone is to provide continue-after-death. After M6, limitation #4 is stale.
- **Recommendation:** Add to Phase 8a: "Remove `SPEC.md §17` limitation #4 ('No undo or continue-after-death') — addressed by the new Continue feature."

### F-06. `Engine.dispatch` persistence side-effect has no test
- **Severity:** High
- **Description:** The plan adds `saveLastUnlockedLevel(this.state.lastUnlockedLevel)` calls to `Engine.dispatch()` (lines 187–197). `state.test.ts` tests the reducer only, not the dispatch wrapper. A regression where the persistence call is removed (or the `levelComplete` branch is dropped) would not be caught. The persistence call is critical to the feature — if it is silently broken, the player progresses, dies, and sees "Play Again" with no Continue button, with no test failure.
- **Recommendation:** Covered by F-01 (add to `Engine.test.ts`). Specifically:
  ```ts
  describe('lastUnlockedLevel persistence', () => {
    beforeEach(() => localStorage.clear());

    it('writes snakeLastUnlockedLevel on gameover', () => {
      engine.setState({ ...getInitialState(), level: 4, status: 'playing' });
      // dispatch a state that produces gameover (snake crashes on L4)
      // assert localStorage.getItem('snakeLastUnlockedLevel') === '4'
    });

    it('writes snakeLastUnlockedLevel on levelComplete', () => {
      // dispatch a state that produces levelComplete at L2
      // assert localStorage.getItem('snakeLastUnlockedLevel') === '3'
    });

    it('writes snakeLastUnlockedLevel on won', () => {
      // dispatch a state that produces won at L10
      // assert localStorage.getItem('snakeLastUnlockedLevel') === '10'
    });
  });
  ```

## Medium

### F-07. `import.meta.env.DEV` is `true` in Vitest; the dev select renders in every test
- **Severity:** Medium
- **Description:** `import.meta.env.DEV` is Vite's built-in flag. In Vitest (jsdom), it evaluates to `true` because tests run in the dev environment. The plan's new dev select (`Game.tsx:367–388` in the plan) will render in every `Game.test.tsx` render. Existing tests in `Game.test.tsx` use targeted queries (`getByRole('button', { name: /pause game/i })`), so they should still pass — but a future test that uses `getAllByRole('button')` will see the new "Go" button, and the dev select's presence is a fact of the test environment that the plan does not document. Also, a test that asserts button *order* (e.g., the first button in the modal is "Continue") would need to be aware of the dev select's placement.
- **Recommendation:** Add to Phase 7d: "Tests that query buttons by name (e.g., `getByRole('button', { name: /pause game/i })`) are unaffected by the new dev select. The dev select is rendered above the `ScoreBoard` (per Phase 5b placement: 'below the title, above the ScoreBoard') and contains a `<select>` element with 10 `<option>` children plus a "Go" button. Tests that count buttons or assert structure should account for these. Optionally, add a Vitest setup that mocks `import.meta.env.DEV = false` for the `Game.test.tsx` file."

### F-08. The Definition of Done's "no state machine changes" claim is false
- **Severity:** Medium
- **Description:** DoD bullet 9 (line 28): "No new architectural abstractions, state machine changes, or framework additions introduced." The plan introduces a new `START_AT_LEVEL` action and a new `lastUnlockedLevel` field. Both are state machine / state shape changes. The bullet as written is contradictory with the rest of the plan (Phases 2–5 explicitly make these changes). The intent appears to be "no large structural changes", but the wording is wrong.
- **Recommendation:** Reword to: "No new architectural abstractions or framework additions. State machine shape preserved (no new statuses); one new action (`START_AT_LEVEL`) and one new persisted field (`lastUnlockedLevel`) added."

### F-09. `Game.test.tsx` mock update is under-described
- **Severity:** Medium
- **Description:** The plan's Phase 7d says "Update existing tests to account for new GameOver props. Add test: `lastUnlockedLevel` is passed through to GameOver overlay." It does not list the `useGame` mock return value change. The mock (`src/components/__tests__/Game.test.tsx:47–56, 64–75`) currently returns `{ state, initAudio, startGame, pauseGame, resumeGame, changeDirection, resetGame, continueGame }`. After the plan's `useGame.ts` change, the hook returns `startGameAtLevel` too. The new `Game.tsx` destructure (`const { ..., startGameAtLevel, ... } = useGame();`) will receive `undefined` for `startGameAtLevel` if the mock is not updated, causing a runtime crash on first render in tests. (Vitest is loose enough that `vi.mocked(useGame).mockReturnValue({...})` may not enforce shape, so this could surface as `handleStartAtLevel` being undefined when the dev select's "Go" button is clicked in a test — which may or may not be exercised by current tests.)
- **Recommendation:** Make the Phase 7d step explicit: "Add `startGameAtLevel: vi.fn()` to both `mockUseGame.mockReturnValue(...)` calls in `src/components/__tests__/Game.test.tsx:47–56, 64–75`."

### F-10. `onLevelUp` callback fires when dev select jumps levels
- **Severity:** Medium (latent, not a current bug)
- **Description:** `Engine.dispatch()` (`src/game/Engine.ts:52–54`) fires `onLevelUp` whenever `state.level > prevLevel && state.status === 'playing'`. When `startAtLevel(5)` is called from idle (level 1), the level jumps 1 → 5 and `onLevelUp` fires once. The level-up sound plays once. This is correct (the player has moved to a new level) but is a side effect of the dev select that the plan does not acknowledge. In a future "mute the dev experience" change, this could be a surprise.
- **Recommendation:** Add a one-line note to Phase 3a: "Note: `startAtLevel(N)` from a lower level fires `onLevelUp` once (the level-up sound). This is intentional — the player has moved to a new level. If the dev experience later needs silence, gate the callback on a dev flag."

## Low

### F-11. `GameOver.tsx` "Press Space to restart" hint is now ambiguous
- **Severity:** Low
- **Description:** The current `<p>Press Space to restart</p>` (`src/components/GameOver.tsx:17`) is technically correct (Space → `handleRestart` → `resetGame()` → starts at Level 1 = New Game). But after M6, a player who has died and wants to continue may press Space expecting to continue, only to be sent back to Level 1. The plan updates the screen-reader announcement (`STATUS_ANNOUNCEMENTS`, Phase 6) to "Press Space for new game or click Continue" but does not update the visible hint.
- **Recommendation:** Phase 4b step (new): "Update `GameOver.tsx` hint to 'Press Space for new game — click Continue to resume' when `lastUnlockedLevel > 1`. Keep the existing text when `lastUnlockedLevel === 1`." Low priority, but a small UX improvement.

### F-12. "Play Again" vs "New Game" button label inconsistency
- **Severity:** Low
- **Description:** The plan renders "Play Again" when `lastUnlockedLevel === 1` (line 273) and "New Game" when `lastUnlockedLevel > 1` (line 267). Both buttons call `onRestart` and do the same thing (start at Level 1). The label difference is intentional — "New Game" pairs with "Continue from Level N" as a contrast — but a user who dies twice (once after passing L1, once on L1) sees two different labels for the same action. Inconsistency may confuse.
- **Recommendation:** Either:
  - Unify on "New Game" always (cleaner), or
  - Unify on "Play Again" always (matches the original), or
  - Keep the current scheme and add a one-line justification in the plan ("'New Game' is used as the contrast label to 'Continue from Level N'; the underlying action is identical").
  The plan is silent on this. Pick one and document it.

### F-13. Pre-existing latent landmine `getLevelData(state.level + 1)` at level 10
- **Severity:** Low (pre-existing, not introduced by M6)
- **Description:** `src/components/Game.tsx:183` does `getLevelData(state.level + 1).name` for the LevelTransition overlay. At level 10 the game transitions directly to `won` (no `levelComplete` overlay), so this code path is never called with `level = 10`. But a future bug that does show the overlay at L10 would throw via `getLevelData(11)`. Not a regression caused by the plan.
- **Recommendation:** Optional. If a `getLevelData` guard is desired, add `Math.min(state.level + 1, LEVEL_COUNT)` at the call site. Out of scope for M6.

### F-14. The "Continue from Level N" button calls `onContinueFromLevel(lastUnlockedLevel)` — prop is slightly looser than necessary
- **Severity:** Low
- **Description:** `GameOverProps.onContinueFromLevel: (level: number) => void` (line 236) implies the caller could pass any level. In practice, `Game.tsx:345,353` always passes `state.lastUnlockedLevel`. The prop signature is correct (callers may want flexibility) but currently only one value is used. If `GameOver` ever wanted to clamp or cap, the prop is the right place. No change needed; just a note.
- **Recommendation:** None. The signature is fine.

### F-15. `lastUnlockedLevel = max(current, level + 1)` in `levelComplete` is correct but worth a test
- **Severity:** Low
- **Description:** The plan sets `lastUnlockedLevel = Math.max(state.lastUnlockedLevel, state.level + 1)` on `levelComplete` (line 138). This is correct: after completing level 1, the player has unlocked level 2; after completing level 5, level 6. The `Math.max` guards against regression in case a future agent reorders transitions. Phase 7b mentions "Multiple level completions accumulate correctly (level 1 → 2, then 2 → 3)" — this is the test that exercises the `Math.max`. Good.
- **Recommendation:** None. The test list covers the case.

### F-16. Storage test file path is a re-export
- **Severity:** Low
- **Description:** The plan's Phase 7a says "Storage Tests (`src/utils/__tests__/storage.test.ts`)" and adds tests to the existing describe block. The file at `src/utils/__tests__/storage.test.ts` imports from `'../storage'` (relative), which resolves to `src/utils/storage.ts` (the legacy re-export at `src/utils/storage.ts:1`). The actual function lives in `src/game/storage.ts`. The test runs through the re-export, which is fine. The plan should be explicit about which `storage.ts` it means to avoid an implementing agent's confusion.
- **Recommendation:** Add a one-line note: "Tests in `src/utils/__tests__/storage.test.ts` import through the legacy re-export `src/utils/storage.ts`. The new `loadLastUnlockedLevel` and `saveLastUnlockedLevel` must also be re-exported from `src/utils/storage.ts` to be testable through this path (or alternatively, add a new test file `src/game/__tests__/storage.test.ts` that imports directly from `'../storage'`)."

### F-17. `Engine.startAtLevel` is public; could be `start(level?: number)` instead
- **Severity:** Low (design choice)
- **Description:** The plan adds a public `startAtLevel(level: number)` method to `Engine` (Phase 3a) alongside the existing `start()`. An alternative design is to make `start(level?: number)` accept an optional level. The plan's design is more explicit (no overload semantics, no `level === undefined` branch in the hook) but slightly more verbose at the call site.
- **Recommendation:** None. The current design is fine; both are acceptable. Worth noting in case the implementer asks.

### F-18. The plan does not address what happens to the snake's grown state on `START_AT_LEVEL`
- **Severity:** Low (correctness, not a gap)
- **Description:** `START_AT_LEVEL` (Phase 2b, lines 113–129) sets `snake: [...INITIAL_SNAKE]` — i.e., a fresh 3-segment snake at the canonical position. This matches the ROADMAP's "Reset snake state" requirement (line 313 of `docs/ROADMAP.md`) and matches the existing `CONTINUE_GAME` behaviour (`src/game/state.ts:101–120`). Good.
- **Recommendation:** None. The behaviour is correct.

### F-19. The plan's `Engine.dispatch` order puts `saveLastUnlockedLevel` inside the existing `if (gameover || won)` block
- **Severity:** Low (style, not correctness)
- **Description:** The plan shows:
  ```ts
  if (this.state.status === 'gameover' || this.state.status === 'won') {
    saveHighScore(this.state.score);
    saveLastUnlockedLevel(this.state.lastUnlockedLevel);
  }
  if (this.state.status === 'levelComplete') {
    saveLastUnlockedLevel(this.state.lastUnlockedLevel);
  }
  ```
  This is correct and groups the writes cleanly. An alternative is to unify on a single `if (gameover || won || levelComplete)` block, but the plan's split mirrors the existing pattern.
- **Recommendation:** None. The split is fine.

### F-20. `useGame` hook test file does not exist
- **Severity:** Low (informational)
- **Description:** There is no `src/hooks/__tests__/useGame.test.ts` — only `useTouch.test.tsx`. So the plan's `useGame` change (adding `startGameAtLevel` to the return value) has no test to update. This is consistent with the prior milestone's pattern.
- **Recommendation:** None. No test exists, so no test to break.

---

# Handoff Assessment

## Phase structure — **Strong**

Eight phases, each with a single goal and an explicit file list. Phase ordering is bottom-up (persistence → state → engine → UI → wiring → a11y → tests → docs) and produces a compilable state after every phase. The dependencies are clean: Phase 1 → 2 → 3, Phase 2 → 4 (types only), Phase 5 depends on 2–4, Phase 7 depends on 1–5, Phase 8 depends on 7. No circular dependencies. The optional Phase 6 (a11y) is independent and can be done at any point.

## Task decomposition — **Good with gaps**

File lists per phase are mostly correct, with the following gaps:
- **F-01:** `Engine.test.ts` is missing from the test-update list.
- **F-02:** `ARCHITECTURE.md` is missing from the doc-update list.
- **F-03:** `package.json` is missing.
- **F-04:** `SPEC.md §10.5` is not called out.
- **F-05:** `SPEC.md §17` limitation #4 removal is not called out.
- **F-09:** `Game.test.tsx` mock update is under-described.

The decomposition maps cleanly to the architecture: persistence → state → engine → UI → wiring → a11y → tests → docs. Task sizes are small (each phase is well under a day's work for an experienced agent).

## Verification strategy — **Adequate, can be tightened**

Each phase names a verification step. Two gaps:
1. **No "run all gates at the end" step.** The Definition of Done implies it, but a final `npm run lint && npm run build && npm test` line in Phase 8 (or a new "Phase 9: Final gates") would catch cross-phase regressions in one command. The current Review Checklist at the bottom (lines 600–613) covers this, but it's a self-assessment.
2. **No "dev select absent in production" automated check.** The plan's Phase 5 verification says "In `npm run build` + `npm run preview`: dev select is absent." This is a manual check. A trivial Vitest assertion (`expect(import.meta.env.DEV).toBe(false)` under a prod-like setup, or a regex check on the built bundle for `'Developer level select'`) would be cheap insurance. Optional.

## Definition of Done — **Strong, with two errors**

The milestone DoD (lines 19–28) has 10 items covering persistence, UI, dev gate, behaviour, tests, build, lint, docs, and architecture. Strengths: test count is pinned (143 → ~160), build/lint are explicit, documentation is named.

Gaps:
- **F-08:** The "no state machine changes" claim is wrong.
- **F-03:** `package.json` version bump is not in the DoD.
- **F-04 / F-05:** `SPEC.md §10.5` and `§17` limitation #4 are not in the DoD.
- **F-01 / F-06:** `Engine.test.ts` is not in the DoD.

## AI-agent execution readiness — **Moderate**

The plan is detailed enough that a competent agent can execute it without re-reading the codebase top to bottom, **provided** the agent has read `SPEC.md`, `ARCHITECTURE.md`, `ROADMAP.md`, `AGENTS.md`, and the test files listed in Phase 7. The risk is in the small-but-fatal omissions:
- **F-01 / F-06:** Engine test gaps — an implementer following the plan literally will not add Engine tests.
- **F-02:** An implementer will not update ARCHITECTURE.md.
- **F-09:** An implementer may not update the `Game.test.tsx` mock, leading to a test render failure on the dev select's "Go" click.

A new agent should be able to:
1. Apply Phase 1 to add the storage functions.
2. Apply Phase 2 to add the state field and `START_AT_LEVEL` action.
3. Apply Phase 3 to add `Engine.startAtLevel()` and the persistence call, **and** add the `Engine.test.ts` tests (per F-01).
4. Apply Phase 4 to update `GameOver`, **and** add `Engine.test.ts` mock updates (per F-09).
5. Apply Phase 5 to wire `Game.tsx` and add the dev select.
6. Apply Phase 6 to update status announcements.
7. Apply Phase 7 to add the state / storage / component / Game tests, **and** the Engine tests.
8. Apply Phase 8 to update `SPEC.md`, `ROADMAP.md`, `PROJECT_STATE.md`, **`ARCHITECTURE.md`** (per F-02), and **`package.json`** (per F-03).

Resolve F-01 and F-02 before the agent starts.

---

# Final Recommendation

## **Approve with Major Changes**

The plan is structurally sound, well-grounded in the codebase, and aligned with `AGENTS.md`'s "ship the game" philosophy. The phasing, file lists, and verification steps are good enough to hand off to another agent after the changes below land.

The **critical** issues are:
1. **F-01 (Critical):** `Engine.test.ts` is missing from the test-update list. The new `startAtLevel` method and the new dispatch persistence side-effect have no tests. A new describe block mirroring the `continueGame` block plus a persistence side-effect test is required.
2. **F-02 (Critical):** `ARCHITECTURE.md` is not in the Phase 8 file list. The state machine diagram and testing count will go stale, violating AGENTS.md's "Documentation Consistency" rule.

The **high** issues that should be folded in:
- **F-03:** Bump `package.json` to `0.6.0`.
- **F-04:** Update `SPEC.md §10.5` for the new dual-button layout.
- **F-05:** Remove `SPEC.md §17` limitation #4 (continue-after-death is now implemented).
- **F-06:** Add a persistence side-effect test (lives in `Engine.test.ts`, covered by F-01).

The **medium / low** issues are improvements (F-07 dev-select test-env clarity, F-08 DoD wording, F-09 mock update, F-10 onLevelUp note, F-11/F-12 UX polish) that an experienced agent can fold in as they implement.

**Net assessment:** Simplicity, maintainability, and repository alignment are all served by this plan once F-01 and F-02 are resolved. The plan favours executable, minimal changes — the right instinct. Approve after the two critical fixes and the four high-priority fixes land; the rest can ride along as the agent implements.
