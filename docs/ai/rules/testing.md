# Rules: Testing and verification (R-TEST)

Commands live in `package.json` (`scripts`). How to run them: the README "Testing" section.

| ID       | Level  | Rule                                                                                                                                                                                                             | Why                                                  | Verified by |
| -------- | ------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------- | ----------- |
| R-TEST-1 | MUST   | Report "pass" only for commands that **actually ran** in the session, with their result. If a command could not run, say why.                                                                                    | A false report is worse than none.                   | `human`     |
| R-TEST-2 | MUST   | Choose checks by risk (table below). Every code change runs at least `pnpm check`.                                                                                                                               | Enough confidence without waste.                     | `ci`        |
| R-TEST-3 | MUST   | Test behaviour, not implementation details: query by role/label (`getByRole`), never by CSS class.                                                                                                               | Tests survive refactors and check accessibility too. | `review`    |
| R-TEST-4 | MUST   | Bug fixes: write a reproducing test (failing before the fix) when feasible.                                                                                                                                      | Proves the root cause was fixed.                     | `review`    |
| R-TEST-5 | MUST   | Async Server Components cannot be rendered by RTL: unit-test their logic (schema, repository, action) and cover the page with E2E. jsdom has no real `<dialog>.showModal()`: test focus behaviour in Playwright. | Limits of the test environment.                      | `review`    |
| R-TEST-6 | MUST   | E2E specs import `test`/`expect` from `e2e/fixtures.ts` (fails on any CSP violation).                                                                                                                            | Every new flow is checked against the CSP.           | `review`    |
| R-TEST-7 | SHOULD | New shared components get a story (`*.stories.tsx`, `title: '<Level>/<Name>'`).                                                                                                                                  | Storybook is where the design system is reviewed.    | `review`    |

## Checks by change type

| Change type                                             | Required                                                                                                             | Add when needed                |
| ------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- | ------------------------------ |
| Documentation only (`*.md`)                             | `pnpm format:check`                                                                                                  | Link check                     |
| Agent rules/skills (`.agents/`, `.claude/`, `docs/ai/`) | `pnpm agents:check`, `pnpm format:check`                                                                             |                                |
| Shared component                                        | `pnpm check`, component test, story, `pnpm build-storybook`                                                          | E2E if a main flow is affected |
| Logic, schema, repository                               | `pnpm check` with new unit tests                                                                                     |                                |
| Server Action / auth / security                         | `pnpm check` with negative tests (R-SEC-11), `pnpm build`                                                            | `pnpm test:e2e`                |
| Route, page, layout, `next.config.ts`                   | `pnpm check`, `pnpm build` (check the `◐`/`ƒ` column), `pnpm test:e2e`                                               |                                |
| Dependency                                              | All of the above + `pnpm install --frozen-lockfile`, `pnpm audit --prod`, `pnpm peers check`, `pnpm build-storybook` |                                |
| Before commit/release                                   | Everything: `pnpm check && pnpm build && pnpm test:e2e && pnpm build-storybook`                                      |                                |
