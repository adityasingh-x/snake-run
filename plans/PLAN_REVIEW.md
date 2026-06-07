# Plan Review: Milestone 8 — Visual Identity

**Reviewer:** Staff Engineer (Plan Review)
**Plan under review:** `plans/ACTIVE.md` (Milestone 8 — Visual Identity, ACTIVE, 2026-06-07)
**Source documents:** `ROADMAP.md`, `AGENTS.md`, `ARCHITECTURE.md`, `SPEC.md`, `docs/PROJECT_STATE.md`, current component source
**Review date:** 2026-06-07

---

# Overall Assessment

## Strengths

1. **Right-sized milestone.** The plan is CSS-only. No new components, no structural changes to React, no state machine changes, no new packages, no theming library, no CSS-in-JS. This matches the project philosophy (`AGENTS.md`: "Prefer small changes, simple solutions, maintainable code, playable progress") and the ROADMAP M8 scope exactly.
2. **Strong alignment with ROADMAP.md §M8.** All three ROADMAP features (HUD Redesign, Overlay Redesign, Typography Pass) are covered. Theme direction ("Retro Arcade Neon — dark background, bright accent colors, strong visual hierarchy, clean readability") maps directly to the ROADMAP bullet list ("Avoid: flashing effects, excessive particles, visual clutter").
3. **Honest out-of-scope list.** Particles, scanlines, CRT effects, theme switching, audio changes, new components, and animation framework work are all explicitly fenced. M9 (statistics/achievements), M10 (food variants/level mechanics), and M12 (game polish) are correctly excluded.
4. **Clean phase decomposition.** Six phases ordered by dependency: tokens → HUD → overlays → level-transition overlay → board/cells → integration cleanup. Each phase is independently verifiable with a build, a test run, and a visual check. No phase breaks the build at the end (unlike M7's "Phase 1 breaks the build on purpose" pattern).
5. **Documentation discipline.** Definition of Done explicitly requires `SPEC.md`, `ROADMAP.md`, and `PROJECT_STATE.md` updates. The "Plan Review Notes" section in the plan itself is a useful self-audit.
6. **No ADR needed.** This is a visual style refresh, not an architectural change. The plan correctly skips the ADR step.
7. **Accessibility preservation is explicit.** Aria-live regions, screen-reader-only content, focus management, and contrast are all flagged as preserved. Phase 2 explicitly says "Keep `aria-live` regions and screen-reader-only content unchanged."
8. **Risk table is candid.** Google Fonts latency, mobile paint performance from shadows, and visual regression from hardcoded-color churn are all real and acknowledged.
9. **Out-of-scope table directly cites future milestones.** "No achievement/statistics UI (Milestone 9)", "No food variant visuals (Milestone 10)", "No particle effects (Milestone 12)" — this is the right level of cross-referencing.

## Weaknesses

1. **Google Fonts external dependency is a real regression for an offline-first PWA.** The plan adds a runtime CDN fetch (`fonts.googleapis.com` / `fonts.gstatic.com`). The current PWA pre-caches **all static assets** (`**/*.{js,css,html,svg,png}`) and is fully playable offline. A first-time visit that loses connectivity between the HTML load and the font fetch will render the game in the system stack — silently dropping the "Retro Arcade Neon" identity exactly when the player most needs the visual hook. The mitigation "system font fallback ensures readability" addresses the bug but not the regression.
2. **The "Possible minor JSX restructuring" in Phase 2 is mislabeled — the redesign requires it.** The current `ScoreBoard.tsx` is four flat `<div className={styles.score}>` rows. The Phase 2 redesign requires "horizontal bar with visual separators between sections", "Food progress: compact meter/bar style showing 'X/Y' with visual fill", and "High Score: gold/yellow accent color with crown-like visual treatment". A visual separator, a fill bar, and a "crown-like" treatment each demand new DOM structure. "Possible" should be "Required" with the new structure spelled out (group wrappers, meter container, etc.).
3. **Phase 3 declares "no structural changes expected" for `Game.tsx` and then describes one.** The plan's Phase 3 file list for `Game.tsx` says "No structural changes expected", but the same phase says "remove the standalone `<h1>` above board when overlay is active, or make it larger and more arcade-like". The `<h1>` lives at `Game.tsx:131` and the idle overlay already has its own `<h2>Snake Run</h2>` at `Game.tsx:189`. Removing the page-level h1 is a behavior change that needs to be explicit and owned, not hedged.
4. **Color token list is incomplete relative to existing palette.** The plan defines `--color-bg`, `--color-surface`, `--color-border`, `--color-text`, `--color-text-muted`, `--color-accent`, `--color-danger`, `--color-warning`, `--color-obstacle`. The current code uses at least these distinct colors that are not in the list:
   - `#22c55e` (snake head) — neither `--color-accent` (presumably `--color-text`/`--color-accent` is for the brand) nor any other token.
   - `#16a34a` (snake body) — not in the list.
   - `#4ade80` (button green) — distinct from `#22c55e` (hover); not in the list.
   - `#818cf8` (obstacle border) — distinct from the planned `--color-obstacle` fill.
   - `#fbbf24` (high score gold) — could be `--color-warning` but warnings are conventionally amber/red, not gold.
   - `#0f172a` (text on accent button) — needs `--color-text-on-accent` or similar.
   - The names `bg` vs `surface` vs `card` overlap with no clear hierarchy. `SPEC.md §14` currently lists 11 specific colors; the plan should produce a 1:1 mapping of every existing hex to a token.
5. **Font choice is undecided.** "Press Start 2P" and "Orbitron" are visually unrelated — one is a 1980s pixel font with no lowercase or diacritics, the other is a futuristic geometric sans. The visual identity of M8 will look very different depending on which is picked. This must be pinned before Phase 1 starts; "e.g." is not a decision.
6. **Three decorative terms are undefined.** "Crown-like visual treatment" (high score), "decorative border or top/bottom accent lines on the overlay" (idle), and "decorative elements: horizontal divider lines with glow" (game over) are all decorative specifications with no concrete shape (Unicode glyph, CSS pseudo-element, SVG, emoji). An implementer will invent these and the overlays will drift apart.
7. **PWA `manifest.webmanifest` and `theme-color` meta are not addressed.** `SPEC.md §18` and `ARCHITECTURE.md §PWA Infrastructure` both list `theme_color: #16213e` and `background_color: #1a1a2e` as PWA configuration. The PWA pre-caches the manifest, the iOS splash uses `background_color`, and the Android Chrome address bar uses `theme_color`. If `--color-surface` (the new game card) differs from `#16213e`, the splash and the in-game card will not match. The plan should call out `index.html` `theme-color` and the PWA manifest generator config (likely `vite.config.ts` / `@vite-pwa/manifest` block) explicitly.
8. **"Test count" DoD entry is hand-wavy.** "`npm test` passes — all 178+ tests" is the right intent but the trailing "+" is a hedge. The actual count from `ARCHITECTURE.md:271` and `SPEC.md §15` is 178 — write 178, not "178+".
9. **Phase 6 visual-inspection check is not an explicit verification step.** "Visual inspection across viewport sizes" and "PWA install test (dev server, verify in Chrome DevTools)" are listed as bullets in Phase 6, but there is no checklist of what to look for at each viewport. The previous M5 review called this out as a soft verification; the M8 plan should provide a small inspection rubric (e.g., "no text clipping at 375px", "all overlay buttons have a 44px minimum hit target at 600px", "no horizontal scrollbar at 320px").
10. **No mention of `package.json` version bump.** M6 bumped to v0.6.0 and M7 bumped to v0.7.0. M8 is a milestone and should bump to v0.8.0. Definition of Done does not list this. The `package.json` is the actual version field; `PROJECT_STATE.md` mirrors it. The plan should own the version bump as an explicit step.
11. **`ARCHITECTURE.md` is missing from the DoD documentation list.** `ARCHITECTURE.md` has a "Styling Conventions" section (`ARCHITECTURE.md:258–266`) that will become outdated the moment a token system replaces the hardcoded palette. The current DoD lists `SPEC.md`, `ROADMAP.md`, `PROJECT_STATE.md`, but not `ARCHITECTURE.md`. M7's plan included `ARCHITECTURE.md` updates and the M7 archived plan's DoD includes them too. This is a regression in documentation discipline.
12. **ROADMAP.md §M8 is slightly out of sync with current implementation.** ROADMAP lists "Level introduction screen" and "Level complete screen" as separate overlay features. Since M4 (per `ADR-003`) these are a single `LevelTransition` overlay. The plan correctly references a single overlay, but the ROADMAP text is misleading and the plan's "Future-milestone leakage checked" section does not flag this. After M8 ships, ROADMAP §M8 should be tightened to say "Level transition overlay" (single).
13. **"Subtle glow on hover" / "subtle outer glow effect" are undefined magnitudes.** The plan introduces "subtle inner shadow", "subtle outer glow", "subtle border glow" without ranges. Combined with the Risk #4 ("Mobile performance — box shadows and text-shadows can cause paint performance issues on low-end devices. Mitigation: limit glow effects to key elements only"), the implementer has no quantitative ceiling. A small rubric ("no more than 6 elements with `box-shadow` per viewport, max blur 16px") would prevent overspending on glows.
14. **No test-file audit.** The plan claims no test regressions but does not enumerate the 13 test files (`ARCHITECTURE.md:271`). At minimum, `src/components/__tests__/GameOver.test.tsx`, `src/components/__tests__/LevelTransition.test.tsx`, and `src/components/__tests__/Board.test.tsx` should be listed and read for assertions that depend on visual identity (class names, computed text content, ARIA structure). Pure CSS changes that preserve all text content should be safe, but the plan does not state the principle ("all text content, button labels, and ARIA attributes remain identical to the current implementation") that an implementer can verify against.
15. **Scoreboard food-progress display change is ambiguous.** Phase 2 says "compact meter/bar style showing 'X/Y' with visual fill". The current implementation is text "Food: 3/10". The new implementation could be:
    (a) A meter bar that replaces the text — breaks the existing screen-reader announcement.
    (b) A meter bar that augments the text — preserves accessibility.
    (c) A meter bar that replaces the text but keeps the screen-reader announcement. The plan does not pick.
16. **The plan's own "Plan Review Notes" section is under-checked.** The "Unnecessary complexity checked" / "Future-milestone leakage checked" / "AGENTS.md compliance" subsections are self-assessed. They do not check for: test file coverage, ARCHITECTURE.md update, package.json version bump, manifest.webmanifest, theme-color meta, font pinning, or decorative-element specification. These would all be caught by a fuller internal checklist.
17. **Risk #1 cites `font-display: swap` as a mitigation but Phase 1 step 1 doesn't say where the `font-display` declaration lives.** For a Google Fonts `<link>` import, the browser controls `font-display` via a query parameter (`&display=swap`). For a self-hosted `@font-face`, the `font-display` descriptor goes in the `@font-face` rule. The plan doesn't pin which is used.

## Major Risks

1. **Offline-first regression from Google Fonts.** A PWA that ships a runtime font fetch is no longer "fully offline-first" in the way `ARCHITECTURE.md §PWA Infrastructure` and `SPEC.md §18` claim. Even with `font-display: swap`, the visual identity is absent in offline mode, and the PWA no longer meets the "Full offline play after first visit via pre-caching" success criterion from `ARCHITECTURE.md:294` because the font never gets pre-cached. This is a public-facing claim that will be false.
2. **PWA splash and Android theme color mismatch.** The iOS splash and Android Chrome address bar will render the old colors (`#16213e` / `#1a1a2e`) while the in-game card shows the new colors. The PWA's first impression — the splash — will be visually inconsistent with the game. A 1-second inconsistency on every install.
3. **Scoreboard UX change could break accessibility.** "Compact meter/bar style showing 'X/Y' with visual fill" can be implemented as a CSS-only bar with the text unchanged, or as a replacement for the text. If the text is replaced, the screen-reader announcement (`ScoreBoard.tsx:25–28` — `Food: {foodEaten} of {foodRequired}`) becomes the only text, and a visual-only player loses quick-readability. The plan does not say which.
4. **Mobile paint performance from "subtle" glows is harder to control than the plan implies.** The plan's mobile-perf mitigation is "limit glow effects to key elements only (not every cell)". The redesign touches board, cells, head, body, food, obstacles, scoreboard, dpad, toolbar, four overlay types, and the title — and many of these are described as "subtle glow" or "border glow". Without an explicit ceiling, the cumulative `box-shadow` cost on low-end Android is real.
5. **JSX contradiction between Phase 2 and Phase 3.** Phase 2 says "Possible minor JSX restructuring". Phase 3 says "No structural changes expected" but then asks for the `<h1>` to be removed or enlarged. An implementer who reads Phase 2 and Phase 3 sequentially will hit a wall: either they make JSX changes that Phase 3's "No changes expected" forbids, or they preserve JSX and the visual redesigns fall short.
6. **Color token incompleteness produces drift.** If `--color-accent` is reused for "snake head green" and "primary button green" and the design later wants them to diverge, every consumer must be hand-audited. Worse, the unnamed `#4ade80` (button), `#22c55e` (head), and `#16a34a` (body) are three distinct greens with intent — collapsing them to one or two tokens loses information.
7. **The plan does not own the scoreboard's `levelName` rendering.** `ScoreBoard.tsx:10` renders `{level}{levelName ? ` — ${levelName}` : ''}`. The current format is "Level: 1 — First Meal". The plan does not say whether the display font applies to the level number, the level name, both, or neither. This affects how the level-name token is specified.
8. **Decorative elements invented during implementation.** "Crown-like" (high score), "decorative border or top/bottom accent lines" (idle), and "decorative elements: horizontal divider lines with glow" (game over) are not specified. An implementer will pick Unicode (e.g., ♛, ◆, ─) and CSS pseudo-elements. The overlays will look slightly different because the implementer invents three separate visual languages.

## Recommended Changes

1. **Decide on font source and self-host if Google Fonts is kept.** Either:
   (a) Self-host the chosen font as `woff2` in `public/fonts/` (or co-locate with `index.html`), add an `@font-face` block with `font-display: swap` in `index.css`, and let the existing PWA pre-cache pick it up automatically — preserving the offline guarantee.
   (b) Accept the runtime fetch and explicitly amend `SPEC.md §18` and `ARCHITECTURE.md §PWA Infrastructure` to say "fonts loaded from Google Fonts CDN at runtime; offline play falls back to system font".
   Pick one. Option (a) is strongly preferred for an offline-first PWA. Document the choice in Phase 1.
2. **Pin the display font name in Phase 1.** Replace "e.g., 'Press Start 2P' or 'Orbitron'" with a single decision. (Recommendation: **'Press Start 2P'** for headings/titles, because it is the more distinctive "retro arcade" choice; **system mono** for numerics, because pixel fonts are typically too small to read at score sizes. Confirm before implementation.)
3. **Convert Phase 2's "Possible minor JSX restructuring" to a "Required" step with explicit new structure.** Spell out the new `ScoreBoard.tsx` shape: a section wrapper around each label/value pair, a meter container around food progress, and a high-score wrapper. Provide the new JSX as a target.
4. **Reconcile Phase 2 and Phase 3 JSX scope.** Either:
   (a) Move the `<h1>` change to Phase 2 (it's HUD-adjacent) and remove the contradiction.
   (b) Add a new Phase 2.5 ("Game.tsx h1 alignment") that owns the change with explicit before/after JSX.
   (c) Decide that the `<h1>` stays as-is and update Phase 3 to remove the "remove the standalone h1" option. Pick one.
5. **Enumerate every existing color in Phase 1 with a target token.** The plan should produce a one-to-one mapping:
   | Current hex | Token | Usage |
   |---|---|---|
   | `#1a1a2e` | `--color-bg` | Page background |
   | `#16213e` | `--color-surface` | Game card / overlay surface |
   | `#0f172a` | `--color-text-on-accent` | Text on green buttons |
   | `#f8fafc` | `--color-text` | Primary text |
   | `#94a3b8` | `--color-text-muted` | Secondary text |
   | `#64748b` | `--color-text-dim` | Hint text |
   | `#4ade80` | `--color-accent-soft` | Primary button |
   | `#22c55e` | `--color-accent` | Snake head / hover |
   | `#16a34a` | `--color-accent-deep` | Snake body |
   | `#ef4444` | `--color-danger` | Food / game over |
   | `#fbbf24` | `--color-warning` | High score |
   | `#6366f1` | `--color-obstacle` | Obstacle fill |
   | `#818cf8` | `--color-obstacle-edge` | Obstacle border |
   | `#475569` | `--color-border` | Default border |
   | `#1e293b` | `--color-cell-border` | Cell grid line |
   | `#334155` | `--color-board-border` | Board border (current) |
   This list is derived from the current code; the plan should be a superset of it.
6. **Add `manifest.webmanifest` and `theme-color` to Phase 1 or Phase 6 file lists.** Pin which file controls the PWA theme (likely `vite.config.ts` with the `@vite-pwa/manifest` block) and update the values to match the new `--color-surface` and `--color-bg`. Also update `<meta name="theme-color">` in `index.html` to `--color-bg` (or the equivalent token). Otherwise the iOS splash and Android address bar will be visually inconsistent.
7. **Replace "decorative" with concrete specifications.** Three options:
   (a) Pin each decorative element to a specific Unicode glyph (e.g., `▔`, `═`, `▁`) and a CSS position.
   (b) Add a small inline SVG block per overlay (1–2 lines) with a "neon underline" shape.
   (c) Remove the decorative elements and rely on typography + glow + spacing for the visual identity.
   The plan currently says "decorative" three times without defining. Pick one path.
8. **Define "subtle" glow with a quantitative ceiling.** Add to Phase 1: "Glow effects are limited to: (i) one outer `box-shadow` per overlay surface, (ii) one `text-shadow` per heading, (iii) snake head, (iv) obstacle edges, (v) scoreboard border. Max blur radius: 16px. No glow on individual cells, dpad buttons, or toolbar buttons." This is the kind of constraint that prevents performance drift.
9. **Add `package.json` version bump (0.7.0 → 0.8.0) to Phase 6.** This matches the milestone pattern (M6 → 0.6.0, M7 → 0.7.0).
10. **Add `ARCHITECTURE.md` to the DoD documentation list.** Phase 6 should update the "Styling Conventions" section (lines 258–266) to reference the new token system and the self-hosted (or CDN) font choice.
11. **Specify the food-progress presentation.** "Phase 2 redesigns the food progress as a CSS meter bar that augments (does not replace) the existing 'Food: X/Y' text. Screen-reader announcement at `ScoreBoard.tsx:25–28` is unchanged." This single sentence prevents a UX regression.
12. **Add a test-file audit step to Phase 6 verification.** "Phase 6 verification: read `src/components/__tests__/GameOver.test.tsx`, `src/components/__tests__/LevelTransition.test.tsx`, `src/components/__tests__/Board.test.tsx`, `src/components/__tests__/Cell.test.tsx`, and `src/components/__tests__/Game.test.tsx` to confirm none of the assertions depend on CSS class names that may be renamed during the redesign." Five minutes of reading, prevents a missed regression.
13. **Pin the `<h1>` decision before Phase 3.** Either the page-level h1 is removed (because the idle overlay already shows "Snake Run" as h2) or it is enlarged. Whichever is chosen, write it down so the implementer doesn't have to choose.
14. **Add a viewport-inspection rubric to Phase 6 verification.** Replace "Visual inspection across viewport sizes" with:
    - 320px wide: no horizontal scrollbar; all overlay buttons ≥ 44px hit target.
    - 375px (iPhone SE): idle overlay text fits without ellipsis; ScoreBoard wraps gracefully.
    - 600px (tablet portrait): ScoreBoard is single-row; controls toolbar is right-aligned.
    - 768px (tablet landscape): default layout, no media query changes.
    - 1200px+ (desktop): board is `min(90vw, 70dvh, 400px)` and centered.
15. **Update ROADMAP.md §M8 to reflect the single-overlay design.** Replace "Level introduction screen" + "Level complete screen" with "Level transition overlay" (matching `ADR-003`). Move M8 to "Completed" after the milestone ships.
16. **Specify the `font-display` strategy concretely.** If Google Fonts is used, add `&display=swap` to the URL. If self-hosted, add `font-display: swap;` to the `@font-face` block. Either way, write the rule.

---

# Detailed Findings

## Critical

### F-01. Google Fonts external dependency breaks the offline-first PWA claim
- **Severity:** Critical
- **Description:** The plan introduces a runtime CDN fetch for a display font (Phase 1 step 1, "Add Google Fonts preconnect links in `index.html`"). `ARCHITECTURE.md:294` claims "Full offline play after first visit via pre-caching" and `SPEC.md:443` claims "Full offline play after first visit via pre-caching." The current pre-cache glob is `**/*.{js,css,html,svg,png}` — no `woff2`, no Google Fonts stylesheet. After this milestone, a player who loads the page once and then plays offline will see the game in the system stack — exactly the visual identity gap the milestone is trying to close. The plan's mitigation ("system font fallback in font stack ensures readability") is correct for the bug but not for the regression: the README/PWA manifest/iOS-splash would still advertise an offline-first product that is no longer offline-first for its core visual element.
- **Recommendation:** Self-host the chosen font. Place `*.woff2` in `public/fonts/` (or a co-located asset path), add an `@font-face` block with `font-display: swap;` in `index.css`, and let the existing PWA pre-cache pick it up via the `**/*.{js,css,html,svg,png}` glob (or extend it to include `woff2`). This preserves the offline guarantee and removes the third-party runtime dependency.

### F-02. Phase 2's "Possible minor JSX restructuring" is a contradiction with the redesign
- **Severity:** Critical
- **Description:** Phase 2 says "Possible minor JSX restructuring (add grouping `div`s)" — the word "possible" treats the JSX change as optional. But the redesign description requires "visual separators between sections" (requires wrapper elements around each label/value pair), "compact meter/bar style showing 'X/Y' with visual fill" (requires a meter container element with a fill child), and "crown-like visual treatment" (requires a child element or pseudo-element). A pure CSS rewrite of the current flat `ScoreBoard.tsx` cannot achieve any of these. The current `<div className={styles.score}>` rows must be split or wrapped.
- **Recommendation:** Change Phase 2 to "Required JSX restructuring" and provide the new `ScoreBoard.tsx` shape: section wrappers, food progress meter, high-score wrapper. The plan is currently a CSS-only plan; that premise is wrong for the HUD.

### F-03. Phase 3 and Phase 2 disagree on whether `Game.tsx` changes
- **Severity:** Critical
- **Description:** Phase 2's "Files" list for `ScoreBoard.tsx` says "Possible minor JSX restructuring (optional)". Phase 3's "Files" list for `Game.tsx` says "No structural changes expected", but the same phase's "Changes" section says "remove the standalone `<h1>` above board when overlay is active, or make it larger and more arcade-like". An implementer cannot satisfy both. The current `Game.tsx:131` has `<h1 className={styles.title}>Snake Run</h1>` and the idle overlay at `Game.tsx:189` has `<h2>Snake Run</h2>` — they coexist today. Removing or enlarging the page-level h1 is a real JSX change.
- **Recommendation:** Decide once. Recommended: remove the page-level h1 entirely (the idle overlay already shows the title; the page-level h1 is redundant during idle and cluttering during play/pause/gameover/levelComplete). Update Phase 2 to "no JSX changes" and Phase 3 to "remove the `<h1>` at `Game.tsx:131` and rely on the overlay h2 for idle title visibility."

### F-04. PWA manifest and theme-color meta are not in the change list
- **Severity:** Critical
- **Description:** `SPEC.md §18` and `ARCHITECTURE.md §PWA Infrastructure` both document `theme_color: #16213e` and `background_color: #1a1a2e` in the PWA manifest (generated by `vite-plugin-pwa`). `index.html:7` carries `<meta name="theme-color" content="#16213e" />`. If the new `--color-surface` (game card) and `--color-bg` (page) are different values, the iOS splash screen and the Android Chrome address bar will show the old colors while the in-game card shows the new ones. The first impression on every install will be visually inconsistent.
- **Recommendation:** Add to Phase 1 (or a new Phase 1.5) an explicit step: "Update `index.html` `<meta name="theme-color">` to match the new `--color-bg` (or `--color-surface` if a different surface color is intended for the iOS bar). Locate the PWA manifest block in `vite.config.ts` (or wherever `@vite-pwa/manifest` is configured) and update `theme_color` and `background_color` to match the new tokens." Verification: "Build the PWA, inspect `dist/manifest.webmanifest` to confirm the new values are emitted, and load on a real iOS device or simulator to confirm the splash matches the in-game card."

## High

### F-05. Color token list does not cover the existing palette
- **Severity:** High
- **Description:** The plan defines 9 color tokens (`--color-bg`, `--color-surface`, `--color-border`, `--color-text`, `--color-text-muted`, `--color-accent`, `--color-danger`, `--color-warning`, `--color-obstacle`). The current code uses at least 14 distinct hex values across `index.css`, `Game.module.css`, `Cell.module.css`, `Board.module.css`, `GameOver.module.css`, `LevelTransition.module.css`, and `ScoreBoard.module.css`. Mapping every existing color to a token requires at least 14 tokens, not 9. The plan's "remove hardcoded color values from `index.css` body/html rules, referencing variables instead" (Phase 1 step 4) implies a full migration, but the token list is too small to do it.
- **Recommendation:** Expand the token list in Phase 1 to cover every existing hex value. A reference table is provided in Recommended Change #5 above. Pin the semantic intent of each token (e.g., `--color-accent-soft` for primary button fill, `--color-accent` for snake head / hover, `--color-accent-deep` for snake body) so the three distinct greens don't collapse.

### F-06. Font choice is undecided
- **Severity:** High
- **Description:** Phase 1 step 1 says "for a retro display font (e.g., 'Press Start 2P' or 'Orbitron')". "Press Start 2P" is a 1980s pixel font with no lowercase letters, no diacritics, and a fixed x-height; it is unreadable at body sizes. "Orbitron" is a futuristic geometric sans-serif with full Unicode coverage. The visual identity of M8 will look completely different depending on which is chosen. This is the most important design decision in the milestone, and "e.g." is not a decision.
- **Recommendation:** Pin the choice before Phase 1 starts. Recommend "Press Start 2P" for headings (the more distinctive "retro arcade" choice) and a system mono stack for numerics (pixel fonts are typically too small to read at score sizes). The plan should say "Display font: 'Press Start 2P' (self-hosted, woff2). Numeric font: system mono stack via `--font-mono`." This decision is also relevant to F-01 (self-hosting) and F-13 (level-name rendering).

### F-07. Three decorative terms are undefined
- **Severity:** High
- **Description:** The plan says "Crown-like visual treatment" (high score), "decorative border or top/bottom accent lines on the overlay" (idle), and "decorative elements: horizontal divider lines with glow" (game over). None of these are defined. An implementer will pick Unicode (`♛`, `◆`, `─`, `═`), CSS pseudo-elements, or inline SVGs, and the three overlays will end up with three different visual languages.
- **Recommendation:** Pick one approach for all three. Recommended: a single `.neon-divider` class (e.g., `border-top: 1px solid; border-image: linear-gradient(90deg, transparent, var(--color-accent), transparent) 1;`) reusable across overlays. Drop "crown-like" — use a gold accent on the high-score value and let the typography carry the visual. This is simpler and more consistent.

### F-08. No `package.json` version bump
- **Severity:** High
- **Description:** M6 bumped to v0.6.0 and M7 bumped to v0.7.0 (per archived plans). M8 is a milestone and should bump to v0.8.0. Definition of Done does not list this. `package.json` is the canonical version field; `PROJECT_STATE.md` mirrors it. The previous archived plan for M7 explicitly included `package.json` in its Phase 6 file list (archived plan "6e. Bump `package.json` version"). This milestone's plan drops that step.
- **Recommendation:** Add to Phase 6: "Bump `package.json` from `0.7.0` to `0.8.0`." Add `package.json` to the Phase 6 file list.

### F-09. `ARCHITECTURE.md` is missing from the DoD documentation list
- **Severity:** High
- **Description:** Definition of Done lists `SPEC.md`, `ROADMAP.md`, and `PROJECT_STATE.md` updates, but not `ARCHITECTURE.md`. The current `ARCHITECTURE.md:258–266` ("Styling Conventions") describes the dark theme with hardcoded hex codes that become obsolete the moment Phase 1 introduces the token system. M7's plan included `ARCHITECTURE.md` updates (its DoD item 10: "`SPEC.md`, `ARCHITECTURE.md`, `PROJECT_STATE.md`, and `ROADMAP.md` are updated and consistent with the implementation"). M8's plan regresses on this.
- **Recommendation:** Add `ARCHITECTURE.md` to DoD. Phase 6 should update the "Styling Conventions" section to reference the new token system and the chosen font.

### F-10. Scoreboard food-progress presentation is ambiguous
- **Severity:** High
- **Description:** Phase 2 says "Food progress: compact meter/bar style showing 'X/Y' with visual fill". Three reasonable implementations:
    (a) Meter bar replaces the text — breaks quick-readability and the screen-reader text at `ScoreBoard.tsx:25–28` is the only source of food count.
    (b) Meter bar augments the text — text is preserved, meter is a visual aid.
    (c) Meter bar replaces the text visually but a separate `.sr-only` element preserves the announcement. The plan does not pick. A safe default is (b) — minimal change, preserves accessibility, and looks arcade-y.
- **Recommendation:** Pin the choice. Recommended: option (b) — the meter is a CSS-only addition to the existing food-progress row, the text "Food: X/Y" remains visible and announced. The plan should say "Food progress retains the visible 'Food: X/Y' text and adds a meter bar below or beside it. The screen-reader announcement at `ScoreBoard.tsx:25–28` is unchanged."

## Medium

### F-11. Mobile paint performance: "subtle glow" is unbounded
- **Severity:** Medium
- **Description:** Risk #4 acknowledges that box-shadows and text-shadows cost paint time on low-end devices. The mitigation is "limit glow effects to key elements only (not every cell)". The redesign then describes glows on: board border, board wrapper, snake head, obstacle borders, food (existing), scoreboard border, four overlay surfaces, overlay headings, and button hover. That's at least 12 distinct shadow-bearing elements visible at once. The mitigation is correct in spirit but the ceiling is unspecified.
- **Recommendation:** Add a quantitative ceiling to Phase 1: "Glow effects are limited to: (i) one outer `box-shadow` per overlay surface (4 surfaces), (ii) one `text-shadow` per heading (5–6 headings), (iii) snake head, (iv) obstacle edges, (v) scoreboard border, (vi) button hover. Max blur radius: 16px. No glow on individual cells, dpad buttons, toolbar buttons, or the controls row." This prevents overspending.

### F-12. No test-file audit
- **Severity:** Medium
- **Description:** The plan runs `npm test` after each phase and asserts "no test regressions". It does not enumerate the 13 test files or state the principle that an implementer can verify against. Pure CSS changes that preserve all text content should be safe, but a rename of `.scoreboard` to `.arcadeHud` would not break a text-based test — but would break any test that asserts on class names. The plan does not say "all text content, button labels, and ARIA attributes remain identical to the current implementation".
- **Recommendation:** Add to Phase 6 verification: "Read `src/components/__tests__/GameOver.test.tsx`, `src/components/__tests__/LevelTransition.test.tsx`, `src/components/__tests__/Board.test.tsx`, `src/components/__tests__/Cell.test.tsx`, and `src/components/__tests__/Game.test.tsx` to confirm none of the assertions depend on CSS class names that may be renamed during the redesign." Also: state as a principle in the plan: "All text content, button labels, and ARIA attributes remain identical to the current implementation; the visual refresh is presentation-only."

### F-13. `<h1>` decision in Phase 3 is a real JSX change
- **Severity:** Medium
- **Description:** Phase 3's file list says `Game.tsx` requires "No structural changes expected", but the changes section says "remove the standalone `<h1>` above board when overlay is active, or make it larger and more arcade-like". This is a JSX change. (See also F-03.)
- **Recommendation:** Pick one. Recommended: remove the page-level h1 (the idle overlay already shows the title; the page-level h1 is redundant during idle and cluttering during play/pause/gameover/levelComplete). Update Phase 2 to "no JSX changes" and Phase 3 to "remove the `<h1>` at `Game.tsx:131` and rely on the overlay h2 for idle title visibility."

### F-14. ROADMAP.md §M8 is slightly out of sync with current implementation
- **Severity:** Medium
- **Description:** ROADMAP §M8 lists "Level introduction screen" and "Level complete screen" as separate overlay features. Since M4 (per `ADR-003`) these are a single `LevelTransition` overlay. The plan correctly refers to a single overlay, but the ROADMAP text is misleading and the plan's "Future-milestone leakage checked" section does not flag this.
- **Recommendation:** After M8 ships, update ROADMAP §M8 to use "Level transition overlay" (single). The plan should note this as part of the ROADMAP update step.

### F-15. Shadow tokens are color-specific, not generic
- **Severity:** Medium
- **Description:** Plan defines `--shadow-neon-green`, `--shadow-neon-red`, `--shadow-neon-purple`. This bakes the three colors into the shadow tokens. If a future phase needs a yellow shadow (high score) or a white shadow (overlay border), a new token is needed. Not a blocker for M8, but worth noting.
- **Recommendation:** Acceptable for M8 scope. If `--color-warning` (high score) is rendered as `#fbbf24` (gold), the existing `--shadow-neon-purple` token is wrong for it. The plan should either add `--shadow-neon-gold` or define shadows via a single `box-shadow` value per element (not a token). Pick one and stick to it.

### F-16. `ScoreBoard` `levelName` rendering not addressed by the typography pass
- **Severity:** Medium
- **Description:** `ScoreBoard.tsx:10` renders `{level}{levelName ? ` — ${levelName}` : ''}`. The current format is "Level: 1 — First Meal". Phase 1 step 3 says "Define heading styles: `h1`, `h2` using display font; numeric classes `.score-value`, `.level-value` using a monospaced numeric style". The plan defines `.level-value` for the level number but does not specify whether the level name uses the display font or the body font. With a pixel font like "Press Start 2P" (no lowercase), the name "First Meal" cannot render in lowercase. This is a design constraint that the plan does not address.
- **Recommendation:** Specify. Recommended: the level number uses `--font-display` (e.g., "Press Start 2P") so "1" looks arcade-y; the level name uses `--font-body` (system stack) so "First Meal" remains readable and lowercase-capable. The `—` separator remains in `--font-body`.

### F-17. Z-index landscape not enumerated
- **Severity:** Medium
- **Description:** `Game.module.css` uses `z-index: 10` on overlays. The d-pad and controls row are above the board. The plan adds glows on the board wrapper and the overlays. If a glow renders outside its parent's bounding box (a common box-shadow behavior), it could be clipped by a parent or appear above an overlay incorrectly. The plan says "Test overlay stacking and z-index behavior" in Phase 6, but the test is after the fact.
- **Recommendation:** In Phase 5, when adding the board wrapper glow, specify `overflow: visible` (or test that the glow is contained). In Phase 6, the z-index check should be a checkbox: "Overlay z-index 10, no overlap with board wrapper glow at any viewport."

### F-18. The plan's "Plan Review Notes" section is incomplete
- **Severity:** Medium
- **Description:** The "Unnecessary complexity checked" / "Future-milestone leakage checked" / "AGENTS.md compliance" subsections are self-assessed and miss: test file coverage, ARCHITECTURE.md update, package.json version bump, manifest.webmanifest, theme-color meta, font pinning, decorative-element specification. These would all be caught by a fuller internal checklist.
- **Recommendation:** Add to the plan's review notes: "Test files: enumerated and audited (all text content preserved)." "Documentation: SPEC.md, ARCHITECTURE.md, PROJECT_STATE.md, ROADMAP.md, package.json all updated." "PWA: theme-color meta and manifest colors updated to match new tokens." "Font: pinned to a single named family, self-hosted."

## Low

### F-19. "Test count" DoD entry is hand-wavy
- **Severity:** Low
- **Description:** "`npm test` passes — all 178+ tests" — the actual count is 178 (per `ARCHITECTURE.md:271` and `SPEC.md §15`). The "+" is a hedge.
- **Recommendation:** Replace "178+ tests" with "all 178 tests" or "all 178+ tests (count may grow if Phase 2 JSX changes add a ScoreBoard test)."

### F-20. Phase 1 verification "CSS variables are available in browser dev tools" is vague
- **Severity:** Low
- **Description:** "Visual inspection: CSS variables are available in browser dev tools" — the action is unspecified.
- **Recommendation:** Replace with: "Open Chrome DevTools → Elements → inspect `<html>` → Computed → confirm `--color-bg` (and the other 14 tokens) are defined on `:root` with non-empty values. Spot-check a Cell: confirm `var(--color-accent)` resolves to `#22c55e` (or the chosen new value)."

### F-21. No CHANGELOG or version note in `package.json`
- **Severity:** Low
- **Description:** (See F-08.) The version bump is the user-visible release signal.
- **Recommendation:** Addressed by F-08.

### F-22. The PWA install test in Phase 6 is a single bullet
- **Severity:** Low
- **Description:** "PWA install test (dev server, verify in Chrome DevTools)" — the install test should specify what to verify: install prompt fires, app launches in standalone mode, theme color renders correctly, splash background matches the in-game card.
- **Recommendation:** Expand to: "PWA install test (Chrome DevTools → Application → Manifest): confirm `theme_color` and `background_color` match the new tokens; install the PWA on a real device or Android emulator and confirm the splash and address bar match the in-game card on first launch."

---

# Handoff Assessment

## Phase structure

**Verdict:** Mostly good, with two corrections.

The six-phase ordering (tokens → HUD → overlays → level-transition overlay → board/cells → integration cleanup) is sensible. Each phase produces a buildable, test-passing state. The phases are small enough that an AI agent can execute one in a single sitting.

**Issues:**
- Phase 1 is overloaded. It tries to do (a) font self-hosting, (b) color tokens, (c) spacing/shadow/radius/transition tokens, (d) typography classes, (e) PWA theme-color meta, (f) manifest.webmanifest updates, and (g) body/html hardcoded color cleanup. That's seven distinct changes; AI-agent execution benefits from a 3–5 step phase. Consider splitting Phase 1 into "1a: tokens" and "1b: typography + body" with a verification between.
- Phase 2 is mislabeled as "CSS only" when it is actually "CSS + JSX". The label is misleading; an AI agent reading "CSS only" will skip the JSX restructure.
- Phase 6 is doing both "audit hardcoded values" and "responsive verification" and "PWA install test". Three concerns. Consider splitting into "6a: cleanup audit" and "6b: responsive/PWA verification".

## Task decomposition

**Verdict:** Acceptable, with caveats.

Tasks are concrete and file-scoped. CSS-module files are correctly identified. The `Game.tsx` ownership across phases is the only one with a contradiction (F-03, F-13).

**Caveats:**
- "Possible minor JSX restructuring" (Phase 2) needs to become a required step with the new JSX shape spelled out. (F-02)
- "Subtle border glow" (Phase 5 board) is undefined. The plan should specify `box-shadow: 0 0 8px var(--shadow-neon-green)` or similar concrete value.
- "Decorative elements" (Phase 3 game over) is undefined. (F-07)
- The plan should enumerate the 13 test files at the bottom and state the principle that an implementer can verify against. (F-12)

## Verification strategy

**Verdict:** Weak.

The verification steps are "run build", "run test", "visual inspection", "responsive check". For a CSS-only milestone, that's the right kind of verification — but the steps are not specific enough.

**Issues:**
- "Visual inspection: CSS variables are available in browser dev tools" is not an action an AI agent can take. Replace with a specific browser step. (F-20)
- "Visual inspection: ScoreBoard reads as a cohesive arcade panel across mobile and desktop" — at which viewport? With which content? (F-22)
- "PWA install test (dev server, verify in Chrome DevTools)" is one bullet for an entire PWA milestone. (F-22)
- The plan's "Phase 5: Visual inspection: Board has a polished arcade cabinet feel on both desktop and mobile" is a soft verification with no rubric. (F-22)

## Definition of Done

**Verdict:** Strong on intent, weak on completeness.

The DoD is comprehensive and includes build, test, lint, accessibility, responsive, and documentation checks. Two omissions:

- `ARCHITECTURE.md` is not in the documentation list. (F-09)
- `package.json` version bump is not listed. (F-08)

The DoD also includes the right success criteria from the ROADMAP M8 section: "Screenshots appear distinctive", "Visual style feels intentional", "UI no longer resembles a starter template". These are qualitative, but they are the right top-level check.

## AI-agent execution readiness

**Verdict:** Mostly ready, with two blockers.

A second AI agent can read this plan and start Phase 1 with reasonable confidence. The blockers:

1. **Font choice.** Without pinning the font, the agent has to make an irreversible design decision. (F-06)
2. **JSX vs. CSS scope for the ScoreBoard.** The agent will be confused by "Possible" and "No structural changes expected" in two phases. (F-02, F-03)

If these two are resolved, the plan is executable. Phase 1 is heavy (F-PhaseStructure-1) — splitting it into 1a/1b would improve execution confidence.

A test-file audit is missing (F-12). The agent may rename `.scoreboard` to `.hud` and not realize a test asserts on a class name. The probability is low (existing tests use `screen.getByText` not `getByTestId` on class names) but a 5-minute audit is cheap insurance.

The PWA manifest and theme-color meta updates are not in the change list (F-04). An agent following this plan will ship a PWA with a visually inconsistent splash.

---

# Final Recommendation

## Approve with Major Changes

**Rationale:** The plan is well-scoped, well-decomposed, and aligned with the project's philosophy. The phase structure is right; the out-of-scope fence is right; the documentation discipline is right (with two omissions). But the plan has four issues that will block a clean handoff to another AI agent or cause a public-facing regression:

1. **Google Fonts external dependency breaks the offline-first PWA claim** (F-01). This is a public-facing regression in a milestone whose success criterion is "Screenshots appear distinctive." If the screenshot is captured offline, the screenshot doesn't look distinctive.
2. **Phase 2 and Phase 3 contradict each other on JSX scope** (F-02, F-03). An AI agent cannot execute both faithfully.
3. **PWA theme-color and manifest.webmanifest are not in the change list** (F-04). iOS splash and Android address bar will be visually inconsistent with the in-game card.
4. **Font, decorative elements, glow ceilings, and the food-progress presentation are all left to the implementer** (F-06, F-07, F-10, F-11). For a milestone whose deliverable is a "polished, distinctive" visual identity, the plan should pin the design decisions, not defer them to the implementer.

None of these are deal-breakers individually. Together, they make a second-iteration almost certain: the implementer will either make the wrong call or produce a result that doesn't match the user's vision, and a follow-up milestone (or a follow-up phase) will be needed to fix the gaps.

**To upgrade this to "Approve with Minor Changes":** Resolve F-01, F-02, F-03, F-04, F-06, F-07, F-10, F-11 in a revision. The other 14 findings are nice-to-haves; the eight above are the must-haves.

**Specific changes to make before approval:**

1. Pin the font (F-06) and decide on self-hosting vs. CDN (F-01). If CDN, amend the offline-first claim in `ARCHITECTURE.md` and `SPEC.md`. If self-hosted, add a Phase 1 sub-step for the `@font-face` block and woff2 placement.
2. Make Phase 2's JSX restructure a required step with the new `ScoreBoard.tsx` shape spelled out (F-02).
3. Move the `<h1>` decision out of Phase 3 and resolve the contradiction with Phase 2 (F-03, F-13).
4. Add `index.html` `theme-color` and `vite.config.ts` (or equivalent) PWA manifest block updates to the change list (F-04).
5. Replace "decorative" with concrete specifications or remove the decorative elements (F-07).
6. Pin the food-progress presentation: text-augmenting meter bar, screen-reader text unchanged (F-10).
7. Add a quantitative glow ceiling to Phase 1 (F-11).
8. Add `package.json` version bump (0.7.0 → 0.8.0) to Phase 6 (F-08).
9. Add `ARCHITECTURE.md` to the DoD documentation list and Phase 6 file list (F-09).
10. Add a test-file audit step to Phase 6 (F-12).

After these ten changes, this is a clean, executable plan that an AI agent can pick up and ship.
