# Git Workflow Template Constraint

You are reading this because you have finished coding and testing. Output your final response using the exact rules and structural blocks below.

## 1. Branch Naming

Format: <prefix>/<short-descriptive-name> (lowercase, hyphens, numbers only)

- `feature/` -> New functionality
- `bugfix/` -> Fixing issues
- `chore/` -> Maintenance, dependencies, tooling
- `docs/` -> Documentation changes only

## 2. Commit Message (Conventional Commits)

Format: <type>(<scope>): <short description in imperative mood, max 50 chars>
[Blank Line]
[Optional body explaining the 'why']

Allowed Types: feat, fix, chore, docs, refactor, test, style

## 3. Pull Request (PR) Body Template

---

## 📝 Description

[Clear description of the changes, the problem solved, and the approach]

## 🚀 Type of Change

- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Refactor / Chore / Documentation

## 🧪 How Has This Been Tested?

- **Test Command:** `[Insert command here]`
- **Outcome:** [Insert test results summary here]

---

## Final Output Format

Your final response to the user must be structured exactly like this:

- **Branch Name:** [Your generated branch name]
- **Commit Message:** [Your generated commit message]
- **PR Title:** [Your generated PR title]
- **PR Body:**
  [Your populated Markdown PR template block]
