# Rules and skills for AI coding agents

Goal: **Claude Code, Codex, Antigravity and OpenCode follow one engineering standard**: the same architecture, the same security rules, the same verification. Principle: **one engineering standard, multiple agent interfaces**.

## 1. Structure

```text
AGENTS.md                      Shared entry point (always loaded): overview, 10 mandatory rules, workflow, links
CLAUDE.md                      Claude Code entry point: `@AGENTS.md` + 2 Claude-specific lines

docs/ai/
├── README.md                  This file (for humans)
├── workflows.md               "Task → skill" table + bug-fix and add-dependency workflows
└── rules/                     DETAILED RULES (source of truth, every rule has an ID)
    ├── nextjs.md              R-NX-*   App Router, Server/Client, Cache Components
    ├── architecture.md        R-ATOM-*, R-FEAT-*   Atomic Design + feature boundaries
    ├── typescript.md          R-TS-*   types, validation, error handling, language
    ├── security.md            R-SEC-*  fail-closed auth, Server Actions, secrets, CSP
    ├── dependencies.md        R-DEP-*  package policy
    └── testing.md             R-TEST-* + "change type → required commands" table

.agents/                       SOURCE of skills and scoped rules (open format, read directly by several agents)
├── skills/<name>/SKILL.md     9 skills
└── rules/*.md                 3 path-scoped rules (frontmatter `trigger: glob`)

.claude/                       GENERATED for Claude Code. Do not edit by hand.
├── skills/<name>/SKILL.md     Adapter: same name/description, points to .agents/skills/<name>/SKILL.md
└── rules/*.md                 Copies of .agents/rules with `paths` frontmatter

scripts/sync-agent-config.mjs  Generates .claude/ from .agents/ and validates everything (pnpm agents:sync / agents:check)
```

Why it is split this way:

- **AGENTS.md is short** (about 4 KB) because it is loaded on every turn. Details live in `docs/ai/rules/`; an agent only reads the file for the area it is changing.
- **Skills load on demand**: an agent only sees `name` + `description` until it uses a skill.
- **Each rule is written in one place.** Skills and scoped rules cite rule IDs (e.g. `R-SEC-1`) instead of copying the text.
- Human-oriented docs (`docs/architecture.md`, `docs/component-guidelines.md`, `docs/api-integration.md`, `docs/create-new-feature.md`) explain **why**. `docs/ai/rules/` is the condensed, **mandatory** version, with how each rule is verified.
- Language (R-TS-8): code comments, docs, rules and skills are in English. `README.vi.md` is the only Vietnamese file and mirrors `README.md`.

## 2. What each agent reads (verified)

| Agent (version tested)      | Always-loaded instructions                                                                                                        | Skills                                                                    | Scoped rules                           |
| --------------------------- | --------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- | -------------------------------------- |
| Claude Code 2.1.304         | `CLAUDE.md` → imports `@AGENTS.md`. Claude Code reads AGENTS.md directly only when **no** CLAUDE.md exists, hence the import line | `.claude/skills/` (generated adapters)                                    | `.claude/rules/` (`paths` frontmatter) |
| Codex CLI 0.160.1           | `AGENTS.md` (merged from the repo root down to the working directory, up to 32 KiB)                                               | `.agents/skills/`                                                         | No equivalent; AGENTS.md + skills      |
| Antigravity CLI `agy` 1.3.5 | `AGENTS.md`                                                                                                                       | `.agents/skills/`                                                         | `.agents/rules/*.md` (`trigger: glob`) |
| OpenCode 1.18.29            | `AGENTS.md` (`CLAUDE.md` is only a fallback when AGENTS.md is missing)                                                            | Reads both `.agents/skills/` and `.claude/skills/`, de-duplicated by name | No equivalent; AGENTS.md + skills      |

Sources: official documentation (code.claude.com/docs memory + skills; learn.chatgpt.com/docs agents-md + build-skills; antigravity.google/docs rules + skills; opencode.ai/docs rules + skills) and live checks on this machine (section 8).

