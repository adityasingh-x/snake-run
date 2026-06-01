# AGENTS.md

## Purpose

This repository contains Snake Evolution.

The goal is to create a polished, fun Snake-inspired game for desktop and mobile.

AI-generated gameplay/content is a future possibility but is NOT a current development priority.

Current focus:

Create the best possible Snake Run first.

---

## Required Reading

Read only what is necessary.

### For gameplay changes

Read:

- SPEC.md
- docs/PROJECT_STATE.md

### For architectural changes

Read:

- ARCHITECTURE.md
- docs/ROADMAP.md
- docs/adr/\*

### For roadmap decisions

Read:

- docs/ROADMAP.md

### For platform or deployment work

Read:

- docs/ROADMAP.md
- ARCHITECTURE.md

Avoid reading unnecessary files.

---

## Context Budget

Read the minimum documentation required for the task.

Do not automatically load all project documentation.

Examples:

Bug fix:

- Read AGENTS.md
- Read relevant code

Gameplay change:

- Read AGENTS.md
- Read SPEC.md
- Read docs/PROJECT_STATE.md

Architecture change:

- Read AGENTS.md
- Read ARCHITECTURE.md
- Read docs/ROADMAP.md
- Read relevant ADRs

Roadmap or planning discussion:

- Read AGENTS.md
- Read docs/ROADMAP.md

Only read additional documents when required.

---

## Source of Truth

SPEC.md is the source of truth for game behavior.

If implementation and SPEC.md disagree:

- update the implementation
- or update SPEC.md

Never leave them inconsistent.

---

## Technology Direction

The project technology direction is defined in docs/ROADMAP.md.

Unless explicitly instructed otherwise, agents should align proposals and implementations with the documented platform strategy.

Current planned direction:

- React + TypeScript + Vite
- PWA for installable web releases
- Capacitor for native mobile packaging
- Tauri for native desktop packaging

Do not introduce alternative platform frameworks without justification and approval.

Examples:

- React Native
- Flutter
- Electron
- Unity
- Godot

---

## Documentation Rules

Behavior changes:

- Update SPEC.md

Architecture changes:

- Update ARCHITECTURE.md

Completed roadmap work:

- Update docs/ROADMAP.md

Project status changes:

- Follow PROJECT_STATE Rules

Major decisions:

- Create an ADR in docs/adr/

Do not update README.md unless setup instructions, controls, or user-facing features change.

---

## Documentation Consistency

When updating documentation:

- Keep SPEC.md, ARCHITECTURE.md, PROJECT_STATE.md, and ROADMAP.md consistent with one another.
- Do not leave contradictory statements across documents.
- If documentation becomes outdated, update it as part of the same change whenever practical.

---

## Development Philosophy

Prefer:

- small changes
- simple solutions
- maintainable code
- playable progress

Avoid:

- premature abstractions
- framework building
- speculative architecture

The objective is to ship a game.

---

## PROJECT_STATE Rules

Update docs/PROJECT_STATE.md only when:

- a roadmap phase changes
- current priorities change
- major technical debt is introduced
- major technical debt is removed

Do not update PROJECT_STATE.md for:

- bug fixes
- small refactors
- documentation corrections
- minor UI polish

---

## ROADMAP Maintenance Rules

ROADMAP.md is the source of truth for project direction and milestone progress.

After completing any roadmap item, milestone task, or significant feature, agents must:

- Update milestone progress
- Move completed items into the appropriate Completed section
- Update Current Progress
- Remove obsolete roadmap entries
- Keep roadmap status aligned with repository reality

Project progress tracking is considered part of implementation work.

A feature is not fully complete until ROADMAP.md has been updated.

---

## Milestone Scope

When implementing roadmap work:

- Prefer completing the current milestone before starting future milestones.
- Do not pull future milestone work into the current milestone unless explicitly requested.
- Record useful ideas in docs/IDEAS_BACKLOG.md instead of expanding scope.

---

## Local Model & Execution Rules

- Work in small, incremental blocks.
- Do not attempt large rewrites in a single step.
- Never guess an implementation if required context is missing.
- Request the relevant code or documentation rather than performing blind refactors.
- Prefer modifying existing systems over creating new abstractions.

---

## Escalation Rule

If a requested change appears to conflict with:

- SPEC.md
- docs/ROADMAP.md
- existing architecture
- an approved ADR

Do not implement immediately.

Explain the conflict and ask for clarification.

---

## Planning Rules

Large changes should begin with a plan.

Plans belong in the plans directory.

Directory structure:

plans/
├── ACTIVE.md
├── drafts/
└── archive/

Only ACTIVE.md represents the currently approved implementation plan.

Before starting a large feature:

1. Create or update ACTIVE.md
2. Obtain approval if required
3. Execute the plan incrementally
4. Archive the plan when complete

Do not create multiple active plans simultaneously.

If multiple draft plans exist, ACTIVE.md determines which plan is authoritative.

---

## ADR Rules

Create an ADR for significant technical or product decisions.

Examples that SHOULD create an ADR:

- Switching from DOM rendering to Canvas
- Replacing a major framework or library
- Redesigning the level progression system
- Introducing online services or backend infrastructure
- Changing core gameplay architecture

Examples that SHOULD NOT create an ADR:

- Bug fixes
- Minor refactors
- UI polish
- Test additions
- Small implementation details

ADRs are historical records.

Do not modify existing ADRs except to correct factual errors.

---

## Definition of Done

A task is considered complete only when:

- Implementation is complete
- Relevant tests pass (when tests exist)
- No new TypeScript or lint errors are introduced
- Required documentation is updated
- ROADMAP.md progress is updated when applicable
- No known inconsistencies remain between documentation and implementation

---

## Document Ownership

README.md

- Human onboarding.
- Quick start, controls, setup, and user-facing information.

SPEC.md

- Source of truth for game behavior.
- Update whenever game behavior changes.

ARCHITECTURE.md

- Technical implementation and codebase structure.
- Update when architecture changes.

docs/PROJECT_STATE.md

- Current development status.
- Represents where the project is today.

docs/ROADMAP.md

- Planned future work.
- Represents where the project is going.

docs/IDEAS_BACKLOG.md

- Future ideas and experiments.
- Append-only unless ideas are promoted, implemented, or discarded.

plans/ACTIVE.md

- Current approved implementation plan.
- Only one active plan should exist at a time.

docs/adr/

- Permanent record of major decisions.
- Historical reference for future development.

## Git Workflow Protocol

When you have successfully completed coding and verified that all tests pass, you must prepare the code for review. Do not guess the format. You must read and strictly follow the formatting rules defined in the template file:

👉 **Protocol File:** `./git-workflow-template.md` (or wherever you save it)

1. **Read the Template:** Open the file to get the schema constraints.
2. **Generate Output:** Produce the Branch Name, Commit Message, and PR Body matching that exact specification.
