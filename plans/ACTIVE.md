# Milestone 2 — Mobile Experience Plan ✅ COMPLETED

## Goal

Make Snake Run feel native, fun, and reliable on mobile browsers. Lock down the
viewport so the page cannot scroll, zoom, or pull-to-refresh during play.
Rework the swipe recognizer so swipes are predictable. Add an on-screen pause
control. Make the board and D-pad adapt to phone screens in both portrait and
landscape, and respect iOS safe-area insets.

## Current State (Observed Issues)

Reported by manual testing on mobile browsers and confirmed against the code:

1. **No pause button.** The only way to pause is the Space key. On a phone with
   no hardware keyboard, the game cannot be paused. See `src/components/Game.tsx:113-112`
   (overlays exist but no touch-friendly pause trigger).
2. **Page scrolls during swipes.** `body` has no `overflow: hidden` and no
   `touch-action: none`. A horizontal drag pans the page. See `src/index.css:7-15`.
3. **Pull-to-refresh reloads the game on vertical swipe-down.** Chrome's
   pull-to-refresh triggers because `overscroll-behavior` is not set anywhere.
4. **Double-tap zooms the page.** The board has no `touch-action: manipulation`
   or `touch-action: none`, so a quick double-tap on the board area triggers
   browser zoom.
5. **iOS address bar collapse shifts the layout.** `body` uses `min-height: 100vh`
   instead of `100dvh` and is not `position: fixed`, so the address bar
   collapse on iOS Safari resizes the page mid-game.
6. **Awful swipe detection.** `src/platform/touch.ts:3` uses a 30px threshold
   with no axis locking, no progress feedback, no cooldown, and no handling of
   diagonals or interruptions. Short taps and diagonals register as swipes.
7. **Fixed 400px board.** The board is hard-coded at 400x400. On small phones
   the cells are too small; on large phones the board does not fill the screen.
8. **D-pad always visible on touch devices.** Even during the idle / paused /
   gameover overlays the D-pad is shown, crowding the screen.
9. **No safe-area padding.** Content sits under the iPhone notch and home
   indicator on notched devices.
10. **iOS PWA-friendly meta tags missing.** No `apple-mobile-web-app-capable`,
    no `theme-color`, no `viewport-fit=cover` in `index.html`.

## Non-Goals (Out of Scope for this Plan)

- PWA manifest, install banner, offline support → Milestone 3
- Capacitor / Tauri packaging → Milestones 6, 7
- Onboarding / first-run tutorial → Milestone 4
- Visual polish beyond layout (animations, juice) → Milestone 5
- Settings menu / swipe-vs-d-pad toggle → Milestone 4 / 5
- Switching to canvas, changing the render pipeline
- Changing game logic, collision rules, scoring, or level progression

## Success Criteria

- [ ] Page cannot be scrolled, pinched, or double-tap zoomed during play.
- [ ] Vertical swipe-down does NOT trigger pull-to-refresh.
- [ ] A pause button is visible on touch devices while the game is `playing`
      and pauses the game on tap.
- [ ] Swipes are reliable: a swipe in one of the four cardinal directions
      triggers exactly one direction change. Diagonals, short taps, slow
      drags, and interrupted gestures produce no swipe.
- [ ] The board fits the viewport at any phone size, portrait or landscape,
      without overflow or horizontal scroll.
- [ ] D-pad is comfortably reachable with thumbs and hidden during overlays.
- [ ] Safe-area insets are respected on notched devices.
- [ ] The existing 95 unit tests still pass; new tests cover the gesture
      recognizer, the on-screen pause button, and responsive board sizing.
- [ ] No new TypeScript or lint errors.
- [ ] `SPEC.md`, `ARCHITECTURE.md`, `docs/PROJECT_STATE.md`, and
      `docs/ROADMAP.md` are updated to reflect the new behavior.

## Affected Files (Summary)

- `index.html` — viewport meta, iOS PWA-friendly meta, theme color
- `src/index.css` — body / html lock-down, safe-area-aware sizing, webkit defaults
- `src/components/Game.tsx` — pause button, d-pad visibility gating
- `src/components/Game.module.css` — pause button styles, responsive layout,
  safe-area padding, d-pad sizing
