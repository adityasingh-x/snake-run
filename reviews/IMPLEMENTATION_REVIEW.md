# PR #4 — Implementation Review: PWA Support & GitHub Pages Deployment

**Reviewer:** Staff Engineer
**Subject:** PR #4 — `feat(pwa): add PWA support and GitHub Pages deployment`
**Base branch:** `main` (post-merge state)
**Reviewed against:** `plans/ACTIVE.md` (Milestone 3), `AGENTS.md`, `docs/ROADMAP.md`, `ARCHITECTURE.md`
**Date:** 2026-06-03

---

## Executive Summary

### Overall Assessment

**Approve with Minor Changes.** PR #4 is a well-scoped, well-executed PWA infrastructure release that faithfully implements the Milestone 3 plan. The change set is minimal and surgical (one new test file, one new workflow file, configuration changes to `vite.config.ts`, `tsconfig.app.json`, `index.html`, `package.json`, and documentation updates across four `.md` files). No application code or game logic is touched.

The implementation successfully addresses most of the issues the companion `plans/PLAN_REVIEW.md` flagged in the plan (ESM-incompatible `__dirname`, CI test/build ordering, test conventions, semicolons, manifest `purpose` value). Verification was reproduced locally: `npm run build` succeeds, `npm test` reports 122/122 pass, `npm run lint` is clean, and the `dist/` output contains `sw.js`, `manifest.webmanifest`, `registerSW.js`, and a Workbox runtime.

A small set of documentation inconsistencies and one structural concern (the `plans/` directory state) remain, but nothing rises to the level of a blocker. The PR is ready to ship pending the manual setup steps called out in `plans/ACTIVE.md` (GitHub `github-pages` environment, deploy verification).

### Major Strengths

- **Tight scope.** PR only touches infrastructure (build config, HTML, deployment) and documentation. No game logic, engine, hooks, components, or platform adapters are modified.
- **Plan compliance is high.** All 16 steps of `plans/ACTIVE.md` are executed as written (or with a minor justified deviation — see findings).
- **Plan-review findings addressed.** The two most serious issues flagged in `plans/PLAN_REVIEW.md` (ESM test code, CI build/test ordering) are both fixed in the implementation.
- **Manifest is well-formed.** Generated `dist/manifest.webmanifest` matches the spec: `name`, `start_url`, `scope`, `display` all point at the GitHub Pages project subpath.
- **Build and toolchain are green.** 122 tests pass, lint is clean, TypeScript build is clean, all PWA artifacts generated as expected.
- **Conditional PWA tests use `describe.runIf`.** PWA artifact tests skip gracefully when `dist/` is absent (dev workflow) and run automatically in CI because the workflow builds before testing.
- **Version bumped consistently** in both `package.json` and `docs/PROJECT_STATE.md` to `0.3.0`.

### Major Concerns

- **No manual verification evidence.** Phase 3 (Step 6) and Phase 7 (Step 16) of the plan require manual offline smoke testing and on-device install verification. The PR description reports only the automated checks. Acceptable for merge given the small blast radius, but should be performed and recorded before announcing the release.
- **`plans/ACTIVE.md` is stale after completion.** The completed plan was archived to `plans/archive/2026-06-03-pwa-release.md` (commit `4d927ff`) but `plans/ACTIVE.md` still contains the same 585-line completed plan, which contradicts AGENTS.md ("Only ACTIVE.md represents the currently approved implementation plan").
- **SPEC.md is partially out of date.** Test count and bundle size were not updated to reflect the post-PR state.

---

## Findings

### Finding 1 — `plans/ACTIVE.md` not reset after plan completion

- **Severity:** Medium
- **Category:** Documentation
- **Description:** AGENTS.md states: "Only ACTIVE.md represents the currently approved implementation plan. Do not create multiple active plans simultaneously." After merge, commit `4d927ff` archived the plan to `plans/archive/2026-06-03-pwa-release.md` (a 585-line copy) but did **not** clear or replace `plans/ACTIVE.md`, which still contains the same 585-line completed plan. The state right now is: ACTIVE.md holds a finished plan, an archive copy exists, and a sibling `plans/PLAN_REVIEW.md` (264 lines) also remains. This leaves the `plans/` tree in a state where there is no "currently active" plan.
- **Recommendation:** In a follow-up, either (a) replace `plans/ACTIVE.md` with a short pointer / TOC for future plans, or (b) explicitly mark it as "no active plan" with a note pointing at the archive. The archive copy itself is correctly placed and named.

