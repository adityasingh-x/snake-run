# Milestone 8 — Visual Identity Implementation Plan

**Status:** Active  
**Created:** 2026-06-07  
**Target:** Retro Arcade Neon visual style

---

## Problem Statement

Current presentation resembles a default application rather than a game. Screenshots are not distinctive, the visual style lacks intentionality, and UI reads like a starter template.

---

## Theme Direction

**Retro Arcade Neon**

- Dark background
- Bright accent colors
- Strong visual hierarchy
- Clean readability

Avoid: flashing effects, excessive particles, visual clutter.

---

## Scope

### In Scope

1. **CSS Variable System** — Centralize colors, spacing, shadows, and typography tokens
2. **Typography Pass** — Import a display font for headings/numerics, define a consistent scale
3. **HUD Redesign** — Arcade-style status panel (ScoreBoard) with visual grouping and emphasis
4. **Overlay Redesign** — Polished start, pause, game over, win, and level transition screens
5. **Board Polish** — Refined grid border, cell styling, and game element visuals
6. **Controls Polish** — D-pad and toolbar buttons with cohesive arcade styling

### Out of Scope

- New UI components or layout changes
- Animation beyond existing pulse/keyframe animations
- Audio changes
- New fonts beyond one display font family
- Gameplay or state machine changes
- Adding particles, scanlines, or CRT effects
- Theme switching or customization

---

## Phases

Each phase is independently executable and verifiable. Phases are ordered by dependency.

---

### Phase 1: CSS Variable System & Typography Foundation

**Files:**
- `src/index.css` — Add CSS custom properties and `@font-face` block
- `public/fonts/` — Place self-hosted `woff2` font file
- `index.html` — Update `<meta name="theme-color">`
- `vite.config.ts` — Update PWA manifest `theme_color` and `background_color`, extend workbox glob to include `woff2`

**Changes:**
1. **Font choice:** Use **"Press Start 2P"** (self-hosted `woff2` in `public/fonts/`). Add an `@font-face` block in `index.css` with `font-display: swap;`. This preserves the offline-first PWA guarantee — the `woff2` is pre-cached by the existing workbox glob. Numeric values (score, level numbers) use a system mono stack via `--font-mono` (not the pixel font, which is unreadable at body sizes). The level name text (e.g., "First Meal") uses `--font-body` (system stack) so lowercase and readability are preserved.
2. Define CSS custom properties on `:root` in `index.css`:
   - **Colors** (one-to-one mapping of every existing hex):
     | Token | Value | Usage |
     |---|---|---|
     | `--color-bg` | `#1a1a2e` | Page background |
     | `--color-surface` | `#16213e` | Game card / overlay surface |
     | `--color-board-bg` | `#0f172a` | Board background |
     | `--color-text-primary` | `#f8fafc` | Headings, values, primary text |
     | `--color-text-body` | `#eee` | Global body text |
     | `--color-text-label` | `#94a3b8` | Score labels, secondary text |
     | `--color-text-hint` | `#64748b` | Hint text |
     | `--color-text-on-accent` | `#0f172a` | Text on green buttons |
     | `--color-accent-soft` | `#4ade80` | Primary button fill, win heading, title |
     | `--color-accent` | `#22c55e` | Snake head, button hover/active |
     | `--color-accent-deep` | `#16a34a` | Snake body |
     | `--color-danger` | `#ef4444` | Food, game over heading |
     | `--color-warning` | `#fbbf24` | High score gold |
     | `--color-obstacle` | `#6366f1` | Obstacle fill |
     | `--color-obstacle-edge` | `#818cf8` | Obstacle border |
     | `--color-border-default` | `#475569` | Button/dropdown borders |
     | `--color-board-border` | `#334155` | Board border |
     | `--color-cell-border` | `#1e293b` | Grid cell border |
   - **Typography:** `--font-display` ("Press Start 2P"), `--font-body` (system stack), `--font-mono` (system mono for numbers/score)
   - **Spacing:** `--space-xs` through `--space-xl`
   - **Shadows:** `--shadow-neon-green`, `--shadow-neon-red`, `--shadow-neon-gold`, `--shadow-neon-purple`
   - **Border radius:** `--radius-sm`, `--radius-md`, `--radius-lg`
   - **Transitions:** `--transition-fast`, `--transition-normal`
