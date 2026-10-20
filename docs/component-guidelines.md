# Component Guidelines

## 1. Before creating a new component

Go through these in order, from top to bottom. Stop at the first step that solves the problem:

1. **Does it already exist?** Look in `src/components/**` and Storybook (`pnpm storybook`).
2. **Can it be composed from existing components?** For example `<EmptyState action={<Button>…</Button>} />`.
3. **Can you add a prop or variant to an existing component?** Only do this if the component still has a single responsibility.
4. **Can native HTML do it?** `<select>`, `<input type="date">`, `<dialog>`, `<details>`. You get accessibility and mobile support for free.
5. Only create a new component when none of the steps above work.

**Create a component when:**

- The same piece of UI repeats ≥ 2 times with the same meaning; or
- A block of UI has a clear responsibility and makes the file that contains it easier to read (for example `TaskStatusSelect`).

**Do not create a component when:**

- It only wraps one HTML tag plus a few fixed classes (`<Title>` = `<h2 className="…">`). Use the classes directly.
- You are guessing that "it might be needed later". Wait until it is actually needed.

## 2. Classification: shared or feature?

```text
Does the component contain business-domain knowledge?
(domain names like Task/Order/User, calls a Server Action, business schema, business labels)
│
├── YES → src/features/<feature>/components/
│
└── NO  → Could it be used in a project with a different domain?
            ├── YES      → src/components/<atoms|molecules|organisms|templates>/
            └── NOT SURE → keep it in the feature first; move it to shared on the 2nd use
```

Examples:

| Component            | Where          | Why                                                      |
| -------------------- | -------------- | -------------------------------------------------------- |
| `Badge`              | atoms          | Knows nothing about tasks                                |
| `TaskStatusBadge`    | features/tasks | Knows how to map `done` → `success` and the label "Done" |
| `DataTable`          | organisms      | Generic table; the caller decides the cells              |
| `TaskTable`          | features/tasks | Knows the Task columns and calls actions                 |
| `ConfirmationDialog` | molecules      | Confirms any action                                      |
| `DeleteTaskButton`   | features/tasks | Calls `deleteTaskAction`                                 |

The fact that `TaskCard` contains many atoms does **not** mean it is a shared molecule. The deciding question is **whether it has domain knowledge**, not "how many atoms it is built from".

## 3. Choosing the Atomic level

| If the component…                                                                             | Level                        |
| --------------------------------------------------------------------------------------------- | ---------------------------- |
| Is a single UI element, close to one HTML tag, and cannot be broken down further              | **Atom**                     |
| Combines a few atoms to do **one** thing (label + input + error; input + icon + clear button) | **Molecule**                 |
| Is a distinct **section** of the page (header, sidebar, table, large form)                    | **Organism**                 |
| Is the **layout frame** of a whole page, with slots and no real content                       | **Template**                 |
| Is a template + real data                                                                     | **Page** = `app/**/page.tsx` |

When you are unsure between two levels, choose the lower one. Moving it up later is easy: just move the file and fix the imports.

## 4. Composition

Prefer composing components together over a single component with dozens of boolean props.

```tsx
// Good: slots that accept a ReactNode
<PageHeader title="Tasks" actions={<TaskFormDialog />} />
<EmptyState title="No tasks" action={<Button>Create</Button>} />

// Good: render prop when the child component needs props from the parent
<FormField label="Title" error={errors.title?.message}>
  {(field) => <Input {...field} {...register('title')} />}
</FormField>

// Good: build a component from smaller components
// ConfirmationDialog = Dialog + Alert + 2 Button

// Avoid: one component that does everything
<Modal isConfirm isForm isDelete showFooter footerAlign="right" … />
```

Standard pattern for writing a shared component (see `src/components/atoms/button.tsx`):

