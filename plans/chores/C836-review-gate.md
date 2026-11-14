# Plan: C836: Fail the code review check on findings and require it

- **Spec:** #836
- **Status:** approved

## Approach

The tech lead builds this by hand (hand-back rule). In `claude-code-review.yml`:

1. A step after the main's-copy check lists the PR's files. If all are under `plans/`, it sets `plans_only=true`. If the list fails, Claude runs.
2. With `plans_only`, the Claude steps and "Report a missing review" skip.
3. A last step runs only after Claude succeeds. It counts the bot's inline comments that are not replies and whose `original_commit_id` is the head SHA (`commit_id` moves). It adds `<n>` from the latest bot comment that starts `Open findings: <n>`. A sum above zero fails the job.

## Decisions

**D1 · The since-diff after a red run** · Decides: Tech lead

The since-diff step reads only runs with `--status success`. After a red run, the next push gets a whole-PR review on Opus.

- **A.** Also read failed runs that uploaded Claude's summary.
- **B.** Keep `--status success`.
- **Other:** your own.

**Answer: A** (@henetiriki)

**Reversal.** [M0.8](../M0.8-skip-review.md) skipped a plans-only review with `paths-ignore`. This plan removes that filter: a skipped required check stays pending.

## Files that change

| File                                         | New / changed | What                                      |
| -------------------------------------------- | ------------- | ----------------------------------------- |
| `.github/workflows/claude-code-review.yml`   | Changed       | Steps 1 to 3, no `paths-ignore`, comments |
| `.github/agent/review.md`                    | Changed       | The `Open findings: <n>` line             |
| `scripts/github/ruleset-main.json`           | Changed       | `Review`, 15368                           |
| `scripts/__tests__/review-gate.test.ts`      | New           | The three steps, over `gh` fixtures       |
| `scripts/__tests__/load-agent-files.test.ts` | Changed       | The new `if:` values                      |
| `docs/building.md`, `docs/repo-settings.md`  | Changed       | Step 4, the required-checks row           |
| `.github/workflows/README.md`                | Changed       | The diagram                               |

## Risks

- Text in a PR can make Claude write `Open findings: 0`. The inline count and the human review stay.
- If Claude omits the line, the step reads an earlier `<n>`. A fix filters by start time.

## Proof

| Acceptance check            | Proven by                  |
| --------------------------- | -------------------------- |
| The steps and skips         | The two tests above        |
| Test PRs, `check-github.sh` | The tech lead, after merge |
| `AGENTS.md` › Commands      | Their output               |

## Deviations

- `run-script.ts`, `review-workflow.ts` and `types.ts` in `scripts/__tests__/` are new. The two tests share them.
- Every review writes an `Open findings: <n>` line, which the issue does not name. It counts a finding with no line to hold it. The gate allows markdown around it.
- The since-diff step lists 100 runs, not `--status success`. A `failure` run counts only if its "Fail on open findings" step failed.
- Other `review.md` sentences are shorter, for its word budget.
