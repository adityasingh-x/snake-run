# Plan Review — Milestone 3 PWA Release

**Reviewer:** Staff Engineer level review
**Subject:** `plans/ACTIVE.md` (Milestone 3 — PWA Release Implementation Plan)
**Date:** 2026-06-03
**Status:** Review complete

---

# Overall Assessment

The plan is well-structured, internally consistent, and clearly written. It is well aligned with the project's documented direction (PWA as the first public release path), uses a sensible, well-known library, and stays within the Milestone 3 scope set by `docs/ROADMAP.md`. The explicit "Out of Scope" list, risk table, and verification steps indicate mature planning. The `vite-plugin-pwa@1.3.0` peer dependency range (Vite `^3.1.0 || ... || ^8.0.0`) confirms the highest-priority risk has been pre-validated.

However, the plan has two issues that would block another AI agent from completing the work without additional interpretation: an ESM-incompatible `__dirname` reference in the proposed test code, and a CI sequencing problem that makes the new PWA artifact tests silently skip during the GitHub Actions run. Several smaller issues (style inconsistency, ambiguous manifest icon purpose, manual step ordering) reduce the plan's handoff quality.

## Strengths

- **Clear scope discipline.** The "Out of Scope" list (PNG icons, install prompt UI, custom SW logic, analytics, custom domain, Capacitor/Tauri) faithfully matches the Milestone 3 success criteria in `docs/ROADMAP.md` and avoids pulling in Milestone 4–7 work.
- **Library choice is appropriate.** `vite-plugin-pwa` is the canonical Vite PWA solution. The peer-dep check step is the right first move and pre-empts the largest known blocker.
- **Verification-first structure.** Almost every step has an explicit verification command, matching the AGENTS.md verification ladder (lint → typecheck → build → test).
- **Test count and starting state are accurate.** Verified: 10 test files, 116 tests passing on `main`.
- **Git workflow protocol acknowledged** in the Definition of Done (ROADMAP and PROJECT_STATE updates are listed as required).
- **Leverages existing PWA meta tags** in `index.html` rather than rewriting them, which is the right surgical approach.
- **Manifest `scope` and `start_url` correctly use `/snake-run/`** for the GitHub Pages project-page base path.

## Weaknesses

- **Test code is not ESM-compatible.** The proposed test file uses `__dirname`, but `package.json` has `"type": "module"`, so `__dirname` is `undefined` and the file will throw a `ReferenceError` at module evaluation.
- **CI workflow runs `npm test` before `npm run build`.** The new PWA tests are conditional on `dist/` existing, so in CI they will silently skip and the build artifacts will not be verified by the pipeline.
- **Test file location violates the existing convention.** Existing tests live in co-located `__tests__/` subfolders (e.g. `src/game/__tests__/state.test.ts`). The plan creates a new top-level `src/__tests__/` directory just for this one test file, breaking the established pattern.
- **Style mismatch in the test code** (no semicolons). All existing tests in this repo end statements with `;`.
- **PWA icon is a generic purple lightning bolt**, not snake-themed. Using it as the installable icon will look incongruous for a "Snake Run" PWA. The plan acknowledges "iOS falls back to a screenshot" but does not address the desktop/Android icon, which the SVG will be used for.
- **`purpose: 'any maskable'` is not a valid combo.** The manifest spec expects `purpose` to be a space-separated list of individual tokens (`any`, `maskable`, `monochrome`). The current value parses as a single token `any maskable`, which most browsers will not interpret as the author intended. If maskable is desired, the icon should additionally be cropped to a safe zone, which an SVG cannot guarantee.
- **YAML validation step requires Python + PyYAML** (`python3 -c "import sys,yaml; ..."`). PyYAML is not a system dependency on most macOS setups, and the project has no `engines` declaration that would justify this. A simpler `node`/`npx`-based check (or no pre-check at all) is more portable.
- **No mention of creating the `github-pages` deployment environment.** The workflow references `environment: name: github-pages`, which requires the environment to be created in repo settings before the first deploy. The manual setup step (Step 8) does not mention this prerequisite.
- **`manifest.description` hardcodes "10 levels"** while the level count is configurable via `VITE_LEVEL_COUNT`. This creates a minor drift risk.
- **`package.json` `version` is not bumped.** PROJECT_STATE.md is bumped to `v0.3.0`, but `package.json` stays at `0.0.0`. Not a blocker (the deployed PWA does not surface this), but inconsistent.
- **Risk #4 mitigation is vague.** "If broken, handle `appinstalled` event" is not a concrete step.
- **The plan does not explicitly add the PWA-built `manifest.webmanifest` to the verification list** beyond a file existence check — it never asserts that the manifest contains the expected `name`, `start_url`, `scope`, or `display` values, which is the actual risk surface for a misconfigured subpath deploy.

