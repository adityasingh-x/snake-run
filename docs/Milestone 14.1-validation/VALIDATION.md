# Milestone 14.1 Validation — Smooth Runner Motion V2

> **Status:** Implementation Complete. Subjective PRD success criteria NOT met. Code retained per project owner decision (2026-06-12).

## Outcome Summary

The M14.1 implementation is **technically correct but did not achieve its subjective goals**:

| Goal | Outcome |
|------|---------|
| Continuous viewport motion (mechanical) | Achieved — animation interpolates smoothly between ticks |
| Eliminate 200ms "jump" perception | NOT achieved — still feels like discrete ticks |
| "Feels more professional" | **No** (project owner assessment) |
| "Appears visually faster" | **No** (project owner assessment) |
| Wrap transition regression | None — same as before, no improvement, no harm |

The Playwright validation tests prove the CSS animation is mechanically applied (185 distinct translateY values across 361 frames at ~120fps), but the project owner reports that this mechanical smoothness does not translate into the perceived "professional feel" or "visual speed" that the PRD aimed for. The implementation is retained in the codebase per project owner direction.

### Lessons Learned

The 5% per-tick translateY (one cell height, ~23px on the rendered board) over a 200ms tick was apparently below the threshold of perceivable meaningful motion. Hypotheses for the perception gap:

- **Tick boundary snap is visible**: at each tick, the inner wrapper snaps from `translateY(0)` back to `translateY(-5%)` to start the next interpolation. The Playwright report shows `maxNegative: -23` (the 23px snap at tick boundary). This snap is visible to a human eye even when the *interpolation between* ticks is smooth.
- **5% per 200ms is too small**: 1 cell height per 200ms is roughly 25px/sec on the rendered board. Below the threshold where continuous motion implies speed.
- **CSS animation on a wrapper doesn't address the underlying logical discrete-positioning model**: the snake, food, and obstacles still logically exist at integer grid positions. The illusion of smoothness is incomplete because the underlying state is still discrete.

A future attempt would likely need to either: (a) implement Option B from the original plan (rAF-based visual state layer that decouples visual from logical positions), (b) increase the perceived motion magnitude, or (c) reframe the milestone goal (e.g., "acceptable vs. unplayable choppiness" rather than "professional feel").

---

## 0. Automated Validation (Playwright)

The motion quality validation is fully automated via Playwright. The tests run against a live dev server, capture transform values at 60-120fps via `requestAnimationFrame`, and assert that the animation interpolates continuously across ticks.

### Running the Tests

```bash
npm run test:e2e
```

This starts the Vite dev server, runs the 5 validation tests in `tests/e2e/validation.spec.ts`, and writes JSON reports to `docs/Milestone 14.1-validation/recordings/`.

### Test Inventory

| Test | What it proves |
|------|----------------|
| `viewport inner wrapper applies translateY animation` | CSS animation is applied (class, duration, keyframe name) |
| `continuous interpolation: matrix values span the full animation range` | Samples span the full translateY range (proves interpolation happens) |
| `interpolation produces positive and negative deltas across ticks` | Both upward interpolation and tick-boundary reset deltas are observed |
| `runner mode is functional over 5 seconds of gameplay` | Board, cells, snake head remain in DOM after 5s of real gameplay |
| `classic mode board is unaffected by M14.1 changes` | No animation class applied, no viewport-scrolling attribute in classic mode |

### Output Artifacts

- `motion-quality-report.json` — frame count, f-value range, distinct values observed
- `transitions-report.json` — positive/negative delta counts and magnitudes
- `validation-feature-end.png` — screenshot at 5s gameplay
- `validation-feature-state.json` — final DOM state assertions

### Sample Reports (last run)

```json
// motion-quality-report.json
{
  "totalFrames": 361,
  "durationMs": 3000,
  "minF": -23,
  "maxF": 0,
  "rangeF": 23,
  "distinctValues": 185
}

// transitions-report.json
{
  "totalTransitions": 361,
  "positiveDeltas": 174,
  "negativeDeltas": 7,
  "maxPositive": 1.18,
  "maxNegative": -23
}
```

### What the Reports Show

- 361 frames sampled in 3s (~120fps in headless Chrome)
- 185 distinct translateY values observed (proves smooth interpolation, not just 2-3 discrete states)
- Full animation range covered: 0 to -23px (the `-5%` keyframe at the actual board pixel size)
- 174 positive deltas (interpolation frames within a tick) and 7 negative deltas (tick-boundary restarts, the `maxNegative: -23` is the 23px snap back to start)

### What the Reports Don't Show

The reports prove the CSS animation interpolates between ticks. They do NOT prove that humans perceive this as smooth, professional, or fast. The mechanical metric (interpolation happening) and the perceptual metric (feels better) decoupled in this milestone.

---

## 1. Recordings (Not Created)

Per project owner decision (2026-06-12), recordings were not produced. The subjective "No" assessments on questions 5 and 6 from PRD §AI Review Questions were sufficient to determine the milestone's outcome without the ffmpeg-based pixel-delta analysis described in §2.

The `recordings/` subdirectory remains in place for future milestones that may need this infrastructure.

---

## 2. Frame-by-Frame Motion Quality Validation (Methodology)

The original plan's methodology was based on `ffmpeg` + manual visual frame inspection. This was superseded by the Playwright automated tests in §0, which sample the actual `getComputedStyle().transform` matrix at `requestAnimationFrame` cadence — a more direct measurement of CSS animation state than video pixel-diffing.

