# Milestone 3 — PWA Release: Implementation Plan

**Status:** Ready for implementation  
**Date:** 2026-06-03

---

## Goal

Transform Snake Run into a Progressive Web App that can be shared via URL, installed on home screens, and played offline.

### Success Criteria (from ROADMAP.md)

- Shareable URL
- Installable on phones
- Installable on desktops
- Playable offline

### Starting State

- 116 unit tests passing
- Vite 8, React 19, TypeScript 6
- `index.html` has PWA-leaning meta tags (`theme-color`, `apple-mobile-web-app-capable`, `mobile-web-app-capable`, `viewport-fit=cover`)
- No service worker, no web manifest, no PWA icons, no deployment pipeline
- Repo: `github.com/adityasingh-x/snake-run` (project page, not user page)
- No `.github/` directory exists yet

---

## Plan Philosophy

- **Leverage existing work.** The `index.html` already has several PWA meta tags. Build on them rather than replacing them.
- **Use a well-known library.** `vite-plugin-pwa` handles service worker generation, manifest injection, and asset pre-caching. No hand-rolled service worker.
- **Ship the simplest thing.** Skip PNG icon generation for the first release — use the existing `favicon.svg` as the PWA icon. iOS will use a screenshot fallback; this is acceptable for a first public release targeting family and friends.
- **Automated deployment.** GitHub Pages via GitHub Actions so every push to `main` deploys.

---

## Out of Scope

- Custom offline page or "you're offline" UI
- App install prompts or "Add to Home Screen" banners
- Custom service worker logic beyond what `vite-plugin-pwa` provides
- PNG icon generation (SVG-only for first release)
- Lighthouse score optimization beyond what the default config provides
- Analytics, error tracking, or monitoring
- Custom domain setup
- `manifest.json` hand-editing (the plugin generates `manifest.webmanifest` automatically)
- Capacitor or Tauri packaging (future milestones)

---

## Assumptions

1. `vite-plugin-pwa` is compatible with Vite 8. **If not,** Phase 1 escalates to the user.
2. GitHub Pages is the deployment target. The repo `adityasingh-x/snake-run` is hosted on GitHub.
3. The repo is a **project page** (URL: `https://adityasingh-x.github.io/snake-run/`), so the Vite `base` must be `/snake-run/`.
4. The existing `favicon.svg` is visually acceptable as the PWA icon.
5. HTTPS is handled automatically by GitHub Pages.
6. No custom domain will be wired up (the `.github.io` subdomain is sufficient).

---

## Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| `vite-plugin-pwa` incompatible with Vite 8 | Medium | Blocker | Check peer deps in Phase 1 Step 1. If incompatible, escalate to user. |
| GitHub Pages base path breaks asset loading | Medium | High | Set `base: '/snake-run/'` in `vite.config.ts`. Verify with `npm run preview` before deploying. |
| iOS Safari shows a screenshot instead of a proper icon | Medium | Low | iOS uses a screenshot when no `apple-touch-icon` is set. Acceptable for first release. Add PNG icons later if needed. |
| Sound doesn't work in installed PWA | Low | Medium | AudioContext is already created on user gesture. If broken after install, add a click/tap handler on `appinstalled` event that calls `audioContext.resume()`. |
| Service worker caches stale content during development | Low | Low | Dev server (`npm run dev`) does not register the service worker. Only `npm run build` + `npm run preview` enables it. |

---

## Definition of Done (Milestone-Level)

- [ ] `npm run build` completes with no errors
- [ ] `npm test` — all existing 116+ tests pass; new PWA build-output tests pass
- [ ] `npm run lint` — no new lint errors
- [ ] `dist/` contains `sw.js`, `manifest.webmanifest`, and `registerSW.js`
- [ ] `dist/index.html` contains the manifest `<link>`, service worker registration, and correct `<title>`
- [ ] GitHub Pages is configured to use GitHub Actions as the source
- [ ] GitHub Pages is live at `https://adityasingh-x.github.io/snake-run/`
- [ ] Game loads and plays at the deployed URL
- [ ] Chrome/Edge shows the "Install" icon in the address bar
- [ ] Game works fully offline (start, play, score, game over, restart)
- [ ] Installed PWA opens in standalone mode (no browser chrome)
- [ ] Sound works in both browser and installed PWA
- [ ] High score persists correctly in installed PWA
- [ ] `SPEC.md` updated with PWA section
- [ ] `ARCHITECTURE.md` updated with PWA infrastructure
- [ ] `docs/ROADMAP.md` updated — Milestone 3 moved to Completed
- [ ] `docs/PROJECT_STATE.md` updated — version bumped, status updated

