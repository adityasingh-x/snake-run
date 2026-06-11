# PRD_Milestone 13_5 — RUNNER FEEL VALIDATION

Version: 2.0

Status: Approved For Planning

Assumption:

Zero external playtesters.

Validation relies on:

- Project owner
- Gameplay recordings
- Screenshots
- AI review
- Observable gameplay evidence

Depends On:

- Milestone 13 Complete
- Milestone 13.1 Complete

Blocks:

- Milestone 14
- Milestone 15
- Milestone 16

---

# 1. PURPOSE

Milestone 13 proved that a lane-based runner can be implemented.

Milestone 13.1 ensures players understand what they are looking at.

Milestone 13.5 exists to answer a different question:

"Does Snake Run feel like a runner?"

This milestone focuses entirely on:

- game feel
- pacing
- momentum
- urgency
- replayability

Success is determined by evidence.

Not by opinions from unavailable testers.

---

# 2. PRODUCT HYPOTHESIS

Current State:

Player sees obstacle.

Player changes lane.

Player survives.

Result:

Functional.

But not necessarily exciting.

Desired State:

Player sees obstacle.

Player feels pressure.

Player reacts immediately.

Player survives narrowly.

Player wants another run.

---

# 3. SUCCESS QUESTION

When reviewing gameplay recordings:

Does the game appear exciting enough that the project owner wants another run?

If consistently no:

Milestone 14 should not begin.

---

# 4. NON-GOALS

Do NOT:

- Add powerups
- Add missions
- Add achievements
- Add cosmetics
- Add unlockables
- Add progression
- Add monetization
- Add new game modes

Focus only on feel.

---

# 5. DESIGN PILLARS

Runner First.

Snake Second.

Motion First.

Puzzle Second.

Reaction First.

Planning Second.

---

# 6. FAILURE MODES

The game fails if it feels like:

- traditional snake
- a puzzle game
- a lane navigation exercise

The game succeeds if it feels like:

- a runner
- a reaction game
- a momentum game

---

# 7. RUNNER IDENTITY TEST

Review 30 seconds of gameplay.

Question:

"What genre is this?"

Desired Answer:

Runner

Acceptable Answer:

Endless Runner

Failure Answer:

Snake

Puzzle

Grid Game

---

# 8. FORWARD MOTION REQUIREMENTS

Player must perceive:

The world is moving.

Not:

The snake is navigating a static board.

The implementation may vary.

The perception may not.

---

# 9. CAMERA REQUIREMENTS

Preferred Layout:

+--------------------+
| Upcoming Threats |
| Upcoming Food |
| |
| |
| Snake |
+--------------------+

Snake should remain near lower third of screen.

Purpose:

Increase urgency.

Increase visibility.

Increase reaction pressure.

---

# 10. VISIBILITY REQUIREMENTS

Player should always see:

- next obstacle
- next lane choice
- next food opportunity

Deaths should rarely feel unavoidable.

Deaths should feel earned.

---

# 11. SPEED VALIDATION

Create test profiles:

Profile A

Current speed

Profile B

+25%

Profile C

+50%

Profile D

+75%

Record gameplay for all profiles.

---

# 12. SPEED EVALUATION

Review recordings.

Determine:

Which profile creates:

- best tension
- best readability
- best urgency

Document result.

---

# 13. OBSTACLE THREAT MODEL

Obstacle purpose:

Create immediate reactions.

Not:

Create route-planning puzzles.

Desired Thought:

"Move now."

Undesired Thought:

"Let me calculate."

---

# 14. EVENT DENSITY REQUIREMENTS

Meaningful event:

- food
- obstacle
- lane choice
- near miss opportunity

Target:

Meaningful event every 2-5 seconds.

Failure:

More than 8 seconds without decision-making.

---

# 15. EMPTY SPACE AUDIT

Review recordings.

Measure:

Periods where player performs no meaningful action.

Goal:

Minimize downtime.

---

# 16. REACTION WINDOW TARGETS

Easy:

1.5-2.0 seconds

Medium:

1.0-1.5 seconds

Hard:

0.5-1.0 seconds

Avoid:

Below 0.3 seconds.

That feels unfair.

---

# 17. FOOD DECISION TEST

Food should create decisions.

Bad:

Food directly on safe path.

Good:

Food requires commitment.

Example:

Lane A = Safe

Lane C = Food + Risk

Player chooses.

---

# 18. NEAR MISS REQUIREMENTS

Recordings should contain moments where:

Player survives narrowly.

Examples:

- last-second lane change
- obstacle avoided at final moment
- risky food collected just before danger

Near misses create replayability.

---

# 19. DIFFICULTY CURVE

0-30 seconds

Low pressure

30-60 seconds

Moderate pressure

60-120 seconds

High pressure

120+ seconds

Extreme pressure

Goal:

Player eventually fails.

Failure should feel deserved.

---

# 20. RECORDING REQUIREMENTS

Required:

5 gameplay recordings.

Each recording:

Minimum 2 minutes.

Or until death.

Store in:

docs/Milestone 13_5_validation/

---

# 21. SCREENSHOT REQUIREMENTS

Capture:

- Start state
- Mid-run state
- High-pressure state
- Game over state

Store in:

docs/Milestone 13_5_validation/

---

# 22. PROJECT OWNER VALIDATION

After reviewing recordings answer:

1. Does this feel like a runner?

2. Does the game create urgency?

3. Do obstacles create pressure?

4. Do I want another run?

5. Does gameplay feel better than Milestone 13?

---

# 23. PASS CRITERIA

Pass if:

All five questions are answered YES.

---

# 24. AI REVIEW REQUIREMENTS

Review agents must answer:

A. Does gameplay communicate motion?

B. Does gameplay create urgency?

C. Does gameplay create reaction pressure?

D. Is the runner identity obvious?

E. Is pacing appropriate?

---

# 25. REVIEWER CHECKLIST

Gameplay

[ ] Increased urgency

Motion

[ ] Forward motion perception exists

Pacing

[ ] Event density sufficient

Identity

[ ] Runner identity obvious

Scope

[ ] No feature creep

---

# 26. QA CHECKLIST

[ ] Motion visible

[ ] Speed profiles work

[ ] Obstacles readable

[ ] No unfair deaths

[ ] Difficulty scales correctly

[ ] Evidence captured

---

# 27. ACCEPTANCE CRITERIA

Required:

[ ] 5 gameplay recordings created

[ ] Validation screenshots captured

[ ] Runner identity obvious

[ ] Forward motion perception exists

[ ] Event density acceptable

[ ] Project owner answers YES to all validation questions

Milestone may not be closed until all criteria pass.

---

# 28. EXIT DECISION

At milestone completion answer:

"Does Snake Run have the potential to become a compelling runner?"

YES:
Proceed to Milestone 14.

NO:
Rework runner concept before continuing.

"No decision" is not acceptable.