The original methodology is preserved here for future reference:

```bash
# Extract 3 consecutive frames from a stable region
ffmpeg -i validation-feature.webm -ss 50 -vf "select='between(n,0,2)'" -vsync vfr frames_%d.png
```

For each consecutive frame pair, measure the screen-space Y delta of a reference obstacle. Pass condition: non-zero consistent deltas. Fail condition: zero deltas with occasional jumps.

---

## 3. Wrap Transition Empirical Validation

### Project Owner Assessment

> Wrap transition visual quality: Same as before.

No regression. No improvement. The single-frame boundary snap that was present before M14.1 is still present after M14.1 (the implementation intentionally suppresses the animation restart for wrap frames, but the underlying logical content jump remains).

### Implementation Note

The RunnerGame useEffect explicitly suppresses the animation restart for wrap transitions:

```typescript
// src/components/RunnerGame.tsx
const delta = Math.abs(headY - prevHeadY.current);
prevHeadY.current = headY;
if (delta > 1) return;  // Wrap suppression: 19-cell shift cannot be interpolated
```

The implementation's wrap handling was correct per the plan but does not improve perceived wrap quality. A future attempt to address this would need Option (c) from the original plan's fallback list (continuous course generation, ~50-100 LOC).

---

## 4. AI Review Questions (PRD §AI Review Questions)

| # | Question | Project Owner Answer | Method |
|---|----------|---------------------|--------|
| 1 | Does the world move continuously? | Not assessed | (Mechanical pass: §0 confirms interpolation) |
| 2 | Do obstacles glide? | Not assessed | (Mechanical pass: §0 confirms translation) |
| 3 | Does food glide? | Not assessed | (Mechanical pass: §0 confirms translation) |
| 4 | Does viewport movement appear smooth? | Not assessed | (Mechanical pass: §0 confirms interpolation) |
| 5 | Does the game appear visually faster? | **No** | Subjective visual review |
| 6 | Does the runner feel more professional? | **No** | Subjective visual review |
| 7 | Is motion quality noticeably improved? | Not assessed | (Inferred: No, based on Q5/Q6) |

The explicit "No" answers on questions 5 and 6 are sufficient to trigger PRD §Failure Conditions.

---

## 5. Failure Conditions Check (PRD §Failure Conditions)

Per PRD, automatic failure if:
- [ ] Movement still appears 5 FPS — **TRIGGERED** (project owner: feels like discrete ticks)
- [ ] Viewport still jumps — **TRIGGERED** (tick-boundary snap visible per §0 maxNegative: -23)
- [ ] Obstacles still jump — **TRIGGERED** (implied by Q5/Q6 No answers)
- [x] Improvement is not visually obvious — **TRIGGERED** (Q5, Q6: No)

Three of the four failure conditions are triggered. The implementation is mechanically functional but does not achieve the PRD's stated goals.

---

## 6. Acceptance Criteria (PRD §Acceptance Criteria)

| Criterion | Status |
|-----------|--------|
| Continuous viewport motion | Implemented (mechanical) — does not achieve subjective goal |
| Continuous obstacle motion | Implemented (mechanical) — does not achieve subjective goal |
| Continuous food motion | Implemented (mechanical) — does not achieve subjective goal |
| Smooth lane transitions | Pre-existing 150ms slideLeft/slideRight (composed) |
| Wrap transitions validated empirically | Same as before (no regression, no improvement) |
| No gameplay rule changes | Pass — all 503 tests pass |
| No balance changes | Pass — engine logic unchanged |
| Architecture comparison completed | Pass — `plans/archive/m14-1-smooth-runner-motion.md` |
| Chosen strategy documented | Pass — same file |
| Before/after recordings created | Skipped — project owner assessment sufficient |
| Frame-by-frame motion quality validation | Automated via `npm run test:e2e` (§0) — passes objectively |
| Visual review passes | **FAIL** — Q5 and Q6: No |

**Overall acceptance:** Implementation-only. Subjective criteria not met. Code retained per project owner decision.

---

## 7. Technical Verification (Completed)

The non-visual aspects of milestone completion are verified:

- **TypeScript:** `npx tsc --noEmit` — no errors
- **Lint:** `npm run lint` — no warnings
- **Build:** `npm run build` — clean production build
- **Tests:** 503 vitest tests + 5 Playwright e2e tests passing
- **Gameplay logic:** Zero gameplay rule changes; all 487 pre-existing tests still pass

The implementation is technically complete and stable. It does not deliver on the PRD's stated goals.

---

## 8. Implementation Reference

- **Implementation plan:** `plans/archive/m14-1-smooth-runner-motion.md`
- **PRD source of truth:** `docs/prd/PRD_M14_1.md`
- **Engine changes:** `src/game/Engine.ts` — `getEffectiveSpeed()`, `getTickInterval()`
- **Board changes:** `src/components/Board.tsx` + `Board.module.css` — inner wrapper, @keyframes
- **RunnerGame wiring:** `src/components/RunnerGame.tsx` — animation useEffect
- **Spec:** `SPEC.md` §20.14 Smooth Viewport Scrolling (describes code behavior; success not claimed)
- **Architecture:** `ARCHITECTURE.md` — "Smooth Runner Motion" sub-section
- **Playwright tests:** `tests/e2e/validation.spec.ts`
- **Project owner decision:** "Keep code, document failure" (2026-06-12)