---

## Phase 1 — PWA Build Infrastructure

Goal: Add `vite-plugin-pwa` and configure it to generate a service worker, web manifest, and registration script.

### Step 1: Verify `vite-plugin-pwa` compatibility

```bash
npm info vite-plugin-pwa peerDependencies
npm info vite-plugin-pwa version
```

Confirm that Vite 8 is listed as an acceptable peer dependency. If not, **escalate to the user.** Do not use `--legacy-peer-deps`.

**Verification:** The command output shows Vite 8 in the peer dependency range.

### Step 2: Install `vite-plugin-pwa`

```bash
npm install -D vite-plugin-pwa
```

**Verification:** `package.json` `devDependencies` includes `vite-plugin-pwa`.

### Step 3: Configure `vite-plugin-pwa` in `vite.config.ts`

**File:** `vite.config.ts`

Add the plugin to the `plugins` array with manifest and Workbox configuration:

- `registerType: 'autoUpdate'` — service worker updates silently (game state is ephemeral)
- `display: 'standalone'` — native app feel, no browser chrome
- `orientation: 'any'` — already supports portrait and landscape
- `base: '/snake-run/'` — required for GitHub Pages project page
- Workbox pre-caches all static assets (`**/*.{js,css,html,svg,png}`)
- External resources use `NetworkFirst` with 24-hour cache
- Use `favicon.svg` as the sole icon (SVG format, `purpose: 'any'`)

```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  base: '/snake-run/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg'],
      manifest: {
        name: 'Snake Run',
        short_name: 'Snake Run',
        description: 'A classic snake game. Eat food, avoid obstacles, and complete every level!',
        theme_color: '#16213e',
        background_color: '#1a1a2e',
        display: 'standalone',
        orientation: 'any',
        scope: '/snake-run/',
        start_url: '/snake-run/',
        icons: [
          {
            src: 'favicon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png}'],
        runtimeCaching: [
          {
            urlPattern: /^https?:\/\/.*/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'external-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24,
              },
            },
          },
        ],
      },
    }),
  ],
  build: {
    sourcemap: true,
  },
  preview: {
    host: true,
  },
})
```

**Verification:** `npm run build` succeeds. `dist/` contains `sw.js`, `manifest.webmanifest`, and `registerSW.js`.

### Step 4: Add TypeScript types for `vite-plugin-pwa`

**File:** `tsconfig.app.json`

Add `"vite-plugin-pwa/client"` to `compilerOptions.types`:

```json
"types": ["vite/client", "vite-plugin-pwa/client"]
```

**Verification:** `npm run build` succeeds with no new TypeScript errors.

---

## Phase 2 — HTML PWA Enhancements

Goal: Ensure `index.html` has all required PWA meta tags and a proper title.

### Step 5: Update `<title>` in `index.html`

**File:** `index.html`

Change the `<title>` from `snake-run` to `Snake Run`:

```html
<title>Snake Run</title>
```

The existing meta tags are already sufficient:
- `apple-mobile-web-app-capable` — iOS standalone mode
- `apple-mobile-web-app-status-bar-style` — translucent status bar
- `mobile-web-app-capable` — legacy Android
- `theme-color` — toolbar/status bar color
- `viewport-fit=cover` — full-screen on notched devices

The manifest `<link>` and service worker registration script are **auto-injected** by `vite-plugin-pwa`. Do not add them manually.

**Verification:** `npm run build` succeeds. Inspect `dist/index.html` — it contains:
- `<title>Snake Run</title>`
- `<link rel="manifest" ...>`
- Service worker registration script

