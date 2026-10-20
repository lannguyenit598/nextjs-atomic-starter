# Rules: Atomic Design and Feature-Based Architecture (R-ATOM, R-FEAT)

Full explanation (why, examples, diagrams): [`docs/architecture.md`](../../architecture.md) and [`docs/component-guidelines.md`](../../component-guidelines.md). This file only holds the **mandatory** part.

## Layers and import direction

```text
app/         Routing + page composition    → may import: features, components, config, lib
features/X/  Business code of X            → may import: components, lib (and files inside X)
components/  Shared design system          → may import: lib (and lower Atomic levels)
lib/         Technical infrastructure      → imports nothing from app, features, components
config/      App configuration (nav, site) → may import: components (types), lib
```

## Atomic Design (R-ATOM)

Atomic Design is a **mental model for composing UI**, not five mandatory technical layers.

| ID       | Level  | Rule                                                                                                                                                                                                                                                                                    | Why                                                           | Verified by                         |
| -------- | ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------- | ----------------------------------- |
| R-ATOM-1 | MUST   | Components with business knowledge (domain names, Server Actions, business schemas, business labels) live in `src/features/<f>/components/`. `src/components/` only holds UI that knows nothing about the domain.                                                                       | The design system stays reusable across projects.             | `lint` (import direction), `review` |
| R-ATOM-2 | MUST   | Classify by **responsibility**, not by file name or line count: atom = a single element; molecule = a few atoms doing **one** job; organism = a region of a page; template = a layout skeleton with slots and no real data.                                                             | Matches Brad Frost's definitions.                             | `review`                            |
| R-ATOM-3 | MUST   | An Atomic **Page** is `app/**/page.tsx` (template + real data). An Atomic **Template** (`src/components/templates/`) is not `layout.tsx`: the template only has slots; the layout is the routing mechanism that fills the template. Do not create a separate `components/pages` folder. | Keeps the design concept separate from the routing mechanism. | `review`                            |
| R-ATOM-4 | MUST   | Before creating a new component: look for an existing one, try composition (slots, render props), try adding a variant, try a native HTML element. Create a new component only when none of these is enough.                                                                            | Avoids duplicates and empty wrappers.                         | `review`                            |
| R-ATOM-5 | MUST   | Shared components: fully typed props, accept `className` (merged with `cn()`), use color tokens only (`bg-primary`…), never hard-coded colors; accessible (label/`aria-*`, keyboard, `aria-invalid` on errors).                                                                         | Consistent and usable with screen readers.                    | `review`, `test` (role queries)     |
| R-ATOM-6 | SHOULD | Do not force everything through all five levels; features may use atoms/organisms directly. When unsure between two levels, pick the lower one.                                                                                                                                         | Extra layers add no value.                                    | `review`                            |
| R-ATOM-7 | SHOULD | Do not create a component that only wraps one HTML element with a few fixed classes.                                                                                                                                                                                                    | Empty wrappers are maintenance cost.                          | `review`                            |
| R-ATOM-8 | MAY    | Classification can be ambiguous (e.g. `Card`, `Dialog`). Accept it when there is a reason; do not move files just to be "by the book".                                                                                                                                                  | Atomic Design "is not rigid dogma".                           | `human`                             |

## Feature boundaries (R-FEAT)

| ID       | Level  | Rule                                                                                                                                                                                        | Why                                                             | Verified by                      |
| -------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------- | -------------------------------- |
| R-FEAT-1 | MUST   | `src/components/**`, `src/lib/**`, `src/hooks/**` never import `@/features/*` or `@/app/*`.                                                                                                 | Shared code must not depend on business code.                   | `lint` (`no-restricted-imports`) |
| R-FEAT-2 | MUST   | A feature never imports `@/features/*` (including other features). Use relative imports inside a feature. When two features need the same thing: move UI to `components/`, logic to `lib/`. | Features can be removed or replaced independently.              | `lint`                           |
| R-FEAT-3 | MUST   | No circular imports.                                                                                                                                                                        | Cycles cause initialization bugs and obscure the data flow.     | `lint` (`import/no-cycle`)       |
| R-FEAT-4 | MUST   | Data access only through the feature repository (`services/<f>-repository.ts`, adapter chosen by `API_MODE`). Components never call `fetch` or `backendRequest`.                            | Switching demo ↔ REST changes no UI.                            | `review`                         |
| R-FEAT-5 | MUST   | Feature layout: `schemas.ts`, `types.ts`, `actions.ts`, `services/`, `components/` (plus `constants.ts`, `hooks/` when needed). Split a file into a folder only when it grows too large.    | Every feature looks the same.                                   | `review`                         |
| R-FEAT-6 | SHOULD | No barrel files (`index.ts` re-exports).                                                                                                                                                    | Barrels pull server code into client bundles and create cycles. | `review`                         |
| R-FEAT-7 | SHOULD | Move code from a feature to shared only when **all three** hold: ≥ 2 consumers, the domain knowledge can be removed, the domain part can be passed in via props/slots.                      | No premature abstraction.                                       | `review`, `human`                |
