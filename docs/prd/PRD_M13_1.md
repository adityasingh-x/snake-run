# PRD_M13_1

Version: 2.0
Status: Approved For Planning

==================================================

1. # EXECUTIVE SUMMARY

Milestone 13.1 exists to solve a single problem:

The player sees a grid-based Snake game but is actually playing a 3-lane runner.

This mismatch creates confusion.

This milestone does NOT add gameplay.
This milestone does NOT add progression.
This milestone does NOT add content.

This milestone aligns visual communication with gameplay reality.

Success is measured by comprehension, not fun.

# ================================================== 2. PRODUCT GOAL

Within 5 seconds of seeing the game, a first-time player must understand:

- There are exactly 3 lanes.
- The snake moves between lanes.
- Food is collected.
- Obstacles are avoided.
- Survival is the objective.

# ================================================== 3. NON-GOALS

Do not:

- Add powerups
- Add achievements
- Add missions
- Add progression
- Add unlockables
- Add new food types
- Add obstacle types
- Rebalance scoring
- Change growth mechanics
- Change speed tuning

# ================================================== 4. PLAYER MENTAL MODEL

Desired:

"I am controlling a snake in a 3-lane runner."

Undesired:

"I am controlling a snake on a 20x20 board."

# ================================================== 5. CORE DESIGN PRINCIPLES

Principle 1:
Visuals must reinforce gameplay.

Principle 2:
Every visible object must have purpose.

Principle 3:
The board exists to communicate lanes.

Principle 4:
The player should understand movement instantly.

# ================================================== 6. LANE ARCHITECTURE

Logical lanes:

Lane 0 = Left
Lane 1 = Center
Lane 2 = Right

All entities must belong to one lane.

Required:

Food -> lane
Obstacle -> lane
Snake head -> lane
Snake body -> lane

Forbidden:

Between-lane entities
Partial-lane entities
Ambiguous placement

# ================================================== 7. VISUAL HIERARCHY

Priority 1
Snake

Priority 2
Incoming danger

Priority 3
Food

Priority 4
Score HUD

Priority 5
Background

Grid cells must never dominate attention.

# ================================================== 8. BOARD PRESENTATION

Target perception:

+-----+-----+-----+
| L | C | R |
+-----+-----+-----+

Not:

+--+--+--+--+--+
|grid grid grid |
+--+--+--+--+--+

The player should notice lanes before cells.

# ================================================== 9. LANE VISUALIZATION REQUIREMENTS

R1:
Lane boundaries always visible.

R2:
Lane centers visually obvious.

R3:
Player always knows current lane.

R4:
Lane transitions visually clear.

R5:
No visual ambiguity.

# ================================================== 10. FOOD SYSTEM REQUIREMENTS

Food spawn process:

Step 1:
Select lane.

Step 2:
Validate occupancy.

Step 3:
Spawn at lane center.

Allowed:

Lane 0
Lane 1
Lane 2

Forbidden:

Outside lanes
Between lanes
Unreachable positions

# ================================================== 11. OBSTACLE REQUIREMENTS

Purpose:

Force decisions.

Obstacles are not decoration.

Obstacle spawn process:

Step 1:
Choose pattern.

Step 2:
Validate lanes.

Step 3:
Spawn.

# ================================================== 12. APPROVED PATTERNS

Pattern A

[X][ ][ ]

Pattern B

[ ][X][ ]

Pattern C

[ ][ ][X]

Pattern D

[X][X][ ]

Pattern E

[X][ ][X]

Pattern F

[ ][X][X]

# ================================================== 13. FORBIDDEN PATTERNS

No impossible states.

Example:

[X][X][X]

if avoidance is impossible.

# ================================================== 14. HUD REQUIREMENTS

Primary:

Distance

Secondary:

Length

Secondary:

Score

Avoid traditional snake terminology.

# ================================================== 15. RENDERING CONSTRAINTS

Snake centered within lane.

Food centered within lane.

Obstacle centered within lane.

No drift.

No offset.

# ================================================== 16. INPUT COMMUNICATION

Player should infer:

Left input -> left lane

Right input -> right lane

No tutorial required.

# ================================================== 17. ACCESSIBILITY

Lane separators visible.

Food distinguishable.

Obstacle distinguishable.

# ================================================== 18. AUTOMATED TESTS

Food Tests

Generate 1000 foods.

Expected:

1000 valid.

Obstacle Tests

Generate 1000 obstacles.

Expected:

1000 valid.

# ================================================== 19. INTEGRATION TESTS

Verify:

Lane movement.

Food collection.

Obstacle collision.

Lane rendering.

# ================================================== 20. HUMAN TEST PROTOCOL

Tester receives no instructions.

Observe first 5 seconds.

Questions:

1. How many lanes exist?
2. How do you move?
3. What do you collect?
4. What do you avoid?

Pass:

4/4 correct.

# ================================================== 21. REVIEWER CHECKLIST

Architecture

[ ] No new systems

Gameplay

[ ] No off-lane entities

Rendering

[ ] Lanes visible

UX

[ ] Comprehension improved

# ================================================== 22. QA CHECKLIST

[ ] Food always reachable
[ ] Obstacles always valid
[ ] Lanes visible
[ ] Inputs understandable
[ ] HUD readable

# ================================================== 23. FAILURE CONDITIONS

Milestone fails if:

- Food can spawn outside lanes
- Obstacles can spawn outside lanes
- Players misunderstand movement
- Players believe board is free movement

# ================================================== 24. ACCEPTANCE CRITERIA

Required:

[ ] No unreachable food
[ ] No off-lane obstacles
[ ] Lane structure visible
[ ] Playtest passes
[ ] QA passes
[ ] Review passes

Milestone cannot be closed until every item passes.
