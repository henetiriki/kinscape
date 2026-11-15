# Plan: C870: Retire the design agent role; a local session owns the canvas

- **Spec:** #870
- **Status:** approved

## Approach

Each file gets the edit and the text that _What to change_ gives. Steps 7 to 9 become one step 7, so the other two references to step 9 in `design/CANVAS.md` (_Where_ and 5.5) also become step 7. `design/DESIGN.md` line 3 reads: "The JPGs in this folder are the reference screens from the [design canvas](…)." The swap prompt in `design/COMPONENTS.md` starts: "Paste this prompt into a local session:". The plan edits hand-back paths, so the tech lead builds it.

## Decisions

**D1 · Where the design prompt rule goes** · Decides: Tech lead

The issue names no section for the rule. "Reading a board" is about a build, and the rule is about a drawing.

- **A.** Add a section "Drawing a board" after "Reading a board".
- **B.** Add the rule as the last paragraph of "Reading a board".
- **Other:** your own.

**Answer: A** (@henetiriki)

## Files that change

| File                                       | New / changed | What      |
| ------------------------------------------ | ------------- | --------- |
| `design/CANVAS.md`                         | Changed       | The issue |
| `design/COMPONENTS.md`                     | Changed       | The issue |
| `design/DESIGN.md`                         | Changed       | The issue |
| `docs/glossary.md`                         | Changed       | The issue |
| `AGENTS.md`                                | Changed       | The issue |
| `plans/README.md`                          | Changed       | The issue |
| `.claude/skills/refine/chore.md`           | Changed       | The issue |
| `plans/chores/C870-retire-design-agent.md` | New           | This plan |

## Order of work

1. The tech lead runs `/build-local <PR>` in a local session.
2. Edit the seven files. Then run `npm run format`.
3. If #862 is open, change "2 to 9" to "2 to 7" in its done check.
4. Run the checks in _Proof_.

## Risks

- `design/CANVAS.md` is near its budget of 900 words. If `npm run words` fails, the build shortens other text in the file and lists it under _Deviations_.
- No link points at `#handing-off-a-board`, so the rename breaks no link.
- The search for "2 to 9" finds #870 until the merge closes it.
- Two local sessions can swap boards for two branches at the same time. The refresh on one branch then copies the boards of the other. The issue deletes "Run one swap at a time". Likelihood: low, as no past incident shows it. A fix is one sentence in `design/COMPONENTS.md`. The tech lead chose not to build it.

## Proof

| Done check                                           | Proven by                                                           |
| ---------------------------------------------------- | ------------------------------------------------------------------- |
| "design agent" only in one avoid column              | The `grep -rin` line of the issue                                   |
| Steps 1 to 7; no old step reference outside `plans/` | `git grep` for the three phrases, outside `plans/`                  |
| No open issue says "2 to 9"                          | `gh issue list --state open --search '"2 to 9"'` finds #870         |
| `design/CANVAS.md` names the design prompt rule      | The diff                                                            |
| `COMPONENTS.md#board-swap-prompt` resolves           | `npm test` (`doc-links.test.ts`)                                    |
| Lint, format, words and tests pass                   | `npm run lint`, `npm run format:check`, `npm run words`, `npm test` |

## Deviations

- The design prompt rule in `design/CANVAS.md` has three short sentences, not one long one, to obey STE rule 2. The last one tells the reader to skip the chat lines.
- The build deletes "Don't use Export." with the Hand off menu step, because that sentence names the menu.
- `design/COMPONENTS.md` loses the whole paragraph, including "Run one swap at a time", as the issue says.
- "Reading a board" names the canvas link, and line 7 of `design/CANVAS.md` says the tech lead runs the workflow, so it agrees with step 7. The issue text has neither edit. Review findings in PR 871 asked for both.
- To fit the 900-word budget, "Who" in `design/CANVAS.md` says "a local session" and drops "Claude Code" and "that the tech lead starts".
