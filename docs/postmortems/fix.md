# Fix: Sound Toggle Hidden on Desktop

**Date:** 2026-06-02

## Bug

The sound toggle button was moved from `ScoreBoard` (always visible) into `.controlsRow`, which is `display: none` on desktop (fine-pointer devices). Desktop users had no UI way to mute/unmute sound.

**Reproduction:** Open the game on desktop — no sound toggle button visible.

## Root Cause

In the Milestone 2 mobile UX refactor, the sound toggle, d-pad toggle, and pause button were all placed in a new `.controlsRow` toolbar. This toolbar is gated by `@media (pointer: coarse)`, so it's hidden on desktop. The sound toggle was the only button that needed to be always available.

## Fix

Moved the sound toggle out of `.controlsRow` and into a new `.scoreHeader` wrapper that's always visible:

- **`Game.module.css`:** Added `.scoreHeader` (relative flex container) and `.scoreHeader .toolbarBtn` (absolute right)
- **`Game.tsx`:** Wrapped `ScoreBoard` and sound toggle in `.scoreHeader`; `.controlsRow` now only contains d-pad toggle and pause button

## Files Changed

- `src/components/Game.tsx`
- `src/components/Game.module.css`
- `plans/ACTIVE.md` (documentation update)

## Verification

- `npm run lint` — clean
- `npm run build` — succeeds
- `npm test` — 116/116 pass