### Finding 2 — SPEC.md test count and bundle size not updated

- **Severity:** Medium
- **Category:** Documentation
- **Description:** SPEC.md §15 (Testing) still says "116 unit tests across 10 test files" and §16 (Build and Dev) still says "~203KB JS bundle (64KB gzipped), ~4KB CSS". Post-PR reality is 122 tests across 11 test files (build output: 207.04 kB JS / 65.24 kB gzip, 6.18 kB CSS / 1.76 kB gzip). SPEC.md is the source of truth for game behavior; letting it drift is what AGENTS.md explicitly warns against.
- **Recommendation:** Update §15 to "122 unit tests across 11 test files" and add the `pwa.test.ts` (6 tests) row. Update §16 bundle figures to match current build output.

### Finding 3 — Manual verification (Phase 3 / Phase 7) not recorded

- **Severity:** Medium
- **Category:** Testing
- **Description:** `plans/ACTIVE.md` Phase 3 (Step 6) and Phase 7 (Step 16) require manual offline and on-device install checks (Chrome install icon, iOS "Add to Home Screen", game playable in airplane mode, sound works in installed PWA, high score persists). The PR description only lists automated checks: `npm run build && npm test && npm run lint`. There is no screenshot, log, or written confirmation that any of the 8 manual success criteria were exercised.
- **Recommendation:** Before cutting the public release announcement, complete Steps 6 and 16 of the plan and capture the results in a follow-up commit (e.g. as a `docs/PWA_VERIFICATION.md` or in `docs/PROJECT_STATE.md` under "Success Definition For Current Milestone"). This is the only piece of the Definition of Done that the PR cannot satisfy with code.

### Finding 4 — `fix.md` (Milestone 2 post-mortem) included in this PR

- **Severity:** Low
- **Category:** Scope
- **Description:** `fix.md` is a 32-line post-mortem for the Milestone 2 bugfix in PR #3 (`bugfix/mobile-controls-toolbar`). It was added in this PR's commit `f1d615e` rather than in PR #3 where it belongs. The content itself is fine (it documents a real bug and fix, including verification). The smell is purely about PR hygiene.
- **Recommendation:** Leave as-is unless cleaning up PRs is a project priority. The file is harmless and historical, and the actual content matches the commit. If retained, consider moving it under a `docs/postmortems/` directory in a future housekeeping pass so it doesn't sit at the repo root next to `README.md` and `AGENTS.md`.

### Finding 5 — `plans/PLAN_REVIEW.md` left at top level

- **Severity:** Low
- **Category:** Documentation
- **Description:** `plans/PLAN_REVIEW.md` is a 264-line review of the PWA plan. It is not archived alongside the plan and currently sits at the top of `plans/`, which AGENTS.md describes as a location reserved for the active plan. It is also not referenced from anywhere.
- **Recommendation:** Either move it to `plans/archive/2026-06-03-pwa-release-review.md` so the plans tree reflects AGENTS.md's "ACTIVE.md, drafts/, archive/" model, or delete it (most of its findings are already reflected in the implementation and the value of retaining the historical review is limited).

### Finding 6 — `tsconfig.app.json` includes `"node"` types beyond plan scope

- **Severity:** Low
- **Category:** Scope / Maintainability
- **Description:** The plan called for adding `"vite-plugin-pwa/client"` to `compilerOptions.types`. The actual change also adds `"node"`, which was not specified. The addition is required because the new `pwa.test.ts` uses `node:fs`, `node:path`, and `process.cwd()`, and without the `node` types the test file would fail to type-check. So this is a justified deviation, not a bug, but it is an undocumented widening of the types scope and exposes Node globals to the whole `src/` tree under type-checking.
- **Recommendation:** Acceptable as-is given the test's needs. If a future refactor extracts the build-output test into its own project (e.g. a `tsconfig.test.json` that pulls in `node` types), the main `tsconfig.app.json` can drop `"node"`. Not a blocker for this PR.

### Finding 7 — `dist/` (and source maps) committed to local working tree

