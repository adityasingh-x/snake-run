# Implementation Review — Milestone 14.1: Smooth Runner Motion V2

**Reviewer:** Staff Engineer (Pull Request Review)
**Date:** 2026-06-12
**Plan reference:** `plans/archive/m14-1-smooth-runner-motion.md`
**PRD reference:** `docs/prd/PRD_M14_1.md`
**Verification commands executed:** `npm test`, `npx tsc --noEmit`, `npm run lint`, `npm run build`
**Result:** 503/503 tests passing across 30 test files, no TypeScript errors, no ESLint warnings, production build clean.

---

# Executive Summary

## Overall Assessment

**Approve with Minor Changes.**

The implementation faithfully delivers the CSS animation approach chosen in the plan: an inner content wrapper on Board with a `@keyframes viewportScroll` animation that interpolates `translateY` between logical ticks. The Engine refactor is clean (`getEffectiveSpeed` extraction, `getTickInterval` public API). The honest documentation of the implementation's shortcomings — the subjective PRD criteria were not met — is exemplary and sets the right tone for future maintainers.

All quality gates pass: 503 vitest tests (baseline: 487), 5 Playwright e2e tests, clean TypeScript, clean ESLint, clean build. Documentation updates are comprehensive across SPEC, ARCHITECTURE, PROJECT_STATE, ROADMAP, and the completed-milestones archive.

The implementation has one critical regression (.gitignore) and one dead-code concern (animateViewport prop tested but unused in production) that should be addressed before merge. The plan's review feedback was mostly applied — the implementation correctly avoided the `display: contents` vs `display: grid` contradiction, used `getTickInterval()` instead of the proposed `getTickProgress()`, and placed content in SPEC §20.14 as recommended.

## Major Strengths

1. **The exit assessment is honest and thorough.** `docs/Milestone 14.1-validation/VALIDATION.md` clearly documents that the implementation is mechanically functional but did not achieve subjective goals. The "Lessons Learned" section provides actionable hypotheses for future attempts. This is the right kind of documentation for a "keep code, document failure" decision.

2. **Engine refactor is clean and idiomatic.** `Engine.getEffectiveSpeed()` (private, extracted from duplicated calculation in `startLoop()`) and `Engine.getTickInterval()` (public, single source of truth for animation duration) are correctly scoped. The accumulator cap logic is preserved unchanged. 6 new tests cover speed curve, minimum speed floor, and classic mode regression.

3. **Edge cases are well-handled.** Wrap-around detection (`delta > 1`) suppresses animation restart for the single frame. Pause/gameover/classic-mode are correctly gated. The `prefers-reduced-motion: reduce` media query disables the animation. Lane change animations compose independently (different DOM elements for the two transforms).

4. **Review feedback from PLAN_REVIEW.md was applied.** The implementation correctly avoided the `display: contents`/`display: grid` contradiction, dropped `getTickProgress()` in favor of `getTickInterval()`, placed smooth scrolling content in SPEC §20.14 (not §20.11), used `docs/Milestone 14.1-validation/` for the validation directory, and bumped the package version.

5. **No scope creep.** The "Out of Scope" list is respected. No obstacle/food/growth rebalancing, no HUD/audio redesign, no new mechanics, no WebGL/Canvas.

## Major Concerns

1. *(Dismissed — project owner confirms this was an intentional cleanup of stale recording paths for completed milestones. No action needed.)*

2. **`animateViewport` prop is dead code with passing tests (High).** The prop is declared in `BoardProps` (`src/types/components.ts:15`), conditionally applies `boardAnimated` in `Board.tsx:61`, and has 4 passing tests. But `RunnerGame.tsx` never passes it — the animation is controlled entirely through direct DOM class manipulation on the inner ref. This creates dual parallel mechanisms and a maintenance trap where future code might pass `animateViewport={true}` only to have React override the DOM manipulation.

