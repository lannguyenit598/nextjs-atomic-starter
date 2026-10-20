---
name: safe-refactoring
description: 'Refactor existing code without changing behaviour: move, rename, extract or simplify components and modules with a regression safety net. Use when asked to refactor, restructure, clean up, reorganize folders or migrate a pattern.'
---

# Safe refactoring

## Read first

`docs/ai/rules/architecture.md`; the tests that cover the code in scope.

## Steps

1. **Why**: state the concrete problem the refactor solves (duplication with N copies, a boundary violation, a bug-prone pattern). No concrete problem → recommend not refactoring and stop. "Make it match the five Atomic levels" or "move everything into a new structure" is not a problem statement (R-ATOM-6, R-ATOM-8).
2. **Consumers**: find every import/usage of what changes (search the symbol and the file path). Done when the list is complete, including tests and stories.
3. **Safety net**: run the existing tests for the area; if behaviour is untested, add characterization tests first and see them pass on the old code.
4. **Smallest change**: one concern per step; keep public component APIs (props) stable unless the task is to change them; update all consumers in the same change.
5. **Verify**: same tests still pass, plus `pnpm check` and `pnpm build`; `pnpm build-storybook` if components moved; `pnpm test:e2e` if routes changed.
6. **Docs**: update paths mentioned in `README.md`, `README.en.md`, `docs/` and `docs/ai/` if files moved.

## Pitfalls

- Mixing a refactor with a behaviour change: split them.
- Moving a component between Atomic levels without a consumer-visible benefit.
- Leaving dead re-exports or barrels behind.

## Output

Problem statement, consumer list, steps taken, tests before/after (with results), docs updated.
