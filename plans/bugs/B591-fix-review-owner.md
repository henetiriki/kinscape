# Plan: B591: fix-review starts only for the owner

- **Spec:** #591
- **Status:** approved

## Approach

`claude-fix-review.yml`'s `run-name` and `fix` job `if:` gain `!contains(github.event.pull_request.labels.*.name, 'hand-back')` and `github.actor == github.repository_owner`, as `claude-plan.yml` has. A label from anyone else, or on a `hand-back` PR, shows "Skipped Fix review" and stays (C467 D3): remove it and add it again to start a run. The test flips its `hand-back` check and adds the owner check.

## Files that change

| File                                         | New / changed | What                                          |
| -------------------------------------------- | ------------- | --------------------------------------------- |
| `.github/workflows/claude-fix-review.yml`    | changed       | Two conditions; header and job comments       |
| `scripts/__tests__/load-agent-files.test.ts` | changed       | "the fix-review workflow": both checks        |
| `docs/building.md`                           | changed       | Step 4: who adds the label; what does nothing |

## Order of work

1. Test first (rule 12), workflow, doc.

## Proof

| Acceptance check                               | Proven by                                                                 |
| ---------------------------------------------- | ------------------------------------------------------------------------- |
| Run-name and `if:` carry both checks and match | Test                                                                      |
| A non-owner's label starts nothing             | After merge: the PO adds `fix-review` to a ready PR; the run is "Skipped" |
| The owner's label still runs                   | After merge: the tech lead adds it                                        |