---

## Phase 3 — Offline Verification

Goal: Confirm the PWA works offline.

### Step 6: Manual offline smoke test

```bash
npm run build && npm run preview
```

1. Open `http://localhost:4173/snake-run/` in Chrome
2. Open DevTools → Application → Service Workers
3. Confirm the service worker is **activated**
4. Check "Offline" in DevTools → Network tab
5. Refresh the page — the game loads fully
6. Start a game, eat food, trigger game over — all works offline
7. Verify sound still works offline

**Verification:** The game loads and plays entirely without a network connection.

---

## Phase 4 — Deployment Pipeline

Goal: Auto-deploy on every push to `main` via GitHub Actions to GitHub Pages.

### Step 7: Create GitHub Actions workflow

**File:** `.github/workflows/deploy.yml`

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: true # Prevents overlapping deploys from racing

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build
        run: npm run build

      - name: Run tests
        run: npm test

      - name: Setup Pages
        uses: actions/configure-pages@v5

      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: dist

      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

**Verification:** The CI workflow must be verified after pushing to `main` (Phase 7). Until then, confirm the YAML is syntactically valid by visiting the Actions tab after the first push, or use:

```bash
npx --yes js-yaml .github/workflows/deploy.yml > /dev/null && echo 'YAML valid'
```

### Step 8: Configure GitHub Pages in repository settings

**Manual step** (must be done by a human with admin access):

1. Go to `https://github.com/adityasingh-x/snake-run/settings/environments`
2. Create a new environment named `github-pages` (no reviewers or protection rules needed)
3. Go to `https://github.com/adityasingh-x/snake-run/settings/pages`
4. Under "Build and deployment" → "Source", select **"GitHub Actions"**
5. Save

**Verification:** The Pages settings page shows "GitHub Actions" as the source. The Environments page shows `github-pages`.

---

## Phase 5 — Testing

Goal: Add build-output tests to verify PWA artifacts are generated correctly.

### Step 9: Add PWA build output tests

**File:** `src/__tests__/pwa.test.ts` (new file)

These tests verify the PWA build output exists and is well-formed. They run as part of the normal `npm test` suite (they check the `dist/` directory, which must exist from a prior `npm run build`).

**Location rationale:** Existing tests are co-located with their source modules (e.g. `src/game/__tests__/`). There is no single source module that owns the PWA build output, so `src/__tests__/` is a one-off directory for build-output verification tests. The `.gitignore` excludes `dist/`, so stale builds will not mask a missing build step.

**Important:** These tests are skipped if `dist/` does not exist, so they don't break the `npm test` command during development when only `npm run dev` is used.

```ts
import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync } from 'fs';
import { resolve } from 'path';

const distDir = resolve(process.cwd(), 'dist');

describe.runIf(existsSync(distDir))('PWA build output', () => {
  it('generates a service worker', () => {
    expect(existsSync(resolve(distDir, 'sw.js'))).toBe(true);
  });

  it('generates a web manifest', () => {
    expect(existsSync(resolve(distDir, 'manifest.webmanifest'))).toBe(true);
  });

  it('generates the SW registration script', () => {
    expect(existsSync(resolve(distDir, 'registerSW.js'))).toBe(true);
  });

  it('index.html has the correct title', () => {
    const html = readFileSync(resolve(distDir, 'index.html'), 'utf-8');
    expect(html).toContain('<title>Snake Run</title>');
  });

  it('index.html contains manifest link and SW registration', () => {
    const html = readFileSync(resolve(distDir, 'index.html'), 'utf-8');
    expect(html).toContain('manifest');
    expect(html).toContain('registerSW');
  });

  it('manifest contains correct subpath-critical values', () => {
    const raw = readFileSync(resolve(distDir, 'manifest.webmanifest'), 'utf-8');
    const manifest = JSON.parse(raw);
    expect(manifest.name).toBe('Snake Run');
    expect(manifest.start_url).toBe('/snake-run/');
    expect(manifest.scope).toBe('/snake-run/');
    expect(manifest.display).toBe('standalone');
  });
});
```

