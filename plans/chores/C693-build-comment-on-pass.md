# Plan: C693: Make the build agent comment when its checks pass

- **Spec:** #693
- **Status:** approved

## Approach

In `build.md`, make the final comment one instruction for a pass and a fail. "Note the start time" also records `START_SHA`. When a run with a `ref` left no comment, the net reads that branch's head through `gh api`. A different head gets the new text. A plan run has no `ref`, so it keeps its PR lookup.

## Decisions

**D1 · Respond runs** · Decides: Tech lead

A respond run also loads `build.md`, so the new instruction reaches a respond build. Is that acceptable?

- **A.** Yes. The net stays off for a respond run, and a respond build then matches a build.
- **B.** No. Put the instruction in the `claude-build.yml` prompt.
- **Other:** your own.

**Answer: A** (@henetiriki)

## Files that change

| File                                         | New / changed | What                                               |
| -------------------------------------------- | ------------- | -------------------------------------------------- |
| `.github/agent/build.md`                     | changed       | One comment instruction for both cases             |
| `.github/workflows/claude-run.yml`           | changed       | Record `START_SHA`; the net checks the branch head |
| `scripts/__tests__/load-agent-files.test.ts` | changed       | Run the net script with a fake `gh`: four cases    |

## Order of work

1. Write the net tests and see them fail.
2. Change the workflow, then `build.md`.

## Risks

- A person's push during the run reads as the agent's. Likelihood: low. Cost: one wrong word.
- If `gh api` fails, the net keeps the current text.

## Proof

| Acceptance check                       | Proven by                                      |
| -------------------------------------- | ---------------------------------------------- |
| A passing build comments               | Test: `build.md` names a pass and a fail       |
| A pushed commit gets the new text      | Net test: new head, no comment                 |
| No commit keeps the text and the label | Net tests: same head; plan run swaps the label |
| Checks pass                            | `npm test`, `lint`, `format:check`, `words`    |

## Deviations

- The pushed-commit text gives the step outcome, so a failed build does not read as a finished one.
- The next passing build after the merge shows the comment itself.
