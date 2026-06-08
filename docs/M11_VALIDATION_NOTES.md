# Milestone 11 — Gameplay Validation & Stability: Manual Validation Notes

**Date:** 2026-06-08  
**Milestone:** 11  
**Validator:** AI Agent

---

## Manual Playthrough Checklist

### 1. Full Level 1–10 Run

| Check | Status | Notes |
|-------|--------|-------|
| Each level transition triggers correctly | NOTE | Requires manual browser playthrough |
| Food objectives are reachable | NOTE | Validated structurally via BFS reachability tests |
| No level feels impossible or unfair | NOTE | Requires manual browser playthrough |
| Win screen appears after level 10 | NOTE | Requires manual browser playthrough |
| ScoreBoard HUD displays correct level name and food progress | NOTE | Requires manual browser playthrough |

**Structural validation results (automated):**
- All 10 levels pass spawn safety checks
- All 10 levels have enough free cells for required food
- All 10 levels have sufficient reachable cells (BFS) for snake + food
- Level 5 wrap-around correctly expands reachable area
- Level 7 portals connect both chambers

### 2. Endless Mode Run

| Check | Status | Notes |
|-------|--------|-------|
| ScoreBoard shows "Endless" label | NOTE | Requires manual browser playthrough |
| No level-ups occur | NOTE | Requires manual browser playthrough |
| Game over screen shows "Endless Score" | NOTE | Requires manual browser playthrough |
| Game over → Continue works from previous level | NOTE | Requires manual browser playthrough |

### 3. Keyboard-only Run

| Check | Status | Notes |
|-------|--------|-------|
| All actions accessible via keyboard | NOTE | Requires manual browser playthrough |
| Arrow keys and WASD both work | NOTE | Covered by existing input tests |
| Opposite direction is blocked | NOTE | Covered by existing Engine tests |

### 4. Mobile Run

| Check | Status | Notes |
|-------|--------|-------|
| Swipe gestures register correctly | NOTE | Requires manual mobile browser playthrough |
| D-pad buttons work | NOTE | Requires manual mobile browser playthrough |
| Pause/Resume via toolbar and space | NOTE | Requires manual browser playthrough |
| Responsive layout on small screen | NOTE | Requires manual mobile browser playthrough |
| Sound toggle works | NOTE | Requires manual browser playthrough |

### 5. Achievement Validation

| Check | Status | Notes |
|-------|--------|-------|
| "Snake Master" unlocks on win | NOTE | Requires manual browser playthrough |
| "High Scorer" unlocks on score ≥ 500 | NOTE | Covered by existing achievement tests |
| "Marathon Run" unlocks on win without pausing | NOTE | Covered by existing achievement tests |
| Achievements persist across page reload | NOTE | Covered by existing achievement tests + corruption resilience test |

### 6. Statistics Validation

| Check | Status | Notes |
|-------|--------|-------|
| Games Played increments each game start | NOTE | Covered by existing statistics tests |
| Total Food accumulates across runs | NOTE | Covered by existing statistics tests |
| Best Level updates correctly | NOTE | Covered by existing statistics tests |
| Stats persist across page reload | NOTE | Covered by round-trip and corruption resilience tests |

---

## Automated Test Summary

| Category | Tests Added | Status |
|----------|-------------|--------|
| Portal & Layout Safety (Phase 1) | 8 | PASS |
| Reachability Module (Phase 2) | 9 | PASS |
| Level Validation Suite (Phase 3) | 75 | PASS |
| Persistence & Integration (Phase 4) | 6 | PASS |
| **Total New Tests** | **98** | **PASS** |

**Total test suite:** 356 tests (1 pre-existing failure in state.test.ts unrelated to M11 changes)

---

## Known Issues

1. **Pre-existing test failure:** `state.test.ts > MOVE_SNAKE spawns replacement normal food when timer reaches 0` — Gold food timer expiry spawns gold instead of normal food. This is a pre-existing issue not introduced by Milestone 11 changes. Deferred to future milestone for investigation.

---

## Conclusion

All automated structural validation passes. Manual browser playthrough validation is formally deferred to human testing on actual browser/mobile environments. No CRITICAL defects identified in automated validation.

**Phase 5 Status:** Deferred to human validation. Automated structural validation (BFS reachability, bounds checks, overlap detection, persistence corruption resilience) is complete and passing. The six manual-playthrough checklist sections require interactive gameplay verification that cannot be performed in a CI/agent environment. Maintainer should complete manual playthrough before or after merge at their discretion.
