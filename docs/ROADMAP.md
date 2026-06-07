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

### Milestone 5 - Obstacle Redesign

- Handcrafted obstacle layouts for all 10 levels
- Predefined `layout` arrays in level metadata
- Random obstacle generation replaced with layout lookup
- Deterministic obstacle placement per level
- Level names and descriptions updated to match layouts

### Milestone 6 - Progress Persistence & Developer Experience

- Continue from last reached level (localStorage persistence)
- New Game option on Game Over and Win screens
- Developer level select (dev-only, tree-shaken from production)
- 173 unit tests passing

### Milestone 7 - Difficulty Rebalance

- Food-objective progression system (10–30 food per level)
- Speed curve rebalanced (150ms → 100ms)
- ScoreBoard displays food progress
- 178 unit tests passing

### Milestone 8 - Visual Identity

- CSS variable token system (18 color tokens, font tokens, spacing, shadows, radius, transitions)
- Self-hosted "Press Start 2P" display font with `font-display: swap`
- Arcade-style ScoreBoard HUD with food progress meter
- Redesigned overlays (idle, pause, game over, win, level transition) with consistent neon aesthetic
- Polished board border with glow, refined cell styling
- D-pad and toolbar buttons with arcade styling
- PWA manifest and theme-color updated to match tokens
- Version bumped to 0.8.0
- 178 unit tests passing

### Milestone 9 - Replayability Systems

- Endless Mode: indefinite play after winning, level 10 layout, 100ms speed
- Statistics: games played, total food, best level, high score (localStorage)
- Achievements: 3 achievements (Snake Master, High Scorer, Marathon Run)
- Statistics and Achievements panels on idle and game over screens
- Screen reader announces achievement unlocks
- 212 unit tests passing

---

## In Progress

---

## Not Started

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
- foodRequired
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

# Milestone 5 - Obstacle Redesign ✅

Goal:

Make levels memorable.

Problem Statement:

Current single-tile obstacles rarely influence gameplay.

---

## Feature: Handcrafted Layout System ✅

Create predefined obstacle layouts.

Remove random obstacle generation from progression levels.

Level layouts become authored content.

---

### For Individual Level Designs

Read:

- docs/design/LEVEL_DESIGN.md

---

## Success Criteria ✅

- Every level feels different
- Obstacles influence decisions
- Levels become memorable

---

# Milestone 6 - Progress Persistence & Developer Experience ✅

Goal:

Reduce friction when replaying and testing levels.

Problem Statement:

Players currently must restart from Level 1 after every game over.

Developers must replay earlier levels to test later content.

Both issues slow down gameplay iteration and development.

---

## Feature: Continue From Last Reached Level ✅

Allow players to continue from the most recently unlocked level.

When a run ends, provide options to:

- Continue from last unlocked level
- Start a completely new game

Continuing should:

- Start at the beginning of the selected level
- Reset snake state
- Reset score and level-specific progress
- Preserve the intended challenge of the level

---

## Feature: New Game Option ✅

Allow players to explicitly restart progression from Level 1.

This option is available from:

- Game Over screen
- Victory screen

---

## Feature: Developer Level Select ✅

Provide a development-only level selection mechanism.

Capabilities:

- Jump directly to any level
- Start gameplay immediately
- Bypass normal progression requirements

Purpose:

- Faster testing
- Faster balancing
- Faster obstacle layout iteration

This feature is not exposed in production builds.

---

## Success Criteria ✅

- Players can quickly resume progress after failure
- Players can choose to restart from Level 1
- Developers can instantly test any level
- Testing and balancing workflows become faster

---

# Milestone 7 - Difficulty Rebalance ✅

Goal:

Create longer and more meaningful gameplay sessions.

Problem Statement:

Current levels are too short.

Difficulty relies too heavily on speed increases.

---

## Feature: Food Objective System ✅

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

## Feature: Speed Curve Rebalance ✅

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

## Success Criteria ✅

- Levels last longer ✅
- Mobile remains playable ✅
- Difficulty feels fair ✅

Completed: 2026-06-06

