# Plan: C695: Make publish-design-system use the Artifact tool

- **Spec:** #695
- **Status:** draft

## Approach

Both files are hand-back paths, so the tech lead builds this plan. Step 1 accepts the `Artifact` tool or the six MCP tools. Steps 3 to 11 name the `Artifact` call, with the MCP call as the fallback.

## Decisions

**D1 · Skill word budget** · Decides: Tech lead

`SKILL.md` has about 640 of its 650 words, and the Chore adds about 250. How do they fit?

- **A.** Put the map and the `publish` rules in a new `tools.md` that `SKILL.md` links to.
- **B.** Raise the skill budget in `scripts/word-count.mts` to 900.
- **C.** Shorten the current steps.
- **Other:** your own.

Recommended: A, because each file stays in budget.

**D2 · Order with #696** · Decides: Tech lead

The `AGENTS.md` link needs the section that #696 adds.

- **A.** Build after #696 merges. Record #696 as a blocker.
- **B.** Build both Chores in one PR.
- **Other:** your own.

Recommended: A, because an agent can build #696 first.

## Files that change

| File                                            | New / changed | What                         |
| ----------------------------------------------- | ------------- | ---------------------------- |
| `.claude/skills/publish-design-system/SKILL.md` | changed       | Description, steps, Rules    |
| `.claude/skills/publish-design-system/tools.md` | new (D1: A)   | Tool map and `publish` rules |
| `AGENTS.md`                                     | changed       | One sentence with the link   |

## Order of work

1. Read the `Artifact` tool's description. Check the create and icon calls in the map.
2. Edit the skill, then `AGENTS.md`.
3. Do the runs in Proof.

## Proof

| Acceptance check                   | Proven by                                |
| ---------------------------------- | ---------------------------------------- |
| `Artifact` tool alone publishes    | Manual run                               |
| Second run lists no files          | Second run                               |
| MCP names only in fallback places  | `git grep mcp__claude-artifacts`         |
| Neither tool set stops at step 1   | A `claude -p` run                        |
| Description and Rules              | Read `SKILL.md`                          |
| Report says the canvas copy is old | First run                                |
| `AGENTS.md` link resolves          | The anchor is in `design/CANVAS.md` (D2) |
| `npm run words` passes             | `npm run words`                          |
