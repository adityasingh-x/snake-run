# Plan Review: Milestone 5 — Obstacle Redesign

**Reviewer:** Staff Engineer (Plan Review)
**Plan under review:** `plans/ACTIVE.md` (Milestone 5 — Obstacle Redesign, ACTIVE — Planning, 2026-06-06)
**Source documents:** `ROADMAP.md`, `AGENTS.md`, `ARCHITECTURE.md`, `SPEC.md`, `docs/PROJECT_STATE.md`, `docs/design/LEVEL_DESIGN.md`
**Review date:** 2026-06-06

---

# Overall Assessment

## Strengths

1. **Right-sized change for "ship the game".** The plan replaces a random obstacle generator with a handcrafted layout lookup, which is exactly what ROADMAP M5 calls for. No new abstractions, no layout DSL, no level format schema, no editor — just `Position[]` arrays hung off the existing `Level` type. This matches `AGENTS.md`'s `Avoid: premature abstractions, framework building, speculative architecture`.
2. **Honest decomposition.** The five phases (data → state machine → tests → docs → integration) form a clean bottom-up order in which every intermediate commit is compilable. File lists per phase are explicit and correct.
3. **Risk table is candid.** The "Layouts feel unfair" / "Obstacle positions overlap with initial snake" / "Level 1 zero obstacles" rows are all real failure modes and the mitigations are concrete (validation tests, audit of collision/food code).
4. **Out-of-scope table is sharp.** Speed curve, food objectives, target scores, visuals, moving obstacles, wrap-around, portals, food variants, endless mode, and "any UI or overlay changes" are all explicitly fenced. Future-milestone leakage is essentially zero.
5. **Test churn is mostly accounted for.** Phase 3 names the `levelData.test.ts` updates, the signature change, and the per-level layout tests. The Level 1 name test update is called out.
6. **Documentation rule adherence.** Phase 4 updates `SPEC.md`, `ROADMAP.md`, `PROJECT_STATE.md`, and `ARCHITECTURE.md` — matching `AGENTS.md`'s "Documentation Consistency" rule.
7. **Codebase accuracy.** The line-number references (`src/game/types.ts:10–16`, `state.ts:10`, `state.ts:107`, `levels.ts:27–51`) all line up with the current repo. I verified every one.
8. **No ADR needed.** This is a contained content/algorithm swap, not an architecture redesign. Skipping an ADR is the right call here.

## Weaknesses

