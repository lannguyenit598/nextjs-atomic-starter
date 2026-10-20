---
name: testing-and-verification
description: 'Choose and run the right checks for a change (Vitest, React Testing Library, Playwright, Storybook, typecheck, ESLint, production build) and report results truthfully. Use before declaring any code change done, when writing tests, or when a test or build fails.'
---

# Testing and verification

## Read first

`docs/ai/rules/testing.md`: the **"Kiểm tra theo loại thay đổi"** table decides what to run. Scripts are in `package.json`.

## Steps

1. **Classify** the change into the table's rows (several rows can apply; take the union).
2. **Write the missing tests** for that category:
   - Logic/schema/repository: Vitest unit test next to the source.
   - Component: RTL test querying by role/label; story for shared UI.
   - Server Action: mock `@/lib/auth` (`requireSession`) and the repository; cover signed-out, forbidden, invalid input, success.
   - Flow: Playwright spec importing `test`/`expect` from `e2e/fixtures.ts`.
   - Bug: a test that fails before the fix.
3. **Run** the required commands. E2E needs browsers once: `pnpm exec playwright install chromium`; `CI=1 pnpm test:e2e` tests the production server (run `pnpm build` first), plain `pnpm test:e2e` uses `pnpm dev`.
4. **On failure**: read the first error, find the root cause, fix, rerun the same command. Done when the command passes, not when the error message changes.
5. **Report** every command with its real result. A command you could not run is reported as **not run** with the reason.

## Known environment facts

- jsdom has no real `<dialog>.showModal()`; `src/test/setup.ts` stubs it. Focus behaviour is only provable in Playwright.
- `userEvent` hangs with Vitest fake timers; use `fireEvent` in fake-timer tests (see `task-filters.test.tsx`).
- Async Server Components cannot be rendered by RTL; test their logic, cover the page with E2E.
- `vi.mock('@/lib/env')` + `vi.resetModules()` to test env-dependent modules (see `src/lib/auth.test.ts`).

## Output

Table: command → result (pass/fail/not run + reason), plus new/changed test files.