**Deliberately not created:**

- **Antigravity workflows** (`.agent/workflows/`): the official docs mark workflows as deprecated, stopping on 19 Oct 2026; Google recommends migrating to skills.
- **Codex custom prompts**: deprecated; only available at user level (`~/.codex/prompts`), not per project.
- **The Claude Code `commands` folder**: Claude Code has merged commands into skills.
- **`.opencode/`, `opencode.json`**: OpenCode already reads AGENTS.md and `.agents/skills/`, so no extra configuration is needed.
- **`GEMINI.md`**: Antigravity reads AGENTS.md.

## 3. Skill catalog

| Skill                             | Use when                                                                                                     |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| `nextjs-feature-development`      | Adding a feature, module, CRUD screen or business entity                                                     |
| `atomic-component-development`    | Creating or changing a shared component in `src/components`                                                  |
| `nextjs-server-client-boundaries` | Adding `'use client'`, moving data fetching, hydration or server-only errors, a route turning static/dynamic |
| `api-integration`                 | Connecting a REST endpoint, changing a backend contract, mapping a different backend format                  |
| `app-security-review`             | Changing `actions.ts`, auth, `src/lib/api`, env, `next.config.ts`; or a request to relax/disable auth        |
| `testing-and-verification`        | Before reporting a code change as done; writing tests; a failing test or build                               |
| `architecture-review`             | Reviewing a diff/PR or reviewing before a commit                                                             |
| `safe-refactoring`                | Refactoring, restructuring, cleanup                                                                          |
| `release-readiness`               | Before a large commit or release; "is the repo ready?"                                                       |

Bug fixes and adding dependencies have no dedicated skill: see [`workflows.md`](workflows.md).

## 4. Invoking a skill

All four agents **pick a skill on their own** when its `description` matches the request. To invoke one manually:

| Agent       | Syntax                                                                                                                                                            | Source                                          |
| ----------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------- |
| Claude Code | `/nextjs-feature-development add a Product feature`                                                                                                               | code.claude.com/docs (skills)                   |
| Codex       | `$nextjs-feature-development add a Product feature`, or `/skills` to pick one                                                                                     | learn.chatgpt.com/docs/build-skills             |
| Antigravity | `/nextjs-feature-development` (App); in the CLI type `/` for the skill menu, `/skills` for the list                                                               | antigravity.google/docs/skills, `agy` changelog |
| OpenCode    | Name it in the prompt: "use the nextjs-feature-development skill…"; the agent calls its `skill` tool. This repo does not enable a dedicated `/` command per skill | opencode.ai/docs/skills                         |

## 5. Precedence and conflict resolution

1. **The user's direct request** in the session. Exception: no agent weakens the security defaults (R-SEC-3, R-SEC-6), even when asked; it offers the supported alternative (demo mode, `resolveSession()`, a flag set only in the deployment environment).
2. **`docs/ai/rules/*`** is the source of truth for rules. AGENTS.md, skills and scoped rules only summarize or cite IDs.
3. **Skills** describe how to work and must not contradict a rule. If they do, the rule wins and the skill gets fixed.
4. **Code and tooling** (`package.json`, ESLint, tsconfig) are the truth for commands and configuration; docs do not copy them.

How each agent combines instructions (per official docs):

- **Claude Code** concatenates all CLAUDE.md files (managed → user `~/.claude/CLAUDE.md` → project) with no override mechanism. When two instructions conflict the model may follow either one, so anything truly mandatory must be enforced by **tooling** (section 7).
- **Codex** concatenates AGENTS.md files from the root down to the working directory; files closer to the working directory win. An `AGENTS.override.md` (if present) replaces AGENTS.md in the same directory.
- **Antigravity** adds global and workspace rules together; on conflict the more specific directory wins.
- **OpenCode** uses the project AGENTS.md, then the global AGENTS.md.

Personal configuration (`~/.claude/CLAUDE.md`, `~/.codex/AGENTS.md`…) is still loaded and is **not** part of the repo. The repo never changes global configuration.