1. **`LevelTransition.test.tsx` is missing from the test-update list.** It hard-codes `completedLevelName: 'First Steps'` and `nextLevelName: 'Tight Spaces'` (`src/components/__tests__/LevelTransition.test.tsx:10–11`) and asserts `screen.getByText('First Steps')` and `screen.getByText('Next: Tight Spaces')` (lines 20, 25). After the milestone these are old names — Level 1 becomes "First Meal" and Level 2 becomes "Pillar Run". The test will fail. The plan's Phase 3 file list (`src/utils/__tests__/levelData.test.ts`, `src/game/__tests__/state.test.ts`) does not include this file. **This is a guaranteed build/CI failure on the first test run.**
2. **Self-contradictory naming guidance in Phase 1.** Phase 1's "Update level names" paragraph (line 121) says "Level 3 stays 'Pillar Run' (reassigned name, matches design)" — but the table on lines 100–112 shows Level 3's new name is "Split Paths" (matching `LEVEL_DESIGN.md`). The parenthetical reads as a typo and could easily be read as "leave Level 3 named Pillar Run", which would then collide with Level 2's new name "Pillar Run".
3. **Description text drift is not flagged.** `LEVEL_DESIGN.md` is the authoritative design source for level descriptions. The plan's table column "Description" uses wording that does not match the design doc verbatim (e.g., "Learn movement and food collection" vs. the doc's "Teach movement and food collection"; "A single central pillar" vs. the design's "Single central pillar"; etc.). The plan says "implementer has design authority" which is fine, but the level descriptions flow into `LevelTransition.test.tsx`'s default props and into SPEC.md / PROJECT_STATE.md copy. Without a clear "description text source = LEVEL_DESIGN.md Purpose field" rule, the implementer may invent copy that drifts from the design.
4. **No test for layout-driven obstacles via `state.ts` CONTINUE_GAME.** `state.test.ts:337` asserts `next.obstacles.length > 0` after CONTINUE_GAME from level 1 → level 2. This test will still pass after the milestone (Level 2 has 4–6 tiles), but the assertion is fragile: if a future agent accidentally empties Level 2's layout, this test will fail for the right reason but Phase 3 does not add a layout-driven assertion that ties the test to a known level-2 layout. The plan adds layout tests against `getLevelData` but not against the full reducer path.
5. **`state.test.ts` is listed as "(if it calls generateObstacles directly) — already tested through integration; may not need changes".** This is understating. The plan should explicitly call out that `state.test.ts:337` (`expect(next.obstacles.length).toBeGreaterThan(0)`) needs to remain a passing assertion (it does, by construction, but the plan should say so) — otherwise the implementer may either delete the assertion or weaken it.
6. **Plan Review Checklist at the bottom is self-assessed and incomplete.** It checks "no future-milestone leakage" and "no speculative architecture" but does not check:
   - **Test file coverage** (the `LevelTransition.test.tsx` gap above would have been caught).
   - **Documentation cross-references** (the SPEC.md line-number reference for §3.3 in Phase 4 step 1 is correct, but no check that the per-level count table in SPEC.md is the only place "level 1: 1 obstacle" appears).
   - **Self-contradiction** (the Level 3 name issue).
7. **Version bump inconsistency.** Phase 4 step 4 bumps `PROJECT_STATE.md` to v0.5.0, but `package.json:4` is the actual version field. `ARCHITECTURE.md:5` (tech stack) and `package.json` both carry versions, and `SPEC.md` does not mention a version. The plan updates only `PROJECT_STATE.md`; it should also bump `package.json` to keep release tooling and docs aligned. Minor, but easy to add.
8. **ARCHITECTURE.md updates are scoped to "Level System (line ~150–158)"**, but the line reference is approximate ("~150–158"). The actual line is 155: `**Obstacles:** floor(level * 0.5), capped at 8`. A precise reference would reduce the implementer's grep work. The plan already uses precise line numbers elsewhere; this is inconsistent.
9. **Phase 5 "Git Verification" claims a "commit message follows Conventional Commits format"** check, but the plan makes multiple documentation/feature changes that may warrant multiple commits or a single squash. The plan does not say whether to commit incrementally per phase or as a single milestone commit. This is a process question, not a correctness one, but the verification step is meaningless without it.
10. **No determinism test.** "Obstacles are not generated randomly across multiple calls" is implied by the new design but never asserted. A trivial test (`generateObstacles(N) === generateObstacles(N)` and `getLevelData(N).layout === generateObstacles(N)`) would catch a future regression to `Math.random()`. This is cheap insurance.

## Major Risks

