# Workflows by task type

Each task type is described in **one** place. Most live in skills (`.agents/skills/`); this file only holds the workflows that have no dedicated skill.

| Task                                      | Workflow                                                                  |
| ----------------------------------------- | ------------------------------------------------------------------------- |
| A. Add a feature                          | Skill `nextjs-feature-development`                                        |
| B. Create a UI component                  | Skill `atomic-component-development`                                      |
| C. Fix a bug                              | Section C below                                                           |
| D. Review a PR / review before committing | Skill `architecture-review` (+ `app-security-review` for sensitive files) |
| E. Add a dependency                       | Section E below                                                           |
| Server/Client boundaries, data fetching   | Skill `nextjs-server-client-boundaries`                                   |
| Connect a REST backend                    | Skill `api-integration`                                                   |
| Refactor                                  | Skill `safe-refactoring`                                                  |
| Choose and run checks                     | Skill `testing-and-verification`                                          |
| Large commit / release                    | Skill `release-readiness`                                                 |

## C. Fix a bug

1. **Reproduce**: write reproduction steps or a **failing** test for the bug (R-TEST-4). Done when one command reliably shows the wrong result.
2. **Find the root cause**: read the whole affected flow and find every caller of the function you are about to change. Fix the shared place every caller goes through, not just the path named in the bug report.
3. **Focused fix**: change only what the bug needs; no refactoring or "cleanup" of unrelated code.
4. **Verify**: the reproducing test now passes; run the commands from the table in `docs/ai/rules/testing.md`.
5. **Report**: root cause, files changed, new tests, commands run and their results.

## E. Add a dependency

1. **Real need**: state the problem in one sentence. If the need is hypothetical ("we might need it later"), stop.
2. **Follow R-DEP-1 in order**: code in the repo → native API → installed dependency → a few lines of code. Examples: a modal's open state → `useState`, not Zustand; HTTP calls → `backendRequest`, not Axios.
3. **Compatibility**: check `peerDependencies` (`npm view <pkg> peerDependencies`) against the installed Next.js, React, TypeScript, Vite/Vitest.
4. **Cost**: client bundle size (measured, e.g. `pnpm next analyze --output`), number of transitive packages, maintenance status.
5. **Install and lock**: `pnpm add <pkg>` (or `-D`), commit with `pnpm-lock.yaml`. Never `npm`/`yarn`.
6. **Verify**: `pnpm install --frozen-lockfile`, `pnpm peers check`, `pnpm audit --prod`, `pnpm check`, `pnpm build`, `pnpm build-storybook`.
7. **Record**: the reason, rejected alternatives, measurements (R-DEP-4).