- `src/components/Board.tsx` — CSS-only cell sizing (drop inline pixel sizes)
- `src/components/Board.module.css` — responsive board sizing, `touch-action: none`
- `src/components/Cell.module.css` — confirm cells use `100%` / `1fr` so the
  grid layout owns the size
- `src/platform/touch.ts` — new `createGestureRecognizer` with axis locking,
  progress, cooldown
- `src/hooks/useTouch.ts` — adapt to new recognizer
- `src/platform/__tests__/touch.test.ts` (new) — pure-logic tests for the
  recognizer
- `src/hooks/__tests__/useTouch.test.tsx` (new) — hook integration test
- `src/components/__tests__/Game.test.tsx` (new) — pause button rendering &
  interaction
- `SPEC.md`, `ARCHITECTURE.md`, `docs/PROJECT_STATE.md`, `docs/ROADMAP.md` —
  updated after implementation

---

## Execution Steps

### Step 1 — Lock the viewport and prevent page-level gestures

Goal: Page cannot scroll, zoom, or pull-to-refresh while playing.

**`index.html` changes:**

Replace the viewport meta and add iOS-friendly meta tags:

```html
<meta
  name="viewport"
  content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover"
/>
<meta name="theme-color" content="#16213e" />
<meta name="apple-mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
<meta name="mobile-web-app-capable" content="yes" />
```

Notes:

- `user-scalable=no` is intentional. The game is fast-paced; we trade
  browser-level text-zoom accessibility for predictable touch behavior. The
  trade-off is documented in SPEC.md.
- `viewport-fit=cover` is required for `env(safe-area-inset-*)` to work on iOS.

**`src/index.css` changes:**

Replace the existing body / html / #root rules with:

```css
html,
body {
  margin: 0;
  padding: 0;
  width: 100%;
  height: 100dvh;
  overflow: hidden;
  overscroll-behavior: none;
  background: #1a1a2e;
  color: #eee;
  font-family: system-ui, -apple-system, sans-serif;
}

body {
  position: fixed;
  inset: 0;
  touch-action: none;
  -webkit-touch-callout: none;
  -webkit-user-select: none;
  user-select: none;
  display: flex;
  justify-content: center;
  align-items: center;
}

#root {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
  touch-action: none;
}
```

Keep the `.sr-only` rule unchanged.

**Verification:**

- `npm run lint`
- `npm run build`
- Open the production build in Chrome DevTools device emulation (iPhone 12
  portrait, Pixel 5). Verify:
  - vertical drag on the board does NOT scroll the page or trigger
    pull-to-refresh.
  - pinch with two fingers does NOT zoom.
  - double-tap on the board does NOT zoom.

---

### Step 2 — Replace the swipe recognizer in `src/platform/touch.ts`

Goal: Predictable, axis-locked, distance-aware swipes with a clean API.

**Replace** the file with a richer recognizer. Required behavior:

```ts
import type { Direction } from '../game/types';

export interface SwipeEvent {
  direction: Direction;
  distance: number; // pixels
}

export interface SwipeProgress {
  candidate: Direction | null;
  progress: number; // 0..1 of the lock threshold
}

export interface GestureRecognizerOptions {
  onSwipe: (e: SwipeEvent) => void;
  onProgress?: (e: SwipeProgress) => void;
  lockThreshold?: number;   // default 24
  triggerThreshold?: number; // default 36
  axisRatio?: number;        // default 1.5 — |dx|/|dy| must exceed to commit
  cooldownMs?: number;       // default 80
}

export interface GestureRecognizer {
  attach(el: HTMLElement, enabled: boolean): void;
  detach(): void;
  setEnabled(value: boolean): void;
}

export function createGestureRecognizer(
  opts: GestureRecognizerOptions
): GestureRecognizer { /* ... */ }
```

Implementation rules (must be in code AND documented in SPEC.md):

- `touchstart` records `(x, y, t)` on the element via `data-touch-start`.
- `touchmove` (non-passive) reads the latest sample, computes `dx` and `dy`,
  and emits `onProgress` with the current candidate direction and
  `min(|dx|, |dy|) / lockThreshold` clamped to 1.
