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

## Documentation Structure

ROADMAP.md
prd/PRD_M13_1.md
prd/PRD_M13_5.md
prd/PRD_M14.md

PRDs are authoritative.

---

# Current Progress

Milestone 13.1 is the next milestone.

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

## Current Sequence

Milestone 13 Completed

Next:

- Milestone 13.1 -> prd/PRD_M13_1.md
- Milestone 13.5 -> prd/PRD_M13_5.md
- Milestone 14 -> prd/PRD_M14.md

No milestone may begin until previous milestone acceptance criteria pass.

---

# Roadmap Governance

When completing a milestone:

1. Move the completed milestone from ROADMAP.md to `docs/archive/completed-milestones.md`.
2. Update roadmap progress.
3. Update PROJECT_STATE.md.
4. Archive implementation plans.
5. Verify documentation consistency.

A milestone is not complete until documentation has been updated.

The roadmap remains the source of truth for project direction.
