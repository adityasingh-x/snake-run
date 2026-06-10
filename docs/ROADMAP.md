# Roadmap

## Project Vision

Snake Run is evolving through the following stages:

Prototype → Playable Runner → Fun Runner → Polished Runner → Shippable Game

The project prioritizes:

1. Fun
2. Playability
3. Game Feel
4. Simplicity
5. Maintainability
6. Performance

---

# Product Vision

Snake Run is an endless runner where the player controls a growing snake.

The snake automatically advances through increasingly dangerous obstacle courses.

Food increases snake length.

Longer snakes increase score potential but also increase difficulty.

The core gameplay loop is:

Run
→ Collect Food
→ Grow Longer
→ Earn Higher Score
→ Become Harder To Control
→ Take Bigger Risks
→ Eventually Crash
→ Play Again

Snake Run is not competing with traditional Snake games.

Snake Run is competing with:

- Temple Run
- Subway Surfers
- Jetpack Joyride

The unique differentiator is snake growth and length-based risk management.

---

# Technology Direction

The following platform strategy remains the current direction.

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

Target:

- Android
- iPhone
- Windows
- macOS
- Linux

### Mobile Applications

Planned packaging technology:

- Capacitor

Target:

- Android
- iOS

### Desktop Applications

Planned packaging technology:

- Tauri

Target:

- Windows
- macOS
- Linux

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

- Level metadata system
- Level completion flow
- Level HUD integration
- Level progression support

### Milestone 5 - Obstacle Redesign

- Handcrafted obstacle layouts
- Deterministic obstacle placement
- Layout-based level generation

### Milestone 6 - Progress Persistence & Developer Experience

- Continue support
- New Game support
- Developer level select
- Local persistence

### Milestone 7 - Difficulty Rebalance

- Food objective progression
- Speed curve rebalance
- HUD progress tracking

### Milestone 8 - Visual Identity

- Design token system
- Visual identity pass
- HUD redesign
- Overlay redesign

### Milestone 9 - Replayability Systems

- Endless Mode
- Statistics
- Achievements
- Persistence-backed progression

### Milestone 10 - Gameplay Expansion

- Gold food
- Poison food
- Slow food
- Wrap-around gameplay
- Portal gameplay

### Milestone 11 - Gameplay Validation & Stability

- Reachability validation
- Spawn validation
- Portal validation
- Progression validation
- Gameplay test suite

### Milestone 12 - User Experience & Navigation

- Main menu
- Continue flow
- Statistics screen
- Achievements screen
- Settings screen
- Theme system
- Help screen
- Pause menu improvements

---

## In Progress

### Milestone 13 - Runner Prototype Validation

Not Started

---

# Current Project Assessment

The original level-based Snake experience is feature-rich and technically complete.

However, gameplay evaluation suggests that the current direction does not create sufficient tension, excitement, or replayability.

The project is pivoting toward an endless runner structure while preserving the strongest parts of the existing codebase:

- Engine architecture
- Input systems
- Mobile controls
- Persistence systems
- Statistics systems
- Achievement systems
- Theme system
- Audio foundation

The objective is to discover whether endless-runner gameplay produces a more engaging experience than the current level-based design.

---

# Milestone 13 - Runner Prototype Validation

## Goal

Prove that Snake Run is more engaging as an endless runner than as a traditional snake game.

This milestone is intentionally experimental.

Do not optimize architecture.

Do not optimize polish.

Do not optimize menus.

Focus exclusively on validating the core gameplay loop.

---

## Success Question

At the end of this milestone the team must answer:

"Is endless runner gameplay more enjoyable than the current level-based gameplay?"

---

## Feature: Runner Prototype Mode

Requirements:

- Create a dedicated Runner Mode.
- Existing gameplay remains functional.
- Runner Mode can be launched directly from the menu.
- Runner Mode becomes the primary experimentation environment.

---

## Feature: Automatic Forward Motion

Requirements:

- Snake continuously advances.
- Player does not control forward movement.
- Player only controls horizontal movement.

Desktop Controls:

- Left Arrow
- Right Arrow
- A
- D

Mobile Controls:

- Swipe Left
- Swipe Right

No Up control.

No Down control.

---

## Feature: Three Lane System

Requirements:

- Fixed lane architecture.
- Left lane.
- Center lane.
- Right lane.

Snake occupies exactly one lane.

Lane changes should feel responsive.

---

## Feature: Infinite Course Generation

Requirements:

- Infinite scrolling gameplay.
- Obstacles continuously appear.
- Course extends indefinitely.
- Difficulty gradually increases.

Initial implementation should prioritize simplicity over sophistication.

---

## Feature: Distance-Based Scoring

Primary Score Source:

- Distance traveled

Secondary Score Source:

- Food collected

Display:

- Distance
- Food
- Length
- High Score

---

## Feature: Basic Food Collection

Requirements:

- Food appears inside lanes.
- Food increases score.
- Food increases snake length.

Exclude:

- Gold food
- Poison food
- Slow food

for this milestone.

---

## Feature: Obstacle Avoidance

Requirements:

- Obstacles appear in lanes.
- Obstacle collision immediately ends run.

No health system.

No shields.

No recovery mechanics.

---

## Feature: Fast Restart Flow

Game Over Screen Displays:

- Distance traveled
- Food collected
- Final snake length
- High score

Primary Action:

- Play Again

Target:

Player can begin a new run within 2 seconds.

---

## Success Criteria

The game creates the following loop:

Play
→ Crash
→ Retry

Players voluntarily restart multiple times.