## Major Risks

1. **ESM test code bug (will fail to run).** `__dirname` in a `"type": "module"` project is a `ReferenceError`. The test file as written will not execute. Likelihood: certain. Impact: blocks CI. Already noted under Critical findings.
2. **CI does not actually verify PWA artifacts.** Because `npm test` runs before `npm run build` in the workflow, the conditional PWA tests always skip in CI. The plan's stated verification (that `dist/` contains `sw.js`, `manifest.webmanifest`, `registerSW.js`) is therefore a local-only check. Likelihood: certain. Impact: a build-config regression (e.g. someone removes `VitePWA` from `plugins`) would not be caught by CI.
3. **Vite 8 / `vite-plugin-pwa` peer compatibility.** Mitigated by Step 1, and confirmed independently: `vite-plugin-pwa@1.3.0` declares `vite: ^3.1.0 || ^4.0.0 || ^5.0.0 || ^6.0.0 || ^7.0.0 || ^8.0.0`. Risk is essentially closed. Worth keeping in the plan for transparency.
4. **GitHub Pages `github-pages` environment prerequisite.** First deploy will fail if the environment is not pre-created in repo settings. The plan's manual step (Step 8) does not mention this.
5. **iOS screenshot fallback is a brand issue, not just a polish issue.** When installed on iOS without an `apple-touch-icon`, the home-screen icon is a literal screenshot of the running app. For a public release targeting family and friends, this is more visible than the plan implies.
6. **TypeScript 6.0 is brand-new.** The plan depends on `vite-plugin-pwa/client` types. If the plugin's d.ts files have not been validated against TypeScript 6.0, a future TypeScript bump could expose issues. The plan does not pin a TS version or note this as a forward risk.

## Recommended Changes

In rough order of priority:

1. **Fix the proposed test file to be ESM-safe** (use `import.meta.url` + `fileURLToPath`, or `process.cwd()`). This is mandatory.
2. **Reorder the CI workflow** so that `npm run build` runs before `npm test` (or add a separate "verify-build" job that runs `npm run build` then runs the PWA tests as a post-build smoke). Without this, the PWA artifact tests do no work in CI.
3. **Place the PWA test in a co-located location** that matches the existing convention (e.g. `src/__tests__/pwa.test.ts` is acceptable if paired with a justification, but a more consistent choice is to colocate it with build-related code, or simply move it next to a relevant module). At minimum, the plan should explicitly justify creating a new top-level test directory.
4. **Add semicolons** to the proposed test file to match the repository style.
5. **Split the manifest icon purpose** into two array entries: one for `purpose: 'any'` and one (only if a properly-safe-zoned icon is provided) for `purpose: 'maskable'`. For a single SVG, use only `purpose: 'any'`.
6. **Add a manual-setup note** to Step 8 to create the `github-pages` environment in repo settings before the first workflow run.
7. **Replace the Python+PyYAML YAML validator** with a portable alternative, or remove the step (the GitHub Actions UI will show a clear error on invalid YAML anyway).
8. **Optionally improve the PWA artifact test** to assert manifest contents (`name`, `start_url`, `scope`, `display`, `theme_color`) in addition to file existence.
9. **Optional: bump `package.json` version** to `0.3.0` for consistency with PROJECT_STATE.md, and consider exposing it in the PWA manifest.
10. **Optional: replace or supplement the favicon** with a snake-themed SVG before first public release.