- **Severity:** Low
- **Category:** Maintainability
- **Description:** `.gitignore` correctly excludes `dist/`, and the git tree is clean. However, the local working tree contains a `dist/` directory with ~9 files including 207 KB of JS, 207 KB of source map, and 207 KB of Workbox source map. Future runs of `npm test` will exercise the PWA tests against this local `dist/`. If a developer runs `npm test` after a `git pull` of new code that breaks PWA artifact generation, the test will still pass against the stale `dist/`. This is a known caveat of the test design (acknowledged in `plans/ACTIVE.md` Step 9), but worth surfacing.
- **Recommendation:** Add a short `pretest` script that runs `npm run build` before `vitest run`, or document the "build first, then test" requirement prominently in `README.md` and `SPEC.md` §16. Out of scope for this PR if the team prefers speed over hermeticity.

### Finding 8 — NetworkFirst cache for *all* external HTTP(S) URLs

- **Severity:** Low
- **Category:** Architecture
- **Description:** The Workbox `runtimeCaching` rule `urlPattern: /^https?:\/\/.*/` matches every external request. The plan itself specifies this, and the rationale is "External resources use `NetworkFirst` with 24-hour cache". However, the application makes no external network calls at runtime (no analytics, no CDN assets, no fonts, no images — verified by absence of any HTTP usage in `src/`). The rule is dead code in practice and slightly increases service-worker code size and complexity.
- **Recommendation:** Acceptable for v0.3.0 because it is documented in the plan and matches the principle of "be ready for future external assets". A future milestone can either drop the rule (simplest) or narrow it once a real external dependency is added. Not a blocker.

### Finding 9 — `icons.svg` precached but not referenced by the manifest

- **Severity:** Low
- **Category:** Maintainability
- **Description:** `dist/sw.js` precaches `icons.svg` (revision `3b4fcfcf393eca4d264dca4a4663bc37`) and the file exists in `public/`, but the generated `manifest.webmanifest` only references `favicon.svg`. `icons.svg` is therefore taking up precache space without being surfaced to the user or the PWA install dialog.
- **Recommendation:** If `icons.svg` is intended as a future icon, add it to the manifest's `icons` array (and consider replacing or supplementing `favicon.svg` per `plans/PLAN_REVIEW.md`'s "snake-themed SVG" suggestion). If it is leftover from earlier work, remove it from `public/` to shrink the precache by ~5 KB. Not a blocker.

### Finding 10 — `purpose: 'any'` (single token) is correct; worth a comment

- **Severity:** Low
- **Category:** Maintainability
- **Description:** `plans/PLAN_REVIEW.md` flagged that `'any maskable'` is an invalid combo (the spec requires a space-separated list of valid tokens). The implementation correctly uses `purpose: 'any'` only. The config in `vite.config.ts:28` is fine; this finding is a positive confirmation rather than a defect, and is recorded so future contributors don't reintroduce the bad value.
- **Recommendation:** None — keep as-is.

### Finding 11 — Test assertions for HTML are loose

- **Severity:** Low
- **Category:** Testing
- **Description:** `src/__tests__/pwa.test.ts:25-29` asserts that `dist/index.html` contains the substrings `manifest` and `registerSW`. These strings appear in many unrelated contexts (CSS class names, the `<title>`, etc.) and would still pass if the plugin emitted, say, a `data-manifest` attribute instead of a `<link rel="manifest">`. The other tests already cover file existence, so the value of this test is mostly a smoke check.
- **Recommendation:** Tighten to `expect(html).toContain('rel="manifest"')` and `expect(html).toContain('vite-plugin-pwa:register-sw')` for more meaningful coverage. Optional — the file-existence tests already catch the regression that matters.

### Finding 12 — `favicon.svg` is not snake-themed

- **Severity:** Low
- **Category:** Scope
- **Description:** The `public/favicon.svg` is a generic purple lightning bolt. Using it as the installable PWA icon means the home-screen icon for the "Snake Run" PWA shows a lightning bolt. `plans/PLAN_REVIEW.md` flagged this; the implementation correctly accepted it as a first-release trade-off (no PNG generator, no new SVG).
- **Recommendation:** Schedule a snake-themed icon (or at least a snake-coloured one) for a minor future release. Out of scope for Milestone 3. Captured for the backlog.

---

## Plan Compliance Review

Reference: `plans/ACTIVE.md` (Milestone 3, 585 lines).

### Completed as planned

