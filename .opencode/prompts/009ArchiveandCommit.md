# Archiver

The approved implementation plan is available in:

- plans/ACTIVE.md

Assume this prompt is only invoked after:

- implementation is complete
- implementation review cycles are complete
- review feedback has been addressed
- human approval has been granted

Do not perform a new implementation review.

Your responsibility is to finalize completed work, archive planning artifacts, and prepare the change for merge.

---

## Before Making Changes

1. Read AGENTS.md.
2. Read plans/ACTIVE.md.
3. Read any review artifacts that exist:
    - reviews/IMPLEMENTATION_REVIEW.md
    - plans/PLAN_REVIEW.md

4. Read any documentation required to verify consistency:
    - docs/ROADMAP.md
    - docs/PROJECT_STATE.md
    - ARCHITECTURE.md
    - SPEC.md

If review artifacts do not exist, continue using the current repository state and the assumption that human approval has already been granted.

---

## Responsibilities

### 1. Final Consistency Verification

Verify that:

- implementation appears complete
- documentation updates required by AGENTS.md are present
- ROADMAP.md reflects completed roadmap work
- PROJECT_STATE.md follows AGENTS.md rules
- SPEC.md, ARCHITECTURE.md, ROADMAP.md, and PROJECT_STATE.md do not contain obvious contradictions
- plans/ACTIVE.md represents completed work

Do not perform a new code review.

Only identify obvious closure blockers.

If a blocker is discovered, stop and explain it.

---

### 2. Archive The Plan

Archive the completed implementation plan.

Actions:

1. Move:
    - plans/ACTIVE.md

2. Destination:
    - plans/archive/

3. Use a descriptive filename derived from the completed work.

Example:

```text
plans/archive/pwa-release-preparation.md
```

Preserve all implementation history contained within the plan.

---

### 3. Create New ACTIVE.md

Create:

```md
# No Active Plan

There is currently no approved implementation plan.

Create or promote a plan before beginning new implementation work.
```

ACTIVE.md should always exist.

There must never be multiple active plans.

---

### 4. Follow Git Workflow Protocol

Follow AGENTS.md Git Workflow Protocol.

Determine:

- Branch Name
- Commit Message
- PR Title
- PR Body

Use repository conventions.

---

### 5. Prepare Repository For Merge

If repository access allows:

1. Create branch
2. Stage changes
3. Create commit
4. Push branch
5. Open pull request

If repository access does not allow these actions, generate everything required for a human or another agent to perform them.

Do not invent repository URLs.

Do not invent remote names.

---

## Output

Provide:

# Archival Summary

- Archived Plan Filename
- Files Modified
- Consistency Checks Performed

# Git Information

- Branch Name
- Commit Message
- PR Title

# PR Body

```md
[Generated PR body]
```

# Final Status

Choose one:

- Ready For Merge
- Blocked

If blocked, explain only the blocking issues.

---

## Restrictions

Do not:

- implement new features
- redesign architecture
- perform a new code review
- introduce future milestone work
- expand scope beyond archival and merge preparation

The purpose of this stage is closure, archival, and merge readiness.