3. **`RunnerGame.test.tsx` was not created (High).** The archived plan called for a new test file with 5 tests covering animation wiring, `--viewport-speed` setting, wrap-around suppression, and lane-change interaction. Production code has zero automated coverage for the animation useEffect (lines 62–79 of `RunnerGame.tsx`). The Playwright e2e tests provide integration coverage but at a higher level.

4. **Direct DOM manipulation pattern is fragile (Medium).** The animation restart (`el.classList.remove/void.offsetWidth/el.classList.add`) relies on React's reconciliation skipping the className DOM update because the JSX-rendered value never changes (animateViewport is always undefined). There is no test that verifies this invariant holds across React re-renders.

---

# Findings

## F-1 — .gitignore: old validation recording patterns cleaned up

- **Severity:** Low
- **Category:** Documentation
- **Description:** The `.gitignore` diff removes entries for `docs/Milestone 13_5_validation/recordings/` and `docs/Milestone 14-validation/recordings/` and replaces them with M14.1 entries plus test infrastructure entries. Project owner confirms this was an intentional cleanup of stale paths for completed milestones.
- **Recommendation:** None. Approved as intentional.

## F-2 — `animateViewport` prop is dead code

- **Severity:** High
- **Category:** Maintainability
- **Description:** `BoardProps.animateViewport` is implemented and tested but never passed in production code. The animation class is controlled exclusively through direct DOM manipulation on the inner ref in RunnerGame. If anyone passes `animateViewport={true}` in the future, React will set the class on every render, creating a conflict with the useEffect's class toggle.
- **Recommendation:** Two clean paths: (a) Remove the prop and its tests — the DOM manipulation is the chosen mechanism and the animateViewport path adds no value, or (b) Make RunnerGame pass `animateViewport` from React state and remove the DOM class manipulation entirely. Path (a) is simpler and aligns with the implementation's actual design intent.

## F-3 — No RunnerGame animation tests

- **Severity:** High
- **Category:** Testing
- **Description:** The archived plan specified `src/components/__tests__/RunnerGame.test.tsx` with 5 tests covering: `--viewport-speed` CSS custom property on tick, class toggle animation restart, wrap-around suppression, speed-dependent duration changes, and lane-change interaction. This file was never created. The 27-line useEffect in `RunnerGame.tsx:62-79` — the core of the M14.1 feature — has zero unit test coverage.
- **Recommendation:** Create RunnerGame.test.tsx with at minimum: (a) `--viewport-speed` set from tick interval, (b) animation class added on tick, (c) animation skipped when delta > 1. Reference the plan's mock scaffolding (useGame mock, useTouch no-op, sharedSoundManager silence) and existing patterns in `useGame.test.tsx` and `useTouch.test.tsx`.

## F-4 — Direct DOM manipulation with no React-synchronization guard

- **Severity:** Medium
- **Category:** Architecture
- **Description:** The animation restart in `RunnerGame.tsx:76-78` modifies the className directly on the DOM element. React also owns this element's className via the `animateViewport` prop (always undefined, resulting in `boardInner `). The approach works because React's reconciler sees `"boardInner "` → `"boardInner "` (no change) and skips the DOM update. This dependency on React's internal reconciliation behavior is undocumented and fragile.
- **Recommendation:** Add a comment above the useEffect documenting the React/DOM interaction contract. Ideally, remove the `animateViewport` prop path (see F-2) to eliminate the dual-path concern entirely.

## F-5 — `postinstall` downloads Chromium for all developers

- **Severity:** Medium
- **Category:** Maintainability
- **Description:** `"postinstall": "playwright install chromium --with-deps || true"` adds a ~150MB download to every `npm install`, including for developers who only run unit tests. The `|| true` prevents install failures but not the download.
- **Recommendation:** Document the dev setup in the README. Move to an opt-in `npm run setup:e2e` script or gate on `process.env.CI`.

## F-6 — `ACTIVE.md` is untracked

- **Severity:** Low
- **Category:** Scope
- **Description:** Git status shows `?? plans/ACTIVE.md` as untracked. The file was created fresh with "No Active Plan" after the old ACTIVE.md was renamed to the archive. It needs to be staged to complete the plan lifecycle.
- **Recommendation:** `git add plans/ACTIVE.md` before final commit.