---

# Detailed Findings

## Finding 1 — ESM-incompatible `__dirname` in proposed PWA test

- **Severity:** Critical
- **Description:** The proposed test file at `src/__tests__/pwa.test.ts` (Step 9) uses `__dirname`:
  ```ts
  const distDir = resolve(__dirname, '../../dist')
  ```
  `package.json` declares `"type": "module"`, so `__dirname` is `undefined` in any `.ts` file. This will throw `ReferenceError: __dirname is not defined` at module evaluation, preventing the new test file from loading. The existing codebase has no `__dirname` usage (verified by grep across `src/`), confirming the project is consistently ESM-native.
- **Recommendation:** Replace with one of:
  ```ts
  import { fileURLToPath } from 'node:url'
  const here = fileURLToPath(new URL('.', import.meta.url))
  const distDir = resolve(here, '../../dist')
  ```
  or simply:
  ```ts
  const distDir = resolve(process.cwd(), 'dist')
  ```
  The `process.cwd()` variant is the simplest and is correct because Vitest runs tests from the project root.

## Finding 2 — CI workflow runs `npm test` before `npm run build`, silently skipping PWA artifact tests

- **Severity:** High
- **Description:** The workflow in Step 7 runs `npm test` before `npm run build`. The PWA tests use `describe.runIf(existsSync(distDir))(...)`, which means they will skip in CI because `dist/` is created by `npm run build`, which has not run yet. As a result, the plan's stated verification ("`dist/` contains `sw.js`, `manifest.webmanifest`, and `registerSW.js`") is not enforced by CI; it is only verified locally by the human implementer.
- **Recommendation:** Reorder the workflow so that build precedes tests:
  ```yaml
  - name: Build
    run: npm run build
  - name: Run tests
    run: npm test
  ```
  This makes the PWA artifact tests meaningful in CI. Tradeoff: tests now depend on the build step succeeding; this is acceptable because the build is fast and is already a gating artifact (it produces the Pages upload).

## Finding 3 — PWA test file location is inconsistent with the existing test convention

- **Severity:** Medium
- **Description:** Existing tests are co-located with their source under `__tests__/` subdirectories (`src/game/__tests__/`, `src/components/__tests__/`, `src/utils/__tests__/`, `src/platform/__tests__/`, `src/hooks/__tests__/`). The plan places the new test at `src/__tests__/pwa.test.ts`, which is a brand-new top-level location that breaks the established pattern for a single test file. AGENTS.md explicitly calls for respecting local style and avoiding premature abstractions.
- **Recommendation:** Either (a) move the test to a co-located location that is conceptually tied to existing modules — there is no obvious owner, so the simpler choice is (b) keep the new top-level location but explicitly document that this is a one-off directory for build-output tests that have no natural source-code owner, and consider naming it `build/` or `e2e/` to make the intent clear. If the team prefers a flat test root, this should be established as a project convention with a short note in ARCHITECTURE.md.

## Finding 4 — Proposed test code uses no semicolons; repository convention uses semicolons

- **Severity:** Low
- **Description:** Every existing test file in this repo ends statements with `;` (verified across `src/game/__tests__/state.test.ts`, `src/platform/__tests__/touch.test.ts`, etc.). The plan's proposed test code omits semicolons.
- **Recommendation:** Add semicolons to match local style. If the project also runs a linter/formatter that enforces this, ESLint will fail on the new file under `no-semi`-style rules, but the existing `eslint` config in this repo (ESLint 10 + `typescript-eslint` 8) should be checked for an explicit semicolon rule before assuming the failure mode.

## Finding 5 — Manifest `purpose: 'any maskable'` is not a valid combination

