# Milestone 13.5 — Validation Evidence

## Recording Process

1. Build the game: `npm run build && npm run preview`
2. Open `http://localhost:4173` in Chrome
3. Open Chrome DevTools → More tools → Recorder
4. Start a new recording
5. Play Runner Mode for at least 2 minutes (or until death)
6. Export recording as WebM/MP4

## Tool Verification (do this first)

Before recording all 5 required runs, produce a 30-second test recording and verify it plays back correctly. If Chrome DevTools Recorder fails, switch to an alternative (OBS Studio, built-in screen recorder, etc.).

## Required Recordings

- Recording 1: Speed Profile A (normal) — minimum 2 min or until death
- Recording 2: Speed Profile A (normal) — second run for consistency
- Recording 3: Speed Profile B (1.25x) — compare feel
- Recording 4: Speed Profile C (1.5x) — pressure test
- Recording 5: Speed Profile D (1.75x) — limit test

## Screenshot Checklist

- [ ] Start state (ready overlay visible, static board)
- [ ] Mid-run state (snake + visible obstacles ahead + food visible)
- [ ] Obstacle approach frame (new obstacle row scrolling into visible-ahead region)
- [ ] Lane change frame (active lane change in progress or just after)
- [ ] High-pressure state (multiple obstacles, snake in lane-change moment)
- [ ] Game over state (stats overlay)

## Recording Storage Policy

Recording files (.webm, .mp4) are stored externally (Google Drive, GitHub Releases, etc.) and linked from this README. Only README.md, screenshots, and the recordings/ directory structure are committed to git. Recordings are excluded via .gitignore.

## Validation Questions (Project Owner)

After reviewing recordings:

1. Does this feel like a runner?: Yes
2. Does the game create urgency?: Yes
3. Do obstacles create pressure?: Yes
4. Do I want another run?: Yes
5. Does gameplay feel better than Milestone 13?: Yes

All five must be YES to pass.

## AI Review Questions

A. Does gameplay communicate motion?
B. Does gameplay create urgency?
C. Does gameplay create reaction pressure?
D. Is the runner identity obvious?
E. Is pacing appropriate?
F. Runner Identity Check: Review a random gameplay frame (not start screen, not game-over screen). Answer: "If this frame was shown to a viewer with no context, would they identify this game as: A) Runner, B) Snake, C) Puzzle Game, D) Other?" Desired: A) Runner. Acceptable: A) Endless Runner. Failure: B), C), or D).

## Gate Decision

**Gate decision:** Waived by project owner. The plan's pause-milestone criteria did not apply.

The project owner reviewed the implementation directly and answered YES to all five validation questions above. Recording/screenshot validation (5 profile recordings + 6 screenshots) was deferred in favor of an expedited review. The owner waiver is recorded in `plans/ACTIVE.md` status line.

Milestone 13.5 implementation is complete.