3. **Glow ceiling:** Glow effects (`box-shadow`, `text-shadow`) are limited to: (i) one outer `box-shadow` per overlay surface (4 surfaces), (ii) one `text-shadow` per heading (5–6 headings), (iii) snake head, (iv) obstacle edges, (v) scoreboard border, (vi) button hover. Max blur radius: **16px**. No glow on individual cells, D-pad buttons, or toolbar buttons. No more than 6 elements with `box-shadow` visible simultaneously.
4. Define heading styles: `h1`, `h2` using display font; numeric classes `.score-value`, `.level-value` using `--font-mono`; level name text uses `--font-body`.
5. Remove hardcoded color values from `index.css` body/html rules, referencing variables instead.
6. Update `index.html` `<meta name="theme-color">` from `#16213e` to `var(--color-surface)` value (`#16213e` — unchanged unless the surface color changes).
7. Update `vite.config.ts` PWA manifest `theme_color` and `background_color` to match the new `--color-surface` and `--color-bg`.
8. Extend workbox `globPatterns` in `vite.config.ts` from `**/*.{js,css,html,svg,png}` to `**/*.{js,css,html,svg,png,woff2}`.

**Verification:**
- `npm run build` passes with no errors
- Open Chrome DevTools → Elements → inspect `<html>` → Computed → confirm all 18 color tokens, font tokens, shadow tokens, spacing tokens, radius tokens, and transition tokens are defined on `:root` with non-empty values. Spot-check a Cell element: confirm `var(--color-accent)` resolves to `#22c55e`.
- No visual regression on existing elements (colors match previous hardcoded values)
- `dist/manifest.webmanifest` contains updated `theme_color` and `background_color`

**Risk:** Self-hosted font requires a `woff2` file (~12KB for "Press Start 2P"). Mitigation: `font-display: swap` ensures text is readable immediately with system fallback; the font loads asynchronously without blocking render.

---

### Phase 2: ScoreBoard HUD Redesign

**Files:**
- `src/components/ScoreBoard.tsx` — Required JSX restructuring (add grouping wrappers)
- `src/components/ScoreBoard.module.css` — Complete style rewrite

**Principal constraint:** All text content, button labels, and ARIA attributes remain identical to the current implementation. The visual refresh is presentation-only.

**Changes:**
1. **Required JSX restructuring** — Replace the current four flat `<div className={styles.score}>` rows with an arcade-style panel. New target JSX shape:
   ```jsx
   <div className={styles.scoreboard} aria-live="polite">
     <div className={styles.section}>
       <span className={styles.label}>Level:</span>
       <span className={styles.levelValue}>{level}</span>
       {levelName && <span className={styles.levelName}> — {levelName}</span>}
     </div>
     <div className={styles.separator} />
     <div className={styles.section}>
       <span className={styles.label}>Food:</span>
       <span className={styles.foodText}>{foodEaten}/{foodRequired}</span>
       <div className={styles.foodMeter}>
         <div className={styles.foodMeterFill} style={{ width: `${(foodEaten / foodRequired) * 100}%` }} />
       </div>
     </div>
     <div className={styles.separator} />
     <div className={styles.section}>
       <span className={styles.label}>Score:</span>
       <span className={styles.scoreValue}>{score}</span>
     </div>
     <div className={styles.separator} />
     <div className={`${styles.section} ${styles.highScoreSection}`}>
       <span className={styles.label}>High Score:</span>
       <span className={styles.highScoreValue}>{highScore}</span>
     </div>
   </div>
   ```
2. Redesign the ScoreBoard as an arcade-style status panel:
   - Background: semi-transparent dark panel with subtle border glow
   - Layout: horizontal bar with visual separators (`.separator`) between sections
   - Level display: level number uses `--font-display` ("Press Start 2P"), level name uses `--font-body` (system stack, preserves lowercase readability for names like "First Meal")
   - Food progress: compact meter bar below the text. **The text "Food: X/Y" remains visible and the screen-reader announcement is unchanged.** The meter is a visual aid, not a text replacement.
   - Score: `--font-mono` (system mono stack, readable at numeric sizes)
   - High Score: gold/yellow accent color (`--color-warning`) on the value. Drop "crown-like treatment" — the gold color and typography carry the visual distinction.