The team believes this direction is more engaging than the level-based version.

---

# Milestone 14 - Snake Growth Risk System

## Goal

Make growth create meaningful tension.

---

## Problem Statement

Growth currently provides reward without sufficient downside.

Longer snakes should become increasingly difficult to manage.

---

## Feature: Dynamic Tail Difficulty

Requirements:

- Longer snakes consume more space.
- Navigation becomes more difficult.
- Mistakes become more punishing.

---

## Feature: Score Multipliers

Multiplier increases with snake length.

Example:

- Length 3 = x1
- Length 10 = x2
- Length 20 = x3
- Length 30 = x4

Exact values to be tuned.

---

## Feature: Risk Routes

Design obstacle layouts that create choices:

Safe Route:

- Lower score potential

Risk Route:

- More food
- More score
- Greater danger

---

## Feature: Growth Milestones

Examples:

- Length 10
- Length 20
- Length 30

Provide:

- Visual feedback
- Audio feedback
- Score feedback

---

## Success Criteria

Players willingly take dangerous routes in order to grow larger.

Growth becomes the central strategic decision.

---

# Milestone 15 - Runner Content Expansion

## Goal

Create gameplay variety while preserving the core loop.

---

## Feature: Obstacle Pattern Library

Create reusable obstacle patterns.

Examples:

- Single blocker
- Double blocker
- Triple blocker
- Funnel
- Zig-zag
- Split route
- Narrow passage

---

## Feature: Near Miss Design

Requirements:

Create situations where:

- Success feels exciting
- Failure feels fair

---

## Feature: Difficulty Director

Progressively increase:

- Speed
- Obstacle density
- Pattern complexity

during longer runs.

---

## Feature: Runner Events

Examples:

- Dense traffic sections
- Food rush sections
- Survival sections
- High-risk sections

---

## Success Criteria

Runs remain engaging for at least 5 minutes.

Players encounter meaningful variation.

---

# Milestone 16 - Powerups & Advanced Mechanics

## Goal

Expand gameplay depth after the core loop is proven.

---

## Feature: Magnet

Temporarily attracts nearby food.

---

## Feature: Shield

Protects from one collision.

---

## Feature: Slow Motion

Temporarily reduces game speed.

---

## Feature: Food Chains

Reward consecutive food collection.

---

## Feature: Combo System

Increase score through sustained performance.

---

## Success Criteria

Powerups enhance gameplay without replacing the core risk/reward loop.

---

# Milestone 17 - Meta Progression

## Goal

Create long-term player retention.

---

## Feature: Missions

Examples:

- Reach Length 20
- Reach Length 50
- Survive 3 Minutes
- Collect 500 Food

---

## Feature: Achievement Integration

Adapt existing achievement system to runner gameplay.

---

## Feature: Statistics Integration

Track:

- Best Distance
- Longest Snake
- Total Food
- Total Runs
- Average Run Length

---

## Feature: Unlockables

Examples:

- Snake skins
- Themes
- Trails
- Effects

---

## Success Criteria

Players have goals beyond chasing a single high score.

---

# Milestone 18 - Visual Identity & Game Feel

## Goal

Make Snake Run visually distinct and emotionally satisfying.

---

## Feature: Runner Presentation

Improve:

- Sense of speed
- Motion feedback
- Visual depth
- Dynamic backgrounds

---

## Feature: Growth Feedback

Add:

- Growth animation
- Milestone effects
- Multiplier feedback

---

## Feature: Collection Feedback

Add:

- Particle effects
- Screen feedback
- Reward animations

---

## Feature: Audio Pass

Add:

- Collection sounds
- Near miss sounds
- Growth milestone sounds
- Improved death sounds

---

## Success Criteria

The game immediately communicates:

"Endless runner with a growing snake."

---

# Milestone 19 - Accessibility & Quality

## Goal

Improve inclusivity, quality, and stability.

---

## Feature: Accessibility Audit

Review:

- Keyboard navigation
- Screen readers
- Focus management
- Contrast ratios

---

## Feature: Color-Blind Review

Verify:

- Food visibility
- Obstacle visibility
- Powerup visibility

---

## Feature: Reduced Motion Support

Support browser motion preferences.

---

## Feature: Automated UI Testing

Cover:

- Menu flows
- Runner flows
- Progression flows
- Statistics flows

---

## Success Criteria

High-quality, accessible experience.

---

# Milestone 20 - Mobile Release

Technology:

- Capacitor

Goal:

Ship native mobile versions.

---

## Feature: Mobile QA

Verify:

- Gestures
- Safe areas
- Performance
- Device compatibility

---

## Feature: Store Assets

Create:

- Icons
- Screenshots
- Marketing assets

---

## Success Criteria

Android and iOS builds available.

---

# Milestone 21 - Desktop Release

Technology:

- Tauri

Goal:

Ship native desktop versions.

---

## Feature: Desktop QA

Verify:

- Keyboard controls
- Resizing
- Fullscreen support
- Offline support

---

## Success Criteria

Windows, macOS, and Linux builds available.

---

# Future Opportunities

Only consider after Milestone 21.

Potential future additions:

- Global leaderboards
- Cloud saves
- Daily challenges
- Ghost runs
- Multiplayer
- Seasonal events
- Community challenges
- Additional game modes

---

# Roadmap Governance

When completing a milestone:

1. Update roadmap progress.
2. Update PROJECT_STATE.md.
3. Archive implementation plans.
4. Verify documentation consistency.

A milestone is not complete until documentation has been updated.

The roadmap remains the source of truth for project direction.
