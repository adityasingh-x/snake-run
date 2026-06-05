# Roadmap

## Project Vision

Snake Evolution is evolving through the following stages:

Prototype → Playable Game → Shared Game → Fun Game → Shippable Game

The project prioritizes:

1. Fun
2. Playability
3. Simplicity
4. Maintainability
5. Performance

---

# Technology Direction

The following platform strategy is considered the current project direction.

AI agents should align proposals with this direction unless there is a compelling reason to change it.

## Current Stack

Frontend:

- React
- TypeScript
- Vite

Testing:

- Vitest

Styling:

- CSS Modules

Audio:

- Web Audio API

---

## Planned Platform Strategy

### Web

Primary platform.

Technology:

- React
- TypeScript
- Vite

### Installable Web App

Planned release path:

- Progressive Web App (PWA)

### Mobile Applications

Planned packaging technology:

- Capacitor

### Desktop Applications

Planned packaging technology:

- Tauri

---

# Current Progress

## Completed

### Milestone 1 - Foundation Refactor

- Game engine separated from React
- Platform adapters created
- Framework-agnostic engine
- Automated testing established

### Milestone 2 - Mobile Experience

- Responsive layout
- Swipe controls
- Touch controls
- Mobile UX improvements

### Milestone 3 - PWA Release

- PWA support
- Offline support
- Service worker
- Public deployment
- Installable application

### Milestone 4 - Level Progression System

- Level metadata system (names, descriptions)
- Level complete overlay (combined completion + next level preview)
- Level name displayed in ScoreBoard HUD
- Two-step level transition (freeze → continue)
- Keyboard and button support for advancing between levels

---

## In Progress

### Milestone 5 - Obstacle Redesign

---

## Not Started

- Obstacle redesign
- Difficulty rebalance
- Visual identity
- Replayability systems
- Gameplay expansion
- Feedback and balancing
- Mobile packaging
- Desktop packaging

---

# Milestone 1 - Foundation Refactor ✅

Goal:

Prepare the codebase for future growth.

Success Criteria:

- React-independent game engine
- Platform abstraction layer
- Automated tests

---

# Milestone 2 - Mobile Experience ✅

Goal:

Create a reliable mobile gameplay experience.

Success Criteria:

- Comfortable touch controls
- Responsive layouts
- Mobile-friendly gameplay

---

# Milestone 3 - PWA Release ✅

Goal:

Distribute the game quickly.

Success Criteria:

- Public URL
- Offline support
- Installable application

---

# Milestone 4 - Level Progression System ✅

Goal:

Make progression understandable and visible.

Problem Statement:

Current level progression is difficult to notice.

Players may not understand:

- When a level ends
- Why the snake resets
- What changed in the next level
- What makes levels different

---

## Feature: Level Metadata System ✅

Introduce explicit level definitions.

Each level contains:

- id
- name
- description
- targetScore
- speed

---

## Feature: Level Complete Overlay ✅

When a level is completed:

Pause gameplay.

Display:

- Completed level number and name
- Current score
- Next level name and description
- Continue button (or Space key)

Combined overlay replaces the originally planned separate "Level Introduction Overlay" and "Level Complete Overlay" (see ADR-003).

---

## Feature: Level Name in HUD ✅

Current level name displayed alongside level number in ScoreBoard.

---

## Success Criteria ✅

- Players understand progression
- Level transitions are clear
- Foundation established for future level design

---

# Milestone 5 - Obstacle Redesign

Goal:

Make levels memorable.

Problem Statement:

Current single-tile obstacles rarely influence gameplay.

---

## Feature: Handcrafted Layout System

Create predefined obstacle layouts.

Remove random obstacle generation from progression levels.

Level layouts become authored content.

---

### For Individual Level Designs

Read:

- docs/design/LEVEL_DESIGN.md

---

## Success Criteria

- Every level feels different
- Obstacles influence decisions
- Levels become memorable

---

# Milestone 6 - Difficulty Rebalance

Goal:

Create longer and more meaningful gameplay sessions.

Problem Statement:

Current levels are too short.

Difficulty relies too heavily on speed increases.

---

## Feature: Food Objective System

Replace score-based progression.

Target progression:

| Level | Food Required |
| ----- | ------------- |
| 1     | 10            |
| 2     | 12            |
| 3     | 14            |
| 4     | 16            |
| 5     | 18            |
| 6     | 20            |
| 7     | 22            |
| 8     | 24            |
| 9     | 26            |
| 10    | 30            |

---

## Feature: Speed Curve Rebalance

Current speed progression is too aggressive.

Target progression:

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

Difficulty should come primarily from layouts rather than reaction limits.

---

## Success Criteria

- Levels last longer
- Mobile remains playable
- Difficulty feels fair

---

# Milestone 7 - Visual Identity

Goal:

Establish a recognizable visual style.

Problem Statement:

Current presentation resembles a default application rather than a game.

---

## Theme Direction

Retro Arcade Neon

Characteristics:

- Dark background
- Bright accent colors
- Strong visual hierarchy
- Clean readability

Avoid:

- Flashing effects
- Excessive particles
- Visual clutter

---

## Feature: HUD Redesign

Improve:

- Score display
- Level display
- High score display

Goal:

Create an arcade-style status panel.

---

## Feature: Overlay Redesign

Improve:

- Start screen
- Pause screen
- Game over screen
- Win screen
- Level introduction screen
- Level complete screen

---

## Feature: Typography Pass

Define:

- Primary heading style
- Secondary heading style
- Numeric display style

---

## Success Criteria

- Screenshots appear distinctive
- Visual style feels intentional
- UI no longer resembles a starter template

---

# Milestone 8 - Replayability Systems

Goal:

Encourage repeat play.

Features:

### Endless Mode

Continue after level 10.

### Statistics

Track:

- Games played
- Total food eaten
- Highest score
- Best level reached

### Achievements

Examples:

- Complete level 10
- Reach 500 score
- Complete game without pausing

Success Criteria:

- Players have reasons to return

---

# Milestone 9 - Gameplay Expansion

Goal:

Introduce new gameplay decisions.

Features:

### Food Variants

Examples:

- Gold food
- Poison food
- Speed food

### Advanced Level Mechanics

Examples:

- Wrap-around levels
- Portal levels
- Moving obstacles

### Advanced Challenges

Examples:

- Enemy snake
- Boss levels

Success Criteria:

- Runs become less predictable
- New mechanics create meaningful decisions

---

# Milestone 10 - Feedback & Balancing

Goal:

Validate gameplay with real players.

Tasks:

- Playtesting
- Difficulty tuning
- Balance adjustments
- UX improvements

Success Criteria:

- Difficulty feels fair
- Major frustrations resolved

---

# Milestone 11 - Game Polish

Goal:

Improve game feel.

Features:

- Particle effects
- Animation improvements
- Audio improvements
- Accessibility improvements
- Theme support

Success Criteria:

- Professional presentation
- Strong game feel

---

# Milestone 12 - Mobile App Release

Technology:

- Capacitor

Success Criteria:

- Android build
- iOS build

---

# Milestone 13 - Desktop Release

Technology:

- Tauri

Success Criteria:

- Windows build
- macOS build
- Linux build

---

# Future Opportunities

Intentionally deprioritized.

Possible Future Features:

- Global leaderboards
- Ghost runs
- Cloud saves
- Multiplayer
- Daily challenges
- Procedural challenge generation
- Adaptive difficulty
- AI-assisted content generation