1. **CI failure from the missing test-file update.** As noted above, `LevelTransition.test.tsx` will fail on the first test run after the milestone is applied. This is a guaranteed blocker; the milestone cannot be merged without the test fix.
2. **Name collision risk from the Phase 1 self-contradiction.** If the implementer reads "Level 3 stays 'Pillar Run'" literally, both Level 2 and Level 3 will share the name "Pillar Run" — and the `LevelTransition` overlay will display "Next: Pillar Run" when transitioning from Level 2 to Level 3. This is a UX bug visible on the first level transition. Severity rises if the implementer trusts the parenthetical over the table.
3. **Layout playability risk is unquantified.** The risk table row "Layouts feel unfair or unplayable at current speeds" mitigates with "playtest each level after implementation". This is real but soft. With Level 9 ("Survival Grid", 24–30 obstacles) and Level 10 ("Final Run", 26–32 obstacles) on the existing speed curve (`MOVE_SNAKE` at 70ms and 60ms), some snake-vs-wall paths may be functionally unsolvable at length. The plan should add a "minimum reachable area" or "playable at length 20" check, or at minimum a hand-played smoke test of levels 8–10 in the verification step.
4. **Determinism regression risk.** The `generateObstacles` function loses its random-call surface, but a future maintainer could re-introduce `Math.random()` (e.g., for a "randomize the pillar orientation" feature later). Without a determinism test, the regression is silent. Cheap to add.
5. **Scoreboard/Layout coupling in `Game.tsx:123,182–184`.** `Game.tsx` reads `getLevelData(state.level).name` and `getLevelData(state.level + 1).name` for the HUD and overlay. After the milestone these are data-driven, but `state.level + 1` is unguarded: at level 10, the LevelTransition overlay is not shown (it transitions directly to `won`), so this code path is never taken — but a future bug that does show the overlay at L10 would throw via `getLevelData(11)` ("Invalid level ID: 11"). Not a regression, but a latent landmine.
6. **Plan / LEVEL_DESIGN.md consistency drift.** The plan encodes its own interpretation of `LEVEL_DESIGN.md` (tile count ranges, description text). If `LEVEL_DESIGN.md` is later updated, the plan and the design will disagree, and the implementer will pick one. The plan should explicitly state "the implementer must follow LEVEL_DESIGN.md, not the table in this plan, when the two differ".

## Recommended Changes

1. **Add `src/components/__tests__/LevelTransition.test.tsx` to Phase 3** as an explicit update. Update `completedLevelName`, `nextLevelName`, and the two `getByText` assertions to use the new Level 1 / Level 2 names ("First Meal" / "Pillar Run") and new Level 2 description text.
2. **Fix the Level 3 naming line** in Phase 1 step 3. Replace "Level 3 stays 'Pillar Run' (reassigned name, matches design)" with a clear "Level 3 renamed: 'Pillar Run' → 'Split Paths' (per `LEVEL_DESIGN.md`)". Better: replace the parenthetical reordering entirely with a clean before/after list, no parentheticals.
3. **Pin description text to `LEVEL_DESIGN.md`.** State explicitly: "Description text for each level is taken verbatim from the 'Purpose' section of `LEVEL_DESIGN.md`. The table in this plan is illustrative only; when it and the design doc disagree, the design doc wins."
4. **Add a determinism test to Phase 3** (one line): `it('generateObstacles is deterministic', () => { expect(generateObstacles(N)).toEqual(generateObstacles(N)); for (let i = 1; i <= 10; i++) expect(generateObstacles(i)).toEqual(getLevelData(i).layout); })`.
5. **Bump `package.json` version to `0.5.0`** in Phase 4. Add the file to the Phase 4 file list. One line.
6. **Tighten Phase 1 step 3 description guidance** with: "The `description` field in each level entry is the level's short flavor text shown in the LevelTransition overlay and the in-game HUD. Use 1 sentence, ~10–20 words, taken from `LEVEL_DESIGN.md` Purpose field."
7. **Add an explicit `state.test.ts` Phase 3 step** that says: "The existing assertion `expect(next.obstacles.length).toBeGreaterThan(0)` for CONTINUE_GAME level 1→2 remains valid because Level 2's layout is non-empty. Do not weaken or delete."
8. **Add a L8–L10 playability verification step** in Phase 5: "Hand-play Levels 8, 9, 10 for at least 30 seconds each at full snake length. If any level is unsolvable or the obstacle density makes routing impossible, reduce the rough tile count in Phase 1 and re-verify."
9. **Update the plan's bottom Plan Review Checklist** to add: "All test files referencing level names or `generateObstacles` are updated", "No file references the old level 3 name 'Pillar Run' for level 3", and "Description text source is `LEVEL_DESIGN.md`".
10. **Replace ARCHITECTURE.md's "line ~150–158"** with the precise line (155) and the precise old/new text. Use the same style as the precise line numbers elsewhere in the plan.

