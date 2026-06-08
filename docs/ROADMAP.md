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

- Continue from last reached level
- New Game option
- Developer level select
- Local persistence

### Milestone 7 - Difficulty Rebalance

- Food-objective progression system
- Speed curve rebalance
- HUD food progress display

### Milestone 8 - Visual Identity

- Tokenized design system
- Retro arcade visual identity
- HUD redesign
- Overlay redesign
- Typography pass

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

- BFS-based reachability analysis module
- Portal safety validation (bounds, overlap, distinctness)
- Food spawn capacity validation (all 10 levels)
- Systematic level-by-level validation suite (75 tests)
- Persistence corruption resilience (statistics, achievements)
- Engine persistence validation (destroy+recreate, pause stats, playing high score)
- Manual validation documentation

---

## In Progress

None

---

## Not Started

- UX and navigation
- Onboarding
- Polish
- Accessibility pass
- Mobile release
- Desktop release

---

# Current Project Assessment

The game has moved beyond the "Playable Game" stage.

The project already contains:

- Full gameplay loop
- 10 handcrafted levels
- Multiple gameplay mechanics
- Replayability systems
- Persistence systems
- Mobile support
- PWA deployment
- Accessibility foundations
- Endless mode

The next phase should focus on:

1. Validation
2. User experience
3. Polish
4. Packaging

Large gameplay feature additions are intentionally paused until validation is complete.

---

# Milestone 11 - Gameplay Validation & Stability

Goal:

Guarantee that all gameplay systems are correct, stable, completable, and free of progression blockers.

Problem Statement:

Recent testing identified level-start issues and potential level design defects.

Handcrafted levels currently lack automated validation.

The game must prove that every level is playable before further expansion.

---

## Feature: Spawn Safety Validation

Every level must guarantee:

- Snake does not overlap obstacles
- Snake does not overlap portals
- Snake does not overlap food
- Snake spawn is inside board bounds
- Snake has at least one valid movement option

---

## Feature: Level Integrity Validation

Every level must guarantee:

- Obstacles remain inside board bounds
- No overlapping obstacle coordinates
- No overlapping special objects
- No unreachable board sections caused by layout errors

---

## Feature: Reachability Validation

Every level must guarantee:

- Food can spawn in reachable locations
- Food cannot spawn inside obstacles
- Food cannot spawn inside portals
- Level objectives can always be completed

---

## Feature: Portal Validation

Portal levels must guarantee:

- Exactly two portal endpoints
- No portal overlap with obstacles
- No portal overlap with spawn locations
- Teleport destinations remain safe

---

## Feature: Wrap-Around Validation

Wrap-around levels must guarantee:

- Consistent edge behavior
- No collision bugs during wrapping
- Correct interaction with food and obstacles

---

## Feature: Persistence Validation

Verify:

- Continue progression
- High score persistence
- Statistics persistence
- Achievement persistence

---

## Feature: Automated Gameplay Validation Suite

Create tests for:

- Every level definition
- Every food variant
- Portals
- Wrap-around logic
- Progression
- Endless mode

---

## Manual Validation Requirement

Complete:

- One full Level 1–10 run
- One Endless Mode run
- One keyboard-only run
- One mobile run

Document findings.

---

## Success Criteria

- No broken levels
- No impossible starts
- No progression blockers
- No known gameplay defects
- All validation tests passing

---

# Milestone 12 - User Experience & Navigation

Goal:

Make the game feel like a complete product rather than a development build, including navigation, settings, and player personalization.

Problem Statement:

The game contains many systems, but players are not guided through them.

Current navigation is functional but developer-oriented.

---

## Feature: Main Menu

Create a dedicated entry experience.

Options:

- Continue
- New Game
- Statistics
- Achievements
- Settings
- Credits

---

## Feature: Continue Experience

Display:

- Last unlocked level
- High score
- Best level reached

Continue should clearly communicate what will happen.

---

## Feature: Statistics Screen

Dedicated screen.

Display:

- Games played
- Food eaten
- High score
- Best level reached

---

## Feature: Achievements Screen

Dedicated screen.

Display:

- Achievement list
- Locked achievements
- Unlock requirements

---

## Feature: Settings Screen

Settings:

- Sound on/off
- Theme selection
- Reset progress
- Reset statistics
- Reset achievements

Dangerous actions require confirmation.

### Theme Selection

Allow players to choose from multiple visual themes.

Themes should be implemented using the existing design token system introduced in Milestone 8.

Requirements:

- Theme selection available from Settings
- Theme choice persists between sessions
- Theme changes apply immediately without page reload
- All game screens must support themes
- All HUD elements must support themes
- All overlays must support themes
- Accessibility contrast requirements must still be met

Initial themes:

#### Neon Arcade (Default)

Current visual style.

Characteristics:

- Dark navy background
- Cyan glow
- Green snake
- Purple obstacles

#### Classic Snake

Inspired by classic mobile snake games.

Characteristics:

- Light background
- Dark snake
- Minimal glow effects
- Retro appearance

#### Terminal

Inspired by retro computer terminals.

Characteristics:

- Black background
- Green monochrome palette
- Minimal visual effects

#### High Contrast

Accessibility-focused theme.

Characteristics:

- Maximum contrast
- Highly distinguishable gameplay elements
- Reduced decorative effects

Implementation Notes:

- Themes should modify design tokens only
- Components should not contain theme-specific logic
- Existing CSS variable architecture should remain the single source of truth
- New themes should be addable without modifying gameplay components

Theme Success Criteria:

- Players can switch themes at any time
- Theme selection persists across sessions
- All game screens render correctly in every theme
- New themes can be added with minimal engineering effort

---

## Feature: Credits Screen

Display:

- Project name
- Author
- Technology stack

---

## Feature: Improved Pause Experience

Pause screen should expose:

- Resume
- Restart level
- Return to menu

---

## Success Criteria

- Players always know what to do next
- Navigation feels intentional
- Settings feel complete
- Theme selection works across the entire application
- Game feels complete

---

# Milestone 13 - Onboarding & Discoverability

Goal:

Teach players the game's mechanics without requiring external documentation.

Problem Statement:

The game now contains mechanics that are not self-explanatory.

A new player may not understand:

- Gold food
- Poison food
- Slow food
- Portals
- Wrap-around levels
- Endless mode
- Achievements

---

## Feature: First-Time Player Experience

Show onboarding only when appropriate.

Must be skippable.

---

## Feature: Gameplay Guide

Create an in-game guide.

Explain:

- Controls
- Objectives
- Scoring
- Progression

---

## Feature: Mechanics Guide

Explain:

### Gold Food

- Bonus score
- Temporary availability

### Poison Food

- Snake shrinking behavior

### Slow Food

- Temporary speed reduction

### Portals

- Teleportation rules

### Wrap-Around Levels

- Edge behavior

---

## Feature: Endless Mode Explanation

Explain:

- Unlock conditions
- Endless progression
- Scoring expectations

---

## Success Criteria

- New players understand all mechanics
- No external documentation required

---

# Milestone 14 - Game Polish

Goal:

Improve game feel and presentation.

Problem Statement:

The game is feature-complete but lacks the feedback expected from a finished game.

---

## Feature: Food Collection Effects

Add:

- Glow pulse
- Particle burst
- Collection animation

---

## Feature: Snake Death Effects

Add:

- Death animation
- Impact feedback
- Screen response

---

## Feature: Level Completion Effects

Add:

- Completion celebration
- Improved transitions
- Visual reward feedback

---

## Feature: Achievement Popups

Display:

- Achievement name
- Description
- Temporary notification

---

## Feature: HUD Animation Pass

Improve:

- Score updates
- Food counters
- Level indicators

---

## Feature: Menu Animation Pass

Improve:

- Screen transitions
- Overlay transitions
- Button interactions

---

## Feature: Audio Expansion

Add:

- Menu sounds
- Achievement sounds
- Better level-complete sounds
- Improved death sounds

Do not add background music in this milestone.

---

## Success Criteria

- Stronger game feel
- Better feedback
- More satisfying gameplay

---

# Milestone 15 - Accessibility & Quality

Goal:

Improve inclusivity, maintainability, and long-term stability.

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

- Food variants remain distinguishable
- Portals remain distinguishable
- Obstacles remain distinguishable

---

## Feature: Reduced Motion Support

Support browser motion preferences.

Reduce:

- Animations
- Effects
- Transitions

---

## Feature: UI Testing

Introduce automated UI validation.

Cover:

- Main menu
- Progression flow
- Achievement flow
- Statistics flow
- Settings flow

---

## Success Criteria

- Better accessibility
- Better quality guarantees
- Reduced regression risk

---

# Milestone 16 - Mobile App Release

Technology:

Capacitor

Goal:

Ship native mobile versions.

---

## Feature: Capacitor Integration

Support:

- Android
- iOS

---

## Feature: Mobile QA

Verify:

- Gestures
- Touch controls
- Safe areas
- Orientation handling

---

## Feature: Store Assets

Create:

- App icons
- Splash screens
- Screenshots

---

## Success Criteria

- Android build available
- iOS build available

---

# Milestone 17 - Desktop Release

Technology:

Tauri

Goal:

Ship native desktop versions.

---

## Feature: Desktop Packaging

Support:

- Windows
- macOS
- Linux

---

## Feature: Desktop QA

Verify:

- Keyboard controls
- Window resizing
- Fullscreen behavior
- Offline behavior

---

## Success Criteria

- Windows build available
- macOS build available
- Linux build available

---

# Future Opportunities

Only consider after Milestone 17.

Potential future additions:

- Global leaderboards
- Cloud saves
- Daily challenges
- Ghost runs
- Multiplayer
- Procedural challenge generation
- Additional level packs
- Additional achievements
- Theme packs
- Seasonal events
- AI-assisted content generation

---

# Roadmap Governance

When completing a milestone:

1. Update roadmap progress
2. Update PROJECT_STATE.md
3. Archive implementation plans
4. Verify documentation matches implementation

A milestone is not complete until documentation has been updated.

The roadmap is the source of truth for project direction.
