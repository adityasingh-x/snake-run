# docs/design/LEVEL_DESIGN.md

# Level Design

## Purpose

This document defines the intended gameplay progression for Snake Evolution.

Unlike SPEC.md, this document is forward-looking and may describe gameplay that has not yet been implemented.

This document serves as the product design source of truth for level progression.

When implementing level-related roadmap items, AI agents should reference this document.

---

# Design Philosophy

Levels should introduce new navigation concepts rather than relying primarily on speed increases.

Progression should follow:

Teach
→ Challenge
→ Mastery
→ Final Exam

Difficulty should come primarily from:

- navigation
- route planning
- obstacle interaction
- snake length management

Difficulty should not come primarily from:

- extreme movement speed
- reaction-time requirements

The game must remain comfortably playable on mobile devices.

---

# Level Progression

## Level 1 — First Meal

Purpose:

Teach movement and food collection.

Objective:

10 food

Layout:

Empty board.

Concept Introduced:

Basic movement.

---

## Level 2 — Pillar Run

Purpose:

Introduce obstacle navigation.

Objective:

12 food

Layout:

Single central pillar.

Concept Introduced:

Routing around obstacles.

---

## Level 3 — Split Paths

Purpose:

Introduce route selection.

Objective:

14 food

Layout:

Two vertical walls creating multiple lanes.

Concept Introduced:

Path planning.

---

## Level 4 — Crossroads

Purpose:

Introduce board partitioning.

Objective:

16 food

Layout:

Cross-shaped obstacle structure.

Concept Introduced:

Sector navigation.

---

## Level 5 — Maze Runner

Purpose:

Introduce constrained movement.

Objective:

18 food

Layout:

Simple maze.

Concept Introduced:

Forward planning.

---

## Level 6 — Narrow Passage

Purpose:

Increase pressure from snake length.

Objective:

20 food

Layout:

Multiple narrow corridors.

Concept Introduced:

Length management.

---

## Level 7 — Four Chambers

Purpose:

Create travel cost between regions.

Objective:

22 food

Layout:

Board divided into four connected chambers.

Concept Introduced:

Positioning and efficiency.

---

## Level 8 — Spiral

Purpose:

Force long navigation routes.

Objective:

24 food

Layout:

Large spiral pattern.

Concept Introduced:

Efficient path selection.

---

## Level 9 — Survival Grid

Purpose:

Challenge player navigation under pressure.

Objective:

26 food

Layout:

Dense obstacle field.

Concept Introduced:

Rapid route evaluation.

---

## Level 10 — Final Run

Purpose:

Combine all previously learned concepts.

Objective:

30 food

Layout:

Hybrid layout combining:

- Crossroads
- Maze Runner
- Narrow Passage

Concept Introduced:

Mastery.

---

# Difficulty Curve

Difficulty should increase through:

1. Layout complexity
2. Route planning
3. Travel distance
4. Snake length pressure

Difficulty should not increase primarily through speed.

Target speed progression:

| Level | Speed |
| ----- | ----- |
| 1     | 150ms |
| 2     | 140ms |
| 3     | 130ms |
| 4     | 120ms |
| 5     | 115ms |
| 6     | 110ms |
| 7     | 110ms |
| 8     | 105ms |
| 9     | 105ms |
| 10    | 100ms |

---

# Future Expansion

The following mechanics are intentionally excluded from Milestone 5:

- Portals
- Wrap-around maps
- Moving obstacles
- Enemy snakes
- Boss encounters

These belong to future roadmap milestones and should not be introduced during handcrafted level implementation.

---

# AI Agent Instructions

When implementing level-related roadmap work:

1. Follow this document.
2. Do not invent additional mechanics.
3. Do not modify level objectives without approval.
4. Do not introduce future milestone features.
5. Prefer simple layouts over complex layouts.
6. Prioritize gameplay clarity over visual complexity.
