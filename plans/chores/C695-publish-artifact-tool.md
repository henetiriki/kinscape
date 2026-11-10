# Plan: C695: Make publish-design-system use the Artifact tool and run on the change's branch

- **Spec:** #695
- **Status:** approved

## Approach

Make the Chore's edits. Each `SKILL.md` step names its capability and links to `tools.md` for the call. The tech lead builds this hand-back.

## Decisions

**D1 · Proof of the publish check** · Decides: Tech lead

The first check needs a run that sends files. If the artifact matches the inputs, the run sends none.

- **A.** Accept a run that lists no files. The next Spec or Chore that changes an input proves the send and the report line.
- **B.** Keep this PR open until a branch that changes an input runs the skill.
- **Other:** your own.

**Answer: A** (@henetiriki)

## Files that change

| File                                            | New / changed | What                                        |
| ----------------------------------------------- | ------------- | ------------------------------------------- |
| `.claude/skills/publish-design-system/SKILL.md` | Changed       | Description, steps 1 and 3 to 11, two Rules |
| `.claude/skills/publish-design-system/tools.md` | New           | Call map, `publish` rules                   |
| `AGENTS.md`                                     | Changed       | One sentence with the link                  |

## Order of work

1. Check the create, icon upload and `publish` calls against the `Artifact` tool's description.
2. Write `tools.md`, then `SKILL.md`, then `AGENTS.md`.
3. Run `npm run words`, `npm test` and `npm run format:check`.
4. Run the skill twice in a signed-in session, then once in a `claude -p` run.

## Risks

`SKILL.md` has about 640 of 650 words. If the edits pass 650, move more call detail to `tools.md`.

## Proof

| Acceptance check                                | Proven by                             |
| ----------------------------------------------- | ------------------------------------- |
| Step 1 passes; files, checksums, index sent     | First signed-in run (D1)              |
| Second run lists no files                       | Second run                            |
| MCP names only in step 1 and fallback column    | `git grep mcp__claude-artifacts`      |
| Neither tool set stops with "artifacts are off" | `claude -p` run                       |
| Description, Rules                              | `git diff`                            |
| Report says the canvas copy is old              | First run's report (D1)               |
| `AGENTS.md` link resolves                       | `scripts/__tests__/doc-links.test.ts` |
| `npm run words` passes                          | Output in the PR                      |

## Deviations

`tools.md` adds two rules from the tool description.