---

# Detailed Findings

## Critical

### F-01. `LevelTransition.test.tsx` is not in the test-update list
- **Severity:** Critical
- **Description:** `src/components/__tests__/LevelTransition.test.tsx:10–11, 20, 25` hard-codes the level names `'First Steps'` and `'Tight Spaces'` and the description `'Navigate around the growing obstacles.'`. After the milestone, Level 1 is "First Meal", Level 2 is "Pillar Run", and Level 2's description will be a different one-liner (per `LEVEL_DESIGN.md` Purpose). The `screen.getByText('First Steps')` and `screen.getByText('Next: Tight Spaces')` assertions will fail. The plan's Phase 3 file list (`levelData.test.ts` and `state.test.ts` "if it calls generateObstacles directly") does not include this file. Result: `npm test` fails on first run after the milestone is applied. This is a guaranteed CI failure.
- **Recommendation:** Add `src/components/__tests__/LevelTransition.test.tsx` to Phase 3 as an explicit update. Change the `defaultProps` and the two `getByText` assertions. The new completed/next pair (Level 1 → Level 2) is a natural choice: `completedLevelName: 'First Meal'`, `nextLevelName: 'Pillar Run'`, and a corresponding description.

### F-02. Self-contradictory Level 3 naming guidance
- **Severity:** Critical
- **Description:** Phase 1 step 3 (line 121) lists: "Level 3 stays 'Pillar Run' (reassigned name, matches design)". This is wrong on its face: the new name for Level 3 is "Split Paths" (per the table on line 104 and per `LEVEL_DESIGN.md`). The wording "stays 'Pillar Run'" with the parenthetical "reassigned name, matches design" is internally inconsistent and easy to misread. A literal implementer could leave Level 3 named "Pillar Run", creating a name collision with Level 2's new "Pillar Run" name. The bug would surface in the `LevelTransition` overlay between Level 2 and Level 3 ("Next: Pillar Run") and in the ScoreBoard HUD ("Level: 3 — Pillar Run" while Level 2 just showed the same name).
- **Recommendation:** Rewrite the line to: "Level 3 renamed: 'Pillar Run' → 'Split Paths' (per `LEVEL_DESIGN.md`)." Or, better, replace the entire reordering list with a clean table of (id, old name, new name, new description source) without parentheticals. The current plan's table on lines 100–112 is correct and can be used as the authoritative source if the prose is removed.

## High

### F-03. Description text source is not pinned
- **Severity:** High
- **Description:** `LEVEL_DESIGN.md` is declared authoritative, but the plan's Phase 1 table column "Description" uses wording that does not match the design doc verbatim. For example, Level 1 in the plan reads "Learn movement and food collection" while the design doc reads "Teach movement and food collection". Level 2 in the plan reads "A single central pillar" while the design doc reads "Single central pillar". An implementer following the plan's table would produce copy that drifts from the design source. Worse, the description text flows into `LevelTransition.test.tsx`'s default props (which will need updating under F-01) and into SPEC.md / PROJECT_STATE.md copy (which Phase 4 already updates).
- **Recommendation:** Add a sentence to Phase 1: "Description text for each level is taken from the 'Purpose' section of `LEVEL_DESIGN.md` and paraphrased into a 1-sentence, 10–20 word flavor string. When this plan's table and `LEVEL_DESIGN.md` disagree, the design doc wins." Optionally, copy the exact design-doc purpose lines into the plan's table as the "Description" column to remove ambiguity.

