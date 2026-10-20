---
trigger: glob
description: 'Editing Server Actions, auth, backend client, env or security headers'
globs: 'src/features/**/actions.ts, src/lib/auth.ts, src/lib/auth-provider.ts, src/lib/api/**, src/lib/env.ts, next.config.ts, .env.example'
---

# Security-sensitive files

These files carry the fail-closed auth contract, credentials and security headers.

- Follow R-SEC-1…11 in `docs/ai/rules/security.md`.
- Run the `app-security-review` skill before finishing and add the negative tests it lists.