**Verification:** `npm run build && npm test` — all tests pass, including the new PWA tests. `npm test` alone (without a prior build) skips these tests gracefully.

---

## Phase 6 — Documentation

Goal: Update all project documentation to reflect the PWA release.

### Step 10: Update `SPEC.md`

**File:** `SPEC.md`

At the end of the file (after §17 Known Limitations), add:

```markdown
## 18. PWA Support

- **Manifest:** `manifest.webmanifest` generated by `vite-plugin-pwa` at build time
- **Service Worker:** Workbox-generated, auto-updating (`registerType: 'autoUpdate'`), pre-caches all static assets for offline play
- **Installability:** `display: standalone`, theme color `#16213e`, background color `#1a1a2e`
- **Offline:** Full offline play after first visit via pre-caching
- **Icons:** SVG favicon used as PWA icon (`purpose: 'any'`)
- **iOS:** `apple-mobile-web-app-capable` enables standalone mode; no custom `apple-touch-icon` (falls back to screenshot)
- **Deployment:** GitHub Pages via GitHub Actions (`.github/workflows/deploy.yml`)
```

In §17 Known Limitations, **remove item 6** ("No PWA/offline support").

### Step 11: Update `ARCHITECTURE.md`

**File:** `ARCHITECTURE.md`

After the "Platform Strategy" section, add:

```markdown
### PWA Infrastructure

- **Build-time:** `vite-plugin-pwa` generates the service worker (`sw.js`), web manifest (`manifest.webmanifest`), and injects registration into `index.html`
- **Service worker:** Workbox-based, pre-caches all static assets (`**/*.{js,css,html,svg,png}`), auto-updates silently
- **Manifest:** `display: standalone`, `theme_color: #16213e`, `background_color: #1a1a2e`, SVG icon
- **Deployment:** GitHub Pages via GitHub Actions (`.github/workflows/deploy.yml`)
- **Caching:** Network-first for external resources with 24-hour cache expiration
```

Update the "Planned Release Path" list — mark "Progressive Web App (PWA)" with a checkmark or note it as the current release.

### Step 12: Update `docs/ROADMAP.md`

**File:** `docs/ROADMAP.md`

- Move "PWA Release (Milestone 3)" from "Not Started" → under "Completed" with a ✅
- Add a summary of completed items:

```markdown
PWA Release (Milestone 3):

- PWA manifest with app name, theme color, and SVG icon ✅
- Service worker with offline pre-caching ✅
- Auto-updating service worker ✅
- GitHub Pages deployment via GitHub Actions ✅
- Shareable public URL ✅
- Installable on mobile and desktop ✅
```

- Update "In Progress" to say "Feedback gathering" (or remove entirely if empty)
- Update "Current Progress" → "Completed" section to reflect Milestone 3

### Step 13: Update `docs/PROJECT_STATE.md` and `package.json`

**File:** `docs/PROJECT_STATE.md`

- **Current Version:** `v0.3.0`
- **Current Status:** `Public PWA Release`
- **Current Milestone:** Change to `Milestone 4 - Feedback & Iteration`
- **Current Priorities:** Replace with Milestone 4 priorities:
  ```
  1. Gather feedback from family and friends
  2. Fix usability issues
  3. Improve controls based on feedback
  4. Improve onboarding
  5. Resolve gameplay frustrations
  ```
- Under "Completed Features", add a section:

```markdown
### PWA Release (Milestone 3)

- PWA manifest with installable standalone mode
- Service worker with full offline caching
- Auto-updating service worker
- GitHub Pages deployment pipeline
- Shareable public URL
- Installable on phones and desktops
```

- Under "In Progress", remove "PWA release preparation"
- Under "Known Technical Debt", remove: "No PWA support", "No deployment pipeline", "No installable build"

**File:** `package.json`

- Bump `"version"` from `"0.0.0"` to `"0.3.0"` to match `PROJECT_STATE.md`.

---

## Phase 7 — Push, Deploy, and Final Validation

Goal: Push the code, trigger the CI pipeline, and validate the deployed PWA against all success criteria.

### Step 14: Commit and push

After Steps 1–13 are complete and verified:

```bash
git add -A
git commit -m "feat(pwa): add PWA support and GitHub Pages deployment"
git push origin main
```

### Step 15: Wait for GitHub Actions deployment

1. Go to `https://github.com/adityasingh-x/snake-run/actions`
2. Confirm the "Deploy to GitHub Pages" workflow runs and completes successfully

