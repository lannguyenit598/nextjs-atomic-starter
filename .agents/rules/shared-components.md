---
trigger: glob
description: 'Editing the shared design system in src/components'
globs: 'src/components/**'
---

# Shared components (src/components)

This folder is the domain-free design system.

- Follow R-ATOM-1…8 and R-FEAT-1 in `docs/ai/rules/architecture.md`: no business concepts, imports only from `@/lib` and lower Atomic levels.
- Use the `atomic-component-development` skill for new or changed components: reuse first, test by role/label, add a story.
