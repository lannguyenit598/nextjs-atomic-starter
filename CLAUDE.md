@AGENTS.md

## Claude Code

- Skills: `.claude/skills/` holds generated adapters for the canonical skills in `.agents/skills/`; invoke one with `/<skill-name>`. Edit only `.agents/`, then run `pnpm agents:sync`.
- Path-scoped rules in `.claude/rules/` are generated from `.agents/rules/` and load when you touch matching files.
