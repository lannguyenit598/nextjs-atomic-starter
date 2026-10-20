# Deep Audit: Dependencies

- **Date:** 2026-10-20
- **Based on:** [`nextjs-atomic-design-audit.md`](nextjs-atomic-design-audit.md). Every conclusion about dependencies in that report was **independently re-verified**, not taken on trust.
- **Source of truth:** `package.json` and `pnpm-lock.yaml`.

## Executive Summary

**The current dependency stack fits the project. There are no redundant runtime dependencies.**

| Question                                      | Conclusion                                                                                                                                                                                                           |
| --------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Are the dependencies appropriate?             | **Yes.** There are only 11 runtime dependencies, pulling in 14 packages in the lockfile. Every package has a real usage site and none overlaps another in responsibility.                                            |
| Are there redundant or duplicate packages?    | **No package needs to be removed.** Knip found no redundant dependencies. `clsx` looks like it duplicates CVA, but CVA itself already depends on `clsx`, so keeping it costs nothing extra.                          |
| Are the versions compatible with each other?  | **Yes**, with 2 points to note (fixed): `engines.node` was declared broader than what the tools actually support, and the version ranges of the Tailwind packages were inconsistent.                                 |
| Does SEC-6 still exist?                       | **Yes** (CVE-2026-93687, no patch available yet). The vulnerability is only in a dev tool, and the affected code is **never called** in this repo. Real-world severity: **Low/Informational**. Monitoring is enough. |
| Is it ready to serve as a long-term template? | **Yes, from a dependency standpoint.** The long-term risks are ESLint 9 (marked deprecated, but blocked by Next's plugins) and Storybook (39% of the dependency tree).                                               |

## 1. Tools used

| Capability                                            | Used            | Purpose                                                                                                                                              |
| ----------------------------------------------------- | --------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| Subagent `code-modernization:security-auditor`        | Yes (read-only) | Independent investigation of SEC-6: `pnpm audit/why/outdated`, reading the GitHub Advisory API, reading the `braces` source, exploitability analysis |
| Knip 6.42.0 (`pnpm dlx`, not installed into the repo) | Yes             | Find unused dependencies, files and exports (with plugins for Next, Vitest, Storybook, Playwright, ESLint, Prettier, Husky, lint-staged)             |
| `next analyze --output` (Next 16.1+)                  | Yes             | Official Turbopack bundle analyzer                                                                                                                   |
| esbuild 0.28.2 (already present in `node_modules`)    | Yes             | Measure the size of each library when bundled in isolation                                                                                           |
| Context7                                              | Yes             | Zod v4.6.5 docs (Zod Mini). Next.js: used the docs shipped with the package `node_modules/next/dist/docs/`, matching version 16.4.2                  |
| `pnpm peers check`, `pnpm list --json`, `npm view`    | Yes             | Check peer dependencies, the dependency tree and registry information                                                                                |
| Dependency-specific skill                             | None            | The environment has no skill dedicated to dependency auditing                                                                                        |

## 2. Baseline: re-checked against the lockfile

All versions recorded by the previous report **match** `pnpm-lock.yaml` (lockfile v9.0). The lockfile contains a total of **718 packages**.

| Item                   | Actual                                                       | Source / constraint                                                                                                                                                                                                                                                                        |
| ---------------------- | ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Local Node             | v24.15.0                                                     | `node -v`                                                                                                                                                                                                                                                                                  |
| Required Node (before) | `>=22`                                                       | `package.json` engines: **wrong, too broad**                                                                                                                                                                                                                                               |
| Actually required Node | `^22.22.2 \|\| ^24.15.0 \|\| >=26`                           | Intersection of the tools' engines: jsdom 30 `^22.22.2 \|\| ^24.15.0 \|\| >=26`, Vitest 5 `^22.12 \|\| ^24 \|\| >=26` (does not support Node 25), lint-staged 17 `>=22.22.1`, Vite 8 `^20.19 \|\| >=22.12`. Next.js requires `>=20.9.0` (`docs/01-app/02-guides/upgrading/version-16.md`). |
| CI                     | `node-version: 24` (before), now `node-version-file: .nvmrc` | `.github/workflows/ci.yml`                                                                                                                                                                                                                                                                 |
| pnpm                   | 12.11.2                                                      | `packageManager`; CI uses `pnpm/action-setup@v6`, which reads this field automatically                                                                                                                                                                                                     |
| `.npmrc`               | None                                                         | pnpm configuration lives in `pnpm-workspace.yaml` (`allowBuilds`)                                                                                                                                                                                                                          |

## 3. Dependency Inventory

Notes:

- "Usage site" was determined by grepping source, config and scripts, then cross-checking with Knip.
- Client sizes come from the actual measurements in section 6.

### `dependencies` (runtime)

| Package                  | Version             | Actual usage site                                                                                                                                                         | Necessity       | Assessment                                                                                             | Recommendation        |
| ------------------------ | ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------- | ------------------------------------------------------------------------------------------------------ | --------------------- |
| next                     | 16.4.2              | Framework                                                                                                                                                                 | Core            | Latest stable release                                                                                  | KEEP                  |
| react / react-dom        | 19.3.0 → **19.3.1** | Declared for tooling. **The App Router runs on the React bundled with Next** (`19.3.0-canary-278794d7-20261002`), per `docs/01-app/01-getting-started/01-installation.md` | Core            | The 19.3.1 patch only affects Vitest/RTL and Storybook                                                 | UPGRADE (**applied**) |
| zod                      | 4.6.7               | 7 files: env, schemas, actions, `http-client` (type), `action-result`, TaskForm                                                                                           | Core            | One schema used for client, server and backend response validation                                     | KEEP                  |
| react-hook-form          | 7.90.0              | 1 file (`task-form.tsx`)                                                                                                                                                  | Feature-level   | Worth it for complex admin forms. The trade-off is that the form does not work with JS disabled (NX-2) | KEEP                  |
| @hookform/resolvers      | 5.9.2               | 1 file                                                                                                                                                                    | Comes with RHF  | Peer `zod ^3.25 \|\| ^4`; code uses `zod/v4/core`                                                      | KEEP                  |
| class-variance-authority | 0.7.1               | 4 atoms/molecules                                                                                                                                                         | Core UI         | Typed variant management                                                                               | KEEP                  |
| clsx                     | 2.1.1               | `src/lib/utils.ts`                                                                                                                                                        | Core UI         | CVA already depends on `clsx ^2.1.1`, so removing it would **not reduce** any package or byte          | KEEP                  |
| tailwind-merge           | 3.7.0               | `cn()`                                                                                                                                                                    | Core UI         | Needed for `className` overrides (proven by a test). Costs 8.3 KiB gzip on the client                  | KEEP                  |
| lucide-react             | 1.59.0              | 17 files                                                                                                                                                                  | Core UI         | 17 icons cost only 3.1 KiB gzip (good tree-shaking)                                                    | KEEP                  |
| server-only              | 0.0.1               | 6 files                                                                                                                                                                   | Core (security) | Recommended by Next.js (`02-guides/data-security.md`)                                                  | KEEP                  |

No package should move to `devDependencies`: all of them are bundled into the app or used as a build-time marker.

### `devDependencies`

| Package                                      | Version | Actual usage site                                                      | Necessity        | Assessment                                                                                                                                         | Recommendation               |
| -------------------------------------------- | ------- | ---------------------------------------------------------------------- | ---------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------- |
| typescript                                   | 5.9.3   | `tsc`, Next                                                            | Dev core         | Next requires ≥ 5.1; `typescript-eslint` requires `<6.1`, so TS 6/7 is not possible yet                                                            | KEEP                         |
| @types/node                                  | 24.19.2 | Types                                                                  | Dev core         | Version 26 is available. Matches Node 24 in `.nvmrc`                                                                                               | KEEP                         |
| @types/react, @types/react-dom               | 19.3.0  | Types                                                                  | Dev core         | Next 16 requires using the latest version (version-16.md)                                                                                          | KEEP                         |
| tailwindcss                                  | 4.3.3   | `@import 'tailwindcss'` in `globals.css`                               | Dev core (build) | Range `^4` → **`^4.3.3`**                                                                                                                          | KEEP (range adjusted)        |
| @tailwindcss/turbopack                       | 4.3.3   | `next.config.ts` (CSS loader)                                          | Dev core (build) | Range `^4` → **`^4.3.3`** to stay in step with `tailwindcss`                                                                                       | KEEP (range adjusted)        |
| eslint                                       | 9.39.5  | `pnpm lint`                                                            | Dev core         | **Marked deprecated on npm.** ESLint 10 is blocked by the peer dependencies of `eslint-plugin-react`, `jsx-a11y`, `import` in `eslint-config-next` | KEEP, wait for upstream (P2) |
| eslint-config-next                           | 16.4.2  | `eslint.config.mjs`                                                    | Dev core         | Is the source of SEC-6 (section 5)                                                                                                                 | KEEP                         |
| eslint-config-prettier                       | 10.1.8  | `eslint.config.mjs`                                                    | Dev core         | Disables rules that conflict with Prettier                                                                                                         | KEEP                         |
| prettier                                     | 3.9.10  | `format` scripts                                                       | Dev core         |                                                                                                                                                    | KEEP                         |
| prettier-plugin-tailwindcss                  | 0.8.1   | `.prettierrc.json`                                                     | Dev (DX)         | Automatically sorts Tailwind classes                                                                                                               | KEEP                         |
| husky                                        | 9.1.7   | `prepare` script, `.husky/pre-commit`                                  | Dev (DX)         |                                                                                                                                                    | KEEP                         |
| lint-staged                                  | 17.6.0  | `.husky/pre-commit`                                                    | Dev (DX)         | Requires Node `>=22.22.1`                                                                                                                          | KEEP                         |
| vitest                                       | 5.0.5   | `test*` scripts                                                        | Test             |                                                                                                                                                    | KEEP                         |
| @vitest/coverage-v8                          | 5.0.5   | `provider: 'v8'` (`vitest.config.mts`), `test:coverage`                | Test             | Required peer, must match the `vitest` version                                                                                                     | KEEP                         |
| vite                                         | 8.3.4   | Peer of Vitest, `@vitejs/plugin-react`, `@tailwindcss/vite`, Storybook | Test/Storybook   | Declared directly to pin the version of the shared peer                                                                                            | KEEP                         |
| @vitejs/plugin-react                         | 6.1.2   | `vitest.config.mts`                                                    | Test             | Peer `vite ^8`                                                                                                                                     | KEEP                         |
| jsdom                                        | 30.1.3  | `environment: 'jsdom'`                                                 | Test             | Does not yet support `<dialog>.showModal()`; a stub is in place                                                                                    | KEEP                         |
| @testing-library/react                       | 16.3.3  | 9 test files                                                           | Test             |                                                                                                                                                    | KEEP                         |
| @testing-library/dom                         | 10.4.2  | Not imported directly                                                  | Test             | **Required peer** of RTL 16 (`^10.0.0`). Not a redundant package                                                                                   | KEEP                         |
| @testing-library/jest-dom                    | 7.0.1   | `src/test/setup.ts`                                                    | Test             |                                                                                                                                                    | KEEP                         |
| @testing-library/user-event                  | 14.6.8  | 4 test files                                                           | Test             | Does not work with Vitest 5 fake timers (`task-filters.test.tsx` uses `fireEvent` instead)                                                         | KEEP                         |
| @playwright/test                             | 1.64.1  | `playwright.config.ts`, `e2e/`                                         | Test             | Next declares peer `^1.51.1`                                                                                                                       | KEEP                         |
| storybook                                    | 10.6.2  | `storybook`, `build-storybook`                                         | Docs             | **Adds 279 packages that nothing else needs** (section 6)                                                                                          | OPTIONAL (P3, see section 9) |
| @storybook/nextjs-vite                       | 10.6.2  | `.storybook/main.ts`, 12 stories                                       | Docs             | Peer `next ^16`, `vite ^8`                                                                                                                         | Comes with Storybook         |
| @storybook/addon-docs, @storybook/addon-a11y | 10.6.2  | `.storybook/main.ts`                                                   | Docs             | a11y helps check accessibility while writing components                                                                                            | Comes with Storybook         |
| @tailwindcss/vite                            | 4.3.3   | `.storybook/main.ts`                                                   | Docs             | Only Storybook needs it (Next uses the Turbopack loader)                                                                                           | Comes with Storybook         |
| eslint-plugin-storybook                      | 10.6.2  | `eslint.config.mjs`                                                    | Docs             |                                                                                                                                                    | Comes with Storybook         |

**Knip results:**

- No redundant dependencies, missing declarations or unresolved imports.
- 2 files reported as "unused":
  - `separator.tsx`: an atom that is in the requirements but not yet used by the app.
  - `empty-module.ts`: **false positive**, because it is used via an alias in `vitest.config.mts`.
- 3 exports and 5 type exports are unused. These are the modules' public API and unrelated to dependencies.

## 4. Compatibility Matrix

| Combination                                                             | Result                   | Evidence                                                                                                   |
| ----------------------------------------------------------------------- | ------------------------ | ---------------------------------------------------------------------------------------------------------- |
| Next 16.4.2 ↔ React/React DOM 19.3.1                                    | ✅                       | Peer `^18.2.0 \|\| ^19.0.0`; the App Router uses the React bundled with Next                               |
| Next 16.4.2 ↔ Node                                                      | ✅                       | Requires ≥ 20.9; local 24.15.0; CI uses `.nvmrc` (24)                                                      |
| Next 16.4.2 ↔ TypeScript 5.9.3                                          | ✅                       | Requires ≥ 5.1.0 (version-16.md)                                                                           |
| Next 16 ↔ ESLint                                                        | ✅                       | Uses flat config and `eslint .`; `next lint` has been removed (version-16.md)                              |
| eslint-config-next 16.4.2 ↔ ESLint 10                                   | ❌ (blocked)             | The import/jsx-a11y/react plugins only support up to ESLint `^9`; `typescript-eslint` requires TS `<6.1.0` |
| Zod 4.6.7 ↔ @hookform/resolvers 5.9.2 ↔ RHF 7.90                        | ✅                       | Peer `zod ^3.25 \|\| ^4`, `react-hook-form ^7.55`; the resolver uses types from `zod/v4/core`              |
| Tailwind 4.3.3 ↔ @tailwindcss/turbopack 4.3.3 ↔ @tailwindcss/vite 4.3.3 | ✅                       | Same version; now the same range `^4.3.3`                                                                  |
| prettier-plugin-tailwindcss 0.8.1 ↔ Prettier 3 / Tailwind 4             | ✅                       | Peer `prettier ^3.0`; reads `tailwindStylesheet`                                                           |
| Vitest 5.0.5 ↔ Vite 8.3.4 ↔ @vitejs/plugin-react 6.1.2                  | ✅                       | Peer `vite ^8`                                                                                             |
| Vitest 5 ↔ jsdom 30 ↔ Node                                              | ✅ when Node is in range | jsdom does not support Node 24.0–24.14 and Node 25                                                         |
| RTL 16.3.3 ↔ React 19 ↔ @testing-library/dom 10                         | ✅                       | Peer `react ^19`, `@testing-library/dom ^10`                                                               |
| Storybook 10.6.2 ↔ Next 16 ↔ Vite 8                                     | ✅                       | Peer `next ^16`, `vite ^8`; `build-storybook` passes                                                       |
| Playwright 1.64.1 ↔ Next                                                | ✅                       | Peer `^1.51.1`                                                                                             |
| Entire tree                                                             | ✅                       | `pnpm peers check`: "No peer dependency issues found"; `pnpm install --frozen-lockfile`: lockfile matches  |

## 5. Security Analysis: re-investigating SEC-6

| Question                            | Result (verified)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| ----------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1. Does it still exist?             | **Yes.** `pnpm audit`: 1 high; `pnpm audit --prod`: no vulnerabilities                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| 2. Advisory ID                      | **GHSA-vfj7-8cjw-p6xm**, CVE-2026-93687, published 2026-09-18, CWE-674 (Uncontrolled Recursion), CVSS 3.1: 7.5, CVSS 4.0: 8.7                                                                                                                                                                                                                                                                                                                                                                                                     |
| 3. Affected version                 | `braces@3.0.3` (range `<=3.0.3`). This is the latest version on the registry                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| 4. Dependency chain (only one)      | `eslint-config-next@16.4.2 → @next/eslint-plugin-next@16.4.2 → fast-glob@3.3.1 (hard-pinned) → micromatch@4.0.8 → braces@3.0.3`                                                                                                                                                                                                                                                                                                                                                                                                   |
| 5. Runtime or dev?                  | **Dev only.** No chain goes through `dependencies`. `.next/*.nft.json` and `.next/server`, `.next/static` do not contain `braces`, `micromatch` or `fast-glob`                                                                                                                                                                                                                                                                                                                                                                    |
| 6. Exploitation conditions          | A deeply nested brace pattern makes 3 recursive functions with no depth limit (`lib/compile.js:7`, `lib/expand.js:36`, `lib/stringify.js:6`) cause a stack overflow. The plugin only calls fast-glob in `get-root-dirs.js` (rule `no-html-link-for-pages`), **and only when `settings.next.rootDir` is set**. The repo **does not set** this setting, so the affected code never runs. Exploiting it requires being able to edit the ESLint config file, and anyone who can do that can already run arbitrary code through ESLint |
| 7. Is a compatible patch available? | **No.** `first_patched_version: null`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| 8. Fix by upgrading the parent?     | **No.** 16.4.2 is the latest release; canary 16.5.0-canary.19 still pins `fast-glob 3.3.1`                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| 9. Is an override safe?             | **Pointless.** There is no patched braces version to override to; every micromatch version needs `braces ^3.0.3`                                                                                                                                                                                                                                                                                                                                                                                                                  |
| 10. Does it need immediate action?  | **No.** Real-world severity is Low/Informational (worst case: the `eslint` process crashes). **Monitor** the advisory; when a new `braces` version is released, add an override or upgrade. If CI runs `pnpm audit`, use `pnpm audit --ignore GHSA-vfj7-8cjw-p6xm`                                                                                                                                                                                                                                                                |

**Other vulnerabilities:** none (high 1, all other levels 0).

**Environment notes:**

- `node_modules/.pnpm` still contains a leftover `eslint-config-next` build for `eslint@10.13.0`, from an earlier trial install.
- The lockfile does not reference this build. It is just junk on the local machine and has no effect on the repo.

## 6. Bundle and Runtime Impact

All figures below are **real measurements** on the production build: take the JS files referenced by the route's HTML, then compress with gzip -9.

| Route            | JS files | Raw       | Gzip          |
| ---------------- | -------- | --------- | ------------- |
| `/dashboard`     | 10       | 603.9 KiB | **187.3 KiB** |
| `/tasks`         | 12       | 757.4 KiB | **234.1 KiB** |
| Only in `/tasks` | 2        |           | **46.8 KiB**  |

- The largest shared chunk is `react-dom` (71.6 KiB gzip).
- The `/tasks`-only part is mainly one 46.1 KiB gzip chunk containing Zod (`en` locale only), RHF, the resolver and the form code.
- The dashboard **does not load** Zod or RHF: per-route code splitting is working correctly.

Each library measured when bundled in isolation (esbuild, minify, gzip -9, React excluded):

| Library                                          | Gzip         | Notes                                                                                                                                                                                                                                                                                                                                         |
| ------------------------------------------------ | ------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| react-hook-form (`useForm`)                      | 11.5 KiB     |                                                                                                                                                                                                                                                                                                                                               |
| @hookform/resolvers/zod                          | 2.0 KiB      |                                                                                                                                                                                                                                                                                                                                               |
| lucide-react (17 icons in use)                   | 3.1 KiB      |                                                                                                                                                                                                                                                                                                                                               |
| class-variance-authority + clsx + tailwind-merge | 8.8 KiB      | 8.3 KiB of which is tailwind-merge                                                                                                                                                                                                                                                                                                            |
| zod/mini (same schema)                           | 6.5 KiB      |                                                                                                                                                                                                                                                                                                                                               |
| zod (classic)                                    | ~~90.8 KiB~~ | **Invalid measurement:** esbuild cannot tree-shake the `z` namespace, so it pulls in all 257 locales. In the real bundle, Turbopack keeps only the `en` locale. The Zod portion of the 46 KiB chunk is estimated at **about 25–30 KiB**; this is **an estimate, not measured directly**. The Zod docs state about 13 KB for an object schema. |

**Bundle conclusions:**

- **No specific problem found.** Server-only modules are not exposed to the client (grepped), and icons are tree-shaken.
- The biggest remaining choice is Zod classic versus Zod Mini. The official Zod docs recommend **keeping Zod classic** unless bundle constraints are "uncommonly strict" (`packages/docs/content/packages/mini.mdx`, v4.6.5). Therefore **no change is recommended**.

**Dependency tree size** (`pnpm list --json`, 718 packages):

| Group                     | Packages in closure | Packages only this group needs (removable if the group is removed) |
| ------------------------- | ------------------- | ------------------------------------------------------------------ |
| Runtime (`dependencies`)  | 14                  | 9                                                                  |
| Storybook (6 packages)    | 344                 | **279 (39%)**                                                      |
| ESLint (3 packages)       | 307                 | 272                                                                |
| Vitest + RTL (9 packages) | 83                  | 55                                                                 |
| Playwright                | 3                   | 2                                                                  |

Build time is negligible with a warm cache: `build-storybook` takes about 2 seconds, `next build` about 3 seconds. Storybook's main cost is **install size and the number of dependencies to maintain**, not build time.

## 7. Redundancy and over-engineering

| Suspicion                                                    | Conclusion                                                                                                                                                                        |
| ------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Do `clsx`, `tailwind-merge` and CVA overlap?                 | **No.** Each package does one job: conditionals, class conflict resolution, variants. CVA already depends on `clsx`.                                                              |
| Is TanStack Query needed?                                    | **No.** There is no client-side data reading need: reads use Server Components, writes use Server Actions, filters live in the URL. Adding it would only add another abstraction. |
| Is global state (Zustand/Redux) needed?                      | **No.** There is no state that must be shared across multiple UI branches.                                                                                                        |
| Is axios or an HTTP library needed?                          | **No.** `fetch`, `AbortSignal.timeout` and `AbortSignal.any` are sufficient (`src/lib/api/http-client.ts`).                                                                       |
| Is a date library (date-fns, dayjs) needed?                  | **Not yet.** `Intl.DateTimeFormat` is enough for current needs.                                                                                                                   |
| Is a headless UI library (Radix) needed?                     | **No.** Native `<dialog>` and `<select>` meet the needs; axe-core and E2E have confirmed the focus trap works.                                                                    |
| Does `@tailwindcss/vite` duplicate `@tailwindcss/turbopack`? | **No.** Two different bundlers (Storybook uses Vite, Next uses Turbopack).                                                                                                        |

## 8. Recommended Dependency Baseline

**Core dependencies** (needed by almost every project):

`next`, `react`, `react-dom`, `zod`, `server-only`, `class-variance-authority`, `clsx`, `tailwind-merge`, `lucide-react`

**Forms (kept by default, can be removed):** `react-hook-form`, `@hookform/resolvers`

- These two packages are useful for admin forms (many fields, per-field errors).
- Projects with only simple forms can use `<form action>` + `useActionState` + Zod, and also gain progressive enhancement.

**Development dependencies:**

- **Build:** `typescript`, `@types/*`, `tailwindcss`, `@tailwindcss/turbopack`
- **Quality:** `eslint`, `eslint-config-next`, `eslint-config-prettier`, `prettier`, `prettier-plugin-tailwindcss`, `husky`, `lint-staged`
- **Test:** `vitest`, `@vitest/coverage-v8`, `vite`, `@vitejs/plugin-react`, `jsdom`, `@testing-library/{react,dom,jest-dom,user-event}`, `@playwright/test`
- **Docs (optional):** `storybook`, `@storybook/{nextjs-vite,addon-docs,addon-a11y}`, `@tailwindcss/vite`, `eslint-plugin-storybook`

**Optional integrations** (NOT preinstalled; add only when there is a concrete need):

| Integration    | When to add                                                                                | Suggestion                                                                                                                          |
| -------------- | ------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------- |
| Authentication | Before a public deployment in REST mode (SEC-1)                                            | Choose based on the backend's mechanism: OIDC → Auth.js or the IdP's SDK; backend-issued session → write your own `src/lib/auth.ts` |
| TanStack Query | Polling, infinite scroll, autocomplete, or many client components sharing data             | See `docs/api-integration.md` section 7                                                                                             |
| Zustand        | Real client state shared across multiple UI branches (e.g. a multi-step wizard, a builder) | Prefer URL state and context first                                                                                                  |
| Chart          | The dashboard needs charts                                                                 | Choose a library that works with Server Components or lazy-load it on the client                                                    |
| Date utility   | Time zones or complex date calculations are needed                                         | `Intl` is enough for display                                                                                                        |
| i18n           | Multiple languages are needed                                                              | See `02-guides/internationalization.md`                                                                                             |
| Monitoring     | Production                                                                                 | Hook into `instrumentation.ts` (`onRequestError`) and the error boundaries                                                          |

## 9. Prioritized Changes

| Level | ID    | Change                                                                                                                                                                                                                                                                                | Status                                                                                                     |
| ----- | ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| P0    |       | None                                                                                                                                                                                                                                                                                  |                                                                                                            |
| P1    |       | None                                                                                                                                                                                                                                                                                  |                                                                                                            |
| P2    | DEP-1 | `engines.node` declares `>=22`, while the tools actually require `^22.22.2 \|\| ^24.15.0 \|\| >=26`. Consequence: Node 22.0–22.22.1 and Node 24.0–24.14 still pass the `engines` check, but fall outside the range supported by jsdom/lint-staged; Node 25 is not supported by Vitest | **Fixed**, added `.nvmrc` and CI uses `node-version-file`                                                  |
| P2    | DEP-2 | ESLint 9 is marked deprecated; cannot be upgraded yet                                                                                                                                                                                                                                 | Monitor `eslint-config-next`; upgrade when the plugins support ESLint 10                                   |
| P3    | DEP-3 | Inconsistent Tailwind ranges (`^4` and `^4.3.3`); the Tailwind packages must always be on the same version                                                                                                                                                                            | **Fixed** (`^4.3.3` for all 3)                                                                             |
| P3    | DEP-4 | Patch `react`/`react-dom` 19.3.0 → 19.3.1                                                                                                                                                                                                                                             | **Applied**, all checks pass                                                                               |
| P3    | SEC-6 | Monitor GHSA-vfj7-8cjw-p6xm                                                                                                                                                                                                                                                           | Monitor                                                                                                    |
| P3    | DEP-5 | Storybook accounts for 39% of the dependency tree. Consider splitting it into an optional feature                                                                                                                                                                                     | **Not done**, needs a decision (section 10)                                                                |
| P3    | DEP-6 | Leftover `eslint@10` junk in `node_modules/.pnpm` on the local machine                                                                                                                                                                                                                | Optional: delete `node_modules` then `pnpm install`                                                        |
| P3    | DEP-7 | New majors available: TypeScript 7, `@types/node` 26                                                                                                                                                                                                                                  | Do not upgrade: TS is blocked by `typescript-eslint <6.1`; `@types/node` should match the Node in `.nvmrc` |

## 10. Migration Plan (for major changes, not yet carried out)

### DEP-5: make Storybook optional (only if the team does not use Storybook)

- **Affected packages:** `storybook`, `@storybook/nextjs-vite`, `@storybook/addon-docs`, `@storybook/addon-a11y`, `@tailwindcss/vite`, `eslint-plugin-storybook`.
- **Affected files:** `.storybook/`, `src/**/*.stories.tsx` (12 files), `eslint.config.mjs` (`storybook.configs`), `package.json` (scripts `storybook`, `build-storybook`), `.github/workflows/ci.yml` (`build-storybook` step), `docs/component-guidelines.md` section 7, README.

Steps:

1. `pnpm remove storybook @storybook/nextjs-vite @storybook/addon-docs @storybook/addon-a11y @tailwindcss/vite eslint-plugin-storybook`
2. Delete `.storybook/` and the `*.stories.tsx` files; remove `storybook.configs` from the ESLint config; remove the Storybook build step from CI.
3. Document in `docs/` how to reinstall with `pnpm dlx storybook@<version> init` (a `with-storybook` branch can be kept).
4. Verify: `pnpm check && pnpm build && pnpm test:e2e`; `pnpm list --depth Infinity` will drop by about 279 packages.

**Trade-offs:**

- Lose the place to develop and view components in isolation.
- Lose the a11y addon.
- Lose the Template previews.

For a design-system-oriented template, **keeping Storybook is recommended**.

### DEP-2: upgrade to ESLint 10 (once the conditions are met)

1. Monitor: `npm view eslint-config-next@latest dependencies` and the peer dependencies of `eslint-plugin-react`, `eslint-plugin-jsx-a11y`, `eslint-plugin-import`.
2. When all of them support ESLint 10: `pnpm add -D eslint@^10 eslint-config-next@<new version>`, then run `pnpm peers check`, `pnpm lint`, and check the boundary rule with a deliberately violating import.

## 11. Changes Applied

| File                       | Change                                                                      | Reason                                                      |
| -------------------------- | --------------------------------------------------------------------------- | ----------------------------------------------------------- |
| `package.json`             | `react`, `react-dom`: `19.3.0` → `19.3.1`                                   | DEP-4 (patch)                                               |
| `package.json`             | `tailwindcss`, `@tailwindcss/turbopack`: `^4` → `^4.3.3`                    | DEP-3                                                       |
| `package.json`             | `engines.node`: `>=22` → `^22.22.2 \|\| ^24.15.0 \|\| >=26.0.0`             | DEP-1                                                       |
| `.nvmrc` (new)             | `24`                                                                        | DEP-1: a single source of the Node version for local and CI |
| `.github/workflows/ci.yml` | `node-version: 24` → `node-version-file: .nvmrc` (2 jobs)                   | DEP-1                                                       |
| `README.md`                | Updated Node requirement                                                    | DEP-1                                                       |
| `pnpm-lock.yaml`           | Updated by `pnpm install` (only react/react-dom and the specifiers changed) |                                                             |

No packages removed. No overrides added. No major upgrades.

## 12. Verification Results

All commands below were **actually run**, after applying the changes:

| Command                                           | Result                                                 |
| ------------------------------------------------- | ------------------------------------------------------ |
| `pnpm install` / `pnpm install --frozen-lockfile` | OK / "Lockfile is up to date"                          |
| `pnpm peers check`                                | No peer dependency issues found                        |
| `pnpm typecheck`                                  | Pass                                                   |
| `pnpm lint`                                       | Pass                                                   |
| `pnpm format:check`                               | Pass                                                   |
| `pnpm test`                                       | 61/61 pass (12 files)                                  |
| `pnpm build`                                      | Pass; `/dashboard`, `/tasks` are `◐` Partial Prerender |
| `CI=1 pnpm test:e2e`                              | 7/7 pass                                               |
| `pnpm build-storybook`                            | Pass                                                   |
| `pnpm audit --prod`                               | No known vulnerabilities found                         |
| `pnpm audit`                                      | 1 high (SEC-6, dev-only, no patch available)           |
| `pnpm dlx knip@6.42.0`                            | No redundant or missing dependencies                   |
| `pnpm next analyze --output`                      | Ran; output is in `.next/diagnostics/analyze`          |

**Not verified:**

- CI on GitHub (the repo has not been pushed yet).
- Unknown whether React 19.3.1 fixes any security issue.
- No direct measurement yet of the Zod portion of the `/tasks` chunk (still an estimate).
- The pnpm 12 config key for ignoring an advisory without using a CLI flag has not been identified.

## Answers to the final questions

1. **Are the dependencies appropriate?** Yes. The runtime dependencies are lean, and every package has a reason to exist.
2. **Essential dependencies:** `next`, `react`, `react-dom`, `zod`, `server-only`, `class-variance-authority`, `clsx`, `tailwind-merge`, `lucide-react`.
3. **Redundant or duplicate:** none. The package with the highest maintenance cost is Storybook (optional, recommended to keep).
4. **Are the versions compatible?** Yes. The Node engines and the Tailwind ranges have been fixed. ESLint 10 and TypeScript 6/7 are blocked by upstream.
5. **Does SEC-6 still exist?** Yes, no patch available yet. The vulnerability is only in a dev tool and is never called in the repo, so monitoring is enough.
6. **Minimum baseline:** 9 core dependencies + 2 form packages, plus the dev tool set in section 8.
7. **Should be optional:** auth, TanStack Query, Zustand, chart, date, i18n, monitoring, and (if the team wants) Storybook.
8. **Ready to serve as a long-term template?** From a dependency standpoint, yes. The remaining conditions are not dependency-related: auth (SEC-1) and getting CI green on GitHub.
