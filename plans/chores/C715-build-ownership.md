# Plan: C715: Build ownership and a local design agent

- **Spec:** #715
- **Status:** approved

## Approach

1. `plans/README.md`: add rule 17, `build-ownership`. A person waits while the PR has a "Building…" comment. The workflow posts it for a build and deletes it at the end.
2. `COMPONENTS.md`: before the board swap prompt, say where the design agent runs. In steps 2 to 4, name a local session in the branch's clone, one at a time. Link to the **Who** item in `CANVAS.md`.

## Decisions

**D1 · How the full file makes room** · Decides: Tech lead

`plans/README.md` (800) is at its budget. The rule adds about 60 words.

- **A.** Raise it to 900 in `word-count.mts`, with test cases.
- **B.** Cut text that another file holds.
- **Other:** your own.

**Answer: A** (@henetiriki)

**D2 · The start comment** · Decides: Tech lead

The safety net in `claude-run.yml` counts the bot's comments. A "Build started" comment would hide a build that crashes.

- **A.** Make the net skip that comment. This edits a workflow, against the issue's constraint.
- **B.** Drop the comment. The rule uses "Building…". This changes the first done check.
- **Other:** your own.

**Answer: B** (@henetiriki)

## Files that change

| File                                            | What               |
| ----------------------------------------------- | ------------------ |
| `plans/README.md`                               | Build ownership    |
| `design/COMPONENTS.md`                          | Local design agent |
| `scripts/__tests__/plan-rule-citations.test.ts` | `RULE_NAMES`       |
| `scripts/word-count.mts`                        | D1 A: budget       |
| `scripts/__tests__/word-count.test.ts`          | D1 A: budget cases |

## Order of work

1. Add `build-ownership` to `RULE_NAMES`. See the test fail.
2. Change the budget cases, see them fail, then change `word-count.mts`.
3. Edit the two docs.

## Risks

`plans/README.md` is a hand-back path: the tech lead builds.

A person who reads the PR before the workflow posts "Building…" sees no run. A fix adds a bullet that checks the Actions tab.

## Proof

| Done check                                     | Proven by               |
| ---------------------------------------------- | ----------------------- |
| Rule 17, `COMPONENTS.md` rule, `npm run words` | Review, `npm run words` |

## Out of scope

Labels, workflows, new scripts.

## Deviations

- `COMPONENTS.md` step 3 says the tech lead gives the OK on the install's file list, as the issue asks.
- D2 B drops the `build.md` change and its budget. D1 A raises only the `plans/README.md` budget.
