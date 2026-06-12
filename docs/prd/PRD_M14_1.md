# PRD_M14_1_SMOOTH_RUNNER_MOTION_V2

## Executive Summary

The performance investigation demonstrated that the game is not suffering from low browser FPS.

Measured findings:

- requestAnimationFrame remains healthy
- Browser FPS remains healthy
- React rendering remains acceptable
- CPU utilization is not the bottleneck

The player perceives the game as running at approximately 5 FPS because gameplay positions only update every 200ms.

This milestone exists solely to solve perceived motion quality.

No gameplay mechanics shall change.

---

## Product Goal

Transform visual movement from:

- jump
- pause
- jump
- pause

into:

- continuous motion

The game should visually resemble a modern runner while preserving identical gameplay rules.

---

## Core Finding From Investigation

The investigation concluded:

- The game does NOT have an FPS problem.
- The game DOES have a presentation problem.
- Objects move only when logical ticks occur.
- Humans perceive discrete position updates as choppy motion.

Therefore:

This milestone focuses on interpolation rather than optimization.

---

## Success Criteria

A gameplay recording should no longer appear to update in 200ms increments.

Obstacles, food, viewport movement, and lane transitions should appear continuous.

Success is judged visually.

---

## Non Goals

- Obstacle balancing
- Food balancing
- Growth balancing
- Scoring changes
- HUD redesign
- Audio redesign
- New mechanics
- New progression systems

---

## Required Architectural Investigation

Before implementation begins, the planner must evaluate the following approaches and document tradeoffs.

### Option A: CSS Transform Interpolation

Approach:

- Keep current logical tick model.
- Apply CSS transforms between ticks.
- Use translateY and translateX.
- Let browser interpolate movement.

Advantages:

- Lowest implementation risk.
- Minimal architecture changes.
- Easy rollback.

Disadvantages:

- May be difficult to synchronize with lane changes.
- May create visual drift if not carefully managed.

### Option B: requestAnimationFrame Visual Layer

Approach:

- Maintain logical game state.
- Create separate visual state.
- Update visual state every animation frame.

Advantages:

- Most flexible.
- Highest quality motion.
- Industry-standard approach.

Disadvantages:

- Higher implementation complexity.
- Requires separation of logical and visual positions.

### Option C: Hybrid Approach

Approach:

- Logical state remains tick-driven.
- Visual interpolation uses rAF.
- CSS transforms handle actual rendering.

Advantages:

- Strong balance between quality and complexity.
- Likely best fit for existing architecture.

Disadvantages:

- Requires careful synchronization.

### Option D: Full Rendering Rewrite

Approach:

- Convert rendering model completely.

Status:

Forbidden.

Reason:

Not justified by investigation findings.

---

## Planning Deliverable Requirement

The planning phase must explicitly compare:

1. Complexity
2. Risk
3. Performance
4. Code churn
5. Compatibility with existing architecture

The chosen approach must be justified.

---

## Required Solution Characteristics

The selected implementation must:

- Preserve all gameplay logic
- Preserve collision detection
- Preserve scoring
- Preserve obstacle generation
- Preserve growth mechanics

Only visual presentation may change.

---

## Logical vs Visual State

Logical Position:

Used for:

- collisions
- food collection
- obstacle generation
- scoring

Visual Position:

Used for:

- rendering
- animation
- interpolation

These positions may temporarily differ.

---

## Viewport Requirements

Current:

Viewport jumps one cell every tick.

Required:

Viewport scrolls continuously every frame.

Player should not perceive jumps.

---

## Obstacle Requirements

Obstacles must:

- glide continuously
- never snap between rows
- never appear frozen

Required perception:

Obstacle moving toward player.

Forbidden perception:

Obstacle teleporting.

---

## Food Requirements

Food must:

- glide continuously
- remain aligned to lanes
- visually move with the world

---

## Snake Requirements

Logical movement unchanged.

Visual lane transitions should animate.

Suggested duration:

100ms–200ms.

---

## Wrap Transition Requirements

Current course regeneration on wrap must not create visible popping.

Forbidden:

- visible mutation
- visible replacement
- visible popping

Wrap transitions should appear continuous.

---

## Rendering Constraints

Preferred:

- transform: translateY
- transform: translateX
- GPU accelerated transforms

Avoid:

- top/left animation
- DOM reconstruction during animation

---

## React Constraints

Do not rewrite:

- engine
- game rules
- state management

This milestone is not a React refactor.

---

## Optional Optimizations

Allowed but not required:

- custom memo comparator
- selector subscriptions
- reduced cell renders
- aria-label optimization

Important:

These optimizations alone do NOT satisfy milestone goals.

Investigation concluded they improve CPU efficiency but do not materially improve visible smoothness.

---

## Validation Requirements

Capture:

1. Before implementation recording
2. After implementation recording

Use similar gameplay scenarios.

---

## AI Review Questions

1. Does the world move continuously?
2. Do obstacles glide?
3. Does food glide?
4. Does viewport movement appear smooth?
5. Does the game appear visually faster?
6. Does the runner feel more professional?
7. Is motion quality noticeably improved?

All answers must be YES.

---

## Failure Conditions

Automatic failure if:

- movement still appears 5 FPS
- viewport still jumps
- obstacles still jump
- improvement is not visually obvious

---

## Acceptance Criteria

[ ] Continuous viewport motion

[ ] Continuous obstacle motion

[ ] Continuous food motion

[ ] Smooth lane transitions

[ ] No gameplay rule changes

[ ] No balance changes

[ ] Architecture comparison completed

[ ] Chosen strategy documented

[ ] Before/after recordings created

[ ] Visual review passes

---

## Exit Question

Does the game still appear to run at 5 FPS?

Required answer:

NO