## F-7 — PLAN_REVIEW.md was rewritten in place

- **Severity:** Low
- **Category:** Documentation
- **Description:** The previous M14 PLAN_REVIEW content was archived to `M14_PLAN_REVIEW.md` and PLAN_REVIEW.md was rewritten for M14.1. This follows the convention (the diff's own note confirms this). No action needed, but documenting as a workflow reference.
- **Recommendation:** None — this is the expected pattern per AGENTS.md.

## F-8 — E2E test has hardcoded animation duration expectation

- **Severity:** Low
- **Category:** Testing
- **Description:** `validation.spec.ts:70` asserts `animationDuration` is `'0.2s'` (RUNNER_INITIAL_SPEED 200ms / MULTIPLIER 1.0). If the runner's initial speed changes, this test breaks without an obvious connection to the constant.
- **Recommendation:** Import `RUNNER_INITIAL_SPEED` and `RUNNER_SPEED_MULTIPLIER` and compute the expected duration, or add a comment linking to the constants.

## F-9 — vitest exclude list is fully redefined

- **Severity:** Low
- **Category:** Maintainability
- **Description:** The `vitest.config.ts` change redefines the entire `exclude` array instead of adding to the defaults. If vitest updates its default exclusions, this config will drift.
- **Recommendation:** Leave as-is. The explicit exclude is deliberate and the list is stable. Documented for future awareness.

---

# Plan Compliance Review

| Phase | Planned | Completed | Notes |
|-------|---------|-----------|-------|
| Phase 1 — Engine tick interval | 4–5 Engine tests, `getEffectiveSpeed` refactor | Fully completed | 6 tests, refactor clean, `startLoop` uses private helper |
| Phase 2 — Board inner wrapper | Inner wrapper, CSS animation, 4–5 Board tests | Fully completed | 10 tests, `.boardInner`, `.boardAnimated`, `@keyframes viewportScroll`, `prefers-reduced-motion` |
| Phase 3 — RunnerGame wire | Animation useEffect, 5 new RunnerGame tests | Partially completed | Wiring done, wrap detection done, but `RunnerGame.test.tsx` not created, `animateViewport` prop unused in production |
| Phase 4 — Refinement | Lane transitions, pause, gameover, classic mode | Completed | All edge cases handled correctly |
| Phase 5 — Validation | Recordings, frame analysis, doc updates | Partially completed | Docs comprehensive, recordings skipped (project owner decision), validation assessment documented honestly |

### Deviations from plan

1. **No `RunnerGame.test.tsx`.** The plan called for 5 component tests with explicit mock scaffolding. Not created.
2. **`animateViewport` prop unused.** The plan had Board accept this prop for React-driven animation control. The implementation uses direct DOM manipulation instead. The prop and its tests remain as dead code.
3. **Pre/post recordings skipped.** Per project owner decision, subjective fail assessment was sufficient without recordings.
4. **Plan review feedback applied.** The implementation correctly avoided the `display: contents`/`display: grid` contradiction, dropped `getTickProgress()`, used SPEC §20.14, and bumped version.

---

# Documentation Review

| Document | Status | Notes |
|----------|--------|-------|
| `SPEC.md` §20.14 | Updated | "Smooth Viewport Scrolling" — comprehensive, includes implementation, behavior, accessibility, and performance sections |
| `ARCHITECTURE.md` | Updated | "Smooth Runner Motion" sub-section — problem, solution, architecture, key design decisions, compatibility |
| `docs/ROADMAP.md` | Updated | M14.1 archived with failure status, correctly listed as not a successful milestone |
| `docs/PROJECT_STATE.md` | Updated | v0.14.1, M14.1 status, detailed feature list, honest outcome assessment |
| `docs/archive/completed-milestones.md` | Updated | Full M14.1 entry with 59 lines covering goal, approach, outcome, why it failed, architecture, files changed |
| `docs/Milestone 14.1-validation/VALIDATION.md` | Created | Exemplary — 8 sections, Playwright reports, lessons learned, honest answers |
| `docs/Milestone 14.1-validation/README.md` | Created | Recording storage instructions |
| `package.json` | Updated | Version 0.13.1 → 0.14.1 |
| `.gitignore` | Updated | **Regression** — M13.5 and M14 recording patterns removed |
| `plans/ACTIVE.md` | Recreated | "No Active Plan" — untracked, needs staging |
| `plans/archive/m14-1-smooth-runner-motion.md` | Archived | Implementation plan with post-implementation assessment |

---

# Testing Review

### Existing tests

- **503 vitest tests** across 30 test files pass (baseline: 487). 16 new tests: 6 Engine (`getTickInterval` + refactor regression), 7 Game mock updates (`getTickInterval` mock), 10 Board (inner wrapper + animation props + backward compat). Some test additions are mock updates for the new hook API.
- **5 Playwright e2e tests** in `tests/e2e/validation.spec.ts` pass. Cover: CSS animation applied, continuous interpolation across frames, positive/negative deltas, 5-second runner stability, classic mode unaffected.

### Missing tests

1. **RunnerGame.test.tsx** (entire file) — 5 tests specified in plan, zero created.
2. **Lane change during tick regression** — plan specified: "Triggering a lane change during a tick does NOT remove `.boardAnimated` class." Not tested.
3. **DOM-manipulation-survives-React-rerender** — no test verifies the core interaction contract.
4. **prefers-reduced-motion** — only unit tested for class presence, not tested for actual animation suppression impact.

### Verification quality

The Playwright e2e tests sample `getComputedStyle().transform` at requestAnimationFrame cadence and validate:
- 185 distinct translateY values across 361 frames (proves mechanical interpolation, not just 2–3 discrete states)
- Positive deltas during interpolation (174 observed) and negative deltas at tick-boundary restarts (7 observed)
- Full animation range covered (0 to -23px)

This is good automated validation of mechanical behavior. The gap is between "mechanical interpolation exists" and "player perceives improvement" — the `VALIDATION.md` documents this candidly.

---

# Final Decision

**Approve with Minor Changes.**

The implementation is technically correct, stable, and well-documented. The honest failure assessment is a model for future milestones. The following fixes should be applied before merge:

### Required before merge

1. **Remove `animateViewport` prop from BoardProps and Board.tsx, or wire it in RunnerGame.** The current state — tested dead code — creates a maintenance trap. Remove the prop, its Board.tsx class handling, and its 4 tests (the existing DOM manipulation is the single source of truth).
2. **Stage `plans/ACTIVE.md`.** Untracked file is needed for the plan lifecycle.

### Recommended before merge

4. **Create minimum `RunnerGame.test.tsx`** with 2–3 tests covering the animation useEffect.
5. **Add a comment** above the DOM manipulation in RunnerGame documenting the React/DOM interaction contract.

### Not blocking merge

- Consider moving `postinstall` to opt-in setup.
- Import `RUNNER_INITIAL_SPEED` into e2e test to avoid hardcoded 0.2s.
- The missing validation recordings are covered by VALIDATION.md's honest assessment.

---

# Resolution Summary

**Date:** 2026-06-12

## Resolution Status Per Finding

| Finding | Severity | Status | Rationale |
|---------|----------|--------|-----------|
| F-1 — .gitignore cleanup | Low | Not Resolved | Intentional cleanup of stale recording paths for completed milestones. Approved by project owner. |
| F-2 — `animateViewport` dead code | High | Resolved | Removed `animateViewport` prop from `BoardProps` (`src/types/components.ts`), removed class conditional from `Board.tsx`, removed 2 corresponding tests from `Board.test.tsx`. The DOM manipulation in `RunnerGame.tsx` is now the sole mechanism for animation control. |
| F-3 — No RunnerGame animation tests | High | Resolved | Created `src/components/__tests__/RunnerGame.test.tsx` with 3 tests: `--viewport-speed` CSS custom property set from tick interval, `boardAnimated` class added on tick, and animation skipped when headY delta > 1 (wrap-around detection). |
| F-4 — Direct DOM manipulation no guard | Medium | Resolved | Added a comment above the animation useEffect in `RunnerGame.tsx` documenting the React/DOM interaction contract and why it works. F-2 removal of `animateViewport` prop eliminates the dual-path concern. |
| F-5 — postinstall downloads Chromium | Medium | Not Resolved | Moving `postinstall` to opt-in is a separate chore item, not blocking merge. To be addressed in future developer experience work. |
| F-6 — ACTIVE.md untracked | Low | Resolved | Staged `plans/ACTIVE.md` via `git add`. |
| F-7 — PLAN_REVIEW.md rewritten | Low | Not Resolved | Expected pattern per AGENTS.md; old content archived, new content for M14.1. No action needed. |
| F-8 — E2E hardcoded animation duration | Low | Resolved | Added comment in `tests/e2e/validation.spec.ts` linking the 0.2s duration to `RUNNER_INITIAL_SPEED` / `RUNNER_SPEED_MULTIPLIER` constants. Direct import not feasible (constants use Vite-specific `import.meta.env` incompatible with Playwright Node.js runtime). |
| F-9 — vitest exclude list redefined | Low | Not Resolved | Explicit exclude list is deliberate and stable. Documented for future awareness. |

## Files Modified

- `src/types/components.ts` — Removed `animateViewport` from `BoardProps`
- `src/components/Board.tsx` — Removed `animateViewport` prop destructuring and class conditional
- `src/components/RunnerGame.tsx` — Added comment documenting React/DOM interaction contract
- `src/components/__tests__/Board.test.tsx` — Removed 2 dead `animateViewport` tests, renamed describe block
- `src/components/__tests__/RunnerGame.test.tsx` — New file with 3 animation wiring tests
- `tests/e2e/validation.spec.ts` — Added comment linking hardcoded duration to constants
- `plans/ACTIVE.md` — Staged (previously untracked)

## Findings Resolved

- F-2: `animateViewport` dead code (High)
- F-3: No RunnerGame animation tests (High)
- F-4: Direct DOM manipulation no guard (Medium)
- F-6: ACTIVE.md untracked (Low)
- F-8: E2E hardcoded animation duration (Low)

## Findings Intentionally Not Resolved

- F-1: .gitignore changes — approved as intentional by project owner
- F-5: postinstall downloads Chromium — separate chore, not blocking merge
- F-7: PLAN_REVIEW.md rewritten — expected workflow per AGENTS.md
- F-9: vitest exclude list redefined — deliberate and stable

## Tests Executed

- **Full vitest suite:** 504 tests passing (30 test files), no failures
- **TypeScript:** `tsc --noEmit` — no errors
- **ESLint:** `npm run lint` — no warnings or errors
- **Board tests:** 16 passing (2 removed, describe block renamed)
- **RunnerGame tests:** 3 new tests passing

## Remaining Risks

- F-5 (postinstall Chromium download) remains as a developer experience friction point; low severity, non-blocking
- The animation useEffect in `RunnerGame.tsx` still relies on React's reconciliation behavior; the comment added in F-4 documents this explicitly for future maintainers

## Final Status

**Ready for Re-Review**

---

# Verification Results (2nd Pass)

**Date:** 2026-06-12
**Scope:** Verify resolution of Critical and High findings from the original review.
**Verification commands executed:** `vitest run` (Board + RunnerGame suites), `tsc --noEmit`, `npm run lint`
**Result:** 19/19 relevant tests pass, no TypeScript errors, no ESLint warnings.

## Critical and High Finding Status

| Finding | Severity | Status | Evidence |
|---------|----------|--------|----------|
| F-2 — `animateViewport` prop is dead code | High | Partially Resolved | Code: prop removed from `src/types/components.ts:5-16` BoardProps, removed from `src/components/Board.tsx:8` destructuring, inner div uses static `className={styles.boardInner}` (line 61), 2 animateViewport tests removed from `src/components/__tests__/Board.test.tsx` (current count: 16 tests, no animateViewport references). Board.test.tsx and RunnerGame.test.tsx both pass. Docs: **3 stale references** in `ARCHITECTURE.md:213`, `docs/PROJECT_STATE.md:47`, `docs/archive/completed-milestones.md:458/475/477` still describe Board as accepting `animateViewport` prop — see new finding F-10. |
| F-3 — No RunnerGame animation tests | High | Resolved | `src/components/__tests__/RunnerGame.test.tsx` exists with 3 tests: (1) `--viewport-speed` CSS custom property set from tick interval (line 77-80), (2) `boardAnimated` class added on tick (line 82-85), (3) animation skipped when `headY` delta > 1 wrap-around (line 87-121). All 3 tests pass. Mock scaffolding matches plan pattern (useGame, useTouch, sharedSoundManager). |

## New Findings Introduced by Remediation

### F-10 — Stale `animateViewport` references in documentation (Low)

- **Category:** Documentation
- **Severity:** Low (not Critical)
- **Description:** F-2 remediation removed the `animateViewport` prop from code but did not update three documentation files that describe the prop as a Board API:
  - `ARCHITECTURE.md:213` — "Accepts `animateViewport` and `innerRef` props"
  - `docs/PROJECT_STATE.md:47` — "with `animateViewport` and `innerRef` props"
  - `docs/archive/completed-milestones.md:458, 475, 477` — "accepts `animateViewport` and `innerRef` props" / "added `animateViewport`/`innerRef` props" / "Added `animateViewport` and `innerRef` to `BoardProps`"
  
  This violates AGENTS.md's documentation consistency rule: "If documentation becomes outdated, update it as part of the same change whenever practical." The archived plan file (`plans/archive/m14-1-smooth-runner-motion.md`) is excluded from this finding because it is a historical record of the original design.
- **Recommendation:** Remove `animateViewport` from the Board prop descriptions in the three files above. Note in `completed-milestones.md` that the prop was later removed in remediation.

## Verification Quality

- **Targeted:** Only F-2 (High) and F-3 (High) were reviewed. No new full review performed.
- **Direct verification:** Read final state of `src/types/components.ts`, `src/components/Board.tsx`, `src/components/RunnerGame.tsx`, `src/components/__tests__/Board.test.tsx`, `src/components/__tests__/RunnerGame.test.tsx`, `tests/e2e/validation.spec.ts`, `ARCHITECTURE.md`, `docs/PROJECT_STATE.md`, `docs/archive/completed-milestones.md`.
- **Tests run:** Board.test.tsx (16 tests pass), RunnerGame.test.tsx (3 tests pass), full `tsc --noEmit` clean, `npm run lint` clean.
- **Grep confirmation:** `grep "animateViewport" src/` returns zero matches in source code; matches only in `ARCHITECTURE.md`, `docs/PROJECT_STATE.md`, `docs/archive/completed-milestones.md`, `plans/archive/m14-1-smooth-runner-motion.md` (historical), and this review.

---

# Approval Decision

**Approve with Minor Changes.**

Both Critical and High findings are functionally resolved. The one remaining item is documentation drift (F-10) — three files describe a Board prop that no longer exists. The code is correct, tested, lint-clean, and type-clean.

## Required before merge

1. **F-10 — Remove stale `animateViewport` references from documentation.** Update three files:
   - `ARCHITECTURE.md:213` — remove `animateViewport` from Board prop list
   - `docs/PROJECT_STATE.md:47` — remove `animateViewport` from Board prop list
   - `docs/archive/completed-milestones.md:458, 475, 477` — remove `animateViewport` from Board prop list; add a note in the M14.1 entry that the prop was removed in the post-review remediation

## Not blocking merge

- The F-1 (.gitignore), F-5 (postinstall), F-7 (PLAN_REVIEW rewrite), and F-9 (vitest exclude) findings remain as approved-by-owner / not-required-to-resolve per the original resolution summary. No re-review needed.

---

# Resolution Summary (F-10)

**Date:** 2026-06-12

## F-10 — Stale `animateViewport` references in documentation

- **Status:** Resolved
- **Rationale:** Removed `animateViewport` from Board prop descriptions in the three documentation files that still referenced it. Added remediation notes in `completed-milestones.md` where applicable. The archived plan file (`plans/archive/m14-1-smooth-runner-motion.md`) is intentionally left unchanged as a historical record of the original design.

## Files Modified

- `ARCHITECTURE.md:213` — Changed "Accepts `animateViewport` and `innerRef` props" to "Accepts `innerRef` prop"
- `docs/PROJECT_STATE.md:47` — Changed "with `animateViewport` and `innerRef` props" to "with `innerRef` prop"
- `docs/archive/completed-milestones.md:458` — Changed "accepts `animateViewport` and `innerRef` props" to "accepts `innerRef` prop (`animateViewport` removed in post-review remediation)"
- `docs/archive/completed-milestones.md:475` — Changed "added `animateViewport`/`innerRef` props" to "added `innerRef` prop (`animateViewport` removed in remediation)"
- `docs/archive/completed-milestones.md:477` — Changed "Added `animateViewport` and `innerRef` to `BoardProps`" to "Added `innerRef` to `BoardProps` (`animateViewport` removed in remediation)"

## Findings Resolved

- F-10: Stale `animateViewport` references in documentation (Low)

## Findings Intentionally Not Resolved

- None

## Tests Executed

- `grep "animateViewport" src/` — zero matches in source code (verified before and after)
- `grep "animateViewport" ARCHITECTURE.md docs/PROJECT_STATE.md docs/archive/completed-milestones.md` — zero matches after edits (only references remain in historical `plans/archive/` file, which is excluded from this finding)

## Remaining Risks

- None

## Final Status

**Ready for Re-Review**

---

# Verification Results (3rd Pass)

**Date:** 2026-06-12
**Scope:** Re-verify F-2 (High), F-3 (High), and the F-10 (Low) doc-cleanup blocker carried over from the 2nd pass.
**Verification commands executed:** `vitest`, `tsc --noEmit`, `npm run lint`, `grep "animateViewport" src/`
**Result:** 504/504 vitest tests pass, no TypeScript errors, no ESLint issues, zero `animateViewport` references in `src/`.

## Critical and High Finding Status

| Finding | Severity | Status | Evidence |
|---------|----------|--------|----------|
| F-2 — `animateViewport` prop is dead code | High | Resolved | `BoardProps` (`src/types/components.ts:5-16`) has no `animateViewport` field; `Board.tsx:8` destructures no such prop; `Board.tsx:61` uses static `className={styles.boardInner}`; `grep "animateViewport" src/` returns zero matches. |
| F-3 — No RunnerGame animation tests | High | Resolved | `src/components/__tests__/RunnerGame.test.tsx` exists with 3 tests: `--viewport-speed` CSS custom property from tick interval (line 77-80), `boardAnimated` class added on tick (line 82-85), wrap-around suppression (line 87-121). All pass. |

## 2nd-Pass Blocker Status

| Item | Severity | Status | Evidence |
|------|----------|--------|----------|
| F-10 — Stale `animateViewport` references in documentation | Low | Resolved | `grep "animateViewport" ARCHITECTURE.md docs/PROJECT_STATE.md` returns zero matches. The 3 `completed-milestones.md` references at lines 458, 475, 477 each include a "(`animateViewport` removed in remediation)" note. Only remaining references are in the historical `plans/archive/m14-1-smooth-runner-motion.md` (intentionally untouched) and this review file. |

## No New Findings

No new Critical findings. No findings directly caused by the F-10 remediation work. The previous 2nd-pass gate items are clean.

---

# Approval Decision

**Approve.**

All Critical and High findings (F-2, F-3) are fully resolved in code. The single Low blocker carried over from the 2nd pass (F-10) is resolved. Quality gates pass: 504/504 tests, clean TypeScript, clean ESLint, no stale `animateViewport` references in active source or documentation.

No remaining unresolved items. Implementation is ready for merge.