- The candidate axis is locked on the first move whose cumulative
  `|dx| + |dy|` exceeds `lockThreshold` (whichever of `|dx|` or `|dy|` is
  larger at that point becomes the axis). Subsequent moves cannot switch
  axis.
- `touchend` fires `onSwipe` exactly once IFF the locked axis's distance is
  at least `triggerThreshold` AND `|dx| > |dy| * axisRatio` (or vice versa
  for vertical). Otherwise the gesture is discarded.
- `touchcancel` resets state silently.
- A cooldown of `cooldownMs` between consecutive swipes prevents
  double-triggering at the boundary.
- All listeners are attached with `{ passive: false }` (we never call
  `preventDefault` today, but the non-passive option leaves room for it).
  Combined with `touch-action: none` on the bound element, the page never
  receives the gesture.
- State is held in closure variables, not on the DOM, to avoid collisions
  between rapid gestures.

**`src/hooks/useTouch.ts` changes:**

Update to use `createGestureRecognizer`. Keep the public API of `useTouch`
the same (`{ onSwipe, enabled, boardRef }`) so `Game.tsx` does not need to
change shape. Internally, `onSwipe(direction)` from the hook is wrapped to
call the recognizer's `onSwipe: (e) => userOnSwipe(e.direction)`.

**`src/components/Game.module.css` changes:**

Apply `touch-action: none` and `overscroll-behavior: none` to the game
container, board wrapper, and board. Keep the existing
`@media (hover: none) and (pointer: coarse)` rule that sets
`touch-action: none` on `.boardWrapper`, but lift the rule to apply on all
viewports for defense-in-depth.

```css
.gameContainer {
  /* existing rules */
  touch-action: none;
  overscroll-behavior: none;
}

.boardWrapper {
  /* existing rules */
  touch-action: none;
  overscroll-behavior: none;
}
```

**Verification:**

- Existing swipe tests (if any) still pass.
- New unit tests in Step 8 cover the recognizer.

---

### Step 3 — Add an on-screen pause button

Goal: Mobile users can pause without a keyboard.

**`src/components/Game.tsx` changes:**

- Add a `handlePause` callback that calls `pauseGame()` (no `initAudio`
  call — audio is already initialized by the time we are playing).
- Render a `<button>` as a child of `.boardWrapper`, absolutely positioned
  in the top-right corner. It is:
  - rendered only when `state.status === 'playing'`
  - hidden on devices without coarse pointer (CSS media query)
  - `aria-label="Pause game"`, `type="button"`, `autoFocus={false}` so it
    does not steal focus from the board
  - `touch-action: manipulation` so taps don't double-fire or zoom
- Keep the existing `useKeyboard` `onPause: pauseGame` wiring unchanged.
- Compute `const showDpad = state.status === 'playing' || state.status === 'paused'`
  and apply `${styles.dpad} ${showDpad ? '' : styles.dpadHidden}` to gate
  the d-pad the same way the pause button is gated.

**`src/components/Game.module.css` changes:**

```css
.pauseButton {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 44px;
  height: 44px;
  display: none;
  align-items: center;
  justify-content: center;
  background: rgba(15, 23, 42, 0.7);
  color: #f8fafc;
  border: 2px solid #475569;
  border-radius: 8px;
  font-size: 1.2rem;
  cursor: pointer;
  z-index: 20;
  touch-action: manipulation;
}

@media (hover: none) and (pointer: coarse) {
  .pauseButton {
    display: flex;
  }
}

.dpadHidden {
  display: none;
}
```

**Verification:**

- Manual: in mobile emulation, start a game. The pause button is visible in
  the top-right of the board. Tap it → game pauses, "Paused" overlay
  appears. Tap Resume → game resumes.
- Unit test in Step 8.

---

### Step 4 — Responsive board sizing

Goal: The 20x20 board fills the available viewport at any phone size while
staying square.

**`src/components/Board.tsx` changes:**