### Step 16: Validate the deployed PWA

Run the final validation checklist:

| # | Criterion | How to Verify |
|---|-----------|---------------|
| 1 | Shareable URL | Open `https://adityasingh-x.github.io/snake-run/` in an incognito window |
| 2 | Installable on phones (Android) | Chrome Android: "Add to Home Screen" option appears |
| 3 | Installable on phones (iOS) | Safari iOS: "Add to Home Screen" in share menu |
| 4 | Installable on desktops | Chrome/Edge: install icon in address bar; app opens in standalone window |
| 5 | Playable offline | Enable airplane mode, open installed app, play the game |
| 6 | All game features work offline | Test: start game, eat food, level up, game over, restart, sound toggle, d-pad |
| 7 | Sound works in installed PWA | AudioContext allowed in standalone mode |
| 8 | High score persists | Play a game, close PWA, reopen — high score is preserved |

---

## Files Modified (Summary)

| File | Action | Phase |
|------|--------|-------|
| `package.json` | Modify — add `vite-plugin-pwa` to devDependencies | 1 |
| `vite.config.ts` | Modify — add `VitePWA` plugin + `base` path | 1 |
| `tsconfig.app.json` | Modify — add `"vite-plugin-pwa/client"` type | 1 |
| `index.html` | Modify — update `<title>` to "Snake Run" | 2 |
| `.github/workflows/deploy.yml` | Create — GitHub Actions deployment workflow | 4 |
| `src/__tests__/pwa.test.ts` | Create — PWA build output verification tests | 5 |
| `SPEC.md` | Modify — add §18 PWA Support, remove limitation #6 | 6 |
| `ARCHITECTURE.md` | Modify — add PWA Infrastructure section | 6 |
| `docs/ROADMAP.md` | Modify — mark Milestone 3 complete, update progress | 6 |
| `docs/PROJECT_STATE.md` | Modify — bump version, update status and priorities | 6 |
| `package.json` | Modify — bump version to `0.3.0` | 6 |

---

## Execution Order

Phases 1–2 must run in order (dependencies):

1. **Phase 1:** Steps 1–4 (install + configure `vite-plugin-pwa`)
2. **Phase 2:** Step 5 (update `index.html` title)

Phases 3–6 can run in parallel after Phase 1-2 are complete:

3. **Phase 3:** Step 6 (manual offline smoke test)
4. **Phase 4:** Steps 7–8 (GitHub Actions workflow + repo settings)
5. **Phase 5:** Step 9 (PWA tests — requires a prior `npm run build` to exercise the PWA artifact assertions; tests skip gracefully without it)
6. **Phase 6:** Steps 10–13 (documentation updates)

Phase 7 depends on all prior phases:

7. **Phase 7:** Steps 14–16 (commit, push, deploy, validate)

---

## Simplifications (Rationale)

1. **SVG-only icon** — avoids adding `sharp` or `@vite-pwa/assets-generator` dependencies. iOS falls back to a screenshot; acceptable for a first public release targeting family and friends.
2. **No custom service worker logic** — `vite-plugin-pwa` with Workbox handles everything. No hand-rolled cache invalidation or custom offline pages.
3. **No install prompt UI** — the browser provides its own install affordance. Adding a custom prompt is future polish.
4. **No `injectRegister` config** — defaults to `'auto'`, which is simpler and correct for this use case.
5. **PWA tests are conditional** — skipped when `dist/` doesn't exist, so `npm test` works during development without a build step.
6. **No Lighthouse score gate** — Lighthouse PWA audit is best-effort but not a Definition of Done gate for the first release.
