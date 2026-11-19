# Plan: C936: Remove the dead `mcp__claude-artifacts__*` path from publish-design-system

- **Spec:** #936
- **Status:** draft

## Approach

Make the edits of "What to change" in the two skill files. Step 3.1 names only the built-in `Artifact` tool and keeps its stop message. `tools.md` loses the MCP column, the MCP rules section and the intro sentence about the MCP tools. The heading "Rules for `publish` with the `Artifact` tool" stays, because `design/CANVAS.md` step 4.4 links to its anchor. Both files are hand-back paths in `.github/CODEOWNERS`, so the tech lead builds this plan.

## Decisions

**D1 · Table header in `tools.md`** · Decides: Tech lead

After the edit, the table has one call column, with the header "`Artifact` tool (default)". "(default)" tells a reader that a second path exists. #936 says "Change nothing else" in `tools.md`.

- **A.** Keep the header. The diff changes no other cell.
- **B.** Change the header to "`Artifact` tool". The diff changes one more cell, and the plan lists it under Deviations.
- **Other:** your own.

Recommended: B, because "(default)" points the reader to a fallback that the Chore removes. A keeps the diff to the listed edits, but it keeps that pointer.

## Files that change

| File                                            | New / changed | What                                              |
| ----------------------------------------------- | ------------- | ------------------------------------------------- |
| `.claude/skills/publish-design-system/SKILL.md` | Changed       | Step 3.1 names only the `Artifact` tool           |
| `.claude/skills/publish-design-system/tools.md` | Changed       | Intro sentence, MCP column, MCP rules section, D1 |

## Order of work

1. In `SKILL.md` step 3.1, write: "You need the built-in `Artifact` tool. If the session defers it, load it with ToolSearch. If the session has no `Artifact` tool (for example in a GitHub Action or a `claude -p` run), …". Keep the rest of the step.
2. In `tools.md`, delete "Otherwise use the six MCP tools in the last column." Delete the MCP column. Delete "Rules for the MCP tools". Apply D1.
3. Run the `git grep` of done check 1.
4. Run the checks in `AGENTS.md` › Commands.
5. Run `/publish-design-system` in an interactive session, and once in a `claude -p` run. Paste the step 3.1 result of each under Evidence.

## Risks

- A rename of the publish rules heading breaks the `design/CANVAS.md` link. `scripts/__tests__/doc-links.test.ts` fails on it.
- The interactive run can send files if the artifact is behind `main`. That run is the normal publish, so it does no harm.

## Proof

No unit test covers the two skill files.

| Done check                                           | Proven by                                          |
| ---------------------------------------------------- | -------------------------------------------------- |
| `git grep` of the MCP names in `.claude` prints none | `git grep` output under Evidence                   |
| No `Artifact` tool stops at 3.1, "artifacts are off" | `claude -p` run output under Evidence              |
| `Artifact` tool runs the skill as before             | Interactive run output under Evidence              |
| `npm run words` passes                               | Output under Evidence                              |
| Constraints: three files, three rules, `plans/`      | Review of the diff; `doc-links.test.ts` for anchor |

## Out of scope

`scripts/design-system-publish.mts`, `design/CANVAS.md`, `design/DESIGN.md` and the plans under `plans/`.
