# PWA Manual Verification Checklist

**Milestone:** 3 — PWA Release
**Date:** 2026-06-03
**Status:** Pending manual verification

This checklist covers the manual verification steps from `plans/ACTIVE.md` Phase 3 (Step 6) and Phase 7 (Step 16). These steps require physical devices or browser DevTools emulation and cannot be automated.

---

## Phase 3 — Offline Smoke Test (Step 6)

- [ ] Open `http://localhost:4173/snake-run/` in Chrome
- [ ] DevTools → Application → Service Workers → service worker is **activated**
- [ ] DevTools → Network tab → check "Offline"
- [ ] Refresh the page — game loads fully
- [ ] Start a game, eat food, trigger game over — all works offline
- [ ] Sound still works offline

## Phase 7 — Deployed PVA Validation (Step 16)

| # | Criterion | Status | Notes |
|---|-----------|--------|-------|
| 1 | Shareable URL — opens in incognito | Pending | `https://adityasingh-x.github.io/snake-run/` |
| 2 | Installable on Android — Chrome "Add to Home Screen" | Pending | Requires Android device |
| 3 | Installable on iOS — Safari "Add to Home Screen" | Pending | Requires iOS device |
| 4 | Installable on desktop — Chrome/Edge install icon | Pending | Requires desktop Chrome/Edge |
| 5 | Playable offline — airplane mode test | Pending | Installed app must work without network |
| 6 | All game features work offline | Pending | Start, eat, level up, game over, restart, sound, d-pad |
| 7 | Sound works in installed PWA | Pending | AudioContext must work in standalone mode |
| 8 | High score persists across sessions | Pending | Play, close, reopen — score preserved |

---

## Notes

- Automated checks (build, tests, lint, artifact generation) all pass.
- Service worker and manifest are correctly generated (verified by `pwa.test.ts`).
- Manual on-device verification is required before announcing the public release.