```tsx
import { cva, type VariantProps } from 'class-variance-authority'
import type { ComponentProps } from 'react'

import { cn } from '@/lib/utils'

const thingVariants = cva('base classes', {
  variants: { variant: { primary: '…', outline: '…' }, size: { sm: '…', md: '…' } },
  defaultVariants: { variant: 'primary', size: 'md' },
})

export type ThingProps = ComponentProps<'div'> & VariantProps<typeof thingVariants>

export function Thing({ className, variant, size, ...props }: ThingProps) {
  return <div className={cn(thingVariants({ variant, size }), className)} {...props} />
}
```

Checklist:

- [ ] Props are fully typed, with no `any`; extend `ComponentProps<'tag'>` when the component wraps an HTML tag.
- [ ] Accepts `className` and merges it with `cn()`, so the caller's classes take precedence.
- [ ] Uses only colour tokens (`bg-primary`, `text-muted-foreground`), no hex values.
- [ ] Accessibility: has a label/`aria-label`; decorative icons have `aria-hidden`; `aria-invalid` when there is an error; operable with the keyboard.
- [ ] Handles disabled, loading and error states where appropriate.
- [ ] Does not add `'use client'` if it uses no state, effects or event handlers.
- [ ] Has tests for important behaviour (`*.test.tsx`) and a story (`*.stories.tsx`) if it is a visual component.
- [ ] File name in kebab-case (`search-input.tsx`), export name in PascalCase (`SearchInput`), uses a named export.

## 5. When to move a component from a feature to shared

Only move it when **all three** of the following are true:

1. The component is used (or needs to be used) in ≥ 2 features.
2. All domain knowledge can be removed: neutral prop names (`items`, `label`, `onConfirm` instead of `tasks`, `onDeleteTask`).
3. The remaining domain parts can be passed in through props or slots.

Steps:

1. Extract the generic part into `components/<level>/` and give it a neutral name.
2. Keep a thin wrapper in the feature if needed. For example `TaskStatusBadge` uses `Badge`.
3. Add tests and a story for the shared component.
4. Run `pnpm lint` to make sure shared code does not import back into the feature.

## 6. Common anti-patterns

| Anti-pattern                                                                | Problem                                                                          | The right way                                                                                    |
| --------------------------------------------------------------------------- | -------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| Putting `TaskCard` in `molecules/` because "it is built from atoms"         | The design system gets mixed with business logic                                 | Keep it in `features/tasks/components/`                                                          |
| An atom calls an API or a Server Action                                     | Not reusable, hard to test                                                       | The feature makes the call; the atom only receives props                                         |
| Each level adds another wrapper (`TaskButton` → `PrimaryButton` → `Button`) | Adds layers without adding value                                                 | Use `Button variant="primary"`                                                                   |
| 500-line god component                                                      | Hard to read, hard to test                                                       | Split by responsibility: filters, table, form                                                    |
| `'use client'` in a page or layout                                          | The whole tree is pushed to the client, losing the benefits of Server Components | Only put it on interactive leaves                                                                |
| Passing props through 4–5 levels (prop drilling)                            | Breaks easily during refactoring                                                 | Composition (slots), URL state, or let child Server Components fetch their own data              |
| Adding Redux/Zustand "just in case"                                         | Unnecessary complexity                                                           | URL state + Server Components; add global state when there is a real need                        |
| Rewriting Modal, Select or Date picker from scratch                         | Gets accessibility wrong (focus, keys)                                           | Use native elements (`<dialog>`, `<select>`, `<input type="date">`) or a mature headless library |
| Hard-coding the colour `#3b82f6`                                            | The theme cannot be changed                                                      | Use tokens                                                                                       |
| A barrel `index.ts` in every folder                                         | Pulls server code into the client bundle, easily creates import cycles           | Import directly from the file                                                                    |

## 7. Storybook

- Stories live next to the component: `button.stories.tsx`.
- `title` follows the level: `'Atoms/Button'`, `'Molecules/FormField'`, `'Templates/DashboardTemplate'`.
- The toolbar has a button to switch the **Theme** (light/dark). The **a11y** addon reports accessibility errors directly in the story.
- Only write stories for shared components. Feature UI is checked with tests and E2E.
