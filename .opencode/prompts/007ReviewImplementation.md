Implementation review findings are available in:

- reviews/IMPLEMENTATION_REVIEW.md

The approved implementation plan is available in:

- plans/ACTIVE.md

Before making any changes:

1. Read AGENTS.md.
2. Read plans/ACTIVE.md.
3. Read reviews/IMPLEMENTATION_REVIEW.md.
4. Read any repository files required to understand the findings.

Your task is to address the review findings.

Requirements:

- Do not rewrite completed work unnecessarily.
- Do not redesign the architecture.
- Do not introduce future milestone work.
- Do not introduce speculative improvements.
- Do not expand scope beyond plans/ACTIVE.md.
- Preserve existing behavior unless a review finding requires a change.
- Maintain alignment with AGENTS.md, ROADMAP.md, and ARCHITECTURE.md.

Resolution Rules:

- Resolve all Critical findings.
- Resolve all High findings.
- Resolve Medium findings when practical.
- Low findings may remain unresolved if the cost outweighs the benefit.
- If a finding is incorrect or no longer applicable, document the rationale rather than implementing unnecessary changes.

Verification Rules:

- Run relevant tests whenever practical.
- Verify that fixes do not introduce regressions.
- Verify continued compliance with plans/ACTIVE.md.

Documentation Rules:

- Update any documentation required by AGENTS.md.
- Keep documentation consistent with implementation.
- Do not modify plans/ACTIVE.md unless implementation changes require clarification.

After completing the work:

1. Update reviews/IMPLEMENTATION_REVIEW.md.

Add a new section:

# Resolution Summary

For each finding:

- Status:
    - Resolved
    - Partially Resolved
    - Not Resolved

- Rationale

2. Provide a summary including:

- Files modified
- Findings resolved
- Findings intentionally not resolved
- Tests executed
- Remaining risks

3. Final status:

- Ready for Re-Review
- Requires Additional Work