- **Severity:** Medium
- **Description:** The web app manifest spec defines `purpose` as a space-separated list of tokens from `{ "any", "maskable", "monochrome" }`. Writing `purpose: 'any maskable'` as a single token is technically non-conformant and is not guaranteed to be interpreted as the author intends. Even if a browser tolerates it, an SVG with arbitrary content is not actually safe-zoned for maskable use; the icon would be cropped to a circle on Android and could clip the artwork.
- **Recommendation:** Use a single icon entry with `purpose: 'any'`. If a maskable variant is desired later, add a second icon entry that points to a separate, safe-zoned asset. Do not claim maskable for an arbitrary SVG.

## Finding 6 — PWA icon is not snake-themed

- **Severity:** Low (cosmetic / brand)
- **Description:** `public/favicon.svg` is a stylized purple lightning bolt (appears to be the Vite logo style). Using it as the installable icon for "Snake Run" will be incongruous on Android home screens, Windows taskbars, and macOS Dock. The plan acknowledges the iOS screenshot fallback but does not address the fact that the SVG is the only icon used on every other installable surface.
- **Recommendation:** For a public release targeting family and friends, ship a snake-themed icon (a single small SVG, hand-edited, is sufficient for v1). The "no PNG generation" simplification is still valid — the SVG can be used directly as the manifest icon.

## Finding 7 — Manual setup step does not include creating the `github-pages` environment

- **Severity:** Medium
- **Description:** The workflow declares `environment: name: github-pages`. On a fresh repo, this environment does not exist. The first workflow run will fail with `Environment not found` (or be silently routed to the default environment if the repo has no protection rules). The plan's manual Step 8 does not mention creating this environment in repo settings → Environments.
- **Recommendation:** Add a sub-step to Step 8: in repo settings → Environments, create an environment named `github-pages`. (For a public PWA with no required reviewers, no further configuration is needed.)

## Finding 8 — YAML validation step relies on a non-portable Python+PyYAML dependency

- **Severity:** Low
- **Description:** Step 7's verification step runs `python3 -c "import sys,yaml; yaml.safe_load(...)"`. PyYAML is not installed by default on a macOS Python 3 install and is not declared in the project's dev dependencies. The verification will fail with `ModuleNotFoundError` on most dev machines, which may be mistaken for a YAML error.
- **Recommendation:** Replace with one of:
  - Run `npx --yes js-yaml .github/workflows/deploy.yml` (requires network at verification time).
  - Trust the GitHub Actions UI to surface YAML errors.
  - Or simply omit this step and rely on the workflow's own parser.

## Finding 9 — `manifest.description` hardcodes the level count

- **Severity:** Low
- **Description:** The manifest `description` is `"A classic snake game. Eat food, avoid obstacles, complete 10 levels!"` while the level count is configurable via `VITE_LEVEL_COUNT` (per `src/game/constants.ts` and SPEC §13). If the level count is ever changed, the manifest description will silently drift.
- **Recommendation:** Either rephrase the description to avoid mentioning the level count ("Eat food, avoid obstacles, and complete every level!") or read the value from the same env var when generating the manifest. For a v1 release, the rephrase is the lower-risk fix.

## Finding 10 — Risk #4 mitigation is vague

- **Severity:** Low
- **Description:** The plan's risk table for "Sound doesn't work in installed PWA" lists the mitigation as "If broken, handle `appinstalled` event." This is not an actionable step. There is no fallback path defined and no test or verification for the actual behavior.
- **Recommendation:** Either remove the risk from the table (since the audio path is already triggered from user gestures on the main thread and works in production today, per SPEC §9) or define a concrete mitigation: e.g., "If `AudioContext.state === 'suspended'` after `appinstalled`, call `initAudio()` from a resume/pause toggle." For v1, removing the risk is acceptable given the current behavior.

## Finding 11 — PWA artifact tests do not assert manifest content, only file existence

