---
trigger: glob
description: 'Editing Next.js routes, layouts and pages in src/app'
globs: 'src/app/**'
---

# Routes (src/app)

`src/app` composes features and shared UI; it holds no reusable components or business logic.

- Follow R-NX-1…13 in `docs/ai/rules/nextjs.md` (Next.js 16 Cache Components: request-time data inside `<Suspense>`, `searchParams`/`connection()` before session reads).
- Use the `nextjs-server-client-boundaries` skill when adding `'use client'` or moving data fetching.
