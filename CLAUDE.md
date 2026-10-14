@AGENTS.md

## Claude-specific notes

- Do the planning step in **plan mode**. The tech lead approves by accepting the plan.
- **Models:** plan and refine on Opus at high effort, and build on Sonnet. The project default in `.claude/settings.json` is `opusplan` (Opus in plan mode, Sonnet when executing). `/refine` runs outside plan mode, so it asks for Opus at high effort itself (`model` and `effort` in its frontmatter) and tells the user how to switch if the session isn't on them.
- Keep shared instructions in `AGENTS.md`. Only put things here that apply to Claude alone.