- **Severity:** Low
- **Description:** Step 9's tests verify that `sw.js`, `manifest.webmanifest`, and `registerSW.js` exist, and that `index.html` contains the strings `manifest` and `registerSW`. They do not verify that the manifest itself is well-formed or that the subpath is correct. The actual deployment-correctness surface (manifest `start_url`, `scope`, `display`, `theme_color`) is uncovered.
- **Recommendation:** Add 1–2 assertions that read and parse `dist/manifest.webmanifest` and check the critical subpath values. Combined with Finding 2's CI reorder, this gives meaningful coverage.

## Finding 12 — `package.json` version not bumped

- **Severity:** Low
- **Description:** The plan bumps `docs/PROJECT_STATE.md` to `v0.3.0` (Step 13) but does not touch `package.json`, which is currently at `0.0.0`. The deployed PWA does not surface the `package.json` version today, so this is a documentation consistency issue rather than a runtime issue.
- **Recommendation:** Bump `package.json` to `0.3.0` as part of Step 13, or explicitly note that the project does not surface the package version externally. This is a small consistency win and matches the version-bump language used in `PROJECT_STATE.md`.

## Finding 13 — Manual GitHub Pages configuration step is not actually done by the plan

- **Severity:** Low (operational)
- **Description:** Step 8 is a manual step that requires repo admin access. The plan does not include a verification path for a fully unattended agent. For a hand-off, this should be explicit: which settings page, which dropdown, what to confirm visually.
- **Recommendation:** The current step is sufficient. No change required, but flag this as a hand-off requirement when executing.

## Finding 14 — `v0.3.0` is asserted in the plan but not yet in the codebase

- **Severity:** Low (consistency)
- **Description:** The "Starting State" claims `v0.2.0` (in `PROJECT_STATE.md` line 5). The plan's Step 13 bumps to `v0.3.0`. The current `package.json` says `0.0.0`. This is a pre-existing inconsistency between `PROJECT_STATE.md` and `package.json` and is not introduced by the plan. Worth noting because the plan's version-bump target is a continuation of the existing inconsistency rather than a clean reset.
- **Recommendation:** When bumping, also align `package.json` (see Finding 12). No change strictly required by this plan.

## Finding 15 — Plan does not address the `engines` field

- **Severity:** Low
- **Description:** The CI workflow hardcodes `node-version: '22'`, but `package.json` has no `engines` field. If a contributor uses a different Node version locally, the plan does not surface the expected version. This is a minor operability concern.
- **Recommendation:** No change required. The Node 22 pin in the workflow is sufficient for CI; local development is at the contributor's discretion.

## Finding 16 — PWA tests depend on `dist/` being uncommitted

- **Severity:** Low
- **Description:** `.gitignore` correctly excludes `dist/`, so the PWA tests are safe from being masked by a stale committed build. The plan does not call this out, but it is an implicit dependency. Worth a one-line mention in the plan.
- **Recommendation:** Optional. Add a sentence in Step 9 noting that `.gitignore` excludes `dist/`, so the conditional test pattern is safe.

## Finding 17 — Manifest `start_url` does not include `?source=pwa` query param

- **Severity:** Low (analytics / future)
- **Description:** The plan does not add a `?source=pwa` (or similar) query to the manifest `start_url`. This is a common pattern to attribute traffic to the installed PWA. For v1 with no analytics, this is unnecessary; mentioning it as a future improvement is sufficient.
- **Recommendation:** No change. Note in `docs/IDEAS_BACKLOG.md` if desired.

## Finding 18 — Concurrency group `pages` is correct, but the plan does not explain it

- **Severity:** Low
- **Description:** The workflow uses `concurrency: group: pages, cancel-in-progress: true`. This is the GitHub-recommended pattern for Pages deploys, but the plan does not justify it. For a handoff document, a one-line note is helpful.
- **Recommendation:** Add a one-line comment in the YAML or in the plan explaining that this prevents overlapping deploys from racing.

---

# Handoff Assessment

## Phase structure

The seven-phase structure (infrastructure → HTML polish → offline verify → deploy → tests → docs → push/validate) is logical. The dependency edges drawn in "Execution Order" are correct. Phases 1 and 2 are correctly serialized; Phases 3–6 are correctly parallelizable. The final Phase 7 cleanly depends on the rest.

