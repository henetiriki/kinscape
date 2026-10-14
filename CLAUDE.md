@AGENTS.md

## Claude-specific notes

- Do the planning step in **plan mode**. The tech lead approves by accepting the plan.
- **Models:** plan and refine on Opus at high effort, and build on Sonnet. The project default in `.claude/settings.json` is `opusplan` (Opus in plan mode, Sonnet when executing). `/refine` runs outside plan mode, so its frontmatter asks for Opus at high effort (`model` and `effort`). Observed: the CLI honours the project default; the Claude desktop app ignores the frontmatter, and a warning written into the skill was skipped there, so it was removed. In the app the user must choose Opus and High effort in the selectors before running `/refine`.
- Keep shared instructions in `AGENTS.md`. Only put things here that apply to Claude alone.