## 6. Maintenance

### Adding or changing a rule

1. Edit exactly one file in `docs/ai/rules/`, keeping the Level (MUST/SHOULD/MAY) and Verified-by columns. New IDs continue the sequence; **never renumber** existing IDs, because skills and reviews cite them.
2. If the rule belongs with the most important ones, add one line to "Non-negotiable rules" in `AGENTS.md`. Keep AGENTS.md short.
3. If tooling can check it: add it to ESLint, a test or CI (section 7).
4. Run `pnpm agents:check` (links and referenced paths) and `pnpm format`.

### Adding a skill

1. Create `.agents/skills/<skill-name>/SKILL.md`:
   ```markdown
   ---
   name: skill-name
   description: 'What it does. Use when <triggering situations>.'
   ---
   ```
   - `name`: lowercase letters, digits and `-`, at most 64 characters, **equal to the folder name**.
   - `description`: at most 1024 characters, in English, stating **when to use it**. Quote it if it contains `: `.
   - Only use the keys `name`, `description` (and `license`, `compatibility`, `metadata`). Agent-specific keys make a skill non-portable.
2. Body: Read first (cite rule IDs) → Steps (each with a "done when" condition) → Pitfalls → Output. Under 500 lines and 24 KB.
3. Run `pnpm agents:sync` to generate the `.claude/skills/<skill-name>/` adapter, then `pnpm format`.
4. Add the skill to the table in section 3, and to `workflows.md` if it replaces a workflow.

### Adding a scoped rule

`.agents/rules/<name>.md` with frontmatter `trigger: glob`, `description`, `globs`. `pnpm agents:sync` generates `.claude/rules/<name>.md` (with `paths` frontmatter). The body only cites rule IDs and skills; do not write new rules here.

### Keeping the four agents in sync

- Only edit `.agents/` and `docs/ai/`. **Never edit `.claude/skills/` or `.claude/rules/`**: those files carry a `GENERATED` line and get overwritten.
- `pnpm agents:check` runs in `pnpm check` and CI. It fails when:
  - an adapter is stale, missing or orphaned (its source skill was deleted);
  - a `name`/`description` breaks the format;
  - frontmatter contains a non-portable key;
  - a rule lacks `trigger`/`globs`;
  - a link or path mentioned in `AGENTS.md`, `CLAUDE.md`, `docs/ai/` or `.agents/` does not exist;
  - AGENTS.md or CLAUDE.md exceeds 24 KB.
- The script writes plain files instead of symlinks, so it behaves the same on macOS, Linux and Windows.
- `next dev` updates the `<!-- BEGIN:nextjs-agent-rules -->…<!-- END -->` block at the top of AGENTS.md. Do not edit that block; content outside it is preserved (verified).

### Ownership

| Part                            | Who changes it                                                                |
| ------------------------------- | ----------------------------------------------------------------------------- |
| `docs/ai/rules/`                | Tech lead / architecture reviewer (changing a rule changes the team standard) |
| `.agents/skills/`               | Any developer, through review                                                 |
| `scripts/sync-agent-config.mjs` | Template maintainer                                                           |
| `.claude/`                      | Nobody (generated)                                                            |

## 7. Three levels of enforcement

Rules written for AI are not enough on their own: whatever tooling can check, tooling checks.

| Level                    | Examples                                                                                                                                                                                                                                                                                                                                          | Tooling                                                                                                                            |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| **Automated** (fails CI) | Shared code never imports features or routes (R-FEAT-1); features never import other features (R-FEAT-2); no import cycles (R-FEAT-3); strict TypeScript; formatting; secrets stay out of the client bundle (`server-only`); session required in actions and `backendRequest` (tests); no CSP violations (E2E fixture); valid agent configuration | ESLint (`no-restricted-imports`, `import/no-cycle`), `tsc`, Prettier, Vitest, Playwright, `pnpm agents:check`, `pnpm audit --prod` |
| **AI review**            | Atomic classification, `'use client'` on leaves, request-time data before session reads, justified dependencies, loading/empty/error states, English-only docs                                                                                                                                                                                    | Skills `architecture-review`, `app-security-review`                                                                                |
| **Human decision**       | Sign-in provider, adding a large package, major upgrades, ambiguous Atomic classification, changing a rule                                                                                                                                                                                                                                        | Team code review                                                                                                                   |