One minor improvement: the "Execution Order" section says Phases 3–6 "can run in parallel after Phase 1-2 are complete." Phase 5 (tests) is conditional on `dist/` existing. While the tests are designed to skip gracefully, in practice the implementer will need to run `npm run build` between Phase 1 and Phase 5 for the tests to exercise anything. This is implicit; an explicit "Phase 5 requires a prior `npm run build`" note would tighten the handoff.

## Task decomposition

Tasks are well-decomposed and each step is small enough to execute independently. The 16 numbered steps map cleanly to the 7 phases. The granularity is appropriate for AI-agent execution.

Two steps could be split further for clarity:
- Step 7 mixes "create the workflow file" and "YAML-validate it." Splitting into Step 7a (write) and Step 7b (verify) would make the verification more obvious.
- Step 13 mixes several documentation updates under PROJECT_STATE.md. Splitting version bump, status update, and completed-feature additions into sub-steps would make rollback easier.

## Verification strategy

The plan's verification strategy has a significant gap: the CI workflow does not actually verify the PWA artifacts. The plan treats the local "npm run build + npm test" sequence as the verification path, but the CI workflow's job order makes the artifact tests skip silently. After Finding 2 is fixed (build before test), the verification strategy is sound.

The manual offline smoke test (Step 6) is appropriate for an AI agent to perform locally; the manual `npm run preview` + DevTools workflow is well documented.

## Definition of Done

The Milestone-level Definition of Done is comprehensive. It covers build, tests, lint, deployment, manual install verification, sound, high-score persistence, and documentation updates. The 14 checkboxes map cleanly to the steps.

One omission: there is no "GitHub Pages is configured to use GitHub Actions as the source" line, but the manual Step 8 covers this implicitly. Adding it to the DoD would make the contract more explicit.

## AI-agent execution readiness

The plan is largely AI-agent-ready, with the following caveats:

1. **Critical:** The proposed test code will not run as written (Finding 1). An agent following the plan literally will hit a `ReferenceError` on first test run.
2. **High:** The CI workflow will silently skip the new PWA tests, giving a false sense of coverage (Finding 2).
3. **Medium:** The agent must make a style judgment about the test file location (Finding 3) and about semicolons (Finding 4). The plan should make these decisions instead of leaving them to the agent.
4. **Low:** The manual Step 8 (GitHub Pages settings) is a hand-off requirement. If the agent does not have admin access, the plan must explicitly state that a human must complete this step.

After addressing Findings 1, 2, 3, and 4, the plan is ready for AI-agent execution with minimal ambiguity.

---

# Final Recommendation

**Approve with Major Changes**

The plan is on the right track and aligned with the project's stated direction. It is well organized and most of the work is correct. However, the proposed test file has a blocking ESM bug (Finding 1, Critical) and the CI workflow will silently skip the new tests (Finding 2, High). Both issues are mechanical to fix, but they are exactly the class of issue that would cause another AI agent to fail silently — which is the most expensive failure mode for a handoff plan.

**Required before approval:**

1. Fix the ESM incompatibility in the proposed test code (Finding 1).
2. Reorder the CI workflow so the build runs before tests (Finding 2).
3. Resolve the test file location inconsistency (Finding 3) and style mismatch (Finding 4).

**Recommended (not blocking):**

4. Split the manifest `purpose` (Finding 5) and consider replacing the icon (Finding 6).
5. Add the `github-pages` environment setup to the manual step (Finding 7).
6. Replace the Python YAML validator (Finding 8).
7. Add manifest content assertions to the PWA tests (Finding 11).
8. Bump `package.json` version alongside `PROJECT_STATE.md` (Findings 12, 14).

Once the three required changes are made, the plan can be re-approved at the "Approve with Minor Changes" level. The plan's overall design — small steps, explicit verification, clear scope, no over-engineering — matches the project's stated philosophy in `AGENTS.md` and is the right shape for this milestone.
