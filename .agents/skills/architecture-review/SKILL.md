---
name: architecture-review
description: "Review a diff or pull request against this project's architecture: Next.js rules, Atomic Design classification, feature boundaries, duplication, circular dependencies, unnecessary abstractions or dependencies, accessibility and test coverage. Use when asked to review code, a PR, or changes before committing."
---

# Architecture review

## Read first

All files in `docs/ai/rules/` (they are the review checklist; rule IDs are the vocabulary of findings).

## Steps

1. **Scope**: `git status` and `git diff` (or the PR diff). List changed files by layer (`app`, `features/<f>`, `components/<level>`, `lib`, config, tests).
2. **Automated gate first**: run `pnpm lint` and `pnpm typecheck`. Import-direction and cycle violations are already reported there (R-FEAT-1…3); cite them, do not re-derive them.
3. **Apply every rule** of `nextjs.md`, `architecture.md`, `typescript.md`, `security.md`, `dependencies.md`, `testing.md` to the changed files. Done when each rule ID is either cited in a finding or confirmed not applicable/compliant. For security-sensitive files also run the `app-security-review` skill.
4. **Look for**: domain logic in `src/components`, `'use client'` higher than needed, duplicated components/helpers that already exist, new abstractions with one use, new packages without justification, missing loading/empty/error states, missing tests for the change category, accessibility gaps.
5. **Classify** each finding P0 (security hole, data loss, build broken) → P1 (broken feature, boundary violation) → P2 (maintainability, missing tests) → P3 (minor). Ambiguous Atomic classification is at most P3 and only with a concrete cost (R-ATOM-8).

## Rules for findings

- Each finding: severity, rule ID, `file:line`, what happens, minimal fix.
- Concrete defects only. Style that Prettier/ESLint accept is not a finding.
- Say "no findings" for a clean category instead of padding.

## Output

Findings table ordered by severity, then the list of rule groups checked, then the commands run.
