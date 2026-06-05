# ADR-003: Single Combined Overlay for Level Transitions

**Status:** Accepted
**Date:** 2026-06-05
**Milestone:** 4 — Level Progression System

## Context

ROADMAP.md §Milestone 4 defines two separate overlay features:

1. **Level Introduction Overlay** — shown before a level begins, displaying level number, name, description, and objective, with a [Start] button.
2. **Level Complete Overlay** — shown when a level ends, displaying completed level, score, and next level preview, with a [Continue] button.

Under the two-overlay model, every level transition (L1→L2, L2→L3, …) would require two sequential overlays and two user actions (click [Start] → play → click [Continue]) to move to the next level.

## Decision

**Use a single combined overlay** that shows both the completion message and the next level preview in one screen, requiring one user action per transition.

The combined overlay displays:
- "Level N Complete"
- Next level name and description
- Current score
- [Continue] button + Space key

Level 1's introduction is handled by the existing idle overlay (already visible when the game loads), which will be enhanced with level 1 metadata.

This means the standalone "Level Introduction Overlay" feature defined in ROADMAP.md is formally retired and replaced by the combined overlay.

## Rationale

1. **Playability.** Two sequential overlays per transition would require two clicks to advance each level, slowing gameplay and adding friction. One click per level keeps the game's pacing intact.

2. **Information density.** A single overlay can present both "congratulations" and "what's next" without requiring the player to read two separate screens. The combined format mirrors common mobile game patterns (e.g., "Level Complete! Next: … → Tap to Continue").

3. **Implementation simplicity.** One overlay component replaces two, reducing UI code, test surface area, and state machine complexity. This aligns with AGENTS.md's "prefer simple solutions" guidance.

4. **Level 1 introduction.** Players already see the "Snake Run" title and controls summary in the idle overlay before starting. Enhancing this with level 1 metadata covers the "before a level begins" use case for the first level without adding a separate screen.

## Consequences

- ROADMAP.md §Milestone 4 is updated to reflect the combined overlay in place of the two separate features. The success criteria ("Players understand upcoming content", "Progression feels intentional", "Abrupt transitions removed") are still met.
- The plan (`plans/ACTIVE.md`) references this ADR in its Key Design Decision section.
- If future playtesting shows players want a separate pre-level preview screen, this ADR can be revisited. The architecture (status-driven rendering in `Game.tsx`) does not preclude adding a second overlay later.