Replace inline `gridTemplateColumns` / `gridTemplateRows` (currently
`repeat(20, 20px)`) with CSS-only sizing using `1fr`:

```tsx
<div
  className={styles.board}
  role="grid"
  aria-label="Snake Run board"
  style={{
    gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)`,
    gridTemplateRows: `repeat(${GRID_SIZE}, 1fr)`,
  }}
>
```

**`src/components/Board.module.css` changes:**

```css
.board {
  border: 3px solid #334155;
  border-radius: 4px;
  background: #0f172a;
  width: 100%;
  height: 100%;
  aspect-ratio: 1 / 1;
  touch-action: none;
}
```

**`src/components/Game.module.css` changes:**

Replace the existing `.boardWrapper` rules with:

```css
.boardWrapper {
  position: relative;
  margin: 0 auto;
  width: min(90vw, 70dvh, 400px);
  aspect-ratio: 1 / 1;
  touch-action: none;
  overscroll-behavior: none;
}
```

For landscape phones, shrink the board so the d-pad and pause button stay
visible:

```css
@media (orientation: landscape) and (max-height: 500px) {
  .boardWrapper {
    width: min(60dvh, 90vw, 400px);
  }
}
```

**`src/components/Cell.module.css` changes:**

Confirm cells use `100%` or `1fr` for width/height. If any `CELL_SIZE`-baked
pixel values exist in `Cell.module.css`, replace with `width: 100%; height:
100%;` so the grid layout owns the size.

**`src/game/constants.ts`:**

The `CELL_SIZE = 20` constant is no longer used for layout. Keep it (still
referenced for any future canvas work) but no consumer should import it
for pixel sizes. Document this in SPEC.md.

**Verification:**

- Manual: load game on iPhone SE (320x568) portrait — board fills the
  screen with margins, no horizontal scroll, d-pad and pause button
  reachable.
- Manual: rotate to landscape — board shrinks to fit, d-pad and pause
  button remain visible.

---

### Step 5 — Safe-area insets and iOS polish

Goal: Content avoids the notch and home indicator on notched devices.

**`src/components/Game.module.css` changes:**

```css
.gameContainer {
  /* existing rules */
  padding-top: max(20px, env(safe-area-inset-top));
  padding-bottom: max(20px, env(safe-area-inset-bottom));
  padding-left: max(20px, env(safe-area-inset-left));
  padding-right: max(20px, env(safe-area-inset-right));
}
```

When the game is later launched from the iOS home screen (Milestone 3),
`apple-mobile-web-app-status-bar-style=black-translucent` combined with
safe-area insets ensures content isn't hidden under the status bar.

**Verification:**

- Manual: in iPhone 14 Pro emulation, content respects the notch (top) and
  the home indicator (bottom).

---

### Step 6 — Suppress default webkit touch UI on the game area

**`src/index.css` additional rules:**

Already added in Step 1 (`-webkit-touch-callout: none; -webkit-user-select:
none;`). Confirm those are present and apply to `.gameContainer` via the
`@media` block in `Game.module.css` if needed.

**Verification:** No "Select / Copy" popover appears when long-pressing the
board on iOS Safari.

---

### Step 7 — D-pad copy, sizing, and behavior

- Increase D-pad button size to 64x64 on touch devices for thumb comfort.
- Ensure the active state (background change) is visible at small sizes.
- D-pad is hidden during idle / gameover / won overlays (done in Step 3).
- D-pad is positioned to be reachable with one hand on common phone sizes
  (the current below-board layout is acceptable; revisit if playtest says
  otherwise).

**`src/components/Game.module.css` changes:**

```css
@media (hover: none) and (pointer: coarse) {
  .dpadBtn {
    width: 64px;
    height: 64px;
    font-size: 1.4rem;
  }
  .dpadCenter {
    width: 64px;
    height: 64px;
  }
}
```

**Verification:** D-pad is reachable with one hand on a 6.1" phone.

---

### Step 8 — Tests

Add the following test files. Use Vitest with @testing-library/react and
@testing-library/user-event v14 (touch support). All tests must pass with
`npm test`.

**`src/platform/__tests__/touch.test.ts` (new):**

Pure-logic unit tests that exercise `createGestureRecognizer` against a
fake element. The fake element only needs to implement
`addEventListener`, `removeEventListener`, and `setAttribute` /
`getAttribute`. Assert:

- A short tap (`|dx|, |dy| < lockThreshold`) does NOT fire.
- A horizontal drag with `dx > triggerThreshold` and `|dx| > |dy| *
  axisRatio` fires RIGHT or LEFT exactly once.
- A vertical drag with `dy > triggerThreshold` and `|dy| > |dx| *
  axisRatio` fires UP or DOWN exactly once.
- A diagonal drag past `triggerThreshold` but with axis ratio below the
  threshold fires NOTHING.
- A drag interrupted by `touchcancel` fires NOTHING.
- A second swipe fired within `cooldownMs` is suppressed.
- `setEnabled(false)` blocks all swipe callbacks until re-enabled.
- `onProgress` is called with the correct candidate and a 0..1 progress
  during a long drag.

**`src/hooks/__tests__/useTouch.test.tsx` (new):**

Integration test that:

- Renders a small component using `useTouch` with a fake board div ref.
- Dispatches synthetic `touchstart` and `touchend` events with a delta >
  threshold using `fireEvent`.
- Asserts the `onSwipe` callback received the correct direction.
- Asserts that toggling `enabled` to `false` blocks subsequent swipes.

**`src/components/__tests__/Game.test.tsx` (new):**

- Render `<Game />` with the engine forced into `playing` state.
- Stub `window.matchMedia` (or use a polyfill) so the `@media (hover: none)
  and (pointer: coarse)` rules are considered active in jsdom.
- Assert the pause button is in the document with `aria-label="Pause
  game"`.
