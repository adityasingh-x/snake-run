# Completed Milestones Archive

This file contains milestones that have been completed and removed from ROADMAP.md.

---

## Milestone 1 - Foundation Refactor

- Game engine separated from React
- Platform adapters created
- Framework-agnostic engine
- Automated testing established

## Milestone 2 - Mobile Experience

- Responsive layout
- Swipe controls
- Touch controls
- Mobile UX improvements

## Milestone 3 - PWA Release

- PWA support
- Offline support
- Service worker
- Public deployment
- Installable application

## Milestone 4 - Level Progression System

- Level metadata system
- Level completion flow
- Level HUD integration
- Level progression support

## Milestone 5 - Obstacle Redesign

- Handcrafted obstacle layouts
- Deterministic obstacle placement
- Layout-based level generation

## Milestone 6 - Progress Persistence & Developer Experience

- Continue support
- New Game support
- Developer level select
- Local persistence

## Milestone 7 - Difficulty Rebalance

- Food objective progression
- Speed curve rebalance
- HUD progress tracking

## Milestone 8 - Visual Identity

- Design token system
- Visual identity pass
- HUD redesign
- Overlay redesign

## Milestone 9 - Replayability Systems

- Endless Mode
- Statistics
- Achievements
- Persistence-backed progression

## Milestone 10 - Gameplay Expansion

- Gold food
- Poison food
- Slow food
- Wrap-around gameplay
- Portal gameplay

## Milestone 11 - Gameplay Validation & Stability

- Reachability validation
- Spawn validation
- Portal validation
- Progression validation
- Gameplay test suite

## Milestone 12 - User Experience & Navigation

- Main menu
- Continue flow
- Statistics screen
- Achievements screen
- Settings screen
- Theme system
- Help screen
- Pause menu improvements

## Milestone 13 - Runner Prototype Validation

- Endless runner mode with auto-advancing snake (UP movement)
- Three-lane system (Left/Center/Right) with lane change controls
- Tail lane blocking prevents lane changes into body-occupied lanes
- Y-axis wrap-around course generation with difficulty-scaling obstacles
- Distance-based scoring (1 point per 10 distance) + food scoring with length multiplier
- RunnerHUD (Distance, Food, Length, High Score) and RunnerGameOver overlay
- Speed curve: 200ms → 80ms (decreases 2ms every 50 distance)
- Runner entry point in MainMenu
- 415 tests passing across 26 test files
- Documentation: SPEC.md §20 Runner Mode, updated ARCHITECTURE.md

---

## Milestone 13 Target Vision — Runner Prototype

### Purpose

This milestone is a gameplay validation milestone.

The objective is NOT to build a production-ready game.

The objective is to determine whether a Snake-based endless runner is more engaging than the current level-based Snake game.

### Core Gameplay Loop

Player starts a run.

The snake automatically moves forward.

The player changes lanes left and right.

The player collects food.

Food increases snake length.

Longer snakes increase score potential but become harder to manage.

The player avoids obstacles.

Eventually the player crashes.

The player immediately starts another run.

Gameplay loop:

Run
→ Collect Food
→ Grow Longer
→ Earn Higher Score
→ Take More Risks
→ Become Harder To Control
→ Crash
→ Play Again

### Player Controls

Desktop:

- Left Arrow = Move Left Lane
- Right Arrow = Move Right Lane
- A = Move Left Lane
- D = Move Right Lane

Mobile:

- Swipe Left = Move Left Lane
- Swipe Right = Move Right Lane

Player does NOT control:

- Up
- Down
- Forward movement

Forward movement is automatic.

### Board Structure

The game uses three fixed lanes.

Lane positions:

- Left Lane
- Center Lane
- Right Lane

The snake always occupies one lane.

Lane changes should feel responsive.

### Camera & Movement

The game should create the feeling that the snake is constantly advancing forward.

Possible implementations:

Option A:

- Snake remains near bottom of screen.
- Obstacles move toward player.

Option B:

- World scrolls downward.
- Snake appears to advance upward.

Either approach is acceptable.

The visual goal is:

"Temple Run / Subway Surfers style forward motion."

### Obstacles

Obstacles continuously appear ahead.

Obstacle placement should force lane decisions.

Examples:

Single obstacle:

Lane 1 blocked

Double obstacle:

Lane 1 and Lane 2 blocked

Gap pattern:

Only one safe lane

Obstacle collision immediately ends the run.

No health system.

No recovery system.

No shields.

### Food

Food appears inside lanes.

Food should encourage risk-taking.

Food collection:

- Increases score
- Increases snake length

Only standard food exists in this milestone.

Do NOT implement:

- Gold food
- Poison food
- Slow food

### Snake Growth

Snake begins small.

Food increases length.

Longer snakes are visually obvious.

The prototype must preserve the feeling that:

"A longer snake is valuable."

Even if the difficulty effects are initially simple.

### Scoring

Primary score:

Distance traveled.

Secondary score:

Food collected.

HUD displays:

- Distance
- Food collected
- Current snake length
- High score

### Difficulty

Difficulty gradually increases during a run.

Examples:

- Faster scrolling
- More obstacles
- Harder obstacle patterns

Implementation may be simple.

Sophisticated balancing is not required.

### Game Over Screen

Display:

- Distance traveled
- Food collected
- Final snake length
- High score

Primary action:

Play Again

The player should be able to restart almost instantly.

### Explicitly Out Of Scope

Do NOT implement:

- Powerups
- Missions
- Unlockables
- Cosmetics
- Skins
- Daily challenges
- Online features
- Progression systems
- Story systems
- Advanced visual effects

### Existing Systems To Reuse

Reuse whenever possible:

- Existing game engine
- Existing collision system
- Existing food system
- Existing touch controls
- Existing persistence system
- Existing statistics system
- Existing audio system

Avoid unnecessary rewrites.

### Success Criteria

The prototype is successful if the answer to the following question is YES:

"Is this more fun and replayable than the current level-based Snake gameplay?"

The prototype does not need to be polished.

It only needs to validate the gameplay concept.