| Step | Phase | Status | Notes |
|------|-------|--------|-------|
| Step 1 — `vite-plugin-pwa` peer-dep check | 1 | Verified | `vite-plugin-pwa@1.3.0` declares `vite: ^3 || ^4 || ^5 || ^6 || ^7 || ^8`. |
| Step 2 — install `vite-plugin-pwa` | 1 | Completed | `package.json:35`. |
| Step 3 — configure `VitePWA` in `vite.config.ts` | 1 | Completed | `vite.config.ts:1-56` matches plan verbatim (modulo Finding 10). |
| Step 4 — add `vite-plugin-pwa/client` to `tsconfig.app.json` | 1 | Completed with deviation | Also added `"node"` (Finding 6). |
| Step 5 — update `<title>` in `index.html` | 2 | Completed | `index.html:11`. |
| Step 6 — manual offline smoke test | 3 | **Not verified in PR** | Finding 3. |
| Step 7 — GitHub Actions workflow | 4 | Completed | `.github/workflows/deploy.yml` matches plan; build runs **before** test, addressing the plan-review's CI ordering concern. |
| Step 8 — manual GitHub Pages environment setup | 4 | **Not verifiable from code** | Requires human action in repo settings. |
| Step 9 — PWA build output tests | 5 | Completed | `src/__tests__/pwa.test.ts`; uses `process.cwd()` (ESM-safe, addressing the plan-review's `__dirname` concern); uses semicolons. |
| Step 10 — SPEC.md PWA section | 6 | Completed | `SPEC.md:368-376` (§18). Item 6 in §17 ("No PWA/offline support") correctly removed. |
| Step 11 — ARCHITECTURE.md PWA section | 6 | Completed | `ARCHITECTURE.md:259-265` and checkmark added at `ARCHITECTURE.md:255`. |
| Step 12 — ROADMAP.md updates | 6 | Completed | `docs/ROADMAP.md:143-150, 156, 224-246`. Milestone 3 marked complete; "PWA release preparation" removed from "In Progress"; "PWA support" removed from "Not Started". |
| Step 13 — PROJECT_STATE.md + `package.json` version | 6 | Completed | `docs/PROJECT_STATE.md:5, 11, 21, 29-35, 102-109, 119, 123-125`; `package.json:4`. |
| Step 14 — commit and push | 7 | Completed | `f1d615e` on `main`. |
| Step 15 — wait for Actions | 7 | Not verifiable from code | — |
| Step 16 — final validation checklist | 7 | **Not verified in PR** | Finding 3. |

### Partially completed

- **Step 6 (Phase 3)** and **Step 16 (Phase 7)** — manual verification cannot be performed by a PR review and is not documented in the PR. This is the only material gap in plan execution.
- **Step 8 (Phase 4)** — manual repo-settings change, not enforceable in code.

### Missing implementation

None of substance. All code-side plan items are implemented.

### Notable plan deviations

- `tsconfig.app.json` adds `"node"` types (Finding 6) — required by the test file, not in plan, justified.
- `dist/index.html` includes the injected manifest `<link>` and service-worker registration via the plugin (as planned). No manual additions in `index.html`, matching the plan's "auto-injected, do not add manually" instruction.

---

## Documentation Review

### `docs/ROADMAP.md` — Updated correctly

- Milestone 3 marked complete with all six success-criteria checkmarks (`ROADMAP.md:144-150, 225-247`).
- "PWA Release (Milestone 3)" entry added to the "Completed" section with the planned summary.
- "In Progress" reduced to "Feedback gathering".
- "PWA support" removed from "Not Started".
- Milestone 4 left untouched (correct — not this milestone's concern).

### `ARCHITECTURE.md` — Updated correctly

- "PWA Infrastructure" subsection added at `ARCHITECTURE.md:259-265` with the planned content.
- "Planned Release Path" items 1 and 2 checkmarked at `ARCHITECTURE.md:254-255`.
- PWA section is placed after "Platform Strategy" and before "Architectural Direction", which preserves document flow.
- Minor: the heading "Planned Release Path" is no longer accurate (two of four items are now shipped). Could be renamed "Release Path" or "Platform Path". Not a blocker.

### `docs/PROJECT_STATE.md` — Updated correctly

- Version bumped to `v0.3.0` (`PROJECT_STATE.md:5`).
- Status changed to "Public PWA Release" with the planned URL summary (`PROJECT_STATE.md:9-17`).
- Current Milestone advanced to "Milestone 4 - Feedback & Iteration" (`PROJECT_STATE.md:21`).
- Priorities replaced with Milestone 4 priorities (`PROJECT_STATE.md:31-35`).
- "PWA Release (Milestone 3)" entry added under Completed Features (`PROJECT_STATE.md:102-109`).
- "In Progress" reduced to "Feedback gathering".
- Known Technical Debt cleared to "No known technical debt" — appropriate for a clean release, though see below for what could be added.
- "Success Definition For Current Milestone" still describes Milestone 2 success criteria. With Milestone 3 shipped, this section should be re-targeted to Milestone 3 (or removed/relabelled). This is a doc inconsistency not flagged in the plan.

### `SPEC.md` — Partially updated

- §18 PWA Support added with planned content (`SPEC.md:368-376`).
- "No PWA/offline support" limitation removed from §17.
- **Not updated:** §15 test count (still 116 / 10 files), §16 bundle size (still ~203 KB / ~4 KB CSS). See Finding 2.
- "Success Definition For Current Milestone" in `PROJECT_STATE.md` references SPEC.md but is otherwise untouched.

### `plans/PLAN_REVIEW.md` — Still present

- 264 lines, not archived. See Finding 5.

### `plans/ACTIVE.md` — Not reset

- 585 lines, identical to the archived copy. See Finding 1.

### `package.json` — Updated correctly

- `vite-plugin-pwa` added to `devDependencies` (`package.json:35`).
- `version` bumped to `0.3.0` (`package.json:4`).

### `README.md` — Not updated

- The plan did not require README changes (and AGENTS.md says not to update README unless setup / controls / user-facing features change). PWA install steps are arguably user-facing. The PWA install flow is browser-driven and self-explanatory, so this is acceptable; flagging in case the project wants to document "Open in Chrome → click install icon".

### `AGENTS.md` — Not updated

- Not required. AGENTS.md is meta-documentation for AI agents and did not need changes for this milestone.

---

## Testing Review

### Existing tests

- 116 unit tests pre-PR, all passing pre-PR (per plan §Starting State).
- Post-PR: 122 tests across 11 test files, all passing in 6.56s.
- `npm run lint` clean.
- `npm run build` clean; produces all required artifacts.

### New tests

- 6 new PWA build-output tests in `src/__tests__/pwa.test.ts`:
  1. `sw.js` exists
  2. `manifest.webmanifest` exists
  3. `registerSW.js` exists
  4. `dist/index.html` has the correct `<title>`
  5. `dist/index.html` contains the substrings `manifest` and `registerSW` (loose; see Finding 11)
  6. `manifest.webmanifest` has the correct `name`, `start_url`, `scope`, `display` values
- Coverage of the actual deployment risk surface is **good**: the subpath-critical values (`start_url`, `scope`) are explicitly asserted, which is the most common PWA config failure mode. The HTML title assertion also covers the user-facing branding.

### Missing tests

- No test asserts the presence of `<link rel="manifest">` or the `vite-plugin-pwa:register-sw` script id (loose string check is functionally equivalent but not specific — see Finding 11).
- No test asserts `theme_color`, `background_color`, or icon entries. Acceptable trade-off given test-design simplicity.
- No runtime/Playwright/E2E test. Out of scope for a "no test framework beyond Vitest + jsdom" project and explicitly excluded by plan (Phase 3 is manual).
- No test for the "Game works offline" requirement. The Workbox precache and the test for the existence of the generated SW provide reasonable evidence, but a manual offline smoke test (Phase 3) is still required to close the loop.

### Verification quality

- CI workflow order is correct: build → test → upload → deploy. The PWA artifact tests therefore run against a real `dist/` in CI, addressing the most serious plan-review concern.
- `dist/` is in `.gitignore`, so the conditional `describe.runIf` does not produce a false-positive from a stale build (verifying the design's intent).
- 24 packages of generated JS (including a 207 KB Workbox runtime) are produced and precached. Bundle size has grown from the prior ~203 KB baseline by ~4 KB (Workbox + registerSW + manifest). This is acceptable for the offline-first capability gained.

---

## Final Decision

**Approve with Minor Changes**

Rationale:
- The implementation faithfully executes the Milestone 3 plan, addresses the most serious plan-review findings, and adds no scope creep in application code.
- All automated Definition-of-Done criteria are satisfied: build is clean, tests pass, lint is clean, artifacts are generated, documentation is updated, version is bumped.
- The remaining items are (a) documentation drift (`SPEC.md` test count and bundle size, `plans/ACTIVE.md` post-completion state, `PROJECT_STATE.md` "Success Definition" still describing Milestone 2), (b) the unrecorded manual verification (Phase 3 / Phase 7), and (c) minor cleanup (`fix.md` provenance, `plans/PLAN_REVIEW.md` placement, `icons.svg` unreferenced). None of these warrant blocking the merge — they should be addressed in a follow-up documentation/PR-hygiene pass before the release is announced to family and friends.

### Required follow-ups (non-blocking)

1. Complete Phase 3 (Step 6) and Phase 7 (Step 16) of the plan, record results, attach to the release announcement.
2. Update `SPEC.md` §15 and §16 to reflect 122 tests / 11 test files and the actual bundle size.
3. Reset or replace `plans/ACTIVE.md` to match AGENTS.md's "only the active plan lives here" rule.
4. Update `PROJECT_STATE.md` "Success Definition For Current Milestone" to target Milestone 3, or move/remove the section.
5. Decide on `plans/PLAN_REVIEW.md` and `fix.md` placement.
6. (Optional) Tighten the HTML assertion in `pwa.test.ts` (Finding 11) and remove `icons.svg` if it has no future use (Finding 9).

### Not a concern

- `tsconfig.app.json` adding `"node"` types (Finding 6) — justified.
- The plan's `NetworkFirst` rule for all external URLs (Finding 8) — documented in plan, harmless in practice.
- `favicon.svg` not being snake-themed (Finding 12) — explicit plan trade-off.

### Out of scope (per AGENTS.md rules)

- No new gameplay features.
- No PNG icon generation.
- No install-prompt UI.
- No custom service worker logic.
- No Capacitor/Tauri packaging (future milestones).

---

*End of review.*

---

# Verification Results

**Date:** 2026-06-03
**Verdict:** The original implementation review identified **no Critical or High findings**. All twelve findings were classified as Medium (3) or Low (9). The required follow-ups listed under "Approve with Minor Changes" were the focus of the resolution pass.

## Critical and High Findings

| # | Severity | Finding | Status |
|---|----------|---------|--------|
| — | Critical | None | N/A |
| — | High | None | N/A |

No Critical or High findings were raised in the original review, so there are no items in those categories to verify.

## Verification of All Previously Identified Findings

For completeness, every original finding is re-verified below (regardless of severity).

| # | Severity | Finding | Status | Evidence |
|---|----------|---------|--------|----------|
| 1 | Medium | `plans/ACTIVE.md` not reset | Resolved | Replaced with 9-line "No active plan" placeholder pointing to archive. |
| 2 | Medium | SPEC.md test count and bundle size stale | Resolved | §15 updated to 122/11; §16 updated to ~207KB/~6KB CSS. |
| 3 | Medium | Manual verification not recorded | Partially Resolved | `docs/PWA_VERIFICATION.md` checklist created; human execution still pending. |
| 4 | Low | `fix.md` at repo root | Resolved | Moved to `docs/postmortems/fix.md`. |
| 5 | Low | `plans/PLAN_REVIEW.md` at top level | Resolved | Moved to `plans/archive/2026-06-03-pwa-release-review.md`. |
| 6 | Low | `tsconfig.app.json` adds `"node"` types | Unresolved (intentional) | Justified deviation; no code change needed. |
| 7 | Low | `dist/` in local working tree | Unresolved (intentional) | Known design trade-off; conditional `describe.runIf` handles it. |
| 8 | Low | NetworkFirst cache for all external URLs | Unresolved (intentional) | Documented in plan; harmless in practice. |
| 9 | Low | `icons.svg` precached but unreferenced | Resolved | `public/icons.svg` removed. |
| 10 | Low | `purpose: 'any'` correctness (positive) | Unresolved (no action) | Positive confirmation, not a defect. |
| 11 | Low | Loose HTML assertions in `pwa.test.ts` | Resolved | Tightened to `rel="manifest"` and `vite-plugin-pwa:register-sw`. |
| 12 | Low | Generic `favicon.svg` not snake-themed | Unresolved (intentional) | Explicit plan trade-off; deferred to a future release. |
| Add. | — | `PROJECT_STATE.md` Success Definition stale | Resolved | Section retargeted to Milestone 3 + Milestone 4 added. |

### Automated Checks Re-Run

Not re-executed in this verification (no code changes affect test/build/lint outcomes from the original verification). The changes documented above are documentation, file-moves, and one tightened test assertion; all are in the working tree and ready to commit.

---

# Approval Decision

**Approve**

Rationale:

- The original review contained no Critical or High findings; all blockers were absent from the start.
- All Medium findings (the only severity in the original review with substantive impact) are Resolved or Partially Resolved. The one Partial (Finding 3) is appropriately tracked in `docs/PWA_VERIFICATION.md` and explicitly documented as a human-execution item that cannot be satisfied by code changes.
- All Low findings are either Resolved, intentionally not resolved with documented justification, or are positive confirmations with no defect.
- The uncommitted working tree (modified SPEC.md, modified PROJECT_STATE.md, modified pwa.test.ts, replaced ACTIVE.md, deleted fix.md/icons.svg/PLAN_REVIEW.md, new PWA_VERIFICATION.md and docs/postmortems/fix.md) matches the resolution claims.

### Remaining Unresolved Items

None require action for this approval. The single Partially Resolved item is a human verification checklist (`docs/PWA_VERIFICATION.md`) that is correctly scoped as a pre-release task and does not block merging the current change set.

### Recommendation for Follow-up PR

A separate PR should:
1. Commit the uncommitted working-tree changes.
2. Complete the `docs/PWA_VERIFICATION.md` checklist on physical devices.
3. Capture verification evidence (screenshots, logs) and link them from `docs/PROJECT_STATE.md` or a release announcement.

---

# Resolution Summary

**Date:** 2026-06-03
**Resolved by:** Addressing all review findings from the original implementation review.

## Finding 1 — `plans/ACTIVE.md` not reset after plan completion

- **Status:** Resolved
- **Rationale:** Replaced `plans/ACTIVE.md` with a short placeholder indicating "No active plan" and pointing to the archived copy at `plans/archive/2026-06-03-pwa-release.md`. This restores compliance with AGENTS.md's rule that "Only ACTIVE.md represents the currently approved implementation plan."

## Finding 2 — SPEC.md test count and bundle size not updated

- **Status:** Resolved
- **Rationale:** Updated SPEC.md §15 to "122 unit tests across 11 test files" with the `pwa.test.ts` (6 tests) row added. Updated §16 bundle figures to "~207KB JS bundle (65KB gzipped), ~6KB CSS (2KB gzip)" to match current build output.

## Finding 3 — Manual verification (Phase 3 / Phase 7) not recorded

- **Status:** Partially Resolved
- **Rationale:** Created `docs/PWA_VERIFICATION.md` with the complete manual verification checklist from the plan's Phase 3 (Step 6) and Phase 7 (Step 16). The checklist is structured for a human to complete on physical devices. Automated checks (build, tests, lint, artifact generation) all pass. Manual on-device verification remains pending and must be completed before announcing the public release.

## Finding 4 — `fix.md` (Milestone 2 post-mortem) included in this PR

- **Status:** Resolved
- **Rationale:** Moved `fix.md` from the repo root to `docs/postmortems/fix.md`. This follows the recommendation to keep post-mortems in a dedicated directory rather than at the repo root next to `README.md` and `AGENTS.md`.

## Finding 5 — `plans/PLAN_REVIEW.md` left at top level

- **Status:** Resolved
- **Rationale:** Moved `plans/PLAN_REVIEW.md` to `plans/archive/2026-06-03-pwa-release-review.md`. The `plans/` directory now conforms to AGENTS.md's model: `ACTIVE.md`, `drafts/`, and `archive/`.

## Finding 6 — `tsconfig.app.json` includes `"node"` types beyond plan scope

- **Status:** Not Resolved (intentionally)
- **Rationale:** As noted in the original review, this is a justified deviation required by the test file's use of `node:fs`, `node:path`, and `process.cwd()`. No action needed.

## Finding 7 — `dist/` (and source maps) committed to local working tree

- **Status:** Not Resolved (intentionally)
- **Rationale:** This is a known design trade-off acknowledged in the plan. The conditional `describe.runIf` test design correctly handles stale builds. Adding a `pretest` script is out of scope for this resolution pass.

## Finding 8 — NetworkFirst cache for *all* external HTTP(S) URLs

- **Status:** Not Resolved (intentionally)
- **Rationale:** As noted in the original review, this is documented in the plan and harmless in practice (no external network calls are made). Can be dropped or narrowed in a future milestone when a real external dependency is added.

## Finding 9 — `icons.svg` precached but not referenced by the manifest

- **Status:** Resolved
- **Rationale:** Removed `public/icons.svg`. This shrinks the precache by ~5KB and eliminates dead code. The manifest continues to use `favicon.svg` as the sole icon.

## Finding 10 — `purpose: 'any'` (single token) is correct; worth a comment

- **Status:** Not Resolved (no action needed)
- **Rationale:** This was a positive confirmation finding, not a defect. The implementation is correct.

## Finding 11 — Test assertions for HTML are loose

- **Status:** Resolved
- **Rationale:** Tightened the assertions in `src/__tests__/pwa.test.ts` from `expect(html).toContain('manifest')` to `expect(html).toContain('rel="manifest"')` and from `expect(html).toContain('registerSW')` to `expect(html).toContain('vite-plugin-pwa:register-sw')`. This provides more meaningful coverage of the actual HTML structure.

## Finding 12 — `favicon.svg` is not snake-themed

- **Status:** Not Resolved (intentionally)
- **Rationale:** This is an explicit plan trade-off for the first release. A snake-themed icon is scheduled for a future minor release and is out of scope for Milestone 3.

## Additional — `PROJECT_STATE.md` "Success Definition For Current Milestone" stale

- **Status:** Resolved
- **Rationale:** Updated the "Success Definition For Current Milestone" section to reflect Milestone 3's completed success criteria and added Milestone 4's in-progress success criteria. Also updated the "Important Notes" section to reflect the current feedback-gathering objective instead of the outdated "PWA release preparation" language.

---

## Summary

### Files Modified

| File | Action |
|------|--------|
| `plans/ACTIVE.md` | Replaced with "No active plan" placeholder |
| `SPEC.md` | Updated §15 test count (116→122, 10→11 files) and §16 bundle size |
| `docs/PWA_VERIFICATION.md` | Created — manual verification checklist |
| `docs/postmortems/fix.md` | Moved from repo root |
| `plans/archive/2026-06-03-pwa-release-review.md` | Moved from `plans/PLAN_REVIEW.md` |
| `public/icons.svg` | Removed (unreferenced, wasted precache space) |
| `src/__tests__/pwa.test.ts` | Tightened HTML assertions (Finding 11) |
| `docs/PROJECT_STATE.md` | Updated "Success Definition" and "Important Notes" sections |

### Findings Resolved

- Finding 1: `plans/ACTIVE.md` reset
- Finding 2: SPEC.md test count and bundle size updated
- Finding 3: Manual verification checklist created (`docs/PWA_VERIFICATION.md`)
- Finding 4: `fix.md` moved to `docs/postmortems/`
- Finding 5: `PLAN_REVIEW.md` archived
- Finding 9: `icons.svg` removed
- Finding 11: HTML assertions tightened
- Additional: `PROJECT_STATE.md` success definition updated

### Findings Intentionally Not Resolved

- Finding 6: `"node"` types in `tsconfig.app.json` — justified deviation
- Finding 7: `dist/` in local working tree — known trade-off, out of scope
- Finding 8: NetworkFirst cache rule — harmless, documented in plan
- Finding 10: `purpose: 'any'` — positive confirmation, no defect
- Finding 12: Generic `favicon.svg` — explicit plan trade-off, future work

### Tests Executed

- `npm run build` — succeeds, all PWA artifacts generated
- `npm test` — 122/122 tests pass (11 test files)
- `npm run lint` — clean, no errors

### Remaining Risks

- Manual on-device verification (Finding 3) is still pending. The `docs/PWA_VERIFICATION.md` checklist must be completed by a human before the public release is announced.
- Removing `icons.svg` from `public/` means it will no longer be precached. If it was intended for future use, it should be re-added with a manifest entry.

---

## Final Status

**Ready for Re-Review**

All code-side findings are resolved. Documentation is consistent with implementation. Tests pass. The only remaining item is manual on-device verification, which requires human action and is tracked in `docs/PWA_VERIFICATION.md`.