- Click the pause button via `userEvent`.
- Assert the state transitions to `paused` (the "Resume" button is in the
  document).
- Assert the pause button is no longer rendered.
- Repeat for the d-pad: it is visible in `playing`, hidden in `gameover`.

**`src/components/__tests__/Board.test.tsx` (new — optional but recommended):**

- Renders `<Board />` and asserts the grid has 400 cells.
- Asserts the inline style uses `1fr` for columns/rows (responsive check).

**Verification:**

- `npm test` — all old + new tests pass.
- `npm run lint` — clean.
- `npm run build` — succeeds.

---

### Step 9 — Manual test checklist (must pass before merging)

Performed on a real phone if available, otherwise Chrome DevTools device
emulation:

- [ ] iPhone 12 (Safari) portrait: load game, see Start overlay.
- [ ] Tap Start. Snake starts moving. No page scroll. No pull-to-refresh.
- [ ] Swipe up → snake turns up. Swipe down → snake turns down. Swipe
      left/right similarly. No accidental double-swipes from diagonals.
- [ ] Pause button is visible in top-right of board. Tap it → game pauses,
      overlay shows "Paused". Tap Resume → game resumes.
- [ ] Tap D-pad buttons → snake turns accordingly.
- [ ] Pinch with two fingers → no zoom.
- [ ] Double-tap the board → no zoom.
- [ ] Rotate to landscape. Board resizes. Pause button + D-pad still visible
      and reachable.
- [ ] iPhone 14 Pro: notch doesn't overlap the title; home indicator doesn't
      cover the D-pad.
- [ ] Android Chrome (Pixel 5 emulation): same swipe / pause / no-refresh
      behavior.
- [ ] Long-press on the board → no iOS "Select / Copy" popover.
- [ ] Desktop Chrome: layout is unchanged, D-pad hidden, no pause button
      shown.

---

### Step 10 — Documentation updates

After implementation, update the following docs to match the new behavior.

**`SPEC.md`:**

- Section 8.2 (Touch): replace the swipe gesture description with the new
  axis-locked recognizer. Specify `lockThreshold=24`, `triggerThreshold=36`,
  `axisRatio=1.5`, `cooldownMs=80`. Note the swipe is suppressed when
  status is not `playing`.
- Section 8.2: add the on-screen pause button. Specify its position
  (top-right of board, 44x44, touch-only), and that it is hidden outside
  `playing`.