3. Use CSS variables exclusively (no hardcoded colors)
4. Ensure responsive layout at 600px breakpoint
5. Keep `aria-live` regions and screen-reader-only content unchanged

**Verification:**
- `npm run build` passes
- `npm test` passes (all tests check text content, button labels, and ARIA attributes — unchanged)
- Visual inspection: ScoreBoard reads as a cohesive arcade panel across mobile and desktop. Food meter fills proportionally.

---

### Phase 3: Overlay Redesign — Idle, Pause, GameOver, Win

**Files:**
- `src/components/Game.tsx` — Remove page-level `<h1>Snake Run</h1>` at line 131 (redundant with idle overlay's `<h2>Snake Run</h2>`). No other JSX changes.
- `src/components/Game.module.css` — Idle/pause overlay styles, title removal cleanup
- `src/components/GameOver.module.css` — Complete style rewrite
- `src/components/GameOver.tsx` — No structural changes expected

**Changes:**
1. **Remove page-level `<h1>`** from `Game.tsx:131`. The idle overlay already shows `<h2>Snake Run</h2>` at `Game.tsx:189`. The page-level h1 is redundant during idle and clutters the layout during play/pause/gameover/levelComplete. Rely on the overlay h2 for idle title visibility.
2. **Idle overlay ("Snake Run" start screen):**
   - Display font for title (`<h2>Snake Run</h2>` already present)
   - Animated subtitle text ("Use arrow keys or WASD to move") with bright accent color
   - "Start Game" button: neon-green glow border, larger padding, display font for button text
   - Top accent line: use a reusable `.neon-divider` class (`border-top: 2px solid; border-image: linear-gradient(90deg, transparent, var(--color-accent), transparent) 1;`)
3. **Pause overlay:**
   - Consistent visual language with idle overlay
   - "Paused" in display font
   - "Resume" button matches start button style
4. **GameOver overlay:**
   - "Game Over!" in display font, red neon glow text-shadow (`var(--shadow-neon-red)`)
   - Score displayed prominently in `--font-mono`
   - "Game Over" heading divider: reuse the `.neon-divider` class with `--color-danger`
   - Buttons: "Continue from Level N" with green glow (primary), "New Game" with muted border (secondary)
5. **Win overlay:**
   - "You Win!" in display font, green/gold neon glow (`var(--shadow-neon-green)`)
   - Same button layout as GameOver

**Verification:**
- `npm run build` passes
- `npm test` passes (GameOver tests verify button presence and callbacks; Game tests verify overlay rendering)
- Visual inspection: All overlays feel like part of the same game
- Keyboard navigation: Space and Enter work as before on all overlays

---

### Phase 4: Overlay Redesign — LevelTransition

**Files:**
- `src/components/LevelTransition.module.css` — Complete style rewrite

**Changes:**
1. Redesign the level transition overlay with arcade aesthetic:
   - "Level N Complete" in display font with green glow (`var(--shadow-neon-green)`)
   - `.neon-divider` separator line below heading (reuse the same class defined in Phase 3)
   - Completed level name as subtitle in `--font-body`
   - Next level preview section with distinct background (subtle card using `--color-board-bg`)
   - "Next: Level Name" label in `--color-text-label`, description in `--color-text-hint`
   - Score display in `--font-mono`
   - "Continue" button with neon glow (matches other primary buttons)
   - Visual consistency with other overlays (same `.neon-divider`, same button patterns)

**Verification:**
- `npm run build` passes
- `npm test` passes (LevelTransition tests)
- Visual inspection: Overlay feels polished, arcade-like, and consistent with idle/pause/gameover overlays

---

### Phase 5: Board & Game Elements Polish

**Files:**
- `src/components/Board.module.css` — Border and background refinement
- `src/components/Cell.module.css` — Subtle element tweaks
- `src/components/Game.module.css` — Board wrapper glow, D-pad and toolbar polish, `.boardWrapper` `overflow: visible`

**Changes:**
1. **Board:**
   - Replace plain `#334155` border with subtle glow border (using CSS variable shadow, max blur 16px)
   - Add subtle inner shadow or gradient to board background
2. **Cells:**
   - Empty cells: slightly darker/transparent grid lines for a cleaner look
   - Snake head: maintain existing green glow, keep directional eyes
   - Food: keep existing pulse animation and red color
   - Obstacles: maintain existing indigo/glow, possibly add subtle border-radius
3. **Board wrapper:**
   - Add subtle outer glow effect to the board container (within the 16px blur ceiling)
   - Set `overflow: visible` on `.boardWrapper` if the box-shadow renders outside bounds, to prevent clipping
4. **D-pad buttons:**
   - Update colors to use CSS variables for consistency
   - More arcade-like active state (subtle glow on press, within the glow ceiling)
5. **Toolbar buttons:**
   - Use CSS variables for consistent styling
   - Subtle glow on hover within the glow ceiling
6. **Z-index check:** Overlay `z-index: 10` must not be overlapped by the board wrapper glow. Test that the board wrapper glow is contained behind overlays at all viewports.

**Verification:**
- `npm run build` passes
- `npm test` passes (Board test checks rendering)
- Visual inspection: Board has a polished arcade cabinet feel on both desktop and mobile
- Z-index: Overlays render above board wrapper glow at all viewport sizes

---

### Phase 6: Integration, Responsive Polish & Cleanup

**Files:**
- `package.json` — Version bump
- `src/components/Game.module.css` — Responsive adjustments
- `src/index.css` — Any remaining hardcoded values
- `ARCHITECTURE.md` — Update Styling Conventions section
- `docs/ROADMAP.md` — M8 status update, fix "Level introduction/complete" to "Level transition overlay"
- `docs/PROJECT_STATE.md` — Version bump, milestone status, priorities
- `SPEC.md` — Section 14 (Styling) revised

**Changes:**
1. Bump `package.json` version from `0.7.0` to `0.8.0`.
2. Audit all CSS files for remaining hardcoded color/typography values; migrate to variables.
3. Verify all responsive breakpoints work correctly with new styles.
4. Ensure mobile layout (600px breakpoint, landscape <500px, pointer: coarse) still looks correct.
5. Test overlay stacking and z-index behavior (overlay `z-index: 10` renders above board wrapper glow).
6. Remove any unused CSS classes or rules introduced during previous phases.
7. **Test-file audit:** Read `src/components/__tests__/GameOver.test.tsx`, `src/components/__tests__/LevelTransition.test.tsx`, `src/components/__tests__/Board.test.tsx`, `src/components/__tests__/Cell.test.tsx`, and `src/components/__tests__/Game.test.tsx` to confirm none of the assertions depend on CSS class names that may have been renamed during the redesign. All tests are expected to pass since text content, button labels, and ARIA attributes are preserved.
8. Update `ARCHITECTURE.md` "Styling Conventions" section to reference the new CSS variable token system and the self-hosted "Press Start 2P" font choice.
9. Update `ROADMAP.md` §M8 to use "Level transition overlay" (single) — matching ADR-003 — instead of "Level introduction screen" + "Level complete screen". Move M8 to Completed.
10. Update `SPEC.md` Section 14 (Styling) to reflect the new visual identity, token system, and font choice.
11. Update `docs/PROJECT_STATE.md` — version bump to 0.8.0, M8 marked complete, current priorities updated.

**Verification:**
- `npm run build` passes with no warnings
- `npm test` passes — all 178 tests
- `npm run lint` passes
- Viewport inspection rubric:
  - **320px wide:** no horizontal scrollbar; all overlay buttons ≥ 44px hit target.
  - **375px (iPhone SE):** idle overlay text fits without ellipsis; ScoreBoard wraps gracefully.
  - **600px (tablet portrait):** ScoreBoard is single-row; controls toolbar is right-aligned.
  - **768px (tablet landscape):** default layout, no media query changes.
  - **1200px+ (desktop):** board is `min(90vw, 70dvh, 400px)` and centered.
- PWA install test (Chrome DevTools → Application → Manifest): confirm `theme_color` and `background_color` match the new tokens; install the PWA on a real device and confirm the splash and address bar match the in-game card on first launch.

---

## Files Expected to Change (Summary)

| File | Phase | Type of Change |
|------|-------|---------------|
| `public/fonts/` | 1 | Add self-hosted `woff2` font file |
| `index.html` | 1 | Update `<meta name="theme-color">` |
| `src/index.css` | 1, 6 | Add CSS custom properties, `@font-face`, typography rules; cleanup |
| `vite.config.ts` | 1 | Update PWA manifest colors, extend workbox glob |
| `src/components/ScoreBoard.tsx` | 2 | Required JSX restructuring (grouping wrappers, food meter) |
| `src/components/ScoreBoard.module.css` | 2 | Complete style rewrite |
| `src/components/Game.tsx` | 3 | Remove page-level `<h1>` (line 131) |
| `src/components/Game.module.css` | 3, 5, 6 | Overlay, board wrapper, D-pad, toolbar, responsive |
| `src/components/GameOver.module.css` | 3 | Complete style rewrite |
| `src/components/LevelTransition.module.css` | 4 | Complete style rewrite |
| `src/components/Board.module.css` | 5 | Border, background refinement |
| `src/components/Cell.module.css` | 5 | Subtle element tweaks |
| `package.json` | 6 | Version bump 0.7.0 → 0.8.0 |
| `ARCHITECTURE.md` | 6 | Update Styling Conventions section |
| `docs/ROADMAP.md` | 6 | M8 completed, fix overlay naming |
| `docs/PROJECT_STATE.md` | 6 | Version bump, milestone status, priorities |
| `SPEC.md` | 6 | Section 14 (Styling) revised |
| `src/components/GameOver.tsx` | — | No changes expected |
| `src/components/LevelTransition.tsx` | — | No changes expected |
| `src/components/Board.tsx` | — | No changes expected |
| `src/components/Cell.tsx` | — | No changes expected |

---

## Risks & Assumptions

### Risks
1. **Font file size** — "Press Start 2P" `woff2` is ~12KB. Mitigation: `font-display: swap` in `@font-face` ensures text is readable immediately with system fallback; the font loads asynchronously without blocking render.
2. **CSS variable browser support** — Works in all modern browsers. No mitigation needed (the project already targets modern browsers).
3. **Visual regression** — Hardcoded color changes could break contrast or readability. Mitigation: each phase includes verification; variables match current hex values initially using the one-to-one mapping table in Phase 1.
4. **Mobile performance** — Box shadows and text-shadows can cause paint performance issues on low-end devices. Mitigation: glow ceiling (max 16px blur, max 6 simultaneous shadow elements, no glow on individual cells or D-pad/toolbar buttons). See Phase 1 glow ceiling specification.
5. **PWA splash/theme consistency** — Mismatch between manifest colors and in-game card. Mitigation: Phase 1 updates `index.html` `<meta name="theme-color">` and `vite.config.ts` manifest colors to match tokens; Phase 6 PWA install test verifies.
6. **JSX restructure in ScoreBoard** — Required structural changes could break tests. Mitigation: all text content, button labels, and ARIA attributes are preserved; test-file audit in Phase 6 confirms no class-name-dependent assertions.

### Assumptions
1. One display font family ("Press Start 2P") is sufficient; no need for multiple custom fonts.
2. Numeric values use system mono stack (not the pixel font, which is unreadable at body sizes).
3. Level name text uses `--font-body` (system stack) to preserve lowercase readability for names like "First Meal".
4. Existing `aria-*` attributes and accessibility features are preserved as-is.
5. The board's `aspect-ratio` and responsive sizing logic remains unchanged.
6. "Press Start 2P" is available under a license compatible with self-hosting (OFL license).

---

## Definition of Done (Milestone Level)

- [ ] `npm run build` completes with zero errors
- [ ] `npm test` passes — all 178 tests remain green (no test regressions)
- [ ] `npm run lint` passes with zero errors
- [ ] CSS variables defined in `index.css` (18 color tokens, 3 font tokens, spacing, shadow, radius, transition tokens) and used consistently across all component styles
- [ ] Self-hosted "Press Start 2P" font loads via `@font-face` with `font-display: swap` and is pre-cached by the PWA workbox
- [ ] Display font renders for headings; numeric values use system mono stack; level name text uses body font
- [ ] ScoreBoard reads as a cohesive arcade-style HUD panel with food meter bar
- [ ] All overlays (idle, pause, gameover, win, levelComplete) share consistent visual language with reusable `.neon-divider` class
- [ ] Board has polished border and background treatment with glow effects within the 16px blur ceiling
- [ ] Visual style feels intentional and distinctive — no longer resembles a starter template
- [ ] Responsive layout verified on mobile and desktop viewports (320px–1200px+ inspection rubric)
- [ ] No hardcoded color values remain in component CSS (all use variables)
- [ ] Keyboard and touch controls function identically to before
- [ ] Accessibility (aria labels, live regions, focus management) is preserved
- [ ] `index.html` `<meta name="theme-color">` and `vite.config.ts` PWA manifest colors match new tokens
- [ ] `package.json` version bumped from `0.7.0` to `0.8.0`
- [ ] `ARCHITECTURE.md` Styling Conventions section updated to reference token system and font choice
- [ ] `SPEC.md` Section 14 (Styling) revised to reflect new visual identity
- [ ] `docs/ROADMAP.md` updated — Milestone 8 marked complete, overlay naming fixed to "Level transition overlay"
- [ ] `docs/PROJECT_STATE.md` updated — version bump, milestone status, priorities
- [ ] PWA install verified: splash and address bar match in-game card on first launch

---

## Plan Review Notes

### Revision notes (2026-06-07):
This plan was revised after a staff engineer review (see `plans/PLAN_REVIEW.md`). All Critical and High findings were resolved:
- Font: Pinned to "Press Start 2P", self-hosted `woff2` (F-01, F-06)
- JSX scope: Phase 2 restructure made required with explicit target JSX; Phase 3 `<h1>` removal explicitly owned (F-02, F-03, F-13)
- PWA: `theme-color` meta and manifest colors added to Phase 1 change list (F-04)
- Color tokens: Expanded to 18 tokens covering every existing hex (F-05)
- Decorative terms: Replaced with concrete `.neon-divider` class; dropped "crown-like" (F-07)
- Version bump: `package.json` 0.7.0 → 0.8.0 added to Phase 6 (F-08)
- Documentation: `ARCHITECTURE.md` added to DoD and Phase 6 (F-09)
- Food progress: Pinned to text-augmenting meter bar (F-10)
- Glow ceiling: Quantitative limits added to Phase 1 (F-11)
- Test audit: Phase 6 includes test-file read step and preservation principle (F-12)
- Shadow tokens: Added `--shadow-neon-gold` (F-15)
- Level name typography: Pinned to `--font-body` for readability (F-16)
- Z-index: Explicit check added to Phase 5 and Phase 6 (F-17)
- Viewport rubric: Specific breakpoints and criteria added to Phase 6 (F-22)
- ROADMAP naming: "Level introduction/complete" → "Level transition overlay" noted (F-14)

Low findings accepted as minor: F-19 (test count fixed), F-20 (verification made concrete), F-21 (covered by F-08), F-22 (PWA test expanded).

### Pre-existing self-check notes:

### Unnecessary complexity checked:
- Single display font, not multiple
- CSS variables only (no CSS-in-JS, no theming library)
- One new JSX structure (ScoreBoard), one JSX removal (page-level h1)
- No animation framework — only CSS keyframes (already used)

### Future-milestone leakage checked:
- No achievement/statistics UI (Milestone 9)
- No food variant visuals (Milestone 10)
- No particle effects (Milestone 12)
- No theme switching (Milestone 12)
- No audio changes (Milestone 12)

### Documentation coverage checked:
- `SPEC.md`: Section 14 (Styling) updated
- `ARCHITECTURE.md`: Styling Conventions section updated with token system and font
- `PROJECT_STATE.md`: Version bump, milestone status, priorities
- `ROADMAP.md`: M8 completed, overlay naming fixed
- `package.json`: Version bump 0.7.0 → 0.8.0

### PWA coverage checked:
- `index.html` `<meta name="theme-color">` updated
- `vite.config.ts` manifest `theme_color` and `background_color` updated
- Workbox glob extended to include `woff2`
- Font self-hosted, pre-cached by PWA

### Test coverage checked:
- All 178 tests expected to pass (text content, button labels, ARIA attributes preserved)
- Test-file audit enumerates key test files
- No class-name-dependent assertions in existing tests (confirmed by current test patterns using `screen.getByText`)

### AGENTS.md compliance:
- Touch only what's needed
- Respect local style (CSS Modules, existing class naming conventions)
- No speculative architecture
- Update ROADMAP.md, PROJECT_STATE.md, SPEC.md, ARCHITECTURE.md as part of completion
