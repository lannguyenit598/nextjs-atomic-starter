---
name: release-readiness
description: 'Pre-commit/pre-release check of the whole repository: git status, secrets, lockfile, full test/build suite, clean-checkout reproduction, CI config, env defaults and docs. Use before committing a large change, cutting a release, or when asked whether the repo is ready to ship.'
---

# Release readiness

## Guardrail

Commit only when the user asked for a commit. Push, force-push, history rewrites, tag pushes and deployments happen only on an explicit request for that exact action. Without a configured remote, stop at a local commit and print the commands instead.

## Steps

1. **Git state**: `git status --short --untracked-files=all`, `git diff --stat`, `git remote -v`. List untracked files that must ship (source, tests, stories, `pnpm-lock.yaml`, `.nvmrc`, `public/.gitkeep`, `.github/`, `.agents/`, `.claude/`, docs) and ignored artifacts that must not (`.next`, `node_modules`, `coverage`, `storybook-static`, `test-results`, `.env*` except `.env.example`).
2. **Secrets**: scan the files to be committed for tokens/keys/private keys and real values in `.env.example` (only placeholders allowed). Confirm `AUTH_ALLOW_ANONYMOUS` default is `false` (`src/lib/env.ts`) and `resolveSession()` default returns `null`.
3. **Full suite**: `pnpm install --frozen-lockfile`, `pnpm audit --prod`, `pnpm check`, `pnpm build`, `CI=1 pnpm test:e2e`, `pnpm build-storybook`, `pnpm agents:check`.
4. **Clean checkout**: stage, export the index (`git archive "$(git write-tree)"`) into a temp directory, then install and run the suite there. Proves nothing relies on untracked local files.
5. **CI config**: `.github/workflows/ci.yml` uses `.nvmrc`, `packageManager` and `--frozen-lockfile`; jobs cover the suite.
6. **Commit** (when asked): conventional subject line; follow the repository owner's commit conventions; `git diff --cached --check` clean; verify the committed tree equals the tested tree.

## Output

Commit hash (or "not committed"), files committed, every command with result, remote status, and a clear split: **template readiness** vs **application production readiness** (needs real auth, infrastructure, green remote CI).