- Section 2 (Grid and Rendering): note that the board uses CSS-only sizing
  (`1fr` cells) and `.boardWrapper` uses `aspect-ratio: 1/1` to scale to
  the viewport. The `CELL_SIZE` constant is retained for reference but is
  no longer used for layout.
- Section 14 (Styling): add safe-area inset usage and `touch-action: none`
  / `overscroll-behavior: none` notes.
- Section 11 (Accessibility): note the trade-off of `user-scalable=no`
  (text zoom disabled while playing; game is fast-paced and zoom is not
  part of the play experience).
- Section 17 (Known Limitations): remove items 2 (no pause overlay on
  mobile) and 6 (no visual pause indicator). Add a new limitation noting
  the accessibility trade-off above if appropriate.

**`ARCHITECTURE.md`:**

- Section "Touch Controls": rewrite to describe the new
  `createGestureRecognizer` API and its parameters.
- Section "Platform Adapters": add a note that `src/platform/touch.ts`
  now exposes a richer gesture recognizer with progress callbacks,
  intended for future haptic / visual feedback work.
- Section "State Machine": no changes.

**`docs/PROJECT_STATE.md`:**

- Bump `Current Version` to `v0.2.0` (milestone completion, not
  pre-release).
- Change `Current Milestone` to `Milestone 2 - Mobile Experience` with the
  new goal.
- Replace `In Progress` with the items just completed.
- Add to `Completed Features`:
  - Mobile viewport lock (no scroll / no pull-to-refresh / no double-tap
    zoom)
  - On-screen pause button
  - Reliable swipe gestures (axis-locked recognizer)
  - Responsive board layout (CSS-only sizing, `aspect-ratio`)
  - iOS safe-area handling
- Bump the test count in `Completed Features` to the new total.

**`docs/ROADMAP.md`:**

- Update `In Progress` to list the items from this plan that are now
  complete.
- Move any completed items into `Completed`.
- Update `Milestone 2` success criteria to be checked off.

---

## Risks & Trade-offs

- **`user-scalable=no` is a known accessibility anti-pattern.** It
  prevents browser-level text zoom. Snake Run is a fast-paced game and the
  visible game area is intentionally fixed-size; we accept this trade-off.
  Documented in SPEC.md. Future: revisit if accessibility feedback is
  negative.
- **`overscroll-behavior: none` is supported in iOS Safari 16+ and Chrome
  95+.** Older browsers will still trigger pull-to-refresh. Acceptable for
  an MVP; revisit if user feedback is negative.
- **`touch-action: none` on the game container blocks ALL gestures on the
  page**, including tapping links outside the game area. The game is
  full-screen, so this is acceptable. There are no out-of-game links.
- **The pause button is overlaid on the board.** A tap that lands within
  the snake's path is not a problem (taps don't turn the snake), but the
  button should not visually obscure the head. Top-right corner is
  acceptable for now; revisit if playtest feedback says otherwise.
- **Swipe gestures are suppressed outside `playing`.** A swipe during the
  idle / paused / gameover overlays should NOT turn the snake. The
  recognizer is gated by `enabled` which is set to
  `state.status === 'playing'`. Document this in SPEC.md.

## Manual Test Plan Summary

Performed by the implementation agent after all code is written:

1. `npm test` — all tests pass.
2. `npm run lint` — clean.
3. `npm run build` — succeeds.
4. Open the built site on a phone (or emulation) and walk through Step
   9's checklist.

If any item fails, the plan is not complete.

## Definition of Done

A pull request is mergeable when:

- All 10 steps above are implemented and verified.
- `npm run lint`, `npm test`, and `npm run build` all pass.
- The Step 9 manual checklist has been walked through on at least one real
  phone OR two distinct device emulations (one iOS, one Android).
- `SPEC.md`, `ARCHITECTURE.md`, `docs/PROJECT_STATE.md`, and
  `docs/ROADMAP.md` are updated and consistent with the new behavior.
- `ROADMAP.md` `In Progress` is updated to reflect this work being done.
- A PR is opened with a Conventional Commits message and the body template
  from `AGENTS.md`.
