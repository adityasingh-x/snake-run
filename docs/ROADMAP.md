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

Core Gameplay:

- Snake movement
- Food collection
- Scoring
- Collision detection
- Game over state

Visuals:

- Directional snake eyes

Project Setup:

- React + TypeScript + Vite foundation
- Documentation structure
- Architecture documentation
- Specification documentation

Testing:

- Basic testing infrastructure

---

## In Progress

- Mobile control improvements
- Platform architecture planning
- Foundation refactor planning

---

## Not Started

- Engine/UI separation
- Platform abstraction layer
- PWA support
- Native mobile packaging
- Native desktop packaging

---

# Milestone 1 - Foundation Refactor

Goal:

Prepare the codebase for future growth and multi-platform support.

Key Tasks:

- Separate game engine from React UI
- Create game domain layer
- Establish state boundaries
- Create platform abstraction layer
- Expand automated tests

Suggested Structure:

```text
src/
├── game/
├── platform/
├── ui/
├── hooks/
└── assets/
```

Success Criteria:

- Game engine is React-independent
- Core gameplay logic is testable
- Future platform support becomes simpler

---

# Milestone 2 - Mobile Experience

Goal:

Create a reliable mobile gameplay experience.

Key Tasks:

- Improve swipe controls
- Improve gesture recognition
- Mobile-friendly UI
- Responsive layouts
- Touch interaction improvements
- Mobile performance validation

Success Criteria:

- Reliable controls
- Comfortable one-handed play
- Good experience across common phone sizes

---

# Milestone 3 - PWA Release

Goal:

Get the game into players' hands quickly.

Key Tasks:

- PWA support
- Offline support
- App manifest
- App icons
- Deployment pipeline
- Public hosting

Success Criteria:

- Shareable URL
- Installable on phones
- Installable on desktops
- Playable offline

---

# Milestone 4 - Feedback & Iteration

Goal:

Validate the game with real players.

Key Tasks:

- Gather feedback
- Fix usability issues
- Improve controls
- Improve onboarding
- Resolve gameplay frustrations

Success Criteria:

- Positive feedback from family and friends
- Core gameplay validated

---

# Milestone 5 - Game Polish

Goal:

Transform the game from functional to enjoyable.

Potential Areas:

- Audio improvements
- Visual effects
- Animations
- Accessibility improvements
- Statistics
- Quality-of-life features
- Menus and transitions

Success Criteria:

- Strong game feel
- Better replayability
- Professional presentation

---

# Milestone 6 - Mobile App Release

Technology:

- Capacitor

Goal:

Create native mobile applications.

Key Tasks:

- Android packaging
- iOS packaging
- Store preparation
- Native integrations

Success Criteria:

- Android build available
- iOS build available

---

# Milestone 7 - Desktop Release

Technology:

- Tauri

Goal:

Create native desktop applications.

Key Tasks:

- Windows packaging
- macOS packaging
- Linux packaging
- Desktop-specific improvements

Success Criteria:

- Native desktop builds available

---

# Future Opportunities

These items are intentionally deprioritized until the core game is released.

Possible Future Features:

- Multiple food types
- Power-ups
- Endless mode
- Achievements
- Statistics
- Daily challenges
- Unlockables
- Online leaderboards
- Cloud saves
- Multiplayer
- AI-assisted content generation
- Procedural challenge generation

```

```
