---
name: atomic-component-development
description: 'Create or change a reusable UI component in src/components (atom, molecule, organism, template) following Atomic Design. Use when asked for a new button/badge/input/dialog/table/layout component or a shared UI building block.'
---

# Atomic component development

## Read first

`docs/ai/rules/architecture.md` (R-ATOM-1…8), `docs/component-guidelines.md` (decision tree, composition patterns, anti-patterns).

## Steps

1. **Is it new?** Search `src/components/**` and the stories (`*.stories.tsx`). Try, in order: existing component as-is → composition (slot `ReactNode`, render prop like `FormField`) → a new `variant` in its `cva` → a native element. Done when you can name why each option fails, or you stop and reuse.
2. **Shared or feature?** Any domain knowledge (entity name, Server Action, business label/status mapping) → `src/features/<f>/components/`, not here. Example: `TaskStatusBadge` lives in the feature and wraps the shared `Badge`.
3. **Classify by responsibility** (R-ATOM-2): atom = single element (`Button`, `Badge`); molecule = a few atoms doing one job (`SearchInput` = `Input` + icon + clear button); organism = a page region (`DataTable`, `AppSidebar`); template = slots only (`DashboardTemplate`). Unsure → the lower level.
4. **Implement** following `src/components/atoms/button.tsx`: `ComponentProps<'el'>` + `VariantProps`, `className` merged with `cn()`, token classes only, named export, kebab-case file. No `'use client'` unless it needs state/effects/handlers itself.
5. **Accessibility**: accessible name for every control (label or `aria-label` on icon-only buttons), icons `aria-hidden`, `aria-invalid`/`aria-describedby` for errors, keyboard reachable, native elements before ARIA.
6. **Test** (`*.test.tsx` next to it): behaviour by role/label (click, disabled/loading, error wiring). **Story** (`*.stories.tsx`, `title: 'Atoms/Name'` etc.) with the main variants.
7. **Verify**: `pnpm check`, `pnpm build-storybook`. Done when both pass.

## Composition examples

- Atom → molecule: `FormField` = `Label` + any control (render prop passes `id`/`aria-*`) + hint/error text.
- Molecule → molecule: `ConfirmationDialog` = `Dialog` + `Alert` + two `Button`s (no second modal implementation).
- Organism + feature: `DataTable` stays generic; `TaskTable` (feature) passes `columns` with domain cells.

## Pitfalls

- A wrapper that only fixes a few classes on one element (R-ATOM-7).
- Hard-coded colors (`#3b82f6`, `text-blue-600`) instead of tokens; dark mode breaks.
- `className` applied to a wrapper in one component and to the control in another: keep the existing convention of the closest sibling component.

## Output

Component path and level with a one-line justification, alternatives rejected, test + story paths, commands run.
