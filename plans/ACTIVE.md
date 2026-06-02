# Milestone 2 — Mobile UX Fixes ✅ COMPLETED

## Goal

Fix 7 reported issues with the Milestone 2 mobile experience delivery. These are
a mix of CSS media query bugs, layout problems, and missing features.

## Root Cause Analysis

| # | Issue | Root Cause | Fix |
|---|-------|-----------|-----|
| 1 | No pause button on Android | `@media (hover: none) and (pointer: coarse)` doesn't match Android — Chrome reports `hover: hover` on touch devices | Use `@media (pointer: coarse)` |
| 2 | Pause button inside grid on iOS | Pause button was absolutely positioned inside `.boardWrapper` | Move to a controls toolbar above the board |
| 3 | No d-pad on Android | Same media query mismatch as #1 | Use `@media (pointer: coarse)` |
| 4 | D-pad slow on iOS | 300ms click delay, slow transition animations | Reduce transitions to 0.05s, add `transform: scale(0.95)` on `:active` |
| 5 | Controls text on Android | Same media query mismatch — `.controlsInfo { display: none }` gate fails on Android | Use `@media (pointer: coarse)` |
| 6 | Buttons need repositioning | Sound toggle was inside ScoreBoard, pause was inside board wrapper | New `.controlsRow` toolbar between title and board |
| 7 | No d-pad toggle | Feature not implemented | Added toggle button with localStorage persistence |

## Changes Made

### `src/components/Game.module.css`
- Replaced `.pauseButton` with `.controlsRow` (flexbox toolbar) and `.toolbarBtn`
- Changed `@media (hover: none) and (pointer: coarse)` to `@media (pointer: coarse)`
- Added `.toolbarBtn[aria-pressed="true"]` style for d-pad toggle active state
- Improved d-pad button responsiveness: `transition: 0.05s`, `transform: scale(0.95)` on `:active`
- Added `user-select: none` to d-pad buttons
- Added `.scoreHeader` for always-visible sound toggle placement

### `src/components/Game.tsx`
- Added `dpadOn` state with localStorage persistence (`snakeDpadEnabled` key)
- Added `handleToggleDpad` callback
- Moved pause button from inside `.boardWrapper` to `.controlsRow`
- Added D-pad Toggle button to `.controlsRow` (mobile-only)
- Sound Toggle placed in `.scoreHeader` (always visible on all devices)
- D-pad visibility now gated by both status AND `dpadOn` state
- Removed `soundOn`/`onToggleSound` props from `ScoreBoard`

### `src/components/ScoreBoard.tsx`
- Removed `soundOn` and `onToggleSound` props (moved to toolbar)

### `src/components/ScoreBoard.module.css`
- Removed `.soundToggle` styles (button moved to toolbar)

### `src/types/components.ts`
- Removed `soundOn` and `onToggleSound` from `ScoreBoardProps`

## Layout (mobile)

```
┌─────────────────────────────┐
│        Snake Run            │
│  Level: 1  Score: 0  Hi: 0 [🔊] │  ← scoreHeader (sound always visible)
│  [🎮] [⏸]                  │  ← controlsRow (mobile-only)
│  ┌─────────────────────┐    │
│  │                     │    │
│  │      Game Board     │    │
│  │                     │    │
│  └─────────────────────┘    │
│        [▲]                  │
│     [◀] [ ] [▶]             │  ← D-pad (toggleable)
│        [▼]                  │
└─────────────────────────────┘
```

## Verification

- [x] `npm run lint` — clean
- [x] `npm run build` — succeeds
- [x] `npm test` — 116/116 pass
- [x] Bug fix: Sound toggle visible on desktop (moved out of `.controlsRow`)
- [ ] Manual: Android Chrome — pause button, d-pad, and controls text all visible
- [ ] Manual: iOS Safari — pause button not inside grid, d-pad responsive
- [ ] Manual: D-pad toggle hides/shows d-pad, persists across refresh
