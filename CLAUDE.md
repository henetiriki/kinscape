@AGENTS.md
@docs/security.md
@docs/writing.md

## Claude-specific notes

- Plan in **plan mode**. In local plan mode, the tech lead approves when they accept the plan. A CI plan has its own approval: see [Building and shipping](docs/building.md#specs-bugs-and-chores).
- The project default model is `opusplan`: Opus in plan mode, Sonnet otherwise. For `/refine`, see [How we work](docs/how-we-work.md#drafting-with-claude).
- Keep shared instructions in `AGENTS.md`. Only put things here that apply to Claude alone.