### F-04. L8–L10 playability not verified
- **Severity:** High
- **Description:** Phase 5 "Manual Checks" cycles through "Levels 3–10: each shows distinct, non-random obstacle pattern" but does not require actual playability at length. With the current speed curve (Level 8 = 80ms, Level 9 = 70ms, Level 10 = 60ms — per `src/game/levels.ts:12–14`) and the planned obstacle counts (24–30 for Level 9, 26–32 for Level 10), a snake at length 20 may be unable to navigate the obstacle field without cornering itself. The plan's risk table acknowledges this is a Medium likelihood issue but the mitigation is "playtest after implementation" — soft, not specified.
- **Recommendation:** Add to Phase 5 manual checks: "Play Levels 8, 9, 10 for at least 30 seconds each at full snake length (≥ 20 segments). If a level is unsolvable or obstacle density prevents routing, return to Phase 1 and reduce the rough tile count." Add a corresponding verification checkbox. This is the most likely source of post-merge rework.

### F-05. No determinism test for `generateObstacles`
- **Severity:** High
- **Description:** The entire point of M5 is determinism. The plan adds layout validity tests (no-overlap, no-duplicates, in-bounds, no-adjacent-to-head) but does not add the cheapest and most important test: "calling `generateObstacles(N)` twice returns equal arrays, and equals `getLevelData(N).layout`". A future regression that re-introduces `Math.random()` (e.g., to randomize a pillar's orientation) would slip past the current test set.
- **Recommendation:** Add to Phase 3, layout validity suite:
  ```ts
  it('generateObstacles is deterministic for all 10 levels', () => {
    for (let i = 1; i <= 10; i++) {
      expect(generateObstacles(i)).toEqual(generateObstacles(i));
      expect(generateObstacles(i)).toEqual(getLevelData(i).layout);
    }
  });
  ```
  This is a 4-line test that catches the headline regression of the milestone.

### F-06. `state.test.ts` is under-described
- **Severity:** Medium (elevated to High because of the implicit coupling)
- **Description:** Phase 3 file list says `src/game/__tests__/state.test.ts — (if it calls generateObstacles directly) — already tested through integration; may not need changes`. Two facts:
  1. `state.test.ts:337` (`expect(next.obstacles.length).toBeGreaterThan(0)`) is a CONTINUE_GAME test that exercises the full reducer path. It will continue to pass after the milestone only because Level 2's layout is non-empty. The plan should not leave this to implicit knowledge.
  2. The test fixture `makeState({ level: 1, status: 'levelComplete', ... })` will run the new `generateObstacles(2)` (after the signature change), and `state.test.ts:339` (`expect(next.food).not.toEqual(state.food)`) will continue to pass because food is re-spawned from the new obstacles.
  The plan should explicitly call out which assertions stay, which are renumbered, and which need rewording (e.g., "test description says 'generates new obstacles and food for next level' — keep as-is").
- **Recommendation:** Replace the parenthetical with a concrete Phase 3 step: "Update `src/game/__tests__/state.test.ts` test description for 'generates new obstacles and food for next level' to reference the layout-driven implementation. The assertions `next.obstacles.length > 0` and `next.food` change both remain valid because Level 2's layout is non-empty. No fixture changes required." Optionally, add a per-level layout assertion directly to the reducer integration test (e.g., `expect(next.obstacles).toEqual(getLevelData(2).layout)`).

## Medium

### F-07. `package.json` version not bumped
- **Severity:** Medium
- **Description:** Phase 4 step 4 bumps `docs/PROJECT_STATE.md` version to v0.5.0. The actual release version lives in `package.json:4` (currently `0.4.0`). The plan does not mention `package.json`. After the milestone, `package.json` and `PROJECT_STATE.md` will disagree on the version.
- **Recommendation:** Add `package.json` to the Phase 4 file list: bump `version` from `0.4.0` to `0.5.0`. One line. Aligns with the milestone version bump policy used in prior milestones.

### F-08. `LEVEL_DESIGN.md` and plan table can drift
- **Severity:** Medium
- **Description:** The plan's table on lines 100–112 is its own interpretation of `LEVEL_DESIGN.md`. Both contain the same content (name, concept, tile count), but if `LEVEL_DESIGN.md` is later updated (e.g., a level name change, a tile count adjustment), the plan and the design will disagree, and an implementer will pick one source. The plan should explicitly elevate `LEVEL_DESIGN.md` to the single source of truth and call the table illustrative.
- **Recommendation:** Add a one-line rule to Phase 1: "The rough tile counts in this table are estimates for implementer guidance. The implementing agent must verify each count against `LEVEL_DESIGN.md` and adjust if the design changes. The plan does not override the design doc." This is cheap insurance against future drift.

### F-09. ARCHITECTURE.md line reference is approximate
- **Severity:** Low
- **Description:** Phase 4 step 5 says "ARCHITECTURE.md §Level System (line ~150–158)". The actual line is 155 (`**Obstacles:** floor(level * 0.5), capped at 8`). The rest of the plan uses precise line numbers; this one is fuzzy. A precise reference is faster for the implementing agent.
- **Recommendation:** Replace with "ARCHITECTURE.md line 155". The plan already uses this precision elsewhere.

### F-10. Plan Review Checklist is self-assessed and incomplete
- **Severity:** Medium
- **Description:** The bottom-of-plan checklist ticks "No future-milestone leakage", "No speculative architecture", etc. — but is internally generated and misses the F-01 / F-02 / F-03 issues. A self-checklist cannot replace an external review.
- **Recommendation:** Add three additional items: "All test files referencing level names or `generateObstacles` are updated (including `LevelTransition.test.tsx`)", "No file references the old level 3 name 'Pillar Run' for level 3", and "Description text source is `LEVEL_DESIGN.md` Purpose field, not invented." These are the items this review would have asked the checklist to verify.

### F-11. `state.test.ts:337` "obstacles.length > 0" assertion is implicitly coupled to Level 2's layout
- **Severity:** Low (because it happens to work)
- **Description:** The CONTINUE_GAME integration test asserts that level 1 → level 2 produces a non-empty obstacle list. After the milestone, this is true only because Level 2's layout is non-empty. The plan should at minimum call out this implicit coupling.
- **Recommendation:** In Phase 3, add a sentence: "The `state.test.ts:337` assertion `expect(next.obstacles.length).toBeGreaterThan(0)` for the level 1→2 CONTINUE_GAME path remains valid because Level 2's layout is non-empty (4–6 tiles per Phase 1). Do not weaken or delete." Optionally, strengthen to `expect(next.obstacles).toEqual(getLevelData(2).layout)`.

### F-12. "Commit message follows Conventional Commits format" verification is unanchored
- **Severity:** Low
- **Description:** Phase 5 Git Verification says `commit message follows Conventional Commits format` but does not state whether the milestone is one commit, one commit per phase, or a squash. Conventional Commits scopes and types depend on this decision.
- **Recommendation:** Add a one-line decision: "The milestone is shipped as a single commit on `feature/obstacle-redesign` with Conventional Commits format `feat(game): redesign obstacles with handcrafted layouts`. Documentation-only updates (Phase 4) may be a separate `docs:` commit if the implementer prefers." The AGENTS.md git workflow already gives the prefix and format; this is just a choice between "one commit" and "N commits".

## Low

### F-13. No "minimum reachable area" or "playable at length 20" check
- **Severity:** Low
- **Description:** Layouts are visually checked in Phase 1, but not validated for navigability. A layout that visually looks like a maze but traps the snake at length 5 is not caught. The plan's risk table mentions "layouts feel unfair or unplayable" as Medium-likelihood.
- **Recommendation:** Optional. Either add a heuristic check (e.g., "BFS from snake start to verify at least N reachable tiles") or rely on the manual L8–L10 playability step proposed in F-04. Either is fine; the gap is the absence of any check.

### F-14. `state.test.ts:337` description says "and food" — wording is correct
- **Severity:** None (informational)
- **Description:** The Phase 3 step 1 says "Remove: tests that only check obstacle count (since count is now determined by predefined layout, not formula)". This is correct. The plan's call to "Add per-level tests: `it('Level N has a non-empty layout')` for levels 2–10" is also correct. Just noting that the existing `'generates new obstacles and food for next level'` test in `state.test.ts` does not check count — it checks `length > 0` and food change. Both assertions still hold, and the test name remains accurate. No change needed.

### F-15. Plan makes 8 call-site updates in `levelData.test.ts` but says "5 or so"
- **Severity:** Low
- **Description:** Phase 3 step 1 says "Remove `snake` and `food` fixture variables from existing tests" and "Change `generateObstacles(N, snake, food)` → `generateObstacles(N)`". Inspecting the actual file: there are 7 test cases (lines 44, 52, 59, 69, 76, 82, 88) that call `generateObstacles`, and the shared `snake` / `food` fixtures are used by all of them. The plan should be specific.
- **Recommendation:** Replace the step with: "Update all 7 `generateObstacles(N, snake, food)` calls in `levelData.test.ts` to `generateObstacles(N)`. Remove the `const snake = [...]` and `const food = {x:5, y:5}` fixtures from the `describe('generateObstacles')` block (lines 37–42)."

### F-16. `getLevelData` test in `levelData.test.ts` will pass unchanged
- **Severity:** None (informational)
- **Description:** The `getLevelData` describe block (lines 5–34) does not check names or descriptions other than Level 1 and Level 10. After the milestone, Level 1's name changes to "First Meal" and Level 10's name stays "Final Run". The existing "returns correct name for level 1" test will need updating (the plan covers this at line 208). The "returns correct name for level 10" test stays valid. No action required beyond what the plan says.

### F-17. `gameLogic.test.ts` obstacle collision tests unaffected
- **Severity:** None (informational)
- **Description:** `src/utils/__tests__/gameLogic.test.ts:110–149` uses hardcoded `obstacles` arrays, not `generateObstacles`. None of these tests need updating. Confirms the plan's "No UI or component changes" checklist item is correct.

### F-18. `state.test.ts:337` will pass only if Level 2's layout is non-empty
- **Severity:** Low (repetition of F-11; flagged again because the implementing agent may not realize this is an implicit constraint on the Level 2 layout)
- **Description:** Same as F-11, repeated for emphasis in the Detailed Findings section.
- **Recommendation:** See F-11.

### F-19. `useGame.ts` and `useKeyboard.ts` do not need changes
- **Severity:** None (informational)
- **Description:** I checked `src/hooks/useGame.ts`, `useKeyboard.ts`, and `useTouch.ts`. None of them reference `generateObstacles`, level names, or `Level` data directly. The plan's claim that no hook changes are needed is correct.

### F-20. `Game.tsx` does not need changes
- **Severity:** None (informational)
- **Description:** `Game.tsx:123,182–184` reads `getLevelData(state.level).name` and `getLevelData(state.level + 1).name` for the HUD and overlay. After the milestone, these return the new names automatically. No component changes required. The plan's "No UI or component changes" claim is correct.

---

# Handoff Assessment

## Phase structure — **Good**

Five phases, each with a single goal and an explicit file list. Phase ordering is bottom-up (data → state machine → tests → docs → integration) and produces a compilable state after every phase. The split between Phase 1 (data) and Phase 2 (state machine) is appropriate because Phase 1 alone is a TypeScript-only change that the existing tests do not exercise — splitting it lets the implementing agent run `npm run build` mid-milestone. Phase 3 (tests) and Phase 4 (docs) are independent and could be reordered; the chosen order is fine.

## Task decomposition — **Good with one critical gap**

File lists per phase are mostly correct, with the following gaps:
- **F-01:** `LevelTransition.test.tsx` is missing.
- **F-06:** `state.test.ts` is under-described; the assertion that the CONTINUE_GAME test remains valid is implicit.
- **F-15:** `levelData.test.ts` updates are 7 call sites, not "5 or so" — be specific.

The decomposition maps cleanly to the architecture: data layer (`levels.ts`, `types.ts`) → state machine (`state.ts`) → tests → docs → integration. Task sizes are small (each phase is well under a day's work for an experienced agent).

## Verification strategy — **Adequate, can be tightened**

Each phase names a verification step (build, test, manual check). Two gaps:

1. **No "run all checks at the end" step.** The Definition of Done implies it, but a final "run all of `npm run build && npm run lint && npm test`" line in Phase 5 (or a new "Phase 6: Final gates" wrap-up) would catch cross-phase regressions in one command.
2. **No manual L8–L10 playability check.** See F-04. The plan's risk table names this as Medium likelihood but the verification step is "playtest after implementation" — soft.

## Definition of Done — **Strong, with one omission**

The milestone DoD (lines 57–72) has 12 items, covering layout data, function rewrite, level 1 emptiness, name updates, snake-start-overlap, HUD correctness, tests, build, lint, and documentation. Strengths: test count is pinned to "140+", documentation updates are explicit, version bump is named.

Gap: the **package.json version** is not in the DoD (F-07). The plan bumps `PROJECT_STATE.md` to v0.5.0 but does not mention `package.json`. Add: "`package.json` version bumped to `0.5.0`".

## AI-agent execution readiness — **Moderate**

The plan is detailed enough that a competent agent can execute it without re-reading the codebase top to bottom, **provided** the agent has read SPEC.md, ARCHITECTURE.md, `LEVEL_DESIGN.md`, and the test files. The risk is in the small-but-fatal omissions (F-01: the `LevelTransition.test.tsx` mock, F-02: the Level 3 naming self-contradiction).

A new agent should be able to:
1. Apply Phase 1 to add `layout: Position[]` to the `Level` interface and populate each level with a handcrafted layout.
2. Apply Phase 2 to rewrite `generateObstacles` and update its two call sites in `state.ts`.
3. Apply Phase 3 to update `levelData.test.ts` (signature change + 7 call sites + Level 1 name test + new layout validity tests), add a determinism test, **and update `LevelTransition.test.tsx`** (F-01), **and add a state.ts test note** (F-06).
4. Apply Phase 4 to update SPEC.md, ROADMAP.md, PROJECT_STATE.md, ARCHITECTURE.md, **and `package.json`** (F-07).
5. Apply Phase 5 to run the full test suite, lint, and build, **and play L8–L10 manually** (F-04).

Resolve F-01 and F-02 before the agent starts.

---

# Final Recommendation

## **Approve with Major Changes**

The plan is structurally sound, well-grounded in the codebase, and aligned with `AGENTS.md`'s "ship the game" philosophy. The phasing, file lists, and verification steps are good enough to hand off to another agent after the changes below land.

The **major** issues are:

1. **F-01 (Critical):** `LevelTransition.test.tsx` is missing from the test-update list. This is a guaranteed CI failure on first test run. One file addition and a 3-line edit.
2. **F-02 (Critical):** The Level 3 naming guidance in Phase 1 step 3 is self-contradictory and risks a name collision with Level 2. A 1-line prose correction.

The **high** issues that should be folded in:
- **F-03:** Pin description text source to `LEVEL_DESIGN.md`.
- **F-04:** Add L8–L10 playability check.
- **F-05:** Add a determinism test.
- **F-06:** Make `state.test.ts` updates explicit.

The **medium / low** issues are improvements (F-07 version bump, F-08 drift rule, F-09 precise line, F-10–F-12) that an experienced agent can fold in as they implement.

**Net assessment:** Simplicity, maintainability, and repository alignment are all served by this plan once F-01 and F-02 are resolved. The plan favours executable, minimal changes — the right instinct. Approve after the two critical fixes land; the rest can ride along as the agent implements.