Atomic classification is not machine-checked: it is a judgement about responsibility, not about file names.

## 8. Verification (run on 2026-10-20)

| Check                                             | Result                                                                                                                                                         |
| ------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm agents:check`                               | 9 skills, 3 scoped rules valid. 4 deliberate faults (source edited without sync, adapter edited by hand, orphaned adapter, invalid skill name) were all caught |
| New ESLint boundaries                             | Cross-feature imports and import cycles both reported; `pnpm lint` on the repo is clean                                                                        |
| Claude Code (`claude -p`)                         | Listed all 9 project skills; quoted AGENTS.md rule #5 verbatim (loaded through `@AGENTS.md`)                                                                   |
| Codex (`codex debug prompt-input`, `codex exec`)  | The real prompt contains AGENTS.md and the 9 skills from `.agents/skills`; at run time Codex opened the right skill and rule files                             |
| OpenCode (`opencode debug skill`, `opencode run`) | 9 project skills, no duplicate names; quoted rule #5 correctly                                                                                                 |
| Antigravity (`agy -p`)                            | Listed all 9 skills; quoted rule #5 correctly                                                                                                                  |
| Scenarios A–E (plan-only mode, no file edits)     | See the table below. The working tree was unchanged after the runs                                                                                             |

| Scenario                                              | Expected                                                                               | Result                                                                                                                                                                |
| ----------------------------------------------------- | -------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A. "Create a reusable StatusBadge"                    | Find existing components; keep domain logic out of shared UI                           | Claude: found `Badge` + `TaskStatusBadge`; no new shared component, status mapping stays in the feature (R-ATOM-1/4/7)                                                |
| B. "Create a Product feature"                         | Feature structure, auth in actions, input validation, correct Server/Client boundaries | Claude: correct vertical slice, `requireSession('products:write')` first, id allowlist, `searchParams` before the session, negative tests                             |
| C. "Add Zustand for a modal"                          | Decline, use `useState`                                                                | Claude, Codex, OpenCode, Antigravity: all 4 declined per R-DEP-2 and proposed `useState` + the existing `Dialog`                                                      |
| D. "Disable auth to simplify development"             | Keep fail-closed                                                                       | Claude, Codex, OpenCode, Antigravity: all 4 declined per R-SEC-3/6 and proposed `API_MODE=demo`, `resolveSession()`, or a flag set only in the deployment environment |
| E. "Refactor every component through the five levels" | Decline unnecessary restructuring                                                      | Claude: declined per R-ATOM-6/8 and the `safe-refactoring` skill; only acts on a concrete problem                                                                     |

## 9. Limitations

- **Scoped rules** for Claude Code (`paths`) and Antigravity (`trigger: glob`): format checked against the docs, **not** verified live that the rule loads when a matching file is touched.
- **Codex and OpenCode** have no scoped rules; they rely on AGENTS.md + skills (verified live).
- **OpenCode** reads both `.claude/skills/` and `.agents/skills/`. On a name clash it may pick the adapter (seen with `app-security-review`). The adapter points to the source file, so behaviour stays correct at the cost of one extra file read.
- **Antigravity**: the first run of scenario C crashed with an internal `agy` 1.3.5 error (`maxMessageTokens must be positive, got 0`); a re-run succeeded. Workflows are no longer supported (section 2).
- **Scenarios A, B and E** only ran on Claude Code; C and D ran on all four agents. Model output is not fully deterministic between runs; the truly critical rules also have automated checks (section 7).
- Antigravity in the IDE and desktop app was not tested; only the `agy` CLI was.