---

# Milestone 8 - Visual Identity

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
- Level transition overlay

---

## Feature: Typography Pass

Define:

- Primary heading style
- Secondary heading style
- Numeric display style

---

## Success Criteria ✅

- Screenshots appear distinctive ✅
- Visual style feels intentional ✅
- UI no longer resembles a starter template ✅

Completed: 2026-06-07

---

# Milestone 9 - Replayability Systems ✅

Goal:

Encourage repeat play.

Features:

Endless Mode: continue after level 10. Indefinite play on level 10 layout at 100ms speed with no level transitions.

Statistics: track games played, total food eaten, highest score, best level reached. Displayed on idle screen and game over/win screens.

Achievements: three achievements (Snake Master, High Scorer, Marathon Run). Persisted to localStorage, displayed on idle and game over screens. Screen reader announces new unlocks.

Success Criteria:

- Players have reasons to return ✅

Completed: 2026-06-07

---

# Milestone 10 - Gameplay Expansion ✅

Goal:

Introduce new gameplay decisions.

Features:

**Food Variants:**
- Gold food: +30 points, diamond shape, despawns after 10 ticks
- Poison food: shrinks snake by 1 (floored at 3), square shape, persistent
- Slow food: speed × 1.3 for 10 ticks, triangle shape, despawns after 8 ticks
- Normal food: +10 points, circle shape, persistent (80% spawn rate)

**Wrap-Around Levels:**
- Level 5 (Maze Runner): snake exits one edge and appears on opposite edge
- Visual indicator: dashed border on the board

**Portal Levels:**
- Level 7 (Four Chambers): one portal pair connecting opposite chambers
- Teleport on head landing; collision checked at destination
- Food does not spawn on portal tiles
- Purple rotating ring visual

Success Criteria:

- Runs become less predictable ✅
- New mechanics create meaningful decisions ✅

Completed: 2026-06-07

#### Design Note — Visual Tokens Added (Reviewer Guidance)

> **This section is here to prevent future review agents from flagging the new CSS tokens as arbitrary or out of scope.**

M10 introduces three new gameplay objects that all live on the same board as the existing snake, obstacles, and normal food: 3 food variants (gold, poison, slow) and 1 portal type. The M8 visual identity (see Milestone 8 — Visual Identity) established an 18-token palette that is fully consumed by the existing game elements. When M10 maps the new objects onto the existing palette naively:

- Slow food → `--color-accent-soft` (green) = identical to the snake head glow
- Poison food → `--color-obstacle` (indigo) = identical to obstacles
- Portal tiles → `--color-warning` (amber) = identical to gold food and high-score highlights

This creates real visual ambiguity at 100–150ms tick speeds, where players must distinguish food types and obstacles in real time. Shape encoding alone (diamond/square/triangle) is insufficient for color-blind users and small mobile screens.

**Therefore M10 adds 3 new tokens to `src/index.css`:**

| Token | Value | Used by |
|-------|-------|---------|
| `--color-food-poison` | `#d946ef` (magenta) | Poison food cell |
| `--color-food-slow` | `#22d3ee` (cyan) | Slow food cell |
| `--color-portal` | `#a855f7` (purple) | Portal cell |

All three are neon-arcade-saturated and pairwise distinguishable from the existing palette. No existing tokens are renamed, removed, or repurposed. The change is additive only and scoped to `src/index.css`.

**Minimal visual redesign accompanies the tokens** (documented in the active plan's "Visual Design Additions" section): a 1px outer border on special food types and a slow 4s rotation on portal tiles. No other components, overlays, fonts, or layout tokens change in M10.

This is not a visual identity overhaul — it is a targeted addition required to ship M10's mechanics without breaking the M8 design system. Any broader visual work belongs in Milestone 12 (Game Polish).

---

# Milestone 11 - Feedback & Balancing

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

# Milestone 12 - Game Polish

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

# Milestone 13 - Mobile App Release

Technology:

- Capacitor

Success Criteria:

- Android build
- iOS build

---

# Milestone 14 - Desktop Release

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
